/* browser.js v1.0.0 | (c) HTML5 UP */

(function() {
    // Browser detection
    var browser = (function() {
        var ua = navigator.userAgent;
        var browserName;
        var browserVersion;
        var browserEngine;
        var os;
        var osVersion;
        var mobile;
        
        // Detect browser name
        if (ua.match(/(chrome|chromium|crios)/i)) {
            browserName = 'chrome';
        } else if (ua.match(/firefox|fxios/i)) {
            browserName = 'firefox';
        } else if (ua.match(/safari/i) && !ua.match(/(chrome|chromium|crios)/i)) {
            browserName = 'safari';
        } else if (ua.match(/msie|trident/i)) {
            browserName = 'ie';
        } else if (ua.match(/edge/i)) {
            browserName = 'edge';
        } else {
            browserName = 'other';
        }
        
        // Detect mobile
        mobile = ua.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) !== null;
        
        return {
            name: browserName,
            mobile: mobile
        };
    })();
    
    // Apply browser classes to html element
    var html = document.documentElement;
    html.className += ' is-' + browser.name + (browser.mobile ? ' is-mobile' : '');
    
    // Add browser object to window
    window.browser = browser;
})(); 