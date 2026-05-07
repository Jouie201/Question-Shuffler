const DRAG_DROP_STORAGE_KEY = "az400-drag-drop-question-bank";
const LEVEL_ONE_RESULT_STORAGE_KEY = "az400-level-one-result";
const RESULT_STORAGE_KEY = "az400-quiz-result";
const PRACTICE_MODE_KEY = "az400-practice-mode";

const defaultDragDropQuestionBank = [
  {
    layoutType: "standard",
    prompt:
      "Your company wants to use Azure Application Insights to understand how user behaviors affect an application. Which Application Insights tool should you use to analyze each behavior?",
    instructions:
      "Drag the appropriate tools to the correct behaviors. Tools can be used once, more than once, or not at all.",
    options: ["Impact", "User Flows", "Users"],
    targets: [
      "Feature usage",
      "Number of people who used the actions and its features",
      "The effect that the performance of the application has on the usage of a page or a feature"
    ],
    correctMatches: ["User Flows", "Users", "Impact"]
  },
  {
    layoutType: "middle",
    prompt:
      "How should you complete the Azure Monitor query? Drag the appropriate values into the answer area.",
    instructions:
      "Complete the query by selecting the correct operator and aggregation in order.",
    options: [
      "count()",
      "makelist(EventID)",
      "makeset(EventID)",
      "mv-expand",
      "project",
      "render",
      "summarize"
    ],
    targets: [
      "Operator before the aggregation",
      "Aggregation expression by Computer"
    ],
    correctMatches: ["summarize", "makelist(EventID)"]
  },
  {
    layoutType: "standard",
    prompt:
      "You are preparing to deploy an Azure resource group via Terraform. To achieve your goal, you have to install the necessary frameworks. Which frameworks should you use?",
    instructions:
      "Drag the correct frameworks into the answer area.",
    options: ["Yeoman", "Vault", "Terratest", "Tiller"],
    targets: ["Framework 1", "Framework 2"],
    correctMatches: ["Vault", "Terratest"]
  }
];

function cloneDragDropQuestionBank(questionBank) {
  return questionBank.map((question) => ({
    layoutType: question.layoutType || "standard",
    blankLayout: normalizeBlankLayout(question.blankLayout),
    prompt: buildDragQuestionPrompt(question),
    options: [...question.options],
    targets: [...question.targets],
    correctMatches: [...question.correctMatches],
    blankLeftLabels: Array.isArray(question.blankLeftLabels)
      ? [...question.blankLeftLabels]
      : [],
    blankActiveFlags: Array.isArray(question.blankActiveFlags)
      ? [...question.blankActiveFlags]
      : []
  }));
}

function normalizeBlankLayout(blankLayout) {
  return blankLayout === "horizontal" ? "horizontal" : "vertical";
}

function buildDragQuestionPrompt(question) {
  const basePrompt = typeof question.prompt === "string" ? question.prompt.trim() : "";
  const instructions = typeof question.instructions === "string"
    ? question.instructions.trim()
    : "";

  if (!basePrompt) {
    return instructions;
  }

  if (!instructions) {
    return basePrompt;
  }

  return `${basePrompt}\n${instructions}`;
}

function shouldRestoreDefaultBanks() {
  return (
    window.localStorage.getItem("az400-question-bank") === null &&
    window.localStorage.getItem(DRAG_DROP_STORAGE_KEY) === null
  );
}

function loadDragDropQuestionBank() {
  const storedQuestionBank = window.localStorage.getItem(DRAG_DROP_STORAGE_KEY);

  if (storedQuestionBank === null) {
    return shouldRestoreDefaultBanks()
      ? cloneDragDropQuestionBank(defaultDragDropQuestionBank)
      : [];
  }

  try {
    const parsedQuestionBank = JSON.parse(storedQuestionBank);

    if (!Array.isArray(parsedQuestionBank)) {
      return shouldRestoreDefaultBanks()
        ? cloneDragDropQuestionBank(defaultDragDropQuestionBank)
        : [];
    }

    return parsedQuestionBank
      .filter(
        (question) =>
          question &&
          typeof question.prompt === "string" &&
          ["standard", "middle"].includes(question.layoutType || "standard") &&
          Array.isArray(question.options) &&
          Array.isArray(question.targets) &&
          Array.isArray(question.correctMatches)
      )
      .map((question) => ({
        ...question,
        blankLayout: normalizeBlankLayout(question.blankLayout)
      }));
  } catch {
    return shouldRestoreDefaultBanks()
      ? cloneDragDropQuestionBank(defaultDragDropQuestionBank)
      : [];
  }
}

