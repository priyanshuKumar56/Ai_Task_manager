# AI Task Processing Platform (MERN + Python + K8s)

A production-ready AI task processing platform built for high volume, scalability, and automated GitOps deployment.

**🚀 Live Application: [ai-task-manager-8ajh.onrender.com](https://ai-task-manager-8ajh.onrender.com)**

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

---

## ☁️ Cloud Deployment (Free Tier Guide)

If you don't have a Kubernetes cluster but still want the application live, here's how to host it for **FREE**:

### 1. Database & Cache (Managed)
- **MongoDB**: Create a free "Shared Cluster" on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-free-tier).
- **Redis**: Create a free serverless Redis instance on [Upstash](https://upstash.com/).

### 2. Backend & Worker (Render.com)
Deploy two separate **Web Services** on Render:
1. **Connect your GitHub Repository**.
2. **Backend (Server)**:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - **Env Vars**: `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`.
3. **Worker**:
   - Root Directory: `worker`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
   - **Env Vars**: `MONGODB_URI`, `REDIS_URL`.

### 3. Frontend (Vercel)
- Create a new project from your repo on [Vercel](https://vercel.com/).
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**: Add **`VITE_API_URL`** pointing to your live Render Backend URL.

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
- [x] **Cloud-Ready**: Native support for `MONGODB_URI` and `REDIS_URL` connection strings.
