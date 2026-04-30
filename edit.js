"use strict";

var DRAG_DROP_STORAGE_KEY = "az400-drag-drop-question-bank";
var LEVEL3_STORAGE_KEY = "az400-level3-question-bank";

// ── Helpers ───────────────────────────────────────────────

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

function normalizeChoiceLine(line) {
  return line.trim().replace(/^([A-Z]|\d+)[\).:-]\s*/i, "").replace(/^[-*]\s*/, "");
}

function parseChoices(raw) {
  return raw.split(/\r?\n/).map(normalizeChoiceLine).filter(Boolean);
}

function normalizeMatchValue(v) {
  return v.trim().toLowerCase();
}

function findMatchingOption(options, rawValue) {
  var norm = normalizeMatchValue(rawValue);
  return options.find(function (o) { return normalizeMatchValue(o) === norm; }) || null;
}

function normalizeBlankLayout(v) {
  return v === "horizontal" ? "horizontal" : "vertical";
}

function buildBlankTargets(count) {
  return Array.from({ length: count }, function (_, i) { return "Blank " + (i + 1); });
}

function showNotice(el, msg) {
  el.textContent = msg;
  el.removeAttribute("hidden");
}

function clearNotice(el) {
  el.textContent = "";
  el.setAttribute("hidden", "");
}

// ── Read edit target from sessionStorage ──────────────────

var target = null;
try {
  var raw = window.sessionStorage.getItem("az400-edit-target");
  if (raw) target = JSON.parse(raw);
} catch (e) {
  target = null;
}

// ── DOM refs ──────────────────────────────────────────────

var editLevel2Section  = document.getElementById("editLevel2Section");
var editLevel3Section  = document.getElementById("editLevel3Section");
var editNoTarget       = document.getElementById("editNoTarget");
var editPageTitle      = document.getElementById("editPageTitle");

// Level 2
var editLevel2Form     = document.getElementById("editLevel2Form");
var editDragLayoutType = document.getElementById("editDragLayoutType");
var editDragBlankLayout = document.getElementById("editDragBlankLayout");
var editDragPrompt     = document.getElementById("editDragPrompt");
var editDragOptions    = document.getElementById("editDragOptions");
var editStandardFields = document.getElementById("editStandardFields");
var editMiddleFields   = document.getElementById("editMiddleFields");
var editDragAnswers    = document.getElementById("editDragAnswers");
var editDragMiddleAnswers = document.getElementById("editDragMiddleAnswers");
var editLeftLabel1     = document.getElementById("editLeftLabel1");
var editLeftLabel2     = document.getElementById("editLeftLabel2");
var editLeftLabel3     = document.getElementById("editLeftLabel3");
var editLeftLabel4     = document.getElementById("editLeftLabel4");
var editLeftLabel5     = document.getElementById("editLeftLabel5");
var editLevel2Notice   = document.getElementById("editLevel2Notice");

// Level 3
var editLevel3Form = document.getElementById("editLevel3Form");
var editSeg0       = document.getElementById("editSeg0");
var editSeg1       = document.getElementById("editSeg1");
var editSeg2       = document.getElementById("editSeg2");
var editSeg3       = document.getElementById("editSeg3");
var editChoices1   = document.getElementById("editChoices1");
var editAnswer1    = document.getElementById("editAnswer1");
var editChoices2   = document.getElementById("editChoices2");
var editAnswer2    = document.getElementById("editAnswer2");
var editChoices3   = document.getElementById("editChoices3");
var editAnswer3    = document.getElementById("editAnswer3");
var editLevel3Notice = document.getElementById("editLevel3Notice");

// ── Sync Level 2 layout variant ───────────────────────────

function syncLevel2Variant() {
  var isMiddle = editDragLayoutType.value === "middle";
  editStandardFields.classList.toggle("is-hidden", isMiddle);
  editMiddleFields.classList.toggle("is-hidden", !isMiddle);
  editDragAnswers.required = !isMiddle;
  editDragMiddleAnswers.required = isMiddle;
}

// ── Blank indicator click toggle (Edit form) ──────────────
function getEditCorrectCount() {
  var isMiddle = editDragLayoutType.value === "middle";
  return (isMiddle ? editDragMiddleAnswers : editDragAnswers)
    .value.split("\n").filter(function(l) { return l.trim(); }).length;
}

