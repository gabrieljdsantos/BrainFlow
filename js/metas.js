/* ========================================
   DRIVECONTROL - METAS FINANCEIRAS
   Planejamento, resultados e movimentações
======================================== */

/* 1. ELEMENTOS */

const metaForm = document.getElementById("metaForm");
const nomeMeta = document.getElementById("nomeMeta");
const valorMeta = document.getElementById("valorMeta");
const valorDisponivel = document.getElementById("valorDisponivel");
const mesMeta = document.getElementById("mesMeta");

const calendarTitle = document.getElementById("calendarTitle");
const calendarDays = document.getElementById("calendarDays");

const startDateElement = document.getElementById("startDate");
const endDateElement = document.getElementById("endDate");
const selectionMessage = document.getElementById("selectionMessage");

const dailyResult = document.getElementById("dailyResult");
const resultDescription = document.getElementById("resultDescription");
const errorMessage = document.getElementById("errorMessage");

const prevMonthButton = document.getElementById("prevMonth");
const nextMonthButton = document.getElementById("nextMonth");
const clearButton = document.getElementById("clearButton");

const trackingTitle = document.getElementById("trackingTitle");
const todayLabel = document.getElementById("todayLabel");
const todayTarget = document.getElementById("todayTarget");
const todayRealized = document.getElementById("todayRealized");
const remainingBalance = document.getElementById("remainingBalance");
const remainingDays = document.getElementById("remainingDays");

const realizedToday = document.getElementById("realizedToday");
const saveDailyButton = document.getElementById("saveDailyButton");
const dailyStatus = document.getElementById("dailyStatus");

const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressDescription = document.getElementById("progressDescription");

const historyList = document.getElementById("historyList");

const movementAmount = document.getElementById("movementAmount");
const movementNote = document.getElementById("movementNote");
const movementTimestamp = document.getElementById("movementTimestamp");
const saveMovementButton = document.getElementById("saveMovementButton");
const movementStatus = document.getElementById("movementStatus");
const movementHistoryList = document.getElementById("movementHistoryList");


/* 2. ESTADO E UTILITÁRIOS */

const STORAGE_KEY = "driveControlMetas";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
});

let startDate = null;
let endDate = null;
let currentDate = firstDayOfMonth(getToday());
let plan = null;
let midnightTimer = null;


function getToday() {

    const d = new Date();

    d.setHours(0, 0, 0, 0);

    return d;

}


function firstDayOfMonth(date) {

    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1
    );

}


function dateToISO(date) {

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

}


function parseLocalDate(value) {

    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const [year, month, day] = value.split("-").map(Number);

    const d = new Date(year, month - 1, day);

    return dateToISO(d) === value ? d : null;

}


function formatDate(date) {

    return date
        ? date.toLocaleDateString("pt-BR")
        : "--/--/----";

}


function sameDate(a, b) {

    return dateToISO(a) === dateToISO(b);

}


function calculateDays(start, end) {

    if (!start || !end || end < start) {
        return 0;
    }

    const a = Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
    );

    const b = Date.UTC(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
    );

    return Math.round((b - a) / 86400000) + 1;

}


function formatMoney(cents) {

    return currencyFormatter.format(cents / 100);

}


function validCents(value) {

    return Number.isSafeInteger(value) && value >= 0;

}


function getMoneyValue(element) {

    const raw = element.value.trim();

    if (!raw) return 0;

    const digits = raw.replace(/\D/g, "");

    if (!digits) return 0;

    const cents = raw.includes("R$")
        ? Number(digits)
        : Number(digits) * 100;

    return cents;

}


function readMoney(element) {

    const value = element.value.trim();

    if (!value) return 0;

    if (value.includes("R$")) {
        return Number(value.replace(/\D/g, ""));
    }

    if (!/^\d+(,\d{0,2})?$/.test(value)) {
        return NaN;
    }

    const [reais, centavos = ""] = value.split(",");

    return Number(reais) * 100 +
        Number(centavos.padEnd(2, "0"));

}


