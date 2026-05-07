var LEVEL3_STORAGE_KEY = "az400-level3-question-bank";
var LEVEL_TWO_RESULT_STORAGE_KEY = "az400-level-two-result";
var RESULT_STORAGE_KEY = "az400-quiz-result";
var PRACTICE_MODE_KEY = "az400-practice-mode";

function shuffleArray(arr) {
  var out = arr.slice();
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

function loadLevel3QuestionBank() {
  var stored = window.localStorage.getItem(LEVEL3_STORAGE_KEY);
  if (stored === null) return [];
  try {
    var parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function(q) {
      return (
        q &&
        typeof q.prompt === "string" &&
        Array.isArray(q.blanks) &&
        q.blanks.length >= 1 &&
        q.blanks.every(function(b) {
          return Array.isArray(b.choices) && b.choices.length >= 2 && typeof b.correctIndex === "number";
        })
      );
    });
  } catch(e) { return []; }
}

function loadPriorResult() {
  var stored = window.sessionStorage.getItem(LEVEL_TWO_RESULT_STORAGE_KEY);
  if (!stored) return { correctCount: 0, totalQuestions: 0 };
  try {
    var parsed = JSON.parse(stored);
    return {
      correctCount: Number.isFinite(parsed.correctCount) ? parsed.correctCount : 0,
      totalQuestions: Number.isFinite(parsed.totalQuestions) ? parsed.totalQuestions : 0
    };
  } catch(e) { return { correctCount: 0, totalQuestions: 0 }; }
}

var RANGE_CONFIG_KEY = "az400-range-config";

function loadRangeConfig() {
  try {
    var raw = window.sessionStorage.getItem(RANGE_CONFIG_KEY);
    if (!raw) return null;
    var config = JSON.parse(raw);
    if (!config || typeof config.level !== "string") return null;
    return config;
  } catch(e) { return null; }
}

function applyRangeToBank(bank, rangeConfig, level) {
  if (!rangeConfig || rangeConfig.level !== level) {
    return shuffleArray(bank);
  }
  window.sessionStorage.removeItem(RANGE_CONFIG_KEY);
  var start = Math.max(0, rangeConfig.start);
  var end = Math.min(bank.length - 1, rangeConfig.end);
  var sliced = bank.slice(start, end + 1);
  return rangeConfig.order === "consecutive" ? sliced : shuffleArray(sliced);
}

var _level3RangeConfig = loadRangeConfig();
var questionBank = applyRangeToBank(loadLevel3QuestionBank(), _level3RangeConfig, "level3");
var priorResult = loadPriorResult();

var currentQI = 0;
// answers[qi][bi] = null | choiceIndex
var answers = questionBank.map(function(q) {
  return q.blanks.map(function() { return null; });
});

var openDropdown = null; // bi (number) or null — only one question shown at a time
var isChecked = false;   // true after the current question has been checked
var isSubmitted = false; // true after the last question is checked (finalize on next click)

// DOM refs
var questionCountEl = document.getElementById("questionCount");
var quizStatus = document.getElementById("quizStatus");
var promptContainer = document.getElementById("promptContainer");
var nextButton = document.getElementById("nextButton");
var retryButton = document.getElementById("retryButton");
var prevButton = document.getElementById("prevButton");

function isCurrentAnswered() {
  return answers[currentQI].every(function(a) { return a !== null; });
}

function isCurrentCorrect() {
  var q = questionBank[currentQI];
  return answers[currentQI].every(function(a, bi) {
    return a === q.blanks[bi].correctIndex;
  });
}

function updateButtonState() {
  var isLast = currentQI === questionBank.length - 1;
  if (isSubmitted) {
    nextButton.textContent = "See Results";
    nextButton.disabled = false;
    retryButton.disabled = true;
    if (prevButton && !prevButton.hidden) prevButton.disabled = true;
  } else if (isChecked) {
    // Feedback is shown — let them advance
    nextButton.textContent = isLast ? "See Results" : "Next Question";
    nextButton.disabled = false;
    retryButton.disabled = false;
    if (prevButton && !prevButton.hidden) prevButton.disabled = currentQI <= 0;
  } else if (isLast) {
    nextButton.textContent = "Submit";
    nextButton.disabled = !isCurrentAnswered();
    retryButton.disabled = !isCurrentAnswered();
    if (prevButton && !prevButton.hidden) prevButton.disabled = currentQI <= 0;
  } else {
    nextButton.textContent = "Next Question";
    nextButton.disabled = !isCurrentAnswered();
    retryButton.disabled = false;
    if (prevButton && !prevButton.hidden) prevButton.disabled = currentQI <= 0;
  }
}

