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
   - Click **"Manage Categories"**
   - Click **"+ Add Category"**
   - Enter a name and choose a color
   - Click **"Save Category"**

2. **Create Your First Event**:
   - **Quick way**: Hover over an empty time slot until a green + appears, then click it
   - **Traditional way**: Click **"+ Add Event"** in the top bar
   - Fill in the event name, start/end date/time
   - Optionally select a category
   - Add notes or to-do items if needed
   - Click **"Save Event"**

3. **Interact with Events**:
   - **Click** an event to view full details
   - **Drag** an event to move it
   - **Drag the top or bottom edge** to resize
   - **Click checkboxes** on to-do items to mark complete

4. **Navigate the Calendar**:
   - **Scroll horizontally** to see more days
   - **Infinite scroll**: More dates load automatically as you scroll
   - Use the **date picker** to jump to a specific date
   - The calendar remembers your position

## Key Features

### Quick Add (New!)
- Hover over empty calendar space for 300ms
- Green plus icon appears
- Click to create event with time pre-filled
- Fastest way to add events!

### Infinite Scrolling
- Scroll left or right - dates load automatically
- Events appear as you scroll
- No manual "load more" needed
- Browse years of your calendar seamlessly

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

## Tips

- Events can span multiple days
- Use categories to visually organize events
- To-do items can be checked off directly from the calendar
- All changes are saved immediately
- The calendar preloads dates for smooth scrolling
- Hover over empty spaces for the quickest way to create events

## Troubleshooting

**Port already in use?**
Edit `app.py` and change the port number (default is 6001).

**Data not persisting?**
Check that the `data/` directory exists and is writable.

**Styles not loading?**
Clear your browser cache and refresh.

**Quick add icon not appearing?**
Make sure you're hovering over completely empty space (not over an event) for at least 300ms.

## Development

The application uses Flask's debug mode, so:
- Python changes reload automatically
- JavaScript/CSS changes require a browser refresh
- Check the browser console for JavaScript errors
- Check the terminal for Python errors

Enjoy your new day planner! 📅