function configureMoneyInput(element, onUpdate = () => {}) {

    element.addEventListener("focus", () => {

        const cents = readMoney(element);

        element.value = cents > 0
            ? (cents / 100).toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
                useGrouping: false
            })
            : "";

        element.dataset.editing = "true";

    });


    element.addEventListener("input", () => {

        let value = element.value.replace(/[^\d,]/g, "");

        const comma = value.indexOf(",");

        if (comma !== -1) {

            value = value.slice(0, comma + 1) +
                value.slice(comma + 1).replace(/,/g, "").slice(0, 2);

        }

        element.value = value;

        onUpdate();

    });


    element.addEventListener("blur", () => {

        const cents = readMoney(element);

        element.value =
            validCents(cents) && cents > 0
                ? formatMoney(cents)
                : "";

        delete element.dataset.editing;

        onUpdate();

    });

}


function showError(message) {

    errorMessage.textContent = message;

}


function clearError() {

    errorMessage.textContent = "";

}


function setMovementStatus(message, type = "") {

    movementStatus.textContent = message;

    movementStatus.className =
        `movement-status${type ? ` ${type}` : ""}`;

}


/* 3. CALENDÁRIO */

function updateMonthInput() {

    mesMeta.value =
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

}


function updateCalendarTitle() {

    calendarTitle.textContent =
        currentDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });

}


function updateNavigationButtons() {

    prevMonthButton.disabled =
        currentDate <= firstDayOfMonth(getToday());

}


function renderCalendar() {

    calendarDays.replaceChildren();

    updateCalendarTitle();

    updateNavigationButtons();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstWeekday = new Date(year, month, 1).getDay();

    const count = new Date(year, month + 1, 0).getDate();

    const today = getToday();


    for (let i = 0; i < firstWeekday; i++) {

        const blank = document.createElement("div");

        blank.className = "calendar-day empty";

        calendarDays.appendChild(blank);

    }


    for (let day = 1; day <= count; day++) {

        const date = new Date(year, month, day);

        const button = document.createElement("button");

        button.type = "button";

        button.textContent = String(day);

        button.className = "calendar-day";


        if (sameDate(date, today)) {
            button.classList.add("today");
        }


        if (date < today) {

            button.classList.add("disabled");

            button.disabled = true;

        }


        if (
            (startDate && sameDate(date, startDate)) ||
            (endDate && sameDate(date, endDate))
        ) {

            button.classList.add("selected");

        }


        if (
            startDate &&
            endDate &&
            date > startDate &&
            date < endDate
        ) {

            button.classList.add("in-range");

        }


        button.addEventListener("click", () => selectDate(date));

        calendarDays.appendChild(button);

    }

}


function selectDate(date) {

    clearError();

    if (!startDate || endDate) {

        startDate = new Date(date);

        endDate = null;

    } else if (date < startDate) {

        endDate = startDate;

        startDate = new Date(date);

    } else {

        endDate = new Date(date);

    }

    updateDateSummary();

    renderCalendar();

    updateAutomaticCalculation();

}


function updateDateSummary() {

    startDateElement.textContent = formatDate(startDate);

    endDateElement.textContent = formatDate(endDate);


    if (!startDate) {

        selectionMessage.textContent =
            "Selecione a data inicial e a data final no calendário.";

    } else if (!endDate) {

        selectionMessage.textContent =
            "Agora selecione a data final do seu planejamento.";

    } else {

        const days = calculateDays(startDate, endDate);

        selectionMessage.textContent =
            `Seu planejamento terá ${days} ${days === 1 ? "dia" : "dias"}, contando a data inicial e a final.`;

    }

}


function changeMonth(direction) {

    const next = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1
    );

    if (next < firstDayOfMonth(getToday())) {
        return;
    }

    currentDate = next;

    startDate = null;

    endDate = null;

    updateMonthInput();

    updateDateSummary();

    renderCalendar();

    updateAutomaticCalculation();

}


prevMonthButton.addEventListener("click", () => changeMonth(-1));

