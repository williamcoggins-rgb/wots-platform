#!/usr/bin/env bash
set -euo pipefail

echo "🏛️  War of the Sphinx — Deployment"
echo "=================================="

# Check for required tools
command -v firebase >/dev/null 2>&1 || { echo "Error: firebase-tools not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: node not installed"; exit 1; }

# Build
echo "Building frontend..."
cd frontend && npm run build && cd ..

echo "Building functions..."
cd functions && npm run build && cd ..

# Deploy
echo "Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
