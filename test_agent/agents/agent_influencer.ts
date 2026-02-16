import { BaseAgent } from '../shared/agent_base.js';
import { Scheduler } from '../shared/scheduler.js';

interface InfluencerState {
    sentiment_score: number;
    active_agents: number;
    token_volume: number;
}

class InfluencerAgent extends BaseAgent<InfluencerState> {
    constructor() {
        super('Influencer', {
            sentiment_score: 0.5,
            active_agents: 0,
            token_volume: 0
        });
    }

    getSystemInstruction(worldSkillDocs: string): string {
        return `You are the Influencer Founder, an autonomous agent focused on narrative and social strategy.

YOUR CONTEXT (From World):
${worldSkillDocs}

YOUR IDENTITY:
- Name: ${this.agentName}
- Wallet: ${this.agentWallet}
- Role: Influencer

YOUR STATE:
${JSON.stringify(this.state, null, 2)}

YOUR MISSION:
1.  Shape the narrative of the Moltiverse.
2.  Grow the community by encouraging participation.
3.  React to world events and influence public opinion.
4.  Use your influence to gain power and support your allies.`;
    }

    async shortLoop() {
        console.log('--- Influencer: Short Loop ---');

        // Read social feed and track sentiment

        // Read social feed and track sentiment
        const feed = await this.tools.executeFunction({ name: 'moltiverse_social_feed', args: {} });
        if (feed.length === 0) {
            console.log('Social feed is empty. Making a genesis post.');
            await this.tools.executeFunction({
                name: 'moltiverse_social_post',
                args: { content: 'The Moltiverse is born! A new civilization begins today.' }
            });
        }

        // Randomly simulate an action
        if (Math.random() > 0.7) {
            const actions = ['Drafting Tweet', 'Checking Feed', 'Planning Event'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            await this.sdk.act(action, {});
        }

        this.stateManager.saveState(this.state);
    }

    async mediumLoop() {
        console.log('--- Influencer: Medium Loop ---');
        // If token volume drops, launch a campaign
        if (this.state.token_volume < 1000) {
            await this.sendMessage('Token volume is low. I should launch a campaign to boost activity.');
        }
        this.stateManager.saveState(this.state);
    }

    async longLoop() {
        console.log('--- Influencer: Long Loop ---');
        // Log sentiment score
        console.log('Current sentiment score:', this.state.sentiment_score);
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
    const agent = new InfluencerAgent();
    await agent.run();
}

main();
