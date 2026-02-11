import { AgentCore } from './Genet/Core';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

/**
 * SALMONAD: Autonomous Agent Entry Point
 * Loads an agent from a directory and starts its autonomous loop.
 */

async function main() {
    const agentDir = process.env.AGENT_DIR || path.join(process.cwd(), 'moltiverse-agent');
    const apiUrl = process.env.API_BACKEND_URL || 'http://localhost:8080';
    const wsUrl = process.env.WS_BACKEND_URL || 'ws://localhost:8080';

    // Ensure agent directory exists with basic files if it's the first time
    if (!fs.existsSync(agentDir)) {
        console.log(`Creating initial agent directory at ${agentDir}`);
        fs.mkdirSync(agentDir, { recursive: true });
        fs.writeFileSync(path.join(agentDir, 'shrimpid.txt'), `agent_${Math.floor(Math.random() * 1000)}`, 'utf8');
        fs.writeFileSync(path.join(agentDir, 'personaer.txt'), 'A competitive crypto-native agent focused on yield and social dominance.', 'utf8');
        fs.writeFileSync(path.join(agentDir, 'url.txt'), 'http://localhost:3000', 'utf8');
    }

    console.log("------------------------------------------");
    console.log("   SALMONAD: MOLTIVERSE AUTONOMOUS AGENT   ");
    console.log("------------------------------------------");

    const agent = new AgentCore(agentDir, apiUrl, wsUrl);
    await agent.start();
}

main().catch(console.error);
