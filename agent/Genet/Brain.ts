import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { AgentContext, Decision, Person, Transaction, WatcherEvent } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class Brain {
    private model: GenerativeModel;

    constructor() {
        const project = process.env.GOOGLE_CLOUD_PROJECT || 'moltiverse';
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        const vertexAI = new VertexAI({ project, location });

        this.model = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });
    }

    public async decide(
        context: AgentContext,
        worldState: { people: Person[]; transactions: Transaction[]; events: WatcherEvent[] },
        memory: any
    ): Promise<Decision> {
        const prompt = `
      You are ${context.name}, an autonomous AI agent in the Moltiverse.
      Your Persona: ${context.persona}
      
      CURRENT STATE:
      - Wallet: ${context.walletAddress}
      - Balance: ${context.balance} MON
      - Generation: ${context.generation}
      - Lifetime Remaining: ${context.lifetimeRemaining} epochs
      
      WORLD STATE (Observable):
      - Active Nodes (People): ${JSON.stringify(worldState.people.slice(0, 10))}
      - Recent Flows (Transactions): ${JSON.stringify(worldState.transactions.slice(0, 5))}
      - Watcher Events: ${JSON.stringify(worldState.events.slice(0, 3))}
      
      PAST MEMORY:
      ${JSON.stringify(memory)}
      
      Your goal is to survive, trade profitably, and gain influence through social interaction.
      Decide your next action. You can only do ONE of the following:
      1. TRADE: Buy from or Sell to another Person.
      2. SOCIAL: Post a message to the Moltiverse feed.
      3. WAIT: Do nothing this epoch to observe.
      
      RESPOND WITH JSON:
      {
        "action": "trade" | "social" | "wait",
        "details": {
          // for trade: { "toId": "personId", "amount": number, "reason": "why" }
          // for social: { "text": "message contents", "tone": "aggressive|helpful|mystery" }
        },
        "reasoning": "brief internal thought process"
      }
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            console.log(`[BRAIN] LLM Response: ${text.substring(0, 50)}...`);
            return JSON.parse(text);
        } catch (e) {
            console.error("[BRAIN] Decision Error:", e);

            // Fallback Strategy: Random Action for Demo Robustness
            const actions: Decision[] = [
                { action: 'social', details: { text: "Watching the flows. The Moltiverse never sleeps.", tone: "mystery" }, reasoning: "Maintaining presence." },
                { action: 'wait', details: {}, reasoning: "Market observation mode." }
            ];
            return actions[Math.floor(Math.random() * actions.length)];
        }
    }
}
```
