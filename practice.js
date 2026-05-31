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

// --------------------------------------------------
// STATE
// --------------------------------------------------
let tiles = [];
let emptyIndex = 8;
let moves = 0;
let confettiPieces = [];
let confettiAnimationId = null;

// --------------------------------------------------
// INIT BOARD
// --------------------------------------------------
function initBoard() {
  tiles = generateSolvableBoard();
  emptyIndex = tiles.indexOf(null);

  createTiles();   // create DOM tiles ONCE
  updateTilePositions(); // animate positions
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
    arr = [1,2,3,4,5,6,7,8,null];
    shuffle(arr);
  } while (!isSolvable(arr));

  return arr;
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
// CREATE TILES ONCE
// --------------------------------------------------
function createTiles() {
  board.innerHTML = "";

  tiles.forEach((value, index) => {
    if (value === null) return;

    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.textContent = value;
    tile.dataset.index = index;

    tile.addEventListener("click", () => handleTileClick(index));

    board.appendChild(tile);
  });
}

// --------------------------------------------------
// UPDATE TILE POSITIONS (smooth animation)
// --------------------------------------------------
function updateTilePositions() {
  const tileSize = 110;
  const gap = 10;

  const tileElements = document.querySelectorAll(".tile");

  tileElements.forEach(tile => {
    const index = tiles.indexOf(parseInt(tile.textContent));
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
  updateTilePositions(); // smooth animation

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
// CONFETTI (unchanged)
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
initBoard();
