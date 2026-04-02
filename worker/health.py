"""Health check HTTP server for Kubernetes probes."""
import json
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer


class HealthHandler(BaseHTTPRequestHandler):
    worker = None

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path in ("/health", "/health/live"):
            body = json.dumps({"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body.encode())

        elif self.path == "/health/ready":
            worker = HealthHandler.worker
            is_ready = worker and worker.redis_client and worker.mongo_client
            status = 200 if is_ready else 503
            body = json.dumps({
                "status": "ready" if is_ready else "not_ready",
                "worker_id": getattr(worker, "worker_id", "unknown") if worker else None,
                "processed": getattr(worker, "tasks_processed", 0) if worker else 0,
            })
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body.encode())
        else:
            self.send_response(404)
            self.end_headers()


class HealthServer:
    def __init__(self, port: int = 8080, worker=None):
        self.port = port
        HealthHandler.worker = worker

    def start(self):
        server = HTTPServer(("0.0.0.0", self.port), HealthHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
