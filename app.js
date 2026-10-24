(() => {
  "use strict";

  // =====================================================================
  // Configuração
  // =====================================================================
  const STORAGE_KEY = "fluxo-financas-v1";
  const APP_VERSION = 2;

  const BUILTIN_CATS = {
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
  const TRANSFER_CAT = { id: "transfer", name: "Transferência", icon: "🔄", color: "#60a5fa" };
  // Para a regra 50/30/20: o que é necessidade (o resto conta como desejo)
  const NEEDS = new Set(["alimentacao", "moradia", "transporte", "contas", "saude", "educacao"]);

  const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "📱", "🛟", "🎓", "💍", "🏖️", "🎮", "👶", "🐶", "🏋️", "🎸", "💰"];
  const ACC_EMOJIS = ["👛", "💜", "🏦", "🐷", "💳", "💵", "🟧", "🟦", "🟩", "🪙", "📈", "💼"];
  const PALETTE = ["#8b5cf6", "#3b82f6", "#22d3ee", "#34d399", "#a3e635", "#fbbf24", "#fb923c", "#f472b6", "#f43f5e", "#94a3b8"];
  const ACCENTS = [
    { id: "violet", color: "#8b5cf6" }, { id: "blue", color: "#3b82f6" }, { id: "green", color: "#10b981" },
    { id: "pink", color: "#ec4899" }, { id: "orange", color: "#f97316" },
  ];
  const REMINDER_HOURS = [8, 12, 18, 20, 22];
  const POPULAR_SUBS = [
    { desc: "Netflix", icon: "🎬", cat: "assinaturas" }, { desc: "Spotify", icon: "🎵", cat: "assinaturas" },
    { desc: "Amazon Prime", icon: "📦", cat: "assinaturas" }, { desc: "Disney+", icon: "🏰", cat: "assinaturas" },
    { desc: "YouTube Premium", icon: "▶️", cat: "assinaturas" }, { desc: "iCloud", icon: "☁️", cat: "assinaturas" },
    { desc: "Academia", icon: "🏋️", cat: "saude" }, { desc: "Internet", icon: "🌐", cat: "contas" },
    { desc: "Celular", icon: "📱", cat: "contas" }, { desc: "Aluguel", icon: "🏠", cat: "moradia" },
    { desc: "Condomínio", icon: "🏢", cat: "moradia" }, { desc: "Plano de saúde", icon: "🩺", cat: "saude" },
  ];
  const FREQ_LABEL = { weekly: "Toda semana", monthly: "Todo mês", yearly: "Todo ano" };
  const FREQ_PER_MONTH = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };

  // =====================================================================
  // Utilidades
  // =====================================================================
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmt = (n) => brl.format(n);
  const fmtShort = (n) => (Math.abs(n) >= 1000 ? "R$ " + (n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : fmt(n));
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const todayISO = () => toISO(new Date());
  const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const shiftMonth = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
  const endOfMonthISO = (d) => toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  const monthName = (d) => d.toLocaleDateString("pt-BR", { month: "long" });
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const shortDate = (iso) => parseISO(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round2 = (n) => Math.round(n * 100) / 100;

  function addMonthsISO(iso, n, day) {
    const d = parseISO(iso);
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const dd = Math.min(day || d.getDate(), daysIn(t.getFullYear(), t.getMonth()));
    return toISO(new Date(t.getFullYear(), t.getMonth(), dd));
  }
  function advance(iso, freq, day) {
    if (freq === "weekly") return addDays(iso, 7);
    if (freq === "yearly") return addMonthsISO(iso, 12, day);
    return addMonthsISO(iso, 1, day);
  }
  function relDay(iso) {
    const diff = Math.round((parseISO(iso) - parseISO(todayISO())) / 864e5);
    if (diff === 0) return "hoje";
    if (diff === 1) return "amanhã";
    if (diff === -1) return "ontem";
    return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`;
  }

  // Aceita "1.234,56", "1234.56", "R$ 1234,5"
  function parseMoney(str) {
    let s = String(str ?? "").trim().replace(/[^\d,.-]/g, "");
    if (!s) return NaN;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, "");
    return round2(parseFloat(s));
  }
  const moneyToInput = (n) => (n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

  const bridge = window.AndroidBridge;
  const IS_APP = !!bridge;
  if (IS_APP) document.body.classList.add("in-app");

  // =====================================================================
  // Estado
  // =====================================================================
  function normalize(data = {}) {
    const s = {
      version: APP_VERSION,
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      budgets: data.budgets && typeof data.budgets === "object" ? data.budgets : {},
      recurring: Array.isArray(data.recurring) ? data.recurring : [],
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      debts: Array.isArray(data.debts) ? data.debts : [],
      customCats: Array.isArray(data.customCats) ? data.customCats : [],
      achievements: data.achievements && typeof data.achievements === "object" ? data.achievements : {},
      activity: Array.isArray(data.activity) ? data.activity : [],
      bestStreak: data.bestStreak || 0,
      settings: {
        name: "", hide: false, haptics: true, accent: "violet", pinHash: null, pinSalt: null,
        reminder: { on: false, hour: 20 }, seenVersion: data.version ? data.version : 1, storySeen: null, lastAccount: null,
        ...(data.settings || {}),
      },
    };
    // Migração da versão 1: cria a conta padrão e liga as movimentações a ela
    if (!s.accounts.length) s.accounts.push({ id: "principal", name: "Carteira", emoji: "👛", color: "#8b5cf6", initial: 0 });
    const firstAcc = s.accounts[0].id;
    for (const t of s.transactions) if (!t.account) t.account = firstAcc;
    for (const r of s.recurring) if (!r.account) r.account = firstAcc;
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* armazenamento indisponível */ }
    return null;
  }
  let achSilent = true;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    checkAchievements(achSilent);
  }

  let state = load();
  const firstRun = !state;
  if (!state) { state = normalize(); state.settings.seenVersion = APP_VERSION; }

  let viewMonth = shiftMonth(new Date(), 0);
  let currentTab = "home";
  let planTab = "goals";
  let typeFilter = "all";
  let accFilter = null;
  let dayFilter = null;
  let searchTerm = "";

  // =====================================================================
  // Categorias e contas
  // =====================================================================
  const allCats = () => [...BUILTIN_CATS.expense, ...BUILTIN_CATS.income, ...state.customCats];
  const cats = (type) => [...BUILTIN_CATS[type], ...state.customCats.filter((c) => c.type === type && !c.hidden)];
  const catById = (id) => (id === "transfer" ? TRANSFER_CAT : allCats().find((c) => c.id === id) || BUILTIN_CATS.expense.at(-1));
  const accById = (id) => state.accounts.find((a) => a.id === id);
  const accLabel = (id) => { const a = accById(id); return a ? `${a.emoji} ${a.name}` : "Conta removida"; };
  const multiAcc = () => state.accounts.length > 1;

  function accountBalance(id, until = todayISO()) {
    const a = accById(id);
    let b = a ? a.initial || 0 : 0;
    for (const t of state.transactions) {
      if (t.date > until) continue;
      if (t.type === "transfer") {
        if (t.account === id) b -= t.amount;
        if (t.toAccount === id) b += t.amount;
      } else if (t.account === id) b += t.type === "income" ? t.amount : -t.amount;
    }
    return round2(b);
  }
  function totalBalance(until) {
    let b = state.accounts.reduce((s, a) => s + (a.initial || 0), 0);
    for (const t of state.transactions) {
      if (t.date > until || t.type === "transfer") continue;
      b += t.type === "income" ? t.amount : -t.amount;
    }
    return round2(b);
  }

  // =====================================================================
  // Recorrências (assinaturas e contas fixas)
  // =====================================================================
  function processRecurrences() {
    const today = todayISO();
    let created = 0;
    for (const r of state.recurring) {
      if (r.paused) continue;
      let guard = 0;
      while (r.next <= today && guard++ < 600) {
        state.transactions.push({ id: uid(), type: r.type, desc: r.desc, amount: r.amount, category: r.category, account: r.account, date: r.next, recId: r.id });
        r.next = advance(r.next, r.freq, r.day);
        created++;
      }
    }
    if (created) save();
    return created;
  }
  function occurrences(r, fromExcl, toIncl) {
    const out = [];
    if (r.paused) return out;
    let d = r.next, guard = 0;
    while (d <= toIncl && guard++ < 600) {
      if (d > fromExcl) out.push(d);
      d = advance(d, r.freq, r.day);
    }
    return out;
  }
  function projectedNet(fromExcl, toIncl) {
    let n = 0;
    for (const r of state.recurring) {
      const k = occurrences(r, fromExcl, toIncl).length;
      n += (r.type === "income" ? 1 : -1) * r.amount * k;
    }
    return n;
  }
  function upcoming(days = 10) {
    const today = todayISO(), until = addDays(today, days);
    const items = [];
    for (const r of state.recurring) {
      for (const d of occurrences(r, today, until)) items.push({ kind: "rec", id: r.id, date: d, desc: r.desc, amount: r.amount, type: r.type, category: r.category });
    }
    for (const t of state.transactions) {
      if (t.date > today && t.date <= until && t.type !== "transfer") items.push({ kind: "tx", id: t.id, date: t.date, desc: t.desc, amount: t.amount, type: t.type, category: t.category });
    }
    return items.sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  const monthlyCost = (r) => r.amount * FREQ_PER_MONTH[r.freq];

  // =====================================================================
  // Cálculos
  // =====================================================================
  const inMonth = (t, key) => t.date.slice(0, 7) === key;
  function monthTotals(key, untilDay = 31, acc = null) {
    let income = 0, expense = 0;
    for (const t of state.transactions) {
      if (t.type === "transfer" || !inMonth(t, key) || Number(t.date.slice(8, 10)) > untilDay) continue;
      if (acc && t.account !== acc) continue;
      if (t.type === "income") income += t.amount; else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }
  function expenseByCategory(key) {
    const map = {};
    for (const t of state.transactions) {
      if (t.type !== "expense" || !inMonth(t, key)) continue;
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).map(([id, value]) => ({ cat: catById(id), value })).sort((a, b) => b.value - a.value);
  }
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const monthTx = (key) => state.transactions.filter((t) => inMonth(t, key)).sort(byDateDesc);
  const isCurrentMonth = () => monthKey(viewMonth) === monthKey(new Date());

  function suggestions(type) {
    const since = addDays(todayISO(), -120);
    const map = new Map();
    for (const t of state.transactions) {
      if (t.type !== type || t.date < since || t.recId || t.inst) continue;
      const k = t.desc.toLowerCase() + "|" + t.category;
      const e = map.get(k) || { desc: t.desc, cat: t.category, n: 0, amount: t.amount, date: t.date };
      e.n++;
      if (t.date >= e.date) { e.amount = t.amount; e.date = t.date; }
      map.set(k, e);
    }
    return [...map.values()].filter((e) => e.n >= 2).sort((a, b) => b.n - a.n).slice(0, 6);
  }

  // =====================================================================
  // Sequência e conquistas
  // =====================================================================
  function recordActivity() {
    const d = todayISO();
    if (!state.activity.includes(d)) {
      state.activity.push(d);
      if (state.activity.length > 400) state.activity = state.activity.slice(-400);
    }
    state.bestStreak = Math.max(state.bestStreak || 0, streak());
  }
  function streak() {
    const set = new Set(state.activity);
    let d = todayISO();
    if (!set.has(d)) d = addDays(d, -1);
    let n = 0;
    while (set.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }
  function closedMonths() {
    const cur = monthKey(new Date());
    const keys = new Set(state.transactions.map((t) => t.date.slice(0, 7)).filter((k) => k < cur));
    return [...keys].map((k) => monthTotals(k));
  }
  const ACHIEVEMENTS = [
    { id: "first", icon: "🌱", name: "Primeiro passo", desc: "Registrou a primeira movimentação", test: (s) => s.transactions.length >= 1 },
    { id: "tx50", icon: "📒", name: "Organizado", desc: "50 movimentações registradas", test: (s) => s.transactions.length >= 50 },
    { id: "tx200", icon: "🧠", name: "Mestre das finanças", desc: "200 movimentações registradas", test: (s) => s.transactions.length >= 200 },
    { id: "streak3", icon: "🔥", name: "Pegando o ritmo", desc: "3 dias seguidos usando o app", test: (s) => s.bestStreak >= 3 },
    { id: "streak7", icon: "⚡", name: "Semana perfeita", desc: "7 dias seguidos usando o app", test: (s) => s.bestStreak >= 7 },
    { id: "streak30", icon: "💎", name: "Hábito de ferro", desc: "30 dias seguidos usando o app", test: (s) => s.bestStreak >= 30 },
    { id: "goal", icon: "🎯", name: "Sonhador", desc: "Criou a primeira meta", test: (s) => s.goals.length >= 1 },
    { id: "goalDone", icon: "🏆", name: "Conquistador", desc: "Concluiu uma meta", test: (s) => s.goals.some((g) => g.saved >= g.target) },
    { id: "budget", icon: "🧭", name: "Planejador", desc: "Definiu um limite de gastos", test: (s) => Object.keys(s.budgets).length >= 1 },
    { id: "sub", icon: "🔁", name: "De olho nas assinaturas", desc: "Cadastrou uma conta fixa", test: (s) => s.recurring.length >= 1 },
    { id: "inst", icon: "💳", name: "Parcelado consciente", desc: "Registrou uma compra parcelada", test: (s) => s.transactions.some((t) => t.inst) },
    { id: "accounts", icon: "🏦", name: "Multicontas", desc: "Tem duas contas ou mais", test: (s) => s.accounts.length >= 2 },
    { id: "green", icon: "💚", name: "Mês no azul", desc: "Fechou um mês ganhando mais do que gastou", test: () => closedMonths().some((m) => m.income > 0 && m.net > 0) },
    { id: "saver", icon: "🐷", name: "Poupador", desc: "Guardou 20% ou mais em um mês", test: () => closedMonths().some((m) => m.income > 0 && m.net / m.income >= 0.2) },
    { id: "debtFree", icon: "🤝", name: "Nada a dever", desc: "Quitou um empréstimo", test: (s) => s.debts.some((d) => d.done) },
    { id: "custom", icon: "🏷️", name: "Do meu jeito", desc: "Criou uma categoria própria", test: (s) => s.customCats.length >= 1 },
  ];
  function checkAchievements(silent) {
    const fresh = [];
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.test(state); } catch (e) { ok = false; }
      if (ok) { state.achievements[a.id] = todayISO(); fresh.push(a); }
    }
    if (!fresh.length) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
    if (silent) return;
    fresh.forEach((a, i) => setTimeout(() => { toast(`🏆 Conquista: ${a.icon} ${a.name}`); haptic(40); }, 700 + i * 900));
    setTimeout(() => burst(60), 600);
  }

  // =====================================================================
  // Animações de número e vibração
  // =====================================================================
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
    if (!IS_APP && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try {
      if (IS_APP && bridge.vibrate) bridge.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* sem vibração */ }
  }

  // =====================================================================
  // Renderização
  // =====================================================================
  function renderAll() {
    renderHeader();
    renderHome();
    renderTx();
    renderPlans();
    if (currentTab === "stats") renderStats();
  }

  function renderHeader() {
    const h = new Date().getHours();
    $("#greeting").textContent = h < 5 ? "Boa madrugada 🌌" : h < 12 ? "Bom dia ☀️" : h < 18 ? "Boa tarde 🌤️" : "Boa noite 🌙";
    const name = state.settings.name.trim();
    $("#userName").textContent = name ? `Olá, ${name.split(" ")[0]}` : "Olá!";
    $("#avatar").textContent = (name[0] || "F").toUpperCase();
    document.body.classList.toggle("privacy", !!state.settings.hide);
    if (state.settings.accent && state.settings.accent !== "violet") document.body.dataset.accent = state.settings.accent;
    else delete document.body.dataset.accent;

    const label = cap(viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })) + (isCurrentMonth() ? '<i class="today-dot"></i>' : "");
    const el = $("#monthLabel");
    if (el.innerHTML !== label) {
      el.classList.add("swap");
      setTimeout(() => { el.innerHTML = label; el.classList.remove("swap"); }, 140);
    }
  }

  function txItem(t, showDate) {
    const c = catById(t.category);
    const today = todayISO();
    let sub = c.name;
    let amt = `${t.type === "income" ? "+" : "−"} ${fmt(t.amount)}`;
    let ico = c.icon, bg = c.color;
    if (t.type === "transfer") {
      sub = `${accLabel(t.account)} → ${accLabel(t.toAccount)}`;
      amt = fmt(t.amount);
    } else if (multiAcc()) sub += ` · ${accById(t.account)?.name || "—"}`;
    if (showDate) sub += ` · ${shortDate(t.date)}`;
    let tags = "";
    if (t.recId) tags += `<span class="tx-tag">🔁</span>`;
    if (t.inst) tags += `<span class="tx-tag">${t.inst.i}/${t.inst.n}</span>`;
    if (t.date > today) tags += `<span class="tx-tag">agendada</span>`;
    return `
      <li class="tx ${t.date > today ? "future" : ""}" data-id="${t.id}">
        <div class="tx-del"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>Excluir</div>
        <div class="tx-inner">
          <div class="tx-ico" style="background:${bg}1f">${ico}</div>
          <div class="tx-info"><strong>${escapeHTML(t.desc)}${tags}</strong><small>${escapeHTML(sub)}</small></div>
          <div class="tx-amt ${t.type} money">${amt}</div>
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

    if (isCurrentMonth()) {
      const end = endOfMonthISO(viewMonth);
      const fc = totalBalance(end) + projectedNet(todayISO(), end);
      if (fc < 0) return { ico: "⚠️", cls: "bad", html: `Atenção: pela previsão, seu saldo pode fechar o mês <strong>negativo</strong> (<span class="money">${fmt(fc)}</span>).` };
    }

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

    const subs = state.recurring.filter((r) => !r.paused && r.type === "expense");
    if (subs.length >= 3 && new Date().getDate() % 2 === 0) {
      const m = subs.reduce((s, r) => s + monthlyCost(r), 0);
      return { ico: "🔁", cls: "", html: `Suas contas fixas somam <strong class="money">${fmt(m)}</strong> por mês, ou <span class="money">${fmt(m * 12)}</span> por ano.` };
    }
    const all = monthTotals(key);
    const top = expenseByCategory(key)[0];
    if (top) return { ico: top.cat.icon, cls: "", html: `Seu maior gasto do mês é <strong>${top.cat.name}</strong>: <span class="money">${fmt(top.value)}</span> (${((top.value / all.expense) * 100).toFixed(0)}% do total).` };
    if (all.income) return { ico: "🎉", cls: "good", html: "Nenhum gasto registrado neste mês. Continue assim!" };
    return { ico: "📅", cls: "", html: "Nenhuma movimentação neste mês ainda. Toque no <strong>+</strong> para adicionar." };
  }

  function renderHome() {
    const key = monthKey(viewMonth);
    const curKey = monthKey(new Date());
    const end = endOfMonthISO(viewMonth);
    const today = todayISO();
    let label, value;
    const fcEl = $("#forecast");
    if (key === curKey) {
      label = "Saldo atual";
      value = totalBalance(today);
      const fc = totalBalance(end) + projectedNet(today, end);
      fcEl.hidden = false;
      fcEl.innerHTML = `<span class="fc-ico">🔮</span>Previsão para o fim do mês: <b class="money">${fmt(fc)}</b>`;
    } else if (key < curKey) {
      label = `Saldo no fim de ${monthName(viewMonth)}`;
      value = totalBalance(end);
      fcEl.hidden = true;
    } else {
      label = `Saldo previsto para ${monthName(viewMonth)}`;
      value = totalBalance(end) + projectedNet(today, end);
      fcEl.hidden = true;
    }
    $("#heroLabel").textContent = label;
    animateValue($("#heroBalance"), value);
    const t = monthTotals(key);
    animateValue($("#heroIncome"), t.income);
    animateValue($("#heroExpense"), t.expense);
    const st = streak();
    $("#streakNum").textContent = st;
    $("#streakChip").classList.toggle("cold", st === 0);

    // Banner do resumo do mês passado
    const prev = shiftMonth(new Date(), -1);
    const prevKey = monthKey(prev);
    const banner = $("#storyBanner");
    const showBanner = new Date().getDate() <= 7 && state.settings.storySeen !== prevKey && state.transactions.some((x) => inMonth(x, prevKey));
    banner.hidden = !showBanner;
    if (showBanner) {
      banner.innerHTML = `<span class="story-cta-ico">✨</span><span><strong>Seu resumo de ${monthName(prev)} chegou!</strong><small>Toque para ver seu mês em stories</small></span><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>`;
    }

    const ins = insight();
    const el = $("#insight");
    el.className = `insight ${ins.cls}`;
    el.innerHTML = `<div class="insight-ico">${ins.ico}</div><p>${ins.html}</p>`;

    // Contas
    $("#accRail").innerHTML = state.accounts.map((a) => `
      <button class="acc-card" data-acc="${a.id}" style="--c:${a.color}">
        <span class="acc-top"><span class="acc-emoji">${a.emoji}</span>${escapeHTML(a.name)}</span>
        <strong class="money">${fmt(accountBalance(a.id))}</strong>
      </button>`).join("") + `<button class="acc-card add" data-open="account"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nova conta</button>`;

    // Próximas cobranças
    const up = key === curKey ? upcoming(10).slice(0, 5) : [];
    $("#upcomingPanel").hidden = !up.length;
    $("#upcomingList").innerHTML = up.map((u) => {
      const c = catById(u.category);
      const d = parseISO(u.date);
      const rd = relDay(u.date);
      return `
        <li class="up-item" data-up="${u.kind}:${u.id}">
          <div class="up-date"><b>${d.getDate()}</b><small>${d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</small></div>
          <div class="tx-info"><strong>${c.icon} ${escapeHTML(u.desc)}</strong><small class="${rd === "amanhã" ? "soon" : ""}">${cap(rd)}${u.kind === "rec" ? " · automática" : ""}</small></div>
          <div class="tx-amt ${u.type} money">${u.type === "income" ? "+" : "−"} ${fmt(u.amount)}</div>
        </li>`;
    }).join("");

    // Gastos do mês
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

    const recent = monthTx(key).filter((x) => x.date <= today || key !== curKey).slice(0, 5);
    $("#homeTx").innerHTML = recent.length ? recent.map((x) => txItem(x, true)).join("") : emptyHTML("🪙", "Nenhuma movimentação neste mês.", "Adicionar agora");

    $("#homeGoals").innerHTML = state.goals.map((g) => {
      const p = clamp((g.saved / g.target) * 100 || 0, 0, 100);
      return `
        <button class="goal-card ${p >= 100 ? "done" : ""}" data-goal="${g.id}">
          <div class="mini-ring" data-p="${p}"><span>${escapeHTML(g.emoji || "🎯")}</span></div>
          <strong>${escapeHTML(g.name)}</strong>
          <small><span class="money">${fmtShort(g.saved)}</span> · ${p.toFixed(0)}%</small>
        </button>`;
    }).join("") + `<button class="goal-card add" data-open="goal"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><small>Nova meta</small></button>`;
    growBars($("#homeGoals"));
  }

  function renderTx() {
    const key = monthKey(viewMonth);
    if (dayFilter && !dayFilter.startsWith(key)) dayFilter = null;
    if (accFilter && !accById(accFilter)) accFilter = null;
    const t = monthTotals(key, 31, accFilter);
    $("#txSummary").innerHTML = `
      <div class="in"><small>Entradas</small><strong class="money">${fmt(t.income)}</strong></div>
      <div class="out"><small>Saídas</small><strong class="money">${fmt(t.expense)}</strong></div>`;

    // Filtros por conta e por dia
    let chips = "";
    if (dayFilter) chips += `<button class="fchip active" data-fday>📅 ${shortDate(dayFilter)} <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
    if (multiAcc()) {
      chips += `<button class="fchip ${accFilter ? "" : "active"}" data-facc="">Todas as contas</button>`;
      chips += state.accounts.map((a) => `<button class="fchip ${accFilter === a.id ? "active" : ""}" data-facc="${a.id}">${a.emoji} ${escapeHTML(a.name)}</button>`).join("");
    }
    $("#txFilters").innerHTML = chips;

    const term = searchTerm.trim().toLowerCase();
    const list = monthTx(key)
      .filter((x) => typeFilter === "all" || x.type === typeFilter)
      .filter((x) => !accFilter || x.account === accFilter || x.toAccount === accFilter)
      .filter((x) => !dayFilter || x.date === dayFilter)
      .filter((x) => !term || x.desc.toLowerCase().includes(term) || catById(x.category).name.toLowerCase().includes(term));

    const today = todayISO();
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    let html = "", last = "";
    for (const x of list) {
      if (x.date !== last) {
        last = x.date;
        const label = x.date === today ? "Hoje" : x.date === yesterday ? "Ontem" : x.date === tomorrow ? "Amanhã"
          : parseISO(x.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        html += `<li class="tx-group">${label}</li>`;
      }
      html += txItem(x, false);
    }
    const filtered = term || typeFilter !== "all" || accFilter || dayFilter;
    $("#txList").innerHTML = html || (filtered
      ? emptyHTML("🔍", "Nada encontrado com esse filtro.")
      : emptyHTML("🪙", "Nenhuma movimentação neste mês.", "Adicionar agora"));
    $("#swipeHint").hidden = !list.length;
    $("#searchClear").hidden = !searchTerm;
  }

  function renderStats() {
    const key = monthKey(viewMonth);
    const t = monthTotals(key);
    $("#storyBtnTitle").textContent = `Resumo de ${monthName(viewMonth)}`;
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
          <li><button data-cat-search="${escapeHTML(r.cat.name)}">
            <i class="sw" style="background:${r.cat.color}"></i>
            <span>${r.cat.icon} ${escapeHTML(r.cat.name)}</span>
            <span class="v money">${fmt(r.value)}</span>
            <span class="pc">${((r.value / total) * 100).toFixed(0)}%</span>
          </button></li>`).join("")
      : `<li class="list-empty" style="text-align:center">Nenhum gasto neste mês 🎉</li>`;

    renderRule(t, rows);
    renderCalendar(key);
    renderCharts(rows);
    renderBudgets(rows);
  }

  function renderRule(t, rows) {
    const el = $("#rule");
    if (!t.income) {
      el.innerHTML = `<p class="list-empty">Registre suas receitas do mês para ver se seu dinheiro está equilibrado.</p>`;
      return;
    }
    let needs = 0, wants = 0;
    for (const r of rows) (NEEDS.has(r.cat.id) ? (needs += r.value) : (wants += r.value));
    const saved = t.income - needs - wants;
    const pc = (v) => (v / t.income) * 100;
    const items = [
      { name: "Necessidades", hint: "casa, mercado, contas", ideal: 50, v: needs, color: "#60a5fa" },
      { name: "Desejos", hint: "lazer, compras, assinaturas", ideal: 30, v: wants, color: "#f472b6" },
      { name: "Guardado", hint: "o que sobrou", ideal: 20, v: Math.max(0, saved), color: "#34d399" },
    ];
    let verdict;
    if (pc(saved) >= 20 && pc(needs) <= 55) verdict = "🏆 <strong>Equilíbrio de respeito!</strong> Você guardou 20% ou mais e manteve as necessidades sob controle.";
    else if (pc(needs) > 55) verdict = `🏠 As necessidades estão em <strong>${pc(needs).toFixed(0)}%</strong> da renda. Vale renegociar contas fixas ou buscar opções mais baratas.`;
    else if (pc(wants) > 30) verdict = `🛍️ Os desejos estão em <strong>${pc(wants).toFixed(0)}%</strong>. Cortando um pouco, dá para guardar mais.`;
    else verdict = `🐷 Você guardou <strong>${Math.max(0, pc(saved)).toFixed(0)}%</strong>. A meta da regra é 20%. Está quase!`;
    el.innerHTML = items.map((i) => `
      <div class="rule-row">
        <div class="bar-top"><span><strong>${i.name}</strong> <small class="muted">${i.hint}</small></span><span>${pc(i.v).toFixed(0)}% <small class="muted">/ ${i.ideal}%</small></span></div>
        <div class="rule-track"><i style="background:${i.color}" data-w="${Math.min(100, pc(i.v))}"></i><b style="left:${i.ideal}%"></b></div>
      </div>`).join("") + `<div class="rule-verdict">${verdict}</div>`;
    growBars(el);
  }

  function renderCalendar(key) {
    const [y, m] = key.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const n = daysIn(y, m - 1);
    const exp = {}, inc = {};
    for (const t of state.transactions) {
      if (!inMonth(t, key) || t.type === "transfer") continue;
      const d = Number(t.date.slice(8, 10));
      if (t.type === "expense") exp[d] = (exp[d] || 0) + t.amount; else inc[d] = true;
    }
    const max = Math.max(1, ...Object.values(exp));
    const today = todayISO();
    let html = ["D", "S", "T", "Q", "Q", "S", "S"].map((w) => `<span class="wd">${w}</span>`).join("");
    for (let i = 0; i < first; i++) html += `<span class="day empty"></span>`;
    for (let d = 1; d <= n; d++) {
      const v = exp[d] || 0;
      const lvl = v ? (v / max < 0.25 ? 1 : v / max < 0.5 ? 2 : v / max < 0.75 ? 3 : 4) : 0;
      const iso = `${key}-${pad(d)}`;
      html += `<button class="day ${lvl ? "h" + lvl : ""} ${iso === today ? "today" : ""} ${inc[d] ? "has-in" : ""}" data-day="${iso}" style="animation-delay:${d * 8}ms" title="${v ? fmt(v) : ""}">${d}</button>`;
    }
    $("#calendar").innerHTML = html;
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
            <div class="bar-top"><strong>${escapeHTML(c.name)}</strong><span class="money">${fmt(s)} / ${fmt(limit)}</span></div>
            <div class="bar-track"><i data-w="${Math.min(100, pct)}"></i></div>
            <div class="budget-left">${left >= 0 ? `Ainda pode gastar <span class="money">${fmt(left)}</span>` : `Passou <span class="money">${fmt(-left)}</span> do limite`}</div>
          </div>
        </li>`;
    }).join("");
    growBars(el);
  }

  // ---------- Planos ----------
  function renderPlans() {
    renderGoals();
    renderFixed();
    renderDebts();
  }

  function goalPlan(g) {
    if (!g.deadline || g.saved >= g.target) return "";
    const [y, m] = g.deadline.split("-").map(Number);
    const now = new Date();
    const months = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()) + 1;
    const lbl = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
    if (months <= 0) return `Prazo (${lbl}) passou`;
    return `Guarde <span class="money">${fmt((g.target - g.saved) / months)}</span>/mês até ${lbl}`;
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
      const plan = goalPlan(g);
      return `
        <li class="goal ${ok ? "done" : ""}" data-goal="${g.id}" style="animation-delay:${i * 50}ms">
          <div class="goal-top">
            <div class="goal-emoji">${escapeHTML(g.emoji || "🎯")}</div>
            <div class="goal-name"><strong>${escapeHTML(g.name)}</strong><small>${ok ? "Meta concluída! 🎉" : plan ? `<span class="plan-tag">${plan}</span>` : `Faltam <span class="money">${fmt(g.target - g.saved)}</span>`}</small></div>
            <div class="goal-pct">${p.toFixed(0)}%</div>
          </div>
          <div class="track"><span data-w="${p}"></span></div>
          <div class="goal-meta"><span class="money">${fmt(g.saved)}</span><span class="money">${fmt(g.target)}</span></div>
        </li>`;
    }).join("");
    growBars($("#goalList"));
  }

  function renderFixed() {
    const active = state.recurring.filter((r) => !r.paused);
    const exp = active.filter((r) => r.type === "expense").reduce((s, r) => s + monthlyCost(r), 0);
    const inc = active.filter((r) => r.type === "income").reduce((s, r) => s + monthlyCost(r), 0);
    animateValue($("#fixedTotal"), exp);
    $("#fixedSub").innerHTML = state.recurring.length
      ? `<span class="money">${fmt(exp * 12)}</span> por ano · ${active.length} ativa${active.length === 1 ? "" : "s"}${inc ? ` · receitas fixas <span class="money">${fmt(inc)}</span>/mês` : ""}`
      : "Cadastre assinaturas e contas que se repetem";
    const list = [...state.recurring].sort((a, b) => (a.paused - b.paused) || (a.next < b.next ? -1 : 1));
    $("#recList").innerHTML = list.length ? list.map((r, i) => {
      const c = catById(r.category);
      const when = r.freq === "monthly" ? `Todo dia ${r.day}` : r.freq === "weekly" ? "Toda semana" : `Todo ano em ${shortDate(r.next)}`;
      const per = r.freq === "monthly" ? "/mês" : r.freq === "weekly" ? "/semana" : "/ano";
      return `
        <li class="rec-item ${r.paused ? "paused" : ""}" data-rec="${r.id}" style="animation-delay:${i * 40}ms">
          <div class="rec-ico" style="background:${c.color}22">${c.icon}</div>
          <div class="tx-info"><strong>${escapeHTML(r.desc)}</strong><small>${r.paused ? "⏸️ Pausada" : `${when} · próxima <b>${relDay(r.next)}</b>`}</small></div>
          <div class="rec-amt"><strong class="${r.type} money">${r.type === "income" ? "+" : ""}${fmt(r.amount)}</strong><small>${per}</small></div>
        </li>`;
    }).join("") : `<li class="list-empty">Nenhuma conta fixa ainda. Use os atalhos abaixo ou toque em <strong>Nova assinatura</strong>.</li>`;
    $("#popularSubs").innerHTML = POPULAR_SUBS.filter((p) => !state.recurring.some((r) => r.desc.toLowerCase() === p.desc.toLowerCase()))
      .map((p) => `<button data-popular="${escapeHTML(p.desc)}">${p.icon} ${p.desc}</button>`).join("") || `<p class="list-empty">Você já cadastrou todas as sugestões 😎</p>`;
  }

  function renderDebts() {
    const open = state.debts.filter((d) => !d.done);
    const owed = open.filter((d) => d.dir === "owed").reduce((s, d) => s + d.amount - d.paid, 0);
    const owe = open.filter((d) => d.dir === "owe").reduce((s, d) => s + d.amount - d.paid, 0);
    $("#debtOwed").textContent = fmt(owed);
    $("#debtOwe").textContent = fmt(owe);
    const item = (d, i) => {
      const left = d.amount - d.paid;
      const color = d.dir === "owed" ? "#10b981" : "#f43f5e";
      const sub = `${d.dir === "owed" ? "Te deve" : "Você deve"}${d.desc ? " · " + escapeHTML(d.desc) : ""}${d.due && !d.done ? ` · ${d.due < todayISO() ? "⚠️ venceu" : "até"} ${shortDate(d.due)}` : ""}`;
      return `
        <li class="debt-item ${d.done ? "done" : ""}" data-debt="${d.id}" style="animation-delay:${i * 40}ms">
          <div class="debt-ico" style="background:${color}">${escapeHTML((d.person[0] || "?").toUpperCase())}</div>
          <div class="tx-info"><strong>${escapeHTML(d.person)}</strong><small>${d.done ? "✅ Quitado" : sub}</small></div>
          <div class="rec-amt"><strong class="${d.dir} money">${fmt(d.done ? d.amount : left)}</strong><small>${d.paid && !d.done ? `de <span class="money">${fmt(d.amount)}</span>` : ""}</small></div>
        </li>`;
    };
    const done = state.debts.filter((d) => d.done);
    $("#debtList").innerHTML = state.debts.length
      ? open.map(item).join("") + (done.length ? `<li class="debt-sep">Quitados</li>` + done.map(item).join("") : "")
      : `<li class="list-empty">Emprestou dinheiro ou pegou emprestado? Registre aqui para não esquecer quem deve para quem. 🤝</li>`;
  }

  // =====================================================================
  // Gráficos
  // =====================================================================
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

  // =====================================================================
  // Navegação
  // =====================================================================
  const TABS = ["home", "tx", "stats", "plans"];
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
    $("#monthSwitch").classList.toggle("hidden", tab === "plans");
    moveTabDot();
    window.scrollTo(0, 0);
    if (tab === "stats") renderStats();
    else if (tab === "home") renderHome();
    else if (tab === "plans") renderPlans();
    else renderTx();
    haptic();
  }
  $("#tabbar").addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) go(t.dataset.tab); });
  addEventListener("resize", moveTabDot);

  function setSeg(seg, attr, value) {
    const btns = $$(`button[data-${attr}]`, seg);
    btns.forEach((b, i) => {
      const on = b.dataset[attr] === value;
      b.classList.toggle("active", on);
      if (on) $(".seg-pill", seg).style.transform = `translateX(${i * 100}%)`;
    });
  }
  function setPlan(p) {
    planTab = p;
    setSeg($("#planSeg"), "plan", p);
    $$(".plan").forEach((v) => (v.hidden = v.dataset.planView !== p));
  }
  $("#planSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-plan]"); if (b) { setPlan(b.dataset.plan); haptic(); } });

  function setMonth(d) { viewMonth = shiftMonth(d, 0); dayFilter = null; renderAll(); haptic(); }
  $("#prevMonth").addEventListener("click", () => setMonth(shiftMonth(viewMonth, -1)));
  $("#nextMonth").addEventListener("click", () => setMonth(shiftMonth(viewMonth, 1)));
  $("#monthLabel").addEventListener("click", () => { if (!isCurrentMonth()) setMonth(new Date()); });

  // Deslizar para os lados troca o mês
  (() => {
    let x0 = null, y0 = 0;
    const main = $(".screens");
    main.addEventListener("touchstart", (e) => {
      if (e.target.closest(".tx, .goal-rail, .acc-rail, .chip-rail, .quick, canvas, .cal") || currentTab === "plans") { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    main.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) setMonth(shiftMonth(viewMonth, dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  // =====================================================================
  // Sheets, diálogo e seletor
  // =====================================================================
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
  const swapSheet = (fn) => { closeSheet(); setTimeout(fn, 140); };
  $("#backdrop").addEventListener("click", closeSheet);

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

  let dialogResolve = null;
  function confirmDialog({ title, text, ok = "Confirmar", ico = "⚠️", danger = false, alert = false }) {
    $("#dialogTitle").textContent = title;
    $("#dialogText").textContent = text;
    $("#dialogIco").textContent = ico;
    $("#dialogYes").textContent = ok;
    $("#dialogNo").hidden = alert;
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

  let pickerResolve = null, pickerOptions = [];
  function pick(title, options, grid = false) {
    pickerOptions = options;
    $("#pickerTitle").textContent = title;
    const list = $("#pickerList");
    list.classList.toggle("grid", grid);
    list.innerHTML = options.map((o, i) => `
      <button class="pick ${o.active ? "active" : ""}" data-i="${i}">
        ${o.icon ? `<span class="pk-ico">${o.icon}</span>` : ""}
        <span>${o.label}${o.sub ? `<small>${o.sub}</small>` : ""}</span>
      </button>`).join("");
    $("#picker").classList.add("open");
    haptic();
    return new Promise((res) => (pickerResolve = res));
  }
  function closePicker(v) {
    $("#picker").classList.remove("open");
    if (pickerResolve) { pickerResolve(v); pickerResolve = null; }
  }
  $("#pickerList").addEventListener("click", (e) => { const b = e.target.closest(".pick"); if (b) closePicker(pickerOptions[Number(b.dataset.i)].v); });
  $("#pickerCancel").addEventListener("click", () => closePicker(null));
  $("#picker").addEventListener("click", (e) => { if (e.target.id === "picker") closePicker(null); });

  // =====================================================================
  // Movimentação (teclado numérico)
  // =====================================================================
  const tx = { editing: null, type: "expense", cat: null, cents: 0, date: "", account: null, toAccount: null, repeat: { kind: "none", n: 3 } };

  function defaultAccount() {
    return accById(state.settings.lastAccount) ? state.settings.lastAccount : state.accounts[0].id;
  }

  function openTx(t = null, type = "expense", preset = {}) {
    tx.editing = t;
    tx.type = t ? t.type : type;
    tx.cat = t ? t.category : preset.cat || null;
    tx.cents = t ? Math.round(t.amount * 100) : 0;
    tx.date = t ? t.date : todayISO();
    tx.account = t ? t.account : defaultAccount();
    tx.toAccount = t?.toAccount || state.accounts.find((a) => a.id !== tx.account)?.id || null;
    tx.repeat = preset.repeat ? { n: 3, ...preset.repeat } : { kind: "none", n: 3 };
    $("#txDesc").value = t ? t.desc : preset.desc || "";
    $("#txDelete").hidden = !t;
    const note = $("#txNote");
    note.hidden = !(t && (t.recId || t.inst));
    if (t?.recId) note.textContent = "🔁 Lançada por uma conta fixa. Para mudar as próximas, vá em Planos → Fixas.";
    else if (t?.inst) note.textContent = `💳 Parcela ${t.inst.i} de ${t.inst.n}. As alterações valem só para esta parcela.`;
    setTxType(tx.type);
    updateAmount();
    openSheet("#txSheet");
  }

  function setTxType(type) {
    if (type === "transfer" && !multiAcc()) {
      toast("Crie uma segunda conta para transferir 🏦");
      if (tx.type === "transfer") tx.type = "expense";
      type = tx.type;
    }
    tx.type = type;
    const tg = $("#typeToggle");
    tg.classList.toggle("income", type === "income");
    tg.classList.toggle("transfer", type === "transfer");
    $$("#typeToggle button").forEach((b) => b.classList.toggle("active", b.dataset.type === type));
    const isTr = type === "transfer";
    $("#txCats").hidden = isTr;
    $("#transferRow").hidden = !isTr;
    if (!isTr) {
      if (!cats(type).some((c) => c.id === tx.cat)) tx.cat = cats(type)[0].id;
      renderCatRail($("#txCats"), cats(type), tx.cat);
    } else if (tx.toAccount === tx.account) {
      tx.toAccount = state.accounts.find((a) => a.id !== tx.account)?.id;
    }
    if (type !== "expense" && tx.repeat.kind === "inst") tx.repeat = { kind: "none", n: 3 };
    if (isTr) tx.repeat = { kind: "none", n: 3 };
    const btn = $("#txSave");
    btn.className = `btn primary block ${type}`;
    btn.textContent = tx.editing ? "Salvar alterações" : { income: "Adicionar receita", expense: "Adicionar despesa", transfer: "Transferir" }[type];
    renderSugg();
    renderOpts();
    updateAmount();
  }

  function renderCatRail(el, list, active) {
    el.innerHTML = list.map((c) =>
      `<button type="button" class="cat-tile ${c.id === active ? "active" : ""}" style="--c:${c.color}" data-cat="${c.id}"><em>${c.icon}</em><span>${escapeHTML(c.name)}</span></button>`).join("");
    const a = $(".cat-tile.active", el);
    if (a) nextFrame(() => { el.scrollLeft = a.offsetLeft - el.clientWidth / 2 + a.offsetWidth / 2; });
  }

  function renderSugg() {
    const el = $("#txSugg");
    if (tx.editing || tx.type === "transfer") { el.innerHTML = ""; return; }
    el.innerHTML = suggestions(tx.type).map((s, i) =>
      `<button type="button" class="sugg" data-s="${i}">${catById(s.cat).icon} ${escapeHTML(s.desc)} <b>${fmt(s.amount)}</b></button>`).join("");
    el._data = suggestions(tx.type);
  }

  function repeatLabel() {
    const r = tx.repeat;
    if (r.kind === "inst") return `Parcelado em ${r.n}x`;
    return FREQ_LABEL[r.kind] || "Não repete";
  }
  function renderOpts() {
    const today = todayISO();
    const d = tx.date;
    $("#optDate span").textContent = d === today ? "Hoje" : d === addDays(today, -1) ? "Ontem" : d === addDays(today, 1) ? "Amanhã" : parseISO(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }).replace(/\./g, "");
    $("#optDate").classList.toggle("on", d !== today);
    const isTr = tx.type === "transfer";
    $("#optAcc").hidden = isTr || !multiAcc();
    $("#optAcc span").textContent = accLabel(tx.account);
    $("#optRepeat").hidden = isTr || !!tx.editing;
    $("#optRepeat span").textContent = repeatLabel();
    $("#optRepeat").classList.toggle("on", tx.repeat.kind !== "none");
    if (isTr) {
      $("#trFrom strong").textContent = accLabel(tx.account);
      $("#trTo strong").textContent = accLabel(tx.toAccount);
    }
  }

  function updateAmount(bump) {
    const d = $("#amountDisplay");
    $("#amountText").textContent = fmt(tx.cents / 100);
    d.classList.toggle("zero", tx.cents === 0);
    if (bump) { d.classList.remove("bump"); void d.offsetWidth; d.classList.add("bump"); }
    const r = tx.repeat;
    let hint = "";
    if (r.kind === "inst") hint = tx.cents ? `${r.n}x de ${fmt(tx.cents / 100 / r.n)}` : `Digite o valor total da compra`;
    else if (r.kind === "monthly") hint = `🔁 Lançada sozinha todo dia ${parseISO(tx.date).getDate()}`;
    else if (r.kind === "weekly") hint = "🔁 Lançada sozinha toda semana";
    else if (r.kind === "yearly") hint = "🔁 Lançada sozinha todo ano";
    else if (tx.date > todayISO()) hint = "📅 Fica agendada para a data escolhida";
    $("#amountHint").textContent = hint;
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

  $("#typeToggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { setTxType(b.dataset.type); haptic(); } });
  $("#txCats").addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile"); if (!b) return;
    tx.cat = b.dataset.cat;
    $$("#txCats .cat-tile").forEach((c) => c.classList.toggle("active", c === b));
    haptic();
  });
  $("#txSugg").addEventListener("click", (e) => {
    const b = e.target.closest(".sugg"); if (!b) return;
    const s = $("#txSugg")._data[Number(b.dataset.s)];
    tx.cents = Math.round(s.amount * 100);
    tx.cat = s.cat;
    $("#txDesc").value = s.desc;
    renderCatRail($("#txCats"), cats(tx.type), tx.cat);
    updateAmount(true);
    haptic(12);
  });
  $("#keypad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pressKey(b.dataset.k); });
  $("#txDesc").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });

  $("#optDate").addEventListener("click", async () => {
    const today = todayISO();
    const v = await pick("Quando foi?", [
      { v: today, icon: "☀️", label: "Hoje", active: tx.date === today },
      { v: addDays(today, -1), icon: "🌙", label: "Ontem", active: tx.date === addDays(today, -1) },
      { v: addDays(today, -2), icon: "⏪", label: "Anteontem", active: tx.date === addDays(today, -2) },
      { v: "other", icon: "📅", label: "Escolher outra data", sub: "Pode ser no futuro para agendar" },
    ]);
    if (!v) return;
    if (v === "other") {
      const input = $("#txDate");
      input.value = tx.date;
      try { input.showPicker(); } catch (e) { input.click(); }
      return;
    }
    tx.date = v; renderOpts(); updateAmount();
  });
  $("#txDate").addEventListener("change", (e) => { if (e.target.value) { tx.date = e.target.value; renderOpts(); updateAmount(); } });

  async function pickAccount(title, current, exclude) {
    const v = await pick(title, state.accounts.filter((a) => a.id !== exclude).map((a) => ({
      v: a.id, icon: a.emoji, label: escapeHTML(a.name), sub: `Saldo: ${fmt(accountBalance(a.id))}`, active: a.id === current,
    })));
    return v;
  }
  $("#optAcc").addEventListener("click", async () => { const v = await pickAccount("Qual conta?", tx.account); if (v) { tx.account = v; renderOpts(); } });
  $("#trFrom").addEventListener("click", async () => {
    const v = await pickAccount("Sai de qual conta?", tx.account); if (!v) return;
    tx.account = v;
    if (tx.toAccount === v) tx.toAccount = state.accounts.find((a) => a.id !== v)?.id;
    renderOpts();
  });
  $("#trTo").addEventListener("click", async () => { const v = await pickAccount("Vai para qual conta?", tx.toAccount, tx.account); if (v) { tx.toAccount = v; renderOpts(); } });

  $("#optRepeat").addEventListener("click", async () => {
    const opts = [
      { v: "none", icon: "1️⃣", label: "Não repete", active: tx.repeat.kind === "none" },
      { v: "monthly", icon: "🔁", label: "Todo mês", sub: "Assinaturas, aluguel, salário…", active: tx.repeat.kind === "monthly" },
      { v: "weekly", icon: "📆", label: "Toda semana", active: tx.repeat.kind === "weekly" },
      { v: "yearly", icon: "🗓️", label: "Todo ano", sub: "IPVA, anuidades, seguros…", active: tx.repeat.kind === "yearly" },
    ];
    if (tx.type === "expense") opts.push({ v: "inst", icon: "💳", label: "Parcelar", sub: "Divide o valor total em parcelas mensais", active: tx.repeat.kind === "inst" });
    const v = await pick("Repetir esta movimentação?", opts);
    if (!v) return;
    if (v === "inst") {
      const n = await pick("Em quantas parcelas?", Array.from({ length: 23 }, (_, i) => ({ v: i + 2, label: `${i + 2}x`, active: tx.repeat.n === i + 2 })), true);
      if (!n) return;
      tx.repeat = { kind: "inst", n };
    } else tx.repeat = { kind: v, n: tx.repeat.n };
    renderOpts(); updateAmount();
  });

  function saveTx() {
    if (tx.cents <= 0) { shake($("#amountDisplay")); toast("Digite um valor no teclado 👇"); haptic(30); return; }
    const amount = tx.cents / 100;
    const wasEdit = !!tx.editing;
    let msg;
    if (tx.type === "transfer") {
      if (!tx.toAccount || tx.toAccount === tx.account) { toast("Escolha contas diferentes"); return; }
      const data = { type: "transfer", desc: $("#txDesc").value.trim() || "Transferência", amount, category: "transfer", date: tx.date, account: tx.account, toAccount: tx.toAccount };
      if (tx.editing) Object.assign(tx.editing, data); else state.transactions.push({ id: uid(), ...data });
      msg = wasEdit ? "Alterações salvas ✅" : `${fmt(amount)} transferido para ${accById(tx.toAccount).name} 🔄`;
    } else {
      const desc = $("#txDesc").value.trim() || catById(tx.cat).name;
      const base = { type: tx.type, desc, category: tx.cat, account: tx.account };
      const r = tx.repeat;
      if (tx.editing) {
        Object.assign(tx.editing, { ...base, amount, date: tx.date });
        msg = "Alterações salvas ✅";
      } else if (r.kind === "inst") {
        const g = uid();
        const per = Math.floor(tx.cents / r.n);
        const first = tx.cents - per * (r.n - 1);
        const day = parseISO(tx.date).getDate();
        for (let i = 0; i < r.n; i++) {
          state.transactions.push({ id: uid(), ...base, desc: `${desc} (${i + 1}/${r.n})`, amount: (i === 0 ? first : per) / 100, date: addMonthsISO(tx.date, i, day), inst: { g, i: i + 1, n: r.n } });
        }
        msg = `Compra parcelada em ${r.n}x de ${fmt(per / 100)} 💳`;
      } else if (r.kind !== "none") {
        state.recurring.push({ id: uid(), ...base, amount, freq: r.kind, day: parseISO(tx.date).getDate(), next: tx.date, paused: false });
        processRecurrences();
        msg = tx.date > todayISO() ? `Conta fixa criada. Primeira cobrança ${relDay(tx.date)} 🔁` : `${desc} vai ser lançada sozinha ${FREQ_LABEL[r.kind].toLowerCase()} 🔁`;
      } else {
        state.transactions.push({ id: uid(), ...base, amount, date: tx.date });
        msg = tx.type === "income" ? `Receita de ${fmt(amount)} adicionada 💸` : `Despesa de ${fmt(amount)} registrada 🧾`;
      }
      state.settings.lastAccount = tx.account;
    }
    if (!wasEdit) recordActivity();
    save();
    closeSheet();
    viewMonth = shiftMonth(parseISO(tx.date), 0);
    renderAll();
    haptic(18);
    toast(msg);
  }
  $("#txSave").addEventListener("click", saveTx);

  $("#txDelete").addEventListener("click", async () => {
    const t = tx.editing; if (!t) return;
    if (t.inst) {
      const v = await pick("Excluir parcela", [
        { v: "one", icon: "1️⃣", label: "Só esta parcela" },
        { v: "next", icon: "⏭️", label: "Esta e as próximas" },
        { v: "all", icon: "🗑️", label: `Todas as ${t.inst.n} parcelas` },
      ]);
      if (!v) return;
      closeSheet();
      if (v === "one") return deleteTx(t.id);
      const removed = state.transactions.filter((x) => x.inst?.g === t.inst.g && (v === "all" || x.inst.i >= t.inst.i));
      state.transactions = state.transactions.filter((x) => !removed.includes(x));
      save(); renderAll();
      toast(`${removed.length} parcelas excluídas`, "Desfazer", () => { state.transactions.push(...removed); save(); renderAll(); });
      return;
    }
    closeSheet();
    deleteTx(t.id);
  });

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
    if (!$("#lock").hidden && /^\d$/.test(e.key)) { pinKey(e.key); return; }
    if (!$("#lock").hidden && e.key === "Backspace") { pinKey("back"); return; }
    if (openSheetEl?.id !== "txSheet" || e.target.matches("input") || $("#picker").classList.contains("open")) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("back");
    else if (e.key === "Enter") saveTx();
  });

  // Toque abre a edição; arrastar para a esquerda exclui
  let suppressClick = false;
  function enableSwipe(list) {
    let row = null, inner = null, x0 = 0, y0 = 0, dx = 0, mode = null, pid = null, armed = false;
    const threshold = (r) => Math.min(130, r.offsetWidth * 0.35);
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

  // =====================================================================
  // Extrato: filtros
  // =====================================================================
  $("#typeFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    typeFilter = b.dataset.filter;
    setSeg($("#typeFilter"), "filter", typeFilter);
    renderTx(); haptic();
  });
  $("#txFilters").addEventListener("click", (e) => {
    const b = e.target.closest(".fchip"); if (!b) return;
    if ("fday" in b.dataset) dayFilter = null;
    else accFilter = b.dataset.facc || null;
    renderTx(); haptic();
  });
  $("#search").addEventListener("input", (e) => { searchTerm = e.target.value; renderTx(); });
  $("#searchClear").addEventListener("click", () => { searchTerm = ""; $("#search").value = ""; renderTx(); });
  $("#catList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat-search]"); if (!b) return;
    searchTerm = b.dataset.catSearch; $("#search").value = searchTerm;
    typeFilter = "expense"; setSeg($("#typeFilter"), "filter", "expense");
    go("tx");
  });
  $("#calendar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]"); if (!b) return;
    dayFilter = b.dataset.day;
    typeFilter = "all"; setSeg($("#typeFilter"), "filter", "all");
    searchTerm = ""; $("#search").value = "";
    go("tx");
  });
  $("#ruleInfo").addEventListener("click", () => confirmDialog({
    title: "Regra 50/30/20", ico: "⚖️", ok: "Entendi", alert: true,
    text: "Um jeito simples de equilibrar o dinheiro: até 50% da renda para necessidades (casa, mercado, contas), até 30% para desejos (lazer, compras, assinaturas) e pelo menos 20% guardado.",
  }));

  // =====================================================================
  // Contas fixas
  // =====================================================================
  let editingRec = null, recFreq = "monthly", recCat = null;
  function openRec(r) {
    editingRec = r;
    recFreq = r.freq; recCat = r.category;
    $("#recTitle").textContent = r.type === "income" ? "Receita fixa" : "Conta fixa";
    $("#recDesc").value = r.desc;
    $("#recAmount").value = moneyToInput(r.amount);
    $("#recNext").value = r.next;
    $("#recPaused").checked = !!r.paused;
    setSeg2($("#recFreq"), "f", recFreq);
    renderCatRail($("#recCats"), cats(r.type), recCat);
    const paid = state.transactions.filter((t) => t.recId === r.id);
    const total = paid.reduce((s, t) => s + t.amount, 0);
    $("#recStats").innerHTML = `
      <div><small>${r.type === "income" ? "Já recebeu" : "Já pagou"}</small><strong class="money">${fmt(total)}</strong><small>${paid.length} vez${paid.length === 1 ? "" : "es"}</small></div>
      <div><small>Custo por ano</small><strong class="money">${fmt(monthlyCost(r) * 12)}</strong><small>${FREQ_LABEL[r.freq].toLowerCase()}</small></div>`;
    openSheet("#recSheet");
  }
  function setSeg2(el, attr, v) { $$(`[data-${attr}]`, el).forEach((b) => b.classList.toggle("active", b.dataset[attr] === v)); }
  $("#recFreq").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { recFreq = b.dataset.f; setSeg2($("#recFreq"), "f", recFreq); haptic(); } });
  $("#recCats").addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile"); if (!b) return;
    recCat = b.dataset.cat;
    $$("#recCats .cat-tile").forEach((c) => c.classList.toggle("active", c === b));
  });
  $("#recForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const r = editingRec;
    const amount = parseMoney($("#recAmount").value);
    const next = $("#recNext").value;
    if (!(amount > 0)) { shake($("#recAmount")); toast("Informe o valor"); return; }
    if (!next) { shake($("#recNext")); return; }
    const wasPaused = r.paused;
    Object.assign(r, { desc: $("#recDesc").value.trim() || r.desc, amount, freq: recFreq, category: recCat, next, day: parseISO(next).getDate(), paused: $("#recPaused").checked });
    // Ao reativar, não lança cobranças atrasadas: pula para a próxima data a partir de hoje
    if (wasPaused && !r.paused) { const t = todayISO(); let g = 0; while (r.next < t && g++ < 600) r.next = advance(r.next, r.freq, r.day); }
    processRecurrences();
    save(); closeSheet(); renderAll();
    toast(r.paused ? "Conta fixa pausada ⏸️" : "Conta fixa atualizada ✅");
  });
  $("#recDelete").addEventListener("click", async () => {
    const r = editingRec;
    if (!(await confirmDialog({ title: "Cancelar conta fixa?", text: `"${r.desc}" para de ser lançada. As cobranças que já aconteceram continuam no extrato.`, ok: "Cancelar conta", ico: "✂️", danger: true }))) return;
    state.recurring = state.recurring.filter((x) => x !== r);
    save(); closeSheet(); renderAll();
    toast(`${r.desc} cancelada ✂️`);
  });
  $("#popularSubs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-popular]"); if (!b) return;
    const p = POPULAR_SUBS.find((x) => x.desc === b.dataset.popular);
    openTx(null, "expense", { repeat: { kind: "monthly" }, desc: p.desc, cat: p.cat });
  });

  // =====================================================================
  // Metas
  // =====================================================================
  let editingGoal = null;
  let goalEmoji = GOAL_EMOJIS[0];
  function renderEmojiRail(el, list, active) {
    el.innerHTML = list.map((e) => `<button type="button" class="${e === active ? "active" : ""}" data-e="${e}">${e}</button>`).join("");
  }
  function updateGoalHint() {
    const target = parseMoney($("#goalTarget").value);
    const saved = parseMoney($("#goalSaved").value) || 0;
    const dl = $("#goalDeadline").value;
    $("#goalPlanHint").innerHTML = target > saved && dl ? `💡 ${goalPlan({ target, saved, deadline: dl })}` : "";
  }
  function openGoal(g = null) {
    editingGoal = g;
    goalEmoji = g?.emoji || GOAL_EMOJIS[0];
    if (!GOAL_EMOJIS.includes(goalEmoji)) GOAL_EMOJIS.unshift(goalEmoji);
    renderEmojiRail($("#emojiRail"), GOAL_EMOJIS, goalEmoji);
    $("#goalTitle").textContent = g ? "Editar meta" : "Nova meta";
    $("#goalDelete").hidden = !g;
    $("#goalName").value = g ? g.name : "";
    $("#goalTarget").value = g ? moneyToInput(g.target) : "";
    $("#goalSaved").value = g ? moneyToInput(g.saved) : "";
    $("#goalDeadline").value = g?.deadline || "";
    updateGoalHint();
    openSheet("#goalSheet");
  }
  ["#goalTarget", "#goalSaved", "#goalDeadline"].forEach((s) => $(s).addEventListener("input", updateGoalHint));
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
    const data = { name, emoji: goalEmoji, target, saved: Math.max(0, saved), deadline: $("#goalDeadline").value || null };
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
    $("#depositPlan").innerHTML = goalPlan(g) ? `💡 ${goalPlan(g)}` : "";
    $("#depositAmount").value = "";
    $("#depositTrack").style.width = "0%";
    openSheet("#depositSheet");
    nextFrame(() => ($("#depositTrack").style.width = `${clamp((g.saved / g.target) * 100, 0, 100)}%`));
  }
  $("#depositEdit").addEventListener("click", () => { const g = depositGoal; swapSheet(() => openGoal(g)); });
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
    g.saved = round2(g.saved + sign * v);
    recordActivity();
    save(); closeSheet(); renderAll();
    haptic(18);
    if (!wasDone && g.saved >= g.target) celebrate(g.name);
    else toast(sign > 0 ? `${fmt(v)} guardado em ${g.name} 🐷` : `${fmt(v)} retirado de ${g.name}`);
  }
  $("#depositForm").addEventListener("submit", (e) => { e.preventDefault(); moveGoal(1); });
  $("#withdrawBtn").addEventListener("click", () => moveGoal(-1));

  // =====================================================================
  // Limites
  // =====================================================================
  let budgetCat = null;
  function openBudget(cat = null) {
    const list = cats("expense");
    budgetCat = cat || list.find((c) => !(c.id in state.budgets))?.id || list[0].id;
    renderCatRail($("#budgetCats"), list, budgetCat);
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

  // =====================================================================
  // Contas
  // =====================================================================
  let editingAcc = null, accEmoji = ACC_EMOJIS[0], accColor = PALETTE[0];
  function renderSwatches(el, active) {
    el.innerHTML = PALETTE.map((c) => `<button type="button" class="${c === active ? "active" : ""}" data-c="${c}" style="background:${c}" aria-label="Cor"></button>`).join("");
  }
  function openAccount(a = null) {
    editingAcc = a;
    accEmoji = a?.emoji || ACC_EMOJIS[(state.accounts.length) % ACC_EMOJIS.length];
    accColor = a?.color || PALETTE[(state.accounts.length * 3) % PALETTE.length];
    renderEmojiRail($("#accEmojis"), ACC_EMOJIS.includes(accEmoji) ? ACC_EMOJIS : [accEmoji, ...ACC_EMOJIS], accEmoji);
    renderSwatches($("#accColors"), accColor);
    $("#accTitle").textContent = a ? "Editar conta" : "Nova conta";
    $("#accName").value = a ? a.name : "";
    $("#accInitial").value = a ? moneyToInput(a.initial) : "";
    $("#accDelete").hidden = !a || state.accounts.length < 2;
    const bal = $("#accBalance");
    bal.hidden = !a;
    if (a) bal.innerHTML = `<small>Saldo agora</small><strong class="money">${fmt(accountBalance(a.id))}</strong>`;
    openSheet("#accountSheet");
  }
  $("#accEmojis").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; accEmoji = b.dataset.e; $$("#accEmojis button").forEach((x) => x.classList.toggle("active", x === b)); });
  $("#accColors").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; accColor = b.dataset.c; $$("#accColors button").forEach((x) => x.classList.toggle("active", x === b)); });
  $("#accForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#accName").value.trim();
    if (!name) { shake($("#accName")); toast("Dê um nome para a conta"); return; }
    const initial = parseMoney($("#accInitial").value) || 0;
    const data = { name, emoji: accEmoji, color: accColor, initial };
    if (editingAcc) Object.assign(editingAcc, data);
    else state.accounts.push({ id: uid(), ...data });
    save(); closeSheet(); renderAll();
    toast(editingAcc ? "Conta atualizada ✅" : `Conta ${name} criada 🏦`);
  });
  $("#accDelete").addEventListener("click", async () => {
    const a = editingAcc;
    const used = state.transactions.some((t) => t.account === a.id || t.toAccount === a.id) || state.recurring.some((r) => r.account === a.id);
    if (used) {
      const others = state.accounts.filter((x) => x.id !== a.id);
      const target = await pick(`Mover as movimentações de ${escapeHTML(a.name)} para:`, others.map((o) => ({ v: o.id, icon: o.emoji, label: escapeHTML(o.name) })));
      if (!target) return;
      for (const t of state.transactions) { if (t.account === a.id) t.account = target; if (t.toAccount === a.id) t.toAccount = target; }
      state.transactions = state.transactions.filter((t) => !(t.type === "transfer" && t.account === t.toAccount));
      for (const r of state.recurring) if (r.account === a.id) r.account = target;
      accById(target).initial = round2((accById(target).initial || 0) + (a.initial || 0));
    } else if (!(await confirmDialog({ title: "Excluir conta?", text: `A conta "${a.name}" será removida.`, ok: "Excluir", ico: "🗑️", danger: true }))) return;
    state.accounts = state.accounts.filter((x) => x !== a);
    if (accFilter === a.id) accFilter = null;
    save(); closeSheet(); renderAll();
    toast("Conta excluída");
  });
  $("#accRail").addEventListener("click", (e) => { const b = e.target.closest("[data-acc]"); if (b) openAccount(accById(b.dataset.acc)); });

  // =====================================================================
  // Empréstimos
  // =====================================================================
  let editingDebt = null, debtDir = "owed", viewDebt = null;
  function openDebt(d = null) {
    editingDebt = d;
    debtDir = d?.dir || "owed";
    setSeg($("#debtDir"), "dir", debtDir);
    $("#debtTitle").textContent = d ? "Editar empréstimo" : "Novo empréstimo";
    $("#debtDelete").hidden = !d;
    $("#debtPerson").value = d?.person || "";
    $("#debtAmount").value = d ? moneyToInput(d.amount) : "";
    $("#debtDue").value = d?.due || "";
    $("#debtDesc").value = d?.desc || "";
    openSheet("#debtSheet");
  }
  $("#debtDir").addEventListener("click", (e) => { const b = e.target.closest("[data-dir]"); if (b) { debtDir = b.dataset.dir; setSeg($("#debtDir"), "dir", debtDir); haptic(); } });
  $("#debtForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const person = $("#debtPerson").value.trim();
    const amount = parseMoney($("#debtAmount").value);
    if (!person) { shake($("#debtPerson")); toast("Quem é a pessoa?"); return; }
    if (!(amount > 0)) { shake($("#debtAmount")); toast("Informe o valor"); return; }
    const data = { person, amount, dir: debtDir, due: $("#debtDue").value || null, desc: $("#debtDesc").value.trim() };
    if (editingDebt) { Object.assign(editingDebt, data); editingDebt.done = editingDebt.paid >= editingDebt.amount; }
    else state.debts.push({ id: uid(), ...data, paid: 0, done: false, date: todayISO() });
    save(); closeSheet(); renderAll();
    toast(editingDebt ? "Empréstimo atualizado ✅" : debtDir === "owed" ? `Anotado: ${person} te deve ${fmt(amount)} 🤝` : `Anotado: você deve ${fmt(amount)} para ${person}`);
  });
  $("#debtDelete").addEventListener("click", async () => {
    const d = editingDebt;
    if (!(await confirmDialog({ title: "Excluir empréstimo?", text: `O registro com ${d.person} será removido.`, ok: "Excluir", ico: "🗑️", danger: true }))) return;
    state.debts = state.debts.filter((x) => x !== d);
    save(); closeSheet(); renderAll();
  });
  function openDebtView(d) {
    viewDebt = d;
    const left = d.amount - d.paid;
    $("#dvEmoji").textContent = d.dir === "owed" ? "🤝" : "🙏";
    $("#dvName").textContent = d.person;
    $("#dvInfo").innerHTML = d.done ? "✅ Quitado" : `${d.dir === "owed" ? "Falta receber" : "Falta pagar"} <span class="money">${fmt(left)}</span> de <span class="money">${fmt(d.amount)}</span>`;
    $("#dvAmount").value = "";
    $("#dvLaunchHint").textContent = d.dir === "owed" ? "Entra como receita na sua conta" : "Sai como despesa da sua conta";
    $("#dvForm").hidden = d.done;
    $("#dvTrack").style.width = "0%";
    openSheet("#debtViewSheet");
    nextFrame(() => ($("#dvTrack").style.width = `${clamp((d.paid / d.amount) * 100, 0, 100)}%`));
  }
  function payDebt(v) {
    const d = viewDebt;
    const left = round2(d.amount - d.paid);
    if (!(v > 0)) { shake($("#dvAmount")); toast("Digite um valor"); return; }
    v = Math.min(v, left);
    d.paid = round2(d.paid + v);
    if (d.paid >= d.amount) d.done = true;
    if ($("#dvLaunch").checked) {
      state.transactions.push({
        id: uid(), type: d.dir === "owed" ? "income" : "expense", amount: v, date: todayISO(), account: defaultAccount(),
        desc: d.dir === "owed" ? `${d.person} me pagou` : `Paguei ${d.person}`, category: d.dir === "owed" ? "outras-receitas" : "outros",
      });
    }
    recordActivity();
    save(); closeSheet(); renderAll();
    if (d.done) { toast(`${d.person}: tudo quitado! ✅`); burst(80); } else toast(`Pagamento de ${fmt(v)} registrado`);
  }
  $("#dvForm").addEventListener("submit", (e) => { e.preventDefault(); payDebt(parseMoney($("#dvAmount").value)); });
  $("#dvSettle").addEventListener("click", () => payDebt(round2(viewDebt.amount - viewDebt.paid)));
  $("#dvEdit").addEventListener("click", () => { const d = viewDebt; swapSheet(() => openDebt(d)); });

  // =====================================================================
  // Categorias
  // =====================================================================
  let catTypeView = "expense", newCatColor = PALETTE[0];
  function renderCatGrid() {
    $("#catGrid").innerHTML = cats(catTypeView).map((c, i) => `
      <div class="cat-cell" style="--c:${c.color}; animation-delay:${i * 20}ms">
        <em>${c.icon}</em><span>${escapeHTML(c.name)}</span>
        ${c.id.startsWith("c_") ? `<button class="cat-del" data-del="${c.id}" aria-label="Excluir"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>` : ""}
      </div>`).join("");
  }
  function openCategories() {
    catTypeView = "expense";
    setSeg($("#catType"), "t", "expense");
    renderSwatches($("#newCatColors"), newCatColor);
    $("#newCatIcon").value = ""; $("#newCatName").value = "";
    renderCatGrid();
    openSheet("#catSheet");
  }
  $("#catType").addEventListener("click", (e) => { const b = e.target.closest("[data-t]"); if (b) { catTypeView = b.dataset.t; setSeg($("#catType"), "t", catTypeView); renderCatGrid(); } });
  $("#newCatColors").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; newCatColor = b.dataset.c; $$("#newCatColors button").forEach((x) => x.classList.toggle("active", x === b)); });
  $("#newCatSave").addEventListener("click", () => {
    const name = $("#newCatName").value.trim();
    const icon = $("#newCatIcon").value.trim() || "🏷️";
    if (!name) { shake($("#newCatName")); toast("Dê um nome para a categoria"); return; }
    if (cats(catTypeView).some((c) => c.name.toLowerCase() === name.toLowerCase())) { toast("Já existe uma categoria com esse nome"); return; }
    state.customCats.push({ id: "c_" + uid(), name, icon, color: newCatColor, type: catTypeView });
    save(); renderCatGrid();
    $("#newCatIcon").value = ""; $("#newCatName").value = "";
    toast(`Categoria ${icon} ${name} criada`);
    haptic(15);
  });
  $("#catGrid").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const c = state.customCats.find((x) => x.id === b.dataset.del);
    if (!(await confirmDialog({ title: "Excluir categoria?", text: `"${c.name}" some das opções. As movimentações antigas continuam com ela.`, ok: "Excluir", ico: "🏷️", danger: true }))) return;
    const used = state.transactions.some((t) => t.category === c.id) || state.recurring.some((r) => r.category === c.id);
    if (used) c.hidden = true; else state.customCats = state.customCats.filter((x) => x !== c);
    save(); renderCatGrid(); renderAll();
  });

  // =====================================================================
  // Conquistas
  // =====================================================================
  function openAchievements() {
    const st = streak();
    $("#achStreak").textContent = `${st} dia${st === 1 ? "" : "s"} seguido${st === 1 ? "" : "s"}`;
    $("#achBest").textContent = st ? `Recorde: ${state.bestStreak} · volte amanhã para manter o fogo 🔥` : `Recorde: ${state.bestStreak} · registre algo hoje para começar`;
    const got = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
    $("#achCount").textContent = `${got} de ${ACHIEVEMENTS.length} conquistas desbloqueadas`;
    $("#achGrid").innerHTML = ACHIEVEMENTS.map((a, i) => {
      const d = state.achievements[a.id];
      return `<div class="ach ${d ? "" : "locked"}" style="animation-delay:${i * 30}ms">
        <div class="ach-ico">${d ? a.icon : "🔒"}</div><strong>${a.name}</strong><small>${a.desc}</small>
        ${d ? `<small class="ach-date">${shortDate(d)}</small>` : ""}
      </div>`;
    }).join("");
    openSheet("#achSheet");
  }
  $("#streakChip").addEventListener("click", openAchievements);

  // =====================================================================
  // Botões gerais
  // =====================================================================
  document.addEventListener("click", (e) => {
    const t = e.target;
    const open = t.closest("[data-open]");
    if (open) {
      ({
        tx: () => openTx(), goal: () => openGoal(), budget: () => openBudget(), account: () => openAccount(), debt: () => openDebt(),
        sub: () => openTx(null, "expense", { repeat: { kind: "monthly" }, cat: "assinaturas" }),
      })[open.dataset.open]?.();
      return;
    }
    const gt = t.closest("[data-goto]");
    if (gt) { go(gt.dataset.goto); if (gt.dataset.plan) setPlan(gt.dataset.plan); return; }
    const goal = t.closest("[data-goal]");
    if (goal) { const g = state.goals.find((x) => x.id === goal.dataset.goal); if (g) openDeposit(g); return; }
    const rec = t.closest("[data-rec]");
    if (rec) { const r = state.recurring.find((x) => x.id === rec.dataset.rec); if (r) openRec(r); return; }
    const debt = t.closest("[data-debt]");
    if (debt) { const d = state.debts.find((x) => x.id === debt.dataset.debt); if (d) openDebtView(d); return; }
    const up = t.closest("[data-up]");
    if (up) {
      const [kind, id] = up.dataset.up.split(":");
      if (kind === "rec") { const r = state.recurring.find((x) => x.id === id); if (r) openRec(r); }
      else { const x = state.transactions.find((y) => y.id === id); if (x) openTx(x); }
    }
  });
  $("#quick").addEventListener("click", (e) => {
    const b = e.target.closest("[data-quick]"); if (!b) return;
    const q = b.dataset.quick;
    if (q === "income" || q === "expense") openTx(null, q);
    else if (q === "transfer") { if (multiAcc()) openTx(null, "transfer"); else { toast("Crie uma segunda conta para transferir 🏦"); openAccount(); } }
    else if (q === "sub") openTx(null, "expense", { repeat: { kind: "monthly" }, cat: "assinaturas" });
    else if (q === "inst") openTx(null, "expense", { repeat: { kind: "inst", n: 3 }, cat: "compras" });
    else if (q === "goal") openGoal();
    else if (q === "budget") openBudget();
    else if (q === "debt") openDebt();
  });
  $("#fab").addEventListener("click", () => (openSheetEl ? closeSheet() : openTx()));
  $("#storyBanner").addEventListener("click", () => openStories(shiftMonth(new Date(), -1)));
  $("#storyBtn").addEventListener("click", () => openStories(viewMonth));

  // =====================================================================
  // Configurações
  // =====================================================================
  function openSettings() {
    $("#nameInput").value = state.settings.name;
    $("#hideToggle").checked = !!state.settings.hide;
    $("#hapticToggle").checked = !!state.settings.haptics;
    $("#pinToggle").checked = !!state.settings.pinHash;
    $("#reminderToggle").checked = !!state.settings.reminder.on;
    $("#reminderHours").hidden = !state.settings.reminder.on;
    const got = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
    $("#achRowHint").textContent = `${got} de ${ACHIEVEMENTS.length} desbloqueadas · 🔥 ${streak()}`;
    $("#accentPicker").innerHTML = ACCENTS.map((a) => `<button class="${(state.settings.accent || "violet") === a.id ? "active" : ""}" data-accent="${a.id}" style="background:${a.color}" aria-label="Cor ${a.id}"></button>`).join("");
    $("#hourPicker").innerHTML = REMINDER_HOURS.map((h) => `<button class="${state.settings.reminder.hour === h ? "active" : ""}" data-hour="${h}">${h}h</button>`).join("");
    openSheet("#settingsSheet");
  }
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#helloBtn").addEventListener("click", openSettings);
  $("#nameInput").addEventListener("input", (e) => { state.settings.name = e.target.value; save(); renderHeader(); });
  $("#hideToggle").addEventListener("change", (e) => { state.settings.hide = e.target.checked; save(); renderHeader(); if (currentTab === "stats") renderStats(); });
  $("#hapticToggle").addEventListener("change", (e) => { state.settings.haptics = e.target.checked; save(); haptic(20); });
  $("#accentPicker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-accent]"); if (!b) return;
    state.settings.accent = b.dataset.accent; save(); renderHeader();
    $$("#accentPicker button").forEach((x) => x.classList.toggle("active", x === b));
    haptic(12);
  });
  $("#eyeBtn").addEventListener("click", () => {
    state.settings.hide = !state.settings.hide; save(); renderHeader(); haptic();
    if (currentTab === "stats") renderStats();
    toast(state.settings.hide ? "Valores escondidos 🙈" : "Valores visíveis 👀");
  });

  function syncReminder() {
    if (!IS_APP || !bridge.setReminder) return;
    try { bridge.setReminder(!!state.settings.reminder.on, state.settings.reminder.hour); } catch (e) { /* app antigo */ }
  }
  $("#reminderToggle").addEventListener("change", (e) => {
    state.settings.reminder.on = e.target.checked; save(); syncReminder();
    $("#reminderHours").hidden = !e.target.checked;
    toast(e.target.checked ? `Lembrete todo dia às ${state.settings.reminder.hour}h ⏰` : "Lembrete desligado");
  });
  $("#hourPicker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hour]"); if (!b) return;
    state.settings.reminder.hour = Number(b.dataset.hour); save(); syncReminder();
    $$("#hourPicker button").forEach((x) => x.classList.toggle("active", x === b));
    toast(`Lembrete às ${b.dataset.hour}h ⏰`);
  });
  $("#pinToggle").addEventListener("change", async (e) => {
    const want = e.target.checked;
    e.target.checked = !want;
    if (want) {
      if (await openLock("setup")) { e.target.checked = true; toast("PIN ativado 🔒"); }
    } else if (await openLock("verify")) {
      state.settings.pinHash = null; state.settings.pinSalt = null; save();
      e.target.checked = false; toast("PIN desativado");
    }
  });

  function download(name, content, mime) {
    if (IS_APP && bridge.saveFile) { bridge.saveFile(name, content); return; }
    const blob = new Blob([content], { type: mime });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Arquivo salvo 💾");
  }
  function toCSV() {
    const q = (v) => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const num = (n) => n.toFixed(2).replace(".", ",");
    const rows = [["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor"]];
    for (const t of [...state.transactions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      const date = t.date.split("-").reverse().join("/");
      if (t.type === "transfer") rows.push([date, "Transferência", t.desc, "", `${accById(t.account)?.name || ""} → ${accById(t.toAccount)?.name || ""}`, num(t.amount)]);
      else rows.push([date, t.type === "income" ? "Receita" : "Despesa", t.desc, catById(t.category).name, accById(t.account)?.name || "", num(t.type === "income" ? t.amount : -t.amount)]);
    }
    return "﻿" + rows.map((r) => r.map(q).join(";")).join("\r\n");
  }

  $("#settingsSheet").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-action]"); if (!b) return;
    const action = b.dataset.action;
    if (action === "export") download(`fluxo-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), "application/json");
    else if (action === "csv") download(`fluxo-movimentacoes-${todayISO()}.csv`, toCSV(), "text/csv");
    else if (action === "achievements") swapSheet(openAchievements);
    else if (action === "categories") swapSheet(openCategories);
    else if (action === "news") swapSheet(() => openSheet("#newsSheet"));
    else if (action === "accounts") {
      closeSheet();
      const v = await pick("Suas contas", [
        ...state.accounts.map((a) => ({ v: a.id, icon: a.emoji, label: escapeHTML(a.name), sub: `Saldo: ${fmt(accountBalance(a.id))}` })),
        { v: "new", icon: "➕", label: "Nova conta" },
      ]);
      if (v === "new") openAccount(); else if (v) openAccount(accById(v));
    } else if (action === "demo") {
      if (!(await confirmDialog({ title: "Carregar exemplo?", text: "Seus dados atuais serão substituídos por dados de exemplo.", ok: "Carregar", ico: "✨" }))) return;
      loadDemo(); closeSheet();
      toast("Dados de exemplo carregados ✨");
    } else if (action === "reset") {
      if (!(await confirmDialog({ title: "Apagar tudo?", text: "Todas as movimentações, contas fixas, metas, empréstimos e limites deste aparelho serão apagados. Não dá para desfazer.", ok: "Apagar tudo", ico: "🗑️", danger: true }))) return;
      const keep = { ...state.settings };
      achSilent = true;
      state = normalize({ settings: keep, version: APP_VERSION });
      save(); achSilent = false;
      closeSheet(); renderAll();
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
      achSilent = true;
      state = normalize(data);
      state.settings.seenVersion = APP_VERSION;
      processRecurrences(); save();
      achSilent = false;
      closeSheet(); renderAll();
      toast("Backup restaurado ✅");
    } catch (err) { toast("Arquivo de backup inválido ⚠️"); }
  });
  window.fluxoToast = (msg) => toast(msg);
  $("#newsOk").addEventListener("click", () => { state.settings.seenVersion = APP_VERSION; save(); closeSheet(); burst(70); });

  // =====================================================================
  // Dados de exemplo
  // =====================================================================
  function loadDemo() {
    const now = new Date();
    const settings = { ...state.settings, seenVersion: APP_VERSION, lastAccount: "nubank" };
    achSilent = true;
    state = normalize({ settings, version: APP_VERSION });
    state.accounts = [
      { id: "carteira", name: "Carteira", emoji: "👛", color: "#fbbf24", initial: 180 },
      { id: "nubank", name: "Nubank", emoji: "💜", color: "#8b5cf6", initial: 2400 },
      { id: "poupanca", name: "Poupança", emoji: "🐷", color: "#34d399", initial: 6000 },
    ];
    const start = (day) => toISO(new Date(now.getFullYear(), now.getMonth() - 5, day));
    const rec = (type, desc, amount, category, day, account = "nubank") =>
      state.recurring.push({ id: uid(), type, desc, amount, category, account, freq: "monthly", day, next: start(day), paused: false });
    rec("income", "Salário", 6200, "salario", 5);
    rec("expense", "Aluguel", 1850, "moradia", 6);
    rec("expense", "Internet", 119.9, "contas", 11);
    rec("expense", "Netflix", 55.9, "assinaturas", 12);
    rec("expense", "Spotify", 21.9, "assinaturas", 15);
    rec("expense", "Academia", 129.9, "saude", 14);
    rec("expense", "Celular", 49.9, "contas", Math.min(28, now.getDate() + 3));
    const tx = [];
    const add = (monthsAgo, day, type, desc, amount, category, account = "nubank") => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
      if (d > now) return;
      tx.push({ id: uid(), type, desc, amount, category, account, date: toISO(d) });
    };
    for (let m = 5; m >= 0; m--) {
      const v = 1 + Math.sin(m * 1.7) * 0.12;
      if (m % 2 === 0) add(m, 18, "income", "Projeto freelance", Math.round(1400 * v), "freelance");
      if (m % 3 === 1) add(m, 22, "income", "Dividendos", Math.round(320 * v), "investimentos", "poupanca");
      add(m, 8, "expense", "Supermercado", Math.round(780 * v), "alimentacao");
      add(m, 21, "expense", "Feira e padaria", Math.round(240 * v), "alimentacao", "carteira");
      add(m, 10, "expense", "Conta de luz", Math.round(190 * v), "contas");
      add(m, 3, "expense", "Combustível", Math.round(330 * v), "transporte");
      add(m, 16, "expense", "Uber", Math.round(86 * v), "transporte");
      add(m, 19, "expense", "Restaurante", Math.round(210 * v), "lazer");
      add(m, 9, "expense", "Café", 9.5, "alimentacao", "carteira");
      add(m, 17, "expense", "Café", 9.5, "alimentacao", "carteira");
      if (m % 2 === 1) add(m, 25, "expense", "Cinema e bar", Math.round(160 * v), "lazer");
      if (m % 2 === 0) add(m, 24, "expense", "Roupas", Math.round(380 * v), "compras");
      add(m, 2, "expense", "Curso online", 89, "educacao");
      const d = new Date(now.getFullYear(), now.getMonth() - m, 7);
      if (d <= now) tx.push({ id: uid(), type: "transfer", desc: "Guardar na poupança", amount: 500, category: "transfer", account: "nubank", toAccount: "poupanca", date: toISO(d) });
      const s = new Date(now.getFullYear(), now.getMonth() - m, 1);
      if (s <= now) tx.push({ id: uid(), type: "transfer", desc: "Saque", amount: 400, category: "transfer", account: "nubank", toAccount: "carteira", date: toISO(s) });
    }
    // Compra parcelada em 10x, começando 3 meses atrás
    const g = uid(), base = toISO(new Date(now.getFullYear(), now.getMonth() - 3, 12));
    for (let i = 0; i < 10; i++) tx.push({ id: uid(), type: "expense", desc: `Geladeira (${i + 1}/10)`, amount: 360, category: "compras", account: "nubank", date: addMonthsISO(base, i, 12), inst: { g, i: i + 1, n: 10 } });
    state.transactions = tx;
    state.goals = [
      { id: uid(), name: "Reserva de emergência", emoji: "🛟", target: 20000, saved: 13600, deadline: null },
      { id: uid(), name: "Viagem para o Japão", emoji: "✈️", target: 18000, saved: 5400, deadline: `${now.getFullYear() + 1}-12` },
      { id: uid(), name: "Notebook novo", emoji: "💻", target: 7000, saved: 7000, deadline: null },
    ];
    state.budgets = { alimentacao: 1300, lazer: 400, transporte: 450, compras: 700 };
    state.debts = [
      { id: uid(), person: "João", dir: "owed", amount: 150, paid: 50, desc: "Ingresso do show", due: addDays(todayISO(), 6), done: false, date: todayISO() },
      { id: uid(), person: "Mariana", dir: "owe", amount: 80, paid: 0, desc: "Pizza de sexta", due: null, done: false, date: todayISO() },
      { id: uid(), person: "Pedro", dir: "owed", amount: 60, paid: 60, desc: "Uber dividido", due: null, done: true, date: todayISO() },
    ];
    for (let i = 4; i >= 0; i--) state.activity.push(addDays(todayISO(), -i));
    state.bestStreak = 5;
    processRecurrences();
    save();
    achSilent = false;
    viewMonth = shiftMonth(new Date(), 0);
    renderAll();
  }

  // =====================================================================
  // Resumo do mês em stories
  // =====================================================================
  const story = { slides: [], i: 0, t: 0, raf: null, paused: false, last: 0, monthKey: null, downAt: 0 };
  const STORY_MS = 5500;
  function slide(a, b, inner) { return `<div class="story"><div class="story-bg" style="--a:${a};--b:${b}"></div>${inner}</div>`; }
  function buildStories(m) {
    const key = monthKey(m);
    const name = cap(monthName(m));
    const txs = state.transactions.filter((t) => inMonth(t, key) && t.type !== "transfer");
    if (!txs.length) return [];
    const t = monthTotals(key);
    const rows = expenseByCategory(key);
    const out = [];
    out.push(slide("#7c3aed", "#db2777", `
      <div class="s-emoji">📆</div><div class="s-kicker">Fluxo · Resumo do mês</div>
      <div class="s-title">Seu ${name} em resumo</div><div class="s-text">Bora ver como foi? Toque na direita para avançar e segure para pausar.</div>`));
    out.push(slide("#059669", "#0ea5e9", `
      <div class="s-emoji">💸</div><div class="s-kicker">Em ${name}, o dinheiro andou assim</div>
      <div class="s-rows">
        <div class="s-row"><span>Entrou</span><strong class="money" data-count="${t.income}">R$ 0</strong></div>
        <div class="s-row"><span>Saiu</span><strong class="money" data-count="${t.expense}">R$ 0</strong></div>
        <div class="s-row"><span>Resultado</span><strong class="money" data-count="${t.net}" data-sign="1">R$ 0</strong></div>
      </div>`));
    if (rows.length) {
      const top = rows[0];
      const pct = ((top.value / t.expense) * 100).toFixed(0);
      const lim = state.budgets[top.cat.id];
      const extra = lim ? (top.value <= lim ? " E ficou dentro do limite que você definiu 👏" : ` Passou ${fmt(top.value - lim)} do limite 😬`) : "";
      out.push(slide(top.cat.color, "#1e1b4b", `
        <div class="s-emoji">${top.cat.icon}</div><div class="s-kicker">Onde você mais gastou</div>
        <div class="s-title">${escapeHTML(top.cat.name)}</div><div class="s-big money" data-count="${top.value}">R$ 0</div>
        <div class="s-text">${pct}% de tudo que saiu.${extra}</div>`));
    }
    const perDay = {};
    for (const x of txs) if (x.type === "expense") perDay[x.date] = (perDay[x.date] || 0) + x.amount;
    const dayMax = Object.entries(perDay).sort((a, b) => b[1] - a[1])[0];
    if (dayMax) {
      const biggest = txs.filter((x) => x.date === dayMax[0] && x.type === "expense").sort((a, b) => b.amount - a.amount)[0];
      out.push(slide("#f43f5e", "#7c2d12", `
        <div class="s-emoji">🔥</div><div class="s-kicker">O dia mais caro</div>
        <div class="s-title">${cap(parseISO(dayMax[0]).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}</div>
        <div class="s-big money" data-count="${dayMax[1]}">R$ 0</div>
        <div class="s-text">O maior gasto foi <b>${escapeHTML(biggest.desc)}</b> (<span class="money">${fmt(biggest.amount)}</span>).</div>`));
    }
    const days = Number(key === monthKey(new Date()) ? new Date().getDate() : daysIn(m.getFullYear(), m.getMonth()));
    out.push(slide("#2563eb", "#9333ea", `
      <div class="s-emoji">🧾</div><div class="s-kicker">Você registrou</div>
      <div class="s-big" data-count="${txs.length}" data-int="1">0</div><div class="s-title">movimentações</div>
      <div class="s-text">Uma média de <b class="money">${fmt(t.expense / days)}</b> gastos por dia.</div>`));
    const subs = state.recurring.filter((r) => !r.paused && r.type === "expense");
    if (subs.length) {
      const mc = subs.reduce((s, r) => s + monthlyCost(r), 0);
      out.push(slide("#db2777", "#f59e0b", `
        <div class="s-emoji">🔁</div><div class="s-kicker">Contas fixas e assinaturas</div>
        <div class="s-big money" data-count="${mc}">R$ 0</div><div class="s-title">por mês</div>
        <div class="s-text">Isso dá <b class="money">${fmt(mc * 12)}</b> por ano. Vale revisar alguma que você quase não usa? 🤔</div>`));
    }
    if (t.income > 0) {
      const rate = (t.net / t.income) * 100;
      const [emo, txt, a, b] = rate >= 20 ? ["🏆", "Excelente! Você bateu a meta de guardar 20%.", "#10b981", "#065f46"]
        : rate > 0 ? ["👍", "Fechou no azul! Dá para guardar ainda mais no próximo.", "#0ea5e9", "#1e3a8a"]
          : ["😬", "Saiu mais do que entrou. Bora ajustar no próximo mês?", "#f43f5e", "#4c0519"];
      out.push(slide(a, b, `
        <div class="s-emoji">${emo}</div><div class="s-kicker">Do que você ganhou, guardou</div>
        <div class="s-big" data-count="${rate}" data-pct="1">0%</div><div class="s-text">${txt}</div>`));
    }
    const prevM = shiftMonth(m, -1);
    const prev = monthTotals(monthKey(prevM));
    if (prev.expense > 0 && t.expense > 0) {
      const d = ((t.expense - prev.expense) / prev.expense) * 100;
      out.push(slide(d <= 0 ? "#22c55e" : "#f97316", "#111827", `
        <div class="s-emoji">${d <= 0 ? "📉" : "📈"}</div><div class="s-kicker">Comparado a ${monthName(prevM)}</div>
        <div class="s-title">Você gastou ${Math.abs(d).toFixed(0)}% ${d <= 0 ? "menos" : "mais"}</div>
        <div class="s-text">${d <= 0 ? "Economia que vira meta realizada. Continue assim! 💪" : "Acontece! Dá uma olhada nos limites por categoria para segurar os gastos."}</div>`));
    }
    out.push(slide("#8b5cf6", "#2dd4bf", `
      <div class="s-emoji">🚀</div><div class="s-kicker">Isso foi ${name}</div>
      <div class="s-title">Bora pro próximo mês!</div>
      <div class="s-text">Sua sequência está em 🔥 <b>${streak()} dia${streak() === 1 ? "" : "s"}</b>. Continue registrando para desbloquear mais conquistas.</div>
      <div class="s-hint">Toque para fechar</div>`));
    return out;
  }
  function openStories(m) {
    const slides = buildStories(m);
    if (!slides.length) { toast(`Sem movimentações em ${monthName(m)} para resumir`); return; }
    if (openSheetEl) closeSheet();
    story.slides = slides;
    story.monthKey = monthKey(m);
    $("#storyBars").innerHTML = slides.map(() => "<span><i></i></span>").join("");
    $("#stories").hidden = false;
    document.body.style.overflow = "hidden";
    showStory(0);
    story.last = performance.now();
    cancelAnimationFrame(story.raf);
    story.raf = requestAnimationFrame(storyTick);
    haptic(15);
  }
  function showStory(i) {
    story.i = i; story.t = 0;
    $("#storyStage").innerHTML = story.slides[i];
    $$("#storyBars i").forEach((b, j) => (b.style.width = j < i ? "100%" : "0%"));
    $$("[data-count]", $("#storyStage")).forEach((el) => {
      const v = Number(el.dataset.count);
      const f = el.dataset.int ? (x) => Math.round(x).toLocaleString("pt-BR") : el.dataset.pct ? (x) => `${x.toFixed(0)}%` : el.dataset.sign ? (x) => (x > 0 ? "+" : "") + fmt(x) : fmt;
      setTimeout(() => animateValue(el, v, f, 1200), 250);
    });
  }
  function storyTick(now) {
    const dt = now - story.last; story.last = now;
    if (!story.paused) {
      story.t += dt / STORY_MS;
      const bar = $$("#storyBars i")[story.i];
      if (bar) bar.style.width = `${Math.min(100, story.t * 100)}%`;
      if (story.t >= 1) { if (story.i < story.slides.length - 1) showStory(story.i + 1); else { closeStories(); return; } }
    }
    story.raf = requestAnimationFrame(storyTick);
  }
  function closeStories() {
    cancelAnimationFrame(story.raf);
    $("#stories").hidden = true;
    document.body.style.overflow = "";
    if (story.monthKey) { state.settings.storySeen = story.monthKey; save(); renderHome(); }
  }
  $("#storyStage").addEventListener("pointerdown", () => { story.paused = true; story.downAt = performance.now(); });
  $("#storyStage").addEventListener("pointerup", (e) => {
    story.paused = false;
    if (performance.now() - story.downAt > 300) return;
    const left = e.clientX < innerWidth * 0.3;
    if (left) showStory(Math.max(0, story.i - 1));
    else if (story.i < story.slides.length - 1) showStory(story.i + 1);
    else closeStories();
    haptic(6);
  });
  $("#storyStage").addEventListener("pointercancel", () => (story.paused = false));
  $("#storyClose").addEventListener("click", closeStories);

  // =====================================================================
  // Bloqueio com PIN
  // =====================================================================
  let lockMode = null, pinBuf = "", firstPin = "", lockResolve = null, hiddenAt = 0;
  async function hashPin(pin, salt) {
    const data = new TextEncoder().encode(salt + ":" + pin);
    if (window.crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381; for (const b of data) h = ((h << 5) + h + b) | 0; return "x" + h;
  }
  function setLockText() {
    const t = { unlock: ["Digite seu PIN", "Para abrir o Fluxo", "Esqueci"], setup: ["Crie um PIN", "4 números que só você sabe", "Cancelar"],
      confirm: ["Confirme o PIN", "Digite de novo para confirmar", "Cancelar"], verify: ["PIN atual", "Para desativar o bloqueio", "Cancelar"] }[lockMode];
    $("#lockTitle").textContent = t[0]; $("#lockSub").textContent = t[1]; $("#lockCancel").textContent = t[2];
  }
  function renderDots(err) {
    $$("#pinDots i").forEach((d, i) => d.classList.toggle("on", i < pinBuf.length));
    $("#pinDots").classList.toggle("err", !!err);
  }
  function openLock(mode) {
    lockMode = mode; pinBuf = ""; firstPin = "";
    setLockText(); renderDots();
    const el = $("#lock");
    el.classList.remove("leaving");
    el.hidden = false;
    return new Promise((res) => (lockResolve = res));
  }
  function closeLock(ok) {
    const el = $("#lock");
    el.classList.add("leaving");
    setTimeout(() => { el.hidden = true; el.classList.remove("leaving"); }, 350);
    lockMode = null;
    if (lockResolve) { lockResolve(ok); lockResolve = null; }
  }
  async function pinKey(k) {
    if (!lockMode) return;
    if (k === "cancel") {
      if (lockMode !== "unlock") return closeLock(false);
      if (await confirmDialog({ title: "Esqueceu o PIN?", text: "Por segurança, a única saída é apagar todos os dados deste aparelho e começar de novo. Se tiver um backup, dá para restaurar depois.", ok: "Apagar e entrar", ico: "🔑", danger: true })) {
        achSilent = true;
        state = normalize({ version: APP_VERSION, settings: { name: state.settings.name, seenVersion: APP_VERSION } });
        save(); achSilent = false; renderAll();
        closeLock(true);
      }
      return;
    }
    if (k === "back") { pinBuf = pinBuf.slice(0, -1); renderDots(); return; }
    if (pinBuf.length >= 4) return;
    pinBuf += k; renderDots(); haptic(6);
    if (pinBuf.length < 4) return;
    const entered = pinBuf;
    if (lockMode === "setup") {
      firstPin = entered;
      setTimeout(() => { lockMode = "confirm"; pinBuf = ""; setLockText(); renderDots(); }, 180);
    } else if (lockMode === "confirm") {
      if (entered === firstPin) {
        state.settings.pinSalt = uid();
        state.settings.pinHash = await hashPin(entered, state.settings.pinSalt);
        save(); closeLock(true);
      } else {
        renderDots(true); shake($("#pinDots")); haptic(40);
        setTimeout(() => { lockMode = "setup"; pinBuf = ""; setLockText(); renderDots(); toast("Os PINs não batem. Tente de novo"); }, 450);
      }
    } else {
      const ok = (await hashPin(entered, state.settings.pinSalt)) === state.settings.pinHash;
      if (ok) closeLock(true);
      else {
        renderDots(true); shake($("#pinDots")); haptic(40);
        setTimeout(() => { pinBuf = ""; renderDots(); }, 450);
      }
    }
  }
  $("#lockPad").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pinKey(b.dataset.k); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (processRecurrences()) renderAll();
    if (state.settings.pinHash && !lockMode && Date.now() - hiddenAt > 30000) openLock("unlock");
  });

  // =====================================================================
  // Botão voltar (Android) e Esc
  // =====================================================================
  function handleBack() {
    if (lockMode) { if (lockMode !== "unlock") { closeLock(false); return true; } return false; }
    if (!$("#stories").hidden) { closeStories(); return true; }
    if ($("#picker").classList.contains("open")) { closePicker(null); return true; }
    if ($("#dialog").classList.contains("open")) { closeDialog(false); return true; }
    if (openSheetEl) { closeSheet(); return true; }
    if (currentTab !== "home") { go("home"); return true; }
    return false;
  }
  window.fluxoBack = handleBack;

  // =====================================================================
  // Boas-vindas
  // =====================================================================
  function finishOnboarding(demo) {
    state.settings.name = $("#onboardName").value.trim();
    if (demo) loadDemo(); else save();
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

  // =====================================================================
  // Efeitos
  // =====================================================================
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
    setTimeout(dismiss, actionLabel ? 5000 : 2800);
  }
  function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let pieces = [], running = false;
  function burst(count = 160) {
    if (reduceMotion) return;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const colors = ["#8b5cf6", "#2dd4bf", "#fb7185", "#fbbf24", "#a78bfa", "#34d399"];
    for (let i = 0; i < count; i++) {
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
  function celebrate(name) {
    toast(`Meta "${name}" concluída! 🎉`);
    haptic(60);
    burst();
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

  // =====================================================================
  // Início
  // =====================================================================
  processRecurrences();
  save();
  achSilent = false;
  renderAll();
  moveTabDot();
  syncReminder();
  if (state.settings.pinHash) openLock("unlock");
  if (!firstRun && (state.settings.seenVersion || 1) < APP_VERSION) setTimeout(() => openSheet("#newsSheet"), 600);
})();
