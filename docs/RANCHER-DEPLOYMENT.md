# EPCalculator Rancher Deployment Guide

## 🚀 Quick Start

### 1. Build Docker Image
```bash
# Add user to docker group (one time setup)
sudo usermod -aG docker $USER
# Logout and login again, then:

./build-docker.sh
```

### 2. Export Image for Rancher
```bash
# Save image to file
docker save epcalculator:latest > epcalculator-rancher.tar

# Or with specific tag
docker save epcalculator:rancher-$(date +%Y%m%d) > epcalculator-rancher.tar
```

### 3. Transfer to Rancher Server
```bash
scp epcalculator-rancher.tar user@your-rancher-server:~/
```

### 4. Load Image on Rancher
```bash
# SSH to Rancher server
ssh user@your-rancher-server

# Load the image
docker load < epcalculator-rancher.tar
```

## 📋 Rancher UI Deployment

### Option A: Using Rancher UI

1. **Go to Rancher Dashboard**
2. **Select your cluster/project**
3. **Deploy Workload:**
   - Name: `epcalculator`
   - Docker Image: `epcalculator:latest`
   - Port Mapping: `8000` (container) → `80` (host)
   - Replicas: `2`

4. **Configure Health Checks:**
   - Readiness Check: `HTTP GET /api/health on port 8000`
   - Liveness Check: `HTTP GET /api/health on port 8000`

5. **Set Resource Limits:**
   - Memory: `512Mi` limit, `256Mi` request
   - CPU: `500m` limit, `200m` request

### Option B: Using kubectl

```bash
# Deploy with kubectl
kubectl create deployment epcalculator --image=epcalculator:latest
kubectl scale deployment epcalculator --replicas=2

# Expose service
kubectl expose deployment epcalculator --port=80 --target-port=8000 --type=LoadBalancer

# Check status
kubectl get pods,services
```

## 🔧 Configuration

### Environment Variables (Optional)
```yaml
env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "8000"
```

### Volume Mounts (Optional)
```yaml
volumeMounts:
  - name: data-storage
    mountPath: /app/data
```

## 🏥 Health Checks

The application exposes health endpoints:
- `GET /api/health` - Basic health check
- `GET /api/compute` - API functionality test

## 🎯 Access Your Application

1. **Find the service IP:**
   ```bash
   kubectl get services
   ```

2. **Test the API:**
   ```bash
   curl http://SERVICE-IP/api/health
   ```

3. **Access the web interface:**
   ```
   http://SERVICE-IP
   ```

## 🔍 Troubleshooting

### Check Pod Status
```bash
kubectl get pods
kubectl describe pod POD-NAME
kubectl logs POD-NAME
```

### Common Issues

**1. ImagePullError**
- Ensure image is loaded: `docker images | grep epcalculator`
- Check image name matches deployment

**2. Container Won't Start**
- Check logs: `kubectl logs deployment/epcalculator`
- Verify C++ library compiled correctly

**3. Health Check Failing**
- Port may not be exposed correctly
- Check container is listening on 8000: `kubectl port-forward pod/POD-NAME 8080:8000`

## 📊 Monitoring

### Resource Usage
```bash
kubectl top pods
kubectl describe pod POD-NAME
```

### Scaling
```bash
# Scale up/down
kubectl scale deployment epcalculator --replicas=3

# Auto-scaling (if metrics server available)
kubectl autoscale deployment epcalculator --cpu-percent=70 --min=1 --max=5
```

## 🔄 Updates

### Rolling Update
```bash
# Build new image with new tag
docker build -f Dockerfile.node -t epcalculator:v2 .

# Update deployment
kubectl set image deployment/epcalculator epcalculator=epcalculator:v2

# Check rollout status
kubectl rollout status deployment/epcalculator
```

### Rollback
```bash
kubectl rollout undo deployment/epcalculator
```

## 🌐 External Access

### Ingress (Recommended)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: epcalculator-ingress
spec:
  rules:
  - host: epcalculator.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: epcalculator
            port:
              number: 80
```

### NodePort (Alternative)
```bash
kubectl expose deployment epcalculator --port=80 --target-port=8000 --type=NodePort
```