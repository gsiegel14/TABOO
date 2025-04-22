/**
 * Image Size Fixer
 * Ensures that images are displayed at the correct size
 */

(function() {
  // Run after DOM content is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[ImageSizeFixer] Initializing image size fix');
    
    // Get all image containers
    const imageContainers = document.querySelectorAll('.image-container');
    
    // Apply image optimization to each container
    imageContainers.forEach(container => {
      const wrapper = container.querySelector('.image-wrapper');
      const img = container.querySelector('img');
      const loadingIndicator = container.querySelector('.image-loading-indicator');
      
      if (!img) return;
      
      // Ensure minimum height for wrapper
      if (wrapper) {
        wrapper.style.minHeight = '300px';
      }
      
      // Add loading class
      container.classList.add('loading');
      
      // Show loading indicator
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      }
      
      // When image loads or errors
      const imageStateChange = () => {
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
        
        // Check if image loaded successfully
        if (img.complete && img.naturalWidth > 0) {
          container.classList.remove('loading');
          container.classList.add('loaded');
          
          // If image is wider than tall, limit width
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          if (aspectRatio > 1.3) {
            img.style.width = '100%';
            img.style.height = 'auto';
          } 
          // If image is taller than wide, limit height
          else if (aspectRatio < 0.7) {
            img.style.height = '100%';
            img.style.width = 'auto';
          }
          
          // Center the image
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          
          console.log(`[ImageSizeFixer] Image loaded: ${img.src.substring(0, 50)}... (${img.naturalWidth}x${img.naturalHeight})`);
        } else {
          container.classList.remove('loading');
          container.classList.add('error');
          console.warn(`[ImageSizeFixer] Image failed to load: ${img.src.substring(0, 50)}...`);
        }
      };
      
      // Check if image is already loaded
      if (img.complete) {
        imageStateChange();
      } else {
        img.addEventListener('load', imageStateChange);
        img.addEventListener('error', imageStateChange);
      }
    });
    
    // Add some CSS fixes for image display
    const style = document.createElement('style');
    style.textContent = `
      .image-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        background-color: #f8f8f8;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .image-loading-indicator {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.7);
        z-index: 2;
      }
      
      .image-wrapper img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        z-index: 1;
      }
      
      .image-container.loading .image-wrapper {
        background-color: #f0f0f0;
      }
      
      .image-container.error .image-wrapper {
        background-color: #fff0f0;
      }
      
      /* Ensure card images container has proper spacing */
      .card-images {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      @media (min-width: 768px) {
        .card-images {
          flex-direction: row;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add listener to fix images when card flips
    const tabooCard = document.getElementById('taboo-card');
    if (tabooCard) {
      tabooCard.addEventListener('click', function() {
        // Give time for the flip to complete
        setTimeout(() => {
          // Re-check all images
          imageContainers.forEach(container => {
            const img = container.querySelector('img');
            if (img && img.complete && img.naturalWidth > 0) {
              container.classList.remove('loading');
              container.classList.add('loaded');
            }
          });
        }, 300);
      });
    }
    
    console.log('[ImageSizeFixer] Setup complete');
  });
})(); 