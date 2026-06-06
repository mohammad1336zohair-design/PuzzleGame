import { ensureLoggedIn } from "./multiplayer.js?v=11";

// ===============================
// PRACTICE MODE + NAVIGATION + CONFETTI
// ===============================

// DOM ELEMENTS
const board = document.getElementById("board");
const movesText = document.getElementById("moves");
const winPopup = document.getElementById("winPopup");
const moveCountText = document.getElementById("moveCountText");
const closePopup = document.getElementById("closePopup");
const restartBtn = document.getElementById("restartBtn");

const practicePanel = document.getElementById("practicePanel");
const multiplayerPanel = document.getElementById("multiplayerPanel");
const practiceTab = document.getElementById("practiceTab");
const multiplayerTab = document.getElementById("multiplayerTab");

const confettiCanvas = document.getElementById("confetti");
const confettiCtx = confettiCanvas.getContext("2d");

// STATE
let tiles = [];
let emptyIndex = 8;
let moves = 0;
let confettiPieces = [];
let confettiAnimationId = null;

// ===============================
// NAVIGATION
// ===============================

function showPractice() {
  practiceTab.classList.add("active");
  multiplayerTab.classList.remove("active");

  practicePanel.classList.remove("hidden");
  multiplayerPanel.classList.add("hidden");

  movesText.style.display = "block";

  const userNameCapsule = document.getElementById("userNameCapsule");
  userNameCapsule.textContent = "Guest";
}

function showMultiplayer() {
  practiceTab.classList.remove("active");
  multiplayerTab.classList.add("active");

  practicePanel.classList.add("hidden");
  multiplayerPanel.classList.remove("hidden");

  movesText.style.display = "none";
}

window.showPractice = showPractice;
window.showMultiplayer = showMultiplayer;

// ===============================
// BOARD INITIALIZATION
// ===============================

function initBoard() {
  tiles = generateSolvableBoard();
  emptyIndex = tiles.indexOf(null);

  createTiles();
  updateTilePositions();

  moves = 0;
  movesText.textContent = "Moves: 0";

  winPopup.classList.add("hidden");
  restartBtn.classList.add("hidden");
  stopConfetti();
}

function generateSolvableBoard() {
  let arr;
  do {
    arr = [1, 2, 3, 4, 5, 6, 7, 8, null];
    shuffle(arr);
  } while (!isSolvable(arr) || isSolved(arr));
  return arr;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSolved(arr) {
  for (let i = 0; i < 8; i++) {
    if (arr[i] !== i + 1) return false;
  }
  return arr[8] === null;
}

function isSolvable(arr) {
  const nums = arr.filter((n) => n !== null);
  let inv = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] > nums[j]) inv++;
    }
  }
  return inv % 2 === 0;
}

// ===============================
// TILE CREATION + MOVEMENT
// ===============================

function createTiles() {
  board.innerHTML = "";
  tiles.forEach((value) => {
    if (value === null) return;

    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.textContent = value;

    tile.addEventListener("click", () => {
      const idx = tiles.indexOf(value);
      handleTileClick(idx);
    });

    board.appendChild(tile);
  });
}

function updateTilePositions() {
  const size = window.innerWidth < 480 ? 95 : 130;
  const gap = 10;

  document.querySelectorAll(".tile").forEach((tile) => {
    const value = parseInt(tile.textContent);
    const index = tiles.indexOf(value);
    const row = Math.floor(index / 3);
    const col = index % 3;

    tile.style.left = col * (size + gap) + "px";
    tile.style.top = row * (size + gap) + "px";
  });
}

function handleTileClick(index) {
  if (!isAdjacent(index, emptyIndex)) return;

  [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
  emptyIndex = index;

  moves++;
  movesText.textContent = "Moves: " + moves;

  updateTilePositions();

  if (isSolved(tiles)) onWin();
}

function isAdjacent(a, b) {
  const r1 = Math.floor(a / 3),
    c1 = a % 3;
  const r2 = Math.floor(b / 3),
    c2 = b % 3;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

// ===============================
// WIN LOGIC
// ===============================

function onWin() {
  moveCountText.textContent = `You solved it in ${moves} moves!`;
  winPopup.classList.remove("hidden");
  restartBtn.classList.remove("hidden");
  startConfetti();
}

// ===============================
// CONFETTI
// ===============================

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function createConfetti() {
  confettiPieces = [];
  for (let i = 0; i < 150; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: 5 + Math.random() * 5,
      speedY: 2 + Math.random() * 3,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiPieces.forEach((p) => {
    confettiCtx.fillStyle = p.color;
    confettiCtx
