
export interface Person {
  id: string;
  name: string;
  location: [number, number]; // [lat, lng]
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

export interface Transaction {
  id: string;
  fromId: string;
  toId: string;
  amount: string;
  timestamp: number;
}

export interface MapData {
  type: string;
  features: Feature[];
}

export interface Feature {
  type: string;
  properties: {
    name: string;
    height: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface SeaConfig {
  id: string;
  name: string;
  location: [number, number];
  size: number;
  color: string;
}

export interface PlanetConfig {
  baseColor: string;
  atmosphereColor: string;
  clouds: {
    color: string;
    opacity: number;
    rotationSpeed: number;
    density: number;
  };
  seas: SeaConfig[];
}
