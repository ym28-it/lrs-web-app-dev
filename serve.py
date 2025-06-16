import http.server
import socketserver

class COEPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

PORT = 8000

with socketserver.TCPServer(("", PORT), COEPHandler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()