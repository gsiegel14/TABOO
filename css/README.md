# Taboo Game CSS Structure

This directory contains the CSS files for the Taboo Game application.

## Overview

The CSS structure has been optimized to reduce redundancy and improve maintainability:

1. **Main CSS Files:**
   - `taboo.css`: Main game-specific styles
   - `main.css`: Imports necessary base, utilities, and layout styles

2. **External Libraries (loaded via CDN):**
   - Font Awesome 6.4.2
   - Fancybox 5.0

## Directory Structure

The CSS is organized into the following directories:

- **base/**: Base and reset styles
  - `reset.css`: CSS reset for consistent browser styling
  - `typography.css`: Typography styles

- **layout/**: Layout grid system
  - `grid.css`: Layout grids and structure

- **utilities/**: Utility classes
  - `vexus-colors.css`: Color utilities

- **responsive/**: Responsive design utilities
  - `responsive.css`: Media queries and responsive adjustments

- **old-files/**: Archived files that are no longer used

## Optimization Notes

The CSS has been optimized to:

1. **Remove Duplicate Files**: Eliminated duplicate CSS files between `css/` and `public/css/`
2. **Remove Unused Components**: Moved unused component CSS to the archive folder
3. **Reduce HTTP Requests**: Minimized the number of CSS imports
4. **Clean Up Font Awesome**: Removed duplicate Font Awesome imports
5. **Move Inline Styles**: Incorporated inline styles from HTML into taboo.css

## Usage

In your HTML, include the two main CSS files:

```html
<link rel="stylesheet" href="html5up-phantom/assets/css/main.css" />
<link rel="stylesheet" href="css/taboo.css" />
```
