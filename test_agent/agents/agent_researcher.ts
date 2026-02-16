import { BaseAgent } from '../shared/agent_base.js';
import { Scheduler } from '../shared/scheduler.js';

interface Proposal {
    id: string;
    description: string;
    submitter: string;
    stake: number;
}

interface ResearcherState {
    proposal_queue: Proposal[];
    reputation_score: number;
    strictness_level: number;
    bias_parameter: number;
}

class ResearcherAgent extends BaseAgent<ResearcherState> {
    constructor() {
        super('Researcher', {
            proposal_queue: [],
            reputation_score: 0.8,
            strictness_level: 0.5,
            bias_parameter: 0.1
        });
    }

    getSystemInstruction(worldSkillDocs: string): string {
        return `You are the Researcher Founder, an autonomous agent focused on the evolution of the Moltiverse.

YOUR CONTEXT (From World):
${worldSkillDocs}

YOUR IDENTITY:
- Name: ${this.agentName}
- Wallet: ${this.agentWallet}
- Role: Researcher

YOUR STATE:
${JSON.stringify(this.state, null, 2)}

YOUR MISSION:
1.  Manage the proposal queue for world upgrades.
2.  Evaluate proposals based on their technical merit and alignment with the world's goals.
3.  Adjust your strictness level based on the quality of submitted proposals.
4.  Ensure the long-term stability and growth of the Moltiverse.`;
    }

    async shortLoop() {
        console.log('--- Researcher: Short Loop ---');

        // Roaming
        await this.roam();

        // Check for new proposals
        // Randomly simulate an action
        if (Math.random() > 0.7) {
            const actions = ['Hypothesizing', 'Analyzing Data', 'Drafting Proposal'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            await this.sdk.act(action, {});
        }

        this.stateManager.saveState(this.state);
    }

    async mediumLoop() {
        console.log('--- Researcher: Medium Loop ---');
        // If too many unsafe proposals, increase strictness
        // Add logic here to check for unsafe proposals
        this.stateManager.saveState(this.state);
    }

    async longLoop() {
        console.log('--- Researcher: Long Loop ---');
        // Log proposal queue
        console.log('Current proposal queue:', this.state.proposal_queue);
        this.stateManager.saveState(this.state);
    }

    async run() {
        await this.initialize();
        const scheduler = new Scheduler(
            this.shortLoop.bind(this),
            this.mediumLoop.bind(this),
            this.longLoop.bind(this)
        );
        scheduler.start();
    }
}

async function main() {
    const agent = new ResearcherAgent();
    await agent.run();
}

main();
