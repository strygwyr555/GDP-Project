import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from './firebase-config.js';
import { firebaseConfig } from './firebase-config.js'; // Add this import

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

class CameraHandler {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.startButton = null;
        this.captureButton = null;
        this.retakeButton = null;
        this.saveButton = null;
        this.resultArea = null;
        this.loadingIndicator = null;
        this.errorElement = null;
    }

    async initialize() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    async setup() {
        try {
            // Get DOM elements with error checking
            this.video = document.getElementById('cameraFeed');
            this.startButton = document.getElementById('startCamera');
            
            if (!this.video || !this.startButton) {
                throw new Error('Required elements not found');
            }

            // Add debug logging
            console.log('Setting up camera handler...');
            
            // Use bind to preserve context
            this.startButton.addEventListener('click', () => {
                console.log('Start camera button clicked');
                this.startCamera().catch(err => {
                    console.error('Camera start error:', err);
                    this.showError(this.getErrorMessage(err));
                });
            });

        } catch (error) {
            console.error('Setup error:', error);
            this.showError(error.message);
        }
    }

    async startCamera() {
        try {
            console.log('Starting camera...');
            
            // Show loading indicator
            document.querySelector('.loading-indicator').style.display = 'block';
            
            // Clear any previous errors
            document.getElementById('cameraError').style.display = 'none';

            // Stop any existing stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Request camera access with explicit constraints
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            console.log('Requesting camera access with constraints:', constraints);
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!this.stream) {
                throw new Error('Failed to get camera stream');
            }

            console.log('Camera stream acquired');
            
            // Set up video element
            this.video.srcObject = this.stream;
            this.video.style.display = 'block';
            
            // Wait for video to be ready
            await this.video.play();

            // Update UI
            this.startButton.style.display = 'none';
            document.getElementById('capturePhoto').style.display = 'block';
            document.querySelector('.loading-indicator').style.display = 'none';
            
            console.log('Camera started successfully');

        } catch (error) {
            console.error('Camera error:', error);
            this.showError(this.getErrorMessage(error));
            document.querySelector('.loading-indicator').style.display = 'none';
            throw error; // Re-throw to be caught by caller
        }
    }

    captureImage() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.getContext('2d').drawImage(this.video, 0, 0);
        
        const capturedImage = document.getElementById('capturedImage');
        capturedImage.src = this.canvas.toDataURL('image/jpeg');
        capturedImage.style.display = 'block';
        
        this.video.style.display = 'none';
        this.captureButton.style.display = 'none';
        this.retakeButton.style.display = 'block';
        this.saveButton.style.display = 'block';
    }

    retake() {
        document.getElementById('capturedImage').style.display = 'none';
        this.video.style.display = 'block';
        this.retakeButton.style.display = 'none';
        this.saveButton.style.display = 'none';
        this.captureButton.style.display = 'block';
    }

    async savePhoto() {
        try {
            if (!auth.currentUser) {
                throw new Error('User not authenticated');
            }

            this.loadingIndicator.style.display = 'block';
            
            // Convert canvas to blob
            const blob = await new Promise((resolve, reject) => {
                this.canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
                    'image/jpeg',
                    0.8
                );
            });
            
            // Generate unique filename with user ID
            const filename = `scan_${auth.currentUser.uid}_${Date.now()}.jpg`;
            
            // Upload to Firebase Storage
            const storageRef = ref(storage, `scans/${filename}`);
            const uploadTask = await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(uploadTask.ref);

            // Save to Firestore with error handling
            try {
                await addDoc(collection(db, 'scannedItems'), {
                    imageUrl,
                    timestamp: Date.now(),
                    userId: auth.currentUser.uid,
                    isRecyclable: null,
                    source: 'camera'
                });
            } catch (dbError) {
                throw new Error(`Database save failed: ${dbError.message}`);
            }

            this.showNotification('Image saved successfully!', 'success');
            this.resetUI();

        } catch (error) {
            console.error('Error saving photo:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.loadingIndicator.style.display = 'none';
        }
    }

    resetUI() {
        this.stopCamera();
        this.startButton.style.display = 'block';
        this.retakeButton.style.display = 'none';
        this.saveButton.style.display = 'none';
        this.capturedImage.style.display = 'none';
        this.resultArea.style.display = 'none';
    }

    stopCamera() {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (e) {
                        console.error('Error stopping track:', e);
                    }
                });
                this.stream = null;
            }
            if (this.video) {
                this.video.srcObject = null;
                this.video.style.display = 'none';
            }
        } catch (error) {
            console.error('Error in stopCamera:', error);
        }
    }

    showError(message) {
        const errorElement = document.getElementById('cameraError');
        const errorMessage = errorElement.querySelector('p');
        errorMessage.textContent = message;
        errorElement.style.display = 'block';
        document.querySelector('.loading-indicator').style.display = 'none';
    }

    getErrorMessage(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Camera access denied. Please allow camera access and try again.';
            case 'NotFoundError':
                return 'No camera found. Please ensure your device has a camera.';
            case 'NotReadableError':
                return 'Camera is already in use or not accessible.';
            default:
                return `Camera error: ${error.message}`;
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize camera handler with error handling
try {
    console.log('Initializing camera handler...');
    const cameraHandler = new CameraHandler();
    await cameraHandler.initialize();
} catch (error) {
    console.error('Initialization error:', error);
    // Show error to user
    const errorElement = document.getElementById('cameraError');
    if (errorElement) {
        errorElement.querySelector('p').textContent = 'Failed to initialize camera handler';
        errorElement.style.display = 'block';
    }
}

// Cleanup when page is unloaded
window.addEventListener('beforeunload', () => {
    cameraHandler.stopCamera();
});