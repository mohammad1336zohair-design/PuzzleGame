// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------
const practiceTab = document.getElementById("practiceTab");
const multiplayerTab = document.getElementById("multiplayerTab");

const practicePanel = document.getElementById("practicePanel");
const multiplayerPanel = document.getElementById("multiplayerPanel");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInput = document.getElementById("roomInput");
const roomCodeText = document.getElementById("roomCodeText");

const playerListContainer = document.getElementById("playerListContainer");
const playerList = document.getElementById("playerList");

const startMatchBtn = document.getElementById("startMatchBtn");
const leaveMatchBtn = document.getElementById("leaveMatchBtn");

const loginPopup = document.getElementById("loginPopup");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const closeLogin = document.getElementById("closeLogin");

const leavePopup = document.getElementById("leavePopup");
const leaveYes = document.getElementById("leaveYes");
const leaveNo = document.getElementById("leaveNo");

// --------------------------------------------------
// FIREBASE IMPORTS
// --------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --------------------------------------------------
// FIREBASE CONFIG (PUT YOURS HERE)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --------------------------------------------------
// STATE
// --------------------------------------------------
let currentUser = null;
let currentRoomCode = null;
let isHost = false;

// --------------------------------------------------
// TAB SWITCHING (FIXED)
// --------------------------------------------------
function showPractice() {
  practiceTab.classList.add("active");
  multiplayerTab.classList.remove("active");

  practicePanel.classList.remove("hidden");
  multiplayerPanel.classList.add("hidden");
}

function showMultiplayerIfLoggedIn() {
  multiplayerTab.classList.add("active");
  practiceTab.classList.remove("active");

  practicePanel.classList.add("hidden");
  multiplayerPanel.classList.remove("hidden");
}

function handleMultiplayerClick() {
  if (!currentUser) {
    // ❌ BLOCK ACCESS — DO NOT SHOW MULTIPLAYER PANEL
    showPractice();
    loginPopup.classList.remove("hidden");
    return;
  }

  // ✔ Logged in → allow access
  showMultiplayerIfLoggedIn();
}

practiceTab.addEventListener("click", showPractice);
multiplayerTab.addEventListener("click", handleMultiplayerClick);

// --------------------------------------------------
// LOGIN POPUP
// --------------------------------------------------
closeLogin.addEventListener("click", () => {
  loginPopup.classList.add("hidden");
});

signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    loginPopup.classList.add("hidden");
    showMultiplayerIfLoggedIn();
  } catch (err) {
    alert(err.message);
  }
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Enter email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginPopup.classList.add("hidden");
    showMultiplayerIfLoggedIn();
  } catch (err) {
    alert(err.message);
  }
});

// --------------------------------------------------
// AUTH STATE
// --------------------------------------------------
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user) {
    // Logged out → force back to practice
    currentRoomCode = null;
    isHost = false;
    hideRoomUI();
    showPractice();
  }
});

// --------------------------------------------------
// ROOM / LOBBY LOGIC
// --------------------------------------------------
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function showRoomUI(code) {
  roomCodeText.textContent = "Room Code: " + code;
  playerListContainer.classList.remove("hidden");
  leaveMatchBtn.classList.remove("hidden");

  if (isHost) startMatchBtn.classList.remove("hidden");
  else startMatchBtn.classList.add("hidden");
}

function hideRoomUI() {
  roomCodeText.textContent = "";
  playerListContainer.classList.add("hidden");
  startMatchBtn.classList.add("hidden");
  leaveMatchBtn.classList.add("hidden");
  playerList.innerHTML = "";
}

function listenToPlayers(roomCode) {
  const playersRef = ref(db, `rooms/${roomCode}/players`);

  onValue(playersRef, (snapshot) => {
    playerList.innerHTML = "";
    const players = snapshot.val() || {};

    Object.values(players).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.name + (p.isHost ? " (Host)" : "");
      playerList.appendChild(li);
    });
  });
}

async function createRoom() {
  if (!currentUser) {
    loginPopup.classList.remove("hidden");
    return;
  }

  const code = generateRoomCode();
  const roomRef = ref(db, `rooms/${code}`);

  await set(roomRef, {
    hostId: currentUser.uid,
    status: "lobby",
    players: {
      [currentUser.uid]: {
        uid: currentUser.uid,
        name: currentUser.email,
        isHost: true
      }
    }
  });

  currentRoomCode = code;
  isHost = true;

  showRoomUI(code);
  listenToPlayers(code);
}

async function joinRoom() {
  if (!currentUser) {
    loginPopup.classList.remove("hidden");
    return;
  }

  const code = roomInput.value.trim().toUpperCase();
  if (!code) {
    alert("Enter a room code.");
    return;
  }

  const roomRef = ref(db, `rooms/${code}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    alert("Room not found.");
    return;
  }

  const roomData = snap.val();
  if (roomData.status !== "lobby") {
    alert("Match already started.");
    return;
  }

  await update(roomRef, {
    [`players/${currentUser.uid}`]: {
      uid: currentUser.uid,
      name: currentUser.email,
      isHost: false
    }
  });

  currentRoomCode = code;
  isHost = false;

  showRoomUI(code);
  listenToPlayers(code);
}

createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);

// --------------------------------------------------
// START MATCH
// --------------------------------------------------
startMatchBtn.addEventListener("click", async () => {
  if (!isHost || !currentRoomCode) return;

  const roomRef = ref(db, `rooms/${currentRoomCode}`);
  await update(roomRef, { status: "in-game" });

  alert("Match started! (Puzzle sync comes next.)");
});

// --------------------------------------------------
// LEAVE MATCH
// --------------------------------------------------
leaveMatchBtn.addEventListener("click", () => {
  leavePopup.classList.remove("hidden");
});

leaveNo.addEventListener("click", () => {
  leavePopup.classList.add("hidden");
});

leaveYes.addEventListener("click", async () => {
  leavePopup.classList.add("hidden");

  if (!currentRoomCode || !currentUser) return;

  const roomRef = ref(db, `rooms/${currentRoomCode}`);
  const snap = await get(roomRef);

  if (!snap.exists()) {
    hideRoomUI();
    return;
  }

  const roomData = snap.val();

  await update(roomRef, {
    [`players/${currentUser.uid}`]: null
  });

  if (roomData.hostId === currentUser.uid) {
    await remove(roomRef);
  }

  currentRoomCode = null;
  isHost = false;
  hideRoomUI();
});

// --------------------------------------------------
// DEFAULT TAB
// --------------------------------------------------
showPractice();
