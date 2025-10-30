"""
Shared utilities for triggering background sync operations.
"""
import threading
from flask import current_app


def trigger_background_sync():
    """
    Trigger a background sync if enabled (non-blocking).
    
    This function runs the sync operation in a background thread to avoid
    blocking the main request. It checks if backup/sync is enabled in settings
    before attempting to sync.
    """
    def sync_task():
        try:
            from api.settings import load_settings
            from api.backup_sync import perform_sync
            
            settings = load_settings()
            if settings.get('backupEnabled') and settings.get('backupLocation'):
                perform_sync(
                    source_dir=current_app.config['STORAGE_PATH'],
                    backup_location=settings['backupLocation']
                )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Background sync error: {e}")
    
    # Run sync in background thread
    thread = threading.Thread(target=sync_task)
    thread.daemon = True
    thread.start()

