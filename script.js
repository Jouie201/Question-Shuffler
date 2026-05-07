const STORAGE_KEY = "az400-question-bank";
const DRAG_DROP_STORAGE_KEY = "az400-drag-drop-question-bank";
const LEVEL3_STORAGE_KEY = "az400-level3-question-bank";
const LEVEL4_STORAGE_KEY = "az400-level4-question-bank";
const LEVEL_ONE_RESULT_STORAGE_KEY = "az400-level-one-result";
const LEVEL_TWO_RESULT_STORAGE_KEY = "az400-level-two-result";
const LEVEL_THREE_RESULT_STORAGE_KEY = "az400-level-three-result";
const RESULT_STORAGE_KEY = "az400-quiz-result";
const EXAM_MODE_KEY = "az400-exam-mode";
const RANGE_CONFIG_KEY = "az400-range-config";
const PRACTICE_MODE_KEY = "az400-practice-mode";

const defaultQuestionBank = [
  {
    prompt:
      "You have an Azure DevOps organization named Contoso that contains a project named Project1.\nYou provision an Azure key vault named Keyvault1.\nYou need to reference Keyvault1 secrets in a build pipeline of Project1.\nWhat should you do first?",
    choices: [
      "Add a secure file to Project1.",
      "Create a YAML build service.",
      "Create a variable group in Project1.",
      "Configure the security policy of Contoso."
    ],
    correctIndices: [2]
  },
  {
    prompt:
      "You need to deploy an Azure Resource Manager template from Azure DevOps.\nThe deployment must use a reusable connection to an Azure subscription.\nWhat should you create?",
    choices: [
      "A deployment group",
      "An Azure Resource Manager service connection",
      "A secure file library entry",
      "A self-hosted agent pool"
    ],
    correctIndices: [1]
  },
  {
    prompt:
      "You are configuring a pipeline that signs application packages with a certificate stored in Azure Key Vault.\nYou need the pipeline to retrieve the certificate securely during the run.\nWhat should you configure in the key vault?",
    choices: [
      "A purge protection lock only",
      "A storage account firewall rule",
      "An access policy for the pipeline identity",
      "A private DNS zone"
    ],
    correctIndices: [2]
  },
  {
    prompt:
      "You need to centralize a set of secrets and make them available to several Azure DevOps pipelines.\nWhat Azure DevOps feature should you use together with Azure Key Vault?",
    choices: [
      "A variable group linked to Key Vault",
      "A wiki page with secret references",
      "A build tag",
      "A test plan"
    ],
    correctIndices: [0]
  }
];

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

function cloneQuestionBank(questionBank) {
  return questionBank.map((question) => ({
    prompt: question.prompt,
    choices: [...question.choices],
    correctIndices: [...question.correctIndices]
  }));
}

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
    window.localStorage.getItem(STORAGE_KEY) === null &&
    window.localStorage.getItem(DRAG_DROP_STORAGE_KEY) === null
  );
}

function loadQuestionBank() {
  const storedQuestionBank = window.localStorage.getItem(STORAGE_KEY);

  if (storedQuestionBank === null) {
    return shouldRestoreDefaultBanks() ? cloneQuestionBank(defaultQuestionBank) : [];
  }

  try {
    const parsedQuestionBank = JSON.parse(storedQuestionBank);

    if (!Array.isArray(parsedQuestionBank)) {
      return shouldRestoreDefaultBanks() ? cloneQuestionBank(defaultQuestionBank) : [];
    }

    const filteredQuestionBank = parsedQuestionBank.filter(
      (question) =>
        question &&
        typeof question.prompt === "string" &&
        Array.isArray(question.choices) &&
        Array.isArray(question.correctIndices)
    );

    return filteredQuestionBank;
  } catch {
    return shouldRestoreDefaultBanks() ? cloneQuestionBank(defaultQuestionBank) : [];
  }
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

function loadLevel3QuestionBank() {
  const stored = window.localStorage.getItem(LEVEL3_STORAGE_KEY);

  if (stored === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (question) =>
        question &&
        typeof question.prompt === "string" &&
        Array.isArray(question.blanks) &&
        question.blanks.length >= 1 &&
        question.blanks.every(
          (b) => Array.isArray(b.choices) && b.choices.length >= 2 && typeof b.correctIndex === "number"
        )
    );
  } catch {
    return [];
  }
}

function loadLevel4QuestionBank() {
  const stored = window.localStorage.getItem(LEVEL4_STORAGE_KEY);

  if (stored === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (question) =>
        question &&
        typeof question.prompt === "string" &&
        (question.correctIndex === 0 || question.correctIndex === 1)
    );
  } catch {
    return [];
  }
}

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

const _level1RangeConfig = loadRangeConfig();
const questionBank = applyRangeToBank(loadQuestionBank(), _level1RangeConfig, "level1");
const dragDropQuestionBank = loadDragDropQuestionBank();
const level3QuestionBank = loadLevel3QuestionBank();
const level4QuestionBank = loadLevel4QuestionBank();

function persistQuestionBank() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(questionBank));
}

function persistDragDropQuestionBank() {
  window.localStorage.setItem(
    DRAG_DROP_STORAGE_KEY,
    JSON.stringify(dragDropQuestionBank)
  );
}

function persistLevel3QuestionBank() {
  window.localStorage.setItem(LEVEL3_STORAGE_KEY, JSON.stringify(level3QuestionBank));
}

function persistLevel4QuestionBank() {
  window.localStorage.setItem(LEVEL4_STORAGE_KEY, JSON.stringify(level4QuestionBank));
}

