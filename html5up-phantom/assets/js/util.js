/* util.js v1.0.0 | (c) HTML5 UP */

(function() {
	// Utility functions
	window.util = {
		// Event delegation
		on: function(element, event, selector, callback) {
			if (!element) return;
			
			element.addEventListener(event, function(e) {
				var target = e.target;
				
				while (target && target !== element) {
					if (target.matches(selector)) {
						callback.call(target, e);
						break;
					}
					
					target = target.parentNode;
				}
			});
		},
		
		// Toggle class
		toggleClass: function(element, className) {
			if (!element) return;
			
			if (element.classList.contains(className)) {
				element.classList.remove(className);
				return false;
			} else {
				element.classList.add(className);
				return true;
			}
		},
		
		// Add class
		addClass: function(element, className) {
			if (!element || element.classList.contains(className)) return;
			element.classList.add(className);
		},
		
		// Remove class
		removeClass: function(element, className) {
			if (!element || !element.classList.contains(className)) return;
			element.classList.remove(className);
		},
		
		// Get parent element with class
		getParentByClass: function(element, className) {
			if (!element) return null;
			
			while (element && !element.classList.contains(className)) {
				element = element.parentNode;
				
				if (!element || element.nodeName === 'HTML') {
					return null;
				}
			}
			
			return element;
		},
		
		// Get siblings
		getSiblings: function(element) {
			if (!element || !element.parentNode) return [];
			
			var siblings = [];
			var children = element.parentNode.children;
			
			for (var i = 0; i < children.length; i++) {
				if (children[i] !== element) {
					siblings.push(children[i]);
				}
			}
			
			return siblings;
		},
		
		// Delay
		delay: function(fn, delay) {
			setTimeout(fn, delay);
		}
	};
})();