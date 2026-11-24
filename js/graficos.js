(() => {
  const id = BrainFlow.activeId(),
  o = BrainFlow.getObjective(id);
  if (!o) {
    location.href = 'index.html';
    return;
  }
  BrainFlow.setActive(id);
  const $ = id => document.getElementById(id);
  $('chart-objective').textContent = `Evolução financeira do objetivo ${o.name}.`;
  const metric = BrainFlow.metrics(o);
  $('chart-goal').textContent = BrainFlow.moneyText(o.goalCents);
  $('chart-total').textContent = BrainFlow.moneyText(metric.actual);
  $('chart-progress').textContent = `${metric.progress.toFixed(1).replace('.',',')}%`;
  $('chart-remaining').textContent = BrainFlow.moneyText(metric.remaining);
  const sum = values => values.reduce((a,
  b) => a + b,
  0),
  iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function draw(targetId,
  labels,
  values,
  withDate = false) {
    const root = $(targetId);
    root.replaceChildren();
    const max = Math.max(1,
    ...values);
    values.forEach((value,
    i) => {
      const col = document.createElement('div');
      col.className = 'bar-col';
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${Math.max(2,value/max*100)}%`;
      const amount = document.createElement('em');
      amount.textContent = value ? BrainFlow.moneyText(value).replace(',00',
      ''): '—';
      bar.append(amount);
      const label = document.createElement('span');
      if (withDate) {
        label.className = 'bar-day';
        const weekday = document.createElement('small');
        weekday.textContent = labels[i].day;
        const day = document.createElement('strong');
        day.textContent = labels[i].date;
        label.append(weekday,
        day)
      } else label.textContent = labels[i];
      col.append(bar,
      label);
      root.append(col);
    });
  }
  let weekOffset = 0;
  function renderWeek() {
    const now = new Date();
    now.setHours(0,
    0,
    0,
    0);
    const day = now.getDay(),
    monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6: day - 1) + weekOffset * 7);
    const labels = [],
    values = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      labels.push({
        day: ['Dom',
        'Seg',
        'Ter',
        'Qua',
        'Qui',
        'Sex',
        'Sáb'][d.getDay()],
        date: d.getDate()
      });
      values.push(BrainFlow.recordTotal(o,
      r => r.dateISO === iso(d)));
    }
    draw('weekly-chart',
    labels,
    values,
    true);
    $('week-total').textContent = BrainFlow.moneyText(sum(values));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    $('week-range').textContent = `${BrainFlow.fmtDate(iso(monday))} a ${BrainFlow.fmtDate(iso(sunday))}`;
    $('week-next').disabled = weekOffset >= 0;
  }
  $('week-prev').addEventListener('click',
  () => {
    weekOffset--;
    renderWeek()
  });
  $('week-next').addEventListener('click',
  () => {
    if (weekOffset < 0) {
      weekOffset++;
      renderWeek()
    }
  });
  renderWeek();
  const now = new Date(),
  year = now.getFullYear(),
  month = now.getMonth(),
  monthLabels = [],
  monthValues = [],
  daysInMonth = new Date(year,
  month + 1,
  0).getDate(),
  weeks = Math.ceil(daysInMonth / 7);
  for (let i = 0; i < weeks; i++) {
    monthLabels.push(`Sem ${i+1}`);
    const first = i * 7 + 1,
    last = Math.min((i + 1) * 7,
    daysInMonth),
    a = `${year}-${String(month+1).padStart(2,'0')}-${String(first).padStart(2,'0')}`,
    b = `${year}-${String(month+1).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
    monthValues.push(BrainFlow.recordTotal(o,
    r => r.dateISO >= a && r.dateISO <= b));
  }
  draw('monthly-chart',
  monthLabels,
  monthValues);
  $('month-total').textContent = BrainFlow.moneyText(sum(monthValues));
})();
