const api = (path, opts = {}) => fetch(path, opts).then(r => r.json());

let currentUser = null;

function qs(sel) { return document.querySelector(sel); }

async function refreshMarket() {
  const data = await api('/api/market');
  const tbody = qs('#marketTable tbody');
  tbody.innerHTML = '';
  const select = qs('#tradeSymbol');
  select.innerHTML = '';
  data.stocks.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.symbol}</td><td>${s.name}</td><td>$${s.price.toFixed(2)}</td><td><button data-symbol="${s.symbol}" class="buy">Buy</button> <button data-symbol="${s.symbol}" class="sell secondary">Sell</button></td>`;
    tbody.appendChild(tr);

    const opt = document.createElement('option');
    opt.value = s.symbol; opt.textContent = `${s.symbol} — $${s.price.toFixed(2)}`;
    select.appendChild(opt);
  });

  // bind quick buy/sell
  document.querySelectorAll('button.buy').forEach(b => b.addEventListener('click', async (e) => {
    const sym = e.target.dataset.symbol;
    qs('#tradeSymbol').value = sym;
    await doTrade('buy');
  }));
  document.querySelectorAll('button.sell').forEach(b => b.addEventListener('click', async (e) => {
    const sym = e.target.dataset.symbol;
    qs('#tradeSymbol').value = sym;
    await doTrade('sell');
  }));
}

async function refreshPortfolio() {
  const res = await api(`/api/portfolio?user=${encodeURIComponent(currentUser)}`);
  const p = res.portfolio;
  qs('#cash').textContent = `Cash: $${p.cash.toFixed(2)}`;
  const tbody = qs('#holdingsTable tbody'); tbody.innerHTML = '';
  Object.keys(p.holdings).forEach(sym => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${sym}</td><td>${p.holdings[sym]}</td>`;
    tbody.appendChild(tr);
  });
  const history = qs('#historyList'); history.innerHTML = '';
  p.history.slice(0,20).forEach(h => {
    const li = document.createElement('li');
    const d = new Date(h.time);
    li.textContent = `${h.action.toUpperCase()} ${h.qty} ${h.symbol} @ $${h.price.toFixed(2)} (${d.toLocaleString()})`;
    history.appendChild(li);
  });
}

async function refreshLeaderboard() {
  const res = await api('/api/leaderboard');
  const tbody = qs('#leaderboardTable tbody');
  tbody.innerHTML = '';
  res.leaderboard.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx+1}</td><td>${row.user}</td><td>$${row.value.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

async function doTrade(action) {
  const symbol = qs('#tradeSymbol').value;
  const qty = parseInt(qs('#tradeQty').value, 10) || 1;
  const resp = await fetch('/api/trade', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: currentUser, symbol, action, qty })
  }).then(r => r.json());
  if (resp.error) {
    qs('#tradeMsg').textContent = resp.error;
    return;
  }
  qs('#tradeMsg').textContent = `Executed ${action} ${qty} ${symbol}`;
  await refreshPortfolio();
}

qs('#btnLogin').addEventListener('click', async () => {
  const name = qs('#username').value.trim();
  if (!name) return alert('Enter a nickname');
  currentUser = name;
  qs('#login').classList.add('hidden');
  qs('#dashboard').classList.remove('hidden');
  await refreshMarket();
  await refreshPortfolio();
  await refreshLeaderboard();
  setInterval(refreshMarket, 3000);
  setInterval(refreshLeaderboard, 5000);
});

qs('#buyBtn').addEventListener('click', () => doTrade('buy'));
qs('#sellBtn').addEventListener('click', () => doTrade('sell'));
