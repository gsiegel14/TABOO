#!/usr/bin/env python3
"""
CGI Script to generate and serve Taboo card PDFs
"""

import os
import sys
import cgi
import cgitb

# Enable CGI error reporting
cgitb.enable()

# Import the card generator
try:
    from build_us_taboo_cards import make_pdf, CARDS
except ImportError:
    print("Content-Type: text/html\n")
    print("<html><body>")
    print("<h1>Error</h1>")
    print("<p>Could not import the card generator module. Please ensure build_us_taboo_cards.py is in the same directory.</p>")
    print("</body></html>")
    sys.exit(1)

def main():
    # Set the output PDF filename
    output_file = "US_Taboo_Cards.pdf"
    output_path = os.path.join(os.path.dirname(__file__), output_file)
    
    try:
        # Generate the PDF
        make_pdf(CARDS, output_path)
        
        # Serve the file
        file_size = os.path.getsize(output_path)
        
        print("Content-Type: application/pdf")
        print(f"Content-Disposition: attachment; filename=\"{output_file}\"")
        print(f"Content-Length: {file_size}")
        print()  # End of headers
        
        # Read the file and write it to stdout
        with open(output_path, 'rb') as f:
            sys.stdout.buffer.write(f.read())
            
    except Exception as e:
        print("Content-Type: text/html\n")
        print("<html><body>")
        print("<h1>Error Generating PDF</h1>")
        print(f"<p>An error occurred: {str(e)}</p>")
        print("<p>Please ensure you have the reportlab and requests libraries installed:</p>")
        print("<pre>pip install reportlab requests</pre>")
        print("<p><a href='/'>Return to homepage</a></p>")
        print("</body></html>")

if __name__ == "__main__":
    main() 