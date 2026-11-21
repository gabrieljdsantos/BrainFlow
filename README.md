# DriveControl — Planejador de Metas Financeiras

<p align="center">
  <strong>Organize suas metas. Acompanhe seus resultados. Tenha controle da sua evolução financeira.</strong>
</p>

<p align="center">
  Uma aplicação web desenvolvida para auxiliar motoristas no planejamento e acompanhamento de suas metas financeiras.
</p>

---

## Sobre o projeto

O **DriveControl** é uma aplicação web desenvolvida para facilitar o planejamento financeiro, permitindo definir objetivos, acompanhar resultados e controlar movimentações financeiras em um único ambiente.

O sistema foi pensado especialmente para motoristas que desejam organizar sua rotina financeira, estabelecer metas e acompanhar sua evolução ao longo de um período.

## Funcionalidades

- **Planejamento financeiro:** definição de metas e saldo inicial.
- **Período personalizado:** seleção de data inicial e final.
- **Meta diária automática:** cálculo do valor necessário por dia para alcançar o objetivo.
- **Calendário:** visualização e seleção do período planejado.
- **Acompanhamento diário:** registro dos resultados realizados.
- **Movimentações financeiras:** registro de entradas e saídas com observações.
- **Histórico financeiro:** consulta das movimentações registradas.
- **Gráfico de progresso:** acompanhamento visual da evolução percentual da meta.
- **Atualização automática:** recálculo dos valores conforme os registros realizados.
- **Persistência de dados:** armazenamento das informações no navegador por meio do LocalStorage.

## Demonstração do sistema

### Tela inicial

![Tela inicial do DriveControl](screenshots/tela-inicial.png)

### Cadastro e configuração

![Tela de cadastro](screenshots/cadastro.png)

### Calendário e seleção de período

![Calendário do DriveControl](screenshots/calendario.png)

### Acompanhamento financeiro

![Acompanhamento financeiro](screenshots/acompanhamento.png)

### Gráfico de progresso da meta

![Gráfico de progresso da meta](screenshots/grafico-meta.png)

## Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura da aplicação |
| CSS3 | Estilização e responsividade |
| JavaScript | Lógica e funcionalidades |
| LocalStorage | Armazenamento de dados no navegador |
| Git | Controle de versão |
| GitHub | Hospedagem do repositório |

## Estrutura do projeto

```text
DriveControl/
│
├── css/
│   ├── metas.css
│   └── style.css
│
├── js/
│   └── metas.js
│
├── screenshots/
│   ├── acompanhamento.png
│   ├── cadastro.png
│   ├── calendario.png
│   ├── grafico-meta.png
│   └── tela-inicial.png
│
├── index.html
├── metas.html
└── README.md
```

## Exemplo de lógica JavaScript

O progresso percentual da meta pode ser calculado a partir do valor acumulado em relação ao objetivo financeiro:

```javascript
const metaFinanceira = 10000;
const valorAcumulado = 2500;

const percentual = (valorAcumulado / metaFinanceira) * 100;

console.log(`Progresso da meta: ${percentual}%`);
```

Esse exemplo demonstra o conceito matemático utilizado para representar a evolução percentual de uma meta financeira.

## Como executar o projeto

1. Clone este repositório:

```bash
git clone https://github.com/gabrieljdsantos/Drive-control-planner.git
```

2. Acesse a pasta do projeto:

```bash
cd Drive-control-planner
```

3. Abra a pasta no Visual Studio Code.

4. Execute o arquivo `index.html` no navegador.

## Desenvolvedor

**Gabriel Santos**

Estudante de Análise e Desenvolvimento de Sistemas (ADS) e desenvolvedor em formação, com interesse em desenvolvimento web e criação de soluções práticas por meio da tecnologia.

## Conecte-se comigo

<p align="center">
  <a href="https://github.com/gabrieljdsantos">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://www.instagram.com/gabriel_jdsantoss/">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://www.linkedin.com/in/gabrieljdsantos/">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  <a href="https://dev.to/gabriel_jdsantos">
    <img src="https://img.shields.io/badge/DEV.to-0A0A0A?style=for-the-badge&logo=devdotto&logoColor=white" alt="DEV.to">
  </a>
  <a href="https://wa.me/5511991273616">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
  </a>
</p>

---

<p align="center">
  Desenvolvido por <strong>Gabriel Santos</strong>.
</p>

<p align="center">
  Projeto desenvolvido para aprendizado e aplicação prática de tecnologias de desenvolvimento web.
</p>