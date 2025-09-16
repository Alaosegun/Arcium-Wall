// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, remove } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyBxfUKX7CiCPgCFwwMmmZYc3xDLn8DHqY4",
  authDomain: "arcium-wall.firebaseapp.com",
  databaseURL: "https://arcium-wall-default-rtdb.firebaseio.com",
  projectId: "arcium-wall",
  storageBucket: "arcium-wall.firebasestorage.app",
  messagingSenderId: "275398953188",
  appId: "1:275398953188:web:ec8dbf000f57dcce6884f1",
  measurementId: "G-WLF1SLQJFD"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const avatarsRef = ref(db, "avatars");

const box = document.getElementById("box");
const handleInput = document.getElementById("handle");
const addBtn = document.getElementById("addBtn");

// Hook up button to add avatar
addBtn.addEventListener("click", addAvatar);

// Enter key support
handleInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addAvatar();
});

// Add avatar to Firebase
function addAvatar() {
  const handle = handleInput.value.replace("@", "").trim();
  if (!handle) return;
  push(avatarsRef, handle);
  handleInput.value = "";
}

// Create bouncing avatar
function createAvatar(handle, key) {
  const container = document.createElement("div");
  container.className = "avatar-container";
  container.dataset.key = key;

  const img = document.createElement("img");
  img.src = `https://unavatar.io/twitter/${handle}`;
  img.className = "avatar";
  img.onerror = () => { img.style.display = "none"; };

  const name = document.createElement("div");
  name.className = "name";
  name.innerText = "@" + handle;

  container.appendChild(img);
  container.appendChild(name);

  // Random position
  const margin = 20;
  let x = margin + Math.random() * (box.clientWidth - 80 - margin * 2);
  let y = margin + Math.random() * (box.clientHeight - 80 - margin * 2);
  container.style.left = x + "px";
  container.style.top = y + "px";

  box.appendChild(container);

  // Bounce animation
  const speed = window.innerWidth <= 768 ? 1 : 2;
  let dx = (Math.random() - 0.5) * speed;
  let dy = (Math.random() - 0.5) * speed;

  function move() {
    x += dx;
    y += dy;

    if (x <= 0 || x + container.offsetWidth >= box.clientWidth) dx *= -1;
    if (y <= 0 || y + container.offsetHeight >= box.clientHeight) dy *= -1;

    container.style.left = x + "px";
    container.style.top = y + "px";
    requestAnimationFrame(move);
  }
  move();

  // Single click → open Twitter (with delay to prevent conflict with double-click)
  let clickTimer = null;
  container.addEventListener("click", (e) => {
    e.preventDefault();
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      window.open(`https://twitter.com/${handle}`, "_blank");
    }, 250); // 250ms delay
  });

  // Double click → remove globally
  container.addEventListener("dblclick", (e) => {
    e.preventDefault();
    clearTimeout(clickTimer); // Cancel single click action
    
    // Add visual feedback
    container.style.opacity = "0.5";
    container.style.transform = "scale(0.9)";
    
    // Remove from Firebase
    remove(ref(db, "avatars/" + key)).catch((error) => {
      console.error("Error removing avatar:", error);
      // Restore visual state if removal failed
      container.style.opacity = "1";
      container.style.transform = "scale(1)";
    });
  });
}

// Listen for new avatars
onChildAdded(avatarsRef, (snapshot) => {
  const handle = snapshot.val();
  const key = snapshot.key;
  createAvatar(handle, key);
});

// Listen for removed avatars
onChildRemoved(avatarsRef, (snapshot) => {
  const key = snapshot.key;
  const el = document.querySelector(`.avatar-container[data-key="${key}"]`);
  if (el) {
    // Add fade out animation before removal
    el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    el.style.opacity = "0";
    el.style.transform = "scale(0.8)";
    
    setTimeout(() => {
      el.remove();
    }, 300);
  }
});