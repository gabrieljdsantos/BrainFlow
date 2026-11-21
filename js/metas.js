/* ========================================
   DRIVECONTROL - METAS FINANCEIRAS
   Planejamento, calendário e acompanhamento
======================================== */

/* 1. ELEMENTOS */

const metaForm = document.getElementById("metaForm");

const categoriaMeta = document.getElementById("categoriaMeta");
const categoriaPersonalizadaGroup = document.getElementById("categoriaPersonalizadaGroup");
const categoriaPersonalizada = document.getElementById("categoriaPersonalizada");

const nomeMeta = document.getElementById("nomeMeta");
const valorMeta = document.getElementById("valorMeta");
const valorDisponivel = document.getElementById("valorDisponivel");

const mesInicio = document.getElementById("mesInicio");
const mesFim = document.getElementById("mesFim");
const periodDuration = document.getElementById("periodDuration");

const workdayRadios = document.querySelectorAll('input[name="workdayMode"]');
const customDaysPanel = document.getElementById("customDaysPanel");
const activeDaysCount = document.getElementById("activeDaysCount");
const offDaysCount = document.getElementById("offDaysCount");

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

let workdayMode = "all";
let offDays = [];


function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}


function firstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
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


function parseMonth(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
        return null;
    }

    const [year, month] = value.split("-").map(Number);

    if (month < 1 || month > 12) return null;

    return new Date(year, month - 1, 1);
}


function formatDate(date) {
    return date ? date.toLocaleDateString("pt-BR") : "--/--/----";
}


function sameDate(a, b) {
    return dateToISO(a) === dateToISO(b);
}


function calculateDays(start, end) {
    if (!start || !end || end < start) return 0;

    const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

    return Math.round((b - a) / 86400000) + 1;
}


function formatMoney(cents) {
    return currencyFormatter.format(cents / 100);
}


function validCents(value) {
    return Number.isSafeInteger(value) && value >= 0;
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
    movementStatus.className = `movement-status${type ? ` ${type}` : ""}`;
}


/* 3. CATEGORIA DO OBJETIVO */

function updateCategoryField() {

    const isCustom = categoriaMeta.value === "Outros";

    categoriaPersonalizadaGroup.hidden = !isCustom;

    categoriaPersonalizada.required = isCustom;

    if (!isCustom) {
        categoriaPersonalizada.value = "";
    }

}


function getCategoryData() {

    return {
        category: categoriaMeta.value,
        customCategory: categoriaMeta.value === "Outros"
            ? categoriaPersonalizada.value.trim()
            : ""
    };

}


categoriaMeta.addEventListener("change", () => {
    updateCategoryField();
    updateAutomaticCalculation();
});


categoriaPersonalizada.addEventListener("input", updateAutomaticCalculation);


/* 4. PERÍODO DE PLANEJAMENTO */

function getSelectedMonthRange() {

    const first = parseMonth(mesInicio.value);
    const last = parseMonth(mesFim.value);

    if (!first || !last || last < first) {
        return null;
    }

    return { first, last };
}


function getMinimumMonth() {
    return firstDayOfMonth(getToday());
}


function updatePeriodDuration() {

    const range = getSelectedMonthRange();

    if (!range) {
        periodDuration.textContent =
            "Selecione um mês inicial e um mês final válidos.";
        return;
    }

    const months =
        (range.last.getFullYear() - range.first.getFullYear()) * 12 +
        range.last.getMonth() - range.first.getMonth() + 1;

    periodDuration.textContent =
        `Seu planejamento terá ${months} ${months === 1 ? "mês" : "meses"}.`;
}


function updateMonthLimits() {

    const minimum = dateToMonthValue(getMinimumMonth());

    mesInicio.min = minimum;
    mesFim.min = mesInicio.value || minimum;

    if (mesInicio.value) {
        mesFim.min = mesInicio.value;
    }

    if (mesFim.value) {
        mesInicio.max = mesFim.value;
    } else {
        mesInicio.removeAttribute("max");
    }
}


function dateToMonthValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}


function getMonthRangeDates() {

    const range = getSelectedMonthRange();

    if (!range) return null;

    const first = range.first < getMinimumMonth()
        ? getMinimumMonth()
        : range.first;

    const last = new Date(
        range.last.getFullYear(),
        range.last.getMonth() + 1,
        0
    );

    return {
        first,
        last
    };
}


