/* performance-utils.js v1.0.0 | (c) HTML5 UP */

(function() {
    // Performance utility functions
    window.performance = window.performance || {};
    
    // Debounce function - limit how often a function can be called
    window.performance.debounce = function(func, wait, immediate) {
        var timeout;
        
        return function() {
            var context = this;
            var args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func.apply(context, args);
        };
    };
    
    // Throttle function - limit how often a function can be called
    window.performance.throttle = function(func, limit) {
        var lastCall = 0;
        
        return function() {
            var now = Date.now();
            
            if (now - lastCall >= limit) {
                lastCall = now;
                func.apply(this, arguments);
            }
        };
    };
    
    // Lazy load images
    window.performance.lazyLoadImages = function() {
        var lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
        
        if ('IntersectionObserver' in window) {
            var lazyImageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        if (lazyImage.dataset.srcset) {
                            lazyImage.srcset = lazyImage.dataset.srcset;
                        }
                        lazyImage.classList.remove('lazy');
                        lazyImageObserver.unobserve(lazyImage);
                    }
                });
            });
            
            lazyImages.forEach(function(lazyImage) {
                lazyImageObserver.observe(lazyImage);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            var lazyLoadThrottled = window.performance.throttle(function() {
                var scrollTop = window.pageYOffset;
                
                lazyImages.forEach(function(lazyImage) {
                    if (lazyImage.offsetTop < (window.innerHeight + scrollTop)) {
                        lazyImage.src = lazyImage.dataset.src;
                        if (lazyImage.dataset.srcset) {
                            lazyImage.srcset = lazyImage.dataset.srcset;
                        }
                        lazyImage.classList.remove('lazy');
                        lazyImages = lazyImages.filter(function(image) {
                            return image !== lazyImage;
                        });
                    }
                });
                
                if (lazyImages.length === 0) {
                    document.removeEventListener('scroll', lazyLoadThrottled);
                    window.removeEventListener('resize', lazyLoadThrottled);
                    window.removeEventListener('orientationchange', lazyLoadThrottled);
                }
            }, 200);
            
            document.addEventListener('scroll', lazyLoadThrottled);
            window.addEventListener('resize', lazyLoadThrottled);
            window.addEventListener('orientationchange', lazyLoadThrottled);
        }
    };
    
    // Initialize performance utils on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize lazy loading if needed
        if (document.querySelector('img.lazy')) {
            window.performance.lazyLoadImages();
        }
    });
})(); 