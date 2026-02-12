#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting build script..."

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