const questionCount = document.getElementById("questionCount");
const shuffleStatus = document.getElementById("shuffleStatus");
const shuffleButton = document.getElementById("shuffleButton");
const addQuestionButton = document.getElementById("addQuestionButton");
const savedQuestionsButton = document.getElementById("savedQuestionsButton");
const bankFormPanel = document.getElementById("bankFormPanel");
const savedBankPanel = document.getElementById("savedBankPanel");
const questionForm = document.getElementById("questionForm");
const dragQuestionForm = document.getElementById("dragQuestionForm");
const savedQuestionList = document.getElementById("savedQuestionList");
const toggleSavedListButton = document.getElementById("toggleSavedListButton");
const quizPanel = document.getElementById("quizPanel");
const levelSelectorPanel = document.getElementById("levelSelectorPanel");
const questionPrompt = document.getElementById("questionPrompt");
const choiceList = document.getElementById("choiceList");
const nextQuestionButton = document.getElementById("nextQuestionButton");
const prevQuestionButton = document.getElementById("prevQuestionButton");
const retryButton = document.getElementById("retryButton");
const examHeader = document.getElementById("examHeader");
const homeButton = document.getElementById("homeButton");
const questionPromptInput = document.getElementById("questionPromptInput");
const choicesInput = document.getElementById("choicesInput");
const answerInput = document.getElementById("answerInput");
const dragLayoutTypeInput = document.getElementById("dragLayoutTypeInput");
const dragBlankLayoutInput = document.getElementById("dragBlankLayoutInput");
const dragPromptInput = document.getElementById("dragPromptInput");
const dragChoicesInput = document.getElementById("dragChoicesInput");
const dragAnswersInput = document.getElementById("dragAnswersInput");
const standardDragFields = document.getElementById("standardDragFields");
const middleDragFields = document.getElementById("middleDragFields");
const dragMiddleAnswersInput = document.getElementById("dragMiddleAnswersInput");
const dragLeftLabel1Input = document.getElementById("dragLeftLabel1Input");
const dragLeftLabel2Input = document.getElementById("dragLeftLabel2Input");
const dragLeftLabel3Input = document.getElementById("dragLeftLabel3Input");
const dragLeftLabel4Input = document.getElementById("dragLeftLabel4Input");
const dragLeftLabel5Input = document.getElementById("dragLeftLabel5Input");
const level3QuestionForm = document.getElementById("level3QuestionForm");
const level4QuestionForm = document.getElementById("level4QuestionForm");
const level4PromptInput = document.getElementById("level4PromptInput");
const level4AnswerInput = document.getElementById("level4AnswerInput");
const level4FormNotice = document.getElementById("level4FormNotice");
const level3Seg0Input = document.getElementById("level3Seg0Input");
const level3Choices1Input = document.getElementById("level3Choices1Input");
const level3Answer1Input = document.getElementById("level3Answer1Input");
const level3Choices2Input = document.getElementById("level3Choices2Input");
const level3Answer2Input = document.getElementById("level3Answer2Input");
const level3Choices3Input = document.getElementById("level3Choices3Input");
const level3Answer3Input = document.getElementById("level3Answer3Input");
const level3BlankSentence1Input = document.getElementById("level3BlankSentence1Input");
const level3BlankSentence2Input = document.getElementById("level3BlankSentence2Input");
const level3BlankSentence3Input = document.getElementById("level3BlankSentence3Input");
const level3BlankSide1Input = document.getElementById("level3BlankSide1Input");
const level3BlankSide2Input = document.getElementById("level3BlankSide2Input");
const level3BlankSide3Input = document.getElementById("level3BlankSide3Input");
const level3BlankVSentence1Input = document.getElementById("level3BlankVSentence1Input");
const level3BlankVSentence2Input = document.getElementById("level3BlankVSentence2Input");
const level3BlankVSentence3Input = document.getElementById("level3BlankVSentence3Input");
const level3BlankVSide1Input = document.getElementById("level3BlankVSide1Input");
const level3BlankVSide2Input = document.getElementById("level3BlankVSide2Input");
const level3BlankVSide3Input = document.getElementById("level3BlankVSide3Input");
const questionFormNotice = document.getElementById("questionFormNotice");
const dragFormNotice = document.getElementById("dragFormNotice");
const level3FormNotice = document.getElementById("level3FormNotice");

function showFormNotice(el, msg) {
  el.textContent = msg;
  el.removeAttribute("hidden");
}

function clearFormNotice(el) {
  el.textContent = "";
  el.setAttribute("hidden", "");
}

let currentQuestion = questionBank[0] || null;
let currentChoiceOrder = [];
let selectedChoiceIndices = [];
let isAnswerChecked = false;
const questionResults = new Map();

function getChoiceLabel(index) {
  return String.fromCharCode(65 + index);
}

function updateQuestionCount() {
  const totalQuestionCount = questionBank.length + dragDropQuestionBank.length + level3QuestionBank.length + level4QuestionBank.length;
  questionCount.textContent = `${totalQuestionCount} questions in bank`;
}

function isLastQuestion() {
  if (!currentQuestion || questionBank.length === 0) {
    return true;
  }

  return questionBank.indexOf(currentQuestion) === questionBank.length - 1;
}

function updateNextButtonLabel() {
  nextQuestionButton.textContent = isLastQuestion() ? "Submit" : "Next Question";
  if (prevQuestionButton && !prevQuestionButton.hidden) {
    const idx = currentQuestion ? questionBank.indexOf(currentQuestion) : -1;
    prevQuestionButton.disabled = idx <= 0;
  }
}

