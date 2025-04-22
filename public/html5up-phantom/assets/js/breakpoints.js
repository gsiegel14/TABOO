/* breakpoints.js v1.0.0 | (c) HTML5 UP */

(function() {
    // Breakpoints manager
    window.breakpoints = function() {
        // Breakpoints object
        var breakpoints = {};
        var events = {};
        var items = [];
        
        // Get or define a breakpoint
        breakpoints.on = function(id, options) {
            // Create breakpoint if it doesn't exist
            if (!items[id]) {
                items[id] = {
                    id: id,
                    media: options.media,
                    state: false,
                    listeners: []
                };
            }
            
            return items[id];
        };
        
        // Test if a breakpoint is active
        breakpoints.active = function(id) {
            return items[id] && items[id].state;
        };
        
        // Trigger an event
        breakpoints.trigger = function(ids) {
            var x, id;
            
            // String? Convert to array
            if (typeof ids === 'string') {
                ids = [ids];
            }
            
            // Handle each ID
            for (x = 0; x < ids.length; x++) {
                id = ids[x];
                
                // Trigger event listeners
                if (items[id] && items[id].listeners.length > 0) {
                    for (var i = 0; i < items[id].listeners.length; i++) {
                        items[id].listeners[i](items[id].state);
                    }
                }
            }
        };
        
        // Listen for breakpoint changes
        breakpoints.listen = function(id, callback) {
            if (!items[id]) {
                return;
            }
            
            // Add listener
            items[id].listeners.push(callback);
        };
        
        // Poll for breakpoints
        setInterval(function() {
            for (var id in items) {
                var item = items[id];
                var newState = window.matchMedia(item.media).matches;
                
                // State changed?
                if (newState !== item.state) {
                    // Update state
                    item.state = newState;
                    
                    // Trigger event
                    breakpoints.trigger(id);
                }
            }
        }, 250);
        
        return breakpoints;
    }();
})(); 