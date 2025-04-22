#!/usr/bin/env python3
import os
import requests
from concurrent.futures import ThreadPoolExecutor

# Ensure directory exists
os.makedirs("html5up-phantom/assets/js", exist_ok=True)

# Sound files to download
sound_files = {
    "correct.mp3": "https://freesound.org/data/previews/320/320654_5260872-lq.mp3",
    "wrong.mp3": "https://freesound.org/data/previews/142/142608_1840739-lq.mp3",
    "beep-short.mp3": "https://freesound.org/data/previews/337/337049_5865517-lq.mp3",
    "beep-long.mp3": "https://freesound.org/data/previews/387/387232_7255534-lq.mp3",
    "flip.mp3": "https://freesound.org/data/previews/240/240776_4107740-lq.mp3"
}

def download_file(url, filename):
    """Download a file from a URL to a specified path"""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        filepath = os.path.join("html5up-phantom/assets/js", filename)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded {filename} successfully")
        return True
    except Exception as e:
        print(f"Error downloading {filename}: {e}")
        return False

def main():
    """Main function to download all files"""
    print("Starting download of sound files...")
    
    # Use ThreadPoolExecutor to download files concurrently
    with ThreadPoolExecutor(max_workers=5) as executor:
        # Map the download_file function to each file in the dictionary
        results = list(executor.map(
            lambda item: download_file(item[1], item[0]), 
            sound_files.items()
        ))
    
    # Check results
    if all(results):
        print("All files downloaded successfully!")
    else:
        print("Some files failed to download. Check the logs above.")

if __name__ == "__main__":
    main() 