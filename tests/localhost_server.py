"""
Simple HTTP server for scispark-site that applies vercel.json rewrites.
Serves from project root but maps /lesson-shell-v3.js → /public/... etc.
"""
import http.server
import os
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
}

class RewriteHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        path_only = urllib.parse.urlparse(path).path
        # Apply rewrite if matched
        rewritten = REWRITES.get(path_only, path_only)
        # Try with .html extension for clean URLs
        full = os.path.join(ROOT, rewritten.lstrip("/"))
        if not os.path.exists(full) and not rewritten.endswith(".html"):
            alt = full + ".html"
            if os.path.exists(alt):
                rewritten = rewritten + ".html"
        return os.path.join(ROOT, rewritten.lstrip("/"))

    def log_message(self, format, *args):
        pass  # suppress noise


if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    with http.server.HTTPServer(("", port), RewriteHandler) as httpd:
        print(f"Serving scispark-site on http://localhost:{port}", flush=True)
        httpd.serve_forever()
