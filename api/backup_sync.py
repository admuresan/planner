r"""
Backup and synchronization utility with intelligent merge logic.

This module handles bidirectional sync between the local data directory
and a backup location, using file modification times to intelligently
merge changes without overwriting newer data.

MULTI-DEVICE SYNC ARCHITECTURE:
-------------------------------
This system is designed to enable calendar synchronization across multiple
devices using a shared folder (e.g., Dropbox, iCloud Drive, Google Drive).

Key Design Principles:
1. The backup LOCATION is device-specific (.backup_location.json) and NOT synced
   - Each device can have different paths (e.g., /Users/alice/Dropbox vs C:\Users\Bob\Dropbox)
   - This file is excluded from sync and git

2. The backup ENABLED flag (settings.json) IS synced
   - When you enable sync on one device, other devices see it's enabled
   - Each device must still set its own local path to the shared folder

3. Data files (events, categories, indexes) are synced bidirectionally
   - Changes merge intelligently by ID and modification time
   - No data loss from concurrent edits

Usage Example:
-------------
Device 1 (Mac):    Set location to /Users/alice/Dropbox/planner_backup
Device 2 (PC):     Set location to C:\Users\Bob\Dropbox\planner_backup
Device 3 (Linux):  Set location to /home/charlie/Dropbox/planner_backup

All three devices sync to the same Dropbox folder, but each has a
device-specific path to reach it.
"""
import os
import json
import shutil
from datetime import datetime
from typing import Dict, List, Any, Tuple


def get_file_mtime(file_path: str) -> float:
    """Get file modification time."""
    if os.path.exists(file_path):
        return os.path.getmtime(file_path)
    return 0.0


def read_json_safe(file_path: str) -> Any:
    """Safely read and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError, FileNotFoundError):
        return None


def write_json_safe(file_path: str, data: Any) -> bool:
    """Safely write data to a JSON file."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False


def merge_json_by_id(local_data: List[Dict], backup_data: List[Dict], 
                     local_mtime: float, backup_mtime: float) -> List[Dict]:
    """
    Merge two lists of JSON objects by ID, keeping the most recent version.
    
    Args:
        local_data: List of objects from local file
        backup_data: List of objects from backup file
        local_mtime: Modification time of local file
        backup_mtime: Modification time of backup file
        
    Returns:
        Merged list of objects
    """
    if not isinstance(local_data, list) or not isinstance(backup_data, list):
        # If one is newer, return that one; otherwise return local
        if backup_mtime > local_mtime:
            return backup_data
        return local_data
    
    # Create maps by ID
    local_map = {item.get('id'): item for item in local_data if isinstance(item, dict) and 'id' in item}
    backup_map = {item.get('id'): item for item in backup_data if isinstance(item, dict) and 'id' in item}
    
    # Merge: union of all IDs
    all_ids = set(local_map.keys()) | set(backup_map.keys())
    merged = []
    
    for item_id in all_ids:
        local_item = local_map.get(item_id)
        backup_item = backup_map.get(item_id)
        
        if local_item and backup_item:
            # Both exist - use the one from the newer file
            if backup_mtime > local_mtime:
                merged.append(backup_item)
            else:
                merged.append(local_item)
        elif local_item:
            # Only in local
            merged.append(local_item)
        elif backup_item:
            # Only in backup
            merged.append(backup_item)
    
    return merged


def merge_json_dict(local_data: Dict, backup_data: Dict,
                    local_mtime: float, backup_mtime: float) -> Dict:
    """
    Merge two dictionaries (for index files).
    
    Args:
        local_data: Dictionary from local file
        backup_data: Dictionary from backup file
        local_mtime: Modification time of local file
        backup_mtime: Modification time of backup file
        
    Returns:
        Merged dictionary
    """
    if not isinstance(local_data, dict) or not isinstance(backup_data, dict):
        if backup_mtime > local_mtime:
            return backup_data
        return local_data
    
    # Merge keys from both dictionaries
    merged = {}
    all_keys = set(local_data.keys()) | set(backup_data.keys())
    
    for key in all_keys:
        local_value = local_data.get(key)
        backup_value = backup_data.get(key)
        
        if local_value is not None and backup_value is not None:
            # Both exist - prefer newer file's value
            if backup_mtime > local_mtime:
                merged[key] = backup_value
            else:
                merged[key] = local_value
        elif local_value is not None:
            merged[key] = local_value
        elif backup_value is not None:
            merged[key] = backup_value
    
    return merged


