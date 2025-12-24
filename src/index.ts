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

    :root {
      --primary: #6366F1;
      --secondary: #10B981;
      --accent: #F59E0B;
      --dark: #1E1B4B;
      --light: #F5F3FF;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, var(--dark) 0%, #312E81 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      color: white;
    }

    .game-container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.4);
      text-align: center;
      max-width: 420px;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .header {
      margin-bottom: 20px;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 5px;
      background: linear-gradient(90deg, #fff, var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tagline {
      font-size: 14px;
      opacity: 0.8;
    }

    .stage-badge {
      display: inline-block;
      background: var(--accent);
      color: var(--dark);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }

    .score-section {
      margin: 25px 0;
    }

    .currency-icon {
      font-size: 32px;
      margin-bottom: 5px;
    }

    .score {
      font-size: 42px;
      font-weight: 800;
      color: var(--secondary);
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
    }

    .score-label {
      font-size: 14px;
      opacity: 0.7;
      margin-top: 5px;
    }

    .hustle-btn {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,0.3);
      background: linear-gradient(145deg, var(--primary), #4F46E5);
      color: white;
      font-size: 22px;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.1s ease;
      box-shadow:
        0 10px 40px rgba(99, 102, 241, 0.5),
        inset 0 -4px 10px rgba(0,0,0,0.2);
      margin: 20px 0;
      position: relative;
      overflow: hidden;
    }

    .hustle-btn:hover {
      transform: scale(1.05);
      box-shadow:
        0 15px 50px rgba(99, 102, 241, 0.6),
        inset 0 -4px 10px rgba(0,0,0,0.2);
    }

    .hustle-btn:active {
      transform: scale(0.95);
      box-shadow:
        0 5px 20px rgba(99, 102, 241, 0.4),
        inset 0 4px 10px rgba(0,0,0,0.3);
    }

    .hustle-btn .icon {
      font-size: 36px;
      display: block;
      margin-bottom: 5px;
    }

    .per-click {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 5px;
    }

    .upgrades {
      margin-top: 25px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .upgrade-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.05);
      color: white;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .upgrade-btn:hover:not(:disabled) {
      background: rgba(255,255,255,0.15);
      border-color: var(--secondary);
    }

    .upgrade-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .upgrade-btn .left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .upgrade-btn .emoji {
      font-size: 20px;
    }

    .upgrade-btn .name {
      font-weight: 600;
    }

    .upgrade-btn .cost {
      color: var(--secondary);
      font-weight: 600;
    }

    .stats {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-around;
      font-size: 13px;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-weight: 700;
      color: var(--accent);
      font-size: 18px;
    }

    .stat-label {
      opacity: 0.7;
      font-size: 11px;
      margin-top: 2px;
    }

    .floating-dollar {
      position: absolute;
      animation: floatUp 1s ease-out forwards;
      pointer-events: none;
      font-size: 20px;
    }

    @keyframes floatUp {
      0% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-60px); }
    }
  </style>
