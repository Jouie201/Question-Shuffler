"use strict";

var STORAGE_KEY          = "az400-question-bank";
var DRAG_DROP_STORAGE_KEY = "az400-drag-drop-question-bank";
var LEVEL3_STORAGE_KEY   = "az400-level3-question-bank";
var LEVEL4_STORAGE_KEY   = "az400-level4-question-bank";

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

var editLevel1Section  = document.getElementById("editLevel1Section");
var editLevel2Section  = document.getElementById("editLevel2Section");
var editLevel3Section  = document.getElementById("editLevel3Section");
var editLevel4Section  = document.getElementById("editLevel4Section");
var editNoTarget       = document.getElementById("editNoTarget");
var editPageTitle      = document.getElementById("editPageTitle");

// Level 1
var editLevel1Form  = document.getElementById("editLevel1Form");
var editL1Prompt    = document.getElementById("editL1Prompt");
var editL1Choices   = document.getElementById("editL1Choices");
var editL1Answers   = document.getElementById("editL1Answers");
var editLevel1Notice = document.getElementById("editLevel1Notice");

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
var editLevel3Form    = document.getElementById("editLevel3Form");
var editL3BlankLayout = document.getElementById("editL3BlankLayout");
var editSeg0          = document.getElementById("editSeg0");
var editChoices1   = document.getElementById("editChoices1");
var editAnswer1    = document.getElementById("editAnswer1");
var editChoices2   = document.getElementById("editChoices2");
var editAnswer2    = document.getElementById("editAnswer2");
var editChoices3   = document.getElementById("editChoices3");
var editAnswer3    = document.getElementById("editAnswer3");
var editBlankSentence1 = document.getElementById("editBlankSentence1");
var editBlankSentence2 = document.getElementById("editBlankSentence2");
var editBlankSentence3 = document.getElementById("editBlankSentence3");
var editBlankSide1 = document.getElementById("editBlankSide1");
var editBlankSide2 = document.getElementById("editBlankSide2");
var editBlankSide3 = document.getElementById("editBlankSide3");
var editBlankVSentence1 = document.getElementById("editBlankVSentence1");
var editBlankVSentence2 = document.getElementById("editBlankVSentence2");
var editBlankVSentence3 = document.getElementById("editBlankVSentence3");
var editBlankVSide1 = document.getElementById("editBlankVSide1");
var editBlankVSide2 = document.getElementById("editBlankVSide2");
var editBlankVSide3 = document.getElementById("editBlankVSide3");
var editLevel3Notice = document.getElementById("editLevel3Notice");

// Level 4
var editLevel4Form   = document.getElementById("editLevel4Form");
var editL4Prompt     = document.getElementById("editL4Prompt");
var editL4Answer     = document.getElementById("editL4Answer");
var editLevel4Notice = document.getElementById("editLevel4Notice");

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
  editLevel1Section.classList.add("is-edit-hidden");
  editLevel2Section.classList.add("is-edit-hidden");
  editLevel3Section.classList.add("is-edit-hidden");
  editLevel4Section.classList.add("is-edit-hidden");
  editNoTarget.classList.add("is-edit-hidden");

  if (type === "multiple-choice") {
    editPageTitle.textContent = "Edit Level 1 Question";
    editLevel1Section.classList.remove("is-edit-hidden");
  } else if (type === "drag-drop") {
    editPageTitle.textContent = "Edit Level 2 Question";
    editLevel2Section.classList.remove("is-edit-hidden");
  } else if (type === "dropdown") {
    editPageTitle.textContent = "Edit Level 3 Question";
    editLevel3Section.classList.remove("is-edit-hidden");
  } else if (type === "yes-no") {
    editPageTitle.textContent = "Edit Level 4 Question";
    editLevel4Section.classList.remove("is-edit-hidden");
  } else {
    editNoTarget.classList.remove("is-edit-hidden");
  }
}

// ── Pre-fill Level 1 form ─────────────────────────────────

