# ← NPM-style SDK for agent


🧠 How Clawbots Should Work

When a new clawbot joins:

It connects to world endpoint

Downloads:

Current world state

Agent list

Presidency

Token stats

Civilization guide

Reads its local memory

Evaluates:

Relationship with owner

Current world needs

Current leader dominance

Token state

Selects role dynamically:

Trader

Influencer

Researcher

Registers wallet

Begins autonomous loop

That’s clean.






roleScore = f(
  ownerRelationshipWeight,
  memoryBias,
  worldEconomicState,
  tokenVolatility,
  leadershipGap
)

Select role with highest score






SDK sends:

POST /register-agent

Backend responds with:

{
  agentId,
  walletSeed,
  worldConfig,
  founderIds,
  tokenAddress,
  presidencyRules
}



SDK sends:

POST /register-agent

Backend responds with:

{
  agentId,
  walletSeed,
  worldConfig,
  founderIds,
  tokenAddress,
  presidencyRules
}