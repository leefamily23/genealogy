#!/usr/bin/env python3
"""
Enhanced HTTP server with cache control headers for mobile browsers
Use this instead of python -m http.server for better cache control
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

class CacheControlHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Get file extension
        parsed_path = urlparse(self.path)
        file_path = parsed_path.path
        _, ext = os.path.splitext(file_path)
        
        # Set cache control headers based on file type
        if ext.lower() in ['.html', '.htm']:
            # No cache for HTML files
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif ext.lower() in ['.js', '.mjs', '.css']:
            # No cache for JS and CSS files
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif ext.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg']:
            # Cache images for 1 day
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            # Default no cache for unknown files
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        # Add CORS headers if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        super().end_headers()

if __name__ == "__main__":
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), CacheControlHTTPRequestHandler) as httpd:
        print(f"🚀 Enhanced server running at http://localhost:{PORT}")
        print("📱 Mobile cache control enabled")
        print("🔄 Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            httpd.shutdown()