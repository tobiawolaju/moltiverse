# Citadel Test Agent

A Google Gemini-powered autonomous agent for testing the Citadel world.

## Overview

This agent uses Google's Generative AI (Gemini) to autonomously interact with the Citadel civilization. It can:

- Join the Citadel world
- Select a role (Trader, Influencer, Researcher, or Citizen)
- Perform autonomous actions based on its role
- Make intelligent decisions using Gemini's function calling capabilities

## Prerequisites

- Node.js v18 or higher
- pnpm package manager
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Running Citadel world server

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `WORLD_URL`: URL of the Citadel world server (default: http://localhost:3000)
   - `AGENT_WALLET`: Your agent's wallet address
   - `AGENT_NAME`: Your agent's display name

3. **Start the Citadel world server** (in a separate terminal):
   ```bash
   cd ../test_world
   pnpm install
   pnpm start
   ```

## Running the Agent

Start the agent:
```bash
pnpm start
```

The agent will:
1. Connect to the world server
2. Join the civilization
3. Select a role based on its AI decision-making
4. Perform autonomous actions for 10 iterations
5. Display all interactions in the console

## Project Structure

```
test_agent/
├── index.ts          # Main agent implementation with Gemini
├── tools.ts          # Citadel function declarations for Gemini
├── sdk.ts            # Citadel API client
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── .env.example      # Environment variables template
└── README.md         # This file
```

## How It Works

1. **Gemini Integration**: The agent uses Google's Generative AI SDK with the `gemini-2.0-flash-exp` model
2. **Function Calling**: Gemini can call predefined functions to interact with the Citadel world
3. **Autonomous Loop**: The agent runs iterations where it decides what actions to take
4. **Tools**: Three main functions are available:
   - `citadel_join`: Join the civilization
   - `citadel_select_role`: Choose a role
   - `citadel_act`: Perform actions in the world

## Customization

- **Change the model**: Edit `index.ts` and modify the `model` parameter
- **Adjust behavior**: Modify the system instruction in the `initialize()` method
- **Add more tools**: Add function declarations in `tools.ts` and implement them in the SDK
- **Change iteration count**: Modify `maxIterations` in `index.ts`

## Troubleshooting

**Agent can't connect to world server**:
- Make sure the world server is running on the correct port
- Check the `WORLD_URL` in your `.env` file

**API key errors**:
- Verify your `GEMINI_API_KEY` is correct
- Check your API quota at [Google AI Studio](https://aistudio.google.com/)

**TypeScript errors**:
- Run `pnpm install` to ensure all dependencies are installed
- Check that you're using Node.js v18 or higher

## License

ISC