function resetDateSelection() {

    startDate = null;
    endDate = null;
    offDays = [];

    const range = getMonthRangeDates();

    currentDate = range
        ? new Date(range.first)
        : firstDayOfMonth(getToday());

    updateDateSummary();
    renderCalendar();
    updateWorkdaySummary();
    updateAutomaticCalculation();
}


mesInicio.addEventListener("change", () => {

    const minimum = dateToMonthValue(getMinimumMonth());

    if (mesInicio.value < minimum) {
        mesInicio.value = minimum;
    }

    if (mesFim.value && mesFim.value < mesInicio.value) {
        mesFim.value = mesInicio.value;
    }

    updateMonthLimits();
    updatePeriodDuration();
    resetDateSelection();
});


mesFim.addEventListener("change", () => {

    if (mesInicio.value && mesFim.value < mesInicio.value) {
        mesFim.value = mesInicio.value;
    }

    updateMonthLimits();
    updatePeriodDuration();
    resetDateSelection();
});


/* 5. CONFIGURAÇÃO DOS DIAS ATIVOS */

function getWorkdayMode() {
    return document.querySelector('input[name="workdayMode"]:checked')?.value || "all";
}


function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
}


function isOffDay(date) {

    const iso = typeof date === "string"
        ? date
        : dateToISO(date);

    if (workdayMode === "weekdays") {
        return isWeekend(parseLocalDate(iso));
    }

    if (workdayMode === "custom") {
        return offDays.includes(iso);
    }

    return false;
}


function isActiveDay(date) {
    return !isOffDay(date);
}


function countActiveDays(start, end) {

    if (!start || !end || end < start) return 0;

    let count = 0;

    const current = new Date(start);

    while (current <= end) {

        if (isActiveDay(current)) {
            count++;
        }

        current.setDate(current.getDate() + 1);
    }

    return count;
}


function countOffDays(start, end) {

    if (!start || !end || end < start) return 0;

    return calculateDays(start, end) - countActiveDays(start, end);
}


function updateWorkdaySummary() {

    const custom = workdayMode === "custom";

    customDaysPanel.hidden = !custom;

    if (!startDate || !endDate) {
        activeDaysCount.textContent = "0";
        offDaysCount.textContent = "0";
        return;
    }

    activeDaysCount.textContent =
        String(countActiveDays(startDate, endDate));

    offDaysCount.textContent =
        String(countOffDays(startDate, endDate));
}


workdayRadios.forEach(radio => {

    radio.addEventListener("change", () => {

        workdayMode = getWorkdayMode();

        if (workdayMode === "weekdays") {
            offDays = [];
        }

        if (workdayMode === "all") {
            offDays = [];
        }

        updateWorkdaySummary();
        renderCalendar();
        updateAutomaticCalculation();
    });

});


/* 6. CALENDÁRIO */

function updateCalendarTitle() {

    calendarTitle.textContent =
        currentDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });
}


function updateNavigationButtons() {

    const range = getMonthRangeDates();

    if (!range) {
        prevMonthButton.disabled = true;
        nextMonthButton.disabled = true;
        return;
    }

    const firstMonth = firstDayOfMonth(range.first);
    const lastMonth = firstDayOfMonth(range.last);

    prevMonthButton.disabled = currentDate <= firstMonth;
    nextMonthButton.disabled = currentDate >= lastMonth;
}


function renderCalendar() {

    calendarDays.replaceChildren();

    updateCalendarTitle();
    updateNavigationButtons();

    const range = getMonthRangeDates();

    if (!range) {
        calendarTitle.textContent = "Selecione o período";
        return;
    }

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
        const iso = dateToISO(date);

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = String(day);
        button.className = "calendar-day";

        button.setAttribute("aria-label", formatDate(date));


        const insideRange =
            date >= range.first &&
            date <= range.last;


        if (!insideRange || date < today) {

            button.classList.add("disabled");
            button.disabled = true;

        }


        if (sameDate(date, today)) {
            button.classList.add("today");
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


        if (
            startDate &&
            endDate &&
            date >= startDate &&
            date <= endDate &&
            isOffDay(date)
        ) {
            button.classList.add("off-day");
            button.setAttribute("aria-label", `${formatDate(date)} - dia sem depósito`);
        }


        if (
            startDate &&
            endDate &&
            date >= startDate &&
            date <= endDate &&
            isActiveDay(date) &&
            workdayMode === "custom"
        ) {
            button.classList.add("active-day");
        }


        if (insideRange && date >= today) {
            button.addEventListener("click", () => selectDate(date));
        }


        calendarDays.appendChild(button);
    }

}


