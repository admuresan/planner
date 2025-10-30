# Project Structure & File Organization

## ✅ All Files Under 500 Lines

The entire project follows the requirement that no file exceeds 500 lines for maintainability.

### File Line Counts (Largest First)

| File | Lines | Type |
|------|-------|------|
| `static/js/drag.js` | 325 | JavaScript |
| `static/js/calendar.js` | 262 | JavaScript |
| `static/css/components.css` | 261 | CSS |
| `static/js/utils.js` | 245 | JavaScript |
| `static/js/event-crud.js` | 239 | JavaScript |
| `static/js/categories.js` | 233 | JavaScript |
| `static/css/calendar.css` | 214 | CSS |
| `static/js/event-details.js` | 204 | JavaScript |
| `static/js/event-renderer.js` | 196 | JavaScript |
| `templates/index.html` | 191 | HTML |
| `static/css/modals.css` | 159 | CSS |
| `api/events.py` | 134 | Python |
| `static/js/main.js` | 121 | JavaScript |
| `models/event.py` | 114 | Python |
| `static/js/modals.js` | 97 | JavaScript |
| `api/categories.py` | 96 | Python |
| `api/storage.py` | 94 | Python |
| `static/css/base.css` | 61 | CSS |
| `models/category.py` | 50 | Python |
| `static/js/events.js` | 46 | JavaScript |
| `app.py` | 27 | Python |
| `config.py` | 21 | Python |
| `models/__init__.py` | 6 | Python |
| `api/__init__.py` | 2 | Python |

**Total Lines:** 3,398  
**Largest File:** 325 lines (drag.js)  
**✅ All files are under 500 lines**

## Directory Structure

```
planner/
├── app.py                      # Flask app entry point (27 lines)
├── config.py                   # Configuration (21 lines)
├── requirements.txt            # Python dependencies
├── README.md                   # Comprehensive documentation
├── QUICKSTART.md              # Quick start guide
├── PROJECT_STRUCTURE.md       # This file
├── .gitignore                 # Git ignore rules
│
├── data/                      # Data storage (auto-created)
│   ├── .gitkeep              # Ensures dir exists
│   ├── events.json           # Event data (auto-generated)
│   └── categories.json       # Category data (auto-generated)
│
├── models/                    # Data models (170 total lines)
│   ├── __init__.py           # Package init (6 lines)
│   ├── event.py              # Event & Note models (114 lines)
│   └── category.py           # Category model (50 lines)
│
├── api/                       # REST API endpoints (326 total lines)
│   ├── __init__.py           # Package init (2 lines)
│   ├── storage.py            # JSON storage utilities (94 lines)
│   ├── events.py             # Event CRUD endpoints (134 lines)
│   └── categories.py         # Category CRUD endpoints (96 lines)
│
├── templates/                 # HTML templates
│   └── index.html            # Main app page (191 lines)
│
└── static/                    # Static assets
    ├── css/                   # Stylesheets (695 total lines)
    │   ├── base.css          # Variables, resets (61 lines)
    │   ├── components.css    # UI components (261 lines)
    │   ├── calendar.css      # Calendar styles (214 lines)
    │   └── modals.css        # Modal & forms (159 lines)
    │
    └── js/                    # JavaScript modules (1,964 total lines)
        ├── utils.js          # Utility functions (245 lines)
        ├── modals.js         # Modal management (97 lines)
        ├── calendar.js       # Calendar rendering (262 lines)
        ├── categories.js     # Category management (233 lines)
        ├── event-crud.js     # Event CRUD operations (239 lines)
        ├── event-renderer.js # Event rendering (196 lines)
        ├── event-details.js  # Sidebar details (204 lines)
        ├── events.js         # Event coordinator (46 lines)
        ├── drag.js           # Drag & drop (325 lines)
        └── main.js           # App initialization (121 lines)
```

## Modular Design Principles

### Backend (Python - Flask)

**Separation of Concerns:**
- `app.py`: Entry point, minimal code
- `config.py`: All configuration in one place
- `models/`: Data structures and validation
- `api/`: REST endpoints separated by resource type
- `api/storage.py`: Shared storage utilities

**Benefits:**
- Easy to find code by functionality
- Each file has a single responsibility
- Utilities are reusable across endpoints

### Frontend (JavaScript)

