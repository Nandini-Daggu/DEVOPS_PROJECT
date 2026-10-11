# ─────────────────────────────────────────────
# QuizGen AI – Backend Dockerfile
# Python 3.12 slim + gunicorn (production WSGI)
# ─────────────────────────────────────────────

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing .pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies needed by python-pptx (lxml, Pillow)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libxml2-dev \
        libxslt-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose Flask / gunicorn port
EXPOSE 5000

# Run with gunicorn in production mode
# - 2 worker processes (adjust based on CPU)
# - bind to all interfaces on port 5000
# - module:callable = app:app
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5000", "--timeout", "120", "app:app"]
