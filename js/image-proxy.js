/**
 * Image Proxy Utility
 * Helps load external images with fallbacks and error handling
 */

const ImageProxy = {
    // Map to track image loading attempts
    loadingAttempts: {},
    
    // Proxy URL for handling CORS issues (use a service like images.weserv.nl)
    proxyUrl: 'https://images.weserv.nl/?url=',
    
    // Default image to use when everything fails
    defaultImage: null,
    
    // Domains known to block hotlinking
    restrictedDomains: [
        'radiopaedia.org',
        'nysora.com',
        'acep.org',
        'wikimedia.org', // Added wikimedia which often has CORS issues
        'wikipedia.org'  // Added wikipedia which often has CORS issues
    ],
    
    /**
     * Load an image with fallbacks
     * @param {HTMLImageElement} imgElement - The img element to load into
     * @param {string} primaryUrl - The primary URL to try first
     * @param {string|null} fallbackUrl - Optional fallback URL if primary fails
     * @param {Function} onSuccess - Callback when image loads successfully
     * @param {Function} onError - Callback when all attempts fail
     * @param {string|null} sourceUrl - Optional source URL to use as secondary image
     */
    loadImage: function(imgElement, primaryUrl, fallbackUrl = null, onSuccess = null, onError = null, sourceUrl = null) {
        if (!imgElement) return;
        
        // Reset tracking for this element
        const elementId = imgElement.id || Math.random().toString(36).substring(7);
        this.loadingAttempts[elementId] = {
            attemptCount: 0,
            urls: []
        };
        
        // Build list of URLs to try in sequence - only add valid URLs
        const urlsToTry = [];
        
        // Primary URL - clean it up if broken
        if (primaryUrl && primaryUrl !== 'null' && primaryUrl !== 'undefined') {
            // Prioritize local files first
            if (!primaryUrl.startsWith('http')) {
                urlsToTry.push(primaryUrl);
            } else {
                // For external URLs, try direct then proxy
                urlsToTry.push(primaryUrl);
                if (this.shouldUseProxy(primaryUrl)) {
                    urlsToTry.push(this.getProxiedUrl(primaryUrl));
                }
            }
        }
        
        // Fallback URL if different from primary
        if (fallbackUrl && fallbackUrl !== primaryUrl && 
            fallbackUrl !== 'null' && fallbackUrl !== 'undefined') {
            
            urlsToTry.push(fallbackUrl);
            
            // If fallback is external, also try proxy
            if (fallbackUrl.startsWith('http') && this.shouldUseProxy(fallbackUrl)) {
                urlsToTry.push(this.getProxiedUrl(fallbackUrl));
            }
        }
        
        // Add source URL if provided and different from previous URLs
        if (sourceUrl && sourceUrl !== primaryUrl && sourceUrl !== fallbackUrl &&
            sourceUrl !== 'null' && sourceUrl !== 'undefined') {
            
            urlsToTry.push(sourceUrl);
            
            // If source URL is external, also try proxy
            if (sourceUrl.startsWith('http') && this.shouldUseProxy(sourceUrl)) {
                urlsToTry.push(this.getProxiedUrl(sourceUrl));
            }
        }
        
        // No more default fallback - we don't use placeholders
        
        // Remove any duplicates or empty values
        const uniqueUrls = [...new Set(urlsToTry.filter(url => url))];
        
        // Store URLs to try
        this.loadingAttempts[elementId].urls = uniqueUrls;
        
        if (uniqueUrls.length === 0) {
            console.error(`[ImageProxy] No valid URLs to try for ${elementId}`);
            if (onError) onError(imgElement);
            return;
        }
        
        // Start loading
        this.tryNextUrl(imgElement, elementId, function(img) {
            // Ensure the image and its container are visible
            img.style.display = '';
            
            const container = img.closest('.image-container');
            if (container) {
                container.style.display = '';
            }
            
            // Call the original success callback
            if (onSuccess) onSuccess(img);
        }, onError);
    },
    
    /**
     * Create and load a secondary image from the source URL
     * @param {HTMLImageElement} primaryImg - The primary image element
     * @param {string} sourceUrl - The source URL for the secondary image
     * @returns {HTMLImageElement} The created secondary image element
     */
    createSecondaryImage: function(primaryImg, sourceUrl) {
        if (!primaryImg || !sourceUrl) return null;
        
        // Check if secondary image already exists
        const container = primaryImg.closest('.image-container');
        if (!container) return null;
        
        let secondaryImg = container.querySelector('.secondary-image');
        if (!secondaryImg) {
            // Create secondary image element
            secondaryImg = document.createElement('img');
            secondaryImg.className = 'secondary-image';
            secondaryImg.alt = 'Secondary View';
            secondaryImg.style.display = 'none'; // Hide until loaded
            
            // Create a wrapper for the secondary image
            const secondaryWrapper = document.createElement('div');
            secondaryWrapper.className = 'secondary-image-wrapper';
            secondaryWrapper.appendChild(secondaryImg);
            
            // Add a label
            const label = document.createElement('div');
            label.className = 'secondary-image-label';
            label.textContent = 'Source Image';
            secondaryWrapper.appendChild(label);
            
            // Add to container after the primary image wrapper
            const primaryWrapper = primaryImg.closest('.image-wrapper');
            if (primaryWrapper && primaryWrapper.parentNode === container) {
                container.insertBefore(secondaryWrapper, primaryWrapper.nextSibling);
            } else {
                container.appendChild(secondaryWrapper);
            }
        }
        
        // Load the secondary image
        this.loadImage(
            secondaryImg, 
            sourceUrl, 
            null, 
            (img) => {
                img.style.display = ''; // Show when loaded
                img.closest('.secondary-image-wrapper').style.display = '';
            },
            (img) => {
                img.style.display = 'none';
                const wrapper = img.closest('.secondary-image-wrapper');
                if (wrapper) wrapper.style.display = 'none';
            }
        );
        
        return secondaryImg;
    },
    
    /**
     * Create and load the remote target image from the remote_target_img URL
     * @param {HTMLImageElement} primaryImg - The primary image element
     * @param {string} remoteUrl - The remote URL for the image
     * @returns {HTMLImageElement} The created remote image element
     */
    createRemoteImage: function(primaryImg, remoteUrl) {
        if (!primaryImg || !remoteUrl) return null;
        
        // Check if container exists
        const container = primaryImg.closest('.image-container');
        if (!container) return null;
        
        // Check if remote image already exists
        let remoteImg = container.querySelector('.remote-image');
        if (!remoteImg) {
            // Create remote image element
            remoteImg = document.createElement('img');
            remoteImg.className = 'remote-image';
            remoteImg.alt = 'Remote View';
            remoteImg.style.display = 'none'; // Hide until loaded
            
            // Create a wrapper for the remote image
            const remoteWrapper = document.createElement('div');
            remoteWrapper.className = 'remote-image-wrapper';
            remoteWrapper.appendChild(remoteImg);
            
            // Add a label
            const label = document.createElement('div');
            label.className = 'remote-image-label';
            label.textContent = 'Remote Image';
            remoteWrapper.appendChild(label);
            
            // Find the correct position to insert - after secondary image if it exists
            const secondaryWrapper = container.querySelector('.secondary-image-wrapper');
            if (secondaryWrapper) {
                container.insertBefore(remoteWrapper, secondaryWrapper.nextSibling);
            } else {
                // Otherwise, add after primary image wrapper
                const primaryWrapper = primaryImg.closest('.image-wrapper');
                if (primaryWrapper && primaryWrapper.parentNode === container) {
                    container.insertBefore(remoteWrapper, primaryWrapper.nextSibling);
                } else {
                    container.appendChild(remoteWrapper);
                }
            }
        }
        
        // Load the remote image
        this.loadImage(
            remoteImg, 
            remoteUrl, 
            null, 
            (img) => {
                img.style.display = ''; // Show when loaded
                img.closest('.remote-image-wrapper').style.display = '';
                
                // Setup Fancybox for remote image
                if (typeof setupFancybox === 'function') {
                    setupFancybox(img, remoteUrl, 'Remote Image');
                } else {
                    // Make the image use Fancybox
                    img.setAttribute('data-fancybox', 'gallery');
                    img.setAttribute('data-src', remoteUrl);
                    img.style.cursor = 'zoom-in';
                }
            },
            (img) => {
                img.style.display = 'none';
                const wrapper = img.closest('.remote-image-wrapper');
                if (wrapper) wrapper.style.display = 'none';
            }
        );
        
        return remoteImg;
    },
    
    /**
     * Try loading the next URL in the sequence
     */
    tryNextUrl: function(imgElement, elementId, onSuccess, onError) {
        const attempt = this.loadingAttempts[elementId];
        const currentIndex = attempt.attemptCount;
        
        // Check if we've tried all URLs
        if (currentIndex >= attempt.urls.length) {
            console.error(`Failed to load image after ${currentIndex} attempts. Hiding image.`);
            
            // Hide the image element completely
            imgElement.style.display = 'none';
            
            // Also hide the container
            const container = imgElement.closest('.image-container');
            if (container) {
                container.style.display = 'none';
            }
            
            if (onError) onError(imgElement);
            return;
        }
        
        // Get next URL to try
        const urlToTry = attempt.urls[currentIndex];
        attempt.attemptCount++;
        
        // Skip placeholder SVG
        if (urlToTry && urlToTry.includes('placeholder.svg')) {
            console.log(`[ImageProxy] Skipping placeholder: ${urlToTry}`);
            this.tryNextUrl(imgElement, elementId, onSuccess, onError);
            return;
        }
        
        // Add timestamp only if needed (don't add to URLs that already have timestamps)
        let finalUrl = urlToTry;
        
        // Only add cache busting for local files without existing timestamp
        if (urlToTry && urlToTry.startsWith('images/') && !urlToTry.includes('_t=')) {
            finalUrl = urlToTry + (urlToTry.includes('?') ? '&' : '?') + '_t=' + new Date().getTime();
        }
        
        // Log attempt (for debugging)
        console.log(`[ImageProxy] Attempt ${attempt.attemptCount}/${attempt.urls.length}: ${urlToTry}`);
        
        // Set up success handler
        imgElement.onload = () => {
            console.log(`[ImageProxy] Successfully loaded: ${urlToTry}`);
            if (onSuccess) onSuccess(imgElement);
        };
        
        // Set up error handler
        imgElement.onerror = () => {
            console.warn(`[ImageProxy] Failed to load: ${urlToTry}`);
            // Add small delay before trying next URL to prevent potential race conditions
            setTimeout(() => {
                this.tryNextUrl(imgElement, elementId, onSuccess, onError);
            }, 50);
        };
        
        // Set image source
        try {
            imgElement.src = finalUrl;
        } catch (e) {
            console.error(`[ImageProxy] Error setting src: ${e.message}`);
            this.tryNextUrl(imgElement, elementId, onSuccess, onError);
        }
    },
    
    /**
     * Determine if a URL should use the proxy service
     */
    shouldUseProxy: function(url) {
        if (!url || !url.startsWith('http')) return false;
        
        return this.restrictedDomains.some(domain => url.includes(domain));
    },
    
    /**
     * Get a proxied URL for external resources
     */
    getProxiedUrl: function(url) {
        if (!url || !url.startsWith('http')) return this.defaultImage;
        
        // Radiopaedia pages end with numeric ID - append '.jpg'
        if (/radiopaedia\.org\/images\/\d+$/.test(url)) {
            url = url + '.jpg';
        }
        
        // Handle URL format for proxy
        let cleanUrl = url;
        if (cleanUrl.startsWith('http://')) {
            cleanUrl = cleanUrl.substring(7);
        } else if (cleanUrl.startsWith('https://')) {
            cleanUrl = cleanUrl.substring(8);
        }
        
        // Add a timestamp to prevent caching issues
        return `${this.proxyUrl}${cleanUrl}&_t=${new Date().getTime()}`;
    }
}; 