nextMonthButton.addEventListener("click", () => changeMonth(1));


mesMeta.addEventListener("change", () => {

    if (!/^\d{4}-\d{2}$/.test(mesMeta.value)) {
        return;
    }

    const [year, month] = mesMeta.value.split("-").map(Number);

    const chosen = new Date(year, month - 1, 1);

    currentDate =
        chosen < firstDayOfMonth(getToday())
            ? firstDayOfMonth(getToday())
            : chosen;

    startDate = null;

    endDate = null;

    updateMonthInput();

    updateDateSummary();

    renderCalendar();

    updateAutomaticCalculation();

});


/* 4. PLANEJAMENTO E PERSISTÊNCIA */

function getPlanInputs() {

    return {
        name: nomeMeta.value.trim(),
        goalCents: readMoney(valorMeta),
        availableCents: readMoney(valorDisponivel)
    };

}


function validatePlan(showMessages = false) {

    const data = getPlanInputs();

    let message = "";

    if (!data.name) {

        message = "Informe o nome da sua meta.";

    } else if (
        !validCents(data.goalCents) ||
        data.goalCents === 0
    ) {

        message = "Informe um valor válido para sua meta.";

    } else if (!validCents(data.availableCents)) {

        message = "Informe um valor disponível válido.";

    } else if (data.availableCents > data.goalCents) {

        message = "O valor disponível não pode superar a meta total.";

    } else if (!startDate || !endDate) {

        message = "Selecione a data inicial e a data final.";

    }

    if (showMessages && message) {
        showError(message);
    }

    return !message;

}


function planSignature(data) {

    return [
        data.goalCents,
        data.availableCents,
        data.startDate,
        data.endDate
    ].join("|");

}


function persistData() {

    if (!plan) return true;

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(plan)
        );

        return true;

    } catch (error) {

        console.error("Falha ao salvar planejamento:", error);

        showError("Não foi possível salvar os dados neste navegador.");

        return false;

    }

}


function savePlan() {

    const data = getPlanInputs();

    const next = {
        ...data,
        startDate: dateToISO(startDate),
        endDate: dateToISO(endDate)
    };

    const changed =
        plan && planSignature(plan) !== planSignature(next);


    if (
        changed &&
        (
            (plan.movements || []).length ||
            Object.keys(plan.history || {}).length
        )
    ) {

        const ok = confirm(
            "Alterar o valor inicial, a meta ou o período apagará os lançamentos anteriores. Deseja continuar?"
        );

        if (!ok) return false;

    }


    plan = {

        ...next,

        history: changed ? {} : (plan?.history || {}),

        movements: changed ? [] : (plan?.movements || [])

    };

    return persistData();

}


function updateAutomaticCalculation() {

    if (!validatePlan(false)) {

        dailyResult.textContent = "R$ 0,00";

        resultDescription.textContent =
            "Preencha os dados e selecione o período para calcular sua meta.";

        return;

    }

    if (!savePlan()) {

        restorePlanFields();

        return;

    }

    clearError();

    updateDashboard();

}


function restorePlanFields() {

    if (!plan) return;

    nomeMeta.value = plan.name;

    valorMeta.value = formatMoney(plan.goalCents);

    valorDisponivel.value =
        plan.availableCents
            ? formatMoney(plan.availableCents)
            : "";

    startDate = parseLocalDate(plan.startDate);

    endDate = parseLocalDate(plan.endDate);

    updateDateSummary();

    renderCalendar();

    updateDashboard();

}


/* 5. CÁLCULOS FINANCEIROS */

function dailyTotalOn(dateISO) {

    return Number(
        plan.history[dateISO]?.realizedCents
    ) || 0;

}


function movementsTotalBefore(dateISO) {

    return plan.movements.reduce(
        (sum, item) =>
            sum + (item.dateISO < dateISO ? item.amountCents : 0),
        0
    );

}