function selectDate(date) {

    clearError();

    const range = getMonthRangeDates();

    if (!range || date < range.first || date > range.last) {
        return;
    }


    if (!startDate || endDate) {

        startDate = new Date(date);
        endDate = null;
        offDays = [];

    } else if (date < startDate) {

        startDate = new Date(date);
        endDate = null;
        offDays = [];

    } else {

        endDate = new Date(date);

    }


    updateDateSummary();
    updateWorkdaySummary();
    renderCalendar();
    updateAutomaticCalculation();
}


function changeMonth(direction) {

    const next = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1
    );

    const range = getMonthRangeDates();

    if (!range) return;

    const firstMonth = firstDayOfMonth(range.first);
    const lastMonth = firstDayOfMonth(range.last);

    if (next < firstMonth || next > lastMonth) {
        return;
    }

    currentDate = next;

    renderCalendar();
}


prevMonthButton.addEventListener("click", () => changeMonth(-1));
nextMonthButton.addEventListener("click", () => changeMonth(1));


function updateDateSummary() {

    startDateElement.textContent = formatDate(startDate);
    endDateElement.textContent = formatDate(endDate);


    if (!startDate) {

        selectionMessage.textContent =
            "Selecione a data inicial no calendário.";

    } else if (!endDate) {

        selectionMessage.textContent =
            "Agora selecione a data final do seu planejamento.";

    } else {

        const totalDays = calculateDays(startDate, endDate);
        const activeDays = countActiveDays(startDate, endDate);

        selectionMessage.textContent =
            `Seu planejamento terá ${totalDays} dias corridos e ${activeDays} dias ativos.`;
    }

}


/* PERSONALIZAÇÃO DE FOLGAS */

function toggleOffDay(date) {

    if (
        !startDate ||
        !endDate ||
        date < startDate ||
        date > endDate ||
        date < getToday()
    ) {
        return;
    }

    const iso = dateToISO(date);

    if (offDays.includes(iso)) {
        offDays = offDays.filter(item => item !== iso);
    } else {
        offDays.push(iso);
    }

    offDays.sort();

    updateWorkdaySummary();
    renderCalendar();
    updateDateSummary();
    updateAutomaticCalculation();
}


/* 7. PLANEJAMENTO E PERSISTÊNCIA */

function getPlanInputs() {

    const category = getCategoryData();

    return {

        name: nomeMeta.value.trim(),

        category: category.category,

        customCategory: category.customCategory,

        goalCents: readMoney(valorMeta),

        availableCents: readMoney(valorDisponivel),

        workdayMode,

        offDays: [...offDays]

    };

}


