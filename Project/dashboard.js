// dashboard.js

// Import TensorFlow.js and MobileNet model as ES modules

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

// Load MobileNet model
let model;
mobilenet.load().then((loadedModel) => {
  model = loadedModel;
  console.log("MobileNet model loaded.");
});

// Classify the image from video
window.classifyImage = async function () {
  if (!model) {
    document.getElementById("classificationResult").textContent = "Model not loaded yet.";
    return;
  }

  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const predictions = await model.classify(canvas);

  const result = document.getElementById("classificationResult");
  const bin = document.getElementById("binGuidance");

  if (predictions.length > 0) {
    const topPrediction = predictions[0];
    result.textContent = `Detected: ${topPrediction.className} (${(topPrediction.probability * 100).toFixed(2)}%)`;

    // Basic bin guidance
    const label = topPrediction.className.toLowerCase();
    if (label.includes("bottle") || label.includes("plastic")) {
      bin.textContent = "🟦 Put it in the BLUE bin (Recyclables)";
    } else if (label.includes("banana") || label.includes("apple")) {
      bin.textContent = "🟩 Put it in the GREEN bin (Organic)";
    } else {
      bin.textContent = "🟥 Put it in the RED bin (General waste)";
    }
  } else {
    result.textContent = "Could not classify the object.";
    bin.textContent = "";
  }
};

// Logout function
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out.");
    window.location.href = "login.html";
  });
};
