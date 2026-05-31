const board = document.getElementById("board");
const movesText = document.getElementById("moves");
const popup = document.getElementById("winPopup");
const moveCountText = document.getElementById("moveCountText");
const closePopup = document.getElementById("closePopup");

const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let confetti = [];
let confettiRunning = false;

let moves = 0;
let gameOver = false;

let tiles = [1, 2, 3, 4, 5, 6, 7, 8, ""];
let tileElements = {};

const PADDING = 15;
const GAP = 10;
const BOARD_SIZE = 340;
const CELL_SIZE = (BOARD_SIZE - 2 * PADDING - 2 * GAP) / 3;

function getTilePosition(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: PADDING + col * (CELL_SIZE + GAP),
    y: PADDING + row * (CELL_SIZE + GAP),
  };
}

function initBoard() {
  board.innerHTML = "";
  tileElements = {};

  tiles.forEach((tile, index) => {
    if (tile === "") return;

    const tileDiv = document.createElement("div");
    tileDiv.classList.add("tile");
    tileDiv.textContent = tile;
    tileDiv.setAttribute("data-value", tile);

    tileDiv.style.width = CELL_SIZE + "px";
    tileDiv.style.height = CELL_SIZE + "px";

    const pos = getTilePosition(index);
    tileDiv.style.left = pos.x + "px";
    tileDiv.style.top = pos.y + "px";

    tileDiv.addEventListener("click", () => {
      const value = parseInt(tileDiv.getAttribute("data-value"));
      moveTile(tiles.indexOf(value));
    });

    tileElements[tile] = tileDiv;
    board.appendChild(tileDiv);
  });
}

function renderBoard() {
  tiles.forEach((tile, index) => {
    if (tile === "") return;
    const tileDiv = tileElements[tile];
    const pos = getTilePosition(index);
    tileDiv.style.left = pos.x + "px";
    tileDiv.style.top = pos.y + "px";
  });
}

function moveTile(index) {
  if (gameOver) return;

  const emptyIndex = tiles.indexOf("");

  const sameRow =
    Math.floor(index / 3) === Math.floor(emptyIndex / 3);

  const validMove =
    (sameRow && Math.abs(index - emptyIndex) === 1) ||
    Math.abs(index - emptyIndex) === 3;

  if (validMove) {
    [tiles[index], tiles[emptyIndex]] =
    [tiles[emptyIndex], tiles[index]];

    moves++;
    movesText.textContent = "Moves: " + moves;

    renderBoard();
    checkWin();
  }
}

function shuffleBoard() {
  tiles = [1,2,3,4,5,6,7,8,""];
  moves = 0;
  gameOver = false;

  movesText.textContent = "Moves: 0";

  for (let i = 0; i < 200; i++) {
    const emptyIndex = tiles.indexOf("");

    const possibleMoves = [];

    if (emptyIndex - 3 >= 0) possibleMoves.push(emptyIndex - 3);
    if (emptyIndex + 3 < 9) possibleMoves.push(emptyIndex + 3);
    if (emptyIndex % 3 !== 0) possibleMoves.push(emptyIndex - 1);
    if (emptyIndex % 3 !== 2) possibleMoves.push(emptyIndex + 1);

    const randomMove =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    [tiles[emptyIndex], tiles[randomMove]] =
    [tiles[randomMove], tiles[emptyIndex]];
  }

  initBoard();
}

function checkWin() {
  const win = [1,2,3,4,5,6,7,8,""];

  if (JSON.stringify(tiles) === JSON.stringify(win)) {
    gameOver = true;

    setTimeout(() => {
      moveCountText.textContent =
        "You solved it in " + moves + " moves!";

      popup.classList.remove("hidden");

      startConfetti();
      showRestartButton();

    }, 250);
  }
}

closePopup.addEventListener("click", () => {
  popup.classList.add("hidden");
});

const restartBtn = document.createElement("button");
restartBtn.textContent = "Restart";
restartBtn.classList.add("restart-btn");
restartBtn.style.display = "none";
document.body.appendChild(restartBtn);

restartBtn.addEventListener("click", () => {
  restartBtn.style.display = "none";
  shuffleBoard();
});

function showRestartButton() {
  restartBtn.style.display = "inline-block";
}

function startConfetti() {
  confetti = [];
  confettiRunning = true;

  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 3,
      d: Math.random() * 10 + 5,
      color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      tilt: Math.random() * 10 - 10
    });
  }

  animateConfetti();

  setTimeout(() => {
    confettiRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 10000);
}

function animateConfetti() {
  if (!confettiRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confetti.forEach(c => {
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.r, c.r);

    c.y += c.d;
    c.x += Math.sin(c.tilt);
  });

  requestAnimationFrame(animateConfetti);
}

shuffleBoard();