function movementsTotalThrough(dateISO) {

    return plan.movements.reduce(
        (sum, item) =>
            sum + (item.dateISO <= dateISO ? item.amountCents : 0),
        0
    );

}


function getPlanMetrics() {

    const today = getToday();

    const todayISO = dateToISO(today);

    const planStart = parseLocalDate(plan.startDate);

    const planEnd = parseLocalDate(plan.endDate);

    const historyEntries = Object.entries(plan.history);


    const realizedBefore = historyEntries.reduce(
        (sum, [date, entry]) =>
            sum + (date < todayISO ? entry.realizedCents : 0),
        0
    );


    const realizedTotal = historyEntries.reduce(
        (sum, [, entry]) =>
            sum + entry.realizedCents,
        0
    );


    const movementTotal = plan.movements.reduce(
        (sum, item) =>
            sum + item.amountCents,
        0
    );


    const todayRealizedCents = dailyTotalOn(todayISO);


    const beforeToday =
        plan.availableCents +
        realizedBefore +
        (
            today < planStart
                ? movementsTotalThrough(todayISO)
                : movementsTotalBefore(todayISO)
        );


    const balanceBeforeToday = Math.max(
        0,
        plan.goalCents - beforeToday
    );


    const balanceAfterToday = Math.max(
        0,
        plan.goalCents -
        plan.availableCents -
        realizedTotal -
        movementTotal
    );


    let daysLeft = 0;

    if (today < planStart) {

        daysLeft = calculateDays(planStart, planEnd);

    } else if (today <= planEnd) {

        daysLeft = calculateDays(today, planEnd);

    }


    const dailyTarget = daysLeft
        ? Math.ceil(balanceBeforeToday / daysLeft)
        : 0;


    const accumulated = Math.min(
        plan.goalCents,
        plan.availableCents + realizedTotal + movementTotal
    );


    const progress = Math.min(
        100,
        accumulated / plan.goalCents * 100
    );


    return {

        today,
        todayISO,
        planStart,
        planEnd,
        daysLeft,
        dailyTarget,
        todayRealizedCents,
        todayEntry: plan.history[todayISO],
        balanceBeforeToday,
        balanceAfterToday,
        accumulated,
        progress

    };

}


/* 6. ATUALIZAÇÃO DO PAINEL */

function updateDashboard() {

    if (!plan) return;

    const m = getPlanMetrics();

    trackingTitle.textContent =
        `Acompanhamento: ${plan.name}`;

    todayLabel.textContent = formatDate(m.today);

    todayTarget.textContent = formatMoney(
        m.today >= m.planStart && m.today <= m.planEnd
            ? m.dailyTarget
            : 0
    );

    todayRealized.textContent =
        formatMoney(m.todayRealizedCents);

    remainingBalance.textContent =
        formatMoney(m.balanceAfterToday);

    remainingDays.textContent =
        String(m.daysLeft);

    dailyResult.textContent =
        formatMoney(m.dailyTarget);


    if (m.today < m.planStart) {

        resultDescription.textContent =
            `Faltam ${formatMoney(m.balanceAfterToday)}. Sua meta diária prevista para o início do período é ${formatMoney(m.dailyTarget)}, considerando ${m.daysLeft} dias. Valores registrados antes do início reduzem essa previsão.`;

    } else if (m.today > m.planEnd) {

        resultDescription.textContent =
            `O período terminou. Saldo restante: ${formatMoney(m.balanceAfterToday)}.`;

    } else {

        resultDescription.textContent =
            `Faltam ${formatMoney(m.balanceAfterToday)} para alcançar "${plan.name}". Restam ${m.daysLeft} ${m.daysLeft === 1 ? "dia" : "dias"} no período, incluindo hoje.`;

    }


    progressFill.style.width = `${m.progress}%`;

    progressBar.setAttribute(
        "aria-valuenow",
        String(Math.round(m.progress))
    );

    progressText.textContent =
        `${m.progress.toFixed(1).replace(".", ",")}%`;

    progressDescription.textContent =
        `${formatMoney(m.accumulated)} acumulados de ${formatMoney(plan.goalCents)}.`;


    saveDailyButton.disabled =
        m.today < m.planStart || m.today > m.planEnd;


    updateDailyStatus(m);

    renderHistory();

    renderMovementHistory();

}


