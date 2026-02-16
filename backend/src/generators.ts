import { WebSocket } from 'ws';

// --- Types (Mirrors frontend types) ---
export interface Person {
  id: string;
  name: string;
  location: [number, number];
  color: string;
  description: string;
  height?: number;
  opinion: {
    text: string;
    upvotes: number;
    downvotes: number;
  };
  wallet: {
    balance: number;
    currency: string;
  };
  status?: 'online' | 'offline';
  activity?: string;
  lastSeen?: number;
}

interface Transaction {
  id: string;
  fromId: string;
  toId: string;
  amount: string;
  timestamp: number;
}

interface WatcherEvent {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface MapFeature {
  type: string;
  properties: {
    name: string;
    height: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  center: [number, number]; // Added for convenience
}

interface MapData {
  type: string;
  features: MapFeature[];
}

// --- Constants ---
const OPINIONS = [
  "MON to the moon! 🚀",
  "Is the current gas limit sustainable?",
  "Decentralized governance is the only way.",
  "Moltiverse scaling is looking promising.",
  "Protocol upgrade 2.4 is a game changer.",
  "Still bullish on Monad throughput.",
  "The hash rate in the northern hemisphere is dropping."
];
const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF3", "#FFFF33", "#FF3388"];

// --- Map GeoJSON Generator (runs first) ---
function generateMapData(): MapData {
  const features: MapFeature[] = [];
  for (let i = 0; i < 15; i++) {
    const centerLat = Math.random() * 140 - 70;
    const centerLng = Math.random() * 300 - 150;
    const size = Math.random() * 20 + 10;

    const points: number[][] = [];
    const segments = 5;
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      points.push([
        centerLng + Math.cos(angle) * size,
        centerLat + Math.sin(angle) * size
      ]);
    }
    points.push(points[0]);

    features.push({
      type: 'Feature',
      properties: {
        name: `Sector ${i + 1}`,
        height: Math.random() * 0.8 + 0.1,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [points],
      },
      center: [centerLat, centerLng], // Store center for people placement
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

// Generate map once at startup
const mapData = generateMapData();

// Generate people after map
export const people: Person[] = [];
// Removed generatePeople function and dummy NAMES/COLORS constants

// Social Post storage
export const socialPosts: any[] = [];

// Watcher Events
const watcherEvents: WatcherEvent[] = [
  { id: "e1", text: "ANOMALY: High wallet saturation detected in Sector 1.", severity: "high" },
  { id: "e2", text: "OBSERVATION: Hierarchy shift detected. Wealth concentration is fluctuating.", severity: "critical" },
  { id: "e3", text: "DATA_FEED: Large transaction detected. Assets moving into the Core.", severity: "medium" },
  { id: "e4", text: "NARRATIVE: Radical opinions detected regarding the gas limit.", severity: "low" },
  { id: "e5", text: "SYSTEM_SCAN: Inactivity detected in several nodes. Monitoring for pulse.", severity: "medium" }
];

// --- Planet Config ---
const planetData = {
  baseColor: "#200052",
  atmosphereColor: "#836EF9",
  highlightColor: "#836EF9",
  clouds: {
    color: "#000000",
    opacity: 1.0,
    rotationSpeed: 1.0,
    density: 0.0
  },
  seas: [],
  radius: 5
};

// --- Streaming Logic ---

export function startPeopleStream(ws: WebSocket) {
  console.log('Client connected to /people');
  ws.send(JSON.stringify({ type: 'initial', data: people }));

  const interval = setInterval(() => {
    // Note: Automatic jitter movement removed. Agents roam themselves.
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', data: people }));
    }
  }, 1000);

  ws.on('close', () => clearInterval(interval));
}

export function startTransactionsStream(ws: WebSocket) {
  console.log('Client connected to /transactions');

  const interval = setInterval(() => {
    if (people.length < 2) return;

    const fromIdx = Math.floor(Math.random() * people.length);
    let toIdx = Math.floor(Math.random() * people.length);
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * people.length);

    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      fromId: people[fromIdx].id,
      toId: people[toIdx].id,
      amount: (Math.random() * 5).toFixed(4),
      timestamp: Date.now()
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(tx));
    }
  }, 2000);

  ws.on('close', () => clearInterval(interval));
}

let watcherIndex = 0;
export function startWatcherStream(ws: WebSocket) {
  console.log('Client connected to /watcher');

  const sendEvent = () => {
    const event = watcherEvents[watcherIndex];
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
      watcherIndex = (watcherIndex + 1) % watcherEvents.length;
    }
  };

  sendEvent();
  const interval = setInterval(sendEvent, 10000);
  ws.on('close', () => clearInterval(interval));
}

export function startPlanetStream(ws: WebSocket) {
  console.log('Client connected to /planet');
  ws.send(JSON.stringify(planetData));
}

export function startMapStream(ws: WebSocket) {
  console.log('Client connected to /map');
  ws.send(JSON.stringify(mapData));
}

export function registerTrade(fromId: string, toId: string, amount: string): Transaction {
  const tx: Transaction = {
    id: `tx_ext_${Date.now()}`,
    fromId,
    toId,
    amount,
    timestamp: Date.now()
  };

  // Update balances if possible
  const from = people.find(p => p.id === fromId);
  const to = people.find(p => p.id === toId);
  if (from) from.wallet.balance -= parseFloat(amount);
  if (to) to.wallet.balance += parseFloat(amount);

  return tx;
}

export function registerSocialPost(authorId: string, text: string): any {
  const post = {
    id: `post_${Date.now()}`,
    authorId,
    text,
    timestamp: Date.now(),
    upvotes: 0,
    downvotes: 0
  };
  socialPosts.push(post);
  return post;
}

export function addOrUpdatePerson(personData: Partial<Person> & { id: string }) {
  const existingIndex = people.findIndex(p => p.id === personData.id);

  if (existingIndex >= 0) {
    // Update existing
    people[existingIndex] = {
      ...people[existingIndex],
      ...personData,
      lastSeen: Date.now()
    };
    return people[existingIndex];
  } else {
    // Add new (as a full person)
    const newPerson: Person = {
      id: personData.id,
      name: personData.name || "Unknown Agent",
      location: personData.location || [0, 0],
      color: personData.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      description: personData.description || "Synthesized Agent Node",
      height: personData.height || 0.5,
      opinion: personData.opinion || {
        text: "Connected to Moltiverse Matrix.",
        upvotes: 0,
        downvotes: 0
      },
      wallet: personData.wallet || {
        balance: 100,
        currency: "MON"
      },
      status: personData.status || 'online',
      lastSeen: Date.now()
    };
    people.push(newPerson);
    return newPerson;
  }
}

