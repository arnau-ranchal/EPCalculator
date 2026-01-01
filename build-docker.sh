#!/bin/bash
# EPCalculator Docker Build Script for Rancher

set -e

IMAGE_NAME="epcalculator"
TAG="rancher-$(date +%Y%m%d-%H%M%S)"

echo "🐳 Building EPCalculator Docker image for Rancher deployment"
echo "Image: $IMAGE_NAME:$TAG"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check Docker permissions
if ! docker info &> /dev/null; then
    echo "⚠️ Docker requires sudo or user must be in docker group"
    echo "Run one of these commands:"
    echo "  sudo usermod -aG docker \$USER  # Add user to docker group (logout/login required)"
    echo "  sudo docker build -f Dockerfile.node -t $IMAGE_NAME:$TAG ."
    echo ""
    echo "Or run this script with sudo:"
    echo "  sudo ./build-docker.sh"
    exit 1
fi

# Build the image
echo "📦 Building Docker image..."
docker build -f Dockerfile.node -t $IMAGE_NAME:$TAG .

# Also tag as latest
docker tag $IMAGE_NAME:$TAG $IMAGE_NAME:latest

echo ""
echo "✅ Docker image built successfully!"
echo "Images created:"
docker images | grep $IMAGE_NAME

echo ""
echo "🚀 Next steps for Rancher deployment:"
echo ""
echo "1. Save image to file:"
echo "   docker save $IMAGE_NAME:$TAG > epcalculator-rancher.tar"
echo ""
echo "2. Transfer to Rancher server:"
echo "   scp epcalculator-rancher.tar user@rancher-server:~/"
echo ""
echo "3. Load on Rancher server:"
echo "   docker load < epcalculator-rancher.tar"
echo ""
echo "4. Or push to registry (if available):"
echo "   docker tag $IMAGE_NAME:$TAG your-registry.com/$IMAGE_NAME:$TAG"
echo "   docker push your-registry.com/$IMAGE_NAME:$TAG"
echo ""
echo "5. Deploy with Rancher UI or kubectl:"
echo "   kubectl create deployment epcalculator --image=$IMAGE_NAME:$TAG"
echo "   kubectl expose deployment epcalculator --port=80 --target-port=8000"
echo ""

# Test the image locally (optional)
read -p "🧪 Do you want to test the image locally? (y/N) " -n 1 -r
echo
if [[ \$REPLY =~ ^[Yy]\$ ]]; then
    echo "🧪 Testing image locally on port 8080..."
    docker run -d --name epcalculator-test -p 8080:8000 $IMAGE_NAME:$TAG

    echo "Waiting for container to start..."
    sleep 5

    # Health check
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo "✅ Container is running successfully!"
        echo "🌐 Test it at: http://localhost:8080"
        echo ""
        echo "To stop test container:"
        echo "  docker stop epcalculator-test && docker rm epcalculator-test"
    else
        echo "❌ Container failed health check"
        echo "Check logs: docker logs epcalculator-test"
    fi
fi