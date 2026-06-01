// MULTIPLAYER + AUTH + PROFILE MENU

/* DOM */
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInput = document.getElementById("roomInput");
const roomCodeText = document.getElementById("roomCodeText");
const playerList = document.getElementById("playerList");

const userIcon = document.getElementById("userIcon");
const userMenu = document.getElementById("userMenu");
const logoutBtn = document.getElementById("logoutBtn");
const userNameCapsule = document.getElementById("userNameCapsule");

/* FIREBASE IMPORTS */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* YOUR CONFIG — paste it here */
const firebaseConfig = {
  /* paste your config here */
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* STATE */
let currentUser = null;
let currentUsername = "Guest";
let currentRoomCode = null;
let roomUnsub = null;

/* AUTH STATE */
onAuthStateChanged(auth, (user) => {
  currentUser = user || null;

  if (!user) {
    currentUsername = "Guest";
    userNameCapsule.textContent = "Guest";
    window.showPractice();
    return;
  }

  const email = user.email || "";
  currentUsername = email.split("@")[0] || "Player";
  userNameCapsule.textContent = currentUsername;
});

/* PROFILE MENU */
userIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  userMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!userMenu.contains(e.target) && !userIcon.contains(e.target)) {
    userMenu.classList.add("hidden");
  }
});

/* LOGOUT */
logoutBtn.addEventListener("click", async () => {
  userMenu.classList.add("hidden");
  if (currentUser) await signOut(auth);
  alert("Logged out.");
  window.showPractice();
});

/* LOGIN */
async function ensureLoggedIn() {
  if (currentUser) return true;
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    currentUsername = currentUser.email.split("@")[0];
    userNameCapsule.textContent = currentUsername;
    return true;
  } catch {
    alert("Login cancelled.");
    return false;
  }
}

/* ROOM CODE */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* CREATE ROOM */
async function createRoom() {
  const ok = await ensureLoggedIn();
  if (!ok) return;

  const code = generateRoomCode();
  const ref = doc(db, "rooms", code);

  await setDoc(ref, {
    hostUid: currentUser.uid,
    players: [
      {
        uid: currentUser.uid,
        username: current
