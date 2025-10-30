# Quick Start Guide

## Installation & Running

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the application:**
```bash
python app.py
```

3. **Open your browser:**
Navigate to `http://localhost:6001`

The server will auto-reload when you make code changes (Flask debug mode).

## First Steps

1. **Create a Category** (optional but recommended):
   - Click "Manage Categories"
   - Click "+ Add Category"
   - Enter a name and choose a color
   - Click "Save Category"

2. **Create Your First Event**:
   - Click "+ Add Event"
   - Fill in the event name, start/end date/time
   - Optionally select a category
   - Add notes or to-do items if needed
   - Click "Save Event"

3. **Interact with Events**:
   - **Click** an event to view full details
   - **Drag** an event to move it
   - **Drag the top or bottom edge** to resize
   - **Click checkboxes** on to-do items to mark complete

4. **Navigate the Calendar**:
   - **Scroll horizontally** to see more days
   - **Infinite scroll**: More dates load automatically as you scroll
   - Events automatically loaded for newly visible dates
   - Use the **date picker** to jump to a specific date
   - The calendar remembers your position

## Features Overview

### Event Management
- Create, edit, delete events
- Drag and drop to reschedule
- Resize by dragging edges
- Multi-day events supported

### Categories
- Color-code your events
- Create unlimited categories
- Easy category management

### Notes System
- Add regular notes to events
- Create to-do items with checkboxes
- Track completion status

### Data Persistence
- All data saved automatically to JSON files
- Calendar position saved to browser localStorage
- Data persists across server restarts

## File Structure

```
planner/
├── app.py              # Main Flask application
├── config.py           # Configuration
├── requirements.txt    # Python dependencies
├── data/              # Auto-created data storage
│   ├── events/       # Individual event files
│   ├── events_index.json       # Event ID index
│   └── events_date_index.json  # Date-based index
├── models/            # Data models
├── api/               # REST API endpoints
├── templates/         # HTML template
└── static/
    ├── css/          # Modular stylesheets
    └── js/           # Modular JavaScript
```

## Modular Design

The codebase follows a modular architecture:

### Backend (Python)
- **models/**: Event and Category data models
- **api/**: REST API endpoints (events, categories, storage)
- **config.py**: Centralized configuration

### Frontend (JavaScript)
- **utils.js**: Common utility functions
- **calendar.js**: Calendar rendering and date management
- **event-crud.js**: Event creation, editing, deletion
- **event-renderer.js**: Event display on calendar
- **event-details.js**: Sidebar details view
- **categories.js**: Category management
- **drag.js**: Drag and drop functionality
- **modals.js**: Modal window management
- **main.js**: Application initialization

### Styling (CSS)
- **base.css**: Variables, resets, basic styles
- **components.css**: UI components (buttons, sidebar, etc.)
- **calendar.css**: Calendar-specific styles
- **modals.css**: Modal and form styles

## Tips

- Events can span multiple days
- The calendar preloads 2 weeks in each direction for smooth scrolling
- Use categories to visually organize different types of events
- To-do items can be checked off directly from the calendar or sidebar
- All changes are saved immediately

## Troubleshooting

**Port already in use?**
Edit `app.py` and change the port number in the last line.

**Data not persisting?**
Check that the `data/` directory exists and is writable.

**Styles not loading?**
Clear your browser cache and refresh.

## Development

The application uses Flask's debug mode, so:
- Python changes reload automatically
- JavaScript/CSS changes require a browser refresh
- Check the browser console for JavaScript errors
- Check the terminal for Python errors

Enjoy your new day planner! 📅

