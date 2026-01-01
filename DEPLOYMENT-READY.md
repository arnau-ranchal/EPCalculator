# ✅ EPCalculator - Ready for Rancher Deployment

## 🎉 What Was Fixed

**Problem**: Frontend was calling `http://localhost:8000/api` which doesn't work in production
**Solution**: Changed to relative URL `/api` so it calls the same server hosting the frontend

## 📦 Final Docker Image

- **Image**: `epcalculator:latest` and `epcalculator:v3`
- **Frontend**: ✅ Svelte app with relative API calls
- **Backend**: ✅ Node.js with exact C++ implementation via FFI
- **Tested**: ✅ API works, frontend loads, computations return exact results

---

## 🚀 Deploy to Rancher NOW

### Step 1: Get Your Registry URL

Ask your IT admin or find it in Rancher UI. Examples:
- `rancher.upf.edu:5000`
- `registry.cluster.local:5000`
- `harbor.university.edu/project`

### Step 2: Tag and Push

```bash
# Replace with YOUR registry URL
REGISTRY="rancher.upf.edu:5000"

# Tag the image
docker tag epcalculator:latest $REGISTRY/epcalculator:latest
docker tag epcalculator:latest $REGISTRY/epcalculator:v3

# Login (if needed)
docker login $REGISTRY

# Push (layer caching makes this fast!)
docker push $REGISTRY/epcalculator:latest
docker push $REGISTRY/epcalculator:v3
```

### Step 3: Update Rancher Deployment

**Option A: Rancher UI (Easiest)**
1. Workloads → Deployments → `ep-calculator`
2. Click ⋮ → **Edit Config**
3. **Container Image**: Change to `$REGISTRY/epcalculator:latest`
4. **Image Pull Policy**: Set to `Always`
5. **Save** → Rancher does rolling update automatically

**Option B: kubectl**
```bash
kubectl set image deployment/ep-calculator \
  ep-calculator=$REGISTRY/epcalculator:latest

# Or force restart
kubectl rollout restart deployment/ep-calculator
```

---

## ⚙️ Rancher Configuration

### Container Settings:
- **Image**: `YOUR_REGISTRY/epcalculator:latest`
- **Image Pull Policy**: `Always`
- **Port**: 8000
- **Protocol**: TCP

### Service Settings:
- **Type**: ClusterIP or LoadBalancer (for external access)
- **Port**: 80 → Target Port: 8000

### Ingress Settings (for external access):
- **Host**: `epcalculator.yourdomain.com`
- **Path**: `/`
- **Service**: `ep-calculator-service`
- **Port**: 80

### Health Checks (Already in Dockerfile):
- **Readiness**: HTTP GET `/api/health` on port 8000
- **Liveness**: HTTP GET `/api/health` on port 8000

---

## 📊 Benefits of This Deployment

✅ **Registry Layer Caching**:
- First push: ~2GB
- Next push: ~50MB (only changed code!)

✅ **Zero Downtime Updates**:
- Rancher does rolling updates automatically
- Old pods stay running until new ones are healthy

✅ **Production Ready**:
- Multi-stage build (optimized size)
- Non-root user (security)
- Health checks (auto-restart if fails)
- Exact C++ implementation (perfect accuracy)

✅ **Works in Production**:
- Relative API URLs work with any domain/IP
- Frontend calls same server it's hosted on
- No CORS issues

---

## 🔄 Future Updates Workflow

```bash
# 1. Make code changes

# 2. Rebuild (fast with layer caching!)
docker build -t epcalculator:latest .

# 3. Push (only ~50MB, not 2GB!)
docker push $REGISTRY/epcalculator:latest

# 4. Restart deployment
kubectl rollout restart deployment/ep-calculator
```

That's it! The registry handles everything automatically.

---

## 🧪 Testing After Deployment

Once deployed, test these:

1. **Frontend loads**: Go to your ingress URL
2. **Health check**: `http://your-url/api/health`
3. **Compute works**: Click "Compute Error Probability" button
4. **Results are correct**: E0 ≈ 0.69, ρ = 1.0 for default params

---

## 📁 Files Created

- `Dockerfile` - Production multi-stage build
- `REGISTRY-DEPLOYMENT.md` - Detailed registry guide
- `QUICK-DEPLOY.md` - Quick command reference
- `DEPLOYMENT-READY.md` - This file

---

## ✨ Summary

**Before**: `localhost:8000` hardcoded → doesn't work in production
**After**: Relative `/api` URLs → works everywhere!

**Your image is ready to push to the registry and deploy to Rancher!** 🚀
