/**
 * Event rendering on the calendar
 */

class EventRenderer {
    /**
     * Render all events on the calendar
     * @param {Array} events - Array of event objects
     */
    renderAllEvents(events) {
        // Clear existing events
        document.querySelectorAll('.event').forEach(el => el.remove());

        // Ensure all events have a level (default to 1)
        events.forEach(event => {
            if (!event.level) {
                event.level = 1;
            }
        });

        // Render events sorted by level (lower levels first, so higher levels appear on top)
        const sortedEvents = [...events].sort((a, b) => a.level - b.level);
        sortedEvents.forEach(event => {
            this.renderEvent(event);
        });
        
        // After all events are rendered, calculate overlaps for each column
        this.calculateOverlapsForAllColumns();
    }
    
    /**
     * Calculate overlaps for all visible columns
     */
    calculateOverlapsForAllColumns() {
        const columns = calendar.getVisibleColumns();
        columns.forEach(column => {
            this.calculateOverlapsForColumn(column);
        });
    }
    
    /**
     * Calculate overlaps and position events within a column
     * @param {Element} column - Day column element
     */
    calculateOverlapsForColumn(column) {
        const events = Array.from(column.querySelectorAll('.event'));
        if (events.length <= 1) return;
        
        // Get time ranges and level for each event
        const eventData = events.map(el => ({
            element: el,
            top: parseFloat(el.style.top),
            bottom: parseFloat(el.style.top) + parseFloat(el.style.height),
            level: parseInt(el.dataset.level) || 1
        }));
        
        // Group events by level first
        const eventsByLevel = {};
        eventData.forEach(event => {
            if (!eventsByLevel[event.level]) {
                eventsByLevel[event.level] = [];
            }
            eventsByLevel[event.level].push(event);
        });
        
        // Find overlapping groups within each level
        Object.values(eventsByLevel).forEach(levelEvents => {
            const groups = [];
            levelEvents.forEach(event => {
                // Find which groups this event overlaps with (same level only)
                const overlappingGroups = groups.filter(group => 
                    group.some(e => this.eventsOverlap(event, e))
                );
                
                if (overlappingGroups.length === 0) {
                    // Create new group
                    groups.push([event]);
                } else if (overlappingGroups.length === 1) {
                    // Add to existing group
                    overlappingGroups[0].push(event);
                } else {
                    // Merge multiple groups and add this event
                    const mergedGroup = overlappingGroups.reduce((acc, g) => acc.concat(g), [event]);
                    overlappingGroups.forEach(g => {
                        const index = groups.indexOf(g);
                        groups.splice(index, 1);
                    });
                    groups.push(mergedGroup);
                }
            });
            
            // Position events within each group
            groups.forEach(group => {
                if (group.length > 1) {
                    this.positionOverlappingEvents(group);
                }
            });
        });
    }
    
    /**
     * Check if two events overlap in time
     * @param {Object} event1 - First event data
     * @param {Object} event2 - Second event data
     * @returns {boolean} True if events overlap
     */
    eventsOverlap(event1, event2) {
        return !(event1.bottom <= event2.top || event1.top >= event2.bottom);
    }
    
    /**
     * Position overlapping events side by side
     * @param {Array} group - Group of overlapping events
     */
    positionOverlappingEvents(group) {
        const count = Math.min(group.length, 3); // Max 3 side-by-side
        const width = 100 / count;
        
        if (group.length <= 3) {
            // Simple side-by-side for 1-3 events
            group.forEach((eventData, index) => {
                eventData.element.style.left = `${index * width}%`;
                eventData.element.style.right = `${(count - index - 1) * width}%`;
                eventData.element.style.width = 'auto';
            });
        } else {
            // More than 3: make column scrollable
            const columnInner = group[0].element.parentElement;
            columnInner.style.overflowX = 'auto';
            
            group.forEach((eventData, index) => {
                eventData.element.style.left = `${index * 33.33}%`;
                eventData.element.style.right = 'auto';
                eventData.element.style.width = '33.33%';
            });
        }
    }

