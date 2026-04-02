"""Prometheus metrics server for the worker."""
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer


class MetricsHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default logging

    def do_GET(self):
        if self.path == "/metrics":
            metrics = (
                "# HELP worker_tasks_processed_total Total tasks processed\n"
                "# TYPE worker_tasks_processed_total counter\n"
                "worker_tasks_processed_total 0\n"
                "# HELP worker_tasks_failed_total Total tasks failed\n"
                "# TYPE worker_tasks_failed_total counter\n"
                "worker_tasks_failed_total 0\n"
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(metrics.encode())
        else:
            self.send_response(404)
            self.end_headers()


class MetricsServer:
    def __init__(self, port: int = 9090):
        self.port = port

    def start(self):
        server = HTTPServer(("0.0.0.0", self.port), MetricsHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
