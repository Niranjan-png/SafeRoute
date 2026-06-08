# ---- Base Stage ----
FROM python:3.11-slim AS base

# System dependencies for PostGIS, GDAL, and building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL env vars
ENV GDAL_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu/libgeos_c.so

# Install Poetry
ENV POETRY_VERSION=1.8.2
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VIRTUALENVS_CREATE=false
RUN curl -sSL https://install.python-poetry.org | python3 - \
    && ln -s /opt/poetry/bin/poetry /usr/local/bin/poetry

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS dependencies

# Copy dependency files first for Docker layer caching
COPY pyproject.toml poetry.lock* ./

# Install production dependencies only
RUN poetry install --no-interaction --no-ansi --no-root --only main

# ---- Application Stage ----
FROM dependencies AS application

# Copy the application code
COPY . .

# Install the project itself
RUN poetry install --no-interaction --no-ansi --only-root

EXPOSE 8000

# Default command: run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
