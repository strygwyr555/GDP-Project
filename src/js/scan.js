import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from './firebase-config.js';

let model;
let stream;
const video = document.getElementById('cameraFeed');
const canvas = document.getElementById('photoCanvas');
const capturedImage = document.getElementById('capturedImage');
const startButton = document.getElementById('startCamera');
const captureButton = document.getElementById('capturePhoto');
const retakeButton = document.getElementById('retakePhoto');
const resultDiv = document.getElementById('result');


// Load the model when the page loads
async function loadModel() {
    try {
        model = await tf.loadLayersModel('../models/model.json');
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

// Initialize camera
async function startCamera() {
    console.log('Starting camera...'); // Debug log
    try {
        // Show loading indicator
        document.querySelector('.loading-indicator').style.display = 'block';
        
        // Check if stream exists and stop it
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        // Request camera access with specific constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        // Set up video element
        const video = document.getElementById('cameraFeed');
        if (video) {
            video.srcObject = stream;
            video.style.display = 'block';
            document.getElementById('startCamera').style.display = 'none';
            console.log('Camera started successfully'); // Debug log
        }

        await video.play(); // Ensure video starts playing

        // Update UI
        captureButton.style.display = 'block';
        document.querySelector('.loading-indicator').style.display = 'none';
        document.getElementById('cameraError').style.display = 'none';

    } catch (error) {
        console.error('Error accessing camera:', error);
        handleCameraError(error);
    }
}

// Add error handling function
function handleCameraError(error) {
    const errorElement = document.getElementById('cameraError');
    const errorMessage = errorElement.querySelector('p');
    
    // Hide loading indicator
    document.querySelector('.loading-indicator').style.display = 'none';
    
    // Show appropriate error message
    if (error.name === 'NotAllowedError') {
        errorMessage.textContent = 'Camera access denied. Please allow camera access and try again.';
    } else if (error.name === 'NotFoundError') {
        errorMessage.textContent = 'No camera found. Please ensure your device has a camera.';
    } else {
        errorMessage.textContent = `Camera error: ${error.message}`;
    }
    
    errorElement.style.display = 'block';
    startButton.style.display = 'block';
    startButton.textContent = 'Retry Camera Access';
}

// Capture photo
async function capturePhoto() {
    const canvas = document.getElementById('photoCanvas');
    const video = document.getElementById('cameraFeed');
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        // Convert canvas to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        
        // Generate unique filename
        const filename = `scan_${Date.now()}.jpg`;
        
        // Get Firebase instances
        const storage = getStorage();
        const storageRef = ref(storage, `scans/${filename}`);
        
        // Upload to Firebase Storage
        const uploadTask = await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(uploadTask.ref);

        // Save to Firestore
        const db = getFirestore();
        await addDoc(collection(db, 'scannedItems'), {
            imageUrl: imageUrl,
            timestamp: Date.now(),
            userId: auth.currentUser.uid,
            isRecyclable: null // Will be updated when ML model processes the image
        });

        // Show success message
        showNotification('Image saved successfully!', 'success');
        
        // Display the captured image
        const capturedImage = document.getElementById('capturedImage');
        capturedImage.src = imageUrl;
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        
        // Show retake button
        document.getElementById('retakePhoto').style.display = 'block';
        document.getElementById('capturePhoto').style.display = 'none';

    } catch (error) {
        console.error('Error saving image:', error);
        showNotification('Failed to save image', 'error');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Process captured image with the model
async function processImage() {
    try {
        // Prepare the image for the model
        const tensor = tf.browser.fromPixels(capturedImage)
            .resizeNearestNeighbor([224, 224]) // adjust size according to your model
            .toFloat()
            .expandDims();
        
        // Get prediction
        const prediction = await model.predict(tensor).data();
        
        // Display results
        showResults(prediction);
        resultDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Show classification results
function showResults(prediction) {
    const classificationResult = document.getElementById('classificationResult');
    const recyclingInstructions = document.getElementById('recyclingInstructions');
    
    // Adjust this based on your model's output classes
    const classes = ['Plastic', 'Glass', 'Paper', 'Metal', 'Organic'];
    const maxProbIndex = prediction.indexOf(Math.max(...prediction));
    
    classificationResult.innerHTML = `
        <h4>Item Type: ${classes[maxProbIndex]}</h4>
        <p>Confidence: ${(prediction[maxProbIndex] * 100).toFixed(2)}%</p>
    `;
    
    // Add recycling instructions based on classification
    recyclingInstructions.innerHTML = getRecyclingInstructions(classes[maxProbIndex]);
}

// Get recycling instructions based on item type
function getRecyclingInstructions(itemType) {
    const instructions = {
        'Plastic': 'Clean and rinse the plastic item. Remove any labels if possible. Place in the blue recycling bin.',
        'Glass': 'Rinse thoroughly. Remove caps/lids. Place in the glass recycling container.',
        'Paper': 'Ensure paper is clean and dry. Remove any plastic wrapping. Place in the paper recycling bin.',
        'Metal': 'Rinse thoroughly. Crush if possible to save space. Place in the metal recycling bin.',
        'Organic': 'Place in the green organic waste bin for composting.'
    };
    
    return `
        <h4>Recycling Instructions:</h4>
        <p>${instructions[itemType]}</p>
    `;
}

// Retake photo
function retakePhoto() {
    capturedImage.style.display = 'none';
    resultDiv.style.display = 'none';
    startCamera();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startCamera');
    
    if (startButton) {
        startButton.addEventListener('click', startCamera);
        console.log('Camera button listener added'); // Debug log
    } else {
        console.error('Start camera button not found'); // Debug log
    }
});

// Initialize buttons
const captureButton = document.getElementById('capturePhoto');
const retakeButton = document.getElementById('retakePhoto');

captureButton.addEventListener('click', capturePhoto);
retakeButton.addEventListener('click', retakePhoto);

// Load ML model
loadModel();