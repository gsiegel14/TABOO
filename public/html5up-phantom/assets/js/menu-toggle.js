/* menu-toggle.js v1.0.0 | (c) HTML5 UP */

(function() {
    // Menu toggle component
    document.addEventListener('DOMContentLoaded', function() {
        var body = document.body;
        var menu = document.getElementById('menu');
        var menuToggle = document.querySelector('a[href="#menu"]');
        var menuClose = document.querySelector('#menu .close-x');
        
        if (!menu || !menuToggle) return;
        
        // Toggle menu visibility
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle active class
            menu.classList.toggle('is-active');
            body.classList.toggle('menu-visible');
        });
        
        // Close menu when clicking close button
        if (menuClose) {
            menuClose.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                menu.classList.remove('is-active');
                body.classList.remove('menu-visible');
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (body.classList.contains('menu-visible') && !menu.contains(e.target) && e.target !== menuToggle) {
                e.preventDefault();
                
                menu.classList.remove('is-active');
                body.classList.remove('menu-visible');
            }
        });
    });
})(); 