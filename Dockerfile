# Use Python 3.12 as base
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PyMuPDF and other libs
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ .

# Start the application using the dynamic $PORT provided by Railway
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
