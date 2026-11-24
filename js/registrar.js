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
  let pending = null;
  const amountField = $('amount');
  amountField.addEventListener('focus',
  () => {
    amountField.value = amountField.value.replace(/[^0-9,.-]/g,
    '')
  });
  amountField.addEventListener('blur',
  () => {
    const cents = BrainFlow.parseMoney(amountField.value);
    if (Number.isFinite(cents)) amountField.value = BrainFlow.moneyText(cents)
  });
  $('register-objective').textContent = `Objetivo: ${o.name}. O valor será adicionado ao extrato deste objetivo.`;
  $('record-date').value = BrainFlow.todayISO();
  $('record-date').max = BrainFlow.todayISO();
  $('cancel-record').href = `objetivo.html${q}`;
  const confirmModal = $('confirm-modal'),
  successModal = $('success-modal');
  $('record-form').addEventListener('submit',
  e => {
    e.preventDefault();
    $('record-error').textContent = '';
    const amount = BrainFlow.parseMoney($('amount').value),
    date = $('record-date').value,
    source = $('source').value.trim();
    if (!Number.isFinite(amount) || amount <= 0) {
      $('record-error').textContent = 'Informe um valor maior que zero.';
      return;
    }
    if (!source) {
      $('record-error').textContent = 'Informe de onde veio esse valor.';
      return;
    }
    if (!BrainFlow.parseDate(date) || date > BrainFlow.todayISO()) {
      $('record-error').textContent = 'Selecione uma data válida, até hoje.';
      return;
    }
    pending = {
      amount,
      date,
      source,
      note: $('note').value.trim()
    };
    $('confirm-amount').textContent = BrainFlow.moneyText(amount);
    $('confirm-source').textContent = `Origem: ${source}`;
    $('confirm-date').textContent = `Data: ${BrainFlow.fmtDate(date)}`;
    confirmModal.classList.remove('hidden');
  });
  $('confirm-cancel').addEventListener('click',
  () => confirmModal.classList.add('hidden'));
  $('confirm-save').addEventListener('click',
  () => {
    if (!pending) return;
    BrainFlow.addRecord(o,
    pending.amount,
    pending.source,
    pending.date,
    pending.note);
    pending = null;
    confirmModal.classList.add('hidden');
    successModal.classList.remove('hidden');
    $('modal-chart').href = `graficos.html${q}`;
    $('modal-track').href = `acompanhamento.html${q}`;
    $('modal-panel').href = `objetivo.html${q}`;
  });
  confirmModal.addEventListener('click',
  e => {
    if (e.target === confirmModal) confirmModal.classList.add('hidden')
  });
})();
