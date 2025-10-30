"""Configuration for the Planner application."""
import os

class Config:
    """Application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = True
    
    # Storage configuration
    STORAGE_PATH = os.path.join(os.path.dirname(__file__), 'data')
    EVENTS_PATH = os.path.join(STORAGE_PATH, 'events')
    EVENTS_INDEX_FILE = 'events_index.json'
    EVENTS_DATE_INDEX_FILE = 'events_date_index.json'
    CATEGORIES_FILE = 'categories.json'
    
    # Time configuration
    HOURS_IN_DAY = 24
    MINUTES_IN_HOUR = 60
    
    # Calendar configuration
    DEFAULT_DAYS_VISIBLE = 7
    PRELOAD_WEEKS = 2

