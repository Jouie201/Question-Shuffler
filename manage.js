"use strict";

var STORAGE_KEY = "az400-question-bank";
var DRAG_DROP_STORAGE_KEY = "az400-drag-drop-question-bank";
var LEVEL3_STORAGE_KEY = "az400-level3-question-bank";
var LEVEL4_STORAGE_KEY = "az400-level4-question-bank";

// ── Bank loaders ──────────────────────────────────────────

function safeParseArray(key) {
  try {
    var raw = window.localStorage.getItem(key);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function loadAllBanks() {
  return {
    level1: safeParseArray(STORAGE_KEY).filter(function (q) {
      return q && typeof q.prompt === "string" && Array.isArray(q.choices) && Array.isArray(q.correctIndices);
    }),
    level2: safeParseArray(DRAG_DROP_STORAGE_KEY).filter(function (q) {
      return q && typeof q.prompt === "string" && Array.isArray(q.options) && Array.isArray(q.correctMatches);
    }),
    level3: safeParseArray(LEVEL3_STORAGE_KEY).filter(function (q) {
      return q && typeof q.prompt === "string" && Array.isArray(q.blanks) && q.blanks.length >= 1;
    }),
    level4: safeParseArray(LEVEL4_STORAGE_KEY).filter(function (q) {
      return q && typeof q.prompt === "string" && (q.correctIndex === 0 || q.correctIndex === 1);
    })
  };
}

// ── Persistence ───────────────────────────────────────────

function saveBank(key, bank) {
  window.localStorage.setItem(key, JSON.stringify(bank));
}

// ── Rendering ─────────────────────────────────────────────

var manageList = document.getElementById("manageList");
var activeFilter = "all";

function renderBanks() {
  var banks = loadAllBanks();
  manageList.innerHTML = "";

  var anyQuestion = banks.level1.length + banks.level2.length + banks.level3.length + banks.level4.length > 0;

  if (!anyQuestion) {
    var empty = document.createElement("div");
    empty.className = "empty-bank-state";
    empty.textContent = "No saved questions in the bank yet.";
    manageList.appendChild(empty);
    return;
  }

  var showed = 0;

  if (activeFilter === "all" || activeFilter === "level1") {
    if (banks.level1.length) { appendGroup("Level 1: Multiple Choice", banks.level1, "multiple-choice"); showed++; }
  }
  if (activeFilter === "all" || activeFilter === "level2") {
    if (banks.level2.length) { appendGroup("Level 2: Drag and Drop", banks.level2, "drag-drop"); showed++; }
  }
  if (activeFilter === "all" || activeFilter === "level3") {
    if (banks.level3.length) { appendGroup("Level 3: Dropdown", banks.level3, "dropdown"); showed++; }
  }
  if (activeFilter === "all" || activeFilter === "level4") {
    if (banks.level4.length) { appendGroup("Level 4: Yes or No", banks.level4, "yes-no"); showed++; }
  }

  if (showed === 0) {
    var noItems = document.createElement("div");
    noItems.className = "empty-bank-state";
    noItems.textContent = "No saved questions for this level yet.";
    manageList.appendChild(noItems);
  }
}

function appendGroup(title, questions, type) {
  if (questions.length === 0) return;

  var group = document.createElement("section");
  group.className = "saved-question-group";

  var heading = document.createElement("h3");
  heading.className = "saved-group-title";
  heading.textContent = title;
  group.appendChild(heading);

  questions.forEach(function (question, index) {
    group.appendChild(createItem(question, index, type));
  });

  manageList.appendChild(group);
}

function createItem(question, index, type) {
  var item = document.createElement("article");
  item.className = "saved-question-item";

  var copy = document.createElement("div");
  copy.className = "saved-question-copy";

  var header = document.createElement("div");
  header.className = "saved-question-header";

  var badge = document.createElement("span");
  badge.className = "saved-question-type";
  badge.textContent = type === "multiple-choice" ? "Level 1"
    : type === "drag-drop" ? "Level 2"
    : type === "dropdown" ? "Level 3"
    : "Level 4";

  var label = document.createElement("p");
  label.className = "saved-question-label";
  label.textContent = "Question " + (index + 1);

  var text = document.createElement("p");
  text.className = "saved-question-text";
  text.textContent = question.prompt;

  header.append(badge, label);
  copy.append(header, text);

  var deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-button";
  deleteBtn.type = "button";
  deleteBtn.dataset.index = String(index);
  deleteBtn.dataset.type = type;
  deleteBtn.textContent = "Delete";

  if (type === "drag-drop" || type === "dropdown" || type === "multiple-choice" || type === "yes-no") {
    var editBtn = document.createElement("button");
    editBtn.className = "edit-button";
    editBtn.type = "button";
    editBtn.dataset.index = String(index);
    editBtn.dataset.type = type;
    editBtn.textContent = "Edit";
    item.append(copy, editBtn, deleteBtn);
  } else {
    item.append(copy, deleteBtn);
  }

  return item;
}

// ── Action handlers ───────────────────────────────────────

function handleClick(event) {
  var editBtn = event.target.closest(".edit-button");
  if (editBtn) {
    window.sessionStorage.setItem(
      "az400-edit-target",
      JSON.stringify({ type: editBtn.dataset.type, index: Number(editBtn.dataset.index) })
    );
    window.location.href = "edit.html";
    return;
  }

  var deleteBtn = event.target.closest(".delete-button");
  if (!deleteBtn) return;

  var type = deleteBtn.dataset.type;
  var index = Number(deleteBtn.dataset.index);

  var keyMap = {
    "multiple-choice": STORAGE_KEY,
    "drag-drop": DRAG_DROP_STORAGE_KEY,
    "dropdown": LEVEL3_STORAGE_KEY,
    "yes-no": LEVEL4_STORAGE_KEY
  };

  var key = keyMap[type];
  if (!key) return;

  var bank = safeParseArray(key);
  if (index < 0 || index >= bank.length) return;

  bank.splice(index, 1);
  saveBank(key, bank);
  renderBanks();
}

manageList.addEventListener("click", handleClick);

// ── Level filter buttons ──────────────────────────────────

document.querySelectorAll(".manage-filter-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".manage-filter-btn").forEach(function (b) {
      b.classList.remove("is-active");
    });
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter;
    renderBanks();
  });
});

