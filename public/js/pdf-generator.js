/**
 * PDF Card Generator Handler
 * Handles the PDF generation process when the user clicks the generate button
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the generate cards button
    const generateButton = document.getElementById('generate-cards');
    
    if (generateButton) {
        generateButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show loading indicator
            const originalText = generateButton.innerHTML;
            generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            generateButton.disabled = true;
            
            // Create a modal with instructions
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Generate Ultrasound Taboo Cards</h3>
                    <p>To generate the PDF cards:</p>
                    <ol>
                        <li>Download the Python script by clicking the button below</li>
                        <li>Make sure you have Python 3.6+ installed</li>
                        <li>Install required libraries: <code>pip install reportlab requests</code></li>
                        <li>Run the script: <code>python build_us_taboo_cards.py</code></li>
                        <li>Find the generated PDF in the same folder as the script</li>
                    </ol>
                    <div class="button-container">
                        <a href="/build_us_taboo_cards.py" download class="button primary">Download Python Script</a>
                        <button class="button" id="close-modal">Close</button>
                    </div>
                </div>
            `;
            
            // Add the modal to the body
            document.body.appendChild(modal);
            
            // Add event listener to close button
            document.getElementById('close-modal').addEventListener('click', function() {
                document.body.removeChild(modal);
                // Reset button
                generateButton.innerHTML = originalText;
                generateButton.disabled = false;
            });
            
            // Add event listener to download link
            const downloadLink = modal.querySelector('a.button.primary');
            downloadLink.addEventListener('click', function() {
                // Close modal after a short delay
                setTimeout(function() {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                        // Reset button
                        generateButton.innerHTML = originalText;
                        generateButton.disabled = false;
                    }
                }, 2000);
            });
        });
    }
}); 