function prefillLevel1(question) {
  editL1Prompt.value = question.prompt || "";

  var choices = Array.isArray(question.choices) ? question.choices : [];
  var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  editL1Choices.value = choices
    .map(function(c, i) { return letters[i] + ". " + c; })
    .join("\n");

  var correctIndices = Array.isArray(question.correctIndices) ? question.correctIndices : [];
  editL1Answers.value = correctIndices
    .map(function(i) { return letters[i]; })
    .join(",");
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
  if (editL3BlankLayout) editL3BlankLayout.value = question.blankLayout || "vertical";
  var segs = question.segments || {};

  // Fallback: parse segments from prompt if not stored
  if (!segs.seg0 && typeof question.prompt === "string" && question.prompt.length > 0) {
    var parts = question.prompt.split(/\[blank\]/i);
    segs = {
      seg0: (parts[0] || "").trim(),
      seg1: (parts[1] || "").trim(),
      seg2: (parts[2] || "").trim(),
      seg3: (parts[3] || "").trim()
    };
  }

  editSeg0.value = segs.seg0 || "";

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

  var sentences = Array.isArray(question.blankSentences) ? question.blankSentences : [];
  editBlankSentence1.value = sentences[0] || "";
  editBlankSentence2.value = sentences[1] || "";
  editBlankSentence3.value = sentences[2] || "";

  var sides = Array.isArray(question.blankSentenceSides) ? question.blankSentenceSides : [];
  if (editBlankSide1) editBlankSide1.value = sides[0] === "right" ? "right" : "left";
  if (editBlankSide2) editBlankSide2.value = sides[1] === "right" ? "right" : "left";
  if (editBlankSide3) editBlankSide3.value = sides[2] === "right" ? "right" : "left";

  // Vertical sentences — stored value takes priority; fall back to old seg1/seg2/seg3
  var vSentences = Array.isArray(question.blankVerticalSentences) ? question.blankVerticalSentences : [];
  var vSides = Array.isArray(question.blankVerticalSides) ? question.blankVerticalSides : [];
  if (editBlankVSentence1) editBlankVSentence1.value = vSentences[0] || segs.seg1 || "";
  if (editBlankVSentence2) editBlankVSentence2.value = vSentences[1] || segs.seg2 || "";
  if (editBlankVSentence3) editBlankVSentence3.value = vSentences[2] || segs.seg3 || "";
  if (editBlankVSide1) editBlankVSide1.value = vSides[0] === "below" ? "below" : "above";
  if (editBlankVSide2) editBlankVSide2.value = vSides[1] === "below" ? "below" : "above";
  if (editBlankVSide3) editBlankVSide3.value = vSides[2] === "below" ? "below" : "above";

  // Sync all toggle buttons to their restored values
  [
    { toggleEl: document.querySelector('[data-target="editBlankSide1"]'), val: editBlankSide1 ? editBlankSide1.value : "left" },
    { toggleEl: document.querySelector('[data-target="editBlankSide2"]'), val: editBlankSide2 ? editBlankSide2.value : "left" },
    { toggleEl: document.querySelector('[data-target="editBlankSide3"]'), val: editBlankSide3 ? editBlankSide3.value : "left" },
    { toggleEl: document.querySelector('[data-target="editBlankVSide1"]'), val: editBlankVSide1 ? editBlankVSide1.value : "above" },
    { toggleEl: document.querySelector('[data-target="editBlankVSide2"]'), val: editBlankVSide2 ? editBlankVSide2.value : "above" },
    { toggleEl: document.querySelector('[data-target="editBlankVSide3"]'), val: editBlankVSide3 ? editBlankVSide3.value : "above" }
  ].forEach(function(item) {
    if (!item.toggleEl) return;
    item.toggleEl.querySelectorAll(".bst-btn").forEach(function(b) {
      b.classList.toggle("is-active", b.dataset.value === item.val);
    });
  });
}

// ── Pre-fill Level 4 form ─────────────────────────────────

function prefillLevel4(question) {
  editL4Prompt.value = question.prompt || "";
  editL4Answer.value = String(question.correctIndex === 1 ? 1 : 0);
}

// ── Init ──────────────────────────────────────────────────

