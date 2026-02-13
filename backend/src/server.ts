import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { startPeopleStream, startTransactionsStream, startWatcherStream, startPlanetStream, startMapStream } from './generators';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

import { people, registerTrade, registerSocialPost, socialPosts } from './generators';

// Health check
app.get('/', (req, res) => {
    res.send('Moltiverse Backend Running');
});

app.get('/market/state', (req, res) => {
    res.json({ people, socialPosts });
});

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















//expose tools as an api

//REST API

//WebSocket

//Registration endpoint

//World state endpoint

// Event feed

// Proposal endpoint

// Token stats endpoint












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
        // Echo or error?
        ws.send(JSON.stringify({ error: 'Unknown stream endpoint' }));
        ws.close();
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT} (WebSocket enabled)`);
});
