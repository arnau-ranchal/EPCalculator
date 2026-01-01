#!/bin/bash
# EPCalculator Kubernetes Deployment Script

set -e

# Configuration
REGISTRY_URL="your-registry.com"  # Replace with your Docker registry
IMAGE_NAME="epcalculator"
VERSION="v2.0-$(date +%Y%m%d-%H%M%S)"
NAMESPACE="epcalculator"

echo "🚀 Starting EPCalculator Kubernetes deployment..."
echo "Registry: $REGISTRY_URL"
echo "Image: $IMAGE_NAME:$VERSION"
echo "Namespace: $NAMESPACE"

# Step 1: Build Docker image
echo ""
echo "📦 Step 1: Building Docker image..."
docker build -f Dockerfile.node -t $IMAGE_NAME:$VERSION .
docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

# Step 2: Push to registry
echo ""
echo "🔄 Step 2: Pushing to registry..."
docker tag $IMAGE_NAME:$VERSION $REGISTRY_URL/$IMAGE_NAME:$VERSION
docker tag $IMAGE_NAME:latest $REGISTRY_URL/$IMAGE_NAME:latest

echo "Pushing to registry..."
docker push $REGISTRY_URL/$IMAGE_NAME:$VERSION
docker push $REGISTRY_URL/$IMAGE_NAME:latest

# Step 3: Update Kubernetes manifests
echo ""
echo "⚙️ Step 3: Updating Kubernetes manifests..."

# Update deployment.yaml with new image
sed -i "s|image: epcalculator:2.0|image: $REGISTRY_URL/$IMAGE_NAME:$VERSION|g" k8s/deployment.yaml

# Step 4: Apply to Kubernetes
echo ""
echo "🎯 Step 4: Deploying to Kubernetes..."

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply all configurations
echo "Applying namespace..."
kubectl apply -f k8s/namespace.yaml

echo "Applying storage..."
kubectl apply -f k8s/storage.yaml

echo "Applying configmap..."
kubectl apply -f k8s/configmap.yaml

echo "Applying deployment..."
kubectl apply -f k8s/deployment.yaml

echo "Applying service..."
kubectl apply -f k8s/service.yaml

echo "Applying ingress..."
kubectl apply -f k8s/ingress.yaml

echo "Applying monitoring (optional)..."
kubectl apply -f k8s/monitoring.yaml || echo "Monitoring not applied (optional)"

# Step 5: Wait for deployment
echo ""
echo "⏳ Step 5: Waiting for deployment..."
kubectl rollout status deployment/epcalculator -n $NAMESPACE --timeout=300s

# Step 6: Verify deployment
echo ""
echo "✅ Step 6: Verifying deployment..."
kubectl get pods -n $NAMESPACE -l app=epcalculator
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

# Step 7: Health check
echo ""
echo "🏥 Step 7: Running health check..."
SERVICE_IP=$(kubectl get service epcalculator-service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
kubectl run health-check --rm -i --restart=Never --image=curlimages/curl -- curl -s http://$SERVICE_IP/api/health || echo "Health check failed - service may still be starting"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Access your application:"
echo "- Internal: http://$SERVICE_IP"
echo "- External: Check ingress configuration"
echo ""
echo "📝 Useful commands:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -f deployment/epcalculator -n $NAMESPACE"
echo "  kubectl port-forward service/epcalculator-service 8080:80 -n $NAMESPACE"
echo ""
echo "🔄 To update the deployment:"
echo "  kubectl rollout restart deployment/epcalculator -n $NAMESPACE"