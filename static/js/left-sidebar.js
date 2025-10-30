/**
 * Left sidebar with upcoming events and to-dos
 */

class LeftSidebar {
    constructor() {
        this.upcomingLimit = 10;
        this.upcomingDaysLimit = 7;
    }

    /**
     * Initialize and render the sidebar
     */
    async initialize() {
        console.log('LeftSidebar: Initializing...');
        await this.refresh();
    }

    /**
     * Refresh the entire sidebar content
     */
    async refresh() {
        await this.renderUpcomingEvents();
        await this.renderTodos();
    }

    /**
     * Render upcoming events section
     */
    async renderUpcomingEvents() {
        const container = document.getElementById('left-sidebar-upcoming');
        if (!container) return;

        container.innerHTML = '<div class="left-sidebar-loading">Loading...</div>';

        try {
            // Get upcoming events (not limited by current view)
            const now = new Date();
            const oneWeekFromNow = new Date(now);
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + this.upcomingDaysLimit);

            // Request events from today forward
            const centerDate = formatDateToInput(now);
            const response = await apiRequest(`/events?center_date=${centerDate}&weeks_before=0&weeks_after=4`);
            
            // Filter for upcoming events only
            const upcomingEvents = response
                .filter(event => {
                    const startDate = parseISODate(event.start_time);
                    return startDate >= now;
                })
                .sort((a, b) => {
                    return parseISODate(a.start_time) - parseISODate(b.start_time);
                });

            // Get either next 10 events or events within next week, whichever is fewer
            const eventsInWeek = upcomingEvents.filter(event => {
                const startDate = parseISODate(event.start_time);
                return startDate <= oneWeekFromNow;
            });

            const displayEvents = eventsInWeek.length >= this.upcomingLimit
                ? upcomingEvents.slice(0, this.upcomingLimit)
                : (upcomingEvents.length < this.upcomingLimit
                    ? upcomingEvents.slice(0, this.upcomingLimit)
                    : eventsInWeek);

            // Render events
            container.innerHTML = '';

            if (displayEvents.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'left-sidebar-empty';
                emptyMsg.textContent = 'No upcoming events';
                container.appendChild(emptyMsg);
                return;
            }

            displayEvents.forEach(event => {
                const eventEl = this.createUpcomingEventElement(event);
                container.appendChild(eventEl);
            });

        } catch (error) {
            console.error('Failed to load upcoming events:', error);
            container.innerHTML = '<div class="left-sidebar-error">Failed to load events</div>';
        }
    }

    /**
     * Create an upcoming event element
     * @param {Object} event - Event data
     * @returns {Element} Event element
     */
    createUpcomingEventElement(event) {
        const eventEl = document.createElement('div');
        eventEl.className = 'left-sidebar-event';
        
        // Add category color bar
        if (event.category_id) {
            const category = categoryManager.getCategoryById(event.category_id);
            if (category) {
                eventEl.style.borderLeftColor = category.color;
            }
        }

        const startDate = parseISODate(event.start_time);
        const endDate = parseISODate(event.end_time);

        // Date and time
        const dateTimeEl = document.createElement('div');
        dateTimeEl.className = 'left-sidebar-event-datetime';
        dateTimeEl.textContent = `${getFormattedDate(startDate)} ${formatTimeToInput(startDate)}`;
        eventEl.appendChild(dateTimeEl);

        // Event name
        const nameEl = document.createElement('div');
        nameEl.className = 'left-sidebar-event-name';
        nameEl.textContent = event.name;
        eventEl.appendChild(nameEl);

        // Duration
        const duration = calculateDuration(startDate, endDate);
        const durationEl = document.createElement('div');
        durationEl.className = 'left-sidebar-event-duration';
        durationEl.textContent = formatDuration(duration);
        eventEl.appendChild(durationEl);

        // Click to show details
        eventEl.addEventListener('click', async () => {
            // Show event details first
            eventDetails.showEventDetails(event.id);
            // Then scroll to center the event in the calendar
            await this.scrollToEvent(event);
            // Re-show event details after scrolling in case the view was regenerated
            eventDetails.showEventDetails(event.id);
        });

        return eventEl;
    }

    /**
     * Scroll to an event in the calendar (centered both horizontally and vertically)
     * @param {Object} event - Event data
     */
    async scrollToEvent(event) {
        if (calendar && calendar.scrollToEvent) {
            // Use the new scrollToEvent method which centers both date and time
            await calendar.scrollToEvent(event);
        }
    }

    /**
     * Render to-dos section
     */
    async renderTodos() {
        const container = document.getElementById('left-sidebar-todos');
        if (!container) return;

        container.innerHTML = '<div class="left-sidebar-loading">Loading...</div>';

        try {
            // Get all events with to-dos (not limited by view)
            const now = new Date();
            const centerDate = formatDateToInput(now);
            const response = await apiRequest(`/events?center_date=${centerDate}&weeks_before=2&weeks_after=8`);

            // Filter events that have to-do items and are upcoming or ongoing
            const eventsWithTodos = response
                .filter(event => {
                    if (!event.notes || event.notes.length === 0) return false;
                    const hasTodos = event.notes.some(note => note.type === 'todo');
                    if (!hasTodos) return false;
                    
                    // Include if event hasn't ended yet
                    const endDate = parseISODate(event.end_time);
                    return endDate >= now;
                })
                .sort((a, b) => {
                    return parseISODate(a.start_time) - parseISODate(b.start_time);
                });

            // Group by date
            const todosByDate = this.groupTodosByDate(eventsWithTodos);

            // Render
            container.innerHTML = '';

            if (Object.keys(todosByDate).length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'left-sidebar-empty';
                emptyMsg.textContent = 'No to-do items';
                container.appendChild(emptyMsg);
                return;
            }

            // Render each date group
            Object.keys(todosByDate).sort().forEach(dateStr => {
                const dateGroup = this.createTodoDateGroup(dateStr, todosByDate[dateStr]);
                container.appendChild(dateGroup);
            });

        } catch (error) {
            console.error('Failed to load to-dos:', error);
            container.innerHTML = '<div class="left-sidebar-error">Failed to load to-dos</div>';
        }
    }

    /**
     * Group events with to-dos by date
     * @param {Array} events - Events with to-dos
     * @returns {Object} Events grouped by date string
     */
    groupTodosByDate(events) {
        const grouped = {};

        events.forEach(event => {
            const startDate = parseISODate(event.start_time);
            const dateStr = formatDateToInput(startDate);

            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }

            grouped[dateStr].push(event);
        });

        return grouped;
    }

    /**
     * Create a date group for to-dos
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @param {Array} events - Events for this date
     * @returns {Element} Date group element
     */
    createTodoDateGroup(dateStr, events) {
        const groupEl = document.createElement('div');
        groupEl.className = 'left-sidebar-todo-date-group';

        // Date header
        const dateHeaderEl = document.createElement('div');
        dateHeaderEl.className = 'left-sidebar-todo-date-header';
        const date = new Date(dateStr + 'T00:00:00');
        dateHeaderEl.textContent = getFormattedDate(date);
        groupEl.appendChild(dateHeaderEl);

        // Events for this date
        events.forEach(event => {
            const eventGroup = this.createTodoEventGroup(event);
            groupEl.appendChild(eventGroup);
        });

        return groupEl;
    }

    /**
     * Create an event group for to-dos
     * @param {Object} event - Event data
     * @returns {Element} Event group element
     */
    createTodoEventGroup(event) {
        const groupEl = document.createElement('div');
        groupEl.className = 'left-sidebar-todo-event-group';

        // Event name header
        const eventHeaderEl = document.createElement('div');
        eventHeaderEl.className = 'left-sidebar-todo-event-header';
        eventHeaderEl.textContent = event.name;
        
        // Add category color
        if (event.category_id) {
            const category = categoryManager.getCategoryById(event.category_id);
            if (category) {
                eventHeaderEl.style.borderLeftColor = category.color;
            }
        }
        
        groupEl.appendChild(eventHeaderEl);

        // To-do items
        const todos = event.notes.filter(note => note.type === 'todo');
        todos.forEach(todo => {
            const todoEl = this.createTodoItem(todo, event.id);
            groupEl.appendChild(todoEl);
        });

        return groupEl;
    }

    /**
     * Create a to-do item element
     * @param {Object} todo - To-do note object
     * @param {string} eventId - Event ID
     * @returns {Element} To-do element
     */
    createTodoItem(todo, eventId) {
        const todoEl = document.createElement('div');
        todoEl.className = 'left-sidebar-todo-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'left-sidebar-todo-checkbox';
        checkbox.checked = todo.completed || false;
        checkbox.addEventListener('change', async (e) => {
            e.stopPropagation();
            await this.toggleTodoStatus(eventId, todo.id, e.target.checked);
        });

        const label = document.createElement('label');
        label.className = 'left-sidebar-todo-label';
        label.textContent = todo.content;
        if (todo.completed) {
            label.classList.add('completed');
        }

        todoEl.appendChild(checkbox);
        todoEl.appendChild(label);

        // Click to open event details
        label.addEventListener('click', () => {
            eventDetails.showEventDetails(eventId);
        });

        return todoEl;
    }

    /**
     * Toggle to-do status
     * @param {string} eventId - Event ID
     * @param {string} todoId - To-do ID
     * @param {boolean} completed - Completion status
     */
    async toggleTodoStatus(eventId, todoId, completed) {
        try {
            await eventCRUD.updateNoteStatus(eventId, todoId, completed);
            // Refresh to-dos section
            await this.renderTodos();
            // Also refresh the main calendar if needed
            await eventManager.reloadEventsForCurrentView();
        } catch (error) {
            console.error('Failed to update to-do status:', error);
        }
    }
}

// Global instance (will be created in main.js)

