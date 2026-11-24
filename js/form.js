(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  const existing = editId ? BrainFlow.getObjective(editId): null;
  if (editId && !existing) {
    location.href = 'index.html';
    return;
  }
  const form = $('objective-form'),
  category = $('category'),
  customWrap = $('custom-category-wrap'),
  custom = $('custom-category'),
  name = $('name'),
  goal = $('goal'),
  available = $('available'),
  start = $('start'),
  end = $('end'),
  mode = () => form.querySelector('input[name="mode"]:checked').value;
  const error = $('form-error'),
  preview = $('daily-preview'),
  detail = $('daily-detail'),
  notice = $('start-notice');
  let offDaySet = new Set(existing?.offDays || []);
  let calendarMonth = new Date();
  calendarMonth.setDate(1);
  $('form-title').textContent = existing ? 'Editar objetivo': 'Crie seu objetivo';
  $('save-objective').textContent = existing ? 'Salvar alterações': 'Salvar objetivo';
  const today = BrainFlow.todayISO();
  start.min = existing ? '': today;
  end.min = existing ? existing.startDate: today;
  const localISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function parseOffDays() {
    return[...offDaySet].sort();
  }
  function renderCalendar() {
    const grid = $('calendar-grid');
    if (!grid) return;
    grid.replaceChildren();
    const y = calendarMonth.getFullYear(),
    m = calendarMonth.getMonth();
    $('calendar-month').textContent = calendarMonth.toLocaleDateString('pt-BR',
    {
      month: 'long',
      year: 'numeric'
    });
    const first = new Date(y,
    m,
    1).getDay(),
    days = new Date(y,
    m + 1,
    0).getDate();
    for (let i = 0; i < first; i++) {
      const blank = document.createElement('span');
      grid.append(blank);
    }
    for (let day = 1; day <= days; day++) {
      const d = new Date(y,
      m,
      day),
      iso = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
      button = document.createElement('button');
      button.type = 'button';
      button.textContent = day;
      const inRange = start.value && end.value && iso >= start.value && iso <= end.value;
      button.disabled = !inRange || (!existing && iso < today);
      if (inRange) button.classList.add('in-range');
      if (offDaySet.has(iso)) button.classList.add('off');
      if (iso === today) button.classList.add('today');
      button.setAttribute('aria-label',
      `${day} ${calendarMonth.toLocaleDateString('pt-BR',{month:'long'})}${offDaySet.has(iso)?', dia sem depósito':''}`);
      button.addEventListener('click',
      () => {
        if (offDaySet.has(iso)) offDaySet.delete(iso);
        else offDaySet.add(iso);
        update();
      });
      grid.append(button);
    }
    $('off-day-count').textContent = `${offDaySet.size} ${offDaySet.size===1?'dia de folga selecionado':'dias de folga selecionados'}.`;
  }
  function countActive(a,
  b) {
    const obj = {
      workdayMode: mode(),
      offDays: parseOffDays()
    };
    return BrainFlow.activeDates({
      ...obj,
      startDate: a,
      endDate: b
    }).length;
  }
  function update() {
    customWrap.classList.toggle('hidden',
    category.value !== 'Outros');
    $('custom-days-wrap').classList.toggle('hidden',
    mode() !== 'custom');
    renderCalendar();
    if (start.value) end.min = start.value;
    else end.min = today;
    const total = BrainFlow.parseMoney(goal.value),
    initial = BrainFlow.parseMoney(available.value);
    const valid = Number.isFinite(total) && total > 0 && Number.isFinite(initial) && initial <= total && start.value && end.value && end.value >= start.value;
    if (!valid) {
      preview.textContent = 'R$ 0,00';
      detail.textContent = 'Preencha o valor e o período para calcular.';
      notice.innerHTML = '';
      $('save-objective').disabled = true;
      return;
    }
    const days = countActive(start.value,
    end.value),
    remaining = total - initial;
    $('save-objective').disabled = !(days > 0 && category.value && name.value.trim() && (category.value !== 'Outros' || custom.value.trim()));
    preview.textContent = BrainFlow.moneyText(days ? Math.ceil(remaining / days): 0);
    detail.textContent = days ? `${BrainFlow.moneyText(remaining)} restantes em ${days} dias ativos.`: 'Escolha ao menos um dia ativo.';
    if (start.value > today) {
      const d = Math.round((BrainFlow.parseDate(start.value) - BrainFlow.parseDate(today)) / 86400000);
      notice.innerHTML = `<div class="notice">Você ainda não está dentro do período da sua meta. Faltam <strong>${d} ${d===1?'dia':'dias'}</strong> para iniciar. Sua meta diária prevista será de <strong>${preview.textContent}</strong>.</div>`;
    } else if (end.value >= today) {
      notice.innerHTML = '<div class="notice good">Você já está dentro do período do seu objetivo. Vamos acompanhar sua evolução!</div>';
    } else {
      notice.innerHTML = '<div class="notice bad">A data final está no passado. Escolha um período válido para continuar.</div>';
    }
  }
  [goal,
  available].forEach(field => {
    field.addEventListener('focus',
    () => {
      field.value = field.value.replace(/[^0-9,.-]/g,
      '');
    });
    field.addEventListener('blur',
    () => {
      const cents = BrainFlow.parseMoney(field.value);
      if (Number.isFinite(cents)) field.value = BrainFlow.moneyText(cents);
    });
  });
  [category,
  custom,
  name,
  goal,
  available,
  start,
  end].forEach(el => el.addEventListener('input',
  () => {
    if (start.value) {
      calendarMonth = new Date(start.value + 'T00:00:00');
      calendarMonth.setDate(1);
    }
    if (start.value && end.value) offDaySet = new Set([...offDaySet].filter(date => date >= start.value && date <= end.value));
    update();
  }));
  $('calendar-prev').addEventListener('click',
  () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  $('calendar-next').addEventListener('click',
  () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });
  form.querySelectorAll('input[name="mode"]').forEach(el => el.addEventListener('change',
  update));
  if (existing) {
    category.value = existing.category || '';
    custom.value = existing.customCategory || '';
    name.value = existing.name;
    goal.value = BrainFlow.moneyText(existing.goalCents);
    available.value = BrainFlow.moneyText(existing.availableCents);
    start.value = existing.startDate;
    end.value = existing.endDate;
    offDaySet = new Set(existing.offDays || []);
    calendarMonth = new Date(start.value + 'T00:00:00');
    calendarMonth.setDate(1);
    const radio = form.querySelector(`input[name="mode"][value="${existing.workdayMode||'all'}"]`);
    if (radio) radio.checked = true;
  } else {
    start.value = today;
    const last = new Date();
    last.setDate(last.getDate() + 30);
    end.value = localISO(last);
    calendarMonth = new Date(start.value + 'T00:00:00');
    calendarMonth.setDate(1);
  }
  update();
  $('clear-form').addEventListener('click',
  () => {
    category.value = '';
    custom.value = '';
    name.value = '';
    goal.value = '';
    available.value = 'R$ 0,00';
    start.value = '';
    end.value = '';
    offDaySet = new Set();
    form.querySelector('input[name="mode"][value="all"]').checked = true;
    calendarMonth = new Date();
    calendarMonth.setDate(1);
    error.textContent = '';
    update();
  });
  form.addEventListener('submit',
  event => {
    event.preventDefault();
    error.textContent = '';
    const goalCents = BrainFlow.parseMoney(goal.value),
    availableCents = BrainFlow.parseMoney(available.value);
    if (!category.value) {
      error.textContent = 'Selecione uma categoria.';
      return;
    }
    if (category.value === 'Outros' && !custom.value.trim()) {
      error.textContent = 'Informe sua categoria personalizada.';
      return;
    }
    if (!name.value.trim()) {
      error.textContent = 'Dê um nome ao seu objetivo.';
      return;
    }
    if (!Number.isFinite(goalCents) || goalCents <= 0 || !Number.isFinite(availableCents) || availableCents > goalCents) {
      error.textContent = 'Confira os valores informados. O valor inicial não pode superar a meta.';
      return;
    }
    if (!BrainFlow.parseDate(start.value) || !BrainFlow.parseDate(end.value) || end.value < start.value || (!existing && end.value < today)) {
      error.textContent = 'Selecione um período válido, com data final hoje ou futura.';
      return;
    }
    const selectedMode = mode(),
    excluded = selectedMode === 'custom' ? parseOffDays(): [];
    const objective = {
      id: existing?.id || BrainFlow.uid(),
      name: name.value.trim(),
      category: category.value,
      customCategory: category.value === 'Outros' ? custom.value.trim(): '',
      goalCents,
      availableCents,
      startDate: start.value,
      endDate: end.value,
      workdayMode: selectedMode,
      offDays: excluded,
      records: existing?.records || [],
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    if (!BrainFlow.activeDates(objective).length) {
      error.textContent = 'Seu planejamento precisa ter pelo menos um dia ativo.';
      return;
    }
    BrainFlow.upsert(objective);
    location.href = `objetivo.html?id=${encodeURIComponent(objective.id)}${existing?'&updated=1':''}`;
  });
})();
