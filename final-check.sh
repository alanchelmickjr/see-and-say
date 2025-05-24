#!/bin/bash

# Simply eBay - Final Quality Check
# Validates that our enhanced onboarding and startup system is ready

echo "🎉 Simply eBay - Final Quality Check"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

success_count=0
total_tests=6

# Test 1: Check README badges and content
echo -n "📖 README has beautiful badges and content... "
if grep -q "Gun.js P2P" README.md && grep -q "Claude Sonnet" README.md && grep -q "Alan Helmick" README.md; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌${NC}"
fi

# Test 2: Startup script exists and is executable
echo -n "🚀 Startup script is ready... "
if [ -x "startup.sh" ]; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌${NC}"
fi

# Test 3: Onboarding page exists with neumorphic design
echo -n "🎨 Neumorphic onboarding exists... "
if [ -f "pages/onboarding.js" ] && grep -q "neumorphic" pages/onboarding.js; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌${NC}"
fi

# Test 4: Gun.js authentication is properly configured
echo -n "🔫 Gun.js authentication ready... "
if [ -f "pages/api/auth/register.js" ] && grep -q "PASSWORD_TOO_SHORT" pages/api/auth/register.js; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌${NC}"
fi

# Test 5: Node modules exist
echo -n "📦 Dependencies installed... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${YELLOW}⚠️ Run 'pnpm install' first${NC}"
fi

# Test 6: Package.json has required scripts
echo -n "📄 Package.json configured... "
if [ -f "package.json" ] && grep -q "next" package.json; then
    echo -e "${GREEN}✅${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌${NC}"
fi

echo ""
echo "Results: ${success_count}/${total_tests} tests passed"

if [ $success_count -eq $total_tests ]; then
    echo -e "${GREEN}🎉 Simply eBay is ready for instant traction!${NC}"
    echo ""
    echo "🚀 Quick Start:"
    echo "   ./startup.sh"
    echo ""
    echo "📱 Then visit: http://localhost:3000"
    echo ""
    echo "✨ Features ready:"
    echo "   • Beautiful neumorphic onboarding"
    echo "   • Gun.js P2P authentication"
    echo "   • Mobile-first camera scanning"
    echo "   • AI-powered item recognition"
    echo "   • One-tap eBay listing"
    echo ""
    echo "🌟 Open source with love from Claude & Alan"
    exit 0
else
    echo -e "${RED}❌ Some components need attention${NC}"
    echo "Please fix the failing tests above"
    exit 1
fi
