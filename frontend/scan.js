document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const cameraArea = document.getElementById('cameraArea');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    const retakeButton = document.getElementById('retakeButton');
    const analyzeButton = document.getElementById('analyzeButton');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const cameraOption = document.getElementById('cameraOption');
    const uploadOption = document.getElementById('uploadOption');
    const fileInput = document.getElementById('fileInput');
    const camera = document.getElementById('camera');
    const switchCameraButton = document.getElementById('switchCamera');
    const captureButton = document.getElementById('captureButton');
    const uploadOptions = document.querySelector('.upload-options');

    let stream = null;
    let facingMode = 'environment';
    let currentImage = null;

    // Handle upload option click
    uploadOption.addEventListener('click', () => {
        uploadOptions.style.display = 'none';
        uploadArea.style.display = 'block';
        cameraArea.style.display = 'none';
        previewSection.style.display = 'none';
    });

    // Handle camera option click
    cameraOption.addEventListener('click', async () => {
        uploadOptions.style.display = 'none';
        uploadArea.style.display = 'none';
        cameraArea.style.display = 'block';
        previewSection.style.display = 'none';
        
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
            });
            camera.srcObject = stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera. Please try uploading an image instead.');
            uploadOptions.style.display = 'grid';
            cameraArea.style.display = 'none';
        }
    });

    // Handle switch camera button
    switchCameraButton.addEventListener('click', async () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode } 
            });
            camera.srcObject = stream;
        } catch (err) {
            console.error('Error switching camera:', err);
            alert('Error switching camera. Please try again.');
        }
    });

    // Handle capture button
    captureButton.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        canvas.getContext('2d').drawImage(camera, 0, 0);
        currentImage = canvas.toDataURL('image/jpeg');
        previewImage.src = currentImage;
        previewSection.style.display = 'block';
        cameraArea.style.display = 'none';
    });

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Handle retake button
    retakeButton.addEventListener('click', () => {
        previewSection.style.display = 'none';
        uploadOptions.style.display = 'grid';
        fileInput.value = '';
        previewImage.src = '';
        currentImage = null;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });

    // Handle analyze button
    analyzeButton.addEventListener('click', async () => {
        if (!currentImage) {
            alert('Please upload or capture an image first.');
            return;
        }

        loadingOverlay.style.display = 'flex';
        
        try {
            // Send the image to the backend for analysis
            const response = await fetch('http://localhost:3000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: currentImage })
            });

            const result = await response.json();
            
            if (!response.ok) {
                // Handle specific error messages from the server
                const errorMessage = result.message || 'Failed to analyze image. Please try again.';
                
                // Show error message in a more user-friendly way
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = errorMessage;
                
                // Remove any existing error message
                const existingError = document.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add the new error message below the upload area
                uploadArea.parentNode.insertBefore(errorDiv, uploadArea.nextSibling);
                
                // Remove the error message after 5 seconds
                setTimeout(() => {
                    errorDiv.remove();
                }, 5000);
                
                loadingOverlay.style.display = 'none';
                return;
            }
            
            // Store the result in localStorage for the results page
            localStorage.setItem('analysisResult', JSON.stringify(result));
            
            // Redirect to results page
            window.location.href = 'results.html';
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('An error occurred while analyzing the image. Please try again later.');
            loadingOverlay.style.display = 'none';
        }
    });

    // Helper function to handle file
    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = e.target.result;
            previewImage.src = currentImage;
            previewSection.style.display = 'block';
            uploadArea.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // Cleanup when leaving the page
    window.addEventListener('beforeunload', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
}); 