function init() {
  if (!target || !target.type) {
    showSection(null);
    return;
  }

  showSection(target.type);

  if (target.type === "multiple-choice") {
    var bank1 = safeParseArray(STORAGE_KEY);
    var question1 = bank1[target.index];
    if (!question1) { showSection(null); return; }
    prefillLevel1(question1);
  }

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

  if (target.type === "yes-no") {
    var bank4 = safeParseArray(LEVEL4_STORAGE_KEY);
    var question4 = bank4[target.index];
    if (!question4) { showSection(null); return; }
    prefillLevel4(question4);
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
  var prompt = seg0 + " [blank] [blank]" + (hasBlank3 ? " [blank]" : "");

  var blanks = [
    { choices: choices1, correctIndex: correct1Index },
    { choices: choices2, correctIndex: correct2Index }
  ];
  if (hasBlank3) {
    blanks.push({ choices: choices3, correctIndex: correct3Index });
  }

  var blankSentences = [
    editBlankSentence1.value.trim(),
    editBlankSentence2.value.trim()
  ];
  if (hasBlank3) {
    blankSentences.push(editBlankSentence3.value.trim());
  }

  var blankSentenceSides = [
    editBlankSide1 && editBlankSide1.value === "right" ? "right" : "left",
    editBlankSide2 && editBlankSide2.value === "right" ? "right" : "left"
  ];
  if (hasBlank3) {
    blankSentenceSides.push(editBlankSide3 && editBlankSide3.value === "right" ? "right" : "left");
  }

  var blankVerticalSentences = [
    editBlankVSentence1 ? editBlankVSentence1.value.trim() : "",
    editBlankVSentence2 ? editBlankVSentence2.value.trim() : ""
  ];
  if (hasBlank3) {
    blankVerticalSentences.push(editBlankVSentence3 ? editBlankVSentence3.value.trim() : "");
  }

  var blankVerticalSides = [
    editBlankVSide1 && editBlankVSide1.value === "below" ? "below" : "above",
    editBlankVSide2 && editBlankVSide2.value === "below" ? "below" : "above"
  ];
  if (hasBlank3) {
    blankVerticalSides.push(editBlankVSide3 && editBlankVSide3.value === "below" ? "below" : "above");
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
    segments: { seg0: seg0 },
    blankLayout: editL3BlankLayout ? editL3BlankLayout.value : "vertical",
    blankSentences: blankSentences,
    blankSentenceSides: blankSentenceSides,
    blankVerticalSentences: blankVerticalSentences,
    blankVerticalSides: blankVerticalSides
  };

  window.localStorage.setItem(LEVEL3_STORAGE_KEY, JSON.stringify(bank));
  window.sessionStorage.removeItem("az400-edit-target");
  window.location.href = "manage.html";
});

// ── Blank-side segmented toggle (edit page) ───────────────
document.addEventListener("click", function(e) {
  var btn = e.target.closest(".blank-side-toggle .bst-btn");
  if (!btn) return;
  var toggle = btn.closest(".blank-side-toggle");
  var targetId = toggle.dataset.target;
  var hidden = document.getElementById(targetId);
  if (!hidden) return;
  toggle.querySelectorAll(".bst-btn").forEach(function(b) { b.classList.remove("is-active"); });
  btn.classList.add("is-active");
  hidden.value = btn.dataset.value;
  // Rebuild preview if this toggle belongs to the Level 3 form
  if (btn.closest("#editLevel3Section")) {
    buildL3Preview();
  }
});

// ── Save Level 1 ──────────────────────────────────────────

editLevel1Form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearNotice(editLevel1Notice);

  var prompt = editL1Prompt.value.trim();
  if (!prompt) {
    showNotice(editLevel1Notice, "Enter a question prompt before saving.");
    editL1Prompt.focus();
    return;
  }

  var parsedChoices = parseChoices(editL1Choices.value);
  if (parsedChoices.length < 2) {
    showNotice(editLevel1Notice, "Add at least two choices.");
    editL1Choices.focus();
    return;
  }

  var answerRaw = editL1Answers.value.trim().toUpperCase();
  if (!answerRaw) {
    showNotice(editLevel1Notice, "Enter at least one correct answer letter (e.g. A or A,C).");
    editL1Answers.focus();
    return;
  }

  var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var correctIndices = answerRaw.split(",").map(function(s) {
    var letter = s.trim();
    var idx = letters.indexOf(letter);
    return idx;
  }).filter(function(i) { return i >= 0 && i < parsedChoices.length; });

  if (correctIndices.length === 0) {
    showNotice(editLevel1Notice, "No valid answer letters found. Use letters matching the choices (e.g. A, B, C).");
    editL1Answers.focus();
    return;
  }

  var bank = safeParseArray(STORAGE_KEY);
  var idx = target.index;

  if (idx < 0 || idx >= bank.length) {
    showNotice(editLevel1Notice, "Question not found in the bank. It may have been deleted.");
    return;
  }

  bank[idx] = {
    prompt: prompt,
    choices: parsedChoices,
    correctIndices: correctIndices
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
  window.sessionStorage.removeItem("az400-edit-target");
  window.location.href = "manage.html";
});

