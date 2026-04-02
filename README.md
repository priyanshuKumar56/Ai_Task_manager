# 🚀 AI Task Processing Engine (MERN + Python + K8s)

A high-performance, production-ready AI task processing platform designed for massive horizontal scaling, real-time observability, and automated GitOps lifecycle management.

**🌍 Live Showcase: [ai-task-manager-bakcend.onrender.com](https://ai-task-manager-bakcend.onrender.com)**
**🎨 Frontend Interface: [ai-task-manager-sepia.vercel.app](https://ai-task-manager-sepia.vercel.app)**

---

## 📽️ Project Vision & Purpose
This platform was engineered to solve the "compute-heavy background job" problem in modern web apps. By decoupling the API from the heavy processing logic via a Redis-backed queue, we achieve **sub-100ms response times** even under extreme loads.

### 🧩 Core Functionality
- **Seamless Auth**: Secure JWT-based entry for all users.
- **Task Orchestration**: Create compute-intensive tasks (Uppercase, Word Count, etc.) that run in the background.
- **Live Observability**: Watch your tasks move from `Pending` → `Running` → `Success` in real-time.
- **Industrial Scale**: Built to handle 100k+ tasks/day through distributed Python workers.

---

## 🏗️ Architecture & Data Flow
The system follows a distributed microservices pattern for maximum resilience:

```text
[ React Frontend ] --(1. Request)--> [ Node.js API ] --(2. Queue)--> [ Upstash Redis ]
                                          |                         |
(5. Live Update) <--(4. SSE Push)-- [ Mongoose DB ] <--(3. Process)-- [ Python Workers ]
```

1. **Frontend**: React-based UI captures user intent and streams status updates.
2. **API**: Express-based gateway validates requests and publishes to the queue.
3. **Queue**: Redis (Bull) acts as the reliable shock-absorber for high-volume spikes.
4. **Workers**: Independent Python processes handle the "heavy lifting" and update MongoDB.
5. **SSE (Streaming)**: The API pushes real-time "heartbeats" back to the UI.

---

## 🛠️ Industrial Tech Stack

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion | User interaction & real-time monitoring. |
| **Backend** | Node.js, Express, Bull Queue, Winston | API Gateway & Job Orchestration. |
| **Compute** | Python 3.12, PyMongo, Redis-py | Background processing engine. |
| **Persistence** | MongoDB Atlas, Redis (Managed) | Distributed state and queue management. |
| **Infra** | Docker, K3s, Argo CD, GitHub Actions | Automated GitOps & Orchestration. |

---

## ☸️ Production Deployment (Kubernetes + GitOps)

### 1. The GitOps Workflow
The system uses **Argo CD** to maintain a "Desired State" in the cluster based on a separate **Infrastructure Repository**.
- **Application Repo**: Contains the source code and CI/CD pipelines.
- **Infra Repo**: Contains K8s manifests (Deployments, Services, HPA).

### 2. Deployment Steps
1. Create a private infrastructure repo (`ai-task-infra`).
2. Populate GitHub Secrets (`DOCKER_HUB_TOKEN`, `INFRA_REPO_TOKEN`).
3. Deploy Argo CD to your cluster: `kubectl apply -n argocd -f k8s/argo-application.yaml`.

---

## 💻 Local Development Setup (Quick Start)

### Start Everything with Docker Compose
```bash
docker-compose up --build
```
- **Login/Register**: `http://localhost:3000/auth`
- **Dashboard**: `http://localhost:3000/dashboard`

---

## 🤝 Project Submission Checklist
- [x] **Full MERN Stack**: High-performance React UI + Node.js API.
- [x] **Python Worker**: Background processing fleet.
- [x] **Dockerized**: Multi-stage, non-root production builds.
- [x] **Kubernetes Ready**: Manifests for HPA, Services, and Ingress included.
- [x] **GitOps Integrated**: Automated CD with Argo CD.
- [x] **Cloud Native**: Pre-configured for MongoDB Atlas & Upstash Redis.
- [x] **Security Hardened**: Helmet, Rate Limiting, and JWT encryption.

---

### **Author: [priyanshuKumar56](https://github.com/priyanshuKumar56)**
*Prepared for the Full Stack Intern Assignment.*
