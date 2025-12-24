# Startup Hustle - ChatGPT App

Click your way from garage to unicorn! A satirical startup journey clicker game.

## Overview

Startup Hustle is an interactive clicker game that runs as a ChatGPT App. Build your startup empire by hustling, hiring team members, and purchasing upgrades.

## Features

- **Hustle Button**: Click to earn startup dollars
- **Upgrade System**: Purchase startup upgrades (Coffee Machine, Standing Desk, Pitch Deck, Co-founder, Seed Round, Series A, AI Pivot, Unicorn Status)
- **Hire Team**: Build your team (Intern, Junior Dev, Growth Hacker, VP of Vibes, Board Member, AI Agent)
- **Stage Progression**: Watch your startup grow from Garage to Coworking to Small Office to HQ Campus to Unicorn to the Moon!
- **Currency Tiers**: Progress through Dollars, Thousands, Millions, and Unicorn Bucks

## Architecture

```
ChatGPT <-> MCP Server (Cloudflare Worker) <-> Game State
              |
         Widget (iframe)
```

## Key URLs After Deployment

| Purpose | URL Pattern |
|---------|-------------|
| MCP Endpoint | `https://your-worker.workers.dev/mcp` |
| Privacy Policy | `https://your-worker.workers.dev/privacy-policy` |
| Terms | `https://your-worker.workers.dev/terms` |
| Widget | `https://your-worker.workers.dev/widget` |

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Game Mechanics

### Upgrades (Multipliers)
| Name | Cost | Effect |
|------|------|--------|
| Coffee Machine | $50 | 2x earnings |
| Standing Desk | $200 | 3x earnings |
| Pitch Deck | $500 | 5x earnings |
| Co-founder | $2,000 | 8x earnings |
| Seed Round | $10,000 | 15x earnings |
| Series A | $50,000 | 30x earnings |
| AI Pivot | $200,000 | 50x earnings |
| Unicorn Status | $1,000,000 | 100x earnings |

### Team Members (Passive Income)
| Name | Cost | Income |
|------|------|--------|
| Intern | $100 | $1/s |
| Junior Dev | $500 | $5/s |
| Growth Hacker | $2,500 | $20/s |
| VP of Vibes | $10,000 | $50/s |
| Board Member | $50,000 | $150/s |
| AI Agent | $250,000 | $500/s |

## Cost

| Service | Cost |
|---------|------|
| Cloudflare Workers | Free (100k requests/day) |
| OpenAI App Submission | Free |

**Total: $0**

## License

MIT


## OpenAI App Submission
Submitted to ChatGPT App Directory