function loadLevelOneResult() {
  const storedResult = window.sessionStorage.getItem(LEVEL_ONE_RESULT_STORAGE_KEY);

  if (!storedResult) {
    return {
      correctCount: 0,
      totalQuestions: 0
    };
  }

  try {
    const parsedResult = JSON.parse(storedResult);

    return {
      correctCount: Number.isFinite(parsedResult.correctCount) ? parsedResult.correctCount : 0,
      totalQuestions: Number.isFinite(parsedResult.totalQuestions)
        ? parsedResult.totalQuestions
        : 0
    };
  } catch {
    return {
      correctCount: 0,
      totalQuestions: 0
    };
  }
}

const RANGE_CONFIG_KEY = "az400-range-config";

function loadRangeConfig() {
  try {
    const raw = window.sessionStorage.getItem(RANGE_CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (!config || typeof config.level !== "string") return null;
    return config;
  } catch {
    return null;
  }
}

function applyRangeToBank(bank, rangeConfig, level) {
  if (!rangeConfig || rangeConfig.level !== level) {
    return shuffleArray(bank);
  }
  window.sessionStorage.removeItem(RANGE_CONFIG_KEY);
  const start = Math.max(0, rangeConfig.start);
  const end = Math.min(bank.length - 1, rangeConfig.end);
  const sliced = bank.slice(start, end + 1);
  return rangeConfig.order === "consecutive" ? sliced : shuffleArray(sliced);
}

const _level2RangeConfig = loadRangeConfig();
const questionBank = applyRangeToBank(loadDragDropQuestionBank(), _level2RangeConfig, "level2");
const levelOneResult = loadLevelOneResult();
const questionCount = document.getElementById("questionCount");
const shuffleStatus = document.getElementById("shuffleStatus");
const shuffleOptionsButton = document.getElementById("shuffleOptionsButton");
const retryButton = document.getElementById("retryButton");
const prevQuestionButton = document.getElementById("prevQuestionButton");
const dragQuestionPrompt = document.getElementById("dragQuestionPrompt");
const dragOptionBank = document.getElementById("dragOptionBank");
const dragTargetList = document.getElementById("dragTargetList");
const nextQuestionButton = document.getElementById("nextQuestionButton");

let currentQuestion = questionBank[0] || null;
let currentQuestionIndex = 0;
let currentOptionOrder = [];
let currentAssignments = [];
let selectedOption = "";
let isAnswerChecked = false;
let dragSourceSlotIndex = null;
const questionResults = new Map();

function shuffleArray(items) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index]
    ];
  }

  return nextItems;
}

