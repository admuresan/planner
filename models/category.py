"""Category model for organizing events."""
from typing import Dict, Any
import uuid

class Category:
    """Represents an event category."""
    
    def __init__(self, name: str, color: str, category_id: str = None):
        """Initialize a category.
        
        Args:
            name: The category name
            color: The color hex code (e.g., '#FF5733')
            category_id: Optional ID, will be generated if not provided
        """
        self.id = category_id or str(uuid.uuid4())
        self.name = name
        self.color = color
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert category to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Category':
        """Create category from dictionary."""
        return cls(
            name=data['name'],
            color=data['color'],
            category_id=data.get('id')
        )
    
    def validate(self) -> tuple[bool, str]:
        """Validate category data.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not self.name or not self.name.strip():
            return False, "Category name is required"
        
        if not self.color or not self.color.startswith('#'):
            return False, "Category color must be a valid hex code"
        
        return True, ""

