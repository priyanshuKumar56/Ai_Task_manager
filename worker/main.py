#!/usr/bin/env python3
"""
AI Task Processing Worker
Processes tasks from Redis queue (Bull-compatible format) and updates MongoDB.
"""
import asyncio
import json
import os
import signal
import socket
import sys
import time
import traceback
from datetime import datetime, timezone

import redis
import structlog
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import Settings
from processors import process_task
from metrics import MetricsServer
from health import HealthServer

# ─── Logger Setup ─────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer() if os.getenv("NODE_ENV") == "production"
        else structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

log = structlog.get_logger()

# Worker instance ID for tracking
WORKER_ID = f"{socket.gethostname()}-{os.getpid()}"
QUEUE_NAME = "bull:ai-tasks"
PROCESSING_QUEUE = f"{QUEUE_NAME}:active"


class Worker:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.running = False
        self.redis_client = None
        self.mongo_client = None
        self.db = None
        self.tasks_processed = 0
        self.tasks_failed = 0
        self.start_time = datetime.now(timezone.utc)

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((redis.ConnectionError, redis.TimeoutError)),
    )
    def connect_redis(self):
        log.info("Connecting to Redis", host=self.settings.REDIS_HOST, port=self.settings.REDIS_PORT)
        client = redis.Redis(
            host=self.settings.REDIS_HOST,
            port=self.settings.REDIS_PORT,
            password=self.settings.REDIS_PASSWORD or None,
            db=self.settings.REDIS_DB,
            decode_responses=True,
            socket_timeout=35,
            socket_connect_timeout=10,
            retry_on_timeout=True,
            health_check_interval=30,
        )
        client.ping()
        log.info("Redis connected successfully")
        return client

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(PyMongoError),
    )
    def connect_mongo(self):
        log.info("Connecting to MongoDB", uri=self.settings.MONGODB_URI.split("@")[-1])
        client = MongoClient(
            self.settings.MONGODB_URI,
            maxPoolSize=5,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=30000,
        )
        client.admin.command("ping")
        log.info("MongoDB connected successfully")
        return client

    def connect(self):
        self.redis_client = self.connect_redis()
        self.mongo_client = self.connect_mongo()
        self.db = self.mongo_client[self.settings.MONGO_DB_NAME]

    def get_next_job(self):
        """
        Bull queue uses sorted sets. Jobs waiting in 'bull:ai-tasks:wait'.
        We use BRPOPLPUSH for atomic job pickup (Bull-compatible).
        """
        try:
            # Bull stores waiting jobs in a list
            result = self.redis_client.brpoplpush(
                f"{QUEUE_NAME}:wait",
                f"{QUEUE_NAME}:active",
                timeout=5,
            )
            if result:
                return result
        except redis.RedisError as e:
            log.error("Redis error getting job", error=str(e))
            time.sleep(2)
        return None

    def parse_job(self, raw_job: str) -> dict | None:
        try:
            job_id = raw_job
            job_data_raw = self.redis_client.hget(f"{QUEUE_NAME}:{job_id}", "data")
            if not job_data_raw:
                return None
            return {"id": job_id, "data": json.loads(job_data_raw)}
        except (json.JSONDecodeError, Exception) as e:
            log.error("Failed to parse job", raw=raw_job, error=str(e))
            return None

    def update_task_status(self, task_id: str, status: str, update_data: dict):
        """Update task in MongoDB with retry."""
        now = datetime.now(timezone.utc)
        update = {
            "$set": {
                "status": status,
                "updatedAt": now,
                **update_data,
            }
        }
        try:
            result = self.db.tasks.update_one({"taskId": task_id}, update)
            if result.matched_count == 0:
                log.warning("Task not found in MongoDB", task_id=task_id)
        except PyMongoError as e:
            log.error("MongoDB update failed", task_id=task_id, error=str(e))
            raise

    def push_log(self, task_id: str, level: str, message: str, metadata: dict = None):
        """Append a log entry to task's logs array."""
        log_entry = {
            "level": level,
            "message": message,
            "timestamp": datetime.now(timezone.utc),
            "metadata": metadata or {},
        }
        try:
            self.db.tasks.update_one(
                {"taskId": task_id},
                {
                    "$push": {"logs": {"$each": [log_entry], "$slice": -500}},
                    "$set": {"updatedAt": datetime.now(timezone.utc)},
                },
            )
        except PyMongoError as e:
            log.error("Failed to push log", task_id=task_id, error=str(e))

    def process_job(self, job: dict):
        job_id = job["id"]
        data = job["data"]
        task_id = data.get("taskId")
        operation = data.get("operation")
        input_text = data.get("inputText", "")

        log.info("Processing job", job_id=job_id, task_id=task_id, operation=operation, worker=WORKER_ID)

        started_at = datetime.now(timezone.utc)

        # Mark as running
        self.update_task_status(task_id, "running", {
            "startedAt": started_at,
            "workerInstance": WORKER_ID,
            "attempts": 1,
        })
        self.push_log(task_id, "info", f"Worker {WORKER_ID} started processing", {"operation": operation})

        try:
            # Process the task
            result = process_task(operation, input_text)

            completed_at = datetime.now(timezone.utc)
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)

            self.push_log(task_id, "info", f"Processing complete in {duration_ms}ms", {"result_type": type(result).__name__})

            self.update_task_status(task_id, "success", {
                "result": result,
                "completedAt": completed_at,
                "processingDurationMs": duration_ms,
                "progress": 100,
            })

            # Remove from active queue
            self.redis_client.lrem(f"{QUEUE_NAME}:active", 1, job_id)
            # Add to completed
            self.redis_client.lpush(f"{QUEUE_NAME}:completed", job_id)
            self.redis_client.ltrim(f"{QUEUE_NAME}:completed", 0, 999)

            self.tasks_processed += 1
            log.info("Job completed successfully", job_id=job_id, task_id=task_id, duration_ms=duration_ms)

        except Exception as e:
            completed_at = datetime.now(timezone.utc)
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)
            error_msg = str(e)
            error_trace = traceback.format_exc()

            log.error("Job failed", job_id=job_id, task_id=task_id, error=error_msg)
            self.push_log(task_id, "error", f"Task failed: {error_msg}", {"trace": error_trace[:500]})

            self.update_task_status(task_id, "failed", {
                "error": {
                    "message": error_msg,
                    "code": "PROCESSING_ERROR",
                    "stack": error_trace[:2000] if os.getenv("NODE_ENV") != "production" else None,
                },
                "completedAt": completed_at,
                "processingDurationMs": duration_ms,
            })

            # Move to failed queue
            self.redis_client.lrem(f"{QUEUE_NAME}:active", 1, job_id)
            self.redis_client.lpush(f"{QUEUE_NAME}:failed", job_id)
            self.redis_client.ltrim(f"{QUEUE_NAME}:failed", 0, 499)

            self.tasks_failed += 1

    def run(self):
        self.running = True
        log.info("Worker starting", worker_id=WORKER_ID, queue=QUEUE_NAME)

        while self.running:
            try:
                raw_job = self.get_next_job()
                if raw_job:
                    job = self.parse_job(raw_job)
                    if job:
                        self.process_job(job)
                    else:
                        # Malformed job - remove it
                        self.redis_client.lrem(f"{QUEUE_NAME}:active", 1, raw_job)
            except redis.ConnectionError as e:
                log.error("Redis connection lost, reconnecting...", error=str(e))
                time.sleep(5)
                try:
                    self.redis_client = self.connect_redis()
                except Exception:
                    log.error("Reconnection failed")
                    time.sleep(10)
            except KeyboardInterrupt:
                break
            except Exception as e:
                log.error("Unexpected error in worker loop", error=str(e), trace=traceback.format_exc())
                time.sleep(1)

        log.info("Worker shutting down", processed=self.tasks_processed, failed=self.tasks_failed)

    def stop(self):
        self.running = False
        log.info("Worker stop signal received")


def main():
    settings = Settings()
    worker = Worker(settings)

    # Setup signal handlers
    def handle_signal(signum, frame):
        log.info(f"Received signal {signum}")
        worker.stop()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Start metrics server in background
    metrics = MetricsServer(port=settings.METRICS_PORT)
    metrics.start()

    # Start health server
    health = HealthServer(port=settings.HEALTH_PORT, worker=worker)
    health.start()

    # Connect to dependencies
    worker.connect()

    # Run the worker loop
    worker.run()

    sys.exit(0)


if __name__ == "__main__":
    main()
