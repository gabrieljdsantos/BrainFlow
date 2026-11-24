/* BrainFlow - armazenamento e cálculos compartilhados */ (() => {
  const KEY = 'brainFlowData';
  const OLD_KEY = 'driveControlMetas';
  const money = new Intl.NumberFormat('pt-BR',
  {
    style: 'currency',
    currency: 'BRL'
  });
  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const parseDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const[y,
    m,
    d] = value.split('-').map(Number);
    const date = new Date(y,
    m - 1,
    d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date: null;
  };
  const fmtDate = value => parseDate(value)?.toLocaleDateString('pt-BR') || '—';
  const cents = value => Number.isSafeInteger(value) && value >= 0;
  const moneyText = value => money.format((Number(value) || 0) / 100);
  const parseMoney = value => {
    const raw = String(value ?? '').trim().replace(/R\$/g,
    '').replace(/\s/g,
    '');
    if (!raw) return 0;
    const normalized = raw.includes(',') ? raw.replace(/\./g,
    '').replace(',',
    '.'): raw;
    const number = Number(normalized);
    return Number.isFinite(number) && number >= 0 ? Math.round(number * 100): NaN;
  };
  const uid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const emptyData = () => ({
    version: 2,
    objectives: [],
    activeObjectiveId: null
  });
  function migrateLegacy() {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw || localStorage.getItem(KEY)) return;
    try {
      const old = JSON.parse(raw);
      if (!old || !old.goalCents || !old.startDate || !old.endDate) return;
      const records = [];
      Object.entries(old.history || {
      }).forEach(([date,
      item]) => {
        if (item?.realizedCents > 0) records.push({
          id: uid(),
          amountCents: item.realizedCents,
          source: 'Trabalho',
          dateISO: date,
          createdAt: `${date}T12:00:00`,
          note: 'Registro diário migrado do DriveControl'
        });
      });
      (old.movements || []).forEach(item => {
        if (item?.amountCents > 0) records.push({
          id: item.id || uid(),
          amountCents: item.amountCents,
          source: 'Reserva financeira',
          dateISO: item.dateISO || todayISO(),
          createdAt: item.createdAt || new Date().toISOString(),
          note: item.note || 'Movimentação migrada do DriveControl'
        });
      });
      const objective = {
        id: uid(),
        name: old.name || 'Meu objetivo',
        category: old.category || 'Outros',
        customCategory: old.customCategory || '',
        goalCents: old.goalCents,
        availableCents: old.availableCents || 0,
        startDate: old.startDate,
        endDate: old.endDate,
        workdayMode: old.workdayMode || 'all',
        offDays: Array.isArray(old.offDays) ? old.offDays: [],
        records,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const data = {
        version: 2,
        objectives: [objective],
        activeObjectiveId: objective.id
      };
      localStorage.setItem(KEY,
      JSON.stringify(data));
    } catch (error) {
      console.warn('Não foi possível migrar os dados antigos.',
      error);
    }
  }
  function load() {
    migrateLegacy();
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (data && Array.isArray(data.objectives)) return data;
    } catch (error) {
      console.warn('Dados BrainFlow inválidos.',
      error);
    }
    return emptyData();
  }
  function save(data) {
    localStorage.setItem(KEY,
    JSON.stringify(data));
  }
  function getObjective(id) {
    return load().objectives.find(item => item.id === id) || null;
  }
  function activeId() {
    const data = load();
    return new URLSearchParams(location.search).get('id') || data.activeObjectiveId || data.objectives[0]?.id || null;
  }
  function setActive(id) {
    const data = load();
    data.activeObjectiveId = id;
    save(data);
  }
  function upsert(objective) {
    const data = load();
    const index = data.objectives.findIndex(item => item.id === objective.id);
    objective.updatedAt = new Date().toISOString();
    if (index >= 0) data.objectives[index] = objective;
    else {
      objective.createdAt = new Date().toISOString();
      data.objectives.push(objective);
    }
    data.activeObjectiveId = objective.id;
    save(data);
    return objective;
  }
  function remove(id) {
    const data = load();
    data.objectives = data.objectives.filter(item => item.id !== id);
    if (data.activeObjectiveId === id) data.activeObjectiveId = data.objectives[0]?.id || null;
    save(data);
  }
  function isOffDay(objective,
  date) {
    const iso = typeof date === 'string' ? date: date.toISOString().slice(0,
    10);
    const d = parseDate(iso);
    if (!d) return true;
    if (objective.workdayMode === 'weekdays') return d.getDay() === 0 || d.getDay() === 6;
    if (objective.workdayMode === 'custom') return(objective.offDays || []).includes(iso);
    return false;
  }
  function activeDates(objective,
  from = objective.startDate,
  to = objective.endDate) {
    const start = parseDate(from),
    end = parseDate(to);
    if (!start || !end || end < start) return[];
    const dates = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
      if (!isOffDay(objective,
      iso)) dates.push(iso);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }
  function recordTotal(objective,
  predicate = () => true) {
    return(objective.records || []).filter(predicate).reduce((sum,
    item) => sum + (Number(item.amountCents) || 0),
    0);
  }
  function metrics(objective,
  now = todayISO()) {
    const active = activeDates(objective);
    const remaining = Math.max(0,
    objective.goalCents - objective.availableCents - recordTotal(objective));
    const elapsed = active.filter(date => date <= now);
    const future = active.filter(date => date >= now);
    const planBalance = Math.max(0,
    objective.goalCents - objective.availableCents);
    const wholeDaily = active.length ? Math.floor(planBalance / active.length): 0;
    const remainder = active.length ? planBalance % active.length: 0;
    const expected = objective.availableCents + wholeDaily * elapsed.length + Math.min(elapsed.length,
    remainder);
    const actual = objective.availableCents + recordTotal(objective,
    item => item.dateISO <= now);
    const ratio = expected > 0 ? actual / expected * 100: (actual > 0 ? 100: 0);
    const todayRecords = (objective.records || []).filter(item => item.dateISO === now);
    const todayTotal = todayRecords.reduce((s,
    item) => s + item.amountCents,
    0);
    const beforeToday = objective.availableCents + recordTotal(objective,
    item => item.dateISO < now);
    const balanceBeforeToday = Math.max(0,
    objective.goalCents - beforeToday);
    const remainingDays = active.filter(date => date >= now).length;
    const todayTarget = active.includes(now) && remainingDays ? Math.ceil(balanceBeforeToday / remainingDays): 0;
    const neededDaily = remainingDays ? Math.ceil(remaining / remainingDays): 0;
    const plannedDaily = active.length ? Math.ceil(planBalance / active.length): 0;
    const recoveryPct = plannedDaily > 0 ? Math.max(0,
    (neededDaily / plannedDaily - 1) * 100): 0;
    const progress = Math.min(100,
    objective.goalCents ? actual / objective.goalCents * 100: 0);
    return {
      active,
      elapsed,
      future,
      remaining,
      expected,
      actual,
      ratio,
      todayTotal,
      todayTarget,
      remainingDays,
      neededDaily,
      plannedDaily,
      recoveryPct,
      progress,
      isBefore: now < objective.startDate,
      isAfter: now > objective.endDate,
      isActive: active.includes(now),
      startDistance: Math.max(0,
      Math.round((parseDate(objective.startDate) - parseDate(now)) / 86400000))
    };
  }
  function addRecord(objective,
  amountCents,
  source,
  dateISO = todayISO(),
  note = '') {
    objective.records = objective.records || [];
    objective.records.push({
      id: uid(),
      amountCents,
      source,
      dateISO,
      createdAt: new Date().toISOString(),
      note
    });
    upsert(objective);
  }
  function applyTheme() {
    const theme = localStorage.getItem('brainFlowTheme') || 'dark';
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.innerHTML = theme === 'dark' ? '<span aria-hidden="true">☀</span>': '<span aria-hidden="true">☾</span>';
      button.setAttribute('aria-label',
      theme === 'dark' ? 'Ativar tema claro': 'Ativar tema escuro');
      button.title = theme === 'dark' ? 'Ativar tema claro': 'Ativar tema escuro';
    });
  }
  function initShared() {
    applyTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click',
    () => {
      const next = (localStorage.getItem('brainFlowTheme') || 'dark') === 'dark' ? 'light': 'dark';
      localStorage.setItem('brainFlowTheme',
      next);
      applyTheme();
    }));
    document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click',
    () => {
      if (history.length > 1) history.back();
      else {
        const fallback = button.dataset.back || 'index.html';
        const id = activeId();
        location.href = (fallback === 'objetivo.html' && id) ? `${fallback}?id=${encodeURIComponent(id)}`: fallback;
      }
    }));
  }
  document.addEventListener('DOMContentLoaded',
  initShared);
  window.BrainFlow = {
    KEY,
    money,
    todayISO,
    parseDate,
    fmtDate,
    cents,
    moneyText,
    parseMoney,
    uid,
    load,
    save,
    getObjective,
    activeId,
    setActive,
    upsert,
    remove,
    metrics,
    activeDates,
    recordTotal,
    addRecord
  };
})();
