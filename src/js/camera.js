class CameraHandler {
    constructor() {
        // Initialize properties
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.startButton = null;
        this.captureButton = null;
        this.retakeButton = null;
        this.initialized = false;
    }

    async init() {
        try {
            // Wait for DOM to be fully loaded
            if (document.readyState !== 'complete') {
                await new Promise(resolve => window.addEventListener('load', resolve));
            }

            // Get elements after DOM is ready
            this.videoElement = document.getElementById('cameraFeed');
            this.canvasElement = document.getElementById('canvas');
            this.startButton = document.getElementById('startCameraBtn');
            this.captureButton = document.getElementById('captureBtn');
            this.retakeButton = document.getElementById('retakeBtn');

            if (!this.videoElement || !this.startButton) {
                throw new Error('Required camera elements not found');
            }

            // Add event listeners
            this.startButton.addEventListener('click', () => this.startCamera());
            this.captureButton?.addEventListener('click', () => this.captureImage());
            this.retakeButton?.addEventListener('click', () => this.retake());

            this.initialized = true;
            console.log('Camera initialized successfully');
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.showError(error.message);
        }
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'camera-error';
        errorEl.textContent = message;
        this.videoElement?.parentElement?.insertBefore(errorEl, this.videoElement);
    }

    async startCamera() {
        try {
            // Show loading indicator
            document.querySelector('.loading-indicator').style.display = 'flex';
            
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            this.startButton.style.display = 'none';
            this.captureButton.style.display = 'block';
            
            // Hide loading indicator
            document.querySelector('.loading-indicator').style.display = 'none';
            
            // Clear any previous error messages
            const errorElement = document.getElementById('cameraError');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            const errorElement = document.getElementById('cameraError');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.querySelector('p').textContent = 
                    'Unable to access camera. Please make sure you have granted camera permissions.';
            }
            document.querySelector('.loading-indicator').style.display = 'none';
        }
    }

    captureImage() {
        if (this.stream) {
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
            this.canvasElement.getContext('2d').drawImage(this.videoElement, 0, 0);

            // Convert to base64
            const imageData = this.canvasElement.toDataURL('image/jpeg');
            console.log('Image captured', imageData);

            // Stop camera
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;

            // Reset buttons
            this.startButton.style.display = 'block';
            this.captureButton.style.display = 'none';
        }
    }

    retake() {
        this.canvasElement.getContext('2d').clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.startButton.style.display = 'none';
        this.captureButton.style.display = 'block';
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.srcObject = null;
            this.stream = null;
        }
    }

    restartCamera() {
        this.stopCamera();
        resultArea.style.display = 'none';
        this.retakeButton.style.display = 'none';
        this.startButton.style.display = 'block';
        this.videoElement.style.display = 'none';
    }
}

// Export the class
export default CameraHandler;

// Add cleanup when leaving page
window.addEventListener('beforeunload', () => {
    const cameraHandler = new CameraHandler();
    cameraHandler.stopCamera();
});