#!/bin/bash

# YesReply Backend Startup Script

echo "Starting YesReply Backend API..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || . venv/bin/activate

# Install dependencies if needed
if [ ! -f ".dependencies_installed" ]; then
    echo "Installing dependencies..."
    pip install -e .
    touch .dependencies_installed
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Using default configuration."
    echo "Please create a .env file based on .env.example"
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start the server
echo "Starting server on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

