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
const cookieMaxAge = 60 * 60 * 24 * 30;
const highScoreCookieKey = "afterimage_high_score";
const visitCountCookieKey = "afterimage_visit_count";
const playCountCookieKey = "afterimage_play_count";

// 画面要素
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
let highScore = 0;
let visitCount = 0;
let startClickCount = 0;

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${encodeURIComponent(name)}=`;
  const found = cookies.find((row) => row.startsWith(prefix));
  if (!found) return null;
  return decodeURIComponent(found.slice(prefix.length));
}

function setCookie(name, value) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${cookieMaxAge}; path=/; SameSite=Lax`;
}

function getCookieNumber(name) {
  return Number(getCookie(name) || 0);
}

function setHighScore(next) {
  highScore = next;
  setCookie(highScoreCookieKey, String(highScore));
}

function setStartClickCount(next) {
  startClickCount = next;
  setCookie(playCountCookieKey, String(startClickCount));
}

function incrementVisitCount() {
  visitCount = getCookieNumber(visitCountCookieKey) + 1;
  setCookie(visitCountCookieKey, String(visitCount));
}

function inImageMode() {
  return currentMode === "images" || currentMode === "imagesPlus";
}

function applyModeClass() {
  choicesEl.classList.toggle("images-mode", inImageMode());
}

function updateStatus() {
  statusEl.textContent = `あなたのベスト: ${highScore} | 今回のスコア: ${score} | アクセス回数: ${visitCount} | プレイ回数: ${startClickCount}`;
}

function tokenToString(tokens) {
  // 絵文字モードは細いスペース区切り、文字モードは連結
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
  // 正解候補から1文字だけ変えて誤答候補を作る
  const tokens = inImageMode() ? str.split(imageSeparator) : str.split("");
  const idx = Math.floor(Math.random() * tokens.length);
  let next = tokens[idx];

  while (next === tokens[idx]) {
    next = currentPool[Math.floor(Math.random() * currentPool.length)];
  }

  tokens[idx] = next;
  return tokenToString(tokens);
}

function countSamePosition(a, b) {
  const aTokens = inImageMode() ? a.split(imageSeparator) : a.split("");
  const bTokens = inImageMode() ? b.split(imageSeparator) : b.split("");
  let same = 0;
  for (let i = 0; i < aTokens.length; i += 1) {
    if (aTokens[i] === bTokens[i]) same += 1;
  }
  return same;
}

function buildDistantWrongChoice(correct) {
  const tokenCount = inImageMode() ? correct.split(imageSeparator).length : correct.length;
  const maxSame = Math.floor((tokenCount - 1) / 2);

  for (let i = 0; i < 40; i += 1) {
    const candidate = randomToken(tokenCount);
    if (candidate === correct) continue;
    if (countSamePosition(candidate, correct) <= maxSame) return candidate;
  }

  return randomToken(tokenCount);
}

function buildChoices(correct) {
  const set = new Set([correct]);
  // 1つだけ近い誤答を混ぜて緊張感を残し、残りは離した誤答にする
  set.add(mutateOneChar(correct));
  while (set.size < 4) set.add(buildDistantWrongChoice(correct));
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
  // 一定時間表示したあとに4択を出す
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
  nextRound();
}

startBtn.addEventListener("click", startGame);
highScore = getCookieNumber(highScoreCookieKey);
startClickCount = getCookieNumber(playCountCookieKey);
incrementVisitCount();
applyModeClass();
updateStatus();
