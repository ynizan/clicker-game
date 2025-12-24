# ChatGPT Clicker Game - Complete Build & Submit Guide

## Overview

This package contains three instruction sets for building and publishing a clicker game as a ChatGPT App:

| Document | Who Uses It | Purpose |
|----------|-------------|---------|
| `1-claude-code-build-instructions.md` | Claude Code | Build the MCP server and game widget |
| `2-cloudflare-setup-instructions.md` | AI Browser | Deploy to Cloudflare Workers |
| `3-chatgpt-submission-instructions.md` | AI Browser | Submit to ChatGPT App Directory |

## Quick Answers

### Do I need a custom domain?
**No.** Cloudflare Workers provides a free `*.workers.dev` subdomain with HTTPS. This works perfectly for ChatGPT Apps.

### What's the architecture?

```
ChatGPT ←→ Your MCP Server (Cloudflare Worker) ←→ Game State
              ↓
         Widget (iframe)
```

### What does the app do?
- Click button to earn points
- Buy multiplier upgrades (2x, 3x, etc.)
- Buy auto-clickers that earn passively
- All state managed server-side

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Claude Code builds the app                              │
│   - MCP server with game logic                                  │
│   - Widget HTML for UI                                          │
│   - Privacy policy & terms pages                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: AI Browser deploys to Cloudflare                        │
│   - Create Cloudflare account (or use existing)                 │
│   - Deploy worker                                               │
│   - Get your *.workers.dev URL                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Test in ChatGPT Developer Mode                          │
│   - Add as connector                                            │
│   - Verify widget loads                                         │
│   - Test all game functions                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: AI Browser submits to ChatGPT                           │
│   - Create assets (icon, screenshots, video)                    │
│   - Fill submission form                                        │
│   - Complete domain verification                                │
│   - Submit for review                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Key URLs After Deployment

| Purpose | URL Pattern |
|---------|-------------|
| MCP Endpoint | `https://chatgpt-clicker-game.<account>.workers.dev/mcp` |
| Privacy Policy | `https://chatgpt-clicker-game.<account>.workers.dev/privacy-policy` |
| Terms | `https://chatgpt-clicker-game.<account>.workers.dev/terms` |
| Verification | `https://chatgpt-clicker-game.<account>.workers.dev/.well-known/openai-apps-challenge` |

## Requirements Summary

### Technical
- Cloudflare account (free)
- OpenAI Platform account (verified)
- HTTPS endpoint (provided by Cloudflare)

### Assets for Submission
- SVG icon (64x64)
- Screenshots (706px wide, 400-860px height)
- Demo video (hosted on same domain)
- Privacy policy page
- Terms of service page

### No Custom Domain Needed
The free `*.workers.dev` subdomain satisfies all requirements.

## Cost

| Service | Cost |
|---------|------|
| Cloudflare Workers | Free (100k requests/day) |
| OpenAI App Submission | Free |
| Custom Domain | Not required |

**Total: $0**

## Timeline

1. **Build** (Claude Code): ~30 minutes
2. **Deploy** (Cloudflare): ~15 minutes  
3. **Test**: ~30 minutes
4. **Submit**: ~1 hour (including assets)
5. **Review**: Days to weeks (OpenAI's process)

## Next Steps

1. Give `1-claude-code-build-instructions.md` to Claude Code
2. Give `2-cloudflare-setup-instructions.md` to your AI browser
3. Test the deployed app in ChatGPT Developer Mode
4. Give `3-chatgpt-submission-instructions.md` to your AI browser

Good luck with your ChatGPT App! 🎮
