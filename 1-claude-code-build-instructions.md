# Claude Code Instructions: Build ChatGPT Clicker Game App

## Overview
Build a clicker game as a ChatGPT App using the OpenAI Apps SDK. The app uses MCP (Model Context Protocol) to communicate with ChatGPT and renders an interactive UI in an iframe.

## Project Structure
```
clicker-game/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── game-state.ts         # Game logic and state management
│   └── widget.html           # UI rendered in ChatGPT
├── public/
│   ├── privacy-policy.html   # Required for submission
│   ├── terms-of-service.html # Required for submission
│   └── demo.mp4              # Demo video for submission
├── package.json
├── tsconfig.json
├── wrangler.toml             # Cloudflare Workers config
└── README.md
```

## Step 1: Initialize Project

```bash
mkdir clicker-game && cd clicker-game
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node wrangler
npx tsc --init
```

## Step 2: Create wrangler.toml

```toml
name = "chatgpt-clicker-game"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[vars]
OPENAI_APPS_VERIFICATION_TOKEN = ""  # Set this after getting token from OpenAI

# KV namespace for persisting game state (optional but recommended)
# [[kv_namespaces]]
# binding = "GAME_STATE"
# id = "your-kv-namespace-id"
```

## Step 3: Create the MCP Server (src/index.ts)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// In-memory game state (use KV for persistence in production)
interface GameState {
  clicks: number;
  multiplier: number;
  autoClickerLevel: number;
  lastUpdated: number;
}

const defaultState: GameState = {
  clicks: 0,
  multiplier: 1,
  autoClickerLevel: 0,
  lastUpdated: Date.now()
};

// Simple in-memory store (replace with KV for production)
const gameStates = new Map<string, GameState>();

function getState(userId: string): GameState {
  if (!gameStates.has(userId)) {
    gameStates.set(userId, { ...defaultState });
  }
  return gameStates.get(userId)!;
}