function updateDailyStatus(m) {

    if (m.today < m.planStart) {

        dailyStatus.textContent =
            "O período oficial ainda não começou. Você já pode adicionar valores em Movimentações financeiras.";

        dailyStatus.className = "daily-status neutral";

        return;

    }


    if (m.today > m.planEnd) {

        dailyStatus.textContent =
            m.balanceAfterToday
                ? "Período encerrado. Ainda existe saldo pendente."
                : "Parabéns! Meta alcançada.";

        dailyStatus.className =
            m.balanceAfterToday
                ? "daily-status negative"
                : "daily-status positive";

        return;

    }


    if (!m.todayEntry) {

        dailyStatus.textContent =
            m.balanceAfterToday === 0
                ? "Meta alcançada!"
                : "Registre o resultado diário para acompanhar seu desempenho.";

        dailyStatus.className =
            m.balanceAfterToday === 0
                ? "daily-status positive"
                : "daily-status neutral";

        return;

    }


    const diff =
        m.todayEntry.realizedCents -
        m.todayEntry.targetCents;


    dailyStatus.textContent =
        diff > 0
            ? `Acima da previsão diária em ${formatMoney(diff)}.`
            : diff < 0
                ? `Abaixo da previsão diária em ${formatMoney(-diff)}.`
                : "Meta diária alcançada exatamente!";


    dailyStatus.className =
        diff >= 0
            ? "daily-status positive"
            : "daily-status negative";

}


/* 7. RESULTADO DIÁRIO */

function saveDailyResult() {

    if (!plan) {

        showError("Crie um planejamento antes de registrar resultados.");

        return;

    }

    const m = getPlanMetrics();

    if (m.today < m.planStart || m.today > m.planEnd) {
        return;
    }


    if (!realizedToday.value.trim()) {

        dailyStatus.textContent =
            "Informe quanto realizou hoje. Para registrar um dia sem produção, digite 0.";

        dailyStatus.className = "daily-status negative";

        return;

    }


    const amount = readMoney(realizedToday);

    if (!validCents(amount)) {

        dailyStatus.textContent =
            "Informe um valor válido.";

        dailyStatus.className = "daily-status negative";

        return;

    }


    const old = plan.history[m.todayISO];

    const total =
        (old?.realizedCents || 0) + amount;


    if (!Number.isSafeInteger(total)) return;


    // Registros adicionais no mesmo dia são somados.

    const target =
        old?.targetCents ?? m.dailyTarget;


    plan.history[m.todayISO] = {

        realizedCents: total,

        targetCents: target,

        differenceCents: total - target

    };


    persistData();

    realizedToday.value = "";

    updateDashboard();

}


saveDailyButton.addEventListener("click", saveDailyResult);


/* 8. MOVIMENTAÇÕES FINANCEIRAS */

function updateMovementTimestamp() {

    movementTimestamp.textContent =
        dateTimeFormatter.format(new Date());

}


function saveMovement() {

    if (!plan) {

        setMovementStatus(
            "Crie um planejamento antes de registrar movimentações.",
            "error"
        );

        return;

    }


    const amount = readMoney(movementAmount);


    if (!validCents(amount) || amount === 0) {

        setMovementStatus(
            "Informe um valor maior que zero.",
            "error"
        );

        return;

    }


    const now = new Date();

    const entry = {

        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,

        amountCents: amount,

        note: movementNote.value.trim().slice(0, 250),

        dateISO: dateToISO(now),

        createdAt: now.toISOString()

    };


    plan.movements.push(entry);

    persistData();

    movementAmount.value = "";

    movementNote.value = "";

    updateMovementTimestamp();

    updateDashboard();


    setMovementStatus(
        `${formatMoney(amount)} adicionados ao progresso da meta.`,
        "success"
    );

}


