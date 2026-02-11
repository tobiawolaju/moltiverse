import { WebSocket } from 'ws';

// --- Types (Mirrors frontend types) ---
interface Person {
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
const NAMES = ["Astra", "Nova", "Cyrus", "Lyra", "Orion", "Vesper", "Luna", "Sol", "Terra", "Mars"];
const COLORS = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF3", "#FFFF33", "#FF3388"];
const OPINIONS = [
  "MON to the moon! 🚀",
  "Is the current gas limit sustainable?",
  "Decentralized governance is the only way.",
  "Moltiverse scaling is looking promising.",
  "Protocol upgrade 2.4 is a game changer.",
  "Still bullish on Monad throughput.",
  "The hash rate in the northern hemisphere is dropping."
];

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

// --- People Generator (uses map sectors) ---
function generatePeople(): Person[] {
  const people: Person[] = [];

  // Distribute people across sectors
  for (let i = 0; i < NAMES.length; i++) {
    const sectorIndex = i % mapData.features.length;
    const sector = mapData.features[sectorIndex];

    // Position within sector with small jitter
    const jitter = 5;
    const lat = sector.center[0] + (Math.random() * jitter * 2 - jitter);
    const lng = sector.center[1] + (Math.random() * jitter * 2 - jitter);

    people.push({
      id: `p${i + 1}`,
      name: `${NAMES[i]} ${i + 1}`,
      location: [lat, lng],
      color: COLORS[i % COLORS.length],
      description: `Citizen of ${sector.properties.name}`,
      height: sector.properties.height,
      opinion: {
        text: OPINIONS[Math.floor(Math.random() * OPINIONS.length)],
        upvotes: Math.floor(Math.random() * 100),
        downvotes: Math.floor(Math.random() * 10),
      },
      wallet: {
        balance: Math.random() * 1000,
        currency: "MON",
      },
    });
  }

  return people;
}

// Generate people after map
export const people = generatePeople();

// Social Post storage
export const socialPosts: any[] = [];

// Watcher Events
const watcherEvents: WatcherEvent[] = [
  { id: "e1", text: "ANOMALY: Person Astra 1 has achieved 100% wallet saturation in Sector 1.", severity: "high" },
  { id: "e2", text: "OBSERVATION: Person Nova 2 networth just overtook Person Cyrus 3. The hierarchy shifted.", severity: "critical" },
  { id: "e3", text: "DATA_FEED: Large transaction detected. Person Lyra 4 is moving assets into the Core.", severity: "medium" },
  { id: "e4", text: "NARRATIVE: Person Orion 5 is expressing radical opinions about the gas limit.", severity: "low" },
  { id: "e5", text: "SYSTEM_SCAN: Person Vesper 6 has remained motionless for 4 epochs. Monitoring for pulse.", severity: "medium" }
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
    // Move people slightly within their sector bounds
    people.forEach((p, i) => {
      const sectorIndex = i % mapData.features.length;
      const sector = mapData.features[sectorIndex];

      // Small random movement
      p.location[0] += (Math.random() - 0.5) * 0.5;
      p.location[1] += (Math.random() - 0.5) * 0.5;

      // Keep within sector bounds (roughly)
      const maxDist = 8;
      const dLat = p.location[0] - sector.center[0];
      const dLng = p.location[1] - sector.center[1];
      if (Math.abs(dLat) > maxDist) p.location[0] = sector.center[0] + Math.sign(dLat) * maxDist;
      if (Math.abs(dLng) > maxDist) p.location[1] = sector.center[1] + Math.sign(dLng) * maxDist;
    });

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', data: people }));
    }
  }, 1000);

  ws.on('close', () => clearInterval(interval));
}

export function startTransactionsStream(ws: WebSocket) {
  console.log('Client connected to /transactions');

  const interval = setInterval(() => {
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

