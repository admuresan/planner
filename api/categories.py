"""API endpoints for category management."""
from flask import Blueprint, jsonify, request, current_app
from models.category import Category
from api.storage import (read_json_file, write_json_file, 
                         find_by_id, remove_by_id, update_by_id)

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
def get_categories():
    """Get all categories."""
    categories_data = read_json_file(current_app.config['CATEGORIES_FILE'])
    return jsonify(categories_data), 200

@categories_bp.route('/<category_id>', methods=['GET'])
def get_category(category_id):
    """Get a specific category by ID."""
    categories_data = read_json_file(current_app.config['CATEGORIES_FILE'])
    category = find_by_id(categories_data, category_id)
    
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(category), 200

@categories_bp.route('', methods=['POST'])
def create_category():
    """Create a new category."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    category = Category(
        name=data.get('name', ''),
        color=data.get('color', '#CCCCCC')
    )
    
    is_valid, error_msg = category.validate()
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    categories_data = read_json_file(current_app.config['CATEGORIES_FILE'])
    categories_data.append(category.to_dict())
    
    if not write_json_file(current_app.config['CATEGORIES_FILE'], categories_data):
        return jsonify({'error': 'Failed to save category'}), 500
    
    return jsonify(category.to_dict()), 201

@categories_bp.route('/<category_id>', methods=['PUT'])
def update_category(category_id):
    """Update an existing category."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    categories_data = read_json_file(current_app.config['CATEGORIES_FILE'])
    existing = find_by_id(categories_data, category_id)
    
    if not existing:
        return jsonify({'error': 'Category not found'}), 404
    
    category = Category(
        name=data.get('name', existing['name']),
        color=data.get('color', existing['color']),
        category_id=category_id
    )
    
    is_valid, error_msg = category.validate()
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    categories_data = update_by_id(categories_data, category_id, category.to_dict())
    
    if not write_json_file(current_app.config['CATEGORIES_FILE'], categories_data):
        return jsonify({'error': 'Failed to update category'}), 500
    
    return jsonify(category.to_dict()), 200

@categories_bp.route('/<category_id>', methods=['DELETE'])
def delete_category(category_id):
    """Delete a category."""
    categories_data = read_json_file(current_app.config['CATEGORIES_FILE'])
    
    if not find_by_id(categories_data, category_id):
        return jsonify({'error': 'Category not found'}), 404
    
    categories_data = remove_by_id(categories_data, category_id)
    
    if not write_json_file(current_app.config['CATEGORIES_FILE'], categories_data):
        return jsonify({'error': 'Failed to delete category'}), 500
    
    return jsonify({'message': 'Category deleted'}), 200

