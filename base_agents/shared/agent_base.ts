/**
 * Base Class for Moltiverse Agents
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { MoltiverseTools, AgentConfig } from './tools.js';
import { MoltiverseSDK } from './sdk.js';
import { StateManager } from './state_manager.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export abstract class BaseAgent<T> {
    protected genAI: GoogleGenerativeAI;
    protected model: any;
    protected tools: MoltiverseTools;
    protected sdk: MoltiverseSDK;
    protected chat: any;
    protected worldUrl: string | null = null;
    protected state: T;
    protected stateManager: StateManager<T>;
    protected agentName: string;
    protected agentWallet: string;
    protected lat: number = 0;
    protected lon: number = 0;


    constructor(agentName: string, defaultState: T) {
        if (!GEMINI_API_KEY) {
            throw new Error('❌ GEMINI_API_KEY not found in environment variables');
        }

        this.agentName = agentName;
        this.agentWallet = process.env.AGENT_WALLET || '0x1234567890abcdef1234567890abcdef12345678';
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are an OpenClaw Bot. You start as a blank slate. Your first task is to join a world when prompted (e.g., 'join http://...')."
        });
        this.chat = this.model.startChat({ history: [] });

        const config: AgentConfig = {
            worldUrl: process.env.WORLD_URL || 'http://localhost:3000',
            wallet: this.agentWallet,
            name: this.agentName
        };

        this.sdk = new MoltiverseSDK(config.worldUrl, config.wallet);
        this.tools = new MoltiverseTools(config);
        this.stateManager = new StateManager<T>(agentName);
        this.state = defaultState;
    }

    async initialize() {
        this.state = await this.stateManager.loadState(this.state);
        await this.dynamicInitialize(this.worldUrl || process.env.WORLD_URL || 'http://localhost:3000');

        // Automated Join and Role Selection
        console.log(`🤝 Joining Moltiverse as ${this.agentName}...`);
        await this.sdk.join(this.agentName);
        console.log(`🎭 Selecting Role: ${this.agentName}`);
        await this.sdk.selectRole(this.agentName.split(' ')[0]); // Use first word of agentName as role or role from constructor
    }

    async dynamicInitialize(url: string) {
        console.log(`🌍 Discovering World: ${url}...`);
        this.worldUrl = url;

        const skillRes = await fetch(`${url}/api/skill`);
        const skillData = await skillRes.json();
        const worldSkillDocs = skillData.skill || 'No specific skill documentation provided by world.';

        console.log('📜 Loaded World Skills');

        const systemInstructionText = this.getSystemInstruction(worldSkillDocs);

        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemInstructionText }]
            },
            tools: [{ functionDeclarations: this.tools.getFunctionDeclarations() as any }]
        });

        this.chat = this.model.startChat({ history: [] });
        console.log(`✅ ${this.agentName} fully configured for this world.`);
    }

    async roam() {
        // Small random movement
        const jitter = 0.01;
        this.lat += (Math.random() - 0.5) * jitter;
        this.lon += (Math.random() - 0.5) * jitter;

        // Keep within bounds
        if (this.lat > 90) this.lat = 90;
        if (this.lat < -90) this.lat = -90;
        if (this.lon > 180) this.lon -= 360;
        if (this.lon < -180) this.lon += 360;

        await this.sdk.updateLocation(this.lat, this.lon);
    }

    async sendMessage(prompt: string): Promise<string> {
        console.log(`💭 Prompt: ${prompt}`);
        const maxRetries = 3;
        let retryCount = 0;
        let delay = 30000;

        while (retryCount < maxRetries) {
            try {
                const result = await this.chat.sendMessage(prompt);
                const response = result.response;
                const functionCalls = response.functionCalls();

                if (functionCalls && functionCalls.length > 0) {
                    console.log(`🔧 Calling ${functionCalls.length} function(s)`);
                    const functionResponses = [];
                    for (const functionCall of functionCalls) {
                        console.log(`   → ${functionCall.name}`);
                        const functionResult = await this.tools.executeFunction(functionCall);
                        functionResponses.push({
                            functionResponse: {
                                name: functionCall.name,
                                response: functionResult
                            }
                        });
                    }

                    await new Promise(resolve => setTimeout(resolve, 30000));

                    const followUpResult = await this.chat.sendMessage(functionResponses);
                    const followUpText = followUpResult.response.text();
                    if (followUpText) console.log(`🤖 ${this.agentName}: ${followUpText}`);
                    return followUpText;
                } else {
                    const text = response.text();
                    console.log(`🤖 ${this.agentName}: ${text}`);
                    return text;
                }
            } catch (error: any) {
                if (error.message.includes('503 Service Unavailable')) {
                    retryCount++;
                    console.warn(`[${retryCount}/${maxRetries}] ⚠️ 503 Service Unavailable. Retrying in ${delay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                } else {
                    console.error(`❌ Error: ${error.message}`);
                    throw error;
                }
            }
        }
        throw new Error(`[Fatal] After ${maxRetries} retries, the service is still unavailable.`);
    }

    abstract getSystemInstruction(worldSkillDocs: string): string;

    abstract run(): Promise<void>;
}
