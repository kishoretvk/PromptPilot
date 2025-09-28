# PromptPilot Backend Production Dockerfile
# Multi-stage build for optimized production image

# ================================
# Stage 1: Builder
# ================================
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements-simple.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements-simple.txt

# ================================
# Stage 2: Production Runtime
# ================================
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r promptpilot && useradd -r -g promptpilot promptpilot

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create application directory
WORKDIR /app

# Copy application code
COPY --chown=promptpilot:promptpilot . .

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/data \
    && chown -R promptpilot:promptpilot /app

# Switch to non-root user
USER promptpilot

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Default command
CMD ["python", "-m", "uvicorn", "api.rest_simple:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# ================================
# Stage 3: Celery Worker
# ================================
FROM python:3.11-slim as celery-worker

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r promptpilot && useradd -r -g promptpilot promptpilot

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

COPY --chown=promptpilot:promptpilot . .

RUN mkdir -p /app/logs /app/uploads /app/data \
    && chown -R promptpilot:promptpilot /app

USER promptpilot

CMD ["celery", "-A", "tasks.celery", "worker", "--loglevel=info"]

# ================================
# Stage 4: Celery Beat
# ================================
FROM python:3.11-slim as celery-beat

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r promptpilot && useradd -r -g promptpilot promptpilot

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

COPY --chown=promptpilot:promptpilot . .

RUN mkdir -p /app/logs /app/uploads /app/data \
    && chown -R promptpilot:promptpilot /app

USER promptpilot

CMD ["celery", "-A", "tasks.celery", "beat", "--loglevel=info"]

# ================================
# Labels for metadata
# ================================
LABEL maintainer="PromptPilot Team"
LABEL version="1.0.0"
LABEL description="PromptPilot Backend API Server"
LABEL org.opencontainers.image.source="https://github.com/your-repo/PromptPilot"
LABEL org.opencontainers.image.licenses="MIT"
