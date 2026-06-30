const API_URL = CONFIG.API_URL;
const MODEL = CONFIG.MODEL;

// ── PAGE WIP ──
function showWip(pageName, el) {
  document.querySelectorAll('.sidebar-icon').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('input-zone').style.display = 'none';
  document.getElementById('chat-area').innerHTML = `
    <div class="wip-screen">
      <div class="wip-chart">
        <div class="wip-bar"></div><div class="wip-bar"></div><div class="wip-bar"></div>
        <div class="wip-bar"></div><div class="wip-bar"></div><div class="wip-bar"></div>
        <div class="wip-bar"></div>
      </div>
      <div>
        <div class="wip-title">${pageName} — bientôt disponible</div>
        <p class="wip-sub">
          Nos équipes sont à pied d'œuvre pour vous livrer cette fonctionnalité.<br>
          Revenez très bientôt — les marchés n'attendent pas, nous non plus.
        </p>
      </div>
      <div class="wip-badge">
        <div class="wip-dot"></div>
        Développement en cours
      </div>
    </div>
  `;
}

function showChat() {
  document.querySelectorAll('.sidebar-icon').forEach((el, i) => el.classList.toggle('active', i === 0));
  document.getElementById('input-zone').style.display = '';
  newChat();
}

// ── DATE DYNAMIQUE ──
function updateDate() {
  document.getElementById('topbar-date').textContent =
    new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
updateDate();

// ── DONNÉES FINANCIÈRES EN DIRECT ──
function setKpi(id, chgId, value, change) {
  const el = document.getElementById(id);
  const chgEl = document.getElementById(chgId);
  if (el) el.textContent = value;
  if (chgEl) {
    const isUp = change >= 0;
    chgEl.textContent = `${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${change.toFixed(2)}%`;
    chgEl.className = 'kpi-change ' + (isUp ? 'up' : 'down');
  }
}

function setKpiError(id, chgId) {
  const el = document.getElementById(id);
  const chgEl = document.getElementById(chgId);
  if (el) el.textContent = 'N/A';
  if (chgEl) { chgEl.textContent = '—'; chgEl.className = 'kpi-change'; }
}

async function fetchYahoo(symbol) {
  const proxy = 'https://corsproxy.io/?url=';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(proxy + encodeURIComponent(url));
  if (!res.ok) throw new Error('Yahoo fetch failed');
  const data = await res.json();
  const meta = data.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose;
  return { price, change: ((price - prev) / prev) * 100 };
}

async function loadMarketData() {
  try {
    const { price, change } = await fetchYahoo('^FCHI');
    setKpi('kpi-cac', 'kpi-cac-chg',
      price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change);
  } catch { setKpiError('kpi-cac', 'kpi-cac-chg'); }

  try {
    const { price, change } = await fetchYahoo('^GSPC');
    setKpi('kpi-sp', 'kpi-sp-chg',
      price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), change);
  } catch { setKpiError('kpi-sp', 'kpi-sp-chg'); }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
    const data = await res.json();
    document.getElementById('kpi-eur').textContent = data.rates.USD.toFixed(4);
    const chgEl = document.getElementById('kpi-eur-chg');
    chgEl.textContent = 'Temps réel';
    chgEl.className = 'kpi-label';
  } catch { setKpiError('kpi-eur', 'kpi-eur-chg'); }
}

loadMarketData();
setInterval(loadMarketData, 60000);

// ── CHAT ──
let messages = [];
let isTyping = false;

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function nowTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function hideWelcome() {
  const w = document.getElementById('welcome-screen');
  if (w) w.remove();
  const chips = document.getElementById('chip-suggestions');
  if (chips) chips.style.display = 'none';
}

function addMessage(role, content) {
  hideWelcome();
  const area = document.getElementById('chat-area');
  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  const avatarHTML = role === 'bot'
    ? `<div class="msg-avatar bot"><svg viewBox="0 0 24 24" fill="white"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div>`
    : `<div class="msg-avatar user"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
  row.innerHTML = `${avatarHTML}<div><div class="message-bubble">${content}</div><div class="message-time">${nowTime()}</div></div>`;
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
  return row;
}

function showTyping() {
  const area = document.getElementById('chat-area');
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.id = 'typing-row';
  row.innerHTML = `
    <div class="msg-avatar bot"><svg viewBox="0 0 24 24" fill="white"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div>
    <div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>
  `;
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-row');
  if (t) t.remove();
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || isTyping) return;

  input.value = '';
  input.style.height = 'auto';
  isTyping = true;
  document.getElementById('send-btn').disabled = true;

  addMessage('user', text);
  messages.push({ role: 'user', content: text });
  showTyping();

  try {
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant:';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    removeTyping();
    const bubbleRow = addMessage('bot', '');
    const bubble = bubbleRow.querySelector('.message-bubble');
    let fullReply = '';

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullReply += data.response;
            bubble.innerHTML = marked.parse(fullReply);
            document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight;
          }
          if (data.done) break;
        } catch {}
      }
    }

    messages.push({ role: 'assistant', content: fullReply });
  } catch {
    removeTyping();
    addMessage('bot', `⚠️ Impossible de joindre le serveur d'inférence. Vérifiez que le serveur est démarré sur ${API_URL}`);
  }

  isTyping = false;
  document.getElementById('send-btn').disabled = false;
}

function sendSuggestion(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

function newChat() {
  messages = [];
  isTyping = false;
  document.getElementById('send-btn').disabled = false;
  document.getElementById('chat-area').innerHTML = `
    <div class="welcome" id="welcome-screen">
      <div class="welcome-icon">
        <svg viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7 14v1a1 1 0 0 0 2 0v-1H7zm8 0v1a1 1 0 0 0 2 0v-1h-2zM3 20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1H3v1z"/></svg>
      </div>
      <div>
        <h1>Bonjour, je suis FinBot</h1>
        <p>Votre assistant financier spécialisé. Posez-moi vos questions sur les marchés, les investissements, la fiscalité ou l'économie.</p>
      </div>
      <div class="suggestion-grid">
        <div class="suggestion-card" onclick="sendSuggestion('Comment les taux d\\'intérêt de la BCE impactent-ils les prix des obligations ?')">
          <div class="suggestion-card-icon">📈</div>
          <div class="suggestion-card-text">Impact des taux BCE sur les obligations</div>
          <div class="suggestion-card-sub">Taux d'intérêt & marchés</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('Quelles sont les différences entre les 4 structures de marché en économie ?')">
          <div class="suggestion-card-icon">🏛️</div>
          <div class="suggestion-card-text">Les 4 structures de marché en économie</div>
          <div class="suggestion-card-sub">Microéconomie</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('Comment diversifier un portefeuille pour réduire les risques ?')">
          <div class="suggestion-card-icon">💼</div>
          <div class="suggestion-card-text">Diversifier son portefeuille</div>
          <div class="suggestion-card-sub">Gestion de risque</div>
        </div>
        <div class="suggestion-card" onclick="sendSuggestion('Comment calculer les mensualités d\\'un prêt immobilier ?')">
          <div class="suggestion-card-icon">🏠</div>
          <div class="suggestion-card-text">Calculer ses mensualités immobilières</div>
          <div class="suggestion-card-sub">Prêt & hypothèque</div>
        </div>
      </div>
    </div>
  `;
  const chips = document.getElementById('chip-suggestions');
  if (chips) chips.style.display = 'flex';
}
