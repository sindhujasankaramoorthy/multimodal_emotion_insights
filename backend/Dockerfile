FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 7860

# Set environment variables for HF Spaces
ENV PORT=7860
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["python", "main.py"]
