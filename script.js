// Datei: script.js
let currentNumber = null;
let isRunning = false;
let startTime = null;
let pausePopupShown = false;
let timerInterval = null;
const PAUSE_LIMIT = 2700; // Sekunden (45 Minuten)
let dailyTimes = {}; // Format: {"2023-03-12": Sekunden, ...}

// Elemente
const nummerEingabe       = document.getElementById("nummerEingabe");
const nummerDropdown      = document.getElementById("nummerDropdown");
const btnConfirm          = document.getElementById("btnConfirm");
const btnDelete           = document.getElementById("btnDelete");
const btnStart            = document.getElementById("btnStart");
const btnStop             = document.getElementById("btnStop");
const btnPlus             = document.getElementById("btnPlus");
const btnMinus            = document.getElementById("btnMinus");
const anzeige             = document.getElementById("anzeige");
const activeOrder         = document.getElementById("activeOrder");
const pauseModal          = document.getElementById("pauseModal");
const modalOk             = document.getElementById("modalOk");
const deleteModal         = document.getElementById("deleteModal");
const modalDeleteConfirm  = document.getElementById("modalDeleteConfirm");
const modalDeleteCancel   = document.getElementById("modalDeleteCancel");

// Lade vorhandene Nummern aus localStorage
function updateDropdown() {
    nummerDropdown.innerHTML = '<option value="">-- Auswählen --</option>';
    for (let key in localStorage) {
        if (key.startsWith("auftragszeit_")) {
            const nummer = key.replace("auftragszeit_", "");
            const option = document.createElement("option");
            option.value = nummer;
            option.textContent = nummer;
            nummerDropdown.appendChild(option);
        }
    }
}

// Lade Daten für aktuelle Nummer
function loadData() {
    const key = "auftragszeit_" + currentNumber;
    const data = localStorage.getItem(key);
    dailyTimes = data ? JSON.parse(data) : {};
    updateAnzeige();
}

// Speichere Daten im localStorage
function saveData() {
    const key = "auftragszeit_" + currentNumber;
    localStorage.setItem(key, JSON.stringify(dailyTimes));
    updateDropdown();
}

// Rundet auf halbe Stunde
function rundeAufHalbeStunde(stunden) {
    return Math.round(stunden * 2) / 2;
}

// Aktualisiere Anzeige
function updateAnzeige() {
    anzeige.textContent = "";
    const dates = Object.keys(dailyTimes).sort();
    let total = 0;
    dates.forEach(datum => {
        const sek = dailyTimes[datum];
        const std = sek / 3600;
        const gerundet = rundeAufHalbeStunde(std);
        total += gerundet;
        anzeige.textContent += `${datum}  ${gerundet} Stunden\n`;
    });
    anzeige.textContent += `\nTotal: ${total} Stunden`;
}

// Bestätigen
btnConfirm.addEventListener("click", () => {
    const input = nummerEingabe.value.trim();
    const select = nummerDropdown.value.trim();
    if (!input && !select) return;
    currentNumber = input || select;
    document.title = "Auftragszeit - " + currentNumber;
    nummerEingabe.disabled = nummerDropdown.disabled = btnConfirm.disabled = true;
    btnStart.disabled = btnDelete.disabled = btnPlus.disabled = btnMinus.disabled = false;
    activeOrder.textContent = "Aktiver Auftrag: " + currentNumber;
    loadData();
});

// Löschen
btnDelete.addEventListener("click", () => {
    deleteModal.style.display = "block";
});
modalDeleteConfirm.addEventListener("click", () => {
    localStorage.removeItem("auftragszeit_" + currentNumber);
    resetUI();
    deleteModal.style.display = "none";
});
modalDeleteCancel.addEventListener("click", () => {
    deleteModal.style.display = "none";
});
function resetUI() {
    currentNumber = null;
    dailyTimes = {};
    anzeige.textContent = "";
    activeOrder.textContent = "";
    nummerEingabe.disabled = nummerDropdown.disabled = btnConfirm.disabled = false;
    btnStart.disabled = btnStop.disabled = btnDelete.disabled = btnPlus.disabled = btnMinus.disabled = true;
    nummerEingabe.value = "";
    nummerDropdown.value = "";
    updateDropdown();
}

// Start / Stop
btnStart.addEventListener("click", () => {
    if (isRunning) return;
    startTime = new Date();
    isRunning = true;
    pausePopupShown = false;
    btnStart.disabled = true;
    btnStop.disabled = false;
    timerInterval = setInterval(checkPause, 1000);
});
btnStop.addEventListener("click", () => {
    if (!isRunning) return;
    clearInterval(timerInterval);
    const elapsed = (new Date() - startTime) / 1000;
    isRunning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    const datum = startTime.toISOString().split("T")[0];
    dailyTimes[datum] = (dailyTimes[datum] || 0) + elapsed;
    updateAnzeige();
    saveData();
});

// + / - 5 Minuten
btnPlus.addEventListener("click", () => adjustTime(+300));
btnMinus.addEventListener("click", () => adjustTime(-300));
function adjustTime(delta) {
    if (!currentNumber) return;
    const datum = new Date().toISOString().split("T")[0];
    dailyTimes[datum] = Math.max(0, (dailyTimes[datum] || 0) + delta);
    updateAnzeige();
    saveData();
}

// Pause-Check
function checkPause() {
    if (!isRunning) return;
    if ((new Date() - startTime) / 1000 >= PAUSE_LIMIT && !pausePopupShown) {
        pausePopupShown = true;
        pauseModal.style.display = "block";
    }
}
modalOk.addEventListener("click", () => {
    pauseModal.style.display = "none";
});

// Initial
updateDropdown();
