// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase config (use your own)
const firebaseConfig = {
  apiKey: "AIzaSyD_bVwKKjEwM4fAnrniDg3y-x6DpbaATL0",
  authDomain: "recycling-ai-60514.firebaseapp.com",
  projectId: "recycling-ai-60514",
  storageBucket: "recycling-ai-60514.firebasestorage.app",
  messagingSenderId: "116844452229",    
  appId: "1:116844452229:web:63644296dc46d8c8140cec",
  measurementId: "G-NFE9GEK0Q6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Redirect to login if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Set up camera stream
const video = document.getElementById("video");
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    alert("Camera error: " + err.message);
  });

// Logout function
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out.");
    window.location.href = "login.html";
  });
};