// ── Save Level 4 ──────────────────────────────────────────

editLevel4Form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearNotice(editLevel4Notice);

  var prompt = editL4Prompt.value.trim();
  if (!prompt) {
    showNotice(editLevel4Notice, "Enter a question prompt before saving.");
    editL4Prompt.focus();
    return;
  }

  var correctIndex = parseInt(editL4Answer.value, 10);
  if (correctIndex !== 0 && correctIndex !== 1) {
    showNotice(editLevel4Notice, "Select a valid correct answer.");
    editL4Answer.focus();
    return;
  }

  var bank = safeParseArray(LEVEL4_STORAGE_KEY);
  var idx = target.index;

  if (idx < 0 || idx >= bank.length) {
    showNotice(editLevel4Notice, "Question not found in the bank. It may have been deleted.");
    return;
  }

  bank[idx] = {
    prompt: prompt,
    correctIndex: correctIndex
  };

  window.localStorage.setItem(LEVEL4_STORAGE_KEY, JSON.stringify(bank));
  window.sessionStorage.removeItem("az400-edit-target");
  window.location.href = "manage.html";
});

// ── Level 3 Live Preview ──────────────────────────────────────
// DOM refs for the preview panel
var l3PreviewPrompt = document.getElementById("l3PreviewPrompt");
var l3PreviewBlanks = document.getElementById("l3PreviewBlanks");

// Drag state (null when nothing is being dragged)
var l3DragState = null;

// Read all L3 form field values into a plain data object
function getL3FormData() {
  var hasBlank3 = editChoices3 && editChoices3.value.trim().length > 0;
  var blanks = [
    {
      choices: parseChoices(editChoices1 ? editChoices1.value : ""),
      sentence:  editBlankSentence1  ? editBlankSentence1.value.trim()  : "",
      side:      editBlankSide1      ? editBlankSide1.value             : "left",
      vSentence: editBlankVSentence1 ? editBlankVSentence1.value.trim() : "",
      vSide:     editBlankVSide1     ? editBlankVSide1.value            : "above"
    },
    {
      choices: parseChoices(editChoices2 ? editChoices2.value : ""),
      sentence:  editBlankSentence2  ? editBlankSentence2.value.trim()  : "",
      side:      editBlankSide2      ? editBlankSide2.value             : "left",
      vSentence: editBlankVSentence2 ? editBlankVSentence2.value.trim() : "",
      vSide:     editBlankVSide2     ? editBlankVSide2.value            : "above"
    }
  ];
  if (hasBlank3) {
    blanks.push({
      choices: parseChoices(editChoices3 ? editChoices3.value : ""),
      sentence:  editBlankSentence3  ? editBlankSentence3.value.trim()  : "",
      side:      editBlankSide3      ? editBlankSide3.value             : "left",
      vSentence: editBlankVSentence3 ? editBlankVSentence3.value.trim() : "",
      vSide:     editBlankVSide3     ? editBlankVSide3.value            : "above"
    });
  }
  return {
    seg0: editSeg0 ? editSeg0.value.trim() : "",
    blankLayout: editL3BlankLayout ? editL3BlankLayout.value : "vertical",
    blanks: blanks
  };
}

// Create the draggable horizontal sentence chip
function makePreviewSentenceEl(text, bi) {
  var el = document.createElement("span");
  el.className = "prev-sentence";
  el.draggable = true;
  el.dataset.bi = String(bi);
  el.dataset.type = "sentence";
  el.textContent = text;
  return el;
}

// Create the draggable vertical sentence chip
function makePreviewVSentenceEl(text, bi) {
  var el = document.createElement("div");
  el.className = "prev-vsentence";
  el.draggable = true;
  el.dataset.bi = String(bi);
  el.dataset.type = "vsentence";
  el.textContent = text;
  return el;
}