function updateEditIndicatorLimits() {
  var limit = getEditCorrectCount();
  var indicators = document.querySelectorAll("#editBlankLabelRows .blank-pos-indicator");
  var activeCount = 0;
  indicators.forEach(function(el) { if (el.classList.contains("is-active")) activeCount++; });
  if (activeCount > limit) {
    var toRemove = activeCount - limit;
    for (var i = indicators.length - 1; i >= 0 && toRemove > 0; i--) {
      if (indicators[i].classList.contains("is-active")) {
        indicators[i].classList.remove("is-active");
        toRemove--;
      }
    }
    activeCount = limit;
  }
  indicators.forEach(function(el) {
    var isActive = el.classList.contains("is-active");
    el.classList.toggle("is-at-limit", !isActive && activeCount >= limit && limit > 0);
  });
}

editDragAnswers.addEventListener("input", updateEditIndicatorLimits);
editDragMiddleAnswers.addEventListener("input", updateEditIndicatorLimits);
editDragLayoutType.addEventListener("change", updateEditIndicatorLimits);

document.getElementById("editBlankLabelRows").addEventListener("click", function(e) {
  var indicator = e.target.closest(".blank-pos-indicator");
  if (!indicator) return;
  var isActive = indicator.classList.contains("is-active");
  if (!isActive) {
    var limit = getEditCorrectCount();
    var currentActive = document.querySelectorAll("#editBlankLabelRows .blank-pos-indicator.is-active").length;
    if (limit === 0 || currentActive >= limit) return;
  }
  indicator.classList.toggle("is-active");
  updateEditIndicatorLimits();
});
document.getElementById("editBlankLabelRows").addEventListener("keydown", function(e) {
  if (e.key === "Enter" || e.key === " ") {
    var indicator = e.target.closest(".blank-pos-indicator");
    if (!indicator) return;
    e.preventDefault();
    var isActive = indicator.classList.contains("is-active");
    if (!isActive) {
      var limit = getEditCorrectCount();
      var currentActive = document.querySelectorAll("#editBlankLabelRows .blank-pos-indicator.is-active").length;
      if (limit === 0 || currentActive >= limit) return;
    }
    indicator.classList.toggle("is-active");
    updateEditIndicatorLimits();
  }
});

function restoreEditBlankIndicators(flags) {
  document.querySelectorAll("#editBlankLabelRows .blank-pos-indicator")
    .forEach(function(el, i) {
      el.classList.toggle("is-active", Array.isArray(flags) && flags[i] === true);
    });
}

// ── Show correct section ──────────────────────────────────

function showSection(type) {
  editLevel2Section.classList.add("is-edit-hidden");
  editLevel3Section.classList.add("is-edit-hidden");
  editNoTarget.classList.add("is-edit-hidden");

  if (type === "drag-drop") {
    editPageTitle.textContent = "Edit Level 2 Question";
    editLevel2Section.classList.remove("is-edit-hidden");
  } else if (type === "dropdown") {
    editPageTitle.textContent = "Edit Level 3 Question";
    editLevel3Section.classList.remove("is-edit-hidden");
  } else {
    editNoTarget.classList.remove("is-edit-hidden");
  }
}

// ── Pre-fill Level 2 form ─────────────────────────────────

function prefillLevel2(question) {
  editDragLayoutType.value = question.layoutType || "standard";
  editDragBlankLayout.value = normalizeBlankLayout(question.blankLayout);
  editDragPrompt.value = question.prompt || "";
  editDragOptions.value = Array.isArray(question.options) ? question.options.join("\n") : "";

  var isMiddle = question.layoutType === "middle";
  if (isMiddle) {
    editDragMiddleAnswers.value = Array.isArray(question.correctMatches)
      ? question.correctMatches.join("\n")
      : "";
  } else {
    editDragAnswers.value = Array.isArray(question.correctMatches)
      ? question.correctMatches.join("\n")
      : "";
  }

  var labels = Array.isArray(question.blankLeftLabels) ? question.blankLeftLabels : [];
  editLeftLabel1.value = labels[0] || "";
  editLeftLabel2.value = labels[1] || "";
  editLeftLabel3.value = labels[2] || "";
  editLeftLabel4.value = labels[3] || "";
  editLeftLabel5.value = labels[4] || "";

  syncLevel2Variant();
  restoreEditBlankIndicators(question.blankActiveFlags);
  updateEditIndicatorLimits();
}

