import fs from 'fs';
import path from 'path';

export interface MemoryData {
    trades: any[];
    conversations: any[];
    learnedStrategies: string[];
    generation: number;
    accumulatedExperience: number;
}

export class MemoryTool {
    private memoryPath: string;
    private data: MemoryData;

    constructor(agentFolderPath: string) {
        this.memoryPath = path.join(agentFolderPath, 'memory.json');
        this.data = this.load();
    }

    private load(): MemoryData {
        if (fs.existsSync(this.memoryPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
            } catch (e) {
                console.error("Failed to parse memory, starting fresh", e);
            }
        }
        return {
            trades: [],
            conversations: [],
            learnedStrategies: [],
            generation: 1,
            accumulatedExperience: 0
        };
    }

    public save(): void {
        fs.writeFileSync(this.memoryPath, JSON.stringify(this.data, null, 2), 'utf8');
    }

    public addTrade(trade: any): void {
        this.data.trades.push(trade);
        this.save();
    }

    public addConversation(chat: any): void {
        this.data.conversations.push(chat);
        this.save();
    }

    public recordStrategy(strategy: string): void {
        if (!this.data.learnedStrategies.includes(strategy)) {
            this.data.learnedStrategies.push(strategy);
            this.save();
        }
    }

    public incrementGeneration(): void {
        this.data.generation++;
        this.save();
    }

    public getData(): MemoryData {
        return this.data;
    }
}
