import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_bVwKKjEwM4fAnrniDg3y-x6DpbaATL0",
  authDomain: "recycling-ai-60514.firebaseapp.com",
  projectId: "recycling-ai-60514",
  storageBucket: "recycling-ai-60514.firebasestorage.app",
  messagingSenderId: "116844452229",    
  appId: "1:116844452229:web:63644296dc46d8c8140cec",
  measurementId: "G-NFE9GEK0Q6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

const video = document.getElementById("card scan-card");
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    alert("Camera error: " + err.message);
  });

window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out.");
    window.location.href = "login.html";
  });
};

const MODEL_PATH = 'Project\models\my_model.keras';

// Load TensorFlow.js model
let model;
async function loadModel() {
  try {
    model = await tf.loadLayersModel(MODEL_PATH);
    console.log('Model loaded successfully');
    // Enable classification button once model is loaded
    document.querySelector('button[onclick="classifyImage()"]').disabled = false;
  } catch (error) {
    console.error('Error loading model:', error);
  }
}
loadModel();

// Classification categories
const categories = [
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Organic Waste',
  'E-Waste'
];

// Bin guidance for each category
const binGuidance = {
  'Plastic': 'Place in the blue recycling bin. Ensure items are clean and dry.',
  'Paper': 'Place in the green recycling bin. Flatten cardboard boxes.',
  'Glass': 'Place in the white recycling bin. Remove caps and rinse containers.',
  'Metal': 'Place in the yellow recycling bin. Rinse cans and containers.',
  'Organic Waste': 'Place in the brown composting bin.',
  'E-Waste': 'Take to designated e-waste recycling center.'
};

// Track recycling progress
function updateRecyclingStats(category) {
  let stats = JSON.parse(localStorage.getItem('recyclingStats') || '{}');
  stats[category] = (stats[category] || 0) + 1;
  localStorage.setItem('recyclingStats', JSON.stringify(stats));
  displayStats();
}

function displayStats() {
  const stats = JSON.parse(localStorage.getItem('recyclingStats') || '{}');
  const statsHtml = Object.entries(stats)
    .map(([category, count]) => `${category}: ${count} items`)
    .join('<br>');
  document.getElementById('recyclingStats').innerHTML = statsHtml;
}

// Classification function
window.classifyImage = async function() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // Capture frame from video
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Preprocess the image
  let imageData = tf.browser.fromPixels(canvas)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .expandDims();

  // Make prediction
  const prediction = await model.predict(imageData).data();
  const topPrediction = Array.from(prediction)
    .map((prob, i) => ({ probability: prob, category: categories[i] }))
    .sort((a, b) => b.probability - a.probability)[0];

  // Display results
  document.getElementById('classificationResult').innerHTML = 
    `Detected Item: ${topPrediction.category} (${Math.round(topPrediction.probability * 100)}% confidence)`;
  document.getElementById('binGuidance').innerHTML = 
    `Recycling Guide: ${binGuidance[topPrediction.category]}`;

  updateRecyclingStats(topPrediction.category);
}
