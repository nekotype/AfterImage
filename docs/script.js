const charSets = {
  digits: "0123456789".split(""),
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  images: [
    "🧠", "🫀", "🫁", "👁", "👂", "👃", "👄", "🦷", "🦴",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💖",
    "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "🟤",
    "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "🟫",
    "⭐", "🌟", "✨", "💫", "⚡", "🔥", "💧", "❄", "☀", "🌙",
    "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔘", "🔳", "🔲",
    "●", "■", "▲", "▼", "◆", "◈", "⬠", "⬡", "❣", "⚙", "☯", "☮"
  ],
  imagesPlus: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃",
    "😉", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "🤨",
    "🧐", "🤓", "😎", "🥳", "😤", "😭", "😱", "😴", "🤖", "👻", "👽", "👾",
    "🧠", "👀", "👄", "👅", "🫀", "🫁", "🦴", "🦷", "🫶", "👍", "👎", "👏",
    "🙏", "💪", "🔥", "💧", "🌈", "☀️", "🌙", "⭐", "🌟", "⚡", "❄️", "☁️",
    "🌸", "🌹", "🌻", "🍀", "🌵", "🌴", "🍎", "🍊", "🍋", "🍇", "🍉", "🍓",
    "🍔", "🍟", "🍕", "🍣", "🍜", "🍩", "🍪", "🍰", "☕", "🍵", "🥤", "🧃",
    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🎳", "🎮", "🕹️", "🎲", "🧩", "🎯",
    "🚗", "🚕", "🚌", "🚑", "🚒", "🚲", "🏍️", "✈️", "🚀", "🛸", "🚁", "🚂",
    "⌚", "📱", "💻", "⌨️", "🖱️", "📷", "🎧", "🔋", "💡", "🔒", "🧲", "🧪",
    "📚", "✏️", "🖊️", "📎", "📌", "📍", "🗂️", "📦", "🧸", "🎁", "🪄", "🪙",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💖"
  ]
};

const imageSeparator = "\u2009";
const localHighScoreKey = "afterimage_high_score_local";
const localStartCountKey = "afterimage_start_count_local";
const supabaseUrl = window.AFTERIMAGE_SUPABASE_URL || "";
const supabaseAnonKey = window.AFTERIMAGE_SUPABASE_ANON_KEY || "";
const supabaseClient =
  window.supabase && supabaseUrl && supabaseAnonKey
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;

const display = document.getElementById("display");
const choicesEl = document.getElementById("choices");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const durationEl = document.getElementById("duration");
const modeEl = document.getElementById("mode");

let answer = "";
let score = 0;
let correctCount = 0;
let currentLength = 3;
let locked = true;
let revealTimer = null;
let gameActive = false;
let currentMode = "digits";
let currentPool = charSets.digits;
let highScore = Number(localStorage.getItem(localHighScoreKey) || 0);
let startClickCount = Number(localStorage.getItem(localStartCountKey) || 0);

function setHighScore(next) {
  highScore = next;
  localStorage.setItem(localHighScoreKey, String(highScore));
}

function setStartClickCount(next) {
  startClickCount = next;
  localStorage.setItem(localStartCountKey, String(startClickCount));
}

async function loadRemoteStats() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.rpc("get_stats");
  if (error) {
    console.error("failed to load stats", error);
    return;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return;

  setHighScore(Number(row.high_score || 0));
  setStartClickCount(Number(row.start_click_count || 0));
  updateStatus();
}

async function recordStartClick() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.rpc("record_start");
  if (error) {
    console.error("failed to record start click", error);
    return;
  }

  setStartClickCount(Number(data || 0));
  updateStatus();
}

async function recordHighScore(nextScore) {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.rpc("record_score", {
    p_score: nextScore
  });
  if (error) {
    console.error("failed to record score", error);
    return;
  }

  setHighScore(Number(data || 0));
  updateStatus();
}

function inImageMode() {
  return currentMode === "images" || currentMode === "imagesPlus";
}

function applyModeClass() {
  choicesEl.classList.toggle("images-mode", inImageMode());
}

function updateStatus() {
  statusEl.textContent = `スコア: ${score} | ハイスコア: ${highScore} | Start回数: ${startClickCount} | 文字数: ${currentLength} | 正解数: ${correctCount}`;
}

function tokenToString(tokens) {
  return inImageMode() ? tokens.join(imageSeparator) : tokens.join("");
}

function randomToken(length) {
  const out = [];
  for (let i = 0; i < length; i += 1) {
    out.push(currentPool[Math.floor(Math.random() * currentPool.length)]);
  }
  return tokenToString(out);
}

function mutateOneChar(str) {
  const tokens = inImageMode() ? str.split(imageSeparator) : str.split("");
  const idx = Math.floor(Math.random() * tokens.length);
  let next = tokens[idx];

  while (next === tokens[idx]) {
    next = currentPool[Math.floor(Math.random() * currentPool.length)];
  }

  tokens[idx] = next;
  return tokenToString(tokens);
}

function buildChoices(correct) {
  const set = new Set([correct]);
  while (set.size < 4) {
    set.add(mutateOneChar(correct));
  }
  return [...set].sort(() => Math.random() - 0.5);
}

function renderChoices(options) {
  choicesEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = opt;
    btn.addEventListener("click", () => judge(btn, opt));
    choicesEl.appendChild(btn);
  });
}

function gameOver(selectedButton) {
  gameActive = false;
  locked = true;
  startBtn.textContent = "リスタート";

  const buttons = [...choicesEl.querySelectorAll(".choice")];
  buttons.forEach((b) => {
    if (b.textContent === answer) b.classList.add("correct");
  });

  if (selectedButton) {
    selectedButton.classList.add("wrong");
  }

  if (score > highScore) {
    setHighScore(score);
  }
  recordHighScore(score);

  display.textContent = `ゲーム終了 (${answer})`;
  updateStatus();
}

function judge(button, selected) {
  if (locked || !gameActive) return;
  locked = true;

  if (selected === answer) {
    button.classList.add("correct");
    correctCount += 1;
    score += 1;

    if (score > highScore) {
      setHighScore(score);
    }

    if (correctCount % 2 === 0) {
      currentLength += 1;
    }

    display.textContent = "正解";
    updateStatus();
    setTimeout(nextRound, 900);
    return;
  }

  gameOver(button);
}

function nextRound() {
  if (!gameActive) return;

  locked = true;
  if (revealTimer !== null) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }

  answer = randomToken(currentLength);
  display.textContent = answer;
  choicesEl.innerHTML = "";

  const duration = Number(durationEl.value);
  revealTimer = setTimeout(() => {
    if (!gameActive) return;
    renderChoices(buildChoices(answer));
    display.textContent = "?";
    locked = false;
    revealTimer = null;
  }, duration);
}

function startGame() {
  if (revealTimer !== null) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }

  currentMode = modeEl.value;
  currentPool = charSets[currentMode] || charSets.digits;
  applyModeClass();

  score = 0;
  correctCount = 0;
  currentLength = 3;
  setStartClickCount(startClickCount + 1);
  gameActive = true;
  locked = true;
  startBtn.textContent = "リスタート";
  updateStatus();
  recordStartClick();
  nextRound();
}

startBtn.addEventListener("click", startGame);
applyModeClass();
updateStatus();
loadRemoteStats();
