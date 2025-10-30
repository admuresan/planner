# Day Planner Application

A comprehensive day planner web application built with Flask and vanilla JavaScript, featuring drag-and-drop events, categories, and local storage persistence.

## Features

- **Calendar View**: Week-based calendar with time slots from midnight to midnight
- **Event Management**: Create, edit, delete, and drag events across days
- **Event Resizing**: Drag top or bottom of events to change start/end times
- **Categories**: Color-coded categories for organizing events
- **Notes System**: Add regular notes and to-do items to events
- **Date Navigation**: Jump to specific dates and scroll through weeks
- **Persistence**: All data saved locally in JSON files
- **Responsive Design**: Clean UI with light green and blue color scheme

## Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

## Running the Application

Start the Flask development server:

```bash
python app.py
```

The application will be available at `http://localhost:6001`

The server runs in debug mode with auto-reload enabled, so any changes to Python files will automatically restart the server.

**Note**: If you have an existing `data/events.json` file from a previous version, it will be automatically migrated to the new multi-file storage format on first startup.

## Project Structure

```
planner/
├── app.py                  # Main Flask application entry point
├── config.py              # Application configuration
├── requirements.txt       # Python dependencies
├── data/                  # Data storage (created automatically)
│   ├── events.json       # Event data
│   └── categories.json   # Category data
├── models/               # Data models
│   ├── event.py         # Event and Note models
│   └── category.py      # Category model
├── api/                  # API endpoints
│   ├── events.py        # Event API routes
│   ├── categories.py    # Category API routes
│   └── storage.py       # JSON file storage utilities
├── templates/           # HTML templates
│   └── index.html      # Main application page
└── static/             # Static assets
    ├── css/
    │   └── style.css   # Application styles
    └── js/
        ├── main.js     # Application initialization
        ├── calendar.js # Calendar rendering
        ├── events.js   # Event management
        ├── categories.js # Category management
        ├── drag.js     # Drag and drop functionality
        ├── modals.js   # Modal management
        └── utils.js    # Utility functions
```

## Usage

### Creating Events

1. Click the **"+ Add Event"** button in the top bar
2. Fill in:
   - Event name (required)
   - Start date and time (required)
   - End date and time (required)
   - Category (optional)
   - Notes and to-do items (optional)
3. Click **"Save Event"**

### Managing Categories

1. Click **"Manage Categories"** in the top bar
2. Add, edit, or delete categories
3. Each category has a name and color
4. Events in a category display in that color

### Interacting with Events

- **Click** an event to view details in the sidebar
- **Drag** an event to move it to a different time/day
- **Drag top/bottom edges** to resize and change start/end times
- **Click checkboxes** on to-do items to mark them complete

### Navigation

- **Scroll horizontally** to see more days (infinite scroll enabled)
- **Automatic loading**: As you scroll, more days are loaded automatically
- **Always prepared**: System maintains 2+ weeks of events ahead of your view
- Use **"Jump to"** date picker to navigate to a specific date
- Calendar shows 7 days initially with seamless expansion in both directions

## Data Storage

- **Events**: Each event stored in its own file in `data/events/` directory
  - Indexed by ID and date for efficient querying
  - Only loads events within viewing window (current week ± 2 weeks)
  - Scales efficiently to thousands of events
- **Categories**: Stored in `data/categories.json`
- **Calendar position**: Saved to browser localStorage
- **Data persistence**: All data persists across server restarts
- **Performance**: Multi-file architecture prevents slowdown with large event databases

## Technical Details

- **Backend**: Python Flask with REST API
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS variables
- **Storage**: JSON file-based storage
- **Architecture**: Modular design with separate files for different functionalities

## Browser Compatibility

Works best in modern browsers (Chrome, Firefox, Safari, Edge) that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- HTML5 Date/Time inputs
- LocalStorage API

## Development

The application is designed to be modular and easy to extend:

- Each JavaScript module is self-contained with its own class
- API endpoints follow REST conventions
- CSS uses variables for easy theming
- No file exceeds 500 lines for maintainability

## License

This project is open source and available for personal or commercial use.

