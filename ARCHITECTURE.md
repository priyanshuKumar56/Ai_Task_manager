# Architecture Document: AI Task Processing Platform

## Executive Summary
This document outlines the architectural design, scaling strategies, and operational procedures for the AI Task Processing Platform. The system is built using the MERN stack (MongoDB, Express, React, Node.js), a Python-based background worker, and follows GitOps principles for deployment on Kubernetes.

---

## 1. System Components & Technologies

### 1.1 Frontend (React + Vite)
- **Framework**: React 18 with Vite for optimized builds.
- **State Management**: Zustand for global state, TanStack Query for server-state synchronization.
- **Styling**: Tailwind CSS with Framer Motion for a premium, responsive UI.
- **Containerization**: Nginx Alpine-based multi-stage Docker build, running as a non-root user.

### 1.2 Backend API (Node.js + Express)
- **Framework**: Express.js with asynchronous flow handling.
- **Authentication**: JWT-based stateless authentication with `bcryptjs` for secure password hashing.
- **Security**: 
  - `helmet` for security headers.
  - `express-rate-limit` for DDoS protection.
  - CORS policies for domain restriction.
- **Task Queueing**: Bull (Redis-backed) for reliable job distribution.

### 1.3 Worker Service (Python)
- **Logic**: Background task processor handling uppercase, lowercase, reverse string, and word count operations.
- **Concurrency**: High-concurrency processing using Redis.
- **Observability**: Metrics export via Prometheus and health checks for Kubernetes probes.

### 1.4 Databases & Middleware
- **Primary Database**: MongoDB (StatefulSet) for user data and task logs.
- **Queue/Cache**: Redis for high-speed job queueing and status tracking.

---

## 2. Scaling & High Availability

### 2.1 Worker Scaling Strategy
The system handles variable loads using Kubernetes **Horizontal Pod Autoscaler (HPA)**.
- **Metric-based Scaling**: The worker pool scales up to 20 replicas based on CPU (70%) and Memory (80%) utilization.
- **Queue-based Scaling (Proposed Enhancement)**: For production at scale (100k+ tasks/day), KEDA (Kubernetes Event-Driven Autoscaling) would be integrated to scale based on the length of the Redis queue.

### 2.2 Handling High Volume (100k tasks/day)
To handle 100k tasks/day (approx. 70 tasks/minute), the following measures are implemented:
1. **Asynchronous Decoupling**: The API returns a 202 Accepted status immediately after pushing to Redis, preventing HTTP request timeouts.
2. **Database Indexing**: 
   - Compound index on `{ userId: 1, createdAt: -1 }` for fast dashboard loading.
   - Index on `{ status: 1 }` for worker efficiency.
3. **Mongo Sharding**: Recommendation to use a Sharded Cluster for horizontal write distribution across multiple MongoDB nodes.

---

## 3. Resilience & Failure Handling

### 3.1 Redis Failure Handling
- **Bull Library Reliability**: Bull ensures that if a worker crashes, the task remains in the "active" list and is eventually moved back to "waiting" for another worker to pick it up (At-least-once delivery).
- **Persistence**: Redis is configured with AOF (Append-Only File) to prevent data loss on container restarts.
- **Graceful Shutdown**: Workers listen for SIGTERM to finish current tasks before exiting.

### 3.2 Database Resilience
- **StatefulSet**: MongoDB is deployed as a StatefulSet with Persistent Volume Claims (PVC) to ensure data persists across rescheduling events.

---

## 4. CI/CD & GitOps Workflow

### 4.1 CI/CD Pipeline (GitHub Actions)
1. **Automated Linting**: Validates JS and Python code quality on every PR.
2. **Secure Builds**: Uses multi-stage Docker builds to keep images small and secure.
3. **Automated Deployment**: On push to `main`, the CI updates the image tags in the Infrastructure repo via `sed`.

### 4.2 GitOps (Argo CD)
- **Source of Truth**: The `ai-task-infra` repository holds the desired state of the cluster.
- **Self-Healing**: Argo CD monitors the cluster and automatically reconciles any drift from the Git repository.

---

## 5. Deployment Guide

### Staging vs. Production
- **Staging**: Deployed on a single-node k3s cluster for integration testing. Uses `Manual` sync in Argo CD.
- **Production**: Deployed on a multi-az EKS/GKE cluster. Uses `Auto-Sync` and `Prune` in Argo CD with strict Resource Quotas and Network Policies.
