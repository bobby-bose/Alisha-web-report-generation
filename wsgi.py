import sys
import os

# Automatically detect the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import the Flask app
from main import app, db

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# PythonAnywhere will look for the 'application' variable
application = app

if __name__ == '__main__':
    app.run()
