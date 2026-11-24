# BrainFlow — Seu segundo cérebro

Aplicação web para criar objetivos financeiros independentes, acompanhar resultados, consultar movimentações e visualizar gráficos semanais e mensais.

## Funcionalidades

- Criação de vários objetivos independentes, cada um com painel próprio.
- Planejamento por categoria, nome, valor desejado, valor inicial e período.
- Configuração de dias ativos: todos os dias, segunda a sexta ou calendário personalizado de folgas.
- Cálculo automático da meta diária.
- Painel do objetivo com acesso ao acompanhamento, extrato, registro de valores e gráficos.
- Registro de valores com origem: Trabalho, PIX ou Reserva financeira.
- Extrato individual por objetivo.
- Acompanhamento de saldo, dias restantes, progresso e desempenho em relação ao planejado.
- Indicadores quando o usuário está abaixo, dentro ou acima do ritmo esperado.
- Gráficos semanais e mensais atualizados pelos registros.
- Edição do objetivo com preservação do histórico financeiro e recálculo dos indicadores.
- Tema claro/escuro com preferência salva no navegador.
- Migração automática dos dados antigos armazenados na chave `driveControlMetas` para `brainFlowData`.
- Persistência local com LocalStorage.

## Estrutura

```text
BrainFlow/
├── assets/logo/brainflow-mark.svg
├── css/app.css
├── js/
│   ├── core.js
│   ├── home.js
│   ├── form.js
│   ├── panel.js
│   ├── acompanhamento.js
│   ├── registrar.js
│   ├── movimentacoes.js
│   └── graficos.js
├── index.html
├── metas.html
├── objetivo.html
├── acompanhamento.html
├── registrar.html
├── movimentacoes.html
└── graficos.html
```

A pasta `legacy/` guarda os arquivos CSS e JavaScript da versão DriveControl como referência; as novas páginas BrainFlow não dependem deles.

## Como executar

1. Abra a pasta no Visual Studio Code.
2. Abra `index.html` no navegador ou use a extensão Live Server.
3. Crie um objetivo e explore as quatro áreas do painel.

Não é necessário instalar dependências para executar a versão atual. Os gráficos são desenhados com JavaScript e CSS, sem biblioteca externa.

## Armazenamento e privacidade

Os dados são armazenados no LocalStorage do navegador e permanecem naquele navegador/dispositivo. Limpar os dados do navegador pode apagar os objetivos. Esta versão ainda não sincroniza dados entre dispositivos nem utiliza servidor ou conta de usuário.

## Tecnologias

HTML5 · CSS3 · JavaScript · LocalStorage · Git/GitHub
 