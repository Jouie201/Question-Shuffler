var LEVEL4_STORAGE_KEY = "az400-level4-question-bank";
var LEVEL_THREE_RESULT_STORAGE_KEY = "az400-level-three-result";
var RESULT_STORAGE_KEY = "az400-quiz-result";

function shuffleArray(arr) {
  var out = arr.slice();
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

var CHOICES = ["Yes", "No"];

function loadLevel4QuestionBank() {
  var stored = window.localStorage.getItem(LEVEL4_STORAGE_KEY);
  if (stored === null) return [];
  try {
    var parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function(q) {
      return q && typeof q.prompt === "string" && (q.correctIndex === 0 || q.correctIndex === 1);
    });
  } catch(e) { return []; }
}

function loadPriorResult() {
  var stored = window.sessionStorage.getItem(LEVEL_THREE_RESULT_STORAGE_KEY);
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

var _level4RangeConfig = loadRangeConfig();
var questionBank = applyRangeToBank(loadLevel4QuestionBank(), _level4RangeConfig, "level4");
var priorResult = loadPriorResult();

var currentQI = 0;
var selectedIndex = null; // null | 0 | 1
var isAnswerChecked = false;
var questionResults = []; // boolean per question

// DOM refs
var questionCountEl = document.getElementById("questionCount");
var quizStatus = document.getElementById("quizStatus");
var questionPromptEl = document.getElementById("questionPrompt");
var choiceList = document.getElementById("choiceList");
var nextButton = document.getElementById("nextButton");

function isLast() {
  return currentQI === questionBank.length - 1;
}

function updateCount() {
  questionCountEl.textContent =
    "Level 4 \u00b7 Question " + (currentQI + 1) + " of " + questionBank.length;
}

function updateButtonState() {
  if (isLast()) {
    nextButton.textContent = isAnswerChecked ? "See Results" : "Submit";
    nextButton.disabled = selectedIndex === null;
  } else {
    nextButton.textContent = "Next Question";
    nextButton.disabled = selectedIndex === null;
  }
}

function renderCurrentQuestion() {
  var q = questionBank[currentQI];
  questionPromptEl.textContent = q.prompt;
  choiceList.innerHTML = "";

  CHOICES.forEach(function(choice, ci) {
    var item = document.createElement("li");
    item.className = "choice-item";

    if (selectedIndex === ci) item.classList.add("is-selected");

    if (isAnswerChecked) {
      if (ci === q.correctIndex) item.classList.add("is-correct");
      else if (selectedIndex === ci) item.classList.add("is-incorrect");
      item.classList.add("is-locked");
    }

    var label = document.createElement("label");
    label.className = "choice-option";

    var input = document.createElement("input");
    input.type = "radio";
    input.name = "yn-choice";
    input.value = String(ci);
    input.checked = selectedIndex === ci;
    input.disabled = isAnswerChecked;

    var labelSpan = document.createElement("span");
    labelSpan.className = "choice-label";
    labelSpan.textContent = ci === 0 ? "A." : "B.";

    var text = document.createElement("span");
    text.textContent = choice;

    var copy = document.createElement("span");
    copy.className = "choice-copy";
    copy.appendChild(labelSpan);
    copy.appendChild(text);

    label.appendChild(input);
    label.appendChild(copy);
    item.appendChild(label);
    choiceList.appendChild(item);
  });

  updateCount();
  updateButtonState();
}

function checkAnswer() {
  if (selectedIndex === null) {
    quizStatus.textContent = "Select Yes or No before checking";
    return false;
  }

  var q = questionBank[currentQI];
  var isCorrect = selectedIndex === q.correctIndex;
  isAnswerChecked = true;
  questionResults[currentQI] = isCorrect;
  quizStatus.textContent = isCorrect ? "Correct!" : "Incorrect";
  renderCurrentQuestion();
  return true;
}

function finalizeQuiz() {
  var level4CorrectCount = questionResults.reduce(function(total, r) {
    return total + (r ? 1 : 0);
  }, 0);

  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({
    correctCount: priorResult.correctCount + level4CorrectCount,
    totalQuestions: priorResult.totalQuestions + questionBank.length
  }));
  window.sessionStorage.removeItem(LEVEL_THREE_RESULT_STORAGE_KEY);
  window.location.href = "results.html";
}

function handleNext() {
  if (questionBank.length === 0) return;

  if (!isAnswerChecked) {
    if (!checkAnswer()) return;
    if (isLast()) return; // stay to show feedback before "See Results"
    return;
  }

  if (isLast()) {
    finalizeQuiz();
    return;
  }

  currentQI++;
  selectedIndex = null;
  isAnswerChecked = false;
  quizStatus.textContent = "Select Yes or No";
  renderCurrentQuestion();
}

choiceList.addEventListener("change", function(event) {
  if (isAnswerChecked) return;
  var input = event.target.closest("input[name='yn-choice']");
  if (!input) return;
  selectedIndex = Number(input.value);
  renderCurrentQuestion();
});

nextButton.addEventListener("click", handleNext);

// ── Practice mode home button ──────────────────────────────
var PRACTICE_MODE_KEY = "az400-practice-mode";
var homeButton = document.getElementById("homeButton");
if (homeButton) {
  var isPracticeMode = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";
  homeButton.hidden = !isPracticeMode;
  homeButton.addEventListener("click", function() {
    window.sessionStorage.setItem("az400-show-level-select", "true");
    window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
    window.location.href = "index.html";
  });
}

// ── Init ───────────────────────────────────────────────────

if (questionBank.length === 0) {
  questionCountEl.textContent = "No Level 4 questions";
  quizStatus.textContent = "Add questions to the bank first";
  nextButton.disabled = true;
} else {
  renderCurrentQuestion();
  quizStatus.textContent = "Select Yes or No";
}
