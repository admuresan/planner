"""API endpoints for settings management."""
from flask import Blueprint, request, jsonify, current_app
import os
import json

settings_bp = Blueprint('settings', __name__)

# Settings that get synced across devices
SETTINGS_FILE = 'settings.json'
# Backup location is device-specific and NOT synced
BACKUP_LOCATION_FILE = '.backup_location.json'

def get_settings_path():
    """Get the settings file path."""
    return os.path.join(current_app.config['STORAGE_PATH'], SETTINGS_FILE)

def get_backup_location_path():
    """Get the backup location file path (device-specific, not synced)."""
    return os.path.join(current_app.config['STORAGE_PATH'], BACKUP_LOCATION_FILE)

def load_backup_location():
    """Load backup location from device-specific file."""
    location_path = get_backup_location_path()
    
    if not os.path.exists(location_path):
        return ''
    
    try:
        with open(location_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('backupLocation', '')
    except (json.JSONDecodeError, IOError):
        return ''

def save_backup_location(location):
    """Save backup location to device-specific file."""
    location_path = get_backup_location_path()
    
    try:
        with open(location_path, 'w', encoding='utf-8') as f:
            json.dump({'backupLocation': location}, f, indent=2)
        return True
    except IOError:
        return False

def load_settings():
    """Load settings from file (synced settings + device-specific location)."""
    settings_path = get_settings_path()
    
    # Load synced settings
    if not os.path.exists(settings_path):
        synced_settings = {'backupEnabled': False}
    else:
        try:
            with open(settings_path, 'r', encoding='utf-8') as f:
                synced_settings = json.load(f)
        except (json.JSONDecodeError, IOError):
            synced_settings = {'backupEnabled': False}
    
    # Combine with device-specific backup location
    return {
        'backupEnabled': synced_settings.get('backupEnabled', False),
        'backupLocation': load_backup_location()
    }

def save_settings_to_file(settings):
    """Save settings to file (splits synced vs device-specific)."""
    settings_path = get_settings_path()
    
    # Save synced settings (only backupEnabled)
    synced_settings = {
        'backupEnabled': settings.get('backupEnabled', False)
    }
    
    try:
        with open(settings_path, 'w', encoding='utf-8') as f:
            json.dump(synced_settings, f, indent=2)
    except IOError:
        return False
    
    # Save device-specific backup location
    return save_backup_location(settings.get('backupLocation', ''))

@settings_bp.route('', methods=['GET'])
def get_settings():
    """Get current settings."""
    settings = load_settings()
    return jsonify(settings)

@settings_bp.route('', methods=['POST'])
def save_settings():
    """Save settings."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    settings = {
        'backupEnabled': data.get('backupEnabled', False),
        'backupLocation': data.get('backupLocation', '')
    }
    
    if save_settings_to_file(settings):
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to save settings'}), 500

@settings_bp.route('/validate-location', methods=['POST'])
def validate_location():
    """Validate that a backup location exists and is accessible."""
    data = request.get_json()
    location = data.get('location', '').strip()
    
    if not location:
        return jsonify({'valid': False, 'error': 'No location provided'}), 400
    
    # Expand user path (~)
    location = os.path.expanduser(location)
    
    # Check if path exists
    if not os.path.exists(location):
        return jsonify({'valid': False, 'error': 'Path does not exist'}), 400
    
    # Check if it's a directory
    if not os.path.isdir(location):
        return jsonify({'valid': False, 'error': 'Path is not a directory'}), 400
    
    # Check if we can write to it
    if not os.access(location, os.W_OK):
        return jsonify({'valid': False, 'error': 'Directory is not writable'}), 400
    
    return jsonify({'valid': True})

@settings_bp.route('/sync', methods=['POST'])
def trigger_sync():
    """Trigger a backup sync operation."""
    try:
        from api.backup_sync import perform_sync
        
        settings = load_settings()
        
        if not settings.get('backupEnabled') or not settings.get('backupLocation'):
            return jsonify({'error': 'Backup/sync is not enabled'}), 400
        
        result = perform_sync(
            source_dir=current_app.config['STORAGE_PATH'],
            backup_location=settings['backupLocation']
        )
        
        return jsonify({
            'success': True,
            'files_synced': result['files_synced'],
            'timestamp': result['timestamp']
        })
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Sync error: {error_details}")
        return jsonify({'error': f'{type(e).__name__}: {str(e)}'}), 500

