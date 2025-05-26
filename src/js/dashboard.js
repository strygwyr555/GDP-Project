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

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    // Update user info in dashboard
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email;
  }
});

// Handle logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = "login.html";
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    // Display recycling stats
    displayStats();
});

// Stats handling functions
function displayStats() {
    const stats = JSON.parse(localStorage.getItem('recyclingStats') || '{}');
    const statsContainer = document.querySelector('.stats-grid');
    if (statsContainer) {
        const totalScanned = Object.values(stats).reduce((a, b) => a + b, 0);
        const itemsScanned = document.querySelector('.stat-number');
        if (itemsScanned) itemsScanned.textContent = totalScanned;
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    const scrollToCameraBtn = document.getElementById('scrollToCameraBtn');
    const cameraSection = document.getElementById('cameraSection');

    if (scrollToCameraBtn && cameraSection) {
        scrollToCameraBtn.addEventListener('click', () => {
            // Smooth scroll to camera section
            cameraSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            
            // Optional: Start the camera automatically after scrolling
            setTimeout(() => {
                const startCameraBtn = document.getElementById('startCameraBtn');
                if (startCameraBtn) {
                    startCameraBtn.click();
                }
            }, 1000); // Wait for scroll to complete
        });
    }
});

// After the Firebase initialization code
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const camera = new CameraHandler();
        await camera.init();
        
        // Initialize TensorFlow model
        const model = await tf.loadLayersModel('YOUR_MODEL_PATH');
        
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.addEventListener('click', async () => {
            const canvas = document.getElementById('canvas');
            const resultArea = document.getElementById('resultArea');
            const loadingIndicator = document.querySelector('.loading-indicator');
            
            // Show loading state
            loadingIndicator.style.display = 'block';
            resultArea.style.display = 'block';
            
            try {
                // Get image data from canvas
                const imageData = tf.browser.fromPixels(canvas)
                    .resizeNearestNeighbor([224, 224])
                    .expandDims()
                    .toFloat();
                
                // Make prediction
                const prediction = await model.predict(imageData).data();
                const result = Array.from(prediction)
                    .map((p, i) => ({
                        probability: p,
                        className: categories[i]
                    }))
                    .sort((a, b) => b.probability - a.probability)[0];
                
                // Display result
                document.getElementById('predictionResult').innerHTML = `
                    <h4>Detected: ${result.className}</h4>
                    <p>Confidence: ${(result.probability * 100).toFixed(2)}%</p>
                `;
                
                document.getElementById('recyclingGuide').innerHTML = `
                    <h4>Recycling Guide:</h4>
                    <p>${binGuidance[result.className]}</p>
                `;
            } catch (error) {
                console.error('Prediction error:', error);
                document.getElementById('predictionResult').innerHTML = 
                    '<p class="error">Error analyzing image. Please try again.</p>';
            } finally {
                loadingIndicator.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

document.getElementById('startCameraBtn').addEventListener('click', () => {
    // Show camera overlay when camera starts
    document.getElementById('cameraOverlay').style.display = 'block';
    // Show capture button
    document.getElementById('captureBtn').style.display = 'block';
    // Hide start camera button
    document.getElementById('startCameraBtn').style.display = 'none';
});
