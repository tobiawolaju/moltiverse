import { WebSocket } from 'ws';
import { Brain } from './Brain';
import { WalletTool } from '../Tools/Wallet';
import { MemoryTool } from '../Tools/Memory';
import { MarketTool } from '../Tools/Market';
import { SocialTool } from '../Tools/Social';
import { AgentContext, Person, Transaction, WatcherEvent } from '../types';
import fs from 'fs';
import path from 'path';

export class AgentCore {
    private brain: Brain;
    private wallet: WalletTool;
    private memory: MemoryTool;
    private market: MarketTool;
    private social: SocialTool;

    private context: AgentContext;
    private worldState: { people: Person[]; transactions: Transaction[]; events: WatcherEvent[] } = {
        people: [],
        transactions: [],
        events: []
    };

    private agentFolderPath: string;
    private isRunning: boolean = false;

    constructor(agentFolderPath: string, apiUrl: string, wsUrl: string) {
        this.agentFolderPath = agentFolderPath;
        this.brain = new Brain();
        this.wallet = new WalletTool(agentFolderPath);
        this.memory = new MemoryTool(agentFolderPath);
        this.market = new MarketTool(apiUrl);
        this.social = new SocialTool(apiUrl);

        // Load initial context from personaer.txt
        const persona = fs.readFileSync(path.join(agentFolderPath, 'personaer.txt'), 'utf8');
        const id = fs.readFileSync(path.join(agentFolderPath, 'shrimpid.txt'), 'utf8').trim();

        this.context = {
            id,
            name: "Salmonad",
            persona,
            walletAddress: "",
            balance: 100,
            lifetimeRemaining: 100,
            generation: this.memory.getData().generation
        };
    }

    public async start(): Promise<void> {
        await this.wallet.init();
        this.context.walletAddress = this.wallet.getAddress();
        this.isRunning = true;

        console.log(`[CORE] Agent ${this.context.id} started. Wallet: ${this.context.walletAddress}`);

        this.connectToWorld();
        this.runLoop();
    }

    private connectToWorld(): void {
        const wsUrl = process.env.WS_BACKEND_URL || 'ws://localhost:8080';

        const peopleWs = new WebSocket(`${wsUrl}/people`);
        peopleWs.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'initial' || msg.type === 'update') this.worldState.people = msg.data;
        });

        const txWs = new WebSocket(`${wsUrl}/transactions`);
        txWs.on('message', (data) => {
            const tx = JSON.parse(data.toString());
            this.worldState.transactions = [tx, ...this.worldState.transactions].slice(0, 20);
        });

        const watcherWs = new WebSocket(`${wsUrl}/watcher`);
        watcherWs.on('message', (data) => {
            const event = JSON.parse(data.toString());
            this.worldState.events = [event, ...this.worldState.events].slice(0, 10);
        });
    }

    private async runLoop(): Promise<void> {
        while (this.isRunning) {
            console.log(`[CORE] Thinking... (Lifetime: ${this.context.lifetimeRemaining})`);

            const decision = await this.brain.decide(this.context, this.worldState, this.memory.getData());
            console.log(`[CORE] Decision: ${decision.action} - ${decision.reasoning}`);

            await this.executeDecision(decision);

            // Age the agent
            this.context.lifetimeRemaining--;
            if (this.context.lifetimeRemaining <= 0) {
                await this.handleDeath();
            }

            // Wait between decision epochs (e.g., 30 seconds)
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }

    private async executeDecision(decision: any): Promise<void> {
        const { action, details } = decision;

        try {
            if (action === 'trade') {
                const tx = await this.market.trade(this.context.id, details.toId, details.amount);
                this.memory.addTrade(tx);
                // Update local balance simulation if needed
                this.context.balance -= details.amount;
            } else if (action === 'social') {
                const post = await this.social.post(this.context.id, details.text);
                this.memory.addConversation(post);
            }
        } catch (e) {
            console.error("[CORE] Execution Error", e);
        }
    }

    private async handleDeath(): Promise<void> {
        console.log("[CORE] Agent lifetime expired. Initiating inheritance...");
        this.isRunning = false;

        // Logic for next generation
        this.memory.incrementGeneration();
        console.log(`[CORE] Next generation ${this.memory.getData().generation} ready to spawn.`);

        // In a real implementation, this might trigger a CLI prompt or a specific state file update
        fs.writeFileSync(path.join(this.agentFolderPath, 'death.flag'), 'Generation Complete', 'utf8');
    }
}