// ── Pre-fill Level 3 form ─────────────────────────────────

function prefillLevel3(question) {
  var segs = question.segments || {};
  editSeg0.value = segs.seg0 || "";
  editSeg1.value = segs.seg1 || "";
  editSeg2.value = segs.seg2 || "";
  editSeg3.value = segs.seg3 || "";

  var blanks = Array.isArray(question.blanks) ? question.blanks : [];

  function fillBlank(choicesEl, answerEl, blank) {
    if (!blank) { choicesEl.value = ""; answerEl.value = ""; return; }
    choicesEl.value = Array.isArray(blank.choices) ? blank.choices.join("\n") : "";
    answerEl.value = Array.isArray(blank.choices) && typeof blank.correctIndex === "number"
      ? blank.choices[blank.correctIndex] || ""
      : "";
  }

  fillBlank(editChoices1, editAnswer1, blanks[0]);
  fillBlank(editChoices2, editAnswer2, blanks[1]);
  fillBlank(editChoices3, editAnswer3, blanks[2]);
}

// ── Init ──────────────────────────────────────────────────

function init() {
  if (!target || !target.type) {
    showSection(null);
    return;
  }

  showSection(target.type);

  if (target.type === "drag-drop") {
    var bank = safeParseArray(DRAG_DROP_STORAGE_KEY);
    var question = bank[target.index];
    if (!question) { showSection(null); return; }
    prefillLevel2(question);
  }

  if (target.type === "dropdown") {
    var bank3 = safeParseArray(LEVEL3_STORAGE_KEY);
    var question3 = bank3[target.index];
    if (!question3) { showSection(null); return; }
    prefillLevel3(question3);
  }
}

init();

// ── Save Level 2 ──────────────────────────────────────────

editLevel2Form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearNotice(editLevel2Notice);

  var layoutType = editDragLayoutType.value;
  var blankLayout = normalizeBlankLayout(editDragBlankLayout.value);
  var prompt = editDragPrompt.value.trim();
  var parsedOptions = parseChoices(editDragOptions.value);
  var rawAnswers = layoutType === "middle"
    ? editDragMiddleAnswers.value
    : editDragAnswers.value;
  var parsedCorrectMatches = parseChoices(rawAnswers);

  if (!prompt) {
    showNotice(editLevel2Notice, "Enter a question prompt before saving.");
    editDragPrompt.focus();
    return;
  }

  if (parsedOptions.length < 2) {
    showNotice(editLevel2Notice, "Add at least two draggable options.");
    editDragOptions.focus();
    return;
  }

  if (parsedCorrectMatches.length === 0) {
    showNotice(editLevel2Notice, "Add at least one correct match.");
    (layoutType === "middle" ? editDragMiddleAnswers : editDragAnswers).focus();
    return;
  }

  var matchedCorrectMatches = parsedCorrectMatches.map(function (v) {
    return findMatchingOption(parsedOptions, v);
  });

  if (matchedCorrectMatches.some(function (v) { return !v; })) {
    showNotice(editLevel2Notice, "Every correct match must exactly match one of the draggable options.");
    (layoutType === "middle" ? editDragMiddleAnswers : editDragAnswers).focus();
    return;
  }

  var rawLeftLabels = [
    editLeftLabel1.value.trim(),
    editLeftLabel2.value.trim(),
    editLeftLabel3.value.trim(),
    editLeftLabel4.value.trim(),
    editLeftLabel5.value.trim()
  ];
  var blankActiveFlags = Array.from(
    document.querySelectorAll("#editBlankLabelRows .blank-pos-indicator")
  ).map(function(el) { return el.classList.contains("is-active"); });

  var bank = safeParseArray(DRAG_DROP_STORAGE_KEY);
  var idx = target.index;

  if (idx < 0 || idx >= bank.length) {
    showNotice(editLevel2Notice, "Question not found in the bank. It may have been deleted.");
    return;
  }

  bank[idx] = {
    layoutType: layoutType,
    blankLayout: blankLayout,
    prompt: prompt,
    options: parsedOptions,
    targets: buildBlankTargets(matchedCorrectMatches.length),
    correctMatches: matchedCorrectMatches,
    blankLeftLabels: rawLeftLabels,
    blankActiveFlags: blankActiveFlags
  };

  window.localStorage.setItem(DRAG_DROP_STORAGE_KEY, JSON.stringify(bank));
  window.sessionStorage.removeItem("az400-edit-target");
  window.location.href = "manage.html";
});

