import os
import sys

# Ensure the project root is in the python path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

from student_management.wsgi import app

# This is the object Vercel will look for
application = app
