"""
Simple HTTP server for scispark-site that applies vercel.json rewrites.
Serves from project root but maps /lesson-shell-v3.js → /public/... etc.
Uses BaseHTTPRequestHandler to avoid SimpleHTTPRequestHandler security restrictions.
"""
import http.server
import os
import mimetypes
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

REWRITES = {
    "/lesson-shell.css":          "/public/lesson-shell.css",
    "/lesson-shell.js":           "/public/lesson-shell.js",
    "/lesson-shell-v2.css":       "/public/lesson-shell-v2.css",
    "/lesson-shell-v2.js":        "/public/lesson-shell-v2.js",
    "/lesson-shell-v3.css":       "/public/lesson-shell-v3.css",
    "/lesson-shell-v3.js":        "/public/lesson-shell-v3.js",
    "/components/ray-diagram-picker.css": "/public/components/ray-diagram-picker.css",
    "/components/ray-diagram-picker.js":  "/public/components/ray-diagram-picker.js",
    "/components/spark-jar/spark-jar.css": "/public/components/spark-jar/spark-jar.css",
    "/components/spark-jar/spark-jar.js":  "/public/components/spark-jar/spark-jar.js",
    "/components/constellation-map/constellation-map.css": "/public/components/constellation-map/constellation-map.css",
    "/components/constellation-map/constellation-map.js":  "/public/components/constellation-map/constellation-map.js",
    "/components/click-spark-fx/click-spark-fx.css": "/public/components/click-spark-fx/click-spark-fx.css",
    "/components/click-spark-fx/click-spark-fx.js":  "/public/components/click-spark-fx/click-spark-fx.js",
    "/components/doudou/poses.js":                   "/public/components/doudou/poses.js",
}


class RewriteHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self): self._serve(include_body=True)
    def do_HEAD(self): self._serve(include_body=False)

    def _serve(self, include_body):
        path_only = urllib.parse.urlparse(self.path).path
        rewritten = REWRITES.get(path_only, path_only)
        disk = os.path.normpath(os.path.join(ROOT, rewritten.lstrip("/").replace("/", os.sep)))
        if not os.path.isfile(disk) and not rewritten.endswith(".html"):
            alt = disk + ".html"
            if os.path.isfile(alt):
                disk = alt
        if not os.path.isfile(disk):
            self.send_error(404, "File not found")
            return
        ctype = mimetypes.guess_type(disk)[0] or "application/octet-stream"
        try:
            data = open(disk, "rb").read()
        except Exception as e:
            self.send_error(500, str(e))
            return
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        if include_body:
            self.wfile.write(data)

    def log_message(self, format, *args):
        pass  # suppress noise


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    with http.server.HTTPServer(("", port), RewriteHandler) as httpd:
        print(f"Serving scispark-site on http://localhost:{port}", flush=True)
        httpd.serve_forever()
