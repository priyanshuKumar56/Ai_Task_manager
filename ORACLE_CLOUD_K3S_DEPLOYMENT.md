# 🏢 Oracle Cloud + K3s + Argo CD Deployment Guide

This guide will walk you through the ultimate "Production-Grade" deployment using the massive Oracle Cloud Free Tier resources (4 ARM OCPUs, 24GB RAM).

---

## 🏗️ Phase 1: Provision the Oracle VM
1.  **Sign up** for [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2.  **Create an ARM Instance**:
    *   **Shape**: `VM.Standard.A1.Flex` (ARM-based).
    *   **OCPUs**: 4
    *   **Memory**: 24 GB RAM.
    *   **OS**: Ubuntu 22.04 LTS.
3.  **Download your Private Key** (`.key` file) and keep it safe!

---

## ☸️ Phase 2: Install K3s (One Command)
SSH into your VM and run the K3s installer:
```bash
# 1. SSH into the server (replace your-ip and path-to-key)
ssh -i your-key.key ubuntu@your-vm-ip

# 2. Install K3s
curl -sfL https://get.k3s.io | sh -

# 3. Verify K3s is running
sudo kubectl get nodes
```

---

## 🏗️ Phase 3: Install Argo CD
Argo CD will automatically sync your `ai-task-infra` repository to the cluster.
```bash
# 1. Create Argo CD Namespace
sudo kubectl create namespace argocd

# 2. Install Argo CD
sudo kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Install Argo CD CLI (to get initial password)
sudo curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo chmod +x /usr/local/bin/argocd

# 4. Get Admin Password
sudo kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

---

## 📡 Phase 4: Cloudflare Tunnel (Expose It!)
This bypasses Oracle's complex firewall/VCN and makes your local service public securely.

1.  **Install Cloudflared on the VM**:
    ```bash
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
    sudo dpkg -i cloudflared.deb
    ```
2.  **Authenticate**: `cloudflared tunnel login`
3.  **Create a Tunnel**: `cloudflared tunnel create ai-task-tunnel`
4.  **Configure Ingress** (Map your domain to the K8s service):
    ```bash
    # Forward traffic to the K8s ingress or service
    cloudflared tunnel route dns ai-task-tunnel ai-task.yourname.com
    cloudflared tunnel run --url http://localhost:80 ai-task-tunnel
    ```

---

## 🚀 Phase 5: Hook up your Infra Repo
Finally, apply your Argo application manifest:
```bash
# Apply your argo-application.yaml to the cluster
sudo kubectl apply -f k8s/argo-application.yaml
```

**Your entire AI platform is now running on a massive, professional cluster in the cloud for $0.00!** 🥇🏆👑🏁✨✨