function createSavedQuestionItem(question, index, type) {
  const item = document.createElement("article");
  item.className = "saved-question-item";

  if (type === "multiple-choice" && question === currentQuestion) {
    item.classList.add("is-active");
  }

  const copy = document.createElement("div");
  copy.className = "saved-question-copy";

  const header = document.createElement("div");
  header.className = "saved-question-header";

  const typeBadge = document.createElement("span");
  typeBadge.className = "saved-question-type";
  typeBadge.textContent = type === "multiple-choice" ? "Level 1" : type === "drag-drop" ? "Level 2" : type === "dropdown" ? "Level 3" : "Level 4";

  const label = document.createElement("p");
  label.className = "saved-question-label";
  label.textContent = `Question ${index + 1}`;

  const text = document.createElement("p");
  text.className = "saved-question-text";
  text.textContent = question.prompt;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.index = String(index);
  deleteButton.dataset.type = type;
  deleteButton.textContent = "Delete";

  header.append(typeBadge, label);
  copy.append(header, text);

  if (type === "drag-drop" || type === "dropdown") {
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.dataset.index = String(index);
    editButton.dataset.type = type;
    editButton.textContent = "Edit";
    item.append(copy, editButton, deleteButton);
  } else {
    item.append(copy, deleteButton);
  }

  return item;
}

function appendSavedQuestionGroup(container, title, questions, type) {
  if (questions.length === 0) {
    return;
  }

  const group = document.createElement("section");
  group.className = "saved-question-group";

  const heading = document.createElement("h3");
  heading.className = "saved-group-title";
  heading.textContent = title;

  group.appendChild(heading);

  questions.forEach((question, index) => {
    group.appendChild(createSavedQuestionItem(question, index, type));
  });

  container.appendChild(group);
}

function renderSavedQuestions() {
  const totalQuestionCount = questionBank.length + dragDropQuestionBank.length + level3QuestionBank.length + level4QuestionBank.length;

  savedQuestionList.innerHTML = "";
  savedQuestionList.classList.toggle("is-scrollable", totalQuestionCount > 5);

  if (totalQuestionCount === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-bank-state";
    emptyState.textContent = "No saved questions in the bank yet.";
    savedQuestionList.appendChild(emptyState);
    return;
  }

  appendSavedQuestionGroup(
    savedQuestionList,
    "Level 1: Multiple Choice",
    questionBank,
    "multiple-choice"
  );
  appendSavedQuestionGroup(
    savedQuestionList,
    "Level 2: Drag and Drop",
    dragDropQuestionBank,
    "drag-drop"
  );
  appendSavedQuestionGroup(
    savedQuestionList,
    "Level 3: Dropdown",
    level3QuestionBank,
    "dropdown"
  );
  appendSavedQuestionGroup(
    savedQuestionList,
    "Level 4: Yes or No",
    level4QuestionBank,
    "yes-no"
  );
}

function renderQuestion(question) {
  if (!question) {
    questionPrompt.textContent = "No multiple-choice questions are available in the bank.";
    choiceList.innerHTML = "";
    updateQuestionCount();
    renderSavedQuestions();
    nextQuestionButton.textContent = dragDropQuestionBank.length > 0
      ? "Start Level 2"
      : level3QuestionBank.length > 0
      ? "Start Level 3"
      : level4QuestionBank.length > 0
      ? "Start Level 4"
      : "Submit";
    return;
  }

  questionPrompt.textContent = question.prompt;
  choiceList.innerHTML = "";
  const isMultipleAnswer = question.correctIndices.length > 1;
  const normalizedSelected = [...selectedChoiceIndices].sort((left, right) => left - right);
  const normalizedCorrect = [...question.correctIndices].sort((left, right) => left - right);

  currentChoiceOrder.forEach((choiceIndex, index) => {
    const choice = question.choices[choiceIndex];
    const item = document.createElement("li");
    item.className = "choice-item";
    item.dataset.choiceIndex = String(choiceIndex);

    if (selectedChoiceIndices.includes(choiceIndex)) {
      item.classList.add("is-selected");
    }

    if (isAnswerChecked) {
      if (normalizedCorrect.includes(choiceIndex)) {
        item.classList.add("is-correct");
      } else if (normalizedSelected.includes(choiceIndex)) {
        item.classList.add("is-incorrect");
      }
    }

    const option = document.createElement("label");
    option.className = "choice-option";

    const input = document.createElement("input");
    input.type = isMultipleAnswer ? "checkbox" : "radio";
    input.name = "question-choice";
    input.value = String(choiceIndex);
    input.checked = selectedChoiceIndices.includes(choiceIndex);
    input.disabled = isAnswerChecked;

    if (isAnswerChecked) {
      item.classList.add("is-locked");
    }

    const label = document.createElement("span");
    label.className = "choice-label";
    label.textContent = `${getChoiceLabel(index)}.`;

    const text = document.createElement("span");
    text.textContent = choice;

    const copy = document.createElement("span");
    copy.className = "choice-copy";
    copy.append(label, text);

    option.append(input, copy);
    item.appendChild(option);
    choiceList.appendChild(item);
  });

  updateQuestionCount();
  renderSavedQuestions();
  updateNextButtonLabel();
}

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

function shuffleChoices() {
  currentChoiceOrder = shuffleArray(currentChoiceOrder);
  selectedChoiceIndices = [];
  shuffleStatus.textContent = "Choices shuffled";
  renderQuestion(currentQuestion);
}

function showQuizView() {
  bankFormPanel.classList.add("is-hidden");
  savedBankPanel.classList.add("is-hidden");
  levelSelectorPanel.classList.add("is-hidden");
  quizPanel.classList.remove("is-hidden");
  addQuestionButton.setAttribute("aria-expanded", "false");
  savedQuestionsButton.setAttribute("aria-expanded", "false");
}

