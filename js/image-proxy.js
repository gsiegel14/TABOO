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
     * Load an image with fallbacks to handle errors
     * @param {HTMLImageElement} imgElement - The image element to load the image into
     * @param {string} primaryUrl - The primary URL to try loading
     * @param {string|null} localFallbackUrl - Optional local fallback URL
     * @param {Function} onSuccess - Callback for successful load
     * @param {Function} onAllFailed - Callback for when all loading attempts fail
     * @param {string|null} remoteFallbackUrl - Optional remote fallback URL
     */
    loadImage(imgElement, primaryUrl, localFallbackUrl = null, onSuccess = null, onAllFailed = null, remoteFallbackUrl = null) {
        // Log the attempt for debugging
        console.log(`[ImageProxy] Attempting to load image for element: ${imgElement?.id || 'unnamed'}`);
        
        // Check and fix path with missing leading slash
        const fixPath = (path) => {
            if (path && !path.startsWith('/') && !path.startsWith('http')) {
                // Check if path already includes the images/ prefix
                if (!path.startsWith('images/')) {
                    return '/' + path;
                }
            }
            return path;
        };

        // Store original URLs and fix paths
        const urls = [];
        if (primaryUrl) urls.push(fixPath(primaryUrl));
        if (localFallbackUrl) urls.push(fixPath(localFallbackUrl));
        if (remoteFallbackUrl) urls.push(fixPath(remoteFallbackUrl));

        // If we have no URLs to try, call the failure callback immediately
        if (urls.length === 0) {
            console.log('[ImageProxy] No valid URLs provided for image loading.');
            if (typeof onAllFailed === 'function') {
                onAllFailed();
            }
            return;
        }

        // Remove automatic probe image fallback paths - these should be explicitly provided in the card data
        // if needed, not auto-generated based on patterns

        // Initialize attempt counter
        let attemptCount = 0;
        const maxAttempts = urls.length;

        // Function to try the next URL or give up
        const tryNextUrl = function() {
            // Increment the attempt counter
            attemptCount++;

            // If we've tried all URLs, give up
            if (attemptCount > maxAttempts) {
                console.log(`Failed to load image after ${attemptCount-1} attempts. Hiding image.`);

                // Call the onAllFailed callback if provided
                if (typeof onAllFailed === 'function') {
                    onAllFailed();
                }

                return;
            }

            // Get the URL for this attempt
            const urlToTry = urls[attemptCount - 1];
            console.log(`[ImageProxy] Attempt ${attemptCount}/${maxAttempts}: ${urlToTry}`);

            // Set up event handlers
            imgElement.onload = function() {
                console.log(`[ImageProxy] Successfully loaded: ${urlToTry}`);

                // Call the onSuccess callback if provided
                if (typeof onSuccess === 'function') {
                    onSuccess(imgElement);
                }
            };

            imgElement.onerror = function() {
                console.log(`[ImageProxy] Failed to load: ${urlToTry}`);

                // Try the next URL after a short delay
                setTimeout(function() {
                    tryNextUrl();
                }, 50);
            };

            // Set the source to start loading
            imgElement.src = urlToTry;
        };

        // Start the first attempt
        tryNextUrl();
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