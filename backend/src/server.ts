import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { startPeopleStream, startTransactionsStream, startWatcherStream, startPlanetStream, startMapStream } from './generators';
import path from 'path';

const app = express();
app.use(cors());

// Health check
app.get('/', (req, res) => {
    res.send('Moltiverse Backend Running');
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
        // Echo or error?
        ws.send(JSON.stringify({ error: 'Unknown stream endpoint' }));
        ws.close();
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT} (WebSocket enabled)`);
});