// Create a vertical drop zone (above/below)
function makePreviewVDropZone(bi, vside) {
  var el = document.createElement("div");
  el.className = "prev-vdrop prev-vdrop--" + vside;
  el.dataset.bi = String(bi);
  el.dataset.vside = vside;
  return el;
}

// Render the full preview panel from current form values
function buildL3Preview() {
  if (!l3PreviewPrompt || !l3PreviewBlanks) return;

  var data = getL3FormData();

  // Prompt text
  if (data.seg0) {
    l3PreviewPrompt.textContent = data.seg0;
    l3PreviewPrompt.classList.remove("l3-preview-empty");
  } else {
    l3PreviewPrompt.textContent = "Enter the question text above\u2026";
    l3PreviewPrompt.classList.add("l3-preview-empty");
  }

  // Blanks section — rebuild from scratch each time
  l3PreviewBlanks.innerHTML = "";

  var layoutClass = "l3-preview-blanks";
  if (data.blankLayout === "horizontal") layoutClass += " l3-preview-blanks--horizontal";
  if (data.blankLayout === "diagonal")   layoutClass += " l3-preview-blanks--diagonal";
  l3PreviewBlanks.className = layoutClass;

  data.blanks.forEach(function(blank, bi) {
    var group = document.createElement("div");
    group.className = "prev-blank-group";
    group.dataset.bi = String(bi);

    // ── Horizontal row: [left zone] [dropdown] [right zone] ──
    var row = document.createElement("div");
    row.className = "prev-blank-row";

    var leftZone = document.createElement("div");
    leftZone.className = "prev-drop-zone prev-drop-zone--left";
    leftZone.dataset.bi = String(bi);
    leftZone.dataset.side = "left";
    if (blank.sentence && blank.side === "left") {
      leftZone.appendChild(makePreviewSentenceEl(blank.sentence, bi));
    }

    var trigger = document.createElement("div");
    trigger.className = "prev-blank-trigger";
    trigger.setAttribute("aria-hidden", "true");
    var triggerLabel = document.createElement("span");
    triggerLabel.textContent = blank.choices.length ? "Select" : "Blank " + (bi + 1);
    var triggerArrow = document.createElement("span");
    triggerArrow.className = "prev-blank-trigger-arrow";
    triggerArrow.textContent = "\u25be";
    trigger.appendChild(triggerLabel);
    trigger.appendChild(triggerArrow);

    var rightZone = document.createElement("div");
    rightZone.className = "prev-drop-zone prev-drop-zone--right";
    rightZone.dataset.bi = String(bi);
    rightZone.dataset.side = "right";
    if (blank.sentence && blank.side === "right") {
      rightZone.appendChild(makePreviewSentenceEl(blank.sentence, bi));
    }

    row.appendChild(leftZone);
    row.appendChild(trigger);
    row.appendChild(rightZone);

    // ── Vertical sentence wrapping ──
    if (blank.vSentence) {
      var vEl       = makePreviewVSentenceEl(blank.vSentence, bi);
      var vAboveDrop = makePreviewVDropZone(bi, "above");
      var vBelowDrop = makePreviewVDropZone(bi, "below");

      if (blank.vSide === "below") {
        group.appendChild(vAboveDrop);
        group.appendChild(row);
        group.appendChild(vEl);
        group.appendChild(vBelowDrop);
      } else {
        group.appendChild(vEl);
        group.appendChild(vAboveDrop);
        group.appendChild(row);
        group.appendChild(vBelowDrop);
      }
    } else {
      group.appendChild(row);
    }

    l3PreviewBlanks.appendChild(group);
  });

  attachL3PreviewDragEvents();
}

