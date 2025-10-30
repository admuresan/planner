"""Main entry point for the Planner application."""
from flask import Flask, render_template
from flask_cors import CORS
from config import Config
from api.events import events_bp
from api.categories import categories_bp
from api.settings import settings_bp
from api import event_storage
import os

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Ensure data directory and storage structure exist
os.makedirs(app.config['STORAGE_PATH'], exist_ok=True)

# Initialize event storage structure
with app.app_context():
    event_storage.ensure_storage_structure()
    
    # Auto-migrate if old events.json exists
    old_events_file = os.path.join(app.config['STORAGE_PATH'], 'events.json')
    if os.path.exists(old_events_file):
        event_storage.migrate_from_single_file(old_events_file)

# Register blueprints
app.register_blueprint(events_bp, url_prefix='/api/events')
app.register_blueprint(categories_bp, url_prefix='/api/categories')
app.register_blueprint(settings_bp, url_prefix='/api/settings')

@app.route('/')
def index():
    """Render the main planner page."""
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=6001)

