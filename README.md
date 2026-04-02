# AI Task Processing Platform (MERN + Python + K8s)

A production-ready AI task processing platform built for high volume, scalability, and automated GitOps deployment.

## 🚀 Features
- **MERN Stack**: Modern logic and high-performance server.
- **Python Worker**: Background task processor (Uppercase, Lowercase, Reverse, Word Count).
- **GitOps with Argo CD**: Continuous deployment from Infrastructure repository.
- **Auto-Scaling**: Kubernetes HPA for worker horizontal scaling.
- **Security First**: JWT auth, bcrypt hashing, Helmet, and Rate Limiting.

---

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, TanStack Query.
- **Backend API**: Node.js, Express, Bull queue.
- **Worker**: Python 3.12, Redis, PyMongo.
- **Infra**: Docker, Kubernetes (k3s), Argo CD, GitHub Actions.
- **Databases**: MongoDB (Primary), Redis (Queue/Cache).

---

## 💻 Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.12+

### Running with Docker Compose
```bash
docker-compose up --build
```
The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Running Services Separately
1. Start MongoDB and Redis.
2. `cd server && npm install && npm run dev`
3. `cd client && npm install && npm run dev`
4. `cd worker && pip install -r requirements.txt && python main.py`

---

## ☸️ Kubernetes Deployment (Production)

### 1. Infrastructure Repository
1. Create a **separate repository** named `ai-task-infra`.
2. Move the `k8s/` folder into that repository.
3. Replace `YOUR_USERNAME` in `k8s/*.yaml` with your actual Docker Hub username.

### 2. CI/CD with GitHub Actions
Create these secrets in your **Application Repo** (`Ai_Task_manager`):
- `DOCKER_HUB_USERNAME`: Your Docker account name.
- `DOCKER_HUB_TOKEN`: Personal access token for Docker Hub.
- `INFRA_REPO_TOKEN`: GitHub Personal Access Token (PAT) with repo permissions to push to `ai-task-infra`.

The pipeline will:
- Run Lints for JS and Python.
- Build & Push images to Docker Hub.
- Update `ai-task-infra` with the new image tags.

### 3. Argo CD Configuration
1. Install Argo CD to your cluster:
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```
2. Apply the Argo Application manifest:
   ```bash
   kubectl apply -f k8s/argo-application.yaml
   ```

---

## 📄 Architecture & Submission Details
- **Architecture Document**: Find the full technical detail in [ARCHITECTURE.md](./ARCHITECTURE.md).
- **Dockerfiles**: Each service uses multi-stage builds and runs as a non-root user.
- **Monitoring**: The worker exports metrics at `/metrics` for Prometheus.

---

## 🤝 Submission Requirements Checklist
- [x] Application repository.
- [x] Infrastructure repository (instructions provided).
- [x] Docker multi-stage builds.
- [x] Kubernetes Namespace, Deployments, Services, Ingress, HPA.
- [x] Argo CD (GitOps) setup.
- [x] CI/CD Workflows.
- [x] Security (Helmet, Rate Limiting, bcrypt, JWT).
- [x] Architecture document (2–4 pages).
- [x] README with setup instructions.
