"""Storage utilities for persisting data to JSON files."""
import json
import os
from typing import List, Dict, Any, Optional
from flask import current_app

def get_file_path(filename: str) -> str:
    """Get the full path for a storage file.
    
    Args:
        filename: The name of the file
        
    Returns:
        Full path to the file
    """
    return os.path.join(current_app.config['STORAGE_PATH'], filename)

def read_json_file(filename: str) -> List[Dict[str, Any]]:
    """Read data from a JSON file.
    
    Args:
        filename: The name of the file to read
        
    Returns:
        List of dictionaries from the file, empty list if file doesn't exist
    """
    file_path = get_file_path(filename)
    
    if not os.path.exists(file_path):
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def write_json_file(filename: str, data: List[Dict[str, Any]]) -> bool:
    """Write data to a JSON file.
    
    Args:
        filename: The name of the file to write
        data: List of dictionaries to write
        
    Returns:
        True if successful, False otherwise
    """
    file_path = get_file_path(filename)
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

def find_by_id(data: List[Dict[str, Any]], item_id: str) -> Optional[Dict[str, Any]]:
    """Find an item by ID in a list of dictionaries.
    
    Args:
        data: List of dictionaries to search
        item_id: The ID to search for
        
    Returns:
        The matching dictionary or None
    """
    return next((item for item in data if item.get('id') == item_id), None)

def remove_by_id(data: List[Dict[str, Any]], item_id: str) -> List[Dict[str, Any]]:
    """Remove an item by ID from a list of dictionaries.
    
    Args:
        data: List of dictionaries
        item_id: The ID to remove
        
    Returns:
        New list with the item removed
    """
    return [item for item in data if item.get('id') != item_id]

def update_by_id(data: List[Dict[str, Any]], item_id: str, 
                updated_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Update an item by ID in a list of dictionaries.
    
    Args:
        data: List of dictionaries
        item_id: The ID to update
        updated_data: The new data
        
    Returns:
        New list with the item updated
    """
    return [updated_data if item.get('id') == item_id else item for item in data]