function validatePlan(showMessages = false) {

    const data = getPlanInputs();

    let message = "";

    const monthRange = getSelectedMonthRange();


    if (!data.category) {

        message = "Selecione uma categoria para seu objetivo.";

    } else if (
        data.category === "Outros" &&
        !data.customCategory
    ) {

        message = "Informe sua categoria personalizada.";

    } else if (!data.name) {

        message = "Dê um nome ao seu objetivo.";

    } else if (
        !validCents(data.goalCents) ||
        data.goalCents === 0
    ) {

        message = "Informe um valor válido para sua meta.";

    } else if (!validCents(data.availableCents)) {

        message = "Informe um valor disponível válido.";

    } else if (data.availableCents > data.goalCents) {

        message = "O valor disponível não pode superar a meta total.";

    } else if (!monthRange) {

        message = "Selecione um período de planejamento válido.";

    } else if (!startDate || !endDate) {

        message = "Selecione a data inicial e a data final.";

    } else if (endDate < startDate) {

        message = "A data final deve ser posterior à data inicial.";

    } else if (
        startDate < monthRange.first ||
        endDate > monthRange.last
    ) {

        message = "As datas precisam estar dentro dos meses selecionados.";

    } else if (countActiveDays(startDate, endDate) === 0) {

        message = "Seu planejamento precisa ter pelo menos um dia ativo.";

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

    nomeMeta.value = plan.name || "";

    valorMeta.value = formatMoney(plan.goalCents);

    valorDisponivel.value =
        plan.availableCents
            ? formatMoney(plan.availableCents)
            : "";


    categoriaMeta.value =
        ["Veículo", "Casa", "Viagem", "Educação", "Reserva financeira", "Outros"]
            .includes(plan.category)
            ? plan.category
            : "Outros";


    categoriaPersonalizada.value =
        plan.customCategory || "Meta anterior";


    updateCategoryField();


    workdayMode =
        ["all", "weekdays", "custom"].includes(plan.workdayMode)
            ? plan.workdayMode
            : "all";


    offDays = Array.isArray(plan.offDays)
        ? plan.offDays.filter(value => parseLocalDate(value))
        : [];


    workdayRadios.forEach(radio => {
        radio.checked = radio.value === workdayMode;
    });


    startDate = parseLocalDate(plan.startDate);
    endDate = parseLocalDate(plan.endDate);


    if (startDate && endDate) {

        mesInicio.value = dateToMonthValue(startDate);
        mesFim.value = dateToMonthValue(endDate);

        currentDate = firstDayOfMonth(startDate);

    }


    updateMonthLimits();
    updatePeriodDuration();
    updateDateSummary();
    updateWorkdaySummary();
    renderCalendar();
    updateDashboard();
}


/* 8. CÁLCULOS FINANCEIROS */

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

        daysLeft = countActiveDays(planStart, planEnd);

    } else if (today <= planEnd) {

        daysLeft = countActiveDays(today, planEnd);

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
        progress,
        todayIsActive: isActiveDay(today)

    };

}


/* 9. ATUALIZAÇÃO DO PAINEL */

