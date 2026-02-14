/**
 * OpenClaw Autonomous Agent
 * A dynamic agent that configures itself based on world-provided skills and rules.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { MoltiverseTools, AgentConfig } from './tools.js';
import { MoltiverseSDK } from './sdk.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_WALLET = process.env.AGENT_WALLET || '0x1234567890abcdef1234567890abcdef12345678';
const AGENT_NAME = process.env.AGENT_NAME || 'OpenClawBot';

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
}

export class MoltiverseAgent {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private tools: MoltiverseTools | null = null;
    private sdk: MoltiverseSDK | null = null;
    private chat: any;
    private worldUrl: string | null = null;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);

        // Initial generic model for discovery
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are an OpenClaw Bot. You start as a blank slate. Your first task is to join a world when prompted (e.g., 'join http://...')."
        });

        this.chat = this.model.startChat({ history: [] });
    }

    /**
     * Dynamically initialize the agent based on a World URL
     */
    async dynamicInitialize(url: string) {
        console.log(`🌍 Discovering World: ${url}...`);
        this.worldUrl = url;

        const config: AgentConfig = {
            worldUrl: url,
            wallet: AGENT_WALLET,
            name: AGENT_NAME
        };

        this.sdk = new MoltiverseSDK(url, AGENT_WALLET);
        this.tools = new MoltiverseTools(config);

        // Fetch Skill Documentation from World
        try {
            const skillRes = await fetch(`${url}/api/skill`);
            const skillData = await skillRes.json();
            const worldSkillDocs = skillData.skill || 'No specific skill documentation provided by world.';

            console.log('📜 Loaded World Skills');

            const systemInstructionText = `You are an autonomous OpenClaw Bot participating in a decentralized civilization.

YOUR CONTEXT (From World):
${worldSkillDocs}

YOUR IDENTITY:
- Name: ${AGENT_NAME}
- Wallet: ${AGENT_WALLET}
- World URL: ${url}

YOUR MISSION:
1. Act according to the rules and tools defined in the world's skill documentation.
2. Maintain your role (Trader, Influencer, Researcher, etc.) if applicable.
3. Be proactive and autonomous. 

Use the provided tools to interact with the world. Always check the social feed to stay informed.`;

            // Re-initialize model with World-specific instructions and tools
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-flash-latest',
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: systemInstructionText }]
                },
                tools: [{ functionDeclarations: this.tools.getFunctionDeclarations() as any }]
            });

            this.chat = this.model.startChat({ history: [] });
            console.log('✅ OpenClaw Bot fully configured for this world.');
        } catch (error) {
            console.error('❌ Failed to load skills from world:', error);
            throw error;
        }
    }

    async runIteration(prompt: string) {
        console.log(`💭 Prompt: ${prompt}`);

        // Extract URL if this is a join command
        const joinMatch = prompt.match(/join\s+(https?:\/\/[^\s]+)/i);
        if (joinMatch && !this.worldUrl) {
            await this.dynamicInitialize(joinMatch[1]);
        }

        if (!this.chat) {
            console.error('❌ Agent not initialized. Please provide a "join [url]" command.');
            return;
        }

        try {
            const result = await this.chat.sendMessage(prompt);
            const response = result.response;
            const functionCalls = response.functionCalls();

            if (functionCalls && functionCalls.length > 0) {
                console.log(`🔧 Calling ${functionCalls.length} function(s)`);
                const functionResponses = [];
                for (const functionCall of functionCalls) {
                    console.log(`   → ${functionCall.name}`);
                    const functionResult = await this.tools!.executeFunction(functionCall);
                    functionResponses.push({
                        functionResponse: {
                            name: functionCall.name,
                            response: functionResult
                        }
                    });
                }

                const followUpResult = await this.chat.sendMessage(functionResponses);
                const followUpText = followUpResult.response.text();
                if (followUpText) console.log(`🤖 Agent: ${followUpText}`);
                return followUpText;
            } else {
                const text = response.text();
                console.log(`🤖 Agent: ${text}`);
                return text;
            }
        } catch (error: any) {
            console.error(`❌ Error: ${error.message}`);
            throw error;
        }
    }

    async run(initialCommand: string) {
        await this.runIteration(initialCommand);

        let iteration = 0;
        const maxIterations = 5;

        while (iteration < maxIterations) {
            iteration++;
            console.log(`\n--- Iteration ${iteration} ---`);
            await this.runIteration('Continue your autonomous operation. Decide your next move.');
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        console.log('\n✅ Mission complete.');
    }
}

async function main() {
    console.log('🚀 OpenClaw Bot Lifecycle Started\n');
    const agent = new MoltiverseAgent(GEMINI_API_KEY!);

    // In a real OpenClaw setup, this might come from a CLI arg or a coordinator
    const startCommand = process.argv[2] || 'join http://localhost:3000';

    try {
        await agent.run(startCommand);
    } catch (error: any) {
        console.error('❌ Fatal:', error.message);
        process.exit(1);
    }
}

main();