function showBankManagerView() {
  bankFormPanel.classList.remove("is-hidden");
  savedBankPanel.classList.remove("is-hidden");
  savedQuestionList.classList.add("is-collapsed");
  levelSelectorPanel.classList.add("is-hidden");
  quizPanel.classList.add("is-hidden");
  addQuestionButton.setAttribute("aria-expanded", "true");
  savedQuestionsButton.setAttribute("aria-expanded", "false");
  toggleSavedListButton.textContent = "Show Saved Questions";
  toggleSavedListButton.setAttribute("aria-expanded", "false");
}

function toggleSavedQuestionList() {
  const isCollapsed = savedQuestionList.classList.toggle("is-collapsed");
  toggleSavedListButton.textContent = isCollapsed
    ? "Show Saved Questions"
    : "Hide Saved Questions";
  toggleSavedListButton.setAttribute("aria-expanded", String(!isCollapsed));
}

function toggleBankForm() {
  if (bankFormPanel.classList.contains("is-hidden")) {
    showBankManagerView();
    questionPromptInput.focus();
    return;
  }

  showQuizView();
}

function toggleSavedQuestions() {
  bankFormPanel.classList.add("is-hidden");
  savedBankPanel.classList.add("is-hidden");
  quizPanel.classList.add("is-hidden");
  levelSelectorPanel.classList.remove("is-hidden");
  savedQuestionsButton.setAttribute("aria-expanded", "true");
  addQuestionButton.setAttribute("aria-expanded", "false");
}