// ── Save Level 3 ──────────────────────────────────────────

editLevel3Form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearNotice(editLevel3Notice);

  var seg0 = editSeg0.value.trim();
  var seg1 = editSeg1.value.trim();
  var seg2 = editSeg2.value.trim();
  var seg3 = editSeg3.value.trim();

  if (!seg0) {
    showNotice(editLevel3Notice, "Enter the question text before Blank 1.");
    editSeg0.focus();
    return;
  }

  var choices1 = parseChoices(editChoices1.value);
  var answer1Text = editAnswer1.value.trim();

  if (choices1.length < 2) {
    showNotice(editLevel3Notice, "Add at least two choices for Blank 1.");
    editChoices1.focus();
    return;
  }
  if (!answer1Text) {
    showNotice(editLevel3Notice, "Enter the correct answer text for Blank 1.");
    editAnswer1.focus();
    return;
  }

  var correct1Index = choices1.findIndex(function (c) {
    return c.trim().toLowerCase() === answer1Text.toLowerCase();
  });
  if (correct1Index === -1) {
    showNotice(editLevel3Notice, "\"" + answer1Text + "\" does not match any Blank 1 choice. Copy it exactly from the list above.");
    editAnswer1.focus();
    return;
  }

  var choices2 = parseChoices(editChoices2.value);
  var answer2Text = editAnswer2.value.trim();

  if (choices2.length < 2) {
    showNotice(editLevel3Notice, "Add at least two choices for Blank 2.");
    editChoices2.focus();
    return;
  }
  if (!answer2Text) {
    showNotice(editLevel3Notice, "Enter the correct answer text for Blank 2.");
    editAnswer2.focus();
    return;
  }

  var correct2Index = choices2.findIndex(function (c) {
    return c.trim().toLowerCase() === answer2Text.toLowerCase();
  });
  if (correct2Index === -1) {
    showNotice(editLevel3Notice, "\"" + answer2Text + "\" does not match any Blank 2 choice. Copy it exactly from the list above.");
    editAnswer2.focus();
    return;
  }

  var choices3Raw = editChoices3.value.trim();
  var choices3 = parseChoices(editChoices3.value);
  var answer3Text = editAnswer3.value.trim();
  var correct3Index = -1;
  var hasBlank3 = choices3Raw.length > 0;

  if (hasBlank3) {
    if (choices3.length < 2) {
      showNotice(editLevel3Notice, "Add at least two choices for Blank 3, or leave it empty to remove the blank.");
      editChoices3.focus();
      return;
    }
    if (!answer3Text) {
      showNotice(editLevel3Notice, "Enter the correct answer text for Blank 3.");
      editAnswer3.focus();
      return;
    }
    correct3Index = choices3.findIndex(function (c) {
      return c.trim().toLowerCase() === answer3Text.toLowerCase();
    });
    if (correct3Index === -1) {
      showNotice(editLevel3Notice, "\"" + answer3Text + "\" does not match any Blank 3 choice. Copy it exactly from the list above.");
      editAnswer3.focus();
      return;
    }
  }

  // Build prompt
  var prompt = seg0 + " [blank] " + (seg1 ? seg1 + " " : "") + "[blank]";
  if (hasBlank3) {
    prompt += (seg2 ? " " + seg2 : "") + " [blank]" + (seg3 ? " " + seg3 : "");
  } else {
    prompt += (seg2 ? " " + seg2 : "");
  }

  var blanks = [
    { choices: choices1, correctIndex: correct1Index },
    { choices: choices2, correctIndex: correct2Index }
  ];
  if (hasBlank3) {
    blanks.push({ choices: choices3, correctIndex: correct3Index });
  }

  var bank = safeParseArray(LEVEL3_STORAGE_KEY);
  var idx = target.index;

  if (idx < 0 || idx >= bank.length) {
    showNotice(editLevel3Notice, "Question not found in the bank. It may have been deleted.");
    return;
  }

  bank[idx] = {
    prompt: prompt,
    blanks: blanks,
    segments: { seg0: seg0, seg1: seg1, seg2: seg2, seg3: seg3 }
  };

  window.localStorage.setItem(LEVEL3_STORAGE_KEY, JSON.stringify(bank));
  window.sessionStorage.removeItem("az400-edit-target");
  window.location.href = "manage.html";
});
