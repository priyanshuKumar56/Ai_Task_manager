# 🪐 AI Task Processing Engine: Enterprise Distribution

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Kubernetes](https://img.shields.io/badge/K8s-v1.34.1-blue.svg)](https://kubernetes.io/)
[![Deployment: Argo CD](https://img.shields.io/badge/GitOps-Argo%20CD-orange.svg)](https://argoproj.github.io/cd/)

---

## 📽️ The Vision: Industrial-Scale Asynchronous Computing
Welcome to the **AI Task Processing Engine**, a high-performance, distributed microservices platform designed to handle massive computational workflows with sub-millisecond orchestration latency. 🚀 🏆 💎

Built upon the **MERN** foundation and powered by a **Python-centric worker fleet**, this platform represents a state-of-the-art implementation of **GitOps-driven** engineering, **horizontal auto-scaling**, and **real-time observability**.

---

## 🎡 Core Technical Flow: Distributed Intelligence
The platform utilizes a **Decoupled Job Queue** architecture to ensure the user interface remains responsive while specialized worker clusters handle the "heavy lifting."

### 🛰️ 1. Computational Data Flow (Architecture Map)
```text
[ USER INTENT ]
      |
      ▼
[ REACT FRONTEND ] ────(SSE HEARTBEATS)────┐
      |                                     | (Live Monitoring)
      ▼                                     ▼
[ NODE.JS GATEWAY ] ────(JWT AUTH)───▶ [ MONGODB ATLAS ]
      |                                     ▲
      ▼                                     | (Result Sync)
[ REDIS BROKER ] ◄────(POLL/SYNC)──── [ PYTHON WORKERS ]
```

---

## 🏗️ Technical Implementation: The Elite Stack

| Layer | Technology | Strategic Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Zustand | High-performance state & sub-second UI updates. |
| **API Gateway** | Node.js (Express), Bull | Low-latency orchestration & job scheduling. |
| **Compute** | Python 3.12, PyMongo | Industry-leading text and data processing. |
| **Message Broker** | Upstash Redis | Secure, serverless, ultra-fast job queuing. |
| **Persistence** | MongoDB Atlas | Global document storage & resilient state management. |
| **Orchestration** | Kubernetes (K3s), Docker | Automated scaling & non-root container security. |
| **Continuous Ops** | Argo CD, GitHub Actions | Self-healing GitOps & automated CI/CD lifecycles. |

---

## 📂 Engineering Structure: The Blueprint
A meticulously organized microservices repository designed for enterprise-grade scalability.

```text
├── .github/workflows/   # 🏗️ CI/CD: Automated Linting, Build, & Multi-Repo Sync
├── client/              # 🎨 Frontend: React Application (Vite-Powered)
│   ├── src/pages/       #   - Premium Unified UI Pages
│   └── src/store/       #   - Lightweight Zustand State Management
├── server/              # 🛰️ Backend: Express API & Orchestration Node
│   ├── src/config/      #   - Resilience (Redis/Mongo) Connectors
│   └── src/services/    #   - Job Queue (Bull) Business Logic
├── worker/              # 🐍 Compute: Python Background Processing Service
│   ├── main.py          #   - High-Concurrency Job Consumer
│   └── tasks/           #   - Extensible Logic Cluster (Uppercase, Reverse, etc.)
├── k8s/                 # ☸️ Infra: Kubernetes Manifests & GitOps Definitions
└── README.md            # 📕 Documentation: The Entry Point
```

---

## 🤝 Integration & Collaboration Workflow
We follow the **GitOps Source-of-Truth** model to manage deployment environments.

### 🏁 2. The Deployment Pipeline (Automation Loop)
```text
(CODE PUSH) ──▶ [ CI/CD PIPELINE ] ──▶ [ DOCKER HUB ]
                       |                   |
                       ▼                   ▼
                (INFRA SYNC) ──▶ [ ARGO CD DASHBOARD ] ──▶ [ K8S CLUSTER ]
```
1.  **Continuous Integration**: Automated JS/Python lints and multi-stage Docker builds.
2.  **Infrastructure Sync**: Automated `sed`-based image tagging in the `ai-task-infra` repo.
3.  **GitOps Orchestration**: Argo CD detects the "Desired State" and reconciles the cluster to match.

---

## 🚀 Bootstrapping the Ecosystem: Quick-Start Guide

To run the full-stack engine successfully, you need to initialize both the **Application Repository** and its **Infrastructure Control Plane**.

### 🏗️ 1. Orchestrated Repository Cloning
First, clone the core application logic and the GitOps infrastructure manifests:
```bash
# 🛸 Clone the Application Engine
git clone https://github.com/priyanshuKumar56/Ai_Task_manager.git

# ☸️ Clone the Infrastructure Control Plane
git clone https://github.com/priyanshuKumar56/ai-task-infra.git
```

---

### 💎 Option A: Quick-Start Engine (Docker Compose)
This is the recommended way to spin up the entire cluster (API, UI, Worker, Redis, MongoDB) in a single unified network.

1.  **Inject the Engine Oil (Environment Variables)**:
    Create a `.env` in the root directory:
    ```env
    MONGODB_URI=mongodb+srv://... (Your Atlas URI)
    REDIS_URL=rediss://... (Your Upstash URI)
    JWT_SECRET=your_secret_key
    ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
    ```
2.  **Ignite the Cluster**:
    ```bash
    docker-compose up --build
    ```
*The Frontend will be live at `http://localhost:5173`.*

---

### 💻 Option B: Deep Exploration (Manual Local Setup)
If you want to debug or modify individual microservices, run them in separate terminals:

**1. Gateway (Node.js API)**:
```bash
cd server
npm install
npm run dev
```

**2. Engine (Python Worker)**:
```bash
cd worker
pip install -r requirements.txt
python main.py
```

**3. Portal (React UI)**:
```bash
cd client
npm install
npm run dev
```

---

### ☸️ Option C: Industrial Hosting (Kubernetes + Argo CD)
To replicate the production environment on your laptop:

1.  **Enable Your Local Cluster**: Turn on "Kubernetes" in your Docker Desktop settings.
2.  **Deploy the GitOps Controller**: follow our **[Local K8s Setup Guide](./LOCAL_K8S_ARGO_SETUP.md)**.
3.  **Sync the Infra Repo**: Point Argo CD at your `ai-task-infra` clone to watch the self-healing deployment in action.

---


## 🛡️ Security & Compliance: Zero-Trust Layer
We implement a **Level 4 Security Posture** across all services:
- **Stateless Authentication**: JWT with secure refresh tokens via `httpOnly` cookies.
- **Service Hardening**: `Helmet.js` and `express-rate-limit` implemented at the edge.
- **Secret Hygiene**: Zero-tolerance policy for hardcoded credentials; injected via Vault or Env Vars.
- **Container Isolation**: Non-root users (`node`, `worker`) and multi-stage builds for small attack surfaces.

---

**Built with Engineering Excellence by [priyanshuKumar56](https://github.com/priyanshuKumar56)** ✨🏆👑🏁🥇