</head>
<body>
  <div class="game-container">
    <div class="header">
      <h1>Startup Hustle</h1>
      <p class="tagline">Click your way to unicorn status</p>
      <div class="stage-badge" id="stage">The Garage</div>
    </div>

    <div class="score-section">
      <div class="currency-icon" id="currencyIcon">$</div>
      <div class="score" id="score">$0</div>
      <div class="score-label">Total Funding</div>
    </div>

    <button class="hustle-btn" id="hustleBtn">
      <span class="icon">HUSTLE</span>
      <div class="per-click" id="perClick">+$1 per click</div>
    </button>

    <div class="upgrades">
      <button class="upgrade-btn" id="upgradeBtn">
        <span class="left">
          <span class="emoji" id="upgradeEmoji">coffee</span>
          <span class="name" id="upgradeName">Coffee Machine</span>
        </span>
        <span class="cost" id="upgradeCost">$50</span>
      </button>
      <button class="upgrade-btn" id="hireBtn">
        <span class="left">
          <span class="emoji" id="hireEmoji">person</span>
          <span class="name" id="hireName">Hire Intern</span>
        </span>
        <span class="cost" id="hireCost">$100</span>
      </button>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-value" id="multiplier">1x</div>
        <div class="stat-label">Multiplier</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="passive">$0/s</div>
        <div class="stat-label">Passive</div>
      </div>
      <div class="stat">
        <div class="stat-value" id="employees">0</div>
        <div class="stat-label">Team</div>
      </div>
    </div>
  </div>

  <script>
    const openai = window.openai;
    let state = openai?.toolOutput || {
      clicks: 0,
      multiplier: 1,
      autoClickerLevel: 0
    };

    const upgrades = [
      { name: "Coffee Machine", emoji: "coffee", cost: 15 },
      { name: "Standing Desk", emoji: "desk", cost: 75 },
      { name: "Pitch Deck", emoji: "chart", cost: 300 },
      { name: "Co-founder", emoji: "handshake", cost: 1000 },
      { name: "Seed Round", emoji: "seed", cost: 5000 },
      { name: "Series A", emoji: "trending", cost: 25000 },
      { name: "AI Pivot", emoji: "robot", cost: 100000 },
      { name: "Unicorn", emoji: "unicorn", cost: 500000 }
    ];

    const hires = [
      { name: "Hire Intern", emoji: "person", cost: 20 },
      { name: "Junior Dev", emoji: "laptop", cost: 150 },
      { name: "Growth Hacker", emoji: "phone", cost: 800 },
      { name: "VP of Vibes", emoji: "sparkle", cost: 4000 },
      { name: "Board Member", emoji: "tophat", cost: 20000 },
      { name: "AI Agent", emoji: "robot", cost: 100000 }
    ];

    const stages = [
      { name: "The Garage", threshold: 0 },
      { name: "Coworking", threshold: 1000 },
      { name: "Small Office", threshold: 50000 },
      { name: "HQ Campus", threshold: 500000 },
      { name: "Unicorn!", threshold: 10000000 },
      { name: "To The Moon", threshold: 100000000 }
    ];

    function formatMoney(amount) {
      if (amount >= 1000000000) return '$' + (amount / 1000000000).toFixed(1) + 'B';
      if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
      if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K';
      return '$' + amount;
    }

    function getCurrencyIcon(amount) {
      if (amount >= 1000000000) return 'unicorn';
      if (amount >= 1000000) return 'rich';
      if (amount >= 1000) return 'money';
      return '$';
    }

    function getStage(amount) {
      for (let i = stages.length - 1; i >= 0; i--) {
        if (amount >= stages[i].threshold) return stages[i].name;
      }
      return stages[0].name;
    }

    function getCurrentUpgrade() {
      const idx = Math.min(state.multiplier - 1, upgrades.length - 1);
      return upgrades[idx] || upgrades[upgrades.length - 1];
    }

    function getCurrentHire() {
      const idx = Math.min(state.autoClickerLevel, hires.length - 1);
      return hires[idx] || hires[hires.length - 1];
    }

    function updateUI() {
      document.getElementById('score').textContent = formatMoney(state.clicks);
      document.getElementById('currencyIcon').textContent = getCurrencyIcon(state.clicks);
      document.getElementById('stage').textContent = getStage(state.clicks);
      document.getElementById('multiplier').textContent = state.multiplier + 'x';
      document.getElementById('passive').textContent = formatMoney(state.autoClickerLevel) + '/s';
      document.getElementById('employees').textContent = state.autoClickerLevel;
      document.getElementById('perClick').textContent = '+' + formatMoney(state.multiplier) + ' per click';

      const upgrade = getCurrentUpgrade();
      const upgradeCost = Math.floor(upgrade.cost * Math.pow(1.5, state.multiplier - 1));
      document.getElementById('upgradeName').textContent = upgrade.name;
      document.getElementById('upgradeCost').textContent = formatMoney(upgradeCost);
      document.getElementById('upgradeEmoji').textContent = upgrade.emoji;
      document.getElementById('upgradeBtn').disabled = state.clicks < upgradeCost;

      const hire = getCurrentHire();
      const hireCost = Math.floor(hire.cost * Math.pow(1.5, state.autoClickerLevel));
      document.getElementById('hireName').textContent = hire.name;
      document.getElementById('hireCost').textContent = formatMoney(hireCost);
      document.getElementById('hireEmoji').textContent = hire.emoji;
      document.getElementById('hireBtn').disabled = state.clicks < hireCost;
    }

    function createFloatingDollar(e) {
      const btn = document.getElementById('hustleBtn');
      const dollar = document.createElement('div');
      dollar.className = 'floating-dollar';
      dollar.textContent = '+$' + state.multiplier;
      dollar.style.left = Math.random() * 80 + 10 + '%';
      dollar.style.top = '30%';
      btn.appendChild(dollar);
      setTimeout(() => dollar.remove(), 1000);
    }

    // Local fallback functions when openai context is not available
    function localClick() {
      state.clicks += state.multiplier;
      updateUI();
    }

    function localBuyMultiplier() {
      const upgrade = getCurrentUpgrade();
      const cost = Math.floor(upgrade.cost * Math.pow(1.5, state.multiplier - 1));
      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.multiplier += 1;
        updateUI();
      }
    }

    function localBuyAutoClicker() {
      const hire = getCurrentHire();
      const cost = Math.floor(hire.cost * Math.pow(1.5, state.autoClickerLevel));
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

    async function hustle(e) {
      createFloatingDollar(e);
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

    async function buyUpgrade() {
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

    async function buyHire() {
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

    document.getElementById('hustleBtn').addEventListener('click', hustle);
    document.getElementById('upgradeBtn').addEventListener('click', buyUpgrade);
    document.getElementById('hireBtn').addEventListener('click', buyHire);

    // Auto-clicker interval (passive income)
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
  <title>Privacy Policy - Startup Hustle</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; background: #1E1B4B; color: #F5F3FF; }
    h1 { color: #F59E0B; }
    h2 { color: #10B981; }
    a { color: #6366F1; }
  </style>
</head>
<body>
  <h1>Startup Hustle - Privacy Policy</h1>
  <p>Your hustle data stays private.</p>
  <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
  <h2>Data Collection</h2>
  <p>This app collects minimal data required for gameplay:</p>
  <ul>
    <li>Game progress (funding, upgrades, team size)</li>
    <li>Session identifiers for state management</li>
  </ul>
  <h2>Data Usage</h2>
  <p>Your startup data is used solely to provide the Startup Hustle game experience within ChatGPT.</p>
  <h2>Data Sharing</h2>
  <p>We do not sell or share your data with third parties. Your hustle is your own.</p>
  <h2>Contact</h2>
  <p>For questions, contact the app developer.</p>
</body>
</html>
`;

const termsHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Terms of Service - Startup Hustle</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; background: #1E1B4B; color: #F5F3FF; }
    h1 { color: #F59E0B; }
    h2 { color: #10B981; }
    a { color: #6366F1; }
  </style>
</head>
<body>
  <h1>Startup Hustle - Terms of Service</h1>
  <p>By playing, you agree to grind responsibly.</p>
  <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
  <h2>Acceptance</h2>
  <p>By using this app, you agree to these terms.</p>
  <h2>Description</h2>
  <p>Startup Hustle is an entertainment app within ChatGPT. Click your way from garage to unicorn!</p>
  <h2>Usage</h2>
  <p>Use this app for personal entertainment only. No real startups were harmed in the making of this game.</p>
  <h2>Disclaimer</h2>
  <p>This app is provided "as is" without warranties. Any resemblance to actual startup culture is purely satirical.</p>
</body>
</html>
`;

interface Env {
  OPENAI_APPS_VERIFICATION_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Demo video redirect
    if (url.pathname === '/demo.mp4' || url.pathname === '/demo') {
      return Response.redirect('https://pub-34cbbd41484347aaafece7f5d79f3d0c.r2.dev/Demo.mp4', 302);
    }

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

    return new Response('Startup Hustle - Click your way from garage to unicorn!', { status: 200 });
  }
};

async function handleMCP(request: Request): Promise<Response> {
  const server = new McpServer({ name: "startup-hustle", version: "1.0.0" });

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
    "Work hard and earn startup dollars based on your current multiplier",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      state.clicks += state.multiplier;
      state.lastUpdated = Date.now();
      return {
        content: [{ type: "text", text: `Hustled! Total: $${state.clicks}` }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "auto_click",
    "Passive income from your startup team members",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      if (state.autoClickerLevel > 0) {
        state.clicks += state.autoClickerLevel;
        state.lastUpdated = Date.now();
      }
      return {
        content: [{ type: "text", text: `Team earned! Total: $${state.clicks}` }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "buy_multiplier",
    "Purchase startup upgrades to increase earnings per hustle",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      const baseCosts = [15, 75, 300, 1000, 5000, 25000, 100000, 500000];
      const idx = Math.min(state.multiplier - 1, baseCosts.length - 1);
      const cost = Math.floor(baseCosts[idx] * Math.pow(1.5, state.multiplier - 1));

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
        content: [{ type: "text", text: `Not enough funding! Need $${cost}` }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "buy_auto_clicker",
    "Hire employees who generate passive income for your startup",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      const baseCosts = [20, 150, 800, 4000, 20000, 100000];
      const idx = Math.min(state.autoClickerLevel, baseCosts.length - 1);
      const cost = Math.floor(baseCosts[idx] * Math.pow(1.5, state.autoClickerLevel));

      if (state.clicks >= cost) {
        state.clicks -= cost;
        state.autoClickerLevel += 1;
        state.lastUpdated = Date.now();
        return {
          content: [{ type: "text", text: `New hire! Team size: ${state.autoClickerLevel}` }],
          structuredContent: state
        };
      }
      return {
        content: [{ type: "text", text: `Not enough funding! Need $${cost}` }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "get_game_state",
    "View current funding, team size, and startup stage",
    {},
    async () => {
      const userId = "default";
      const state = getState(userId);
      return {
        content: [{
          type: "text",
          text: `Funding: $${state.clicks}, Multiplier: ${state.multiplier}x, Team: ${state.autoClickerLevel}`
        }],
        structuredContent: state
      };
    }
  );

  server.tool(
    "reset_game",
    "Pivot! Abandon current startup and begin a new venture from scratch",
    {},
    async () => {
      const userId = "default";
      gameStates.set(userId, { ...defaultState });
      return {
        content: [{ type: "text", text: "Pivoted! Starting a new venture from the garage." }],
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
          description: "Hustle to earn startup dollars",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "auto_click",
          description: "Passive income from team members",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "buy_multiplier",
          description: "Purchase startup upgrades",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "buy_auto_clicker",
          description: "Hire team members",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_game_state",
          description: "Check startup status",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "reset_game",
          description: "Pivot and start over",
          inputSchema: { type: "object", properties: {} }
        }
      ]
    });
  }

  return new Response('OK', { status: 200 });
}
