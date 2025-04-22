/**
 * Cache-Busting JavaScript
 * 
 * This script adds a timestamp query parameter to all image URLs to force browser cache refresh.
 * Include this script after card-data.js and before taboo.js to ensure image URLs are updated.
 */

(function() {
  // Only run if tabooCards is defined
  if (typeof tabooCards === 'undefined') {
    console.error('Cache-buster error: tabooCards not found. Include this script after card-data.js.');
    return;
  }
  
  console.log('Applying cache-busting to all image URLs...');
  
  // Current timestamp
  const timestamp = Date.now();
  
  // Update all image URLs in the card data
  tabooCards.forEach(card => {
    if (card.target_img && card.target_img.startsWith('images/')) {
      // Add timestamp to local image paths
      card.target_img = addTimestamp(card.target_img, timestamp);
    }
    
    if (card.local_target_img && card.local_target_img.startsWith('images/')) {
      card.local_target_img = addTimestamp(card.local_target_img, timestamp);
    }
    
    if (card.probe_img && card.probe_img.startsWith('images/')) {
      card.probe_img = addTimestamp(card.probe_img, timestamp);
    }
    
    if (card.local_probe_img && card.local_probe_img.startsWith('images/')) {
      card.local_probe_img = addTimestamp(card.local_probe_img, timestamp);
    }
  });
  
  console.log(`Cache-busting applied to all card images (timestamp: ${timestamp})`);
  
  /**
   * Adds a timestamp query parameter to a URL
   * @param {string} url - The URL to modify
   * @param {number} timestamp - The timestamp to add
   * @returns {string} The URL with timestamp
   */
  function addTimestamp(url, timestamp) {
    // Remove any existing timestamp parameters
    url = url.replace(/(\?|&)_t=\d+/g, '');
    
    // Add the new timestamp
    if (url.includes('?')) {
      // URL already has other query parameters, append with &
      return `${url}&_t=${timestamp}`;
    } else {
      // URL has no query parameters, start with ?
      return `${url}?_t=${timestamp}`;
    }
  }
})(); 