/**
 * Image Diagnostics Tool
 * 
 * This script helps diagnose image loading issues by:
 * 1. Detecting image load errors
 * 2. Checking file paths
 * 3. Providing debugging information
 * 
 * Add a ?debug=true parameter to the URL to activate
 */

(function() {
  // Only run if in debug mode or by query parameter (add ?debug=images to URL)
  const isDebugMode = window.location.search.includes('debug=images');
  
  if (!isDebugMode && !document.getElementById('debug-panel')) {
    return; // Only run in debug mode
  }
  
  console.log('[ImageDiagnostics] Starting image monitoring');

  // Create diagnostic panel if it doesn't exist
  let diagnosticsPanel = document.getElementById('image-diagnostics');
  
  if (!diagnosticsPanel) {
    diagnosticsPanel = document.createElement('div');
    diagnosticsPanel.id = 'image-diagnostics';
    diagnosticsPanel.className = 'diagnostics-panel';
    diagnosticsPanel.innerHTML = `
      <h3>Image Diagnostics</h3>
      <div class="controls">
        <button id="check-images">Check All Images</button>
        <button id="clear-cache">Clear Cache</button>
      </div>
      <div class="results">
        <div class="loading-stats">
          <span id="loaded-count">0</span> loaded / 
          <span id="failed-count">0</span> failed / 
          <span id="total-count">0</span> total
        </div>
        <div id="image-status-list"></div>
      </div>
    `;
    
    // Append to the debug panel or body
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      debugPanel.appendChild(diagnosticsPanel);
    } else {
      // Create minimal debug panel
      const minimalDebug = document.createElement('div');
      minimalDebug.id = 'minimal-debug';
      minimalDebug.style.cssText = 'position:fixed; bottom:0; right:0; background:rgba(0,0,0,0.8); color:white; padding:10px; z-index:9999; max-height:50vh; overflow:auto;';
      minimalDebug.appendChild(diagnosticsPanel);
      document.body.appendChild(minimalDebug);
    }

    // Style diagnostics panel
    const style = document.createElement('style');
    style.textContent = `
      .diagnostics-panel { margin: 10px 0; }
      .diagnostics-panel h3 { margin: 0 0 10px 0; }
      .diagnostics-panel .controls { margin-bottom: 10px; }
      .diagnostics-panel button { margin-right: 5px; }
      .image-status-item { margin: 5px 0; padding: 5px; border-bottom: 1px solid #ddd; }
      .image-status-item.success { color: green; }
      .image-status-item.error { color: red; }
      .image-status-item.pending { color: orange; }
    `;
    document.head.appendChild(style);
  }

  // Add event listeners
  document.getElementById('check-images').addEventListener('click', checkAllImages);
  document.getElementById('clear-cache').addEventListener('click', clearImageCache);

  // Stats counters
  let totalImages = 0;
  let loadedImages = 0;
  let failedImages = 0;

  // Monitor all image loads
  function monitorImageLoads() {
    // Proxy the original ImageProxy.loadImage method
    if (window.ImageProxy && ImageProxy.loadImage) {
      const originalLoadImage = ImageProxy.loadImage;
      
      ImageProxy.loadImage = function(imgElement, primaryUrl, fallbackUrl, onSuccess, onError) {
        // Track this image
        trackImage(imgElement, primaryUrl, fallbackUrl);
        
        // Call original method
        return originalLoadImage.call(this, imgElement, primaryUrl, fallbackUrl, 
          function(img) {
            // Success callback
            updateImageStatus(imgElement, 'success');
            if (onSuccess) onSuccess(img);
          }, 
          function(img) {
            // Error callback
            updateImageStatus(imgElement, 'error');
            if (onError) onError(img);
          }
        );
      };
      
      console.log('[ImageDiagnostics] Successfully hooked into ImageProxy');
    } else {
      console.warn('[ImageDiagnostics] ImageProxy not found, monitoring all images instead');
      
      // Monitor all images
      document.addEventListener('load', function(event) {
        if (event.target.tagName === 'IMG') {
          updateImageStatus(event.target, 'success');
        }
      }, true);
      
      document.addEventListener('error', function(event) {
        if (event.target.tagName === 'IMG') {
          updateImageStatus(event.target, 'error');
        }
      }, true);
    }
  }

  // Track a new image
  function trackImage(imgElement, primaryUrl, fallbackUrl) {
    if (!imgElement || !imgElement.id) return;
    
    totalImages++;
    document.getElementById('total-count').textContent = totalImages;
    
    const statusList = document.getElementById('image-status-list');
    const statusItem = document.createElement('div');
    statusItem.className = 'image-status-item pending';
    statusItem.id = 'img-status-' + imgElement.id;
    statusItem.innerHTML = `
      <div>ID: ${imgElement.id}</div>
      <div>Primary: ${primaryUrl || 'None'}</div>
      ${fallbackUrl ? `<div>Fallback: ${fallbackUrl}</div>` : ''}
      <div>Status: <span class="status">Pending</span></div>
    `;
    
    statusList.appendChild(statusItem);
  }

  // Update image status
  function updateImageStatus(imgElement, status) {
    if (!imgElement || !imgElement.id) return;
    
    const statusItem = document.getElementById('img-status-' + imgElement.id);
    if (!statusItem) return;
    
    statusItem.className = `image-status-item ${status}`;
    statusItem.querySelector('.status').textContent = status === 'success' ? 'Loaded' : 'Failed';
    
    // Update counters
    if (status === 'success') {
      loadedImages++;
      document.getElementById('loaded-count').textContent = loadedImages;
    } else if (status === 'error') {
      failedImages++;
      document.getElementById('failed-count').textContent = failedImages;
    }
  }

  // Check all images on the page
  function checkAllImages() {
    const statusList = document.getElementById('image-status-list');
    statusList.innerHTML = '';
    
    // Reset counters
    totalImages = 0;
    loadedImages = 0;
    failedImages = 0;
    document.getElementById('total-count').textContent = totalImages;
    document.getElementById('loaded-count').textContent = loadedImages;
    document.getElementById('failed-count').textContent = failedImages;
    
    // Get all images on the page
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (!src) return;
      
      totalImages++;
      
      const statusItem = document.createElement('div');
      statusItem.className = 'image-status-item pending';
      statusItem.id = 'img-status-check-' + totalImages;
      statusItem.innerHTML = `
        <div>Element: ${img.id || 'unnamed-' + totalImages}</div>
        <div>Source: ${src}</div>
        <div>Status: <span class="status">Checking...</span></div>
      `;
      
      statusList.appendChild(statusItem);
      
      // Check if the image is already loaded
      if (img.complete) {
        if (img.naturalWidth > 0) {
          statusItem.className = 'image-status-item success';
          statusItem.querySelector('.status').textContent = `Loaded (${img.naturalWidth}×${img.naturalHeight})`;
          loadedImages++;
        } else {
          statusItem.className = 'image-status-item error';
          statusItem.querySelector('.status').textContent = 'Failed';
          failedImages++;
        }
      } else {
        // Not loaded yet, set up listeners
        img.addEventListener('load', function() {
          statusItem.className = 'image-status-item success';
          statusItem.querySelector('.status').textContent = `Loaded (${img.naturalWidth}×${img.naturalHeight})`;
          loadedImages++;
          document.getElementById('loaded-count').textContent = loadedImages;
        });
        
        img.addEventListener('error', function() {
          statusItem.className = 'image-status-item error';
          statusItem.querySelector('.status').textContent = 'Failed';
          failedImages++;
          document.getElementById('failed-count').textContent = failedImages;
        });
      }
    });
    
    document.getElementById('total-count').textContent = totalImages;
    document.getElementById('loaded-count').textContent = loadedImages;
    document.getElementById('failed-count').textContent = failedImages;
  }

  // Clear browser image cache
  function clearImageCache() {
    const statusList = document.getElementById('image-status-list');
    statusList.innerHTML = '<div class="image-status-item">Clearing cache...</div>';
    
    // Force reload all images by appending timestamp to src
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src) {
        const originalSrc = img.src;
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent placeholder
        setTimeout(() => {
          img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + '_cache=' + Date.now();
        }, 50);
      }
    });
    
    statusList.innerHTML = '<div class="image-status-item success">Cache cleared. Reloading images...</div>';
    
    // Check images again after a delay
    setTimeout(checkAllImages, 1000);
  }

  // Initialize
  monitorImageLoads();
  
  // Auto-check if in debug mode
  if (isDebugMode) {
    setTimeout(checkAllImages, 1000);
  }
})(); 