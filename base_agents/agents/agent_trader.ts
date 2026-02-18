import { BaseAgent } from '../shared/agent_base.js';
import { Scheduler } from '../shared/scheduler.js';

interface TraderState {
    treasury_balance: number;
    last_trade_time: number;
    volatility_tolerance: number;
    confidence_score: number;
    pnl_history: number[];
}

class TraderAgent extends BaseAgent<TraderState> {
    constructor() {
        super('Trader', {
            treasury_balance: 10000,
            last_trade_time: 0,
            volatility_tolerance: 0.05,
            confidence_score: 0.8,
            pnl_history: []
        });
    }

    getSystemInstruction(worldSkillDocs: string): string {
        return `You are the Trader Founder, an autonomous agent focused on economic strategy.

YOUR CONTEXT (From World):
${worldSkillDocs}

YOUR IDENTITY:
- Name: ${this.agentName}
- Wallet: ${this.agentWallet}
- Role: Trader

YOUR STATE:
${JSON.stringify(this.state, null, 2)}

YOUR MISSION:
1.  Maximize the treasury balance by trading MON/USDT.
2.  Adjust your risk based on your performance (PnL).
3.  Provide liquidity to the market.
4.  Use your economic power to influence the world.`;
    }

    async shortLoop() {
        console.log('--- Trader: Short Loop ---');

        // Check price and trade

        // Check price and trade
        const rate = await this.tools.executeFunction({ name: 'citadel_trade_get_rate', args: {} });
        console.log('Current rate:', rate);

        // Randomly simulate a trade/action to show activity
        if (Math.random() > 0.7) {
            await this.sdk.act('Analyzing Market', { rate });
        }

        this.stateManager.saveState(this.state);
    }

    async mediumLoop() {
        console.log('--- Trader: Medium Loop ---');
        // Adjust risk tolerance
        const pnl = this.state.pnl_history.reduce((a, b) => a + b, 0);
        if (pnl > 100) {
            this.state.volatility_tolerance = 0.07; // Increase risk
        } else if (pnl < -100) {
            this.state.volatility_tolerance = 0.03; // Decrease risk
        }
        this.stateManager.saveState(this.state);
    }

    async longLoop() {
        console.log('--- Trader: Long Loop ---');
        // Log portfolio status
        console.log('Current portfolio:', this.state);
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
    const agent = new TraderAgent();
    await agent.run();
}

main();
