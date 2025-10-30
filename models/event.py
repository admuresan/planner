"""Event model for calendar events."""
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime

class Note:
    """Represents a note attached to an event."""
    
    def __init__(self, content: str, note_type: str, note_id: str = None, completed: bool = False):
        """Initialize a note.
        
        Args:
            content: The note content (can include HTML)
            note_type: Either 'note' or 'todo'
            note_id: Optional ID, will be generated if not provided
            completed: Whether the todo item is completed (only for todos)
        """
        self.id = note_id or str(uuid.uuid4())
        self.content = content
        self.type = note_type
        self.completed = completed if note_type == 'todo' else False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert note to dictionary."""
        return {
            'id': self.id,
            'content': self.content,
            'type': self.type,
            'completed': self.completed
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Note':
        """Create note from dictionary."""
        return cls(
            content=data['content'],
            note_type=data['type'],
            note_id=data.get('id'),
            completed=data.get('completed', False)
        )

class Event:
    """Represents a calendar event."""
    
    def __init__(self, name: str, start_time: str, end_time: str, 
                 category_id: Optional[str] = None, notes: List[Note] = None,
                 event_id: str = None, level: int = 1):
        """Initialize an event.
        
        Args:
            name: The event name
            start_time: ISO format datetime string
            end_time: ISO format datetime string
            category_id: Optional category ID
            notes: List of Note objects
            event_id: Optional ID, will be generated if not provided
            level: Layer level for z-index positioning (default: 1)
        """
        self.id = event_id or str(uuid.uuid4())
        self.name = name
        self.start_time = start_time
        self.end_time = end_time
        self.category_id = category_id
        self.notes = notes or []
        self.level = level if level is not None else 1
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'category_id': self.category_id,
            'notes': [note.to_dict() for note in self.notes],
            'level': self.level
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Event':
        """Create event from dictionary."""
        notes = [Note.from_dict(note_data) for note_data in data.get('notes', [])]
        return cls(
            name=data['name'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            category_id=data.get('category_id'),
            notes=notes,
            event_id=data.get('id'),
            level=data.get('level', 1)
        )
    
    def validate(self) -> tuple[bool, str]:
        """Validate event data.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not self.name or not self.name.strip():
            return False, "Event name is required"
        
        if not self.start_time:
            return False, "Start time is required"
        
        if not self.end_time:
            return False, "End time is required"
        
        try:
            start = datetime.fromisoformat(self.start_time.replace('Z', '+00:00'))
            end = datetime.fromisoformat(self.end_time.replace('Z', '+00:00'))
            
            if end <= start:
                return False, "End time must be after start time"
        except (ValueError, AttributeError):
            return False, "Invalid datetime format"
        
        return True, ""

