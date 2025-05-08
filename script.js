// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get references to HTML elements ---
    const startSection = document.getElementById('start-section');
    const scanSection = document.getElementById('scan-section');
    const reviewSection = document.getElementById('review-section'); // We'll use this later

    const startScanBtn = document.getElementById('start-scan-btn');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const captureBtn = document.getElementById('capture-btn'); // For future use
    const videoElement = document.getElementById('camera-feed');
    const statusMessage = document.getElementById('status-message');

    let currentStream = null; // Variable to hold the camera stream

    // --- Event Listeners ---

    // 1. Start Scanning Button Click
    startScanBtn.addEventListener('click', () => {
        // Hide start section, show scan section
        startSection.classList.remove('active-section');
        startSection.classList.add('hidden-section');
        scanSection.classList.remove('hidden-section');
        scanSection.classList.add('active-section');
        reviewSection.classList.add('hidden-section'); // Ensure review is hidden
        reviewSection.classList.remove('active-section');
        clearStatus(); // Clear any previous messages
        startCamera(); // Initialize and start the camera
    });

    // 2. Cancel Scanning Button Click
    cancelScanBtn.addEventListener('click', () => {
        stopCamera(); // Stop the camera stream
        // Hide scan section, show start section
        scanSection.classList.remove('active-section');
        scanSection.classList.add('hidden-section');
        startSection.classList.remove('hidden-section');
        startSection.classList.add('active-section');
        clearStatus();
    });

    // --- Camera Functions ---

    async function startCamera() {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError("Camera access is not supported by your browser.");
            // Optionally switch back to start section here
            switchToStartSection();
            return;
        }

        // Define constraints for the camera
        // Try to get the back camera ('environment') first, fall back to any camera
        const constraints = {
            video: {
                facingMode: { exact: "environment" }, // Prefer back camera
                width: { ideal: 1280 }, // Suggest resolution, browser may adjust
                height: { ideal: 720 }
            },
            audio: false // We don't need audio
        };

        try {
            // Try getting the back camera
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            console.warn("Could not get rear camera, trying default camera:", err);
            // If environment fails, try default camera without facingMode constraint
            const fallbackConstraints = { video: true, audio: false };
            try {
                currentStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            } catch (err) {
                handleCameraError(err);
                return; // Exit if fallback also fails
            }
        }

        // --- If stream is successfully obtained ---
        videoElement.srcObject = currentStream;
        videoElement.play().catch(err => {
            // Handle potential errors during play() e.g. on some browsers
            console.error("Error playing video stream:", err);
            showError("Could not start camera display.");
            stopCamera();
            switchToStartSection();
        });

        // Add event listener to ensure video is playing before enabling capture
        videoElement.addEventListener('playing', () => {
            console.log("Camera stream started.");
            // Enable capture button (if needed)
            // captureBtn.disabled = false;
        });

         // Handle cases where the stream ends unexpectedly
        currentStream.getVideoTracks()[0].addEventListener('ended', () => {
             console.warn("Camera stream ended unexpectedly.");
             showError("Camera disconnected.");
             stopCamera(); // Clean up
             switchToStartSection();
        });

    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.stop(); // Stop each track (video track in this case)
            });
            videoElement.srcObject = null; // Remove stream from video element
            currentStream = null;
            console.log("Camera stream stopped.");
            // Disable capture button (if needed)
            // captureBtn.disabled = true;
        }
    }

    // --- Error Handling and UI Updates ---

    function handleCameraError(error) {
        console.error("getUserMedia error:", error.name, error.message);
        let message = "Could not access the camera.";
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            message = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            message = "No camera found on this device.";
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
             message = "Camera is already in use or cannot be accessed.";
        } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            message = "Camera does not meet requirements (e.g., resolution, facing mode).";
        } else if (error.name === 'TypeError') {
             message = "Invalid camera constraints provided.";
        }
        showError(message);
        switchToStartSection(); // Go back to start if camera fails
    }

    function showError(message) {
        statusMessage.textContent = message;
        statusMessage.className = 'status error'; // Apply error styling
    }

    function clearStatus() {
        statusMessage.textContent = '';
        statusMessage.className = 'status'; // Remove specific styling
    }

     function switchToStartSection() {
        // Ensure camera is stopped if running
        stopCamera();
        // Switch UI sections
        scanSection.classList.remove('active-section');
        scanSection.classList.add('hidden-section');
        reviewSection.classList.remove('active-section');
        reviewSection.classList.add('hidden-section');
        startSection.classList.remove('hidden-section');
        startSection.classList.add('active-section');
    }

}); // End DOMContentLoaded