    /**
     * Render a single event on the calendar
     * @param {object} event - Event object
     */
    renderEvent(event) {
        const startDate = parseISODate(event.start_time);
        const endDate = parseISODate(event.end_time);
        
        // Calculate which days this event spans
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        
        const eventEndDate = new Date(endDate);
        eventEndDate.setHours(0, 0, 0, 0);
        
        // Render event for each day it spans
        while (currentDate <= eventEndDate) {
            const column = calendar.getColumnForDate(currentDate);
            
            if (column) {
                // Determine start and end times for this day
                const dayStart = isSameDay(currentDate, startDate) ? startDate : new Date(currentDate);
                const dayEnd = isSameDay(currentDate, endDate) ? endDate : new Date(currentDate);
                
                if (!isSameDay(currentDate, startDate)) {
                    dayStart.setHours(0, 0, 0, 0);
                }
                
                if (!isSameDay(currentDate, endDate)) {
                    dayEnd.setHours(23, 59, 59, 999);
                }
                
                this.renderEventSegment(event, column, dayStart, dayEnd);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    /**
     * Render an event segment for a specific day
     * @param {object} event - Event object
     * @param {Element} column - Day column element
     * @param {Date} segmentStart - Start time for this segment
     * @param {Date} segmentEnd - End time for this segment
     */
    renderEventSegment(event, column, segmentStart, segmentEnd) {
        const eventEl = document.createElement('div');
        eventEl.className = 'event';
        eventEl.dataset.eventId = event.id;
        eventEl.dataset.start = event.start_time;
        eventEl.dataset.end = event.end_time;
        eventEl.dataset.level = event.level || 1;
        
        // Get category color
        const color = categoryManager.getCategoryColor(event.category_id);
        eventEl.style.backgroundColor = color;
        
        // Set z-index based on level (higher level = higher z-index = on top)
        const level = event.level || 1;
        eventEl.style.zIndex = 10 + level;
        
        // Calculate position and height
        const startY = calendar.calculateYPosition(segmentStart);
        const endY = calendar.calculateYPosition(segmentEnd);
        const height = endY - startY;
        
        eventEl.style.top = `${startY}px`;
        eventEl.style.height = `${height}px`;
        
        // Calculate duration
        const duration = calculateDuration(parseISODate(event.start_time), parseISODate(event.end_time));
        
        // Create content
        const nameDiv = document.createElement('div');
        nameDiv.className = 'event-name';
        nameDiv.textContent = event.name;
        
        const durationDiv = document.createElement('div');
        durationDiv.className = 'event-duration';
        durationDiv.textContent = formatDuration(duration);
        
        eventEl.appendChild(nameDiv);
        eventEl.appendChild(durationDiv);
        
        // Add notes preview if there's enough space
        if (height > 60) {
            this.addNotesPreview(eventEl, event);
        }
        
        // Add resize handles
        const topHandle = document.createElement('div');
        topHandle.className = 'event-resize-handle top';
        
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'event-resize-handle bottom';
        
        eventEl.appendChild(topHandle);
        eventEl.appendChild(bottomHandle);
        
        // Note: Click to show details is now handled by DragManager
        // This allows us to differentiate between clicks and drags
        
        column.querySelector('.day-column-inner').appendChild(eventEl);
    }

    /**
     * Add notes preview to event element
     * @param {Element} eventEl - Event element
     * @param {object} event - Event object
     */
    addNotesPreview(eventEl, event) {
        if (!event.notes || event.notes.length === 0) {
            return;
        }
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'event-notes-preview';
        
        const regularNotes = event.notes.filter(n => n.type === 'note');
        const todoNotes = event.notes.filter(n => n.type === 'todo');
        
        if (regularNotes.length > 0) {
            const notesSection = document.createElement('div');
            notesSection.className = 'event-notes-section';
            
            const title = document.createElement('div');
            title.className = 'event-notes-title';
            title.textContent = 'Notes:';
            notesSection.appendChild(title);
            
            regularNotes.forEach(note => {
                const item = document.createElement('div');
                item.className = 'event-note-item';
                item.textContent = truncateText(stripHtml(note.content), 30);
                notesSection.appendChild(item);
            });
            
            previewDiv.appendChild(notesSection);
        }
        
        if (todoNotes.length > 0) {
            const todosSection = document.createElement('div');
            todosSection.className = 'event-notes-section';
            
            const title = document.createElement('div');
            title.className = 'event-notes-title';
            title.textContent = 'To-Do:';
            todosSection.appendChild(title);
            
            todoNotes.forEach(note => {
                const item = document.createElement('div');
                item.className = 'event-note-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'event-note-checkbox';
                checkbox.checked = note.completed || false;
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    eventCRUD.updateNoteStatus(event.id, note.id, e.target.checked);
                });
                
                item.appendChild(checkbox);
                item.appendChild(document.createTextNode(truncateText(stripHtml(note.content), 25)));
                todosSection.appendChild(item);
            });
            
            previewDiv.appendChild(todosSection);
        }
        
        eventEl.appendChild(previewDiv);
    }
}

// Global instance (created in events.js)

