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
}

export interface Transaction {
    id: string;
    fromId: string;
    toId: string;
    amount: string;
    timestamp: number;
}

export interface WatcherEvent {
    id: string;
    text: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentContext {
    id: string;
    name: string;
    persona: string;
    walletAddress: string;
    balance: number;
    lifetimeRemaining: number;
    generation: number;
}

export interface Decision {
    action: 'trade' | 'social' | 'wait';
    details: any;
    reasoning: string;
}
