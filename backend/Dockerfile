# NexusRoute backend — Django REST (development image)
FROM python:3.12-slim

# Keep Python lean and logs unbuffered for docker logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for psycopg2.
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better layer caching).
COPY requirements/ requirements/
RUN pip install --upgrade pip && pip install -r requirements/dev.txt

# Copy the application code.
COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
