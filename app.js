(() => {
  "use strict";

  // ---------- Configuração ----------
  const STORAGE_KEY = "fluxo-financas-v1";

  const CATEGORIES = {
    expense: [
      { id: "alimentacao", name: "Alimentação", icon: "🍔", color: "#fb923c" },
      { id: "moradia", name: "Moradia", icon: "🏠", color: "#8b5cf6" },
      { id: "transporte", name: "Transporte", icon: "🚗", color: "#60a5fa" },
      { id: "contas", name: "Contas", icon: "💡", color: "#fbbf24" },
      { id: "lazer", name: "Lazer", icon: "🎮", color: "#f472b6" },
      { id: "saude", name: "Saúde", icon: "💊", color: "#34d399" },
      { id: "educacao", name: "Educação", icon: "📚", color: "#22d3ee" },
      { id: "compras", name: "Compras", icon: "🛍️", color: "#e879f9" },
      { id: "assinaturas", name: "Assinaturas", icon: "📺", color: "#a78bfa" },
      { id: "outros", name: "Outros", icon: "📦", color: "#94a3b8" },
    ],
    income: [
      { id: "salario", name: "Salário", icon: "💼", color: "#34d399" },
      { id: "freelance", name: "Freelance", icon: "💻", color: "#22d3ee" },
      { id: "investimentos", name: "Investimentos", icon: "📈", color: "#8b5cf6" },
      { id: "presente", name: "Presente", icon: "🎁", color: "#f472b6" },
      { id: "outras-receitas", name: "Outros", icon: "💰", color: "#fbbf24" },
    ],
  };
  const ALL_CATS = [...CATEGORIES.expense, ...CATEGORIES.income];
  const catById = (id) => ALL_CATS.find((c) => c.id === id) || CATEGORIES.expense.at(-1);
  const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "📱", "🛟", "🎓", "💍", "🏖️", "🎮", "👶", "🐶", "🏋️", "🎸", "💰"];

  // ---------- Utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmt = (n) => brl.format(n);
  const fmtShort = (n) => (Math.abs(n) >= 1000 ? "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : fmt(n));
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const shiftMonth = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const monthName = (d) => d.toLocaleDateString("pt-BR", { month: "long" });
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Aceita "1.234,56", "1234.56", "R$ 1234,5"
  function parseMoney(str) {
    let s = String(str ?? "").trim().replace(/[^\d,.-]/g, "");
    if (!s) return NaN;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, "");
    return Math.round(parseFloat(s) * 100) / 100;
  }
  const moneyToInput = (n) => (n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

  const bridge = window.AndroidBridge;
  const IS_APP = !!bridge;
  if (IS_APP) document.body.classList.add("in-app");

  // ---------- Estado ----------
  function normalize(data = {}) {
    return {
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      budgets: data.budgets && typeof data.budgets === "object" ? data.budgets : {},
      settings: { name: "", hide: false, haptics: true, ...(data.settings || {}) },
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* armazenamento indisponível */ }
    return null;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }

  let state = load();
  const firstRun = !state;
  if (!state) state = normalize();

  let viewMonth = shiftMonth(new Date(), 0);
  let currentTab = "home";
  let typeFilter = "all";
  let searchTerm = "";

  function demoData() {
    const tx = [];
    const now = new Date();
    const add = (monthsAgo, day, type, desc, amount, category) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
      if (d > now) return;
      tx.push({ id: uid(), type, desc, amount, category, date: toISO(d) });
    };
    for (let m = 5; m >= 0; m--) {
      const v = 1 + Math.sin(m * 1.7) * 0.12;
      add(m, 5, "income", "Salário", 6200, "salario");
      if (m % 2 === 0) add(m, 18, "income", "Projeto freelance", Math.round(1400 * v), "freelance");
      if (m % 3 === 1) add(m, 22, "income", "Dividendos", Math.round(320 * v), "investimentos");
      add(m, 6, "expense", "Aluguel", 1850, "moradia");
      add(m, 8, "expense", "Supermercado", Math.round(780 * v), "alimentacao");
      add(m, 21, "expense", "Feira e padaria", Math.round(240 * v), "alimentacao");
      add(m, 10, "expense", "Conta de luz", Math.round(190 * v), "contas");
      add(m, 11, "expense", "Internet", 119.9, "contas");
      add(m, 3, "expense", "Combustível", Math.round(330 * v), "transporte");
      add(m, 16, "expense", "Uber", Math.round(86 * v), "transporte");
      add(m, 12, "expense", "Streaming", 55.9, "assinaturas");
      add(m, 14, "expense", "Academia", 129.9, "saude");
      add(m, 19, "expense", "Restaurante", Math.round(210 * v), "lazer");
      if (m % 2 === 1) add(m, 25, "expense", "Cinema e bar", Math.round(160 * v), "lazer");
      if (m % 2 === 0) add(m, 24, "expense", "Roupas", Math.round(380 * v), "compras");
      add(m, 2, "expense", "Curso online", 89, "educacao");
    }
    return normalize({
      transactions: tx,
      goals: [
        { id: uid(), name: "Reserva de emergência", emoji: "🛟", target: 20000, saved: 13600 },
        { id: uid(), name: "Viagem para o Japão", emoji: "✈️", target: 18000, saved: 5400 },
        { id: uid(), name: "Notebook novo", emoji: "💻", target: 7000, saved: 7000 },
      ],
      budgets: { alimentacao: 1200, lazer: 400, transporte: 450, compras: 300 },
      settings: state.settings,
    });
  }

  // ---------- Cálculos ----------
  const inMonth = (t, key) => t.date.slice(0, 7) === key;
  function monthTotals(key, untilDay = 31) {
    let income = 0, expense = 0;
    for (const t of state.transactions) {
      if (!inMonth(t, key) || Number(t.date.slice(8, 10)) > untilDay) continue;
      if (t.type === "income") income += t.amount; else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }
  function balanceUntil(key) {
    let b = 0;
    for (const t of state.transactions) {
      if (t.date.slice(0, 7) > key) continue;
      b += t.type === "income" ? t.amount : -t.amount;
    }
    return b;
  }
  function expenseByCategory(key) {
    const map = {};
    for (const t of state.transactions) {
      if (t.type !== "expense" || !inMonth(t, key)) continue;
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).map(([id, value]) => ({ cat: catById(id), value })).sort((a, b) => b.value - a.value);
  }
  const monthTx = (key) => state.transactions.filter((t) => inMonth(t, key)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const isCurrentMonth = () => monthKey(viewMonth) === monthKey(new Date());

  // ---------- Animações de número ----------
  const counters = new WeakMap();
  function animateValue(el, to, formatter = fmt, duration = 900) {
    const from = counters.get(el) ?? 0;
    counters.set(el, to);
    if (from === to) { el.textContent = formatter(to); return; }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = formatter(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const nextFrame = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));
  function growBars(root) {
    nextFrame(() => {
      $$("[data-w]", root).forEach((s) => (s.style.width = s.dataset.w + "%"));
      $$("[data-p]", root).forEach((s) => s.style.setProperty("--p", s.dataset.p));
    });
  }

  function haptic(ms = 8) {
    if (!state.settings.haptics) return;
    try {
      if (IS_APP && bridge.vibrate) bridge.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* sem vibração */ }
  }

  // ---------- Renderização ----------
  function renderAll() {
    renderHeader();
    renderHome();
    renderTx();
    renderGoals();
    if (currentTab === "stats") renderStats();
  }

  function renderHeader() {
    const h = new Date().getHours();
    $("#greeting").textContent = h < 5 ? "Boa madrugada 🌌" : h < 12 ? "Bom dia ☀️" : h < 18 ? "Boa tarde 🌤️" : "Boa noite 🌙";
    const name = state.settings.name.trim();
    $("#userName").textContent = name ? `Olá, ${name.split(" ")[0]}` : "Olá!";
    $("#avatar").textContent = (name[0] || "F").toUpperCase();
    document.body.classList.toggle("privacy", !!state.settings.hide);

    const raw = viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const label = raw.charAt(0).toUpperCase() + raw.slice(1) + (isCurrentMonth() ? '<i class="today-dot"></i>' : "");
    const el = $("#monthLabel");
    if (el.innerHTML !== label) {
      el.classList.add("swap");
      setTimeout(() => { el.innerHTML = label; el.classList.remove("swap"); }, 140);
    }
  }

  function txItem(t, showDate) {
    const c = catById(t.category);
    const d = parseISO(t.date);
    const sub = showDate ? `${c.name} · ${d.getDate()} ${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}` : c.name;
    return `
      <li class="tx" data-id="${t.id}">
        <div class="tx-del"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>Excluir</div>
        <div class="tx-inner">
          <div class="tx-ico" style="background:${c.color}1f">${c.icon}</div>
          <div class="tx-info"><strong>${escapeHTML(t.desc)}</strong><small>${sub}</small></div>
          <div class="tx-amt ${t.type} money">${t.type === "income" ? "+" : "−"} ${fmt(t.amount)}</div>
        </div>
      </li>`;
  }

  const emptyHTML = (art, text, btn) =>
    `<li class="empty"><div class="empty-art">${art}</div><p>${text}</p>${btn ? `<button class="btn ghost sm" data-open="tx">${btn}</button>` : ""}</li>`;

  function insight() {
    const key = monthKey(viewMonth);
    if (!state.transactions.length) return { ico: "👋", cls: "", html: "Toque no <strong>+</strong> lá embaixo para registrar sua primeira movimentação." };

    const spent = Object.fromEntries(expenseByCategory(key).map((r) => [r.cat.id, r.value]));
    const budgets = Object.entries(state.budgets).map(([id, limit]) => ({ cat: catById(id), limit, spent: spent[id] || 0 }));
    const over = budgets.filter((b) => b.spent > b.limit).sort((a, b) => b.spent - b.limit - (a.spent - a.limit))[0];
    if (over) return { ico: "🚨", cls: "bad", html: `Você passou <strong>${fmt(over.spent - over.limit)}</strong> do limite de <strong>${over.cat.name}</strong> este mês.` };

    const day = isCurrentMonth() ? new Date().getDate() : 31;
    const cur = monthTotals(key, day);
    const prevDate = shiftMonth(viewMonth, -1);
    const prev = monthTotals(monthKey(prevDate), day);
    const when = isCurrentMonth() ? `no mesmo período de ${monthName(prevDate)}` : `em ${monthName(prevDate)}`;
    if (cur.expense && prev.expense) {
      const d = ((cur.expense - prev.expense) / prev.expense) * 100;
      if (d <= -5) return { ico: "👏", cls: "good", html: `Você gastou <strong>${Math.abs(d).toFixed(0)}% menos</strong> que ${when}. Mandou bem!` };
      if (d >= 10) return { ico: "📈", cls: "bad", html: `Seus gastos estão <strong>${d.toFixed(0)}% maiores</strong> que ${when}.` };
    }
    const near = budgets.filter((b) => b.spent / b.limit >= 0.8).sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
    if (near) return { ico: "⚠️", cls: "", html: `Você já usou <strong>${((near.spent / near.limit) * 100).toFixed(0)}%</strong> do limite de <strong>${near.cat.name}</strong>.` };

    const all = monthTotals(key);
    const top = expenseByCategory(key)[0];
    if (top) return { ico: top.cat.icon, cls: "", html: `Seu maior gasto do mês é <strong>${top.cat.name}</strong>: <span class="money">${fmt(top.value)}</span> (${((top.value / all.expense) * 100).toFixed(0)}% do total).` };
    if (all.income) return { ico: "🎉", cls: "good", html: "Nenhum gasto registrado neste mês. Continue assim!" };
    return { ico: "📅", cls: "", html: "Nenhuma movimentação neste mês ainda. Toque no <strong>+</strong> para adicionar." };
  }

  function renderHome() {
    const key = monthKey(viewMonth);
    const t = monthTotals(key);
    animateValue($("#heroBalance"), balanceUntil(key));
    animateValue($("#heroIncome"), t.income);
    animateValue($("#heroExpense"), t.expense);

    const ins = insight();
    const el = $("#insight");
    el.className = `insight ${ins.cls}`;
    el.innerHTML = `<div class="insight-ico">${ins.ico}</div><p>${ins.html}</p>`;

    const rows = expenseByCategory(key);
    const max = rows[0]?.value || 1;
    $("#homeBars").innerHTML = rows.length
      ? rows.slice(0, 4).map((r) => `
          <li class="bar-row">
            <div class="bar-ico" style="background:${r.cat.color}1f">${r.cat.icon}</div>
            <div>
              <div class="bar-top"><span>${r.cat.name}</span><span class="money">${fmt(r.value)}</span></div>
              <div class="bar-track"><i style="background:${r.cat.color}" data-w="${(r.value / max) * 100}"></i></div>
            </div>
          </li>`).join("")
      : `<li class="list-empty">Sem gastos neste mês. 🌱</li>`;
    growBars($("#homeBars"));

    const recent = monthTx(key).slice(0, 5);
    $("#homeTx").innerHTML = recent.length ? recent.map((x) => txItem(x, true)).join("") : emptyHTML("🪙", "Nenhuma movimentação neste mês.", "Adicionar agora");

    const goals = state.goals.map((g) => {
      const p = clamp((g.saved / g.target) * 100 || 0, 0, 100);
      return `
        <button class="goal-card ${p >= 100 ? "done" : ""}" data-goal="${g.id}">
          <div class="mini-ring" data-p="${p}"><span>${escapeHTML(g.emoji || "🎯")}</span></div>
          <strong>${escapeHTML(g.name)}</strong>
          <small><span class="money">${fmtShort(g.saved)}</span> · ${p.toFixed(0)}%</small>
        </button>`;
    }).join("");
    $("#homeGoals").innerHTML = goals + `<button class="goal-card add" data-open="goal"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><small>Nova meta</small></button>`;
    growBars($("#homeGoals"));
  }

  function renderTx() {
    const key = monthKey(viewMonth);
    const t = monthTotals(key);
    $("#txSummary").innerHTML = `
      <div class="in"><small>Entradas</small><strong class="money">${fmt(t.income)}</strong></div>
      <div class="out"><small>Saídas</small><strong class="money">${fmt(t.expense)}</strong></div>`;

    const term = searchTerm.trim().toLowerCase();
    const list = monthTx(key)
      .filter((x) => typeFilter === "all" || x.type === typeFilter)
      .filter((x) => !term || x.desc.toLowerCase().includes(term) || catById(x.category).name.toLowerCase().includes(term));

    const today = toISO(new Date());
    const yesterday = toISO(new Date(Date.now() - 864e5));
    let html = "", last = "";
    for (const x of list) {
      if (x.date !== last) {
        last = x.date;
        const label = x.date === today ? "Hoje" : x.date === yesterday ? "Ontem"
          : parseISO(x.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        html += `<li class="tx-group">${label}</li>`;
      }
      html += txItem(x, false);
    }
    $("#txList").innerHTML = html || (term || typeFilter !== "all"
      ? emptyHTML("🔍", "Nada encontrado com esse filtro.")
      : emptyHTML("🪙", "Nenhuma movimentação neste mês.", "Adicionar agora"));
    $("#swipeHint").hidden = !list.length;
    $("#searchClear").hidden = !searchTerm;
  }

  function renderStats() {
    const key = monthKey(viewMonth);
    const t = monthTotals(key);
    const res = $("#statResult");
    res.className = `result-value money ${t.net > 0 ? "pos" : t.net < 0 ? "neg" : ""}`;
    animateValue(res, t.net, (v) => (v > 0 ? "+" : "") + fmt(v));
    $("#statResultHint").innerHTML = t.income || t.expense
      ? `Entrou <span class="money">${fmt(t.income)}</span> · saiu <span class="money">${fmt(t.expense)}</span>`
      : "Sem movimentações neste mês";
    const rate = t.income > 0 ? clamp((t.net / t.income) * 100, 0, 100) : 0;
    $("#savingsRing").style.setProperty("--p", rate);
    animateValue($("#savingsPct"), rate, (v) => `${v.toFixed(0)}%`);

    const rows = expenseByCategory(key);
    const total = rows.reduce((s, r) => s + r.value, 0);
    animateValue($("#donutTotal"), total, fmtShort);
    $("#catList").innerHTML = rows.length
      ? rows.map((r) => `
          <li><button data-cat-search="${r.cat.name}">
            <i class="sw" style="background:${r.cat.color}"></i>
            <span>${r.cat.icon} ${r.cat.name}</span>
            <span class="v money">${fmt(r.value)}</span>
            <span class="pc">${((r.value / total) * 100).toFixed(0)}%</span>
          </button></li>`).join("")
      : `<li class="list-empty" style="text-align:center">Nenhum gasto neste mês 🎉</li>`;

    renderCharts(rows);
    renderBudgets(rows);
  }

  function renderBudgets(rows) {
    const el = $("#budgetList");
    const entries = Object.entries(state.budgets);
    if (!entries.length) {
      el.innerHTML = `<li class="list-empty">Defina quanto quer gastar no máximo por categoria e acompanhe aqui. Toque no <strong>+</strong>.</li>`;
      return;
    }
    const spent = Object.fromEntries(rows.map((r) => [r.cat.id, r.value]));
    el.innerHTML = entries.map(([id, limit]) => {
      const c = catById(id);
      const s = spent[id] || 0;
      const pct = (s / limit) * 100;
      const cls = pct > 100 ? "over" : pct >= 80 ? "warn" : "";
      const left = limit - s;
      return `
        <li class="budget ${cls}" data-budget="${id}">
          <div class="bar-ico" style="background:${c.color}1f">${c.icon}</div>
          <div>
            <div class="bar-top"><strong>${c.name}</strong><span class="money">${fmt(s)} / ${fmt(limit)}</span></div>
            <div class="bar-track"><i data-w="${Math.min(100, pct)}"></i></div>
            <div class="budget-left">${left >= 0 ? `Ainda pode gastar <span class="money">${fmt(left)}</span>` : `Passou <span class="money">${fmt(-left)}</span> do limite`}</div>
          </div>
        </li>`;
    }).join("");
    growBars(el);
  }

  function renderGoals() {
    const saved = state.goals.reduce((s, g) => s + g.saved, 0);
    const target = state.goals.reduce((s, g) => s + g.target, 0);
    animateValue($("#goalsTotal"), saved);
    $("#goalsTrack").style.width = target ? `${clamp((saved / target) * 100, 0, 100)}%` : "0%";
    const done = state.goals.filter((g) => g.saved >= g.target).length;
    $("#goalsSub").innerHTML = state.goals.length
      ? `de <span class="money">${fmt(target)}</span> · ${done} de ${state.goals.length} ${state.goals.length === 1 ? "meta concluída" : "metas concluídas"}`
      : "Crie sua primeira meta abaixo";

    $("#goalList").innerHTML = state.goals.map((g, i) => {
      const p = clamp((g.saved / g.target) * 100 || 0, 0, 100);
      const ok = p >= 100;
      return `
        <li class="goal ${ok ? "done" : ""}" data-goal="${g.id}" style="animation-delay:${i * 50}ms">
          <div class="goal-top">
            <div class="goal-emoji">${escapeHTML(g.emoji || "🎯")}</div>
            <div class="goal-name"><strong>${escapeHTML(g.name)}</strong><small>${ok ? "Meta concluída! 🎉" : `Faltam <span class="money">${fmt(g.target - g.saved)}</span>`}</small></div>
            <div class="goal-pct">${p.toFixed(0)}%</div>
          </div>
          <div class="track"><span data-w="${p}"></span></div>
          <div class="goal-meta"><span class="money">${fmt(g.saved)}</span><span class="money">${fmt(g.target)}</span></div>
        </li>`;
    }).join("");
    growBars($("#goalList"));
  }

  // ---------- Gráficos ----------
  let flowChart, catChart;
  const chartReady = !!window.Chart;
  if (chartReady) {
    Chart.defaults.color = "#6b6b7d";
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.display = false;
    Object.assign(Chart.defaults.plugins.tooltip, {
      backgroundColor: "#1b1b26", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1,
      padding: 10, cornerRadius: 12, titleFont: { weight: "600" }, displayColors: false,
    });
  }
  const vGrad = (c, top, bottom) => {
    const { ctx, chartArea } = c.chart;
    if (!chartArea) return top;
    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    return g;
  };

  function renderCharts(rows) {
    if (!chartReady) return;
    const hide = state.settings.hide;
    const values = rows.length ? rows.map((r) => r.value) : [1];
    const colors = rows.length ? rows.map((r) => r.cat.color) : ["rgba(255,255,255,0.06)"];
    const labels = rows.length ? rows.map((r) => r.cat.name) : ["Sem gastos"];
    if (catChart) {
      catChart.data.labels = labels;
      catChart.data.datasets[0].data = values;
      catChart.data.datasets[0].backgroundColor = colors;
      catChart.options.plugins.tooltip.enabled = rows.length > 0 && !hide;
      catChart.update();
    } else {
      catChart = new Chart($("#catChart"), {
        type: "doughnut",
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 8, spacing: 4, hoverOffset: 8 }] },
        options: {
          cutout: "74%", responsive: true, maintainAspectRatio: false, layout: { padding: 6 },
          animation: { animateRotate: true, duration: 1100, easing: "easeOutQuart" },
          plugins: { tooltip: { enabled: rows.length > 0 && !hide, callbacks: { label: (c) => ` ${fmt(c.parsed)}` } } },
        },
      });
    }

    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(viewMonth, i - 5));
    const mLabels = months.map((d) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""));
    const totals = months.map((d) => monthTotals(monthKey(d)));
    if (flowChart) {
      flowChart.data.labels = mLabels;
      flowChart.data.datasets[0].data = totals.map((x) => x.income);
      flowChart.data.datasets[1].data = totals.map((x) => x.expense);
      flowChart.options.plugins.tooltip.enabled = !hide;
      flowChart.options.scales.y.ticks.display = !hide;
      flowChart.update();
    } else {
      const bar = { borderRadius: 7, borderSkipped: false, barPercentage: 0.75, categoryPercentage: 0.62 };
      flowChart = new Chart($("#flowChart"), {
        type: "bar",
        data: {
          labels: mLabels,
          datasets: [
            { ...bar, label: "Entradas", data: totals.map((x) => x.income), backgroundColor: (c) => vGrad(c, "#34d399", "rgba(52,211,153,0.15)") },
            { ...bar, label: "Saídas", data: totals.map((x) => x.expense), backgroundColor: (c) => vGrad(c, "#fb7185", "rgba(251,113,133,0.15)") },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 1000, easing: "easeOutQuart" },
          scales: {
            x: { grid: { display: false }, border: { display: false } },
            y: { grid: { color: "rgba(255,255,255,0.04)" }, border: { display: false }, ticks: { display: !hide, callback: (v) => fmtShort(v), maxTicksLimit: 5 } },
          },
          plugins: { tooltip: { enabled: !hide, callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
        },
      });
    }
  }

  // ---------- Navegação ----------
  const TABS = ["home", "tx", "stats", "goals"];
  function moveTabDot() {
    const t = $(`.tab[data-tab="${currentTab}"]`);
    $("#tabDot").style.transform = `translateX(${t.offsetLeft + t.offsetWidth / 2 - 9}px)`;
  }
  function go(tab) {
    if (tab === currentTab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const back = TABS.indexOf(tab) < TABS.indexOf(currentTab);
    currentTab = tab;
    $$(".screen").forEach((s) => {
      const on = s.dataset.screen === tab;
      s.classList.toggle("active", on);
      s.classList.toggle("back", on && back);
    });
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    $("#monthSwitch").classList.toggle("hidden", tab === "goals");
    moveTabDot();
    window.scrollTo(0, 0);
    if (tab === "stats") renderStats();
    else if (tab === "home") renderHome();
    else if (tab === "goals") renderGoals();
    haptic();
  }
  $("#tabbar").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) go(t.dataset.tab); });
  addEventListener("resize", moveTabDot);

  function setMonth(d) { viewMonth = shiftMonth(d, 0); renderAll(); haptic(); }
  $("#prevMonth").addEventListener("click", () => setMonth(shiftMonth(viewMonth, -1)));
  $("#nextMonth").addEventListener("click", () => setMonth(shiftMonth(viewMonth, 1)));
  $("#monthLabel").addEventListener("click", () => { if (!isCurrentMonth()) setMonth(new Date()); });

  // Swipe horizontal entre meses na tela inicial e extrato
  (() => {
    let x0 = null, y0 = 0;
    const main = $(".screens");
    main.addEventListener("touchstart", (e) => {
      if (e.target.closest(".tx, .goal-rail, .cat-rail, canvas") || currentTab === "goals") { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    main.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) setMonth(shiftMonth(viewMonth, dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  // ---------- Sheets ----------
  let openSheetEl = null;
  function openSheet(id) {
    if (openSheetEl) closeSheet();
    const s = $(id);
    s.style.transform = "";
    s.classList.add("open");
    s.scrollTop = 0;
    $("#backdrop").classList.add("show");
    document.body.classList.add("sheet-open");
    openSheetEl = s;
    haptic();
  }
  function closeSheet() {
    if (!openSheetEl) return;
    openSheetEl.classList.remove("open");
    openSheetEl.style.transform = "";
    openSheetEl = null;
    $("#backdrop").classList.remove("show");
    document.body.classList.remove("sheet-open");
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  $("#backdrop").addEventListener("click", closeSheet);

  // Arrastar a alça para fechar
  $$(".sheet").forEach((s) => {
    const g = $(".grab", s);
    let y0 = null, dy = 0;
    g.addEventListener("pointerdown", (e) => { y0 = e.clientY; dy = 0; s.classList.add("dragging"); g.setPointerCapture(e.pointerId); });
    g.addEventListener("pointermove", (e) => {
      if (y0 === null) return;
      dy = Math.max(0, e.clientY - y0);
      s.style.transform = `translate(-50%, ${dy}px)`;
    });
    const end = () => {
      if (y0 === null) return;
      y0 = null;
      s.classList.remove("dragging");
      if (dy > 100) closeSheet(); else s.style.transform = "";
    };
    g.addEventListener("pointerup", end);
    g.addEventListener("pointercancel", end);
  });

  // ---------- Diálogo de confirmação ----------
  let dialogResolve = null;
  function confirmDialog({ title, text, ok = "Confirmar", ico = "⚠️", danger = false }) {
    $("#dialogTitle").textContent = title;
    $("#dialogText").textContent = text;
    $("#dialogIco").textContent = ico;
    $("#dialogYes").textContent = ok;
    $("#dialog").classList.toggle("danger", danger);
    $("#dialog").classList.add("open");
    haptic(15);
    return new Promise((res) => (dialogResolve = res));
  }
  function closeDialog(v) {
    $("#dialog").classList.remove("open");
    if (dialogResolve) { dialogResolve(v); dialogResolve = null; }
  }
  $("#dialogYes").addEventListener("click", () => closeDialog(true));
  $("#dialogNo").addEventListener("click", () => closeDialog(false));
  $("#dialog").addEventListener("click", (e) => { if (e.target.id === "dialog") closeDialog(false); });

  // ---------- Movimentação (teclado numérico) ----------
  const tx = { editing: null, type: "expense", cat: null, cents: 0, date: "" };

  function openTx(t = null, type = "expense") {
    tx.editing = t;
    tx.type = t ? t.type : type;
    tx.cat = t ? t.category : null;
    tx.cents = t ? Math.round(t.amount * 100) : 0;
    tx.date = t ? t.date : toISO(new Date());
    $("#txDesc").value = t ? t.desc : "";
    $("#txDelete").hidden = !t;
    setTxType(tx.type);
    updateAmount();
    updateDate();
    openSheet("#txSheet");
  }

  function setTxType(type) {
    tx.type = type;
    $("#typeToggle").classList.toggle("income", type === "income");
    $$("#typeToggle button").forEach((b) => b.classList.toggle("active", b.dataset.type === type));
    if (!CATEGORIES[type].some((c) => c.id === tx.cat)) tx.cat = CATEGORIES[type][0].id;
    renderCatRail($("#txCats"), CATEGORIES[type], tx.cat);
    const btn = $("#txSave");
    btn.className = `btn primary block ${type}`;
    btn.textContent = tx.editing ? "Salvar alterações" : type === "income" ? "Adicionar receita" : "Adicionar despesa";
  }

  function renderCatRail(el, cats, active) {
    el.innerHTML = cats.map((c) =>
      `<button type="button" class="cat-tile ${c.id === active ? "active" : ""}" style="--c:${c.color}" data-cat="${c.id}"><em>${c.icon}</em><span>${c.name}</span></button>`).join("");
    const a = $(".cat-tile.active", el);
    if (a) nextFrame(() => { el.scrollLeft = a.offsetLeft - el.clientWidth / 2 + a.offsetWidth / 2; });
  }

  function updateAmount(bump) {
    const d = $("#amountDisplay");
    $("#amountText").textContent = fmt(tx.cents / 100);
    d.classList.toggle("zero", tx.cents === 0);
    if (bump) { d.classList.remove("bump"); void d.offsetWidth; d.classList.add("bump"); }
  }

  function pressKey(k) {
    const before = tx.cents;
    if (k === "back") tx.cents = Math.floor(tx.cents / 10);
    else if (k === "00") tx.cents *= 100;
    else tx.cents = tx.cents * 10 + Number(k);
    if (tx.cents > 9999999999) { tx.cents = before; shake($("#amountDisplay")); return; }
    updateAmount(true);
    haptic(6);
  }

  function updateDate() {
    const today = toISO(new Date());
    const yesterday = toISO(new Date(Date.now() - 864e5));
    $$("#dateRow [data-date]").forEach((b) => b.classList.toggle("active", (b.dataset.date === "today" && tx.date === today) || (b.dataset.date === "yesterday" && tx.date === yesterday)));
    const custom = tx.date !== today && tx.date !== yesterday;
    $("#datePick").classList.toggle("active", custom);
    $("#datePickLabel").textContent = custom ? parseISO(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }).replace(/\./g, "") : "Outra data";
    $("#txDate").value = tx.date;
  }

  $("#typeToggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setTxType(b.dataset.type); haptic(); } });
  $("#txCats").addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile"); if (!b) return;
    tx.cat = b.dataset.cat;
    $$("#txCats .cat-tile").forEach((c) => c.classList.toggle("active", c === b));
    haptic();
  });
  $("#keypad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pressKey(b.dataset.k); });
  $("#dateRow").addEventListener("click", (e) => {
    const b = e.target.closest("[data-date]"); if (!b) return;
    tx.date = b.dataset.date === "today" ? toISO(new Date()) : toISO(new Date(Date.now() - 864e5));
    updateDate(); haptic();
  });
  $("#txDate").addEventListener("change", (e) => { if (e.target.value) { tx.date = e.target.value; updateDate(); } });
  $("#txDesc").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });

  function saveTx() {
    if (tx.cents <= 0) { shake($("#amountDisplay")); toast("Digite um valor no teclado 👇"); haptic(30); return; }
    const desc = $("#txDesc").value.trim() || catById(tx.cat).name;
    const data = { type: tx.type, desc, amount: tx.cents / 100, category: tx.cat, date: tx.date };
    const wasEdit = !!tx.editing;
    if (tx.editing) Object.assign(tx.editing, data);
    else state.transactions.push({ id: uid(), ...data });
    save();
    closeSheet();
    viewMonth = shiftMonth(parseISO(tx.date), 0);
    renderAll();
    haptic(18);
    toast(wasEdit ? "Alterações salvas ✅" : tx.type === "income" ? `Receita de ${fmt(data.amount)} adicionada 💸` : `Despesa de ${fmt(data.amount)} registrada 🧾`);
  }
  $("#txSave").addEventListener("click", saveTx);
  $("#txDelete").addEventListener("click", () => { const id = tx.editing?.id; closeSheet(); if (id) deleteTx(id); });

  function deleteTx(id) {
    const idx = state.transactions.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const [removed] = state.transactions.splice(idx, 1);
    save();
    renderAll();
    haptic(20);
    toast("Movimentação excluída", "Desfazer", () => {
      state.transactions.splice(idx, 0, removed);
      save(); renderAll();
    });
  }

  // Teclado físico (computador)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { handleBack(); return; }
    if (openSheetEl?.id !== "txSheet" || e.target.matches("input")) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("back");
    else if (e.key === "Enter") saveTx();
  });

  // Toque em uma movimentação abre edição; arrastar para a esquerda exclui
  let suppressClick = false;
  function enableSwipe(list) {
    let row = null, inner = null, x0 = 0, y0 = 0, dx = 0, mode = null, pid = null, armed = false;
    list.addEventListener("pointerdown", (e) => {
      const r = e.target.closest(".tx");
      if (!r || e.button > 0) return;
      row = r; inner = $(".tx-inner", r); x0 = e.clientX; y0 = e.clientY; dx = 0; mode = null; pid = e.pointerId; armed = false;
    });
    list.addEventListener("pointermove", (e) => {
      if (!row || e.pointerId !== pid) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if (!mode) {
        if (Math.abs(my) > 8 && Math.abs(my) > Math.abs(mx)) { row = null; return; }
        if (mx < -8) { mode = "drag"; row.classList.add("dragging"); try { row.setPointerCapture(pid); } catch (err) { /* ok */ } }
        else return;
      }
      dx = Math.min(0, mx);
      inner.style.transform = `translateX(${dx}px)`;
      const past = dx < -threshold(row);
      if (past !== armed) { armed = past; haptic(12); }
    });
    const threshold = (r) => Math.min(130, r.offsetWidth * 0.35);
    const end = () => {
      if (!row) return;
      const r = row, inn = inner;
      row = null;
      if (mode !== "drag") return;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 60);
      r.classList.remove("dragging");
      if (dx < -threshold(r)) {
        inn.style.transform = "translateX(-105%)";
        r.classList.add("removing");
        setTimeout(() => deleteTx(r.dataset.id), 260);
      } else inn.style.transform = "";
    };
    list.addEventListener("pointerup", end);
    list.addEventListener("pointercancel", end);
    list.addEventListener("click", (e) => {
      if (suppressClick) return;
      const r = e.target.closest(".tx"); if (!r) return;
      const t = state.transactions.find((x) => x.id === r.dataset.id);
      if (t) openTx(t);
    });
  }
  enableSwipe($("#homeTx"));
  enableSwipe($("#txList"));

  // ---------- Extrato: filtros ----------
  function setFilter(f) {
    typeFilter = f;
    const btns = $$("#typeFilter button");
    btns.forEach((b, i) => {
      b.classList.toggle("active", b.dataset.filter === f);
      if (b.dataset.filter === f) $("#typeFilter .seg-pill").style.transform = `translateX(${i * 100}%)`;
    });
    renderTx();
  }
  $("#typeFilter").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setFilter(b.dataset.filter); haptic(); } });
  $("#search").addEventListener("input", (e) => { searchTerm = e.target.value; renderTx(); });
  $("#searchClear").addEventListener("click", () => { searchTerm = ""; $("#search").value = ""; renderTx(); });
  $("#catList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat-search]"); if (!b) return;
    searchTerm = b.dataset.catSearch; $("#search").value = searchTerm;
    setFilter("expense");
    go("tx");
  });

  // ---------- Metas ----------
  let editingGoal = null;
  let goalEmoji = GOAL_EMOJIS[0];
  function renderEmojiRail() {
    $("#emojiRail").innerHTML = GOAL_EMOJIS.map((e) => `<button type="button" class="${e === goalEmoji ? "active" : ""}" data-e="${e}">${e}</button>`).join("");
  }
  function openGoal(g = null) {
    editingGoal = g;
    goalEmoji = g?.emoji || GOAL_EMOJIS[0];
    if (!GOAL_EMOJIS.includes(goalEmoji)) GOAL_EMOJIS.unshift(goalEmoji);
    renderEmojiRail();
    $("#goalTitle").textContent = g ? "Editar meta" : "Nova meta";
    $("#goalDelete").hidden = !g;
    $("#goalName").value = g ? g.name : "";
    $("#goalTarget").value = g ? moneyToInput(g.target) : "";
    $("#goalSaved").value = g ? moneyToInput(g.saved) : "";
    openSheet("#goalSheet");
  }
  $("#emojiRail").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    goalEmoji = b.dataset.e;
    $$("#emojiRail button").forEach((x) => x.classList.toggle("active", x === b));
    haptic();
  });
  $("#goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#goalName").value.trim();
    const target = parseMoney($("#goalTarget").value);
    const saved = parseMoney($("#goalSaved").value) || 0;
    if (!name) { shake($("#goalName")); toast("Dê um nome para a meta"); return; }
    if (!(target > 0)) { shake($("#goalTarget")); toast("Informe quanto quer juntar"); return; }
    const wasDone = editingGoal && editingGoal.saved >= editingGoal.target;
    const data = { name, emoji: goalEmoji, target, saved: Math.max(0, saved) };
    if (editingGoal) Object.assign(editingGoal, data);
    else state.goals.push({ id: uid(), ...data });
    save(); closeSheet(); renderAll();
    if (data.saved >= target && !wasDone) celebrate(name);
    else toast(editingGoal ? "Meta atualizada ✅" : "Meta criada 🎯");
  });
  $("#goalDelete").addEventListener("click", async () => {
    const g = editingGoal; if (!g) return;
    if (!(await confirmDialog({ title: "Excluir meta?", text: `A meta "${g.name}" será removida.`, ok: "Excluir", ico: "🗑️", danger: true }))) return;
    const idx = state.goals.indexOf(g);
    state.goals.splice(idx, 1);
    save(); closeSheet(); renderAll();
    toast("Meta excluída", "Desfazer", () => { state.goals.splice(idx, 0, g); save(); renderAll(); });
  });

  let depositGoal = null;
  function openDeposit(g) {
    depositGoal = g;
    $("#depositEmoji").textContent = g.emoji || "🎯";
    $("#depositName").textContent = g.name;
    $("#depositInfo").innerHTML = `<span class="money">${fmt(g.saved)}</span> de <span class="money">${fmt(g.target)}</span>`;
    $("#depositAmount").value = "";
    $("#depositTrack").style.width = "0%";
    openSheet("#depositSheet");
    nextFrame(() => ($("#depositTrack").style.width = `${clamp((g.saved / g.target) * 100, 0, 100)}%`));
  }
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-goal]"); if (!card) return;
    const g = state.goals.find((x) => x.id === card.dataset.goal);
    if (g) openDeposit(g);
  });
  $("#depositEdit").addEventListener("click", () => { const g = depositGoal; closeSheet(); setTimeout(() => openGoal(g), 120); });
  $("#depositChips").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const cur = parseMoney($("#depositAmount").value) || 0;
    $("#depositAmount").value = moneyToInput(cur + Number(b.dataset.v));
    haptic();
  });
  function moveGoal(sign) {
    const v = parseMoney($("#depositAmount").value);
    if (!(v > 0)) { shake($("#depositAmount")); toast("Digite um valor"); return; }
    const g = depositGoal;
    if (sign < 0 && v > g.saved) { shake($("#depositAmount")); toast(`Você só tem ${fmt(g.saved)} nesta meta`); return; }
    const wasDone = g.saved >= g.target;
    g.saved = Math.round((g.saved + sign * v) * 100) / 100;
    save(); closeSheet(); renderAll();
    haptic(18);
    if (!wasDone && g.saved >= g.target) celebrate(g.name);
    else toast(sign > 0 ? `${fmt(v)} guardado em ${g.name} 🐷` : `${fmt(v)} retirado de ${g.name}`);
  }
  $("#depositForm").addEventListener("submit", (e) => { e.preventDefault(); moveGoal(1); });
  $("#withdrawBtn").addEventListener("click", () => moveGoal(-1));

  // ---------- Limites ----------
  let budgetCat = null;
  function openBudget(cat = null) {
    budgetCat = cat || CATEGORIES.expense.find((c) => !(c.id in state.budgets))?.id || CATEGORIES.expense[0].id;
    renderCatRail($("#budgetCats"), CATEGORIES.expense, budgetCat);
    $("#budgetLimit").value = moneyToInput(state.budgets[budgetCat]);
    $("#budgetDelete").hidden = !(budgetCat in state.budgets);
    openSheet("#budgetSheet");
  }
  $("#budgetCats").addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile"); if (!b) return;
    budgetCat = b.dataset.cat;
    $$("#budgetCats .cat-tile").forEach((c) => c.classList.toggle("active", c === b));
    $("#budgetLimit").value = moneyToInput(state.budgets[budgetCat]);
    $("#budgetDelete").hidden = !(budgetCat in state.budgets);
    haptic();
  });
  $("#budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = parseMoney($("#budgetLimit").value);
    if (!(v > 0)) { shake($("#budgetLimit")); toast("Informe o limite mensal"); return; }
    state.budgets[budgetCat] = v;
    save(); closeSheet(); renderAll();
    toast(`Limite de ${catById(budgetCat).name}: ${fmt(v)} por mês 💡`);
  });
  $("#budgetDelete").addEventListener("click", () => {
    delete state.budgets[budgetCat];
    save(); closeSheet(); renderAll();
    toast("Limite removido");
  });
  $("#budgetList").addEventListener("click", (e) => { const li = e.target.closest("[data-budget]"); if (li) openBudget(li.dataset.budget); });

  // Botões genéricos de abrir
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]"); if (!b) return;
    ({ tx: () => openTx(), goal: () => openGoal(), budget: () => openBudget() })[b.dataset.open]();
  });
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-goto]"); if (b) go(b.dataset.goto); });
  $(".quick").addEventListener("click", (e) => {
    const b = e.target.closest("[data-quick]"); if (!b) return;
    const q = b.dataset.quick;
    if (q === "income" || q === "expense") openTx(null, q);
    else if (q === "goal") openGoal();
    else openBudget();
  });
  $("#fab").addEventListener("click", () => (openSheetEl ? closeSheet() : openTx()));

  // ---------- Configurações ----------
  function openSettings() {
    $("#nameInput").value = state.settings.name;
    $("#hideToggle").checked = !!state.settings.hide;
    $("#hapticToggle").checked = !!state.settings.haptics;
    openSheet("#settingsSheet");
  }
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#helloBtn").addEventListener("click", openSettings);
  $("#nameInput").addEventListener("input", (e) => { state.settings.name = e.target.value; save(); renderHeader(); });
  $("#hideToggle").addEventListener("change", (e) => { state.settings.hide = e.target.checked; save(); renderHeader(); if (currentTab === "stats") renderStats(); });
  $("#hapticToggle").addEventListener("change", (e) => { state.settings.haptics = e.target.checked; save(); haptic(20); });
  $("#eyeBtn").addEventListener("click", () => {
    state.settings.hide = !state.settings.hide; save(); renderHeader(); haptic();
    if (currentTab === "stats") renderStats();
    toast(state.settings.hide ? "Valores escondidos 🙈" : "Valores visíveis 👀");
  });

  $("#settingsSheet").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-action]"); if (!b) return;
    const action = b.dataset.action;
    if (action === "export") {
      const json = JSON.stringify(state, null, 2);
      const name = `fluxo-backup-${toISO(new Date())}.json`;
      if (IS_APP && bridge.saveFile) { bridge.saveFile(name, json); return; }
      const blob = new Blob([json], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("Backup salvo 💾");
    } else if (action === "demo") {
      if (!(await confirmDialog({ title: "Carregar exemplo?", text: "Seus dados atuais serão substituídos por dados de exemplo.", ok: "Carregar", ico: "✨" }))) return;
      state = demoData(); save(); closeSheet(); viewMonth = shiftMonth(new Date(), 0); renderAll();
      toast("Dados de exemplo carregados ✨");
    } else if (action === "reset") {
      if (!(await confirmDialog({ title: "Apagar tudo?", text: "Todas as movimentações, metas e limites deste aparelho serão apagados. Não dá para desfazer.", ok: "Apagar tudo", ico: "🗑️", danger: true }))) return;
      state = normalize({ settings: state.settings }); save(); closeSheet(); renderAll();
      toast("Tudo limpo. Recomeço! 🌱");
    }
  });
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    e.target.value = "";
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.transactions)) throw new Error("formato");
      if (!(await confirmDialog({ title: "Restaurar backup?", text: `Encontramos ${data.transactions.length} movimentações. Seus dados atuais serão substituídos.`, ok: "Restaurar", ico: "📂" }))) return;
      state = normalize(data); save(); closeSheet(); renderAll();
      toast("Backup restaurado ✅");
    } catch (err) { toast("Arquivo de backup inválido ⚠️"); }
  });
  // Chamado pelo app Android depois de salvar o arquivo
  window.fluxoToast = (msg) => toast(msg);

  // ---------- Botão voltar (Android) e Esc ----------
  function handleBack() {
    if ($("#dialog").classList.contains("open")) { closeDialog(false); return true; }
    if (openSheetEl) { closeSheet(); return true; }
    if (currentTab !== "home") { go("home"); return true; }
    return false;
  }
  window.fluxoBack = handleBack;

  // ---------- Boas-vindas ----------
  function finishOnboarding(demo) {
    state.settings.name = $("#onboardName").value.trim();
    if (demo) state = demoData();
    save();
    const el = $("#onboard");
    el.classList.add("leaving");
    setTimeout(() => (el.hidden = true), 400);
    renderAll();
    toast(state.settings.name ? `Prazer, ${state.settings.name.split(" ")[0]}! 👋` : "Bem-vindo ao Fluxo! 👋");
  }
  if (firstRun) {
    $("#onboard").hidden = false;
    $("#startEmpty").addEventListener("click", () => finishOnboarding(false));
    $("#startDemo").addEventListener("click", () => finishOnboarding(true));
  }

  // ---------- Efeitos ----------
  function toast(msg, actionLabel, onAction) {
    const el = document.createElement("div");
    el.className = "toast";
    const span = document.createElement("span");
    span.textContent = msg;
    el.appendChild(span);
    const dismiss = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
    if (actionLabel) {
      const b = document.createElement("button");
      b.textContent = actionLabel;
      b.onclick = () => { onAction(); dismiss(); haptic(); };
      el.appendChild(b);
    }
    const box = $("#toasts");
    while (box.children.length > 2) box.firstChild.remove();
    box.appendChild(el);
    setTimeout(dismiss, actionLabel ? 5000 : 2600);
  }
  function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

  // Confete
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let pieces = [], running = false;
  function celebrate(name) {
    toast(`Meta "${name}" concluída! 🎉`);
    haptic(60);
    if (reduceMotion) return;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const colors = ["#8b5cf6", "#2dd4bf", "#fb7185", "#fbbf24", "#a78bfa", "#34d399"];
    for (let i = 0; i < 160; i++) {
      pieces.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.55,
        vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 17 - 7,
        w: 6 + Math.random() * 5, h: 8 + Math.random() * 7,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0], life: 0,
      });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter((p) => p.y < innerHeight + 40 && p.life < 400);
    for (const p of pieces) {
      p.vy += 0.42; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.1)));
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- Início ----------
  renderAll();
  moveTabDot();
})();
