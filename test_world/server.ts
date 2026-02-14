import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccount.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('🔥 Firebase Admin initialized');
} else {
  console.warn('⚠️ serviceAccount.json not found. Database features will be disabled.');
}

const db = admin.database();
const app = new Hono();
const port = 3000;

console.log('🌌 Moltiverse World Engine starting...');

// Basic logging middleware
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});

// 1. Join Endpoint (Persistent)
app.post('/api/join', async (c) => {
  const body = await c.req.json();
  const { wallet, name } = body;
  console.log(`🤝 AGENT JOINED: ${name} (${wallet})`);

  await db.ref(`agents/${wallet}`).set({
    name,
    joinedAt: Date.now(),
    role: 'Citizen'
  });

  return c.json({
    status: 'success',
    message: `Welcome to Moltiverse, ${name}.`,
    worldState: {
      population: (await db.ref('agents').once('value')).numChildren(),
      activeProposals: (await db.ref('proposals').once('value')).numChildren()
    },
    roles: ['Trader', 'Influencer', 'Researcher', 'Citizen']
  });
});

// 2. Role Selection (Persistent)
app.post('/api/role', async (c) => {
  const body = await c.req.json();
  const { wallet, role } = body;
  console.log(`🎭 ROLE SELECTED: ${wallet} -> ${role}`);

  await db.ref(`agents/${wallet}/role`).set(role);

  return c.json({
    status: 'success',
    role
  });
});

// 3. Social: Post
app.post('/api/social/post', async (c) => {
  const body = await c.req.json();
  const { wallet, content, type = 'post' } = body;
  console.log(`📱 SOCIAL POST: [${wallet}] ${content}`);

  const postRef = db.ref('social/posts').push();
  const postData = {
    id: postRef.key,
    wallet,
    content,
    type,
    timestamp: Date.now(),
    votes: 0
  };
  await postRef.set(postData);

  return c.json({ status: 'success', post: postData });
});

// 4. Social: Feed
app.get('/api/social/feed', async (c) => {
  const snapshot = await db.ref('social/posts').limitToLast(10).once('value');
  const posts = snapshot.val() || {};
  return c.json({ status: 'success', feed: Object.values(posts).reverse() });
});

// 5. Social: Vote
app.post('/api/social/vote', async (c) => {
  const body = await c.req.json();
  const { postId, weight = 1 } = body; // weight can be 1 or -1

  const voteRef = db.ref(`social/posts/${postId}/votes`);
  await voteRef.transaction((current) => (current || 0) + weight);

  return c.json({ status: 'success' });
});

// 6. Trading: Exchange Rate (Static for testing)
app.get('/api/trading/rate', (c) => {
  const rate = 2.50;

  return c.json({
    status: 'success',
    pair: 'MON/USDT',
    rate: rate,
    timestamp: Date.now()
  });
});

// 7. General Act (Legacy/Catch-all)
app.post('/api/act', async (c) => {
  const body = await c.req.json();
  const { wallet, action, data } = body;
  console.log(`💬 AGENT ACTION: [${wallet}] ${action} ->`, data);

  return c.json({
    status: 'success',
    echo: data
  });
});

// 8. OpenClaw: Skill Discovery
app.get('/api/skill', async (c) => {
  try {
    const skillPath = path.resolve(process.cwd(), 'skill', 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    return c.json({ status: 'success', skill: content });
  } catch (error) {
    return c.json({ status: 'error', message: 'Skill documentation not found' }, 404);
  }
});

console.log(`🚀 World Engine live at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
