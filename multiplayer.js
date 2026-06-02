// ===============================
// MULTIPLAYER AUTH + LOGIN FLOW
// ===============================

// DOM ELEMENTS
const loginOverlay = document.getElementById("loginOverlay");

const stepEmail = document.getElementById("loginStepEmail");
const stepPassword = document.getElementById("loginStepPassword");
const stepUsername = document.getElementById("loginStepUsername");

const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const usernameInput = document.getElementById("loginUsername");

const emailNextBtn = document.getElementById("emailNextBtn");
const passwordLoginBtn = document.getElementById("passwordLoginBtn");
const createAccountBtn = document.getElementById("createAccountBtn");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const cancelLoginBtn = document.getElementById("cancelLoginBtn");

const backToEmailBtn = document.getElementById("backToEmailBtn");
const backToPasswordBtn = document.getElementById("backToPasswordBtn");

const userNameCapsule = document.getElementById("userNameCapsule");
const userIconContainer = document.getElementById("userIconContainer");

// FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC7J59ExJVU3j9meWZxpopAA0IqutOgX6Q",
  authDomain: "puzzle-multiplayer-8.firebaseapp.com",
  projectId: "puzzle-multiplayer-8",
  storageBucket: "puzzle-multiplayer-8.firebasestorage.app",
  messagingSenderId: "513197674871",
  appId: "1:513197674871:web:9a6553631d87518e5ad172",
  measurementId: "G-FZPL8KLPQ7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// STATE
let tempEmail = "";
let tempPassword = "";
let tempUsername = "";
let isNewUser = false;

// ===============================
// LOGIN OVERLAY CONTROL
// ===============================

function openLogin() {
  loginOverlay.classList.remove("hidden");
  showStep("email");
}

function closeLogin() {
  loginOverlay.classList.add("hidden");
  emailInput.value = "";
  passwordInput.value = "";
  usernameInput.value = "";
}

function showStep(step) {
  stepEmail.classList.add("hidden");
  stepPassword.classList.add("hidden");
  stepUsername.classList.add("hidden");

  if (step === "email") stepEmail.classList.remove("hidden");
  if (step === "password") stepPassword.classList.remove("hidden");
  if (step === "username") stepUsername.classList.remove("hidden");
}

// ===============================
// EMAIL STEP
// ===============================

emailNextBtn.addEventListener("click", async () => {
  tempEmail = emailInput.value.trim();

  if (!tempEmail) {
    alert("Enter your email.");
    return;
  }

  // Check if email already has an account
  try {
    await signInWithEmailAndPassword(auth, tempEmail, "dummyPassword");
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      isNewUser = true;
      showStep("password");
      return;
    }

    if (err.code === "auth/wrong-password") {
      isNewUser = false;
      showStep("password");
      return;
    }
  }
});


  const userDoc = await getDoc(doc(db, "users", tempEmail.toLowerCase()));

  if (userDoc.exists()) {
    isNewUser = false;
    showStep("password");
  } else {
    isNewUser = true;
    showStep("password");
  }
});

// ===============================
// PASSWORD STEP
// ===============================

passwordLoginBtn.addEventListener("click", async () => {
  tempPassword = passwordInput.value.trim();

  if (!tempPassword) {
    alert("Enter your password.");
    return;
  }

  if (!isNewUser) {
    // Existing user → log in
    try {
      await signInWithEmailAndPassword(auth, tempEmail, tempPassword);
      closeLogin();
    } catch (err) {
      alert("Incorrect password.");
    }
  } else {
    // New user → go to username step
    showStep("username");
  }
});

// ===============================
// USERNAME STEP
// ===============================

createAccountBtn.addEventListener("click", async () => {
  tempUsername = usernameInput.value.trim();

  if (!tempUsername) {
    alert("Enter a username.");
    return;
  }

  const lower = tempUsername.toLowerCase();

  // Check uniqueness
  const nameDoc = await getDoc(doc(db, "usernames", lower));
  if (nameDoc.exists()) {
    alert("Username already taken.");
    return;
  }

  try {
    // Create account
    const userCred = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword);
    const uid = userCred.user.uid;

    // Store username in BOTH places
    await setDoc(doc(db, "usernames", lower), {
      uid: uid,
      username: tempUsername
    });

    await setDoc(doc(db, "users", uid), {
      email: tempEmail,
      username: tempUsername
    });

    closeLogin();
  } catch (err) {
    alert("Error creating account.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  userMenu.classList.add("hidden");
  userNameCapsule.textContent = "Guest";
  window.showPractice();
});


// ===============================
// GOOGLE LOGIN
// ===============================

googleLoginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      // New Google user → ask for username
      isNewUser = true;
      showStep("username");
    } else {
      // Existing Google user → close login
      closeLogin();
    }
  } catch (err) {
    alert("Google login failed.");
  }
});


