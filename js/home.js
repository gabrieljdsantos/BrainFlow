(() => {
  const {
    load,
    moneyText,
    metrics
  }
  = BrainFlow;
  const list = document.getElementById('objectives');
  const data = load();
  document.getElementById('objective-count').textContent = `${data.objectives.length} ${data.objectives.length===1?'objetivo':'objetivos'}`;
  if (!data.objectives.length) {
    list.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div style="font-size:34px">🧠</div><strong>Seu primeiro objetivo começa aqui.</strong><span>Crie uma meta para acompanhar seus valores, desempenho e evolução.</span><p><a class="button button-primary" href="metas.html">＋ Iniciar objetivo</a></p></div>';
    return;
  }
  data.objectives.forEach(objective => {
    const m = metrics(objective);
    const card = document.createElement('a');
    card.className = 'card objective-card';
    card.href = `objetivo.html?id=${encodeURIComponent(objective.id)}`;
    const top = document.createElement('div');
    top.className = 'objective-card-top';
    const icon = document.createElement('span');
    icon.className = 'objective-icon';
    icon.textContent = '◎';
    const tag = document.createElement('span');
    tag.className = 'eyebrow';
    tag.textContent = m.isBefore ? 'Em breve': m.isAfter ? 'Encerrado': 'Em andamento';
    top.append(icon,
    tag);
    const title = document.createElement('h3');
    title.textContent = objective.name;
    const detail = document.createElement('p');
    detail.textContent = `${objective.category==='Outros'?objective.customCategory:objective.category} · Meta ${moneyText(objective.goalCents)}`;
    const track = document.createElement('div');
    track.className = 'progress-track';
    const fill = document.createElement('span');
    fill.style.width = `${Math.min(100,m.progress)}%`;
    track.append(fill);
    const line = document.createElement('div');
    line.className = 'progress-line';
    const pct = document.createElement('strong');
    pct.textContent = `${m.progress.toFixed(1).replace('.',',')}%`;
    const remaining = document.createElement('span');
    remaining.textContent = `Restam ${moneyText(m.remaining)}`;
    line.append(pct,
    remaining);
    card.append(top,
    title,
    detail,
    track,
    line);
    list.append(card);
  });
  const add = document.createElement('a');
  add.className = 'card objective-card';
  add.href = 'metas.html';
  add.style.justifyContent = 'center';
  add.style.alignItems = 'center';
  add.innerHTML = '<span class="objective-icon">＋</span><h3>Novo objetivo</h3><p>Planeje uma nova conquista independente.</p>';
  list.append(add);
})();
