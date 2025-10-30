"""
Specialized storage system for events with multi-file structure and indexing.

Events are stored in individual files within the events/ directory.
Two index files track event locations:
- events_index.json: Maps event IDs to filenames
- events_date_index.json: Maps start dates to event IDs for efficient querying
"""
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from flask import current_app

def get_events_path() -> str:
    """Get the events storage directory path."""
    return current_app.config['EVENTS_PATH']

def get_index_path() -> str:
    """Get the events index file path."""
    return os.path.join(
        current_app.config['STORAGE_PATH'],
        current_app.config['EVENTS_INDEX_FILE']
    )

def get_date_index_path() -> str:
    """Get the date index file path."""
    return os.path.join(
        current_app.config['STORAGE_PATH'],
        current_app.config['EVENTS_DATE_INDEX_FILE']
    )

def ensure_storage_structure():
    """Ensure all storage directories and index files exist."""
    # Create events directory
    events_path = get_events_path()
    os.makedirs(events_path, exist_ok=True)
    
    # Initialize index files if they don't exist
    index_path = get_index_path()
    if not os.path.exists(index_path):
        write_json(index_path, {})
    
    date_index_path = get_date_index_path()
    if not os.path.exists(date_index_path):
        write_json(date_index_path, {})

def read_json(file_path: str) -> Any:
    """Read and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError, FileNotFoundError):
        return None

def write_json(file_path: str, data: Any) -> bool:
    """Write data to a JSON file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

def load_index() -> Dict[str, str]:
    """Load the event ID to filename index."""
    ensure_storage_structure()
    index = read_json(get_index_path())
    return index if index is not None else {}

def save_index(index: Dict[str, str]) -> bool:
    """Save the event ID to filename index."""
    return write_json(get_index_path(), index)

def load_date_index() -> Dict[str, List[str]]:
    """Load the date to event IDs index."""
    ensure_storage_structure()
    date_index = read_json(get_date_index_path())
    return date_index if date_index is not None else {}

def save_date_index(date_index: Dict[str, List[str]]) -> bool:
    """Save the date to event IDs index."""
    return write_json(get_date_index_path(), date_index)

def get_event_filename(event_id: str) -> str:
    """Generate filename for an event."""
    return f"{event_id}.json"

def extract_date_key(iso_datetime: str) -> str:
    """Extract date key (YYYY-MM-DD) from ISO datetime string."""
    try:
        dt = datetime.fromisoformat(iso_datetime.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')
    except (ValueError, AttributeError):
        return None

def add_to_date_index(event_id: str, start_time: str, end_time: str):
    """Add event to date index for all dates it spans."""
    date_index = load_date_index()
    
    start_date_key = extract_date_key(start_time)
    end_date_key = extract_date_key(end_time)
    
    if not start_date_key or not end_date_key:
        return
    
    # Add event ID to all dates it spans
    start_date = datetime.fromisoformat(start_date_key)
    end_date = datetime.fromisoformat(end_date_key)
    
    current_date = start_date
    while current_date <= end_date:
        date_key = current_date.strftime('%Y-%m-%d')
        
        if date_key not in date_index:
            date_index[date_key] = []
        
        if event_id not in date_index[date_key]:
            date_index[date_key].append(event_id)
        
        current_date += timedelta(days=1)
    
    save_date_index(date_index)

def remove_from_date_index(event_id: str):
    """Remove event from date index."""
    date_index = load_date_index()
    
    # Remove event ID from all date entries
    modified = False
    for date_key in list(date_index.keys()):
        if event_id in date_index[date_key]:
            date_index[date_key].remove(event_id)
            modified = True
            
            # Clean up empty date entries
            if not date_index[date_key]:
                del date_index[date_key]
    
    if modified:
        save_date_index(date_index)

def get_event_ids_in_range(start_date: datetime, end_date: datetime) -> List[str]:
    """Get all event IDs that occur within the given date range."""
    date_index = load_date_index()
    event_ids = set()
    
    current_date = start_date
    while current_date <= end_date:
        date_key = current_date.strftime('%Y-%m-%d')
        if date_key in date_index:
            event_ids.update(date_index[date_key])
        current_date += timedelta(days=1)
    
    return list(event_ids)

def save_event(event_data: Dict[str, Any]) -> bool:
    """Save an event to its individual file and update indexes."""
    ensure_storage_structure()
    
    event_id = event_data.get('id')
    if not event_id:
        return False
    
    # Save event to its own file
    filename = get_event_filename(event_id)
    file_path = os.path.join(get_events_path(), filename)
    
    if not write_json(file_path, event_data):
        return False
    
    # Update ID index
    index = load_index()
    index[event_id] = filename
    save_index(index)
    
    # Update date index
    start_time = event_data.get('start_time')
    end_time = event_data.get('end_time')
    if start_time and end_time:
        # Remove old date entries first
        remove_from_date_index(event_id)
        # Add new date entries
        add_to_date_index(event_id, start_time, end_time)
    
    return True

def load_event(event_id: str) -> Optional[Dict[str, Any]]:
    """Load a single event by ID."""
    index = load_index()
    filename = index.get(event_id)
    
    if not filename:
        return None
    
    file_path = os.path.join(get_events_path(), filename)
    return read_json(file_path)

def delete_event(event_id: str) -> bool:
    """Delete an event file and remove from indexes."""
    index = load_index()
    filename = index.get(event_id)
    
    if not filename:
        return False
    
    # Delete the event file
    file_path = os.path.join(get_events_path(), filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        return False
    
    # Remove from ID index
    del index[event_id]
    save_index(index)
    
    # Remove from date index
    remove_from_date_index(event_id)
    
    return True

def load_events_in_window(center_date: datetime, weeks_before: int = 2, 
                          weeks_after: int = 2) -> List[Dict[str, Any]]:
    """
    Load events within a specific time window.
    
    Args:
        center_date: Center date of the window
        weeks_before: Number of weeks to load before center date
        weeks_after: Number of weeks to load after center date
    
    Returns:
        List of event dictionaries
    """
    ensure_storage_structure()
    
    # Calculate date range
    start_date = center_date - timedelta(weeks=weeks_before)
    end_date = center_date + timedelta(weeks=weeks_after)
    
    # Get event IDs in range
    event_ids = get_event_ids_in_range(start_date, end_date)
    
    # Load all events
    events = []
    for event_id in event_ids:
        event = load_event(event_id)
        if event:
            events.append(event)
    
    return events

def load_all_event_ids() -> List[str]:
    """Load all event IDs from the index."""
    index = load_index()
    return list(index.keys())

def load_all_events() -> List[Dict[str, Any]]:
    """Load all events (use with caution, can be slow with many events)."""
    event_ids = load_all_event_ids()
    events = []
    
    for event_id in event_ids:
        event = load_event(event_id)
        if event:
            events.append(event)
    
    return events

def migrate_from_single_file(old_events_file: str):
    """
    Migrate from old single-file format to new multi-file format.
    
    Args:
        old_events_file: Path to the old events.json file
    """
    if not os.path.exists(old_events_file):
        return
    
    print(f"Migrating events from {old_events_file}...")
    
    # Read old events file
    old_events = read_json(old_events_file)
    if not old_events:
        return
    
    # Save each event to new format
    for event in old_events:
        save_event(event)
    
    # Rename old file to backup
    backup_file = old_events_file + '.backup'
    try:
        os.rename(old_events_file, backup_file)
        print(f"Migrated {len(old_events)} events. Old file backed up to {backup_file}")
    except OSError:
        print(f"Migration complete but couldn't rename old file.")

