# 💻 Local Kubernetes + Argo CD Setup Guide

This guide will help you run a production-grade GitOps environment right on your laptop!

---

## 🛠️ Step 1: Enable Kubernetes
If you have **Docker Desktop**, just do this:
1.  Open **Settings** (Gear icon).
2.  Go to **Kubernetes**.
3.  Check **Enable Kubernetes** and click **Apply & Restart**.

*If you prefer a standalone cluster, install [Minikube](https://minikube.sigs.k8s.io/docs/start/).*

---

## ☸️ Step 2: Install Argo CD
Once your cluster is ready, run these in your terminal:
```bash
# 1. Create the namespace
kubectl create namespace argocd

# 2. Install Argo CD manifests
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Wait for pods to be ready
kubectl get pods -n argocd
```

---

## 📡 Step 3: Access the Dashboard (Port Forward)
Argo CD is internal by default. To open it in your browser:
```bash
# 1. Start the tunnel (keep this terminal open)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```
Now, open your browser to: **`https://localhost:8080`** (Accept the "Advanced/Risk" certificate warning).

---

## 🔑 Step 4: Login Credentials
*   **Username**: `admin`
*   **Password**: Run this command to get the auto-generated initial password:
    ```bash
    kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
    ```

---

## 🚀 Step 5: Sync Your Project
1.  Click **+ NEW APP** in Argo CD.
2.  **Application Name**: `ai-task-platform`
3.  **Project**: `default`
4.  **Sync Policy**: `Automatic`
5.  **Repository URL**: `https://github.com/priyanshuKumar56/ai-task-infra`
6.  **Path**: `k8s`
7.  **Cluster URL**: `https://kubernetes.default.svc`
8.  **Namespace**: `default` (or your project namespace).

**Click CREATE, and watch Argo CD pull your code and deploy it to your laptop in real-time!** 🥇🏆👑🏁✨✨