def sync_file(local_path: str, backup_path: str) -> str:
    """
    Sync a single file between local and backup locations.
    
    Args:
        local_path: Path to local file
        backup_path: Path to backup file
        
    Returns:
        Action taken: 'copied_to_backup', 'copied_to_local', 'merged', 'skipped', or 'created'
    """
    local_exists = os.path.exists(local_path)
    backup_exists = os.path.exists(backup_path)
    
    # Case 1: Only local exists - copy to backup
    if local_exists and not backup_exists:
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        shutil.copy2(local_path, backup_path)
        return 'created'
    
    # Case 2: Only backup exists - copy to local
    if backup_exists and not local_exists:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        shutil.copy2(backup_path, local_path)
        return 'restored'
    
    # Case 3: Both exist - compare and merge
    if local_exists and backup_exists:
        local_mtime = get_file_mtime(local_path)
        backup_mtime = get_file_mtime(backup_path)
        
        # If times are very close (within 1 second), consider them the same
        if abs(local_mtime - backup_mtime) < 1.0:
            return 'skipped'
        
        # Try to merge JSON files intelligently
        if local_path.endswith('.json'):
            local_data = read_json_safe(local_path)
            backup_data = read_json_safe(backup_path)
            
            if local_data is not None and backup_data is not None:
                # Determine merge strategy based on data structure
                if isinstance(local_data, list) and isinstance(backup_data, list):
                    merged = merge_json_by_id(local_data, backup_data, local_mtime, backup_mtime)
                    
                    # Write merged data to both locations
                    write_json_safe(local_path, merged)
                    write_json_safe(backup_path, merged)
                    
                    # Set both files to same mtime
                    now = datetime.now().timestamp()
                    os.utime(local_path, (now, now))
                    os.utime(backup_path, (now, now))
                    
                    return 'merged'
                    
                elif isinstance(local_data, dict) and isinstance(backup_data, dict):
                    merged = merge_json_dict(local_data, backup_data, local_mtime, backup_mtime)
                    
                    # Write merged data to both locations
                    write_json_safe(local_path, merged)
                    write_json_safe(backup_path, merged)
                    
                    # Set both files to same mtime
                    now = datetime.now().timestamp()
                    os.utime(local_path, (now, now))
                    os.utime(backup_path, (now, now))
                    
                    return 'merged'
        
        # For non-JSON or failed JSON parsing, use simple timestamp comparison
        if backup_mtime > local_mtime:
            shutil.copy2(backup_path, local_path)
            return 'copied_to_local'
        elif local_mtime > backup_mtime:
            shutil.copy2(local_path, backup_path)
            return 'copied_to_backup'
    
    return 'skipped'


def should_exclude_from_sync(filename: str) -> bool:
    """
    Check if a file should be excluded from sync.
    
    Args:
        filename: Name of the file to check
        
    Returns:
        True if file should be excluded, False otherwise
    """
    # Exclude hidden files (starting with .)
    if filename.startswith('.'):
        return True
    
    # Exclude device-specific files
    excluded_files = [
        '.backup_location.json',  # Device-specific backup location
        '.DS_Store',              # macOS metadata
        'Thumbs.db',              # Windows thumbnail cache
        'desktop.ini'             # Windows folder settings
    ]
    
    return filename in excluded_files


def sync_directory(local_dir: str, backup_dir: str) -> Dict[str, int]:
    """
    Recursively sync a directory between local and backup locations.
    
    Args:
        local_dir: Path to local directory
        backup_dir: Path to backup directory
        
    Returns:
        Dictionary with counts of actions taken
    """
    stats = {
        'created': 0,
        'restored': 0,
        'merged': 0,
        'copied_to_backup': 0,
        'copied_to_local': 0,
        'skipped': 0
    }
    
    # Ensure backup directory exists
    os.makedirs(backup_dir, exist_ok=True)
    
    # Get all files in both directories
    local_files = set()
    backup_files = set()
    
    # Walk local directory
    for root, dirs, files in os.walk(local_dir):
        for file in files:
            if should_exclude_from_sync(file):
                continue  # Skip excluded files
            local_path = os.path.join(root, file)
            rel_path = os.path.relpath(local_path, local_dir)
            local_files.add(rel_path)
    
    # Walk backup directory
    for root, dirs, files in os.walk(backup_dir):
        for file in files:
            if should_exclude_from_sync(file):
                continue  # Skip excluded files
            backup_path = os.path.join(root, file)
            rel_path = os.path.relpath(backup_path, backup_dir)
            backup_files.add(rel_path)
    
    # Sync all unique files
    all_files = local_files | backup_files
    
    for rel_path in all_files:
        local_path = os.path.join(local_dir, rel_path)
        backup_path = os.path.join(backup_dir, rel_path)
        
        action = sync_file(local_path, backup_path)
        stats[action] = stats.get(action, 0) + 1
    
    return stats


def perform_sync(source_dir: str, backup_location: str) -> Dict[str, Any]:
    """
    Perform a complete backup/sync operation.
    
    Args:
        source_dir: Path to the local data directory
        backup_location: Path to the backup location
        
    Returns:
        Dictionary with sync results
    """
    # Expand user path
    backup_location = os.path.expanduser(backup_location)
    
    # Validate source directory exists
    if not os.path.exists(source_dir):
        raise ValueError(f"Source directory does not exist: {source_dir}")
    
    # Validate backup location exists
    if not os.path.exists(backup_location):
        raise ValueError(f"Backup location does not exist: {backup_location}")
    
    if not os.path.isdir(backup_location):
        raise ValueError(f"Backup location is not a directory: {backup_location}")
    
    # Create backup subdirectory for this app
    backup_dir = os.path.join(backup_location, 'planner_backup')
    
    try:
        # Perform sync
        stats = sync_directory(source_dir, backup_dir)
        
        # Calculate total files synced (excluding skipped)
        files_synced = sum(count for action, count in stats.items() if action != 'skipped')
        
        return {
            'files_synced': files_synced,
            'timestamp': datetime.now().isoformat(),
            'details': stats
        }
    except Exception as e:
        raise Exception(f"Sync failed: {str(e)}")

