class CameraHandler {
    constructor() {
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.startButton = null;
        this.captureButton = null;
        this.retakeButton = null;
        this.resultArea = null;
    }

    async initialize() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Get DOM elements
        this.videoElement = document.getElementById('cameraFeed');
        this.canvasElement = document.getElementById('canvas');
        this.startButton = document.getElementById('startCameraBtn');
        this.captureButton = document.getElementById('captureBtn');
        this.retakeButton = document.getElementById('retakeBtn');
        this.resultArea = document.getElementById('resultArea');

        // Add event listeners
        this.startButton?.addEventListener('click', () => this.startCamera());
        this.captureButton?.addEventListener('click', () => this.captureImage());
        this.retakeButton?.addEventListener('click', () => this.retake());

        // Error handling
        if (!this.videoElement) {
            console.error('Camera feed element not found');
            return;
        }

        // Check for camera support
        if (!navigator.mediaDevices?.getUserMedia) {
            console.error('Camera API not supported');
            alert('Your browser does not support camera access');
            return;
        }
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (this.videoElement) {
                this.videoElement.srcObject = this.stream;
                await this.videoElement.play();
                
                this.startButton.style.display = 'none';
                this.captureButton.style.display = 'block';
                this.resultArea.style.display = 'none';
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access the camera. Please ensure you have granted camera permissions.');
        }
    }

    async captureImage() {
        if (!this.canvasElement || !this.videoElement) return;

        const context = this.canvasElement.getContext('2d');
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        context.drawImage(this.videoElement, 0, 0);

        // Convert to base64
        const imageData = this.canvasElement.toDataURL('image/jpeg', 0.8);
        
        // Stop camera
        this.stopCamera();

        // Show retake button and result area
        this.captureButton.style.display = 'none';
        this.retakeButton.style.display = 'block';
        this.resultArea.style.display = 'block';

        // Here you would send the image to your AI model
        this.processImage(imageData);
    }

    async processImage(imageData) {
        // This is where you would integrate with your AI model
        // For now, just showing a placeholder
        const resultDiv = document.getElementById('predictionResult');
        if (resultDiv) {
            resultDiv.innerHTML = '<p>Processing image...</p>';
            // Here you would call your model's prediction function
        }
    }

    retake() {
        this.startCamera();
        this.retakeButton.style.display = 'none';
        this.resultArea.style.display = 'none';
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }
        }
    }

    displayResults(result) {
  const resultDiv = document.getElementById('predictionResult');
  resultDiv.innerHTML = `
    <h4 class="${result.category.toLowerCase()}">
      ${result.category} (${(result.confidence * 100).toFixed(0)}% confidence)
    </h4>
    <p><strong>Bin:</strong> ${result.binType}</p>
    <p><strong>Tip:</strong> ${result.recyclingTip}</p>
  `;
  
  // Update bin type and material info
  document.getElementById('binType').textContent = `Bin Type: ${result.binType}`;
  document.getElementById('materialType').textContent = `Material: ${result.category}`;
  document.getElementById('recyclingTip').textContent = `Tip: ${result.recyclingTip}`;
  
  // Add category class to recycling info
  const recyclingInfo = document.querySelector('.recycling-info');
  recyclingInfo.className = `recycling-info ${result.category.toLowerCase()}`;
}
}

// Initialize camera handler
const cameraHandler = new CameraHandler();
cameraHandler.initialize();