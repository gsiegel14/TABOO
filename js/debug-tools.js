/**
 * Debug Tools
 * Adds debug tools and enables debug panel when ?debug=true is in URL
 */

(function() {
  // Check if debug mode is enabled via URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.get('debug');
  
  if (debugMode === 'true' || debugMode === '1') {
    console.log('[Debug] Debug mode enabled via URL parameter');
    
    // Wait for DOM to be loaded
    document.addEventListener('DOMContentLoaded', function() {
      // Find debug panel
      const debugPanel = document.getElementById('debug-panel');
      
      if (debugPanel) {
        // Show debug panel
        debugPanel.classList.remove('hidden');
        
        // Toggle debug content
        const debugContent = document.querySelector('.debug-content');
        if (debugContent) {
          debugContent.classList.remove('hidden');
        }
        
        // Add debug tools to every image
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          // Add debug border
          img.style.border = '1px solid rgba(0, 255, 0, 0.3)';
          
          // Add info tooltip
          const tooltip = document.createElement('div');
          tooltip.className = 'debug-tooltip';
          tooltip.innerHTML = `
            <div>Image #${index + 1}</div>
            <div>ID: ${img.id || 'none'}</div>
            <div>src: ${img.src.substring(0, 30)}...</div>
            <div class="dim">?x?</div>
          `;
          
          // Wrapper for the image
          const parent = img.parentElement;
          if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(tooltip);
            
            // Update dimensions when loaded
            img.addEventListener('load', () => {
              const dim = tooltip.querySelector('.dim');
              if (dim) {
                dim.textContent = `${img.naturalWidth}x${img.naturalHeight}`;
              }
            });
          }
        });
        
        // Add general debug info
        const generalInfo = document.createElement('div');
        generalInfo.className = 'debug-general-info';
        generalInfo.innerHTML = `
          <h4>Page Info</h4>
          <div>URL: ${window.location.href}</div>
          <div>User Agent: ${navigator.userAgent}</div>
          <div>Screen: ${window.innerWidth}x${window.innerHeight}</div>
          <h4>Performance</h4>
          <div id="perf-info">Gathering data...</div>
        `;
        
        // Add to debug panel
        const debugLog = document.getElementById('debug-log');
        if (debugLog) {
          debugLog.parentElement.insertBefore(generalInfo, debugLog);
        }
        
        // Monitor performance
        setInterval(() => {
          const perfInfo = document.getElementById('perf-info');
          if (perfInfo) {
            const memory = window.performance && window.performance.memory 
              ? `Memory: ${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))}MB / ${Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024))}MB`
              : 'Memory info not available';
            
            perfInfo.innerHTML = `
              <div>${memory}</div>
              <div>DOM Elements: ${document.getElementsByTagName('*').length}</div>
              <div>Images: ${document.getElementsByTagName('img').length}</div>
            `;
          }
        }, 2000);
        
        // Add styles for debug elements
        const style = document.createElement('style');
        style.textContent = `
          .debug-tooltip {
            position: absolute;
            top: 0;
            left: 0;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            font-size: 10px;
            border-radius: 0 0 4px 0;
            z-index: 1000;
            pointer-events: none;
          }
          
          .debug-general-info {
            background: #f0f0f0;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            font-size: 12px;
          }
          
          .debug-general-info h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
          }
          
          #debug-panel {
            background: #f8f8f8;
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 30px;
            border-radius: 8px;
          }
        `;
        document.head.appendChild(style);
        
        console.log('[Debug] Debug panel initialized');
      } else {
        console.warn('[Debug] Debug panel not found in DOM');
      }
    });
  }
})(); 