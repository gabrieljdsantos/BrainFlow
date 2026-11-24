(() => {
  const id = BrainFlow.activeId(),
  objective = BrainFlow.getObjective(id);
  if (!objective) {
    location.href = 'index.html';
    return;
  }
  BrainFlow.setActive(id);
  const q = `?id=${encodeURIComponent(id)}`;
  document.getElementById('objective-name').textContent = objective.name;
  document.getElementById('objective-subtitle').textContent = `${objective.category==='Outros'?objective.customCategory:objective.category} · Meta de ${BrainFlow.moneyText(objective.goalCents)}`;
  document.getElementById('go-track').href = `acompanhamento.html${q}`;
  document.getElementById('go-movements').href = `movimentacoes.html${q}`;
  document.getElementById('go-register').href = `registrar.html${q}`;
  document.getElementById('go-charts').href = `graficos.html${q}`;
  document.getElementById('edit-objective').href = `metas.html${q}`;
  const modal = document.getElementById('delete-modal');
  document.getElementById('delete-message').textContent = `Deseja realmente excluir o objetivo “${objective.name}” e todos os registros vinculados a ele? Essa ação não poderá ser desfeita.`;
  document.getElementById('delete-objective').addEventListener('click',
  () => modal.classList.remove('hidden'));
  document.getElementById('cancel-delete').addEventListener('click',
  () => modal.classList.add('hidden'));
  document.getElementById('confirm-delete').addEventListener('click',
  () => {
    BrainFlow.remove(id);
    location.href = 'index.html';
  });
  modal.addEventListener('click',
  e => {
    if (e.target === modal) modal.classList.add('hidden')
  });
  if (new URLSearchParams(location.search).get('updated') === '1') {
    const update = document.createElement('div');
    update.className = 'modal-backdrop';
    update.innerHTML = `<section class="modal modal-centered" role="dialog" aria-modal="true"><div class="eyebrow">Alterações salvas</div><h2>Seu objetivo foi atualizado!</h2><p>O acompanhamento, os cálculos e os gráficos foram recalculados. Seu histórico financeiro foi preservado.</p><div class="modal-actions"><a class="button button-primary" href="graficos.html${q}">Ver gráficos</a><a class="button button-secondary" href="acompanhamento.html${q}">Ver acompanhamento</a><button class="button button-secondary" id="close-update">Agora não</button></div></section>`;
    document.body.append(update);
    update.querySelector('#close-update').addEventListener('click',
    () => update.remove());
    update.addEventListener('click',
    e => {
      if (e.target === update) update.remove()
    });
    history.replaceState({
    },
    '',
    `objetivo.html${q}`);
  }
})();
