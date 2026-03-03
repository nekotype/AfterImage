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
// ローカル保存キー（Supabase未接続時のフォールバックにも使う）
const localHighScoreKey = "afterimage_high_score_local";
const localStartCountKey = "afterimage_start_count_local";
// index.html で埋めた Supabase 設定値を読む
const supabaseUrl = window.AFTERIMAGE_SUPABASE_URL || "";
const supabaseAnonKey = window.AFTERIMAGE_SUPABASE_ANON_KEY || "";
const supabaseClient =
  window.supabase && supabaseUrl && supabaseAnonKey
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
// 初期表示はローカル値、起動後に Supabase 値で上書き
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
  // 公開時にURL/Key未設定ならローカルのみで動かす
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
  // Startクリック回数を全体カウンタに反映
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
  // DB側で max(high_score, nextScore) を更新
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
  statusEl.textContent = `ワールドハイスコア: ${highScore} | あなたのスコア: ${score} | 総プレイ回数: ${startClickCount}`;
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
  // ゲーム終了時点のスコアをDBへ送る
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
  // 先にローカル表示を更新し、非同期でDBにも反映
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
// 初回表示後にDB値を取りにいく
loadRemoteStats();
