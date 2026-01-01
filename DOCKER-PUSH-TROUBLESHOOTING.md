# Docker Push Troubleshooting - Stuck Upload

## Problem: Push Gets Stuck at 54.86MB/57.91MB

This usually means:
1. Network timeout/connection issues
2. Registry has size limits
3. MTU (packet size) issues
4. Docker daemon needs restart

---

## Solution 1: Check Image Layers (Find the Problem)

```bash
# See what layers are in your image
docker history epcalculator:latest --no-trunc

# Check actual size of each layer
docker inspect epcalculator:latest | grep -A 30 "Layers"
```

The first layer getting stuck is likely the **base Node.js layer** (~57MB). This shouldn't need to be pushed if the registry already has it!

---

## Solution 2: Restart Docker & Retry

```bash
# Restart Docker daemon
sudo systemctl restart docker

# Try push again
docker push YOUR_REGISTRY/epcalculator:latest
```

---

## Solution 3: Increase Timeouts

```bash
# Edit Docker daemon config
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "max-concurrent-uploads": 1,
  "registry-mirrors": [],
  "insecure-registries": ["YOUR_REGISTRY:5000"]
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

---

## Solution 4: Push in Smaller Chunks

The issue is likely the large base image layer. Let's check if the registry already has the base layers:

```bash
# Try pushing with --disable-content-trust
docker push --disable-content-trust YOUR_REGISTRY/epcalculator:latest
```

---

## Solution 5: Use Docker Save/Load Instead (Fallback)

If the registry push keeps failing, go back to the tar file method:

```bash
# Save the image
docker save epcalculator:latest | gzip > epcalculator-latest.tar.gz

# Transfer to Rancher server
scp epcalculator-latest.tar.gz user@rancher-server:~/

# On Rancher server, load it
gunzip -c epcalculator-latest.tar.gz | docker load

# Then tag and push locally on the Rancher server
docker tag epcalculator:latest localhost:5000/epcalculator:latest
docker push localhost:5000/epcalculator:latest
```

This works because pushing from the Rancher server to its own registry has much better network connectivity.

---

## Solution 6: Check What Layer is Stuck

```bash
# Check what's in that ~58MB layer
docker history epcalculator:latest

# The output will show which layer is 58MB
# It's likely one of these:
# - Base Node.js image
# - npm dependencies
# - Frontend build artifacts
```

---

## Solution 7: Split Into Smaller Pushes

If the issue is the large monolithic image, we can optimize the Dockerfile to create smaller layers:

```dockerfile
# Instead of copying everything at once:
COPY . .

# Copy in smaller chunks:
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY public ./public
```

---

## Solution 8: Test Registry Connectivity

```bash
# Test if you can reach the registry
curl -v https://YOUR_REGISTRY:5000/v2/

# Or if it's HTTP:
curl -v http://YOUR_REGISTRY:5000/v2/

# Expected response: 200 OK or 401 (authentication required)
# Bad: Connection timeout, connection refused
```

---

## Solution 9: Check Registry Disk Space

The registry might be full! SSH to the registry server and check:

```bash
# On registry server
df -h

# Check Docker storage
docker system df
```

---

## Recommended Workflow (Most Reliable)

### Method 1: Push from University Network
If you're pushing from home/outside university:
1. **VPN into university network first**
2. Then push to the registry
3. University internal networks have much better connectivity to Rancher

### Method 2: Push via Rancher Server
```bash
# 1. Build image locally
docker build -t epcalculator:latest .

# 2. Save to compressed tar
docker save epcalculator:latest | gzip > epcalc.tar.gz

# 3. SCP to Rancher server (this is reliable)
scp epcalc.tar.gz user@rancher-server:~/

# 4. On Rancher server, load and push
ssh user@rancher-server
docker load < epcalc.tar.gz
docker tag epcalculator:latest REGISTRY/epcalculator:latest
docker push REGISTRY/epcalculator:latest
# ^ This push is fast because it's on same network as registry
```

---

## Debug: What's Actually Happening

```bash
# Run push with debug output
docker push YOUR_REGISTRY/epcalculator:latest 2>&1 | tee push.log

# Check the log for errors
cat push.log
```

Look for:
- `EOF` - connection closed prematurely
- `timeout` - network timeout
- `unauthorized` - authentication issue
- `denied` - permission issue

---

## Quick Fix: Use Tar Method Right Now

Since the push is stuck, use this reliable method:

```bash
# 1. Save image
docker save epcalculator:latest | gzip > epcalculator.tar.gz
ls -lh epcalculator.tar.gz  # Should be ~400-600MB compressed

# 2. Transfer to Rancher server
# (Ask IT admin for the server address and credentials)
scp epcalculator.tar.gz username@rancher-server:~/

# 3. On Rancher server:
ssh username@rancher-server
docker load < epcalculator.tar.gz

# 4. Now update your deployment to use the image
# In Rancher UI: Edit deployment → Image: epcalculator:latest
```

---

## Prevention: Optimize for Smaller Images

For future pushes, we can optimize the Dockerfile to reduce layer sizes:

```dockerfile
# Use smaller base image
FROM node:18-alpine AS frontend-builder  # alpine is smaller

# Minimize layers
RUN npm ci && npm cache clean --force
```

But for now, **use the tar file method** - it's the most reliable when registry push is problematic.

---

## Ask Your IT Admin

Questions to ask:
1. **What's the registry URL?** (you need the exact URL)
2. **Is there a size limit per layer?** (some registries limit to 50MB)
3. **Can I SSH to the Rancher server?** (so you can load tar there)
4. **Is the registry on the same network?** (or do I need VPN?)
5. **Do you have Harbor or Docker Registry?** (different auth methods)
