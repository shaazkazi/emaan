document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const controls = document.getElementById('controls');
    const applyWatermarkBtn = document.getElementById('applyWatermark');
    const resultContainer = document.getElementById('resultContainer');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const watermarkOpacity = document.getElementById('watermarkOpacity');
    const watermarkSize = document.getElementById('watermarkSize');
    const watermarkPosition = document.getElementById('watermarkPosition');
    const opacityValue = document.getElementById('opacityValue');
    const sizeValue = document.getElementById('sizeValue');
    const newImageBtn = document.getElementById('newImageBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    // Variables to store the uploaded image and logo
    let uploadedImage = null;
    let watermarkLogo = new Image();
    
    // Set crossOrigin to anonymous to avoid tainted canvas
    watermarkLogo.crossOrigin = "anonymous";
    watermarkLogo.src = 'assets/logo.png';
    
    // Handle file upload
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            showLoading();
            const reader = new FileReader();
            
            reader.onload = function(e) {
                uploadedImage = new Image();
                uploadedImage.onload = function() {
                    imagePreview.src = uploadedImage.src;
                    previewContainer.style.display = 'block';
                    controls.style.display = 'block';
                    resultContainer.style.display = 'none';
                    hideLoading();
                };
                uploadedImage.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Handle drag and drop
    const uploadLabel = document.querySelector('.upload-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadLabel.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadLabel.classList.remove('highlight');
    }
    
    uploadLabel.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.type.match('image.*')) {
            imageUpload.files = dt.files;
            const event = new Event('change');
            imageUpload.dispatchEvent(event);
        }
    }
    
    // Update range input displays
    watermarkOpacity.addEventListener('input', function() {
        opacityValue.textContent = this.value;
    });
    
    watermarkSize.addEventListener('input', function() {
        sizeValue.textContent = this.value;
    });
    
    // Apply watermark
    applyWatermarkBtn.addEventListener('click', function() {
        if (!uploadedImage) {
            alert('Please upload an image first');
            return;
        }
        
        showLoading();
        
        // Use setTimeout to allow the loading overlay to appear before processing
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to match the uploaded image
            canvas.width = uploadedImage.width;
            canvas.height = uploadedImage.height;
            
            // Draw the uploaded image on the canvas
            ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
            
            // Check if watermark is loaded
            if (watermarkLogo.complete) {
                applyWatermarkToCanvas(ctx, canvas, watermarkLogo);
            } else {
                // If watermark is not loaded yet, wait for it
                watermarkLogo.onload = function() {
                    applyWatermarkToCanvas(ctx, canvas, watermarkLogo);
                };
                
                // Handle watermark loading error
                watermarkLogo.onerror = function() {
                    hideLoading();
                    alert('Error loading the watermark logo. Please make sure assets/logo.png exists.');
                };
            }
        }, 100);
    });
    
    function applyWatermarkToCanvas(ctx, canvas, watermarkLogo) {
        // Calculate watermark dimensions based on the size setting
        const size = parseFloat(watermarkSize.value);
        const watermarkWidth = canvas.width * size;
        const watermarkHeight = (watermarkLogo.height / watermarkLogo.width) * watermarkWidth;
        
        // Calculate watermark position based on the position setting
        let x, y;
        const padding = Math.min(30, canvas.width * 0.03); // Responsive padding
        
        switch (watermarkPosition.value) {
            case 'center':
                x = (canvas.width - watermarkWidth) / 2;
                y = (canvas.height - watermarkHeight) / 2;
                break;
            case 'top-left':
                x = padding;
                y = padding;
                break;
            case 'top-right':
                x = canvas.width - watermarkWidth - padding;
                y = padding;
                break;
            case 'bottom-left':
                x = padding;
                y = canvas.height - watermarkHeight - padding;
                break;
            case 'bottom-right':
            default:
                x = canvas.width - watermarkWidth - padding;
                y = canvas.height - watermarkHeight - padding;
                break;
        }
        
        // Set watermark opacity
        ctx.globalAlpha = parseFloat(watermarkOpacity.value);
        
        // Draw the watermark
        ctx.drawImage(watermarkLogo, x, y, watermarkWidth, watermarkHeight);
        
        // Reset global alpha
        ctx.globalAlpha = 1.0;
        
        // Display the result
        resultImage.src = canvas.toDataURL('image/png');
        resultContainer.style.display = 'block';
        
        // Scroll to result
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Update download link
        downloadBtn.href = canvas.toDataURL('image/png');
        
        hideLoading();
    }
    
    // Process new image button
    newImageBtn.addEventListener('click', function() {
        // Reset the file input
        imageUpload.value = '';
        
        // Hide the result container
        resultContainer.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Loading overlay functions
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }
    
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }
    
    // Pre-load the watermark logo to avoid CORS issues
    function preloadWatermark() {
        // Create a new image element for the watermark
        const tempImg = new Image();
        tempImg.crossOrigin = "anonymous";
        
        tempImg.onload = function() {
            // Create a temporary canvas to draw the watermark
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = tempImg.width;
            tempCanvas.height = tempImg.height;
            
            // Draw the watermark on the canvas
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(tempImg, 0, 0);
            
            // Convert the canvas to a data URL and set it as the source for the watermark logo
            try {
                const dataURL = tempCanvas.toDataURL('image/png');
                watermarkLogo = new Image();
                watermarkLogo.src = dataURL;
            } catch (e) {
                console.error("Error converting watermark to data URL:", e);
                alert("There was an issue loading the watermark. Please ensure the logo file is accessible.");
            }
        };
        
        tempImg.onerror = function() {
            console.error("Error loading watermark image");
            alert("Could not load the watermark image. Please check if assets/logo.png exists.");
        };
        
        // Set the source of the temporary image
        tempImg.src = 'assets/logo.png';
    }
    
    // Call preloadWatermark on page load
    preloadWatermark();
});