function updateDashboard() {

    if (!plan) return;

    const m = getPlanMetrics();

    trackingTitle.textContent =
        `Acompanhamento: ${plan.name}`;

    todayLabel.textContent = formatDate(m.today);


    todayTarget.textContent =
        m.today >= m.planStart &&
        m.today <= m.planEnd &&
        m.todayIsActive
            ? formatMoney(m.dailyTarget)
            : "R$ 0,00";


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
            `Faltam ${formatMoney(m.balanceAfterToday)}. Sua meta diária prevista para o início do período é ${formatMoney(m.dailyTarget)}, considerando ${m.daysLeft} dias ativos.`;

    } else if (m.today > m.planEnd) {

        resultDescription.textContent =
            `O período terminou. Saldo restante: ${formatMoney(m.balanceAfterToday)}.`;

    } else if (!m.todayIsActive) {

        resultDescription.textContent =
            `Hoje é um dia de folga sem depósito. Restam ${m.daysLeft} dias ativos no planejamento.`;

    } else {

        resultDescription.textContent =
            `Faltam ${formatMoney(m.balanceAfterToday)} para alcançar "${plan.name}". Restam ${m.daysLeft} dias ativos, incluindo hoje.`;

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
        m.today < m.planStart ||
        m.today > m.planEnd ||
        !m.todayIsActive;


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


    if (!m.todayIsActive) {

        dailyStatus.textContent =
            "Hoje está marcado como dia de folga sem depósito. O registro diário está desativado.";

        dailyStatus.className = "daily-status neutral";
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


/* 10. RESULTADO DIÁRIO */

function saveDailyResult() {

    if (!plan) {

        showError("Crie um planejamento antes de registrar resultados.");
        return;

    }

    const m = getPlanMetrics();

    if (m.today < m.planStart || m.today > m.planEnd) {
        return;
    }


    if (!m.todayIsActive) {

        dailyStatus.textContent =
            "Este dia está marcado como folga sem depósito.";

        dailyStatus.className = "daily-status neutral";
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

        dailyStatus.textContent = "Informe um valor válido.";
        dailyStatus.className = "daily-status negative";
        return;

    }


    const old = plan.history[m.todayISO];

    const total = (old?.realizedCents || 0) + amount;

    if (!Number.isSafeInteger(total)) return;


    const target = old?.targetCents ?? m.dailyTarget;


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


/* 11. MOVIMENTAÇÕES FINANCEIRAS */

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
        title.textContent = entry.note || "Movimentação financeira";

        const timestamp = document.createElement("span");
        timestamp.className = "movement-item-meta";
        timestamp.textContent =
            dateTimeFormatter.format(new Date(entry.createdAt));

        const amount = document.createElement("span");
        amount.className = "movement-item-value";
        amount.textContent = `+${formatMoney(entry.amountCents)}`;

        info.append(title, timestamp);
        item.append(info, amount);

        movementHistoryList.appendChild(item);

    }

}


/* 12. HISTÓRICO DIÁRIO */

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
        dateLabel.textContent = formatDate(parseLocalDate(date));

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


/* 13. RECUPERAÇÃO DOS DADOS */

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

            category: String(saved.category || "Outros"),

            customCategory: String(saved.customCategory || ""),

            goalCents: saved.goalCents,

            availableCents: saved.availableCents,

            startDate: saved.startDate,

            endDate: saved.endDate,

            workdayMode:
                ["all", "weekdays", "custom"].includes(saved.workdayMode)
                    ? saved.workdayMode
                    : "all",

            offDays: Array.isArray(saved.offDays)
                ? saved.offDays.filter(value => parseLocalDate(value))
                : [],

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


/* 14. EVENTOS E ATUALIZAÇÃO */

configureMoneyInput(valorMeta, updateAutomaticCalculation);
configureMoneyInput(valorDisponivel, updateAutomaticCalculation);
configureMoneyInput(realizedToday);
configureMoneyInput(movementAmount);


nomeMeta.addEventListener("input", updateAutomaticCalculation);


metaForm.addEventListener("submit", event => {

    event.preventDefault();

    if (!validatePlan(true)) return;

    updateAutomaticCalculation();

});


/* 15. LIMPAR FORMULÁRIO */

clearButton.addEventListener("click", () => {

    const confirmed = confirm(
        "Deseja apagar o planejamento, o histórico diário e todas as movimentações?"
    );

    if (!confirmed) return;


    try {

        localStorage.removeItem(STORAGE_KEY);

    } catch (error) {

        console.error(error);

        showError("Não foi possível limpar os dados salvos.");

        return;

    }


    plan = null;

    startDate = null;
    endDate = null;
    offDays = [];

    workdayMode = "all";

    currentDate = firstDayOfMonth(getToday());


    metaForm.reset();

    realizedToday.value = "";
    movementAmount.value = "";
    movementNote.value = "";

    categoriaPersonalizada.value = "";

    updateCategoryField();

    workdayRadios.forEach(radio => {
        radio.checked = radio.value === "all";
    });


    mesInicio.value = dateToMonthValue(getMinimumMonth());
    mesFim.value = "";

    updateMonthLimits();
    updatePeriodDuration();

    updateDateSummary();
    updateWorkdaySummary();

    renderCalendar();

    clearError();

    setMovementStatus("");


    trackingTitle.textContent = "Acompanhamento diário";

    todayLabel.textContent = formatDate(getToday());

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

    dailyStatus.textContent = "Crie uma meta para começar.";
    dailyStatus.className = "daily-status neutral";

    saveDailyButton.disabled = true;


    renderHistory();
    renderMovementHistory();

    updateMovementTimestamp();

});


/* 16. ATUALIZAÇÃO AUTOMÁTICA À MEIA-NOITE */

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

    const range = getMonthRangeDates();

    if (!range) {
        currentDate = firstDayOfMonth(today);
    } else if (currentDate < firstDayOfMonth(range.first)) {
        currentDate = firstDayOfMonth(range.first);
    }


    renderCalendar();
    updateMovementTimestamp();

    todayLabel.textContent = formatDate(today);


    if (plan) {
        updateDashboard();
    }


    scheduleMidnightRefresh();

}


document.addEventListener("visibilitychange", () => {

    if (!document.hidden) {
        refreshForNewDay();
    }

});


window.addEventListener("focus", refreshForNewDay);


/* 17. INICIALIZAÇÃO */

function initializeApp() {

    const minimum = dateToMonthValue(getMinimumMonth());

    if (!mesInicio.value) {
        mesInicio.value = minimum;
    }

    updateMonthLimits();
    updatePeriodDuration();

    workdayMode = getWorkdayMode();

    updateCategoryField();

    updateDateSummary();
    updateWorkdaySummary();

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