function startExam(mode) {
  window.sessionStorage.setItem(EXAM_MODE_KEY, mode);
  window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
  window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(LEVEL_TWO_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(LEVEL_THREE_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(RESULT_STORAGE_KEY);

  if (mode === "level2") {
    window.location.href = "level2.html";
    return;
  }
  if (mode === "level3") {
    window.location.href = "level3.html";
    return;
  }
  if (mode === "level4") {
    window.location.href = "level4.html";
    return;
  }
  // level1 or combined: start from Level 1 quiz
  showQuizView();
}

function syncDragFormVariant() {
  const isMiddleLayout = dragLayoutTypeInput.value === "middle";

  standardDragFields.classList.toggle("is-hidden", isMiddleLayout);
  middleDragFields.classList.toggle("is-hidden", !isMiddleLayout);
  dragAnswersInput.required = !isMiddleLayout;
  dragMiddleAnswersInput.required = isMiddleLayout;
}
// ── Blank indicator click toggle (Add form) ──────────────
function getDragCorrectCount() {
  const isMiddle = dragLayoutTypeInput.value === "middle";
  return (isMiddle ? dragMiddleAnswersInput : dragAnswersInput)
    .value.split("\n").filter(l => l.trim()).length;
}

function updateDragIndicatorLimits() {
  const limit = getDragCorrectCount();
  const indicators = document.querySelectorAll("#dragBlankLabelRows .blank-pos-indicator");
  let activeCount = 0;
  // First pass: count actives
  indicators.forEach(el => { if (el.classList.contains("is-active")) activeCount++; });
  // If actives exceed new limit, deactivate from the end
  if (activeCount > limit) {
    let toRemove = activeCount - limit;
    for (let i = indicators.length - 1; i >= 0 && toRemove > 0; i--) {
      if (indicators[i].classList.contains("is-active")) {
        indicators[i].classList.remove("is-active");
        toRemove--;
      }
    }
    activeCount = limit;
  }
  // Second pass: mark at-limit on inactive indicators when cap is reached
  indicators.forEach(el => {
    const isActive = el.classList.contains("is-active");
    el.classList.toggle("is-at-limit", !isActive && activeCount >= limit && limit > 0);
  });
}

dragAnswersInput.addEventListener("input", updateDragIndicatorLimits);
dragMiddleAnswersInput.addEventListener("input", updateDragIndicatorLimits);
dragLayoutTypeInput.addEventListener("change", updateDragIndicatorLimits);

document.getElementById("dragBlankLabelRows").addEventListener("click", function(e) {
  const indicator = e.target.closest(".blank-pos-indicator");
  if (!indicator) return;
  const isActive = indicator.classList.contains("is-active");
  if (!isActive) {
    // Trying to activate — check limit
    const limit = getDragCorrectCount();
    const currentActive = document.querySelectorAll("#dragBlankLabelRows .blank-pos-indicator.is-active").length;
    if (limit === 0 || currentActive >= limit) return; // blocked
  }
  indicator.classList.toggle("is-active");
  updateDragIndicatorLimits();
});
document.getElementById("dragBlankLabelRows").addEventListener("keydown", function(e) {
  if (e.key === "Enter" || e.key === " ") {
    const indicator = e.target.closest(".blank-pos-indicator");
    if (!indicator) return;
    e.preventDefault();
    const isActive = indicator.classList.contains("is-active");
    if (!isActive) {
      const limit = getDragCorrectCount();
      const currentActive = document.querySelectorAll("#dragBlankLabelRows .blank-pos-indicator.is-active").length;
      if (limit === 0 || currentActive >= limit) return;
    }
    indicator.classList.toggle("is-active");
    updateDragIndicatorLimits();
  }
});

function resetDragBlankIndicators() {
  document.querySelectorAll("#dragBlankLabelRows .blank-pos-indicator")
    .forEach(el => { el.classList.remove("is-active"); el.classList.remove("is-at-limit"); });
}

function resetChoiceOrder(question) {
  currentChoiceOrder = question.choices.map((_, index) => index);
}

function arraysMatch(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function resetQuestionInteraction() {
  selectedChoiceIndices = [];
  isAnswerChecked = false;
}

function loadQuestion(question, options = {}) {
  const { shuffleChoicesOnLoad = true } = options;

  currentQuestion = question;

  if (!currentQuestion) {
    resetQuestionInteraction();
    currentChoiceOrder = [];
    renderQuestion(currentQuestion);
    return;
  }

  resetQuestionInteraction();
  resetChoiceOrder(currentQuestion);

  if (shuffleChoicesOnLoad) {
    currentChoiceOrder = shuffleArray(currentChoiceOrder);
  }

  renderQuestion(currentQuestion);
}

function normalizeChoiceLine(line) {
  return line
    .trim()
    .replace(/^([A-Z]|\d+)[\).:-]\s*/i, "")
    .replace(/^[-*]\s*/, "");
}

function parseChoices(rawChoices) {
  return rawChoices
    .split(/\r?\n/)
    .map(normalizeChoiceLine)
    .filter(Boolean);
}

function parseCorrectAnswers(rawAnswers, choiceCount) {
  const labels = (rawAnswers.toUpperCase().match(/[A-Z]/g) || []).map(
    (letter) => letter.charCodeAt(0) - 65
  );

  return [...new Set(labels)].filter((index) => index >= 0 && index < choiceCount);
}

function pickRandomQuestion() {
  if (questionBank.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * questionBank.length);
  return questionBank[randomIndex];
}

function normalizeMatchValue(value) {
  return value.trim().toLowerCase();
}

function findMatchingOption(options, rawValue) {
  const normalizedValue = normalizeMatchValue(rawValue);

  return (
    options.find((option) => normalizeMatchValue(option) === normalizedValue) || null
  );
}

function buildBlankTargets(correctMatchCount) {
  return Array.from({ length: correctMatchCount }, (_, index) => `Blank ${index + 1}`);
}

function handleAddQuestion(event) {
  event.preventDefault();

  const prompt = questionPromptInput.value.trim();
  const parsedChoices = parseChoices(choicesInput.value);
  const parsedCorrectIndices = parseCorrectAnswers(
    answerInput.value,
    parsedChoices.length
  );

  if (!prompt) {
    showFormNotice(questionFormNotice, "Enter a question prompt before saving.");
    questionPromptInput.focus();
    return;
  }

  if (parsedChoices.length < 2) {
    showFormNotice(questionFormNotice, "Add at least two choices before saving.");
    choicesInput.focus();
    return;
  }

  if (parsedCorrectIndices.length === 0) {
    showFormNotice(questionFormNotice, "Enter at least one valid correct answer letter (e.g. A, C).");
    answerInput.focus();
    return;
  }

  questionBank.push({
    prompt,
    choices: parsedChoices,
    correctIndices: parsedCorrectIndices
  });

  persistQuestionBank();
  loadQuestion(pickRandomQuestion());
  shuffleStatus.textContent = "Question bank updated and random question loaded";
  clearFormNotice(questionFormNotice);
  showBankManagerView();
  questionForm.reset();
  questionPromptInput.focus();
}

function handleAddDragQuestion(event) {
  event.preventDefault();

  const layoutType = dragLayoutTypeInput.value;
  const blankLayout = normalizeBlankLayout(dragBlankLayoutInput.value);
  const prompt = dragPromptInput.value.trim();
  const parsedOptions = parseChoices(dragChoicesInput.value);
  const parsedCorrectMatches = parseChoices(
    layoutType === "middle" ? dragMiddleAnswersInput.value : dragAnswersInput.value
  );
  const correctAnswerCount = parsedCorrectMatches.length;
  const rawLeftLabels = [
    dragLeftLabel1Input.value.trim(),
    dragLeftLabel2Input.value.trim(),
    dragLeftLabel3Input.value.trim(),
    dragLeftLabel4Input.value.trim(),
    dragLeftLabel5Input.value.trim()
  ];
  const blankActiveFlags = Array.from(
    document.querySelectorAll("#dragBlankLabelRows .blank-pos-indicator")
  ).map(el => el.classList.contains("is-active"));

  if (!prompt) {
    showFormNotice(dragFormNotice, "Enter a question prompt before saving.");
    dragPromptInput.focus();
    return;
  }

  if (parsedOptions.length < 2) {
    showFormNotice(dragFormNotice, "Add at least two draggable options before saving.");
    dragChoicesInput.focus();
    return;
  }

  if (parsedCorrectMatches.length === 0) {
    showFormNotice(dragFormNotice, "Add at least one correct match before saving.");
    if (layoutType === "middle") {
      dragMiddleAnswersInput.focus();
    } else {
      dragAnswersInput.focus();
    }
    return;
  }

  const parsedTargets = buildBlankTargets(correctAnswerCount);

  const matchedCorrectMatches = parsedCorrectMatches.map((value) =>
    findMatchingOption(parsedOptions, value)
  );

  if (matchedCorrectMatches.some((value) => !value)) {
    showFormNotice(dragFormNotice, "Every correct match must exactly match one of the draggable options.");
    dragAnswersInput.focus();
    return;
  }

  dragDropQuestionBank.push({
    layoutType,
    blankLayout,
    prompt,
    options: parsedOptions,
    targets: parsedTargets,
    correctMatches: matchedCorrectMatches,
    blankLeftLabels: rawLeftLabels,
    blankActiveFlags: blankActiveFlags
  });

  persistDragDropQuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Drag and drop question saved to the bank";
  clearFormNotice(dragFormNotice);
  showBankManagerView();
  dragQuestionForm.reset();
  dragLayoutTypeInput.value = "standard";
  dragBlankLayoutInput.value = "vertical";
  syncDragFormVariant();
  resetDragBlankIndicators();
  dragPromptInput.focus();
}

function handleAddLevel4Question(event) {
  event.preventDefault();

  const prompt = level4PromptInput.value.trim();

  if (!prompt) {
    showFormNotice(level4FormNotice, "Enter a question prompt before saving.");
    level4PromptInput.focus();
    return;
  }

  const correctIndex = Number(level4AnswerInput.value);

  level4QuestionBank.push({ prompt, correctIndex });

  persistLevel4QuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Yes/No question saved to the bank";
  clearFormNotice(level4FormNotice);
  showBankManagerView();
  level4QuestionForm.reset();
  level4AnswerInput.value = "0";
  level4PromptInput.focus();
}

function handleAddLevel3Question(event) {
  event.preventDefault();

  const seg0 = level3Seg0Input.value.trim();
  const blankSentence1 = level3BlankSentence1Input ? level3BlankSentence1Input.value.trim() : "";
  const blankSentence2 = level3BlankSentence2Input ? level3BlankSentence2Input.value.trim() : "";
  const blankSentence3 = level3BlankSentence3Input ? level3BlankSentence3Input.value.trim() : "";
  const blankSide1 = level3BlankSide1Input ? level3BlankSide1Input.value : "left";
  const blankSide2 = level3BlankSide2Input ? level3BlankSide2Input.value : "left";
  const blankSide3 = level3BlankSide3Input ? level3BlankSide3Input.value : "left";
  const blankVSentence1 = level3BlankVSentence1Input ? level3BlankVSentence1Input.value.trim() : "";
  const blankVSentence2 = level3BlankVSentence2Input ? level3BlankVSentence2Input.value.trim() : "";
  const blankVSentence3 = level3BlankVSentence3Input ? level3BlankVSentence3Input.value.trim() : "";
  const blankVSide1 = level3BlankVSide1Input ? level3BlankVSide1Input.value : "above";
  const blankVSide2 = level3BlankVSide2Input ? level3BlankVSide2Input.value : "above";
  const blankVSide3 = level3BlankVSide3Input ? level3BlankVSide3Input.value : "above";

  if (!seg0) {
    showFormNotice(level3FormNotice, "Enter the question text before Blank 1.");
    level3Seg0Input.focus();
    return;
  }

  const choices1 = parseChoices(level3Choices1Input.value);
  const answer1Text = level3Answer1Input.value.trim();

  if (choices1.length < 2) {
    showFormNotice(level3FormNotice, "Add at least two choices for Blank 1.");
    level3Choices1Input.focus();
    return;
  }

  if (!answer1Text) {
    showFormNotice(level3FormNotice, "Enter the correct answer text for Blank 1.");
    level3Answer1Input.focus();
    return;
  }

  const correct1Index = choices1.findIndex(
    (c) => c.trim().toLowerCase() === answer1Text.toLowerCase()
  );

  if (correct1Index === -1) {
    showFormNotice(level3FormNotice, `"${answer1Text}" does not match any Blank 1 choice. Copy it exactly from the list above.`);
    level3Answer1Input.focus();
    return;
  }

  const choices2 = parseChoices(level3Choices2Input.value);
  const answer2Text = level3Answer2Input.value.trim();

  if (choices2.length < 2) {
    showFormNotice(level3FormNotice, "Add at least two choices for Blank 2.");
    level3Choices2Input.focus();
    return;
  }

  if (!answer2Text) {
    showFormNotice(level3FormNotice, "Enter the correct answer text for Blank 2.");
    level3Answer2Input.focus();
    return;
  }

  const correct2Index = choices2.findIndex(
    (c) => c.trim().toLowerCase() === answer2Text.toLowerCase()
  );

  if (correct2Index === -1) {
    showFormNotice(level3FormNotice, `"${answer2Text}" does not match any Blank 2 choice. Copy it exactly from the list above.`);
    level3Answer2Input.focus();
    return;
  }

  // Blank 3 is optional — only validate if choices are provided
  const choices3Raw = level3Choices3Input.value.trim();
  const choices3 = parseChoices(level3Choices3Input.value);
  const answer3Text = level3Answer3Input.value.trim();
  let correct3Index = -1;
  const hasBlank3 = choices3Raw.length > 0;

  if (hasBlank3) {
    if (choices3.length < 2) {
      showFormNotice(level3FormNotice, "Add at least two choices for Blank 3, or leave it empty to skip.");
      level3Choices3Input.focus();
      return;
    }

    if (!answer3Text) {
      showFormNotice(level3FormNotice, "Enter the correct answer text for Blank 3.");
      level3Answer3Input.focus();
      return;
    }

    correct3Index = choices3.findIndex(
      (c) => c.trim().toLowerCase() === answer3Text.toLowerCase()
    );

    if (correct3Index === -1) {
      showFormNotice(level3FormNotice, `"${answer3Text}" does not match any Blank 3 choice. Copy it exactly from the list above.`);
      level3Answer3Input.focus();
      return;
    }
  }

  // Build prompt — only seg0 is the visible question; blanks follow
  const prompt = seg0 + " [blank] [blank]" + (hasBlank3 ? " [blank]" : "");

  const blanks = [
    { choices: choices1, correctIndex: correct1Index },
    { choices: choices2, correctIndex: correct2Index }
  ];
  if (hasBlank3) {
    blanks.push({ choices: choices3, correctIndex: correct3Index });
  }

  const blankSentences = [blankSentence1, blankSentence2];
  if (hasBlank3) blankSentences.push(blankSentence3);

  const blankSentenceSides = [blankSide1, blankSide2];
  if (hasBlank3) blankSentenceSides.push(blankSide3);

  const blankVerticalSentences = [blankVSentence1, blankVSentence2];
  if (hasBlank3) blankVerticalSentences.push(blankVSentence3);

  const blankVerticalSides = [blankVSide1, blankVSide2];
  if (hasBlank3) blankVerticalSides.push(blankVSide3);

  level3QuestionBank.push({
    prompt,
    blanks,
    segments: { seg0 },
    blankSentences,
    blankSentenceSides,
    blankVerticalSentences,
    blankVerticalSides
  });

  persistLevel3QuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Dropdown question saved to the bank";
  clearFormNotice(level3FormNotice);
  showBankManagerView();
  level3QuestionForm.reset();
  level3Seg0Input.focus();
}

function deleteMultipleChoiceQuestion(index) {
  if (questionBank.length === 0) {
    return;
  }

  const [removedQuestion] = questionBank.splice(index, 1);
  questionResults.delete(removedQuestion);

  persistQuestionBank();

  if (questionBank.length === 0) {
    loadQuestion(null);
  } else if (removedQuestion === currentQuestion) {
    loadQuestion(questionBank[Math.min(index, questionBank.length - 1)]);
  } else {
    renderQuestion(currentQuestion);
  }

  shuffleStatus.textContent = "Multiple-choice question deleted from the bank";
}

function deleteDragDropQuestion(index) {
  if (index < 0 || index >= dragDropQuestionBank.length) {
    return;
  }

  dragDropQuestionBank.splice(index, 1);
  persistDragDropQuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Drag and drop question deleted from the bank";
}

function deleteLevel3Question(index) {
  if (index < 0 || index >= level3QuestionBank.length) {
    return;
  }

  level3QuestionBank.splice(index, 1);
  persistLevel3QuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Dropdown question deleted from the bank";
}

function deleteLevel4Question(index) {
  if (index < 0 || index >= level4QuestionBank.length) {
    return;
  }

  level4QuestionBank.splice(index, 1);
  persistLevel4QuestionBank();
  updateQuestionCount();
  renderSavedQuestions();
  shuffleStatus.textContent = "Yes/No question deleted from the bank";
}

function deleteQuestion(type, index) {
  if (type === "drag-drop") {
    deleteDragDropQuestion(index);
    return;
  }

  if (type === "dropdown") {
    deleteLevel3Question(index);
    return;
  }

  if (type === "yes-no") {
    deleteLevel4Question(index);
    return;
  }

  deleteMultipleChoiceQuestion(index);
}

function handleSavedQuestionClick(event) {
  const editButton = event.target.closest(".edit-button");
  if (editButton) {
    window.sessionStorage.setItem(
      "az400-edit-target",
      JSON.stringify({ type: editButton.dataset.type, index: Number(editButton.dataset.index) })
    );
    window.location.href = "edit.html";
    return;
  }

  const deleteButton = event.target.closest(".delete-button");

  if (!deleteButton) {
    return;
  }

  deleteQuestion(deleteButton.dataset.type, Number(deleteButton.dataset.index));
}

function handleChoiceSelection(event) {
  if (isAnswerChecked || !currentQuestion) {
    return;
  }

  const input = event.target.closest("input[name='question-choice']");

  if (!input) {
    return;
  }

  const choiceIndex = Number(input.value);

  if (currentQuestion.correctIndices.length > 1) {
    const selected = new Set(selectedChoiceIndices);

    if (input.checked) {
      selected.add(choiceIndex);
    } else {
      selected.delete(choiceIndex);
    }

    selectedChoiceIndices = [...selected].sort((left, right) => left - right);
  } else {
    selectedChoiceIndices = input.checked ? [choiceIndex] : [];
  }

  isAnswerChecked = false;
  renderQuestion(currentQuestion);
}

function checkAnswer() {
  if (!currentQuestion) {
    return true;
  }

  if (selectedChoiceIndices.length === 0) {
    shuffleStatus.textContent = "Select an answer before checking";
    return false;
  }

  const normalizedSelected = [...selectedChoiceIndices].sort((left, right) => left - right);
  const normalizedCorrect = [...currentQuestion.correctIndices].sort((left, right) => left - right);
  const isCorrect = arraysMatch(normalizedSelected, normalizedCorrect);

  isAnswerChecked = true;
  questionResults.set(currentQuestion, isCorrect);
  shuffleStatus.textContent = isCorrect ? "Correct answer" : "Incorrect answer";
  renderQuestion(currentQuestion);
  return true;
}

function goToNextQuestion() {
  if (!currentQuestion) {
    const examMode = window.sessionStorage.getItem(EXAM_MODE_KEY) || "combined";
    const emptyResult = JSON.stringify({ correctCount: 0, totalQuestions: 0 });

    if (examMode === "combined") {
      if (dragDropQuestionBank.length > 0) {
        window.sessionStorage.setItem(LEVEL_ONE_RESULT_STORAGE_KEY, emptyResult);
        window.location.href = "level2.html";
        return;
      }

      if (level3QuestionBank.length > 0) {
        window.sessionStorage.setItem(LEVEL_TWO_RESULT_STORAGE_KEY, emptyResult);
        window.location.href = "level3.html";
        return;
      }

      if (level4QuestionBank.length > 0) {
        window.sessionStorage.setItem(LEVEL_THREE_RESULT_STORAGE_KEY, emptyResult);
        window.location.href = "level4.html";
        return;
      }
    }

    window.sessionStorage.setItem(RESULT_STORAGE_KEY, emptyResult);
    window.location.href = "results.html";
    return;
  }

  if (!isAnswerChecked) {
    if (!checkAnswer()) {
      return;
    }

    return;
  }

  if (isLastQuestion()) {
    const correctCount = questionBank.reduce((total, question) => {
      return total + (questionResults.get(question) ? 1 : 0);
    }, 0);

    const levelOneResult = {
      correctCount,
      totalQuestions: questionBank.length
    };

    const examMode = window.sessionStorage.getItem(EXAM_MODE_KEY) || "combined";

    if (examMode !== "combined") {
      window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(levelOneResult));
      window.location.href = "results.html";
      return;
    }

    if (dragDropQuestionBank.length > 0) {
      window.sessionStorage.setItem(
        LEVEL_ONE_RESULT_STORAGE_KEY,
        JSON.stringify(levelOneResult)
      );
      window.location.href = "level2.html";
      return;
    }

    if (level3QuestionBank.length > 0) {
      window.sessionStorage.setItem(
        LEVEL_TWO_RESULT_STORAGE_KEY,
        JSON.stringify(levelOneResult)
      );
      window.location.href = "level3.html";
      return;
    }

    if (level4QuestionBank.length > 0) {
      window.sessionStorage.setItem(
        LEVEL_THREE_RESULT_STORAGE_KEY,
        JSON.stringify(levelOneResult)
      );
      window.location.href = "level4.html";
      return;
    }

    window.sessionStorage.setItem(
      RESULT_STORAGE_KEY,
      JSON.stringify(levelOneResult)
    );
    window.location.href = "results.html";
    return;
  }

  const currentIndex = questionBank.indexOf(currentQuestion);
  const nextIndex = currentIndex + 1;
  loadQuestion(questionBank[nextIndex]);
  shuffleStatus.textContent = "Next question loaded";
}

shuffleButton.addEventListener("click", shuffleChoices);
addQuestionButton.addEventListener("click", toggleBankForm);
savedQuestionsButton.addEventListener("click", toggleSavedQuestions);
questionForm.addEventListener("submit", handleAddQuestion);
dragQuestionForm.addEventListener("submit", handleAddDragQuestion);
level3QuestionForm.addEventListener("submit", handleAddLevel3Question);
level4QuestionForm.addEventListener("submit", handleAddLevel4Question);

// ── Blank-side segmented toggle (shared for all add forms) ─
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
});
dragLayoutTypeInput.addEventListener("change", syncDragFormVariant);
toggleSavedListButton.addEventListener("click", toggleSavedQuestionList);
savedQuestionList.addEventListener("click", handleSavedQuestionClick);
const manageQuestionsButton = document.getElementById("manageQuestionsButton");