function arraysMatch(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function updateQuestionCount() {
  if (!currentQuestion) {
    questionCount.textContent = "Level 2 complete";
    return;
  }

  questionCount.textContent = `Level 2 · Question ${currentQuestionIndex + 1} of ${questionBank.length}`;
}

function updateNextButtonLabel() {
  if (!currentQuestion || currentQuestionIndex === questionBank.length - 1) {
    nextQuestionButton.textContent = "Submit";
    retryButton.disabled = !currentQuestion;
  } else {
    nextQuestionButton.textContent = "Next Question";
    retryButton.disabled = false;
  }
  if (prevQuestionButton && !prevQuestionButton.hidden) {
    prevQuestionButton.disabled = currentQuestionIndex <= 0;
  }
}

function resetQuestionInteraction() {
  currentAssignments = currentQuestion.targets.map(() => "");
  selectedOption = "";
  isAnswerChecked = false;
}

function renderQuestion() {
  if (!currentQuestion) {
    dragQuestionPrompt.textContent = "No drag and drop questions are available.";
    dragOptionBank.innerHTML = "";
    dragTargetList.innerHTML = "";
    updateQuestionCount();
    updateNextButtonLabel();
    return;
  }

  dragQuestionPrompt.textContent = currentQuestion.prompt;
  dragOptionBank.innerHTML = "";
  dragTargetList.innerHTML = "";
  dragTargetList.className = [
    "drag-target-list",
    currentQuestion.layoutType === "middle" ? "drag-target-list-middle" : "",
    currentQuestion.blankLayout === "horizontal"
      ? "drag-target-list-horizontal"
      : "drag-target-list-vertical"
  ]
    .filter(Boolean)
    .join(" ");

  currentOptionOrder.forEach((option) => {
    // Hide chips that are already placed in a slot (unless answer is checked —
    // then show everything so results are visible in the answer area only)
    if (!isAnswerChecked && currentAssignments.includes(option)) {
      return;
    }

    const chip = document.createElement("button");
    chip.className = "drag-option-chip";
    chip.type = "button";
    chip.dataset.option = option;
    chip.draggable = !isAnswerChecked;
    chip.textContent = option;

    if (selectedOption === option && !isAnswerChecked) {
      chip.classList.add("is-selected");
    }

    if (isAnswerChecked) {
      chip.disabled = true;
    }

    dragOptionBank.appendChild(chip);
  });

  currentQuestion.targets.forEach((target, index) => {
    const row = document.createElement("div");
    row.className = [
      "drag-target-row",
      currentQuestion.layoutType === "middle" ? "drag-target-row-middle" : "",
      currentQuestion.blankLayout === "horizontal"
        ? "drag-target-row-horizontal"
        : "drag-target-row-vertical"
    ]
      .filter(Boolean)
      .join(" ");

    const label = document.createElement("p");
    label.className = "drag-target-label";

    const leftLabelText = currentQuestion.blankLeftLabels &&
      currentQuestion.blankLeftLabels[index];
    const isBlankActive = !Array.isArray(currentQuestion.blankActiveFlags) ||
      currentQuestion.blankActiveFlags.length === 0 ||
      currentQuestion.blankActiveFlags[index] === true;

    // Use the saved left sentence as the label only if this blank is active
    label.textContent = (isBlankActive && leftLabelText) ? leftLabelText : target;

    const slot = document.createElement("button");
    slot.className = "drag-target-slot";
    slot.type = "button";
    slot.dataset.targetIndex = String(index);

    const assignedOption = currentAssignments[index];

    if (assignedOption) {
      slot.classList.add("is-filled");
      slot.textContent = assignedOption;
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "drag-placeholder";
      placeholder.textContent = "Drop answer here";
      slot.appendChild(placeholder);
    }

    if (isAnswerChecked) {
      slot.disabled = true;
      slot.classList.add(
        assignedOption === currentQuestion.correctMatches[index]
          ? "is-correct"
          : "is-incorrect"
      );
    }

    if (assignedOption && !isAnswerChecked) {
      slot.draggable = true;
    }

    row.append(label, slot);

    if (isAnswerChecked && assignedOption !== currentQuestion.correctMatches[index]) {
      const correctHint = document.createElement("p");
      correctHint.className = "drag-correct-hint";
      correctHint.textContent = "Correct answer: " + currentQuestion.correctMatches[index];
      row.appendChild(correctHint);
    }

    dragTargetList.appendChild(row);
  });

  updateQuestionCount();
  updateNextButtonLabel();
}

function loadQuestion(index) {
  currentQuestionIndex = index;
  currentQuestion = questionBank[index] || null;

  if (!currentQuestion) {
    renderQuestion();
    return;
  }

  currentOptionOrder = shuffleArray(currentQuestion.options);
  resetQuestionInteraction();
  renderQuestion();
}

function shuffleOptions() {
  if (!currentQuestion || isAnswerChecked) {
    return;
  }

  currentOptionOrder = shuffleArray(currentOptionOrder);
  selectedOption = "";
  shuffleStatus.textContent = "Options shuffled";
  renderQuestion();
}

function retryCurrentQuestion() {
  if (!currentQuestion) {
    return;
  }

  currentOptionOrder = shuffleArray(currentQuestion.options);
  resetQuestionInteraction();
  shuffleStatus.textContent = "Question reset — try again";
  renderQuestion();
}

function assignOptionToTarget(targetIndex, option) {
  currentAssignments[targetIndex] = option;
  selectedOption = "";
  shuffleStatus.textContent = "Answer slot updated";
  renderQuestion();
}

function handleOptionClick(event) {
  if (isAnswerChecked) {
    return;
  }

  const chip = event.target.closest(".drag-option-chip");

  if (!chip) {
    return;
  }

  selectedOption = selectedOption === chip.dataset.option ? "" : chip.dataset.option;
  renderQuestion();
}

function handleOptionDragStart(event) {
  const chip = event.target.closest(".drag-option-chip");

  if (!chip || isAnswerChecked) {
    return;
  }

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("text/plain", chip.dataset.option);
  selectedOption = chip.dataset.option;
}

function handleSlotDragStart(event) {
  const slot = event.target.closest(".drag-target-slot");

  if (!slot || isAnswerChecked) {
    return;
  }

  const targetIndex = Number(slot.dataset.targetIndex);
  const assigned = currentAssignments[targetIndex];

  if (!assigned) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", assigned);
  dragSourceSlotIndex = targetIndex;
  selectedOption = assigned;
}

function handleSlotDragEnd() {
  // Drag was cancelled or dropped somewhere invalid — restore state
  if (dragSourceSlotIndex !== null) {
    dragSourceSlotIndex = null;
    selectedOption = "";
    renderQuestion();
  }
}

function handleBankDragOver(event) {
  if (dragSourceSlotIndex !== null && !isAnswerChecked) {
    event.preventDefault();
  }
}

function handleBankDrop(event) {
  if (isAnswerChecked || dragSourceSlotIndex === null) {
    return;
  }

  event.preventDefault();
  currentAssignments[dragSourceSlotIndex] = "";
  dragSourceSlotIndex = null;
  selectedOption = "";
  shuffleStatus.textContent = "Option returned to bank";
  renderQuestion();
}

function handleTargetClick(event) {
  if (!currentQuestion || isAnswerChecked) {
    return;
  }

  const slot = event.target.closest(".drag-target-slot");

  if (!slot) {
    return;
  }

  const targetIndex = Number(slot.dataset.targetIndex);

  if (selectedOption) {
    assignOptionToTarget(targetIndex, selectedOption);
    return;
  }

  // Click on a filled slot with no pending selection — return it to the bank
  if (currentAssignments[targetIndex]) {
    currentAssignments[targetIndex] = "";
    shuffleStatus.textContent = "Option returned to bank";
    renderQuestion();
  }
}

function handleTargetDragOver(event) {
  const slot = event.target.closest(".drag-target-slot");

  if (!slot || isAnswerChecked) {
    return;
  }

  event.preventDefault();
  slot.classList.add("is-drag-over");
}

function handleTargetDragLeave(event) {
  const slot = event.target.closest(".drag-target-slot");

  if (!slot) {
    return;
  }

  slot.classList.remove("is-drag-over");
}

function handleTargetDrop(event) {
  const slot = event.target.closest(".drag-target-slot");

  if (!slot || isAnswerChecked) {
    return;
  }

  event.preventDefault();
  slot.classList.remove("is-drag-over");
  const option = event.dataTransfer.getData("text/plain");

  if (!option) {
    return;
  }

  const targetIndex = Number(slot.dataset.targetIndex);

  // If dragging from another slot, vacate the source first
  if (dragSourceSlotIndex !== null && dragSourceSlotIndex !== targetIndex) {
    currentAssignments[dragSourceSlotIndex] = "";
  }
  dragSourceSlotIndex = null;

  assignOptionToTarget(targetIndex, option);
}

function checkAnswer() {
  if (!currentQuestion) {
    return true;
  }

  if (currentAssignments.some((assignment) => !assignment)) {
    shuffleStatus.textContent = "Fill every answer slot before submitting";
    return false;
  }

  const isCorrect = arraysMatch(currentAssignments, currentQuestion.correctMatches);
  isAnswerChecked = true;
  questionResults.set(currentQuestion, isCorrect);
  shuffleStatus.textContent = isCorrect ? "Correct answer" : "Incorrect answer";
  renderQuestion();
  return true;
}

function finalizeQuiz() {
  const levelTwoCorrectCount = questionBank.reduce((total, question) => {
    return total + (questionResults.get(question) ? 1 : 0);
  }, 0);

  const combined = {
    correctCount: levelOneResult.correctCount + levelTwoCorrectCount,
    totalQuestions: levelOneResult.totalQuestions + questionBank.length
  };

  let hasLevel3 = false;
  try {
    const stored = window.localStorage.getItem("az400-level3-question-bank");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      hasLevel3 = Array.isArray(parsed) && parsed.length > 0;
    }
  } catch {
    hasLevel3 = false;
  }

  let hasLevel4 = false;
  try {
    const stored4 = window.localStorage.getItem("az400-level4-question-bank");
    if (stored4 !== null) {
      const parsed4 = JSON.parse(stored4);
      hasLevel4 = Array.isArray(parsed4) && parsed4.length > 0;
    }
  } catch {
    hasLevel4 = false;
  }

  const examMode = window.sessionStorage.getItem("az400-exam-mode") || "combined";

  if (examMode === "combined") {
    if (hasLevel3) {
      window.sessionStorage.setItem("az400-level-two-result", JSON.stringify(combined));
      window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
      window.location.href = "level3.html";
      return;
    }

    if (hasLevel4) {
      window.sessionStorage.setItem("az400-level-three-result", JSON.stringify(combined));
      window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
      window.location.href = "level4.html";
      return;
    }
  }

  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(combined));
  window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
  window.location.href = "results.html";
}

