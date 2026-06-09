# StockSim — Trading Simulator for Teens

Simple full-stack trading simulator (backend + static frontend) for learning how markets and trades work. No real money.

Prerequisites
- Node.js (14+)

Quick start
1. Open a terminal in the project folder:

```bash
cd "Class XI/Programming/IIT Workshop for coding/stock-sim"
npm install
npm start
```

2. Open http://localhost:3000 in your browser.

How it works
- Backend: `server.js` — an Express server that simulates stock prices and provides simple APIs for market data and trades. Data persisted in `data.json`.
- Frontend: static SPA in `public/` — simple UI to pick a nickname, view market, buy/sell, and see portfolio/history.

Notes
- This is for practice only — keep it fun and safe for teens. No authentication; usernames are simple nicknames.
