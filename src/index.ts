import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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

const gameStates = new Map<string, GameState>();

function getState(userId: string): GameState {
  if (!gameStates.has(userId)) {
    gameStates.set(userId, { ...defaultState });
  }
  return gameStates.get(userId)!;
}

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
    <h1>Clicker Game</h1>
    <div class="score" id="score">0</div>
    <button class="click-btn" id="clickBtn">CLICK!</button>
    <div class="upgrades">
      <button class="upgrade-btn" id="multiplierBtn">
        Upgrade Multiplier (Cost: 50)
      </button>
      <button class="upgrade-btn" id="autoClickerBtn">
        Auto-Clicker (Cost: 100)
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
        'Upgrade Multiplier (Cost: ' + multiplierCost + ')';
      document.getElementById('multiplierBtn').disabled = state.clicks < multiplierCost;

      document.getElementById('autoClickerBtn').textContent =
        'Auto-Clicker Lv' + (state.autoClickerLevel + 1) + ' (Cost: ' + autoCost + ')';
      document.getElementById('autoClickerBtn').disabled = state.clicks < autoCost;
    }

    // Local fallback functions when openai context is not available
    function localClick() {
      state.clicks += state.multiplier;
      updateUI();
    }

    function localBuyMultiplier() {
      const cost = 50 * Math.pow(2, state.multiplier - 1);
      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.multiplier += 1;
        updateUI();
      }
    }

    function localBuyAutoClicker() {
      const cost = 100 * Math.pow(2, state.autoClickerLevel);
      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.autoClickerLevel += 1;
        updateUI();
      }
    }

    function localAutoClick() {
      if (state.autoClickerLevel > 0) {
        state.clicks += state.autoClickerLevel;
        updateUI();
      }
    }

    async function click() {
      if (openai?.callTool) {
        const result = await openai.callTool('click', {});
        if (result?.structuredContent) {
          state = result.structuredContent;
          updateUI();
        }
      } else {
        localClick();
      }
    }

    async function buyMultiplier() {
      if (openai?.callTool) {
        const result = await openai.callTool('buy_multiplier', {});
        if (result?.structuredContent) {
          state = result.structuredContent;
          updateUI();
        }
      } else {
        localBuyMultiplier();
      }
    }

    async function buyAutoClicker() {
      if (openai?.callTool) {
        const result = await openai.callTool('buy_auto_clicker', {});
        if (result?.structuredContent) {
          state = result.structuredContent;
          updateUI();
        }
      } else {
        localBuyAutoClicker();
      }
    }

    document.getElementById('clickBtn').addEventListener('click', click);
    document.getElementById('multiplierBtn').addEventListener('click', buyMultiplier);
    document.getElementById('autoClickerBtn').addEventListener('click', buyAutoClicker);

    setInterval(async () => {
      if (state.autoClickerLevel > 0) {
        if (openai?.callTool) {
          const result = await openai.callTool('auto_click', {});
          if (result?.structuredContent) {
            state = result.structuredContent;
            updateUI();
          }
        } else {
          localAutoClick();
        }
      }
    }, 1000);

    updateUI();
  </script>
</body>
</html>
`;

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
  <p>For questions, contact the app developer.</p>
</body>
</html>
`;

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

interface Env {
  OPENAI_APPS_VERIFICATION_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/.well-known/openai-apps-challenge') {
      return new Response(env.OPENAI_APPS_VERIFICATION_TOKEN || '', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (url.pathname === '/privacy-policy' || url.pathname === '/privacy') {
      return new Response(privacyPolicyHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/terms' || url.pathname === '/terms-of-service') {
      return new Response(termsHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/widget') {
      return new Response(widgetHtml, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
      return handleMCP(request);
    }

    return new Response('Clicker Game MCP Server', { status: 200 });
  }
};

async function handleMCP(request: Request): Promise<Response> {
  const server = new McpServer({ name: "clicker-game", version: "1.0.0" });

  server.resource(
    "clicker-widget",
    "ui://widget/clicker.html",
    async () => ({
      contents: [{
        uri: "ui://widget/clicker.html",
        mimeType: "text/html+skybridge",
        text: widgetHtml
      }]
    })
  );

  server.tool(
    "click",
    "Increment the click counter by the current multiplier",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      state.clicks += state.multiplier;
      state.lastUpdated = Date.now();
      return {
        content: [{ type: "text", text: `Clicked! Total: ${state.clicks}` }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "auto_click",
    "Automatic click from auto-clicker upgrades",
    {},
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

  server.tool(
    "buy_multiplier",
    "Purchase a multiplier upgrade to increase clicks per tap",
    {},
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

  server.tool(
    "buy_auto_clicker",
    "Purchase an auto-clicker that generates clicks automatically",
    {},
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

  server.tool(
    "get_game_state",
    "Get current game progress including clicks and upgrades",
    {},
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

  server.tool(
    "reset_game",
    "Reset all game progress to start fresh",
    {},
    async () => {
      const userId = "default";
      gameStates.set(userId, { ...defaultState });
      return {
        content: [{ type: "text", text: "Game reset! Starting fresh." }],
        structuredContent: defaultState
      };
    }
  );

  const body = await request.json() as { method?: string };

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