choiceList.addEventListener("change", handleChoiceSelection);
nextQuestionButton.addEventListener("click", goToNextQuestion);

if (retryButton) {
  retryButton.addEventListener("click", function() {
    if (!currentQuestion) return;
    questionResults.delete(currentQuestion);
    resetQuestionInteraction();
    shuffleStatus.textContent = "Question reset — try again";
    renderQuestion(currentQuestion);
  });
}

const _isPracticeMode = window.sessionStorage.getItem(PRACTICE_MODE_KEY) === "true";

if (_isPracticeMode) {
  if (examHeader) examHeader.removeAttribute("hidden");
  if (homeButton) {
    homeButton.addEventListener("click", function() {
      window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
      toggleSavedQuestions();
    });
  }
  addQuestionButton.style.display = "none";
  savedQuestionsButton.style.display = "none";
  manageQuestionsButton.style.display = "none";
}

if (prevQuestionButton) {
  prevQuestionButton.hidden = !_isPracticeMode;
  prevQuestionButton.addEventListener("click", function goToPreviousQuestion() {
    const currentIndex = questionBank.indexOf(currentQuestion);
    if (currentIndex <= 0) return;
    const prevQuestion = questionBank[currentIndex - 1];
    questionResults.delete(prevQuestion);
    loadQuestion(prevQuestion);
    shuffleStatus.textContent = "Previous question";
  });
}
levelSelectorPanel.addEventListener("click", function (event) {
  const btn = event.target.closest(".level-choice-button");
  if (btn) {
    startExam(btn.dataset.mode);
    return;
  }

  const rangeBtn = event.target.closest(".range-button");
  if (!rangeBtn) return;

  const level = rangeBtn.dataset.level;
  const start = parseInt(rangeBtn.dataset.start, 10);
  const end = parseInt(rangeBtn.dataset.end, 10);
  const order = rangeBtn.dataset.order;

  window.sessionStorage.setItem(RANGE_CONFIG_KEY, JSON.stringify({ level, start, end, order }));
  window.sessionStorage.setItem(EXAM_MODE_KEY, level);
  if (order === "practice") {
    window.sessionStorage.setItem(PRACTICE_MODE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(PRACTICE_MODE_KEY);
  }
  window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(LEVEL_TWO_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(LEVEL_THREE_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(RESULT_STORAGE_KEY);

  if (level === "level1") {
    window.location.reload();
  } else if (level === "level2") {
    window.location.href = "level2.html";
  } else if (level === "level3") {
    window.location.href = "level3.html";
  } else if (level === "level4") {
    window.location.href = "level4.html";
  }
});
manageQuestionsButton.addEventListener("click", function () {
  window.location.href = "manage.html";
});

window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
syncDragFormVariant();
loadQuestion(currentQuestion);

if (window.sessionStorage.getItem("az400-show-level-select") === "true") {
  window.sessionStorage.removeItem("az400-show-level-select");
  toggleSavedQuestions();
} else {
  showQuizView();
}