/**
 * Drag and drop functionality for events
 */

class DragManager {
    constructor() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = null;
        this.draggedEvent = null;
        this.originalEvent = null;
        this.shadow = null;
        this.currentTargetColumn = null; // Track which column shadow is in
        this.startX = 0;
        this.startY = 0;
        this.startTop = 0;
        this.startHeight = 0;
        
        // Drag threshold to differentiate click from drag
        this.dragThreshold = 5; // pixels
        this.hasMoved = false;
        this.potentialDrag = false;
        this.potentialDragEvent = null;
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for drag and resize
     */
    setupEventListeners() {
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    /**
     * Handle mouse down event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        // Check if clicking on a resize handle
        if (e.target.classList.contains('event-resize-handle')) {
            this.startResize(e);
            return;
        }

        // Check if clicking on an event (but not on a checkbox or button)
        const eventEl = e.target.closest('.event');
        if (eventEl && e.target.type !== 'checkbox' && !e.target.classList.contains('btn')) {
            // Check if not clicking on a handle
            if (!e.target.classList.contains('event-resize-handle')) {
                // Set up potential drag - don't start until mouse moves
                this.potentialDrag = true;
                this.potentialDragEvent = eventEl;
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.hasMoved = false;
                e.preventDefault();
            }
        }
    }

    /**
     * Start dragging an event
     * @param {MouseEvent} e - Mouse event
     * @param {Element} eventEl - Event element
     */
    startDrag(e, eventEl) {
        this.isDragging = true;
        this.potentialDrag = false;
        this.draggedEvent = eventEl;
        
        // Get the current column
        const currentColumn = eventEl.parentElement.parentElement;
        this.currentTargetColumn = currentColumn; // Initialize with current column
        
        // Store original event data
        this.originalEvent = {
            id: eventEl.dataset.eventId,
            startTime: eventEl.dataset.start,
            endTime: eventEl.dataset.end,
            top: parseInt(eventEl.style.top),
            left: eventEl.getBoundingClientRect().left,
            column: currentColumn
        };
        
        this.startTop = parseInt(eventEl.style.top);
        
        // Make event smaller and semi-transparent
        eventEl.classList.add('dragging');
        
        // Create shadow in the same column at the same position
        this.createShadow(eventEl, currentColumn);
        
        e.preventDefault();
    }

    /**
     * Start resizing an event
     * @param {MouseEvent} e - Mouse event
     */
    startResize(e) {
        this.isResizing = true;
        this.resizeDirection = e.target.classList.contains('top') ? 'top' : 'bottom';
        this.draggedEvent = e.target.closest('.event');
        
        // Store original event data
        this.originalEvent = {
            id: this.draggedEvent.dataset.eventId,
            startTime: this.draggedEvent.dataset.start,
            endTime: this.draggedEvent.dataset.end,
            top: parseInt(this.draggedEvent.style.top),
            height: parseInt(this.draggedEvent.style.height)
        };
        
        this.startY = e.clientY;
        this.startTop = this.originalEvent.top;
        this.startHeight = this.originalEvent.height;
        
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Create shadow element for drag preview
     * @param {Element} eventEl - Event element
     * @param {Element} column - Column to insert shadow into
     */
    createShadow(eventEl, column) {
        this.shadow = document.createElement('div');
        this.shadow.className = 'event-shadow';
        this.shadow.style.top = eventEl.style.top;
        this.shadow.style.height = eventEl.style.height;
        this.shadow.style.left = eventEl.style.left || '0';
        this.shadow.style.right = eventEl.style.right || '0';
        this.shadow.style.width = eventEl.style.width || 'auto';
        
        // Insert shadow into the current column immediately
        column.querySelector('.day-column-inner').appendChild(this.shadow);
    }

    /**
     * Handle mouse move event
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        // Check if we should start dragging
        if (this.potentialDrag && !this.isDragging) {
            const deltaX = Math.abs(e.clientX - this.startX);
            const deltaY = Math.abs(e.clientY - this.startY);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only start drag if moved beyond threshold
            if (distance > this.dragThreshold) {
                this.startDrag(e, this.potentialDragEvent);
                this.hasMoved = true;
            }
            return;
        }
        
        if (this.isDragging) {
            this.hasMoved = true;
            this.handleDragMove(e);
        } else if (this.isResizing) {
            this.handleResizeMove(e);
        }
    }

    /**
     * Handle drag move
     * @param {MouseEvent} e - Mouse event
     */
    handleDragMove(e) {
        const deltaY = e.clientY - this.startY;
        
        // Snap to 15-minute intervals (15px)
        const snappedDelta = Math.round(deltaY / 15) * 15;
        const newTop = this.startTop + snappedDelta;
        
        // Update shadow position
        if (this.shadow) {
            // Find which column we're over
            const columns = calendar.getVisibleColumns();
            let targetColumn = null;
            
            for (const column of columns) {
                const rect = column.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right) {
                    targetColumn = column;
                    break;
                }
            }
            
            if (targetColumn) {
                // Remove shadow from old column
                if (this.shadow.parentElement) {
                    this.shadow.remove();
                }
                
                // Add to new column and store reference
                this.shadow.style.top = `${Math.max(0, newTop)}px`;
                targetColumn.querySelector('.day-column-inner').appendChild(this.shadow);
                this.currentTargetColumn = targetColumn; // Store for finishDrag
            }
        }
    }

    /**
     * Handle resize move
     * @param {MouseEvent} e - Mouse event
     */
    handleResizeMove(e) {
        const deltaY = e.clientY - this.startY;
        
        // Snap to 15-minute intervals
        const snappedDelta = Math.round(deltaY / 15) * 15;
        
        if (this.resizeDirection === 'top') {
            const newTop = this.startTop + snappedDelta;
            const newHeight = this.startHeight - snappedDelta;
            
            if (newHeight >= 15) { // Minimum 15 minutes
                this.draggedEvent.style.top = `${Math.max(0, newTop)}px`;
                this.draggedEvent.style.height = `${newHeight}px`;
            }
        } else {
            const newHeight = this.startHeight + snappedDelta;
            
            if (newHeight >= 15) { // Minimum 15 minutes
                this.draggedEvent.style.height = `${newHeight}px`;
            }
        }
    }

    /**
     * Handle mouse up event
     * @param {MouseEvent} e - Mouse event
     */
    async handleMouseUp(e) {
        // If we had a potential drag but never moved, treat as click
        if (this.potentialDrag && !this.isDragging && !this.hasMoved) {
            // This is a click - open the sidebar and navigate to event
            const eventEl = this.potentialDragEvent;
            if (eventEl) {
                const eventId = eventEl.dataset.eventId;
                // Show event details first
                eventDetails.showEventDetails(eventId);
                // Also scroll to center the event on screen if needed
                if (calendar && calendar.scrollToEvent) {
                    await calendar.scrollToEvent(eventId);
                    // Re-show event details after scrolling in case the view was regenerated
                    eventDetails.showEventDetails(eventId);
                }
            }
        }
        
        // Reset potential drag state
        this.potentialDrag = false;
        this.potentialDragEvent = null;
        this.hasMoved = false;
        
        if (this.isDragging) {
            await this.finishDrag(e);
        } else if (this.isResizing) {
            await this.finishResize(e);
        }
    }

    /**
     * Finish dragging and update event
     * @param {MouseEvent} e - Mouse event
     */
    async finishDrag(e) {
        if (!this.draggedEvent) return;
        
        // Use the column where the shadow actually is, not mouse position
        let targetColumn = this.currentTargetColumn;
        
        // If we don't have a stored column, try to get it from shadow's parent
        if (!targetColumn && this.shadow && this.shadow.parentElement) {
            targetColumn = this.shadow.parentElement.parentElement; // .day-column-inner -> .day-column
        }
        
        if (targetColumn && this.shadow) {
            // Calculate new times using the shadow's actual position
            const newDateStr = calendar.getDateFromColumn(targetColumn);
            const newTop = parseInt(this.shadow.style.top);
            
            console.log('Dropping event:', {
                targetColumn: targetColumn.dataset.date,
                newDateStr,
                shadowTop: newTop
            });
            
            const originalStart = parseISODate(this.originalEvent.startTime);
            const originalEnd = parseISODate(this.originalEvent.endTime);
            const duration = originalEnd - originalStart;
            
            const newStartTime = calendar.calculateDateTimeFromPosition(newDateStr, newTop);
            const newEndTime = new Date(newStartTime.getTime() + duration);
            
            console.log('New times:', {
                start: formatDateToISO(newStartTime),
                end: formatDateToISO(newEndTime)
            });
            
            // Update event
            const eventData = eventManager.getEventById(this.originalEvent.id);
            if (eventData) {
                eventData.start_time = formatDateToISO(newStartTime);
                eventData.end_time = formatDateToISO(newEndTime);
                
                try {
                    await apiRequest(`/events/${eventData.id}`, 'PUT', eventData);
                    await eventManager.reloadEventsForCurrentView();
                } catch (error) {
                    console.error('Failed to update event:', error);
                    alert('Failed to update event');
                }
            }
        }
        
        // Cleanup
        this.draggedEvent.classList.remove('dragging');
        if (this.shadow) {
            this.shadow.remove();
            this.shadow = null;
        }
        
        this.isDragging = false;
        this.draggedEvent = null;
        this.originalEvent = null;
        this.currentTargetColumn = null;
    }

    /**
     * Finish resizing and update event
     * @param {MouseEvent} e - Mouse event
     */
    async finishResize(e) {
        if (!this.draggedEvent) return;
        
        const newTop = parseInt(this.draggedEvent.style.top);
        const newHeight = parseInt(this.draggedEvent.style.height);
        
        const column = this.draggedEvent.parentElement.parentElement;
        const dateStr = calendar.getDateFromColumn(column);
        
        // Calculate new times
        let newStartTime, newEndTime;
        
        if (this.resizeDirection === 'top') {
            // Changed start time
            newStartTime = calendar.calculateDateTimeFromPosition(dateStr, newTop);
            newEndTime = parseISODate(this.originalEvent.endTime);
        } else {
            // Changed end time
            newStartTime = parseISODate(this.originalEvent.startTime);
            const endTop = newTop + newHeight;
            newEndTime = calendar.calculateDateTimeFromPosition(dateStr, endTop);
        }
        
        // Update event
        const eventData = eventManager.getEventById(this.originalEvent.id);
        if (eventData) {
            eventData.start_time = formatDateToISO(newStartTime);
            eventData.end_time = formatDateToISO(newEndTime);
            
            try {
                await apiRequest(`/events/${eventData.id}`, 'PUT', eventData);
                await eventManager.reloadEventsForCurrentView();
            } catch (error) {
                console.error('Failed to update event:', error);
                alert('Failed to update event');
                
                // Restore original
                this.draggedEvent.style.top = `${this.originalEvent.top}px`;
                this.draggedEvent.style.height = `${this.originalEvent.height}px`;
            }
        }
        
        this.isResizing = false;
        this.draggedEvent = null;
        this.originalEvent = null;
        this.resizeDirection = null;
    }
}

// Global drag manager instance (declared in main.js)

