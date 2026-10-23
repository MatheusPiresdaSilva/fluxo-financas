(() => {
  "use strict";

  // ---------- Configuração ----------
  const STORAGE_KEY = "fluxo-financas-v1";

  const CATEGORIES = {
    expense: [
      { id: "alimentacao", name: "Alimentação", icon: "🍔", color: "#ff8a5c" },
      { id: "moradia", name: "Moradia", icon: "🏠", color: "#7c5cff" },
      { id: "transporte", name: "Transporte", icon: "🚗", color: "#5b8cff" },
      { id: "contas", name: "Contas", icon: "💡", color: "#ffb547" },
      { id: "lazer", name: "Lazer", icon: "🎮", color: "#ff5c8a" },
      { id: "saude", name: "Saúde", icon: "💊", color: "#22e3a4" },
      { id: "educacao", name: "Educação", icon: "📚", color: "#00c2ff" },
      { id: "compras", name: "Compras", icon: "🛍️", color: "#e05cff" },
      { id: "assinaturas", name: "Assinaturas", icon: "📺", color: "#a78bfa" },
      { id: "outros", name: "Outros", icon: "📦", color: "#8a8aa8" },
    ],
    income: [
      { id: "salario", name: "Salário", icon: "💼", color: "#22e3a4" },
      { id: "freelance", name: "Freelance", icon: "💻", color: "#00c2ff" },
      { id: "investimentos", name: "Investimentos", icon: "📈", color: "#7c5cff" },
      { id: "presente", name: "Presente", icon: "🎁", color: "#ff5c8a" },
      { id: "outras-receitas", name: "Outras receitas", icon: "💰", color: "#ffb547" },
    ],
  };
  const ALL_CATS = [...CATEGORIES.expense, ...CATEGORIES.income];
  const catById = (id) => ALL_CATS.find((c) => c.id === id) || CATEGORIES.expense.at(-1);

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
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Aceita "1.234,56", "1234.56", "1234,5"
  function parseMoney(str) {
    if (typeof str === "number") return str;
    let s = String(str).trim().replace(/[^\d,.-]/g, "");
    if (!s) return NaN;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    return Math.round(parseFloat(s) * 100) / 100;
  }
  const moneyToInput = (n) => (n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

  // ---------- Estado ----------
  let state = load();
  let viewMonth = new Date();
  viewMonth.setDate(1);
  let typeFilter = "all";
  let searchTerm = "";

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return { transactions: data.transactions || [], goals: data.goals || [], budgets: data.budgets || {} };
      }
    } catch (e) { /* armazenamento indisponível */ }
    return demoData();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }

  function demoData() {
    const tx = [];
    const now = new Date();
    const add = (monthsAgo, day, type, desc, amount, category) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
      if (d > now) return;
      tx.push({ id: uid(), type, desc, amount, category, date: toISO(d) });
    };
    for (let m = 5; m >= 0; m--) {
      const v = 1 + (Math.sin(m * 1.7) * 0.12);
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
    return {
      transactions: tx,
      goals: [
        { id: uid(), name: "Reserva de emergência", emoji: "🛟", target: 20000, saved: 13600 },
        { id: uid(), name: "Viagem para o Japão", emoji: "✈️", target: 18000, saved: 5400 },
        { id: uid(), name: "Notebook novo", emoji: "💻", target: 7000, saved: 7000 },
      ],
      budgets: { alimentacao: 1200, lazer: 400, transporte: 450, compras: 300 },
    };
  }

  // ---------- Cálculos ----------
  const inMonth = (t, key) => t.date.slice(0, 7) === key;
  function monthTotals(key) {
    let income = 0, expense = 0;
    for (const t of state.transactions) {
      if (!inMonth(t, key)) continue;
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
  const shiftMonth = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

  // ---------- Contador animado ----------
  const counters = new WeakMap();
  function animateValue(el, to, formatter = fmt, duration = 1100) {
    const from = counters.get(el) ?? 0;
    counters.set(el, to);
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = formatter(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------- Renderização ----------
  function render() {
    renderHeader();
    renderKPIs();
    renderCharts();
    renderTransactions();
    renderGoals();
    renderBudgets();
  }

  function renderHeader() {
    const raw = viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    const el = $("#monthLabel");
    if (el.textContent !== label) {
      el.classList.add("swap");
      setTimeout(() => { el.textContent = label; el.classList.remove("swap"); }, 150);
    }
    const h = new Date().getHours();
    $("#greeting").textContent = h < 12 ? "Bom dia ☀️" : h < 18 ? "Boa tarde 🌤️" : "Boa noite 🌙";
  }

  function trend(cur, prev, goodWhenUp) {
    if (!prev) return `<span class="muted">sem dados do mês anterior</span>`;
    const diff = ((cur - prev) / prev) * 100;
    const up = diff >= 0;
    const good = goodWhenUp ? up : !up;
    return `<span class="${good ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)}%</span> vs. mês anterior`;
  }

  function renderKPIs() {
    const key = monthKey(viewMonth);
    const prevKey = monthKey(shiftMonth(viewMonth, -1));
    const cur = monthTotals(key);
    const prev = monthTotals(prevKey);
    const balance = balanceUntil(key);

    animateValue($("#kpiBalance"), balance);
    animateValue($("#kpiIncome"), cur.income);
    animateValue($("#kpiExpense"), cur.expense);
    const rate = cur.income > 0 ? Math.max(-100, (cur.net / cur.income) * 100) : 0;
    animateValue($("#kpiSavings"), rate, (v) => `${v.toFixed(0)}%`);
    $("#savingsBar").style.width = `${Math.max(0, Math.min(100, rate))}%`;

    $("#kpiIncomeFoot").innerHTML = trend(cur.income, prev.income, true);
    $("#kpiExpenseFoot").innerHTML = trend(cur.expense, prev.expense, false);
    $("#kpiBalanceFoot").textContent = cur.net >= 0 ? `+${fmt(cur.net)} neste mês` : `${fmt(cur.net)} neste mês`;
  }

  // ---------- Gráficos ----------
  let flowChart, catChart;
  function chartDefaults() {
    if (!window.Chart) return false;
    Chart.defaults.color = "#9a9ab8";
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(20,20,45,0.95)";
    Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.15)";
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 12;
    Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };
    return true;
  }
  const chartReady = chartDefaults();

  function gradient(ctx, area, c1, c2) {
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
  }

  function renderCharts() {
    renderCategoryBreakdown();
    if (!chartReady) return;

    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(viewMonth, i - 5));
    const labels = months.map((d) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""));
    const totals = months.map((d) => monthTotals(monthKey(d)));

    const data = {
      labels,
      datasets: [
        {
          type: "bar", label: "Receitas", data: totals.map((t) => t.income), borderRadius: 8, borderSkipped: false, barPercentage: 0.7, categoryPercentage: 0.6,
          backgroundColor: (c) => (c.chart.chartArea ? gradient(c.chart.ctx, c.chart.chartArea, "#22e3a4", "rgba(34,227,164,0.25)") : "#22e3a4"),
        },
        {
          type: "bar", label: "Despesas", data: totals.map((t) => t.expense), borderRadius: 8, borderSkipped: false, barPercentage: 0.7, categoryPercentage: 0.6,
          backgroundColor: (c) => (c.chart.chartArea ? gradient(c.chart.ctx, c.chart.chartArea, "#ff5c8a", "rgba(255,92,138,0.25)") : "#ff5c8a"),
        },
        {
          type: "line", label: "Resultado", data: totals.map((t) => t.net), borderColor: "#a78bfa", borderWidth: 3, tension: 0.4,
          pointBackgroundColor: "#a78bfa", pointBorderColor: "#0d0d26", pointBorderWidth: 3, pointRadius: 5, pointHoverRadius: 7, fill: true,
          backgroundColor: (c) => (c.chart.chartArea ? gradient(c.chart.ctx, c.chart.chartArea, "rgba(167,139,250,0.25)", "rgba(167,139,250,0)") : "transparent"),
        },
      ],
    };

    if (flowChart) {
      flowChart.data.labels = data.labels;
      data.datasets.forEach((ds, i) => (flowChart.data.datasets[i].data = ds.data));
      flowChart.update();
    } else {
      flowChart = new Chart($("#flowChart"), {
        data,
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 1200, easing: "easeOutQuart" },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { weight: "500" } } },
            y: { grid: { color: "rgba(255,255,255,0.05)" }, border: { display: false }, ticks: { callback: (v) => fmtShort(v), maxTicksLimit: 6 } },
          },
          plugins: { tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
        },
      });
    }
  }

  function expenseByCategory(key) {
    const map = {};
    for (const t of state.transactions) {
      if (t.type !== "expense" || !inMonth(t, key)) continue;
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).map(([id, v]) => ({ cat: catById(id), value: v })).sort((a, b) => b.value - a.value);
  }

  function renderCategoryBreakdown() {
    const rows = expenseByCategory(monthKey(viewMonth));
    const total = rows.reduce((s, r) => s + r.value, 0);
    animateValue($("#donutTotal"), total, fmtShort);

    $("#catList").innerHTML = rows.length
      ? rows.map((r, i) => `
          <li style="animation-delay:${i * 50}ms">
            <i class="sw" style="background:${r.cat.color}"></i>
            <span class="name">${r.cat.icon} ${r.cat.name}</span>
            <span class="pct">${((r.value / total) * 100).toFixed(0)}%</span>
          </li>`).join("")
      : `<li class="cat-empty">Nenhuma despesa neste mês 🎉</li>`;

    if (!chartReady) return;
    const values = rows.length ? rows.map((r) => r.value) : [1];
    const colors = rows.length ? rows.map((r) => r.cat.color) : ["rgba(255,255,255,0.08)"];
    const labels = rows.length ? rows.map((r) => r.cat.name) : ["Sem despesas"];

    if (catChart) {
      catChart.data.labels = labels;
      catChart.data.datasets[0].data = values;
      catChart.data.datasets[0].backgroundColor = colors;
      catChart.options.plugins.tooltip.enabled = rows.length > 0;
      catChart.update();
    } else {
      catChart = new Chart($("#catChart"), {
        type: "doughnut",
        data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 6, spacing: 3, hoverOffset: 10 }] },
        options: {
          cutout: "72%", responsive: true, maintainAspectRatio: false,
          animation: { animateRotate: true, duration: 1300, easing: "easeOutQuart" },
          layout: { padding: 8 },
          plugins: { tooltip: { enabled: rows.length > 0, callbacks: { label: (c) => ` ${fmt(c.parsed)}` } } },
        },
      });
    }
  }

  // ---------- Transações ----------
  function renderTransactions() {
    const key = monthKey(viewMonth);
    const term = searchTerm.toLowerCase();
    const list = state.transactions
      .filter((t) => inMonth(t, key))
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => !term || t.desc.toLowerCase().includes(term) || catById(t.category).name.toLowerCase().includes(term))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    $("#txCount").textContent = `${list.length} ${list.length === 1 ? "lançamento" : "lançamentos"}`;
    $("#txEmpty").hidden = list.length > 0;

    const today = toISO(new Date());
    const yesterday = toISO(new Date(Date.now() - 864e5));
    let html = "", lastDate = "", i = 0;
    for (const t of list) {
      if (t.date !== lastDate) {
        lastDate = t.date;
        const [y, m, d] = t.date.split("-").map(Number);
        const label = t.date === today ? "Hoje" : t.date === yesterday ? "Ontem"
          : new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
        html += `<li class="tx-group">${label}</li>`;
      }
      const c = catById(t.category);
      html += `
        <li class="tx" data-id="${t.id}" style="animation-delay:${Math.min(i++, 12) * 35}ms">
          <div class="tx-icon" style="background:${c.color}22">${c.icon}</div>
          <div class="tx-info"><strong>${escapeHTML(t.desc)}</strong><span>${c.name}</span></div>
          <div class="tx-amount ${t.type}">${t.type === "income" ? "+" : "−"} ${fmt(t.amount)}</div>
        </li>`;
    }
    $("#txList").innerHTML = html;
  }

  // ---------- Metas ----------
  function renderGoals() {
    const el = $("#goalList");
    if (!state.goals.length) {
      el.innerHTML = `<li class="list-empty">Crie uma meta e acompanhe seu progresso ✨</li>`;
      return;
    }
    el.innerHTML = state.goals.map((g, i) => {
      const pct = Math.min(100, (g.saved / g.target) * 100 || 0);
      const done = pct >= 100;
      return `
        <li class="goal ${done ? "done" : ""}" data-id="${g.id}" style="animation-delay:${i * 60}ms">
          <div class="goal-top">
            <div class="goal-emoji">${escapeHTML(g.emoji || "🎯")}</div>
            <div class="goal-name"><strong>${escapeHTML(g.name)}</strong><span>${done ? "Meta concluída! 🎉" : `faltam ${fmt(g.target - g.saved)}`}</span></div>
            <div class="goal-actions">
              <button data-goal="deposit" aria-label="Guardar dinheiro"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
              <button data-goal="edit" aria-label="Editar meta"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg></button>
            </div>
          </div>
          <div class="progress"><span data-w="${pct}"></span></div>
          <div class="goal-meta"><span>${fmt(g.saved)} de ${fmt(g.target)}</span><span>${pct.toFixed(0)}%</span></div>
        </li>`;
    }).join("");
    growBars(el);
  }

  // ---------- Orçamentos ----------
  function renderBudgets() {
    const el = $("#budgetList");
    const entries = Object.entries(state.budgets);
    if (!entries.length) {
      el.innerHTML = `<li class="list-empty">Defina limites mensais por categoria 💡</li>`;
      return;
    }
    const spent = Object.fromEntries(expenseByCategory(monthKey(viewMonth)).map((r) => [r.cat.id, r.value]));
    el.innerHTML = entries.map(([id, limit], i) => {
      const c = catById(id);
      const s = spent[id] || 0;
      const pct = (s / limit) * 100;
      const cls = pct > 100 ? "over" : pct >= 80 ? "warn" : "";
      return `
        <li class="budget ${cls}" data-cat="${id}" style="animation-delay:${i * 60}ms">
          <div class="budget-top"><strong>${c.icon} ${c.name}</strong><span>${fmt(s)} / ${fmt(limit)}</span></div>
          <div class="progress"><span data-w="${Math.min(100, pct)}"></span></div>
        </li>`;
    }).join("");
    growBars(el);
  }

  function growBars(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$(".progress span", root).forEach((s) => (s.style.width = s.dataset.w + "%"));
    }));
  }

  // ---------- Modais ----------
  function openModal(id) {
    const m = $(id);
    m.classList.add("open");
    setTimeout(() => $("input:not([type=hidden])", m)?.focus({ preventScroll: true }), 250);
  }
  function closeModal(m) { m.classList.remove("open"); }
  $$(".modal").forEach((m) => {
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModal(m); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { $$(".modal.open").forEach(closeModal); $("#menu").classList.remove("open"); }
  });

  // Transação
  let editingTx = null;
  let txType = "expense";
  let txCat = null;

  function setTxType(type) {
    txType = type;
    $("#typeToggle").classList.toggle("income", type === "income");
    $$("#typeToggle button").forEach((b) => b.classList.toggle("active", b.dataset.type === type));
    if (!CATEGORIES[type].some((c) => c.id === txCat)) txCat = CATEGORIES[type][0].id;
    $("#txCats").innerHTML = CATEGORIES[type].map((c) =>
      `<button type="button" class="chip ${c.id === txCat ? "active" : ""}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join("");
  }
  $("#typeToggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setTxType(b.dataset.type); });
  $("#txCats").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    txCat = b.dataset.cat;
    $$("#txCats .chip").forEach((c) => c.classList.toggle("active", c === b));
  });

  function openTx(t = null) {
    editingTx = t;
    $("#txTitle").textContent = t ? "Editar transação" : "Nova transação";
    $("#txDelete").hidden = !t;
    txCat = t ? t.category : null;
    setTxType(t ? t.type : "expense");
    $("#txAmount").value = t ? moneyToInput(t.amount) : "";
    $("#txDesc").value = t ? t.desc : "";
    // Data padrão: hoje se estiver vendo o mês atual, senão dia 1 do mês visto
    const now = new Date();
    $("#txDate").value = t ? t.date : monthKey(now) === monthKey(viewMonth) ? toISO(now) : toISO(viewMonth);
    openModal("#txModal");
  }

  $("#txForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseMoney($("#txAmount").value);
    const desc = $("#txDesc").value.trim();
    const date = $("#txDate").value;
    if (!(amount > 0) || !desc || !date) return shake($("#txForm"));
    const data = { type: txType, desc, amount, category: txCat, date };
    if (editingTx) Object.assign(editingTx, data);
    else state.transactions.push({ id: uid(), ...data });
    save();
    closeModal($("#txModal"));
    // Leva a visão para o mês da transação
    const [y, m] = date.split("-").map(Number);
    viewMonth = new Date(y, m - 1, 1);
    render();
    toast(editingTx ? "Transação atualizada ✅" : txType === "income" ? "Receita adicionada 💸" : "Despesa registrada 🧾");
  });

  $("#txDelete").addEventListener("click", () => {
    if (!editingTx) return;
    const removed = editingTx;
    const idx = state.transactions.indexOf(removed);
    state.transactions.splice(idx, 1);
    save();
    closeModal($("#txModal"));
    const row = $(`.tx[data-id="${removed.id}"]`);
    const finish = () => { render(); };
    if (row) { row.classList.add("removing"); setTimeout(finish, 320); } else finish();
    toast("Transação excluída", "Desfazer", () => {
      state.transactions.splice(idx, 0, removed);
      save(); render();
    });
  });

  $("#txList").addEventListener("click", (e) => {
    const row = e.target.closest(".tx"); if (!row) return;
    openTx(state.transactions.find((t) => t.id === row.dataset.id));
  });

  // Metas
  let editingGoal = null;
  function openGoal(g = null) {
    editingGoal = g;
    $("#goalTitle").textContent = g ? "Editar meta" : "Nova meta";
    $("#goalDelete").hidden = !g;
    $("#goalName").value = g ? g.name : "";
    $("#goalEmoji").value = g ? g.emoji : "";
    $("#goalTarget").value = g ? moneyToInput(g.target) : "";
    $("#goalSaved").value = g ? moneyToInput(g.saved) : "";
    openModal("#goalModal");
  }
  $("#goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#goalName").value.trim();
    const target = parseMoney($("#goalTarget").value);
    const saved = parseMoney($("#goalSaved").value) || 0;
    if (!name || !(target > 0) || saved < 0) return shake($("#goalForm"));
    const data = { name, emoji: $("#goalEmoji").value.trim() || "🎯", target, saved };
    const wasDone = editingGoal && editingGoal.saved >= editingGoal.target;
    if (editingGoal) Object.assign(editingGoal, data);
    else state.goals.push({ id: uid(), ...data });
    save(); closeModal($("#goalModal")); renderGoals();
    if (saved >= target && !wasDone) celebrate(name);
    else toast(editingGoal ? "Meta atualizada ✅" : "Meta criada 🎯");
  });
  $("#goalDelete").addEventListener("click", () => {
    const removed = editingGoal;
    const idx = state.goals.indexOf(removed);
    state.goals.splice(idx, 1);
    save(); closeModal($("#goalModal")); renderGoals();
    toast("Meta excluída", "Desfazer", () => { state.goals.splice(idx, 0, removed); save(); renderGoals(); });
  });

  let depositGoal = null;
  $("#goalList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-goal]"); if (!btn) return;
    const g = state.goals.find((x) => x.id === btn.closest(".goal").dataset.id);
    if (btn.dataset.goal === "edit") return openGoal(g);
    depositGoal = g;
    $("#depositTitle").textContent = `${g.emoji || "🎯"} ${g.name}`;
    $("#depositInfo").textContent = `Guardado: ${fmt(g.saved)} de ${fmt(g.target)}`;
    $("#depositAmount").value = "";
    openModal("#depositModal");
  });
  function moveGoal(sign) {
    const v = parseMoney($("#depositAmount").value);
    if (!(v > 0)) return shake($("#depositForm"));
    const wasDone = depositGoal.saved >= depositGoal.target;
    depositGoal.saved = Math.max(0, Math.round((depositGoal.saved + sign * v) * 100) / 100);
    save(); closeModal($("#depositModal")); renderGoals();
    if (!wasDone && depositGoal.saved >= depositGoal.target) celebrate(depositGoal.name);
    else toast(sign > 0 ? `+${fmt(v)} guardado 🐷` : `${fmt(v)} retirado`);
  }
  $("#depositForm").addEventListener("submit", (e) => { e.preventDefault(); moveGoal(1); });
  $("#withdrawBtn").addEventListener("click", () => moveGoal(-1));

  // Orçamentos
  let budgetCat = CATEGORIES.expense[0].id;
  let editingBudget = false;
  function renderBudgetChips() {
    $("#budgetCats").innerHTML = CATEGORIES.expense.map((c) =>
      `<button type="button" class="chip ${c.id === budgetCat ? "active" : ""}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join("");
  }
  function openBudget(cat = null) {
    editingBudget = !!cat;
    budgetCat = cat || CATEGORIES.expense.find((c) => !(c.id in state.budgets))?.id || CATEGORIES.expense[0].id;
    renderBudgetChips();
    $("#budgetLimit").value = moneyToInput(state.budgets[budgetCat]);
    $("#budgetDelete").hidden = !editingBudget;
    openModal("#budgetModal");
  }
  $("#budgetCats").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    budgetCat = b.dataset.cat;
    renderBudgetChips();
    $("#budgetLimit").value = moneyToInput(state.budgets[budgetCat]);
    $("#budgetDelete").hidden = !(budgetCat in state.budgets);
  });
  $("#budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = parseMoney($("#budgetLimit").value);
    if (!(v > 0)) return shake($("#budgetForm"));
    state.budgets[budgetCat] = v;
    save(); closeModal($("#budgetModal")); renderBudgets();
    toast(`Orçamento de ${catById(budgetCat).name} salvo 💡`);
  });
  $("#budgetDelete").addEventListener("click", () => {
    delete state.budgets[budgetCat];
    save(); closeModal($("#budgetModal")); renderBudgets();
    toast("Orçamento removido");
  });
  $("#budgetList").addEventListener("click", (e) => {
    const li = e.target.closest(".budget"); if (li) openBudget(li.dataset.cat);
  });

  // Botões de abrir
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]"); if (!b) return;
    ({ tx: () => openTx(), goal: () => openGoal(), budget: () => openBudget() })[b.dataset.open]();
  });
  $("#addBtn").addEventListener("click", () => openTx());

  // ---------- Filtros e navegação ----------
  $("#prevMonth").addEventListener("click", () => { viewMonth = shiftMonth(viewMonth, -1); render(); });
  $("#nextMonth").addEventListener("click", () => { viewMonth = shiftMonth(viewMonth, 1); render(); });
  $("#typeFilter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    typeFilter = b.dataset.filter;
    $$("#typeFilter button").forEach((x) => x.classList.toggle("active", x === b));
    renderTransactions();
  });
  $("#search").addEventListener("input", (e) => { searchTerm = e.target.value; renderTransactions(); });

  // ---------- Menu ----------
  $("#menuBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#menu").classList.toggle("open"); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#menu")) $("#menu").classList.remove("open"); });
  $("#menu").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-action]"); if (!b) return;
    $("#menu").classList.remove("open");
    const action = b.dataset.action;
    if (action === "export") {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `fluxo-backup-${toISO(new Date())}.json` });
      a.click(); URL.revokeObjectURL(a.href);
      toast("Backup exportado ⬇️");
    } else if (action === "demo") {
      if (!confirm("Substituir seus dados atuais pelos dados de exemplo?")) return;
      state = demoData(); save(); viewMonth = new Date(); viewMonth.setDate(1); render();
      toast("Dados de exemplo carregados ✨");
    } else if (action === "reset") {
      if (!confirm("Tem certeza? Isso apaga todas as transações, metas e orçamentos deste navegador.")) return;
      state = { transactions: [], goals: [], budgets: {} }; save(); render();
      toast("Tudo limpo. Recomeço! 🌱");
    }
  });
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.transactions)) throw new Error();
      state = { transactions: data.transactions, goals: data.goals || [], budgets: data.budgets || {} };
      save(); render(); toast("Backup importado ⬆️");
    } catch { toast("Arquivo inválido ⚠️"); }
    e.target.value = "";
    $("#menu").classList.remove("open");
  });

  // ---------- Efeitos ----------
  function toast(msg, actionLabel, onAction) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span>${escapeHTML(msg)}</span>`;
    if (actionLabel) {
      const b = document.createElement("button");
      b.textContent = actionLabel;
      b.onclick = () => { onAction(); dismiss(); };
      el.appendChild(b);
    }
    $("#toasts").appendChild(el);
    const dismiss = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
    setTimeout(dismiss, actionLabel ? 5000 : 2600);
  }

  function shake(el) {
    el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake");
  }

  // Ondinha nos botões
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".ripple"); if (!b) return;
    const r = b.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const w = Object.assign(document.createElement("span"), { className: "ripple-wave" });
    Object.assign(w.style, { width: size + "px", height: size + "px", left: e.clientX - r.left - size / 2 + "px", top: e.clientY - r.top - size / 2 + "px" });
    b.appendChild(w);
    setTimeout(() => w.remove(), 600);
  });

  // Holofote seguindo o mouse + inclinação 3D nos KPIs
  const finePointer = matchMedia("(pointer: fine)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      for (const c of $$(".card")) {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    });
    if (!reduceMotion) {
      $$(".tilt").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transition = "transform .1s";
          card.style.transform = `perspective(800px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener("pointerleave", () => {
          card.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
          card.style.transform = "";
        });
      });
    }
  }

  // Entrada escalonada
  $$(".reveal").forEach((el, i) => setTimeout(() => el.classList.add("in"), 80 + i * 70));

  // Confete
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  let pieces = [];
  let confettiRunning = false;
  function celebrate(name) {
    toast(`Meta "${name}" concluída! 🎉`);
    if (reduceMotion) return;
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
    const colors = ["#7c5cff", "#00e0b8", "#ff5c8a", "#ffb547", "#a78bfa", "#22e3a4"];
    for (let i = 0; i < 180; i++) {
      pieces.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight / 2,
        vx: (Math.random() - 0.5) * 18, vy: -Math.random() * 18 - 6,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        color: colors[(Math.random() * colors.length) | 0], life: 0,
      });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(tick); }
  }
  function tick() {
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter((p) => p.y < innerHeight + 40 && p.life < 400);
    for (const p of pieces) {
      p.vy += 0.45; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.1)));
      ctx.restore();
    }
    if (pieces.length) requestAnimationFrame(tick);
    else { confettiRunning = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // ---------- Início ----------
  save();
  render();
})();