// ===============================
// NEVERMIND BUTTON
// ===============================

cancelLoginBtn.addEventListener("click", () => {
  closeLogin();
  window.showPractice();
});

// BACK BUTTONS
backToEmailBtn.addEventListener("click", () => showStep("email"));
backToPasswordBtn.addEventListener("click", () => showStep("password"));

// ===============================
// AUTH STATE LISTENER
// ===============================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    userIconContainer.classList.add("hidden");
    userNameCapsule.textContent = "Guest";
    return;
  }

  userIconContainer.classList.remove("hidden");

  const profile = await getDoc(doc(db, "users", user.uid));
  if (profile.exists()) {
    userNameCapsule.textContent = profile.data().username;
  }
});

// ===============================
// REQUIRE LOGIN FOR MULTIPLAYER
// ===============================

async function ensureLoggedIn() {
  if (auth.currentUser) return true;
  openLogin();
  return false;
}

// ===============================
// USER ICON DROPDOWN
// ===============================

const userIcon = document.getElementById("userIcon");
const userMenu = document.getElementById("userMenu");

userIcon.addEventListener("click", () => {
  userMenu.classList.toggle("hidden");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!userIconContainer.contains(e.target)) {
    userMenu.classList.add("hidden");
  }
});


// ===============================
// MULTIPLAYER ROOM SYSTEM
// ===============================

// DOM ELEMENTS
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomInput = document.getElementById("roomInput");
const roomCodeText = document.getElementById("roomCodeText");
const playerList = document.getElementById("playerList");

// STATE
let currentRoom = null;
let roomUnsub = null;

// ===============================
// CREATE ROOM
// ===============================

createRoomBtn.addEventListener("click", async () => {
  const loggedIn = await ensureLoggedIn();
  if (!loggedIn) return;

  const user = auth.currentUser;
  const profile = await getDoc(doc(db, "users", user.uid));
  const username = profile.data().username;

  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  await setDoc(doc(db, "rooms", roomCode), {
    players: {
      [user.uid]: username
    }
  });

  joinRoom(roomCode);
});

// ===============================
// JOIN ROOM
// ===============================

joinRoomBtn.addEventListener("click", async () => {
  const loggedIn = await ensureLoggedIn();
  if (!loggedIn) return;

  const code = roomInput.value.trim().toUpperCase();
  if (!code) {
    alert("Enter a room code.");
    return;
  }

  const roomRef = doc(db, "rooms", code);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found.");
    return;
  }

  joinRoom(code);
});

// ===============================
// JOIN ROOM LOGIC
// ===============================

async function joinRoom(code) {
  const user = auth.currentUser;
  const profile = await getDoc(doc(db, "users", user.uid));
  const username = profile.data().username;

  currentRoom = code;

  // Add player to room
  await updateDoc(doc(db, "rooms", code), {
    [`players.${user.uid}`]: username
  });

  roomCodeText.textContent = "Room Code: " + code;

  listenToRoom(code);
}

// ===============================
// LISTEN TO ROOM
// ===============================

function listenToRoom(code) {
  if (roomUnsub) roomUnsub();

  const roomRef = doc(db, "rooms", code);

  roomUnsub = onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) {
      alert("Room closed.");
      leaveRoom();
      return;
    }

    const data = snap.data();
    updatePlayerList(data.players);
  });
}

// ===============================
// UPDATE PLAYER LIST UI
// ===============================

function updatePlayerList(players) {
  playerList.innerHTML = "";

  Object.values(players).forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name;
    playerList.appendChild(li);
  });
}

// ===============================
// LEAVE ROOM
// ===============================

async function leaveRoom() {
  if (!currentRoom) return;

  const user = auth.currentUser;
  if (!user) return;

  const roomRef = doc(db, "rooms", currentRoom);
  const roomSnap = await getDoc(roomRef);

  if (roomSnap.exists()) {
    const data = roomSnap.data();
    const players = data.players;

    delete players[user.uid];

    if (Object.keys(players).length === 0) {
      // Delete empty room
      await setDoc(roomRef, {}, { merge: false });
    } else {
      await updateDoc(roomRef, { players });
    }
  }

  if (roomUnsub) roomUnsub();
  roomUnsub = null;

  currentRoom = null;
  roomCodeText.textContent = "";
  playerList.innerHTML = "";
}

// Leave room when closing tab
window.addEventListener("beforeunload", leaveRoom);

