#!/bin/bash

# LIGO Installation Script for Tezos Contract Compilation
# This script provides instructions for installing LIGO

echo "🔧 LIGO Installation Guide for Tezos Contract Compilation"
echo "========================================================="

# Check if LIGO is already installed
if command -v ligo &> /dev/null; then
    echo "✅ LIGO is already installed!"
    ligo --version
    exit 0
fi

echo "❌ LIGO not found on your system."
echo ""
echo "📋 Manual Installation Required"
echo "==============================="
echo ""
echo "Please install LIGO manually using one of these methods:"
echo ""
echo "🌐 Method 1: Visit the official website"
echo "   https://ligolang.org/docs/intro/installation"
echo ""
echo "📦 Method 2: Use the official installer"
echo "   curl -L https://ligolang.org/install.sh | bash"
echo ""
echo "🐳 Method 3: Use Docker"
echo "   docker run --rm -v \"\$PWD:\$PWD\" -w \"\$PWD\" ligolang/ligo:latest"
echo ""
echo "📋 Method 4: Download from GitHub releases"
echo "   1. Visit: https://github.com/ligolang/ligo/releases"
echo "   2. Download the appropriate version for your OS"
echo "   3. Extract and add to your PATH"
echo ""
echo "After installation, run this script again to verify:"
echo "   npm run install:ligo"
echo ""
echo "Then compile and deploy Tezos contracts:"
echo "   npm run deploy:tezos" 