function goToNextQuestion() {
  if (!currentQuestion) {
    finalizeQuiz();
    return;
  }

  if (!isAnswerChecked) {
    if (!checkAnswer()) {
      return;
    }

    return;
  }

  if (currentQuestionIndex === questionBank.length - 1) {
    finalizeQuiz();
    return;
  }

  loadQuestion(currentQuestionIndex + 1);
  shuffleStatus.textContent = "Next question loaded";
}

dragOptionBank.addEventListener("click", handleOptionClick);
dragOptionBank.addEventListener("dragstart", handleOptionDragStart);
dragOptionBank.addEventListener("dragover", handleBankDragOver);
dragOptionBank.addEventListener("drop", handleBankDrop);
dragTargetList.addEventListener("click", handleTargetClick);
dragTargetList.addEventListener("dragstart", handleSlotDragStart);
dragTargetList.addEventListener("dragend", handleSlotDragEnd);
dragTargetList.addEventListener("dragover", handleTargetDragOver);
dragTargetList.addEventListener("dragleave", handleTargetDragLeave);
dragTargetList.addEventListener("drop", handleTargetDrop);
shuffleOptionsButton.addEventListener("click", shuffleOptions);
retryButton.addEventListener("click", retryCurrentQuestion);
nextQuestionButton.addEventListener("click", goToNextQuestion);

if (prevQuestionButton) {
  const isPracticeMode = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";
  prevQuestionButton.hidden = !isPracticeMode;
  prevQuestionButton.addEventListener("click", function goToPreviousQuestion() {
    if (currentQuestionIndex <= 0) return;
    const prevIndex = currentQuestionIndex - 1;
    questionResults.delete(questionBank[prevIndex]);
    loadQuestion(prevIndex);
    shuffleStatus.textContent = "Previous question";
  });
}

const homeButton = document.getElementById("homeButton");
if (homeButton) {
  const isPracticeMode = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";
  homeButton.hidden = !isPracticeMode;
  homeButton.addEventListener("click", function() {
    window.sessionStorage.setItem("az400-show-level-select", "true");
    window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
    window.location.href = "index.html";
  });
}

if (questionBank.length === 0) {
  finalizeQuiz();
} else {
  loadQuestion(0);
}