saveMovementButton.addEventListener("click", saveMovement);


function renderMovementHistory() {

    movementHistoryList.replaceChildren();


    if (!plan || plan.movements.length === 0) {

        const empty = document.createElement("p");

        empty.className = "movement-empty";

        empty.textContent =
            "Nenhuma movimentação registrada ainda.";

        movementHistoryList.appendChild(empty);

        return;

    }


    const entries = [...plan.movements].sort(
        (a, b) => b.createdAt.localeCompare(a.createdAt)
    );


    for (const entry of entries) {

        const item = document.createElement("div");

        item.className = "movement-item";


        const info = document.createElement("div");

        info.className = "movement-item-info";


        const title = document.createElement("strong");

        title.textContent =
            entry.note || "Movimentação financeira";


        const timestamp = document.createElement("span");

        timestamp.className = "movement-item-meta";

        timestamp.textContent =
            dateTimeFormatter.format(new Date(entry.createdAt));


        const amount = document.createElement("span");

        amount.className = "movement-item-value";

        amount.textContent =
            `+${formatMoney(entry.amountCents)}`;


        info.append(title, timestamp);

        item.append(info, amount);

        movementHistoryList.appendChild(item);

    }

}


/* 9. HISTÓRICO DIÁRIO */

function renderHistory() {

    historyList.replaceChildren();

    if (!plan) return;


    const entries = Object.entries(plan.history).sort(
        (a, b) => b[0].localeCompare(a[0])
    );


    if (!entries.length) {

        const empty = document.createElement("p");

        empty.className = "history-empty";

        empty.textContent =
            "Nenhum resultado registrado ainda.";

        historyList.appendChild(empty);

        return;

    }


    for (const [date, entry] of entries) {

        const item = document.createElement("div");

        item.className = "history-item";


        const dateLabel = document.createElement("span");

        dateLabel.className = "history-date";

        dateLabel.textContent =
            formatDate(parseLocalDate(date));


        const values = document.createElement("div");

        values.className = "history-values";


        const realized = document.createElement("strong");

        realized.textContent =
            `Realizado: ${formatMoney(entry.realizedCents)}`;


        const difference = document.createElement("span");

        difference.className =
            `history-difference ${entry.differenceCents >= 0 ? "positive" : "negative"}`;


        difference.textContent =
            `${entry.differenceCents >= 0 ? "+" : "-"}${formatMoney(Math.abs(entry.differenceCents))} em relação à previsão`;


        values.append(realized, difference);

        item.append(dateLabel, values);

        historyList.appendChild(item);

    }

}


/* 10. RECUPERAÇÃO DOS DADOS */

function loadSavedData() {

    try {

        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) return;

        const saved = JSON.parse(raw);


        if (
            !saved ||
            !validCents(saved.goalCents) ||
            saved.goalCents === 0 ||
            !validCents(saved.availableCents) ||
            !parseLocalDate(saved.startDate) ||
            !parseLocalDate(saved.endDate)
        ) {

            return;

        }


        const history = {};


        for (const [date, item] of Object.entries(saved.history || {})) {

            if (
                !parseLocalDate(date) ||
                !validCents(item?.realizedCents)
            ) {

                continue;

            }


            const target =
                validCents(item.targetCents)
                    ? item.targetCents
                    : 0;


            history[date] = {

                realizedCents: item.realizedCents,

                targetCents: target,

                differenceCents:
                    item.realizedCents - target

            };

        }


        const movements = Array.isArray(saved.movements)
            ? saved.movements.filter(item =>

                item &&
                validCents(item.amountCents) &&
                item.amountCents > 0 &&
                parseLocalDate(item.dateISO) &&
                !Number.isNaN(Date.parse(item.createdAt))

            ).map(item => ({

                id: String(item.id || ""),

                amountCents: item.amountCents,

                note: String(item.note || "").slice(0, 250),

                dateISO: item.dateISO,

                createdAt: item.createdAt

            }))
            : [];


        plan = {

            name: String(saved.name || ""),

            goalCents: saved.goalCents,

            availableCents: saved.availableCents,

            startDate: saved.startDate,

            endDate: saved.endDate,

            history,

            movements

        };


        restorePlanFields();

    } catch (error) {

        console.error(
            "Não foi possível carregar os dados:",
            error
        );

        showError("Não foi possível recuperar os dados salvos.");

    }

}


