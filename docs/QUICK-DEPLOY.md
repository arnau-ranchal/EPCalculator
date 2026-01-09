# Quick Deployment Commands

## Build Image

```bash
docker build -t epcalculator:v2 .
```

## Push to Registry (ask your admin for registry URL)

```bash
# Example with Rancher registry
REGISTRY="rancher.upf.edu:5000"  # Replace with your registry

# Tag
docker tag epcalculator:v2 $REGISTRY/epcalculator:v2
docker tag epcalculator:v2 $REGISTRY/epcalculator:latest

# Login (if needed)
docker login $REGISTRY

# Push
docker push $REGISTRY/epcalculator:v2
docker push $REGISTRY/epcalculator:latest
```

## Update Deployment in Rancher

### Option 1: UI
1. Workloads → Deployments → `ep-calculator`
2. ⋮ → Edit Config
3. Change image to: `$REGISTRY/epcalculator:latest`
4. Save → Rolling update happens automatically

### Option 2: kubectl
```bash
kubectl set image deployment/ep-calculator \
  ep-calculator=$REGISTRY/epcalculator:latest
```

## Benefits of Registry vs Tar

✅ **With Registry (Recommended):**
- First push: ~2GB upload
- Next push: ~50MB (only changed layers)
- Rancher pulls automatically
- All nodes get the image

❌ **With Tar (Old Way):**
- Every upload: 4.2GB file transfer
- Manual load on each node
- Slow updates

## Complete Workflow

```bash
# 1. Make code changes

# 2. Build
docker build -t epcalculator:v2 .

# 3. Push to registry (only 50MB after first time!)
docker push $REGISTRY/epcalculator:latest

# 4. Restart deployment
kubectl rollout restart deployment/ep-calculator
```

That's it! The registry handles layer caching automatically.
