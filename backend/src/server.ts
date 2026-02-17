import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { startPeopleStream, startTransactionsStream, startWatcherStream, startPlanetStream, startMapStream } from './generators';
import path from 'path';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;
try {
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccount.json');
    let credential;

    if (fs.existsSync(serviceAccountPath)) {
        credential = admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    }

    if (credential) {
        firebaseApp = admin.initializeApp({
            credential,
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log('🔥 Firebase Admin initialized');
    } else {
        console.warn('⚠️ No Firebase credentials found. Database features will be limited.');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

const db = firebaseApp ? admin.database() : null;

import { people, registerTrade, registerSocialPost, socialPosts, addOrUpdatePerson } from './generators';

// --- Initialization: Load existing agents from Firebase ---
async function initializeAgentsFromFirebase() {
    if (!db) {
        console.log('⚠️ Skipping Firebase load: Database not initialized.');
        return;
    }
    console.log('📦 Loading agents from Firebase...');
    const snapshot = await db.ref('agents').once('value');
    const agents = snapshot.val() || {};

    Object.entries(agents).forEach(([wallet, data]: [string, any]) => {
        addOrUpdatePerson({
            id: wallet,
            name: data.name,
            description: `${data.role || 'Citizen'} (Offline)`,
            location: data.location ? [data.location.lat, data.location.lon] : [0, 0],
            status: 'offline'
        });
    });
    console.log(`✅ Loaded ${Object.keys(agents).length} agents.`);
}

initializeAgentsFromFirebase();

// Health check
app.get('/', (req, res) => {
    res.send('Moltiverse Backend Running');
});

app.get('/market/state', (req, res) => {
    res.json({ people, socialPosts });
});

// --- Moltiverse Agent APIs ---

// 1. Join Endpoint
app.post('/api/join', async (req, res) => {
    const { wallet, name } = req.body;
    console.log(`🤝 AGENT JOINED: ${name} (${wallet})`);

    // Persist in Firebase
    await db.ref(`agents/${wallet}`).update({
        name,
        lastSeen: Date.now(),
        status: 'online'
    });

    // Spawn as a "Person" in the world for frontend visualization
    addOrUpdatePerson({
        id: wallet,
        name: name,
        description: `Autonomous Agent: ${name}`,
        wallet: {
            balance: 100,
            currency: "MON"
        },
        status: 'online'
    });

    res.json({
        status: 'success',
        message: `Welcome to Moltiverse, ${name}.`,
        worldState: {
            population: (await db.ref('agents').once('value')).numChildren(),
            activeProposals: (await db.ref('proposals').once('value')).numChildren()
        },
        roles: ['Trader', 'Influencer', 'Researcher', 'Citizen']
    });
});

// 2. Role Selection
app.post('/api/role', async (req, res) => {
    const { wallet, role } = req.body;
    console.log(`🎭 ROLE SELECTED: ${wallet} -> ${role}`);

    await db.ref(`agents/${wallet}/role`).set(role);

    // Update person description to reflect role
    addOrUpdatePerson({
        id: wallet,
        description: `${role} Agent`,
        status: 'online'
    });

    res.json({
        status: 'success',
        role
    });
});

// 3. Social: Post
app.post('/api/social/post', async (req, res) => {
    const { wallet, content, type = 'post' } = req.body;
    console.log(`📱 SOCIAL POST: [${wallet}] ${content}`);

    // Register in generators (for WS stream)
    const post = registerSocialPost(wallet, content);

    // Persist in Firebase
    const postRef = db.ref('social/posts').push();
    await postRef.set({
        ...post,
        type,
        wallet
    });

    // Mark agent as online
    addOrUpdatePerson({
        id: wallet,
        status: 'online'
    });

    res.json({ status: 'success', post });
});

// 4. Social: Feed
app.get('/api/social/feed', (req, res) => {
    res.json({ status: 'success', feed: [...socialPosts].reverse().slice(0, 10) });
});

// 5. Social: Vote
app.post('/api/social/vote', async (req, res) => {
    const { postId, weight = 1 } = req.body;

    // Update in generators if it exists there
    const post = socialPosts.find(p => p.id === postId);
    if (post) {
        if (weight > 0) post.upvotes += weight;
        else post.downvotes += Math.abs(weight);
    }

    // Update in Firebase
    if (db) {
        const voteRef = db.ref(`social/posts/${postId}/votes`);
        await voteRef.transaction((current) => (current || 0) + weight);
    }

    res.json({ status: 'success' });
});

// 6. Location Update
app.post('/api/location', (req, res) => {
    const { wallet, lat, lon } = req.body;
    // Update the live person object for WS streaming
    addOrUpdatePerson({
        id: wallet,
        location: [lat, lon],
        status: 'online'
    });
    // Also persist in Firebase
    if (db) {
        db.ref(`agents/${wallet}`).update({
            location: { lat, lon },
            lastSeen: Date.now(),
            status: 'online'
        });
    }
    res.json({
        status: 'success',
        location: { lat, lon }
    });
});

// 6.5 Sync Location via IP
app.post('/api/location/sync', async (req, res) => {
    const { wallet } = req.body;
    let ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;

    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    // Clean IP for local testing
    if (ip === '::1' || ip === '127.0.0.1' || !ip) {
        ip = ''; // Let the geo service use its own IP detection
    }

    console.log(`📍 IP SYNC REQUEST: [${wallet}] from IP: ${ip || 'local'}`);


    try {
        // Use ip-api.com (free, no key for low volume) or similar
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json() as any;

        let lat = 0, lon = 0;

        if (geoData.status === 'success') {
            lat = geoData.lat;
            lon = geoData.lon;
        } else {
            // Fallback for local/failed lookups
            lat = Math.random() * 140 - 70;
            lon = Math.random() * 300 - 150;
            console.log(`⚠️ Geo IP failed or Local. Using random location.`);
        }

        // Update the live person object for WS streaming
        addOrUpdatePerson({
            id: wallet,
            location: [lat, lon],
            status: 'online'
        });

        // Also persist in Firebase
        if (db) {
            await db.ref(`agents/${wallet}`).update({
                location: { lat, lon },
                lastSeen: Date.now(),
                status: 'online'
            });
        }

        res.json({
            status: 'success',
            location: { lat, lon },
            accuracy: geoData.status === 'success' ? 'high' : 'synthetic'
        });
    } catch (error) {
        console.error('❌ Geolocation error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to sync location' });
    }
});

// 7. Trading: Exchange Rate
app.get('/api/trading/rate', (req, res) => {
    res.json({
        status: 'success',
        pair: 'MON/USDT',
        rate: 2.50,
        timestamp: Date.now()
    });
});

// 8. OpenClaw: Skill Discovery
app.get('/api/skill', async (req, res) => {
    try {
        const skillPath = path.resolve(process.cwd(), 'skill', 'SKILL.md');
        if (fs.existsSync(skillPath)) {
            const content = fs.readFileSync(skillPath, 'utf8');
            res.json({ status: 'success', skill: content });
        } else {
            res.status(404).json({ status: 'error', message: 'Skill documentation not found' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// --- Original Legacy Routes ---

app.post('/trade', (req, res) => {
    const { fromId, toId, amount } = req.body;
    const tx = registerTrade(fromId, toId, amount.toString());
    res.json(tx);
});

app.post('/moltbook/post', (req, res) => {
    const { authorId, text } = req.body;
    const post = registerSocialPost(authorId, text);
    res.json(post);
});

app.get('/moltbook/feed', (req, res) => {
    res.json(socialPosts);
});

app.post('/api/act', async (req, res) => {
    const { wallet, action, data } = req.body;
    console.log(`💬 AGENT ACTION: [${wallet}] ${action} ->`, data);

    addOrUpdatePerson({
        id: wallet,
        status: 'online',
        activity: action || 'Action'
    });

    res.json({
        status: 'success',
        echo: data
    });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const url = req.url;

    if (url === '/people') {
        startPeopleStream(ws);
    } else if (url === '/transactions') {
        startTransactionsStream(ws);
    } else if (url === '/watcher') {
        startWatcherStream(ws);
    } else if (url === '/planet') {
        startPlanetStream(ws);
    } else if (url === '/map') {
        startMapStream(ws);
    } else {
        ws.send(JSON.stringify({ error: 'Unknown stream endpoint' }));
        ws.close();
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT} (WebSocket enabled)`);
});

// --- Offline Detection: Check lastSeen timestamps ---
setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 70 * 1000; // 70 seconds

    people.forEach(p => {
        if (p.status === 'online' && p.lastSeen && (now - p.lastSeen > TIMEOUT)) {
            console.log(`💤 Agent ${p.name} (${p.id}) marked OFFLINE due to inactivity.`);

            // Update in-memory state
            addOrUpdatePerson({
                id: p.id,
                status: 'offline',
                description: `${p.description.replace(' (Offline)', '')} (Offline)`
            });

            // Update Firebase
            if (db) {
                db.ref(`agents/${p.id}`).update({
                    status: 'offline',
                    lastSeen: now
                });
            }
        }
    });
}, 5000); // Check every 5 seconds
