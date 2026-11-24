(() => {
  const id = BrainFlow.activeId(),
  o = BrainFlow.getObjective(id);
  if (!o) {
    location.href = 'index.html';
    return;
  }
  BrainFlow.setActive(id);
  const q = `?id=${encodeURIComponent(id)}`;
  const $ = x => document.getElementById(x);
  const total = BrainFlow.recordTotal(o),
  remaining = Math.max(0,
  o.goalCents - o.availableCents - total);
  $('movement-objective').textContent = `Extrato financeiro de ${o.name}.`;
  $('initial-value').textContent = BrainFlow.moneyText(o.availableCents);
  $('recorded-value').textContent = BrainFlow.moneyText(total);
  $('movement-remaining').textContent = BrainFlow.moneyText(remaining);
  $('record-count').textContent = (o.records || []).length;
  $('new-record').href = `registrar.html${q}`;
  const list = $('movement-list');
  const entries = [...(o.records || [])].sort((a,
  b) => (b.createdAt || b.dateISO).localeCompare(a.createdAt || a.dateISO));
  if (!entries.length) {
    list.innerHTML = '<div class="empty-state">Nenhum valor registrado ainda.<strong>Seu extrato aparecerá aqui.</strong><a class="button button-primary" href="registrar.html' + q + '">Registrar primeiro valor</a></div>';
    return;
  }
  entries.forEach(entry => {
    const row = document.createElement('article');
    row.className = 'list-row';
    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = entry.source || 'Registro';
    const meta = document.createElement('small');
    meta.textContent = `${BrainFlow.fmtDate(entry.dateISO)}${entry.note?' · '+entry.note:''}`;
    info.append(title,
    meta);
    const value = document.createElement('span');
    value.className = 'amount-positive';
    value.textContent = `+ ${BrainFlow.moneyText(entry.amountCents)}`;
    row.append(info,
    value);
    list.append(row);
  });
})();
