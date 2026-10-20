import http.server, socketserver, os, sys, urllib.parse

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8734

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=BASE, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        qs = urllib.parse.urlparse(self.path)
        if qs.path == '/save':
            params = urllib.parse.parse_qs(qs.query)
            name = params.get('path', [''])[0]
            # 仅允许写入项目根目录下的普通文件名，防目录穿越
            if name and os.path.basename(name) == name:
                length = int(self.headers.get('Content-Length', 0))
                data = self.rfile.read(length)
                with open(os.path.join(BASE, name), 'wb') as f:
                    f.write(data)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'saved')
                return
        self.send_response(400)
        self.end_headers()

    def log_message(self, *a):
        pass

socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', PORT), Handler) as httpd:
    print('serving on', PORT)
    httpd.serve_forever()
