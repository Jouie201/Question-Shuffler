const RESULT_STORAGE_KEY = "az400-quiz-result";
const LEVEL_ONE_RESULT_STORAGE_KEY = "az400-level-one-result";
const scoreText = document.getElementById("scoreText");
const takeAgainButton = document.getElementById("takeAgainButton");

function loadResult() {
  const storedResult = window.sessionStorage.getItem(RESULT_STORAGE_KEY);

  if (!storedResult) {
    scoreText.textContent = "0 / 0";
    return;
  }

  try {
    const result = JSON.parse(storedResult);
    scoreText.textContent = `${result.correctCount} / ${result.totalQuestions}`;
  } catch {
    scoreText.textContent = "0 / 0";
  }
}

takeAgainButton.addEventListener("click", () => {
  window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem(LEVEL_ONE_RESULT_STORAGE_KEY);
  window.sessionStorage.removeItem("az400-level-two-result");
  window.sessionStorage.removeItem("az400-level-three-result");
  window.location.href = "index.html";
});

loadResult();
