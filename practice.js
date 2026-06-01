// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------
const board = document.getElementById("board");
const movesText = document.getElementById("moves");
const winPopup = document.getElementById("winPopup");
const moveCountText = document.getElementById("moveCountText");
const closePopup = document.getElementById("closePopup");
const restartBtn = document.getElementById("restartBtn");
const confettiCanvas = document.getElementById("confetti");
const confettiCtx = confettiCanvas.getContext("2d");

const practiceTab = document.getElementById("practiceTab");
const multiplayerTab = document.getElementById("multiplayerTab");
const practicePanel = document.getElementById("practicePanel");
const multiplayerPanel = document.getElementById("multiplayerPanel");

// --------------------------------------------------
// STATE
// --------------------------------------------------
let tiles = [];
let emptyIndex = 8;
let moves = 0;
let confettiPieces = [];
let confettiAnimationId = null;

// --------------------------------------------------
// VIEW HELPERS (exported)
// --------------------------------------------------
export function showPractice() {
  practiceTab.classList.add("active");
  multiplayerTab.classList.remove("active");
  practicePanel.classList.remove("hidden");
  multiplayerPanel.classList.add("hidden");
  movesText.style.display = "block";
}

export function showMultiplayer() {
  practiceTab.classList.remove("active");
  multiplayerTab.classList.add("active");
  practicePanel.classList.add("hidden");
  multiplayerPanel.classList.remove("hidden");
  movesText.style.display = "none";
}

// --------------------------------------------------
// TILE SIZE (responsive)
// --------------------------------------------------
function getTileSize() {
  return window.innerWidth < 480 ? 95 : 130;
}

// --------------------------------------------------
// INIT BOARD
// --------------------------------------------------
function initBoard() {
  tiles = generateSolvableBoard();
  emptyIndex = tiles.indexOf(null);

  createTiles();
  updateTilePositions();
  moves = 0;
  updateMoves();
  hideWin();
  hideRestart();
  stopConfetti();
}

// --------------------------------------------------
// GENERATE SOLVABLE BOARD
// --------------------------------------------------
function generateSolvableBoard() {
  let arr;
  do {
    arr = [1, 2, 3, 4, 5, 6, 7, 8, null];
    shuffle(arr);
  } while (!isSolvable(arr) || isAlreadySolved(arr));
  return arr;
}

function isAlreadySolved(arr) {
  for (let i = 0; i < 8; i++) {
    if (arr[i] !== i + 1) return false;
  }
  return arr[8] === null;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isSolvable(arr) {
  const nums = arr.filter(n => n !== null);
  let inversions = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] > nums[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

// --------------------------------------------------
// CREATE TILES
// --------------------------------------------------
function createTiles() {
  board.innerHTML = "";

  tiles.forEach((value) => {
    if (value === null) return;

    const tile = document.createElement("div");
    tile.classList.add("tile8");
    tile.textContent = value;

    const handle = () => {
      const currentIndex = tiles.indexOf(value);
      handleTileClick(currentIndex);
    };

    tile.addEventListener("click", handle);
    tile.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handle();
    });

    board.appendChild(tile);
  });
}

// --------------------------------------------------
// UPDATE TILE POSITIONS
// --------------------------------------------------
function updateTilePositions() {
  const tileSize = getTileSize();
  const gap = 10;

  document.querySelectorAll(".tile8").forEach(tile => {
    const value = parseInt(tile.textContent);
    const index = tiles.indexOf(value);
    const row = Math.floor(index / 3);
    const col = index % 3;

    tile.style.left = col * (tileSize + gap) + "px";
    tile.style.top = row * (tileSize + gap) + "px";
  });
}

function updateMoves() {
  movesText.textContent = "Moves: " + moves;
}

// --------------------------------------------------
// GAME LOGIC
// --------------------------------------------------
function handleTileClick(index) {
  if (!isAdjacent(index, emptyIndex)) return;

  [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
  emptyIndex = index;

  moves++;
  updateMoves();
  updateTilePositions();

  if (checkWin()) onWin();
}

function isAdjacent(i1, i2) {
  const r1 = Math.floor(i1 / 3);
  const c1 = i1 % 3;
  const r2 = Math.floor(i2 / 3);
  const c2 = i2 % 3;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function checkWin() {
  for (let i = 0; i < 8; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[8] === null;
}

// --------------------------------------------------
// WIN HANDLING
// --------------------------------------------------
function onWin() {
  moveCountText.textContent = `You solved it in ${moves} moves!`;
  winPopup.classList.remove("hidden");
  showRestart();
  startConfetti();
}

function hideWin() {
  winPopup.classList.add("hidden");
}

function showRestart() {
  restartBtn.classList.remove("hidden");
}

function hideRestart() {
  restartBtn.classList.add("hidden");
}

// --------------------------------------------------
// CONFETTI
// --------------------------------------------------
function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function createConfetti() {
  confettiPieces = [];
  const count = 150;
  for (let i = 0; i < count; i++) {
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
  confettiPieces.forEach(p => {
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(p.x, p.y, p.size, p.size);
    p.y += p.speedY;
    if (p.y > confettiCanvas.height) {
      p.y = -10;
      p.x = Math.random() * confettiCanvas.width;
    }
  });
  confettiAnimationId = requestAnimationFrame(drawConfetti);
}

function startConfetti() {
  resizeConfettiCanvas();
  createConfetti();
  confettiCanvas.style.display = "block";
  drawConfetti();
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  confettiCanvas.style.display = "none";
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

window.addEventListener("resize", () => {
  if (confettiCanvas.style.display === "block") {
    resizeConfettiCanvas();
  }
  updateTilePositions();
});

// --------------------------------------------------
// EVENTS
// --------------------------------------------------
closePopup.addEventListener("click", () => {
  hideWin();
  stopConfetti();
});

restartBtn.addEventListener("click", () => {
  initBoard();
});

// --------------------------------------------------
// INIT
// --------------------------------------------------
showPractice();
initBoard();