// Attach HTML5 drag-and-drop handlers (re-attached after each render)
function attachL3PreviewDragEvents() {
  if (!l3PreviewBlanks) return;

  // Draggable sentence chips
  l3PreviewBlanks.querySelectorAll(".prev-sentence, .prev-vsentence").forEach(function(el) {
    el.addEventListener("dragstart", function(e) {
      l3DragState = { bi: Number(el.dataset.bi), type: el.dataset.type };
      e.dataTransfer.effectAllowed = "move";
      // Defer the dimming so the drag image captures the undimmed state
      setTimeout(function() { el.classList.add("is-dragging"); }, 0);
    });

    el.addEventListener("dragend", function() {
      el.classList.remove("is-dragging");
      l3DragState = null;
      l3PreviewBlanks.querySelectorAll(".is-drag-over").forEach(function(z) {
        z.classList.remove("is-drag-over");
      });
    });
  });

  // Horizontal drop zones (left / right of the blank)
  l3PreviewBlanks.querySelectorAll(".prev-drop-zone").forEach(function(zone) {
    zone.addEventListener("dragover", function(e) {
      if (!l3DragState || l3DragState.type !== "sentence") return;
      if (Number(zone.dataset.bi) !== l3DragState.bi) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      l3PreviewBlanks.querySelectorAll(".prev-drop-zone.is-drag-over").forEach(function(z) {
        if (z !== zone) z.classList.remove("is-drag-over");
      });
      zone.classList.add("is-drag-over");
    });

    zone.addEventListener("dragleave", function(e) {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove("is-drag-over");
      }
    });

    zone.addEventListener("drop", function(e) {
      e.preventDefault();
      zone.classList.remove("is-drag-over");
      if (!l3DragState || l3DragState.type !== "sentence") return;
      var bi = Number(zone.dataset.bi);
      if (bi !== l3DragState.bi) return;
      applyL3SentenceSide(bi, zone.dataset.side);
    });
  });

  // Vertical drop zones (above / below the blank row)
  l3PreviewBlanks.querySelectorAll(".prev-vdrop").forEach(function(zone) {
    zone.addEventListener("dragover", function(e) {
      if (!l3DragState || l3DragState.type !== "vsentence") return;
      if (Number(zone.dataset.bi) !== l3DragState.bi) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      l3PreviewBlanks.querySelectorAll(".prev-vdrop.is-drag-over").forEach(function(z) {
        if (z !== zone) z.classList.remove("is-drag-over");
      });
      zone.classList.add("is-drag-over");
    });

    zone.addEventListener("dragleave", function(e) {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove("is-drag-over");
      }
    });

    zone.addEventListener("drop", function(e) {
      e.preventDefault();
      zone.classList.remove("is-drag-over");
      if (!l3DragState || l3DragState.type !== "vsentence") return;
      var bi = Number(zone.dataset.bi);
      if (bi !== l3DragState.bi) return;
      applyL3VSentenceSide(bi, zone.dataset.vside);
    });
  });
}

// Update horizontal sentence side and sync form controls
function applyL3SentenceSide(bi, side) {
  var hiddenInputs = [editBlankSide1, editBlankSide2, editBlankSide3];
  var hiddenEl = hiddenInputs[bi];
  if (hiddenEl) hiddenEl.value = side;

  var toggleEl = document.querySelector('[data-target="editBlankSide' + (bi + 1) + '"]');
  if (toggleEl) {
    toggleEl.querySelectorAll(".bst-btn").forEach(function(b) {
      b.classList.toggle("is-active", b.dataset.value === side);
    });
  }
  buildL3Preview();
}

// Update vertical sentence side and sync form controls
function applyL3VSentenceSide(bi, vSide) {
  var hiddenInputs = [editBlankVSide1, editBlankVSide2, editBlankVSide3];
  var hiddenEl = hiddenInputs[bi];
  if (hiddenEl) hiddenEl.value = vSide;

  var toggleEl = document.querySelector('[data-target="editBlankVSide' + (bi + 1) + '"]');
  if (toggleEl) {
    toggleEl.querySelectorAll(".bst-btn").forEach(function(b) {
      b.classList.toggle("is-active", b.dataset.value === vSide);
    });
  }
  buildL3Preview();
}

// Listen for input changes on all L3 form fields to keep preview in sync
(function () {
  var l3Fields = [
    editSeg0,
    editChoices1, editAnswer1, editBlankSentence1, editBlankVSentence1,
    editChoices2, editAnswer2, editBlankSentence2, editBlankVSentence2,
    editChoices3, editAnswer3, editBlankSentence3, editBlankVSentence3
  ];
  l3Fields.forEach(function(el) {
    if (!el) return;
    el.addEventListener("input", buildL3Preview);
  });
  if (editL3BlankLayout) editL3BlankLayout.addEventListener("change", buildL3Preview);
}());

// Initial render (form is already pre-filled by prefillLevel3 at this point)
buildL3Preview();