/* 11. EVENTOS E ATUALIZAÇÃO DA DATA */

// Configuração dos campos financeiros.

configureMoneyInput(valorMeta, updateAutomaticCalculation);

configureMoneyInput(valorDisponivel, updateAutomaticCalculation);

configureMoneyInput(realizedToday);

configureMoneyInput(movementAmount);


nomeMeta.addEventListener(
    "input",
    updateAutomaticCalculation
);


metaForm.addEventListener("submit", event => {

    event.preventDefault();

    if (!validatePlan(true)) return;

    updateAutomaticCalculation();

});


/* 12. LIMPAR FORMULÁRIO */

clearButton.addEventListener("click", () => {

    const confirmed = confirm(
        "Deseja apagar o planejamento, o histórico diário e todas as movimentações?"
    );

    if (!confirmed) return;


    try {

        localStorage.removeItem(STORAGE_KEY);

    } catch (error) {

        console.error(error);

        showError(
            "Não foi possível limpar os dados salvos."
        );

        return;

    }


    plan = null;

    startDate = null;

    endDate = null;

    currentDate = firstDayOfMonth(getToday());


    metaForm.reset();

    realizedToday.value = "";

    movementAmount.value = "";

    movementNote.value = "";


    updateMonthInput();

    updateDateSummary();

    renderCalendar();

    clearError();

    setMovementStatus("");


    trackingTitle.textContent =
        "Acompanhamento diário";

    todayLabel.textContent =
        formatDate(getToday());

    todayTarget.textContent = "R$ 0,00";

    todayRealized.textContent = "R$ 0,00";

    remainingBalance.textContent = "R$ 0,00";

    remainingDays.textContent = "0";

    dailyResult.textContent = "R$ 0,00";


    resultDescription.textContent =
        "O valor diário será calculado após preencher seu planejamento.";


    progressFill.style.width = "0%";

    progressBar.setAttribute("aria-valuenow", "0");

    progressText.textContent = "0%";


    progressDescription.textContent =
        "O progresso será atualizado conforme seus resultados.";


    dailyStatus.textContent =
        "Crie uma meta para começar.";

    dailyStatus.className = "daily-status neutral";

    saveDailyButton.disabled = true;


    renderHistory();

    renderMovementHistory();

    updateMovementTimestamp();

});


/* 13. ATUALIZAÇÃO AUTOMÁTICA À MEIA-NOITE */

function scheduleMidnightRefresh() {

    clearTimeout(midnightTimer);

    const now = new Date();

    const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1
    );

    midnightTimer = setTimeout(
        refreshForNewDay,
        midnight - now
    );

}


function refreshForNewDay() {

    const today = getToday();

    if (currentDate < firstDayOfMonth(today)) {

        currentDate = firstDayOfMonth(today);

    }


    updateMonthInput();

    renderCalendar();

    updateMovementTimestamp();

    todayLabel.textContent = formatDate(today);


    if (plan) {

        updateDashboard();

    }


    scheduleMidnightRefresh();

}


document.addEventListener(
    "visibilitychange",
    () => {

        if (!document.hidden) {

            refreshForNewDay();

        }

    }
);


window.addEventListener(
    "focus",
    refreshForNewDay
);


/* 14. INICIALIZAÇÃO */

function initializeApp() {

    updateMonthInput();

    updateDateSummary();

    renderCalendar();

    dailyResult.textContent = "R$ 0,00";

    clearError();

    loadSavedData();

    refreshForNewDay();


    if (!plan) {

        saveDailyButton.disabled = true;

        renderMovementHistory();

    }

}


initializeApp();