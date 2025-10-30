/**
 * Main event management coordinator
 */

class EventManager {
    constructor() {
        this.events = [];
        
        // Initialize sub-managers and make them globally accessible
        window.eventCRUD = eventCRUD = new EventCRUD();
        window.eventRenderer = eventRenderer = new EventRenderer();
        window.eventDetails = eventDetails = new EventDetails();
    }

    /**
     * Load events from the API for a specific date range
     * @param {Date} centerDate - Center date of the window (default: today)
     * @param {number} weeksBefore - Weeks before center (default: 2)
     * @param {number} weeksAfter - Weeks after center (default: 2)
     */
    async loadEvents(centerDate = null, weeksBefore = 2, weeksAfter = 2) {
        try {
            // Use today if no center date provided
            const center = centerDate || new Date();
            
            // Build query parameters
            const params = new URLSearchParams({
                center_date: center.toISOString(),
                weeks_before: weeksBefore.toString(),
                weeks_after: weeksAfter.toString()
            });
            
            this.events = await apiRequest(`/events?${params.toString()}`);
            this.renderAllEvents();
        } catch (error) {
            console.error('Failed to load events:', error);
            alert('Failed to load events');
        }
    }

    /**
     * Reload events based on current calendar position
     */
    async reloadEventsForCurrentView() {
        if (calendar && calendar.currentStartDate) {
            // Calculate center of current view (middle of visible days)
            const centerDate = new Date(calendar.currentStartDate);
            centerDate.setDate(centerDate.getDate() + Math.floor(calendar.visibleDays / 2));
            
            await this.loadEvents(centerDate, calendar.preloadWeeks, calendar.preloadWeeks);
        } else {
            await this.loadEvents();
        }
        
        // Also refresh left sidebar if it exists
        if (window.leftSidebar) {
            await leftSidebar.refresh();
        }
    }

    /**
     * Load events for a specific date range (used for infinite scroll)
     * @param {Date} centerDate - Center date of the range
     * @param {number} weeksBefore - Weeks before center
     * @param {number} weeksAfter - Weeks after center
     */
    async loadEventsForDateRange(centerDate, weeksBefore, weeksAfter) {
        try {
            // Build query parameters
            const params = new URLSearchParams({
                center_date: centerDate.toISOString(),
                weeks_before: weeksBefore.toString(),
                weeks_after: weeksAfter.toString()
            });
            
            const newEvents = await apiRequest(`/events?${params.toString()}`);
            
            // Merge new events with existing ones (avoid duplicates)
            const existingIds = new Set(this.events.map(e => e.id));
            newEvents.forEach(event => {
                if (!existingIds.has(event.id)) {
                    this.events.push(event);
                }
            });
        } catch (error) {
            console.error('Failed to load events for date range:', error);
        }
    }

    /**
     * Render all events on the calendar
     */
    renderAllEvents() {
        eventRenderer.renderAllEvents(this.events);
    }

    /**
     * Get event by ID
     * @param {string} eventId - Event ID
     * @returns {object|null} Event object or null
     */
    getEventById(eventId) {
        return this.events.find(e => e.id === eventId) || null;
    }
}

// Global event manager instance (declared in main.js)
