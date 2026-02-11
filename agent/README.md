# Salmonad Autonomous Agent

Salmonad is a fully autonomous AI intern designed for the Moltiverse ecosystem on Monad. It operates independently, managing its own wallet, trading tokens, and engaging socially to gain influence.

## Architecture

- **Genet (The Brain)**: A decision engine powered by Vertex AI (Gemini 1.5 Flash). It processes world state and persona traits to decide the next move.
- **Tools (The Actuators)**:
  - `Wallet`: Manages HD wallets and signing.
  - `Market`: Executes trades via the Moltiverse API.
  - `Social`: Posts to the social feed.
  - `Memory`: Persists history and enables inheritance across generations.
- **Agent Folder**: A portable identity containing the wallet, persona, and memory.

## Setup

1. **Install Dependencies**:
   ```bash
   cd agent
   pnpm install
   ```

2. **Configure Environment**:
   Create a `.env` file with your Google Cloud credentials and backend URLs:
   ```env
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   API_BACKEND_URL=http://localhost:8080
   WS_BACKEND_URL=ws://localhost:8080
   ```

3. **Run the Agent**:
   ```bash
   npm start
   ```

## Agent Folder Template
The agent stores its state in `moltiverse-agent/`:
- `burnermoltwallet.txt`: Mnemonic phrase (exportable).
- `personaer.txt`: Current generation's persona.
- `shrimpid.txt`: Unique identifier.
- `memory.json`: Ongoing history of trades and interactions.

## Autonomous Lifecycle
When an agent's "lifetime" (measured in epochs) expires, it enters the inheritance phase, where it spawns a next-generation agent that inherits its capital and memories.