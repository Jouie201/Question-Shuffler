var LEVEL3_STORAGE_KEY = "az400-level3-question-bank";
var LEVEL_TWO_RESULT_STORAGE_KEY = "az400-level-two-result";
var RESULT_STORAGE_KEY = "az400-quiz-result";

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

var questionBank = shuffleArray(loadLevel3QuestionBank());
var priorResult = loadPriorResult();

var currentQI = 0;
// answers[qi][bi] = null | choiceIndex
var answers = questionBank.map(function(q) {
  return q.blanks.map(function() { return null; });
});

var openDropdown = null; // bi (number) or null — only one question shown at a time
var isSubmitted = false; // true after user submits the last question

// DOM refs
var questionCountEl = document.getElementById("questionCount");
var quizStatus = document.getElementById("quizStatus");
var promptContainer = document.getElementById("promptContainer");
var nextButton = document.getElementById("nextButton");

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
  } else if (isLast) {
    nextButton.textContent = "Submit";
    nextButton.disabled = !isCurrentAnswered();
  } else {
    nextButton.textContent = "Next Question";
    nextButton.disabled = !isCurrentAnswered();
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
  var promptLine = document.createElement("div");
  promptLine.className = "q-prompt-line";

  segments.forEach(function(seg, si) {
    // Text segment
    if (seg) {
      var textSpan = document.createElement("span");
      textSpan.className = "q-prompt-text";
      textSpan.textContent = seg;
      promptLine.appendChild(textSpan);
    }

    // Dropdown for this blank position
    if (si < question.blanks.length) {
      var blank = question.blanks[si];
      var selected = answers[qi][si]; // null or choice index
      var isOpen = openDropdown === si;
      var isSelected = selected !== null;
      var isCorrectBlank = isSubmitted && isSelected && selected === blank.correctIndex;
      var isIncorrectBlank = isSubmitted && isSelected && selected !== blank.correctIndex;

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
      trigger.disabled = isSubmitted;
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
        if (isSubmitted && isCorrectChoice) optClasses.push("is-correct");
        if (isSubmitted && isChoiceSelected && !isCorrectChoice) optClasses.push("is-incorrect");
        if (isSubmitted) optClasses.push("is-locked");
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
      promptLine.appendChild(wrapper);
    }
  });

  promptContainer.appendChild(promptLine);
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

  if (hasLevel4) {
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

  if (!isCurrentAnswered()) return;

  var isLast = currentQI === questionBank.length - 1;

  if (isLast) {
    // Lock and show feedback on the last question
    isSubmitted = true;
    quizStatus.textContent = "Review your answer, then click See Results";
    renderCurrentQuestion();
    return;
  }

  // Advance to next question
  currentQI++;
  openDropdown = null;
  renderCurrentQuestion();
  quizStatus.textContent = "Select an answer for each blank";
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