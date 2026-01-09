# Docker Registry Deployment Guide

## Benefits of Using a Docker Registry

✅ **Layer Caching**: Only changed layers are uploaded/downloaded
✅ **Faster Deployments**: Rancher pulls from registry (no tar files)
✅ **Version Control**: Tag different versions (v1, v2, latest)
✅ **Multi-node**: All Kubernetes nodes can pull the same image

---

## Option 1: Use Rancher's Built-in Registry

Most Rancher installations have a built-in Docker registry.

### 1. Find Your Rancher Registry URL

In Rancher UI:
- Go to **Storage** → **Registries**
- Or check your cluster's registry endpoint (usually something like):
  - `rancher.yourdomain.com:5000`
  - `registry.rancher.internal:5000`

### 2. Build and Tag Image

```bash
# Build the image
docker build -t epcalculator:v2 .

# Tag for your Rancher registry
docker tag epcalculator:v2 YOUR_REGISTRY:5000/epcalculator:v2
docker tag epcalculator:v2 YOUR_REGISTRY:5000/epcalculator:latest

# Example:
# docker tag epcalculator:v2 rancher.upf.edu:5000/epcalculator:v2
```

### 3. Push to Registry

```bash
# Login to registry (if needed)
docker login YOUR_REGISTRY:5000

# Push the image
docker push YOUR_REGISTRY:5000/epcalculator:v2
docker push YOUR_REGISTRY:5000/epcalculator:latest
```

### 4. Deploy in Rancher

When creating/updating the deployment:
- **Container Image**: `YOUR_REGISTRY:5000/epcalculator:latest`
- **Image Pull Policy**: `Always` (to get latest updates)

---

## Option 2: Use Docker Hub (Public)

### 1. Create Docker Hub Account

Go to https://hub.docker.com and create an account (free).

### 2. Build and Push

```bash
# Build the image
docker build -t epcalculator:v2 .

# Tag with your Docker Hub username
docker tag epcalculator:v2 YOUR_USERNAME/epcalculator:v2
docker tag epcalculator:v2 YOUR_USERNAME/epcalculator:latest

# Login to Docker Hub
docker login

# Push
docker push YOUR_USERNAME/epcalculator:v2
docker push YOUR_USERNAME/epcalculator:latest
```

### 3. Deploy in Rancher

- **Container Image**: `YOUR_USERNAME/epcalculator:latest`
- **Image Pull Policy**: `Always`

---

## Option 3: Use Harbor (Self-hosted Registry)

If your university has Harbor installed:

### 1. Login to Harbor

```bash
docker login harbor.youruniversity.edu
```

### 2. Tag and Push

```bash
# Tag for Harbor (includes project name)
docker tag epcalculator:v2 harbor.youruniversity.edu/epcalculator/app:v2
docker tag epcalculator:v2 harbor.youruniversity.edu/epcalculator/app:latest

# Push
docker push harbor.youruniversity.edu/epcalculator/app:v2
docker push harbor.youruniversity.edu/epcalculator/app:latest
```

---

## Layer Caching Benefits

### First Push (all layers):
```
Pushed layer 1 (350MB)
Pushed layer 2 (120MB)
Pushed layer 3 (50MB)
Total: 520MB uploaded
```

### Second Push (only changed code):
```
Layer 1: Already exists (skipped)
Layer 2: Already exists (skipped)
Pushed layer 3 (52MB - code changed)
Total: 52MB uploaded ⚡
```

This is why multi-stage builds are important - they separate:
- Base images (rarely change)
- Dependencies (change occasionally)
- Application code (changes frequently)

---

## Update Deployment (Zero Downtime)

### Method 1: Rancher UI

1. Go to **Workloads** → **Deployments**
2. Find `ep-calculator`
3. Click ⋮ → **Edit Config**
4. Change image tag from `v1` to `v2` (or use `latest`)
5. Save → Rancher will perform rolling update

### Method 2: kubectl

```bash
# Update image
kubectl set image deployment/ep-calculator \
  ep-calculator=YOUR_REGISTRY:5000/epcalculator:v2

# Or if using 'latest' tag, force pull
kubectl rollout restart deployment/ep-calculator
```

### Method 3: Automatic with 'latest' tag

If you use `latest` tag and `imagePullPolicy: Always`:
```bash
# Just push new image
docker push YOUR_REGISTRY:5000/epcalculator:latest

# Then restart deployment
kubectl rollout restart deployment/ep-calculator
```

---

## Complete Workflow

### One-time Setup:
```bash
# 1. Ask your IT admin for the Rancher registry URL
# 2. Get credentials if needed
```

### Every Update:
```bash
# 1. Build new image
docker build -t epcalculator:v2 .

# 2. Tag for registry
docker tag epcalculator:v2 YOUR_REGISTRY:5000/epcalculator:latest

# 3. Push (only changed layers uploaded!)
docker push YOUR_REGISTRY:5000/epcalculator:latest

# 4. Update deployment in Rancher
# - UI: Edit deployment → change image tag → save
# - CLI: kubectl rollout restart deployment/ep-calculator
```

---

## Troubleshooting

### "unauthorized: authentication required"
```bash
docker login YOUR_REGISTRY:5000
# Enter username and password
```

### "http: server gave HTTP response to HTTPS client"
```bash
# Add to /etc/docker/daemon.json:
{
  "insecure-registries": ["YOUR_REGISTRY:5000"]
}

# Then restart Docker
sudo systemctl restart docker
```

### Rancher can't pull image
- Check image name matches exactly
- Verify registry is accessible from Kubernetes nodes
- Add image pull secret if registry requires authentication:
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=YOUR_REGISTRY:5000 \
    --docker-username=YOUR_USERNAME \
    --docker-password=YOUR_PASSWORD
  ```

---

## Recommended Workflow

**For production:**
- Use version tags: `v1`, `v2`, `v3`
- Keep `latest` for testing
- Never use `latest` in production

**For development/testing:**
- Use `latest` tag
- Set `imagePullPolicy: Always`
- Fast iterations with layer caching

**Example tagging strategy:**
```bash
# Development
docker tag epcalculator:v2 registry:5000/epcalculator:dev

# Staging
docker tag epcalculator:v2 registry:5000/epcalculator:staging

# Production
docker tag epcalculator:v2 registry:5000/epcalculator:v2
docker tag epcalculator:v2 registry:5000/epcalculator:latest
```
