const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Load or initialize data
let state = {
  users: {},
  market: {
    stocks: [
      { symbol: 'AAPL', name: 'Apple', price: 175.00 },
      { symbol: 'GOOGL', name: 'Alphabet', price: 135.00 },
      { symbol: 'AMZN', name: 'Amazon', price: 110.00 },
      { symbol: 'TSLA', name: 'Tesla', price: 220.00 },
      { symbol: 'NFLX', name: 'Netflix', price: 320.00 }
    ]
  }
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      state = Object.assign(state, parsed);
      console.log('Loaded data from', DATA_FILE);
    } else {
      saveData();
    }
  } catch (err) {
    console.error('Failed to load data', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data', err);
  }
}

loadData();

// Simulate market price changes every 2 seconds
setInterval(() => {
  state.market.stocks.forEach(s => {
    const changePct = (Math.random() - 0.5) * 0.04; // +/-2%
    s.price = Math.max(1, +(s.price * (1 + changePct)).toFixed(2));
  });
}, 2000);

// APIs
app.get('/api/market', (req, res) => {
  res.json({ stocks: state.market.stocks });
});

app.get('/api/portfolio', (req, res) => {
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'user query param required' });
  let u = state.users[user];
  if (!u) {
    u = { cash: 10000, holdings: {}, history: [] };
    state.users[user] = u;
    saveData();
  }
  res.json({ user, portfolio: u });
});

app.post('/api/trade', (req, res) => {
  const { user, symbol, action, qty } = req.body;
  if (!user || !symbol || !action || !qty) return res.status(400).json({ error: 'missing fields' });
  const u = state.users[user] || (state.users[user] = { cash: 10000, holdings: {}, history: [] });
  const stock = state.market.stocks.find(s => s.symbol === symbol);
  if (!stock) return res.status(400).json({ error: 'unknown symbol' });
  const price = stock.price;
  const quantity = Math.abs(parseInt(qty, 10));
  const total = +(price * quantity).toFixed(2);

  if (action === 'buy') {
    if (u.cash < total) return res.status(400).json({ error: 'insufficient cash' });
    u.cash = +(u.cash - total).toFixed(2);
    u.holdings[symbol] = (u.holdings[symbol] || 0) + quantity;
    u.history.unshift({ action: 'buy', symbol, qty: quantity, price, total, time: Date.now() });
  } else if (action === 'sell') {
    if ((u.holdings[symbol] || 0) < quantity) return res.status(400).json({ error: 'insufficient holdings' });
    u.holdings[symbol] = (u.holdings[symbol] || 0) - quantity;
    u.cash = +(u.cash + total).toFixed(2);
    u.history.unshift({ action: 'sell', symbol, qty: quantity, price, total, time: Date.now() });
  } else {
    return res.status(400).json({ error: 'invalid action' });
  }

  saveData();
  res.json({ user, portfolio: u });
});

// Leaderboard: compute total value (cash + holdings at current market prices)
app.get('/api/leaderboard', (req, res) => {
  const list = Object.entries(state.users).map(([name, u]) => {
    let total = u.cash || 0;
    for (const sym of Object.keys(u.holdings || {})) {
      const stock = state.market.stocks.find(s => s.symbol === sym);
      const price = stock ? stock.price : 0;
      total += (u.holdings[sym] || 0) * price;
    }
    return { user: name, value: +total.toFixed(2) };
  });
  list.sort((a, b) => b.value - a.value);
  res.json({ leaderboard: list.slice(0, 20) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock-sim server running on http://localhost:${PORT}`);
});
