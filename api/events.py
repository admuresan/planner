"""API endpoints for event management."""
from flask import Blueprint, jsonify, request, current_app
from models.event import Event, Note
from api import event_storage
from datetime import datetime

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['GET'])
def get_events():
    """
    Get events, optionally filtered by date range.
    
    Query parameters:
        center_date: ISO date string for center of window (default: today)
        weeks_before: Number of weeks before center (default: 2)
        weeks_after: Number of weeks after center (default: 2)
    """
    # Get query parameters
    center_date_str = request.args.get('center_date')
    weeks_before = int(request.args.get('weeks_before', 2))
    weeks_after = int(request.args.get('weeks_after', 2))
    
    # Parse center date or use today
    if center_date_str:
        try:
            center_date = datetime.fromisoformat(center_date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            center_date = datetime.now()
    else:
        center_date = datetime.now()
    
    # Load events in window
    events_data = event_storage.load_events_in_window(
        center_date, 
        weeks_before=weeks_before,
        weeks_after=weeks_after
    )
    
    return jsonify(events_data), 200

@events_bp.route('/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get a specific event by ID."""
    event = event_storage.load_event(event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    return jsonify(event), 200

@events_bp.route('', methods=['POST'])
def create_event():
    """Create a new event."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    event = Event(
        name=data.get('name', ''),
        start_time=data.get('start_time', ''),
        end_time=data.get('end_time', ''),
        category_id=data.get('category_id'),
        notes=[Note.from_dict(n) for n in data.get('notes', [])],
        level=data.get('level', 1)
    )
    
    is_valid, error_msg = event.validate()
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Save event to individual file
    if not event_storage.save_event(event.to_dict()):
        return jsonify({'error': 'Failed to save event'}), 500
    
    return jsonify(event.to_dict()), 201

@events_bp.route('/<event_id>', methods=['PUT'])
def update_event(event_id):
    """Update an existing event."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    existing = event_storage.load_event(event_id)
    
    if not existing:
        return jsonify({'error': 'Event not found'}), 404
    
    event = Event(
        name=data.get('name', existing['name']),
        start_time=data.get('start_time', existing['start_time']),
        end_time=data.get('end_time', existing['end_time']),
        category_id=data.get('category_id', existing.get('category_id')),
        notes=[Note.from_dict(n) for n in data.get('notes', existing.get('notes', []))],
        event_id=event_id,
        level=data.get('level', existing.get('level', 1))
    )
    
    is_valid, error_msg = event.validate()
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Save updated event (will update indexes if dates changed)
    if not event_storage.save_event(event.to_dict()):
        return jsonify({'error': 'Failed to update event'}), 500
    
    return jsonify(event.to_dict()), 200

@events_bp.route('/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event."""
    if not event_storage.load_event(event_id):
        return jsonify({'error': 'Event not found'}), 404
    
    if not event_storage.delete_event(event_id):
        return jsonify({'error': 'Failed to delete event'}), 500
    
    return jsonify({'message': 'Event deleted'}), 200

@events_bp.route('/<event_id>/notes/<note_id>', methods=['PATCH'])
def update_note_status(event_id, note_id):
    """Update the completion status of a note (for todos)."""
    data = request.get_json()
    
    if not data or 'completed' not in data:
        return jsonify({'error': 'No completion status provided'}), 400
    
    event_data = event_storage.load_event(event_id)
    
    if not event_data:
        return jsonify({'error': 'Event not found'}), 404
    
    # Find and update the note
    note_found = False
    for note in event_data.get('notes', []):
        if note.get('id') == note_id:
            note['completed'] = data['completed']
            note_found = True
            break
    
    if not note_found:
        return jsonify({'error': 'Note not found'}), 404
    
    # Save updated event
    if not event_storage.save_event(event_data):
        return jsonify({'error': 'Failed to update note'}), 500
    
    return jsonify(event_data), 200

# Migration endpoint (can be removed after first use)
@events_bp.route('/migrate', methods=['POST'])
def migrate_events():
    """Migrate events from old single-file format to new multi-file format."""
    old_file = request.json.get('old_file') if request.json else None
    
    if not old_file:
        # Try default location
        import os
        old_file = os.path.join(current_app.config['STORAGE_PATH'], 'events.json')
    
    try:
        event_storage.migrate_from_single_file(old_file)
        return jsonify({'message': 'Migration completed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