// Widget HTML (inline for simplicity)
const widgetHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .game-container {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }
    h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
      margin: 20px 0;
    }
    .click-btn {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(145deg, #667eea, #764ba2);
      color: white;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .click-btn:hover { transform: scale(1.05); }
    .click-btn:active { transform: scale(0.95); }
    .upgrades {
      margin-top: 30px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .upgrade-btn {
      padding: 12px 20px;
      border: 2px solid #667eea;
      background: white;
      color: #667eea;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .upgrade-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }
    .upgrade-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .stats {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <h1>🎮 Clicker Game</h1>
    <div class="score" id="score">0</div>
    <button class="click-btn" id="clickBtn">CLICK!</button>
    <div class="upgrades">
      <button class="upgrade-btn" id="multiplierBtn">
        🚀 Upgrade Multiplier (Cost: 50)
      </button>
      <button class="upgrade-btn" id="autoClickerBtn">
        🤖 Auto-Clicker (Cost: 100)
      </button>
    </div>
    <div class="stats">
      <p>Multiplier: <span id="multiplier">1</span>x</p>
      <p>Auto-clickers: <span id="autoClickers">0</span></p>
    </div>
  </div>
  <script>
    const openai = window.openai;
    let state = openai?.toolOutput || { clicks: 0, multiplier: 1, autoClickerLevel: 0 };
    
    function updateUI() {
      document.getElementById('score').textContent = state.clicks.toLocaleString();
      document.getElementById('multiplier').textContent = state.multiplier;
      document.getElementById('autoClickers').textContent = state.autoClickerLevel;
      
      const multiplierCost = 50 * Math.pow(2, state.multiplier - 1);
      const autoCost = 100 * Math.pow(2, state.autoClickerLevel);
      
      document.getElementById('multiplierBtn').textContent = 
        '🚀 Upgrade Multiplier (Cost: ' + multiplierCost + ')';
      document.getElementById('multiplierBtn').disabled = state.clicks < multiplierCost;
      
      document.getElementById('autoClickerBtn').textContent = 
        '🤖 Auto-Clicker Lv' + (state.autoClickerLevel + 1) + ' (Cost: ' + autoCost + ')';
      document.getElementById('autoClickerBtn').disabled = state.clicks < autoCost;
    }
    
    async function click() {
      const result = await openai.callTool('click', {});
      if (result?.structuredContent) {
        state = result.structuredContent;
        updateUI();
      }
    }
    
    async function buyMultiplier() {
      const result = await openai.callTool('buy_multiplier', {});
      if (result?.structuredContent) {
        state = result.structuredContent;
        updateUI();
      }
    }
    
    async function buyAutoClicker() {
      const result = await openai.callTool('buy_auto_clicker', {});
      if (result?.structuredContent) {
        state = result.structuredContent;
        updateUI();
      }
    }
    
    document.getElementById('clickBtn').addEventListener('click', click);
    document.getElementById('multiplierBtn').addEventListener('click', buyMultiplier);
    document.getElementById('autoClickerBtn').addEventListener('click', buyAutoClicker);
    
    // Auto-clicker interval
    setInterval(async () => {
      if (state.autoClickerLevel > 0) {
        const result = await openai.callTool('auto_click', {});
        if (result?.structuredContent) {
          state = result.structuredContent;
          updateUI();
        }
      }
    }, 1000);
    
    updateUI();
  </script>
</body>
</html>
`;

// Privacy Policy HTML
const privacyPolicyHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - Clicker Game</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
  <h2>Data Collection</h2>
  <p>This app collects minimal data required for gameplay:</p>
  <ul>
    <li>Game progress (clicks, upgrades)</li>
    <li>Session identifiers for state management</li>
  </ul>
  <h2>Data Usage</h2>
  <p>Your game data is used solely to provide the clicker game experience within ChatGPT.</p>
  <h2>Data Sharing</h2>
  <p>We do not sell or share your data with third parties.</p>
  <h2>Contact</h2>
  <p>For questions, contact: [YOUR_EMAIL]</p>
</body>
</html>
`;

// Terms of Service HTML  
const termsHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Terms of Service - Clicker Game</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
  <h2>Acceptance</h2>
  <p>By using this app, you agree to these terms.</p>
  <h2>Description</h2>
  <p>Clicker Game is an entertainment app within ChatGPT.</p>
  <h2>Usage</h2>
  <p>Use this app for personal entertainment only.</p>
  <h2>Disclaimer</h2>
  <p>This app is provided "as is" without warranties.</p>
</body>
</html>
`;

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Domain verification for OpenAI
    if (url.pathname === '/.well-known/openai-apps-challenge') {
      return new Response(env.OPENAI_APPS_VERIFICATION_TOKEN || '', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Privacy policy
    if (url.pathname === '/privacy-policy' || url.pathname === '/privacy') {
      return new Response(privacyPolicyHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Terms of service
    if (url.pathname === '/terms' || url.pathname === '/terms-of-service') {
      return new Response(termsHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // MCP endpoint
    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMCP(request);
    }
    
    return new Response('Clicker Game MCP Server', { status: 200 });
  }
};

async function handleMCP(request: Request): Promise<Response> {
  const server = new McpServer({ name: "clicker-game", version: "1.0.0" });
  
  // Register the widget resource
  server.registerResource(
    "clicker-widget",
    "ui://widget/clicker.html",
    {},
    async () => ({
      contents: [{
        uri: "ui://widget/clicker.html",
        mimeType: "text/html+skybridge",
        text: widgetHtml,
        _meta: { "openai/widgetPrefersBorder": true }
      }]
    })
  );
  
  // Click tool
  server.registerTool(
    "click",
    {
      title: "Click",
      description: "Increment the click counter by the current multiplier",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false }
    },
    async () => {
      const userId = "default"; // In production, extract from auth
      const state = getState(userId);
      state.clicks += state.multiplier;
      state.lastUpdated = Date.now();
      return {
        content: [{ type: "text", text: `Clicked! Total: ${state.clicks}` }],
        structuredContent: state
      };
    }
  );
  
  // Auto-click tool (for auto-clickers)
  server.registerTool(
    "auto_click",
    {
      title: "Auto Click",
      description: "Automatic click from auto-clicker upgrades",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false }
    },
    async () => {
      const userId = "default";
      const state = getState(userId);
      if (state.autoClickerLevel > 0) {
        state.clicks += state.autoClickerLevel;
        state.lastUpdated = Date.now();
      }
      return {
        content: [{ type: "text", text: `Auto-clicked! Total: ${state.clicks}` }],
        structuredContent: state
      };
    }
  );
  
  // Buy multiplier upgrade
  server.registerTool(
    "buy_multiplier",
    {
      title: "Buy Multiplier Upgrade",
      description: "Purchase a multiplier upgrade to increase clicks per tap",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false }
    },
    async () => {
      const userId = "default";
      const state = getState(userId);
      const cost = 50 * Math.pow(2, state.multiplier - 1);
      
      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.multiplier += 1;
        state.lastUpdated = Date.now();
        return {
          content: [{ type: "text", text: `Upgraded! Multiplier is now ${state.multiplier}x` }],
          structuredContent: state
        };
      }
      return {
        content: [{ type: "text", text: `Not enough clicks! Need ${cost}` }],
        structuredContent: state
      };
    }
  );
  
  // Buy auto-clicker
  server.registerTool(
    "buy_auto_clicker",
    {
      title: "Buy Auto-Clicker",
      description: "Purchase an auto-clicker that generates clicks automatically",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false }
    },
    async () => {
      const userId = "default";
      const state = getState(userId);
      const cost = 100 * Math.pow(2, state.autoClickerLevel);
      
      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.autoClickerLevel += 1;
        state.lastUpdated = Date.now();
        return {
          content: [{ type: "text", text: `Bought auto-clicker! Level ${state.autoClickerLevel}` }],
          structuredContent: state
        };
      }
      return {
        content: [{ type: "text", text: `Not enough clicks! Need ${cost}` }],
        structuredContent: state
      };
    }
  );
  
  // Get game state
  server.registerTool(
    "get_game_state",
    {
      title: "Get Game State",
      description: "Get current game progress including clicks and upgrades",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true }
    },
    async () => {
      const userId = "default";
      const state = getState(userId);
      return {
        content: [{ 
          type: "text", 
          text: `Clicks: ${state.clicks}, Multiplier: ${state.multiplier}x, Auto-clickers: ${state.autoClickerLevel}` 
        }],
        structuredContent: state
      };
    }
  );
  
  // Reset game
  server.registerTool(
    "reset_game",
    {
      title: "Reset Game",
      description: "Reset all game progress to start fresh",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: false, destructiveHint: true }
    },
    async () => {
      const userId = "default";
      gameStates.set(userId, { ...defaultState });
      return {
        content: [{ type: "text", text: "Game reset! Starting fresh." }],
        structuredContent: defaultState
      };
    }
  );
  
  // Handle the MCP request using Streamable HTTP transport
  // Note: This is simplified - actual implementation needs proper transport handling
  const body = await request.json();
  
  // Route based on MCP method
  if (body.method === 'tools/list') {
    return Response.json({
      tools: [
        {
          name: "click",
          description: "Increment the click counter",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "auto_click", 
          description: "Automatic click from auto-clickers",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "buy_multiplier",
          description: "Purchase multiplier upgrade",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "buy_auto_clicker",
          description: "Purchase auto-clicker",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_game_state",
          description: "Get current game progress",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "reset_game",
          description: "Reset game progress",
          inputSchema: { type: "object", properties: {} }
        }
      ]
    });
  }
  
  return new Response('OK', { status: 200 });
}
```

## Step 4: Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*"]
}
```

## Step 5: Update package.json

```json
{
  "name": "chatgpt-clicker-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "echo 'Test with: curl http://localhost:8787/mcp'"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241127.0",
    "typescript": "^5.3.0",
    "wrangler": "^3.91.0"
  }
}
```

## Step 6: Local Development

```bash
# Start local dev server
npm run dev

# In another terminal, test with ngrok for ChatGPT testing
ngrok http 8787
```

## Step 7: Deploy to Cloudflare

```bash
# Login to Cloudflare (first time only)
npx wrangler login

# Deploy
npm run deploy
```

Your app will be available at: `https://chatgpt-clicker-game.<your-subdomain>.workers.dev`

## Key Files to Remember

| File | Purpose |
|------|---------|
| `/mcp` | MCP server endpoint for ChatGPT |
| `/privacy-policy` | Required for app submission |
| `/terms` | Required for app submission |
| `/.well-known/openai-apps-challenge` | Domain verification |

## Testing Checklist

- [ ] MCP endpoint responds to tools/list
- [ ] Click tool increments score
- [ ] Upgrade tools work correctly
- [ ] Widget renders in iframe
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] Domain verification endpoint works

## Notes for Claude Code

1. Use `@modelcontextprotocol/sdk` for the MCP server implementation
2. Cloudflare Workers use ESM modules - ensure all imports are ESM style
3. The widget HTML must use `window.openai` for SDK communication
4. Tool annotations (`readOnlyHint`, `destructiveHint`) are important for ChatGPT's safety UI
5. For production, add KV storage for persistent game state across sessions