renderBanks();

// ── Export ────────────────────────────────────────────────

document.getElementById("exportQuestionsBtn").addEventListener("click", function () {
  var banks = loadAllBanks();
  var payload = {
    version: 1,
    level1: banks.level1,
    level2: banks.level2,
    level3: banks.level3,
    level4: banks.level4
  };
  var json = JSON.stringify(payload, null, 2);
  var blob = new Blob([json], { type: "application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "az400-questions-backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

// ── Import ────────────────────────────────────────────────

var importFileInput = document.getElementById("importFileInput");
var importNotice = document.getElementById("importNotice");

function showImportNotice(msg, isError) {
  importNotice.textContent = msg;
  importNotice.className = "import-notice" + (isError ? " import-notice--error" : " import-notice--ok");
  setTimeout(function () {
    importNotice.className = "import-notice is-hidden";
  }, 4000);
}

document.getElementById("importQuestionsBtn").addEventListener("click", function () {
  importFileInput.value = "";
  importFileInput.click();
});

importFileInput.addEventListener("change", function () {
  var file = importFileInput.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object") throw new Error("Invalid file");

      var imported = { level1: 0, level2: 0, level3: 0, level4: 0 };

      if (Array.isArray(data.level1) && data.level1.length) {
        var existing1 = safeParseArray(STORAGE_KEY);
        var merged1 = existing1.concat(data.level1.filter(function (q) {
          return q && typeof q.prompt === "string" && Array.isArray(q.choices) && Array.isArray(q.correctIndices);
        }));
        saveBank(STORAGE_KEY, merged1);
        imported.level1 = data.level1.length;
      }

      if (Array.isArray(data.level2) && data.level2.length) {
        var existing2 = safeParseArray(DRAG_DROP_STORAGE_KEY);
        var merged2 = existing2.concat(data.level2.filter(function (q) {
          return q && typeof q.prompt === "string" && Array.isArray(q.options) && Array.isArray(q.correctMatches);
        }));
        saveBank(DRAG_DROP_STORAGE_KEY, merged2);
        imported.level2 = data.level2.length;
      }

      if (Array.isArray(data.level3) && data.level3.length) {
        var existing3 = safeParseArray(LEVEL3_STORAGE_KEY);
        var merged3 = existing3.concat(data.level3.filter(function (q) {
          return q && typeof q.prompt === "string" && Array.isArray(q.blanks);
        }));
        saveBank(LEVEL3_STORAGE_KEY, merged3);
        imported.level3 = data.level3.length;
      }

      if (Array.isArray(data.level4) && data.level4.length) {
        var existing4 = safeParseArray(LEVEL4_STORAGE_KEY);
        var merged4 = existing4.concat(data.level4.filter(function (q) {
          return q && typeof q.prompt === "string" && (q.correctIndex === 0 || q.correctIndex === 1);
        }));
        saveBank(LEVEL4_STORAGE_KEY, merged4);
        imported.level4 = data.level4.length;
      }

      var total = imported.level1 + imported.level2 + imported.level3 + imported.level4;
      if (total === 0) {
        showImportNotice("No valid questions found in the file.", true);
      } else {
        showImportNotice(
          "Imported \u2014 L1: +" + imported.level1 + "  L2: +" + imported.level2 +
          "  L3: +" + imported.level3 + "  L4: +" + imported.level4,
          false
        );
        renderBanks();
      }
    } catch (err) {
      showImportNotice("Could not read file. Make sure it is a valid exported JSON backup.", true);
    }
  };
  reader.readAsText(file);
});
