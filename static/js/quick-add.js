/**
 * Quick add functionality - double-click to add events
 */

class QuickAdd {
    constructor() {
        console.log('QuickAdd: Constructor called');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for double-click detection
     */
    setupEventListeners() {
        // Wait for calendar to be ready
        const waitForCalendar = setInterval(() => {
            if (window.calendar && calendar.daysGrid) {
                clearInterval(waitForCalendar);
                console.log('QuickAdd: Calendar ready, attaching listeners');
                this.attachListeners();
            }
        }, 100);
    }

    /**
     * Attach listeners to day columns
     */
    attachListeners() {
        const daysGrid = calendar.daysGrid;
        
        console.log('QuickAdd: Attaching double-click listener to daysGrid');
        
        if (!daysGrid) {
            console.error('QuickAdd: daysGrid not found!');
            return;
        }
        
        // Use event delegation for double-click
        daysGrid.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(e);
        });
        
        console.log('QuickAdd: Double-click listener attached successfully');
    }

    /**
     * Handle double-click on calendar
     * @param {MouseEvent} e - Mouse event
     */
    handleDoubleClick(e) {
        console.log('QuickAdd: Double-click detected');
        
        // Don't trigger if clicking on an event
        if (e.target.closest('.event')) {
            console.log('QuickAdd: Clicked on event, ignoring');
            return;
        }

        const dayColumn = e.target.closest('.day-column');
        if (!dayColumn) {
            console.log('QuickAdd: Not in a day column');
            return;
        }

        const dayColumnInner = dayColumn.querySelector('.day-column-inner');
        if (!dayColumnInner) {
            console.log('QuickAdd: No day column inner found');
            return;
        }

        // Calculate position within the day column
        const rect = dayColumnInner.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Snap to 15-minute intervals
        const snappedY = Math.round(y / 15) * 15;
        
        // Calculate time from position
        const totalMinutes = Math.round(snappedY);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        // Ensure within valid range
        if (hours < 0 || hours >= 24) {
            console.log('QuickAdd: Time out of range');
            return;
        }

        // Get the date from the column
        const dateStr = calendar.getDateFromColumn(dayColumn);
        
        // Parse date in LOCAL time, not UTC
        const parts = dateStr.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        
        console.log('QuickAdd: Creating event for', dateStr, `${hours}:${minutes}`);
        
        // Set start time
        const startDate = new Date(date);
        startDate.setHours(hours, minutes, 0, 0);
        
        // Set end time (1 hour later by default)
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
        
        // Open modal with pre-filled times
        if (window.eventCRUD) {
            eventCRUD.openAddModalWithTime(startDate, endDate);
        } else {
            console.error('QuickAdd: eventCRUD not available');
        }
    }
}

// Global quick add instance (declared in main.js)
