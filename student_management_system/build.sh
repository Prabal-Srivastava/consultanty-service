#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting build script..."

# Move to the directory where build.sh is located
cd "$(dirname "$0")"
echo "Current directory: $(pwd)"

# Install dependencies
echo "Installing requirements..."
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

echo "Build script finished successfully!"
