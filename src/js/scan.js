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
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        video.style.display = 'block';
        startButton.style.display = 'none';
        captureButton.style.display = 'block';
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

// Capture photo
function capturePhoto() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    capturedImage.src = canvas.toDataURL('image/jpeg');
    capturedImage.style.display = 'block';
    video.style.display = 'none';
    
    // Stop camera stream
    stream.getTracks().forEach(track => track.stop());
    
    captureButton.style.display = 'none';
    retakeButton.style.display = 'block';
    
    // Process the image
    processImage();
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
document.addEventListener('DOMContentLoaded', loadModel);
startButton.addEventListener('click', startCamera);
captureButton.addEventListener('click', capturePhoto);
retakeButton.addEventListener('click', retakePhoto);