**Module Organization:**
- `utils.js`: Shared utility functions
- `modals.js`: Generic modal behavior
- `calendar.js`: Calendar-specific logic
- `categories.js`: Category management
- `event-crud.js`: Event create/update/delete
- `event-renderer.js`: Event display logic
- `event-details.js`: Sidebar functionality
- `events.js`: Coordinator between event modules
- `drag.js`: Drag and drop interactions
- `main.js`: App initialization and coordination

**Benefits:**
- Clear separation between event operations
- Rendering logic separate from CRUD logic
- Easy to modify one aspect without affecting others

### Styling (CSS)

**CSS Organization:**
- `base.css`: Variables and resets
- `components.css`: Reusable UI components
- `calendar.css`: Calendar-specific styles
- `modals.css`: Modal and form styles

**Benefits:**
- Easy to find and modify specific styles
- Variables in one place for easy theming
- Component styles are self-contained

## Shared Utilities

Functions that are used across multiple files are centralized:

### Python Utilities (`api/storage.py`)
- `read_json_file()`: Read from JSON
- `write_json_file()`: Write to JSON
- `find_by_id()`: Find item by ID
- `remove_by_id()`: Remove item by ID
- `update_by_id()`: Update item by ID

### JavaScript Utilities (`static/js/utils.js`)
- `apiRequest()`: Make API calls
- `formatDateToISO()`: Date formatting
- `calculateDuration()`: Time calculations
- `truncateText()`: Text truncation
- `stripHtml()`: HTML cleaning
- And more...

## Import Order

JavaScript files are loaded in dependency order:

1. `utils.js` - Base utilities (no dependencies)
2. `modals.js` - Modal management (uses utils)
3. `categories.js` - Category management (uses utils, modals)
4. `calendar.js` - Calendar rendering (uses utils)
5. `event-crud.js` - Event CRUD (uses utils, modals)
6. `event-renderer.js` - Event rendering (uses utils, calendar, categories)
7. `event-details.js` - Sidebar (uses utils)
8. `events.js` - Event coordinator (uses all event modules)
9. `drag.js` - Drag and drop (uses utils, calendar, events)
10. `main.js` - App initialization (uses all modules)

## API Endpoints

### Events API (`/api/events`)
- `GET /api/events` - List all events
- `GET /api/events/<id>` - Get specific event
- `POST /api/events` - Create event
- `PUT /api/events/<id>` - Update event
- `DELETE /api/events/<id>` - Delete event
- `PATCH /api/events/<id>/notes/<note_id>` - Update note status

### Categories API (`/api/categories`)
- `GET /api/categories` - List all categories
- `GET /api/categories/<id>` - Get specific category
- `POST /api/categories` - Create category
- `PUT /api/categories/<id>` - Update category
- `DELETE /api/categories/<id>` - Delete category

## Data Storage

- **Format**: JSON files
- **Location**: `data/` directory
- **Files**: `events.json`, `categories.json`
- **Persistence**: Automatic on every change
- **Backup**: Files can be easily backed up/versioned

## Testing the Modular Structure

To verify the modular structure works:

1. **Test Backend Modules:**
```bash
python app.py
# Check that all API endpoints work
```

2. **Test Frontend Modules:**
- Open browser console
- Verify all JavaScript files load without errors
- Check that global instances are created:
  - `calendar`
  - `categoryManager`
  - `eventManager`
  - `eventCRUD`
  - `eventRenderer`
  - `eventDetails`
  - `dragManager`

3. **Test Functionality:**
- Create a category
- Create an event
- Drag the event
- Resize the event
- View event details
- Edit the event
- Delete the event

## Maintainability Features

✅ **No file over 500 lines**  
✅ **Clear file naming conventions**  
✅ **Single responsibility per file**  
✅ **Shared utilities in dedicated files**  
✅ **Comments explaining complex logic**  
✅ **Consistent code style**  
✅ **Modular CSS with variables**  
✅ **API follows REST conventions**  
✅ **Data models validate input**  

## Future Extensions

The modular structure makes it easy to add features:

- **New event types**: Add to `models/event.py`
- **New API endpoints**: Add new file in `api/`
- **New UI components**: Add to appropriate CSS file
- **New features**: Add new JavaScript module
- **Different storage**: Replace `api/storage.py`
- **Authentication**: Add new `api/auth.py`

This structure scales well for future development! 🚀