function updateCount() {
  questionCountEl.textContent =
    "Level 3 \u00b7 Question " + (currentQI + 1) + " of " + questionBank.length;
}

// Measure the pixel width needed for the longest choice string
function measureLongestChoice(choices) {
  var probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "nowrap";
  probe.style.fontSize = "0.9rem";
  probe.style.fontWeight = "500";
  probe.style.fontFamily = "inherit";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  var max = 0;
  choices.forEach(function(c) {
    probe.textContent = c;
    if (probe.offsetWidth > max) max = probe.offsetWidth;
  });
  document.body.removeChild(probe);
  // padding (2x0.85rem~27px) + gap + arrow (~28px) + borders
  return max + 57;
}

function renderCurrentQuestion() {
  var qi = currentQI;
  var question = questionBank[qi];

  promptContainer.innerHTML = "";

  var segments = question.prompt.split(/\[blank\]/i);

  // 1. Prompt text with numbered placeholders
  var promptLine = document.createElement("div");
  promptLine.className = "q-prompt-line";

  segments.forEach(function(seg, si) {
    if (seg) {
      var textSpan = document.createElement("span");
      textSpan.className = "q-prompt-text";
      textSpan.textContent = seg;
      promptLine.appendChild(textSpan);
    }
  });

  promptContainer.appendChild(promptLine);

  // 2. Blank dropdowns listed below the sentence
  var blanksSection = document.createElement("div");
  var globalLayout = question.blankLayout || "vertical";
  var blankLayouts = Array.isArray(question.blankLayouts) ? question.blankLayouts : null;
  blanksSection.className = "q-blanks-section";
  if (blankLayouts) {
    blanksSection.className += " q-blanks-section--perblink";
  } else {
    if (globalLayout === "horizontal") blanksSection.className += " q-blanks-section--horizontal";
    if (globalLayout === "diagonal")   blanksSection.className += " q-blanks-section--diagonal";
  }

  question.blanks.forEach(function(blank, si) {
    var selected = answers[qi][si];
    var isOpen = openDropdown === si;
    var isSelected = selected !== null;
    var isCorrectBlank = isChecked && isSelected && selected === blank.correctIndex;
    var isIncorrectBlank = isChecked && isSelected && selected !== blank.correctIndex;

    var row = document.createElement("div");
    row.className = "q-blank-row";

    var blankOwnLayout = blankLayouts ? (blankLayouts[si] || globalLayout) : globalLayout;

    // Sentence text and which side it appears on
    var customSentence = Array.isArray(question.blankSentences) && question.blankSentences[si]
      ? question.blankSentences[si]
      : "";
    var sentenceSide = Array.isArray(question.blankSentenceSides) && question.blankSentenceSides[si] === "right"
      ? "right"
      : "left";

    function makeSentenceSpan() {
      var span = document.createElement("span");
      span.className = "q-blank-sentence";
      span.textContent = customSentence;
      return span;
    }

    // Append left-side sentence before the dropdown
    if (customSentence && sentenceSide === "left") {
      row.appendChild(makeSentenceSpan());
    }

    var wrapper = document.createElement("div");
    var wrapperClasses = ["q-dropdown", "q-dropdown-inline"];
    if (isOpen) wrapperClasses.push("is-open");
    if (isCorrectBlank) wrapperClasses.push("is-correct");
    if (isIncorrectBlank) wrapperClasses.push("is-incorrect");
    wrapper.className = wrapperClasses.join(" ");
    wrapper.dataset.bi = String(si);
    wrapper.style.minWidth = measureLongestChoice(blank.choices) + "px";

    // Trigger button
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "q-dropdown-trigger";
    trigger.disabled = isChecked;
    trigger.dataset.bi = String(si);

    var triggerVal = document.createElement("span");
    if (isSelected) {
      triggerVal.className = "q-dropdown-value";
      triggerVal.textContent = blank.choices[selected];
    } else {
      triggerVal.className = "q-dropdown-value is-placeholder";
      triggerVal.textContent = "Select";
    }
    var triggerArrow = document.createElement("span");
    triggerArrow.className = "q-dropdown-arrow";
    triggerArrow.setAttribute("aria-hidden", "true");
    triggerArrow.textContent = "\u25be";
    trigger.appendChild(triggerVal);
    trigger.appendChild(triggerArrow);

    // Options list
    var list = document.createElement("ul");
    list.className = "q-dropdown-list";
    if (!isOpen) list.hidden = true;

    blank.choices.forEach(function(choice, ci) {
      var isChoiceSelected = selected === ci;
      var isCorrectChoice = ci === blank.correctIndex;

      var option = document.createElement("li");
      var optClasses = ["q-dropdown-option"];
      if (isChoiceSelected) optClasses.push("is-selected");
      if (isChecked && isCorrectChoice) optClasses.push("is-correct");
      if (isChecked && isChoiceSelected && !isCorrectChoice) optClasses.push("is-incorrect");
      if (isChecked) optClasses.push("is-locked");
      option.className = optClasses.join(" ");
      option.dataset.bi = String(si);
      option.dataset.ci = String(ci);

      var text = document.createElement("span");
      text.textContent = choice;
      option.appendChild(text);
      list.appendChild(option);
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(list);

    if (isIncorrectBlank) {
      var hint = document.createElement("p");
      hint.className = "q-correct-hint";
      hint.textContent = "\u2713 " + blank.choices[blank.correctIndex];
      wrapper.appendChild(hint);
    }

    row.appendChild(wrapper);

    // Append right-side sentence after the dropdown
    if (customSentence && sentenceSide === "right") {
      row.appendChild(makeSentenceSpan());
    }

    // Vertical sentence (above or below the row)
    var vSentenceText = Array.isArray(question.blankVerticalSentences) && question.blankVerticalSentences[si]
      ? question.blankVerticalSentences[si]
      : "";
    var vSentenceSide = Array.isArray(question.blankVerticalSides) && question.blankVerticalSides[si] === "below"
      ? "below"
      : "above";

    if (vSentenceText) {
      var vEl = document.createElement("div");
      vEl.className = "q-blank-vsentence q-blank-vsentence--" + vSentenceSide;
      vEl.textContent = vSentenceText;

      var group = document.createElement("div");
      group.className = "q-blank-group" + (blankLayouts ? " q-blank-group--" + blankOwnLayout : "");
      if (vSentenceSide === "above") {
        group.appendChild(vEl);
        group.appendChild(row);
      } else {
        group.appendChild(row);
        group.appendChild(vEl);
      }
      blanksSection.appendChild(group);
    } else {
      var rowGroup = document.createElement("div");
      rowGroup.className = "q-blank-group" + (blankLayouts ? " q-blank-group--" + blankOwnLayout : "");
      rowGroup.appendChild(row);
      blanksSection.appendChild(rowGroup);
    }
  });

  promptContainer.appendChild(blanksSection);

  updateCount();
  updateButtonState();

  // After render: flip any open dropdown upward if it would clip below the viewport
  if (openDropdown !== null) {
    var openWrapper = promptContainer.querySelector(".q-dropdown-inline.is-open");
    if (openWrapper) {
      var openList = openWrapper.querySelector(".q-dropdown-list");
      if (openList) {
        var listRect = openList.getBoundingClientRect();
        if (listRect.bottom > window.innerHeight - 16) {
          openWrapper.classList.add("opens-up");
        } else {
          openWrapper.classList.remove("opens-up");
        }
      }
    }
  }
}

// ── Event Handlers ─────────────────────────────────────────

function handleTriggerClick(event) {
  if (isSubmitted) return;
  var trigger = event.target.closest(".q-dropdown-trigger");
  if (!trigger) return;
  event.stopPropagation();
  var bi = Number(trigger.dataset.bi);
  openDropdown = (openDropdown === bi) ? null : bi;
  renderCurrentQuestion();
}

function handleOptionClick(event) {
  if (isSubmitted) return;
  var option = event.target.closest(".q-dropdown-option");
  if (!option) return;
  event.stopPropagation();
  var bi = Number(option.dataset.bi);
  var ci = Number(option.dataset.ci);
  answers[currentQI][bi] = ci;
  openDropdown = null;
  renderCurrentQuestion();
}

function handleDocumentClick(event) {
  if (openDropdown === null) return;
  if (!event.target.closest(".q-dropdown")) {
    openDropdown = null;
    renderCurrentQuestion();
  }
}

function finalizeQuiz() {
  var level3CorrectCount = questionBank.reduce(function(total, q, qi) {
    return total + (answers[qi].every(function(a, bi) {
      return a === q.blanks[bi].correctIndex;
    }) ? 1 : 0);
  }, 0);

  var combined = {
    correctCount: priorResult.correctCount + level3CorrectCount,
    totalQuestions: priorResult.totalQuestions + questionBank.length
  };

  var hasLevel4 = false;
  try {
    var stored4 = window.localStorage.getItem("az400-level4-question-bank");
    if (stored4 !== null) {
      var parsed4 = JSON.parse(stored4);
      hasLevel4 = Array.isArray(parsed4) && parsed4.length > 0;
    }
  } catch(e) {
    hasLevel4 = false;
  }

  var examMode = window.sessionStorage.getItem("az400-exam-mode") || "combined";

  if (examMode === "combined" && hasLevel4) {
    window.sessionStorage.setItem("az400-level-three-result", JSON.stringify(combined));
    window.sessionStorage.removeItem(LEVEL_TWO_RESULT_STORAGE_KEY);
    window.location.href = "level4.html";
    return;
  }

  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(combined));
  window.sessionStorage.removeItem(LEVEL_TWO_RESULT_STORAGE_KEY);
  window.location.href = "results.html";
}

function handleNext() {
  if (isSubmitted) {
    finalizeQuiz();
    return;
  }

  var isLast = currentQI === questionBank.length - 1;

  // Second click after feedback: advance or finalize
  if (isChecked) {
    if (isLast) {
      isSubmitted = true;
      finalizeQuiz();
    } else {
      currentQI++;
      isChecked = false;
      openDropdown = null;
      renderCurrentQuestion();
      quizStatus.textContent = "Select an answer for each blank";
    }
    return;
  }

  // First click: check the answer and show feedback
  if (!isCurrentAnswered()) return;

  isChecked = true;
  quizStatus.textContent = isCurrentCorrect() ? "Correct!" : "Incorrect";
  renderCurrentQuestion();
}

// ── Init ───────────────────────────────────────────────────

if (questionBank.length === 0) {
  questionCountEl.textContent = "No Level 3 questions";
  quizStatus.textContent = "Add questions to the bank first";
  nextButton.disabled = true;
} else {
  renderCurrentQuestion();
  quizStatus.textContent = "Select an answer for each blank";
}

promptContainer.addEventListener("click", function(event) {
  if (event.target.closest(".q-dropdown-trigger")) {
    handleTriggerClick(event);
  } else if (event.target.closest(".q-dropdown-option")) {
    handleOptionClick(event);
  }
});

document.addEventListener("click", handleDocumentClick);
nextButton.addEventListener("click", handleNext);

if (retryButton) {
  retryButton.addEventListener("click", function() {
    if (isSubmitted || questionBank.length === 0) return;
    answers[currentQI] = questionBank[currentQI].blanks.map(function() { return null; });
    isChecked = false;
    openDropdown = null;
    renderCurrentQuestion();
    quizStatus.textContent = "Select an answer for each blank";
  });
}

if (prevButton) {
  var isPracticeMode = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";
  prevButton.hidden = !isPracticeMode;
  prevButton.addEventListener("click", function() {
    if (currentQI <= 0) return;
    currentQI--;
    answers[currentQI] = questionBank[currentQI].blanks.map(function() { return null; });
    isChecked = false;
    isSubmitted = false;
    openDropdown = null;
    renderCurrentQuestion();
    quizStatus.textContent = "Select an answer for each blank";
  });
}

var homeButton = document.getElementById("homeButton");
if (homeButton) {
  var isPracticeModeHome = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";
  homeButton.hidden = !isPracticeModeHome;
  homeButton.addEventListener("click", function() {
    window.sessionStorage.setItem("az400-show-level-select", "true");
    window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
    window.location.href = "index.html";
  });
}