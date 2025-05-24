#!/bin/bash

# Simply eBay - Quick Cleanup Script
# Stops all services gracefully

echo "🛑 Stopping Simply eBay services..."

# Kill processes by name
pkill -f "gun-relay" 2>/dev/null && echo "  ✓ Gun.js relay stopped"
pkill -f "llamafile" 2>/dev/null && echo "  ✓ LlamaFile AI stopped"  
pkill -f "next" 2>/dev/null && echo "  ✓ Next.js stopped"

# Kill by port if needed
for port in 3000 8080 8765; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null && echo "  ✓ Process on port $port stopped"
    fi
done

echo "🧹 Cleanup complete!"
