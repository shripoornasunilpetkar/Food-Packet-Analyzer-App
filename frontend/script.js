document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const previewImage = document.getElementById('previewImage');
    const scanBtn = document.getElementById('scanBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2980b9';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // File input handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    // Handle selected file
    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewSection.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    // Scan button handler
    scanBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        loadingOverlay.style.display = 'flex';
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('http://localhost:3000/api/scan', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Store the results in localStorage
            localStorage.setItem('scanResults', JSON.stringify(data));
            
            // Redirect to results page
            window.location.href = 'results.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing image. Please try again.');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', () => {
        previewSection.style.display = 'none';
        fileInput.value = '';
    });
}); 