(() => {
  const id = BrainFlow.activeId(),
  o = BrainFlow.getObjective(id);
  if (!o) {
    location.href = 'index.html';
    return;
  }
  BrainFlow.setActive(id);
  const m = BrainFlow.metrics(o),
  today = BrainFlow.todayISO();
  const q = `?id=${encodeURIComponent(id)}`;
  const $ = x => document.getElementById(x);
  $('track-name').textContent = `Acompanhamento ${o.name}`;
  $('track-start').textContent = BrainFlow.fmtDate(o.startDate);
  $('track-end').textContent = BrainFlow.fmtDate(o.endDate);
  $('track-today').textContent = new Date().getDate();
  $('track-month').textContent = new Date().toLocaleDateString('pt-BR',
  {
    month: 'long',
    year: 'numeric'
  });
  $('today-target').textContent = BrainFlow.moneyText(m.todayTarget);
  $('today-total').textContent = BrainFlow.moneyText(m.todayTotal);
  $('today-total').classList.toggle('success',
  m.isActive && m.todayTotal >= m.todayTarget);
  $('today-total').classList.toggle('below',
  m.isActive && m.todayTotal < m.todayTarget);
  $('remaining').textContent = BrainFlow.moneyText(m.remaining);
  $('days-left').textContent = m.remainingDays;
  $('progress-label').textContent = `${m.progress.toFixed(1).replace('.',',')}%`;
  $('progress-fill').style.width = `${Math.min(100,m.progress)}%`;
  $('progress-detail').textContent = `${BrainFlow.moneyText(m.actual)} acumulados de ${BrainFlow.moneyText(o.goalCents)}.`;
  const period = $('period-notice');
  if (m.isBefore) {
    period.classList.remove('hidden');
    period.textContent = `Faltam ${m.startDistance} ${m.startDistance===1?'dia':'dias'} para iniciar seu objetivo. Sua meta diária prevista no início será de ${BrainFlow.moneyText(m.neededDaily)}.`;
  } else if (m.isAfter) {
    period.classList.remove('hidden');
    period.textContent = 'O período planejado foi encerrado. Consulte o resultado final do seu objetivo.';
  } else if (!m.isActive) {
    period.classList.remove('hidden');
    period.textContent = 'Hoje é um dia sem depósito conforme a configuração do seu calendário.';
  }
  const perf = $('performance');
  if (m.isBefore || m.isAfter) {
    perf.className = 'performance neutral';
    $('performance-title').textContent = m.isBefore ? 'Prepare-se para começar': 'Período encerrado';
    $('performance-percent').textContent = `${m.ratio.toFixed(0)}%`;
    $('performance-text').textContent = m.isBefore ? 'Os valores registrados antecipadamente serão considerados no início da meta.': 'Este é o desempenho acumulado em relação ao planejamento.';
  } else if (m.ratio < 100) {
    perf.className = 'performance bad';
    $('performance-title').textContent = 'Atenção ao seu desempenho';
    $('performance-percent').textContent = `${m.ratio.toFixed(1).replace('.',',')}%`;
    $('performance-text').textContent = `Você está abaixo do ritmo planejado. Para recuperar, precisará fazer ${m.recoveryPct.toFixed(1).replace('.',',')}% acima da meta diária inicial, cerca de ${BrainFlow.moneyText(m.neededDaily)} por dia ativo nos ${m.remainingDays} dias restantes.`;
  } else if (m.ratio > 100) {
    perf.className = 'performance good';
    $('performance-title').textContent = 'Excelente desempenho!';
    $('performance-percent').textContent = `${m.ratio.toFixed(1).replace('.',',')}%`;
    $('performance-text').textContent = `Parabéns! Você está ${ (m.ratio-100).toFixed(1).replace('.',',')}% acima do ritmo planejado. Continue assim!`;
  } else {
    perf.className = 'performance good';
    $('performance-title').textContent = 'Parabéns! Você está dentro da sua meta.';
    $('performance-percent').textContent = '100%';
    $('performance-text').textContent = 'Você está acompanhando exatamente o ritmo necessário para alcançar seu objetivo. Continue assim!';
  }
  $('register-link').href = `registrar.html${q}`;
  $('charts-link').href = `graficos.html${q}`;
  $('edit-link').href = `metas.html${q}`;
})();
