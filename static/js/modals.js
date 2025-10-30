/**
 * Modal management functionality
 */

class ModalManager {
    constructor() {
        this.overlay = document.getElementById('overlay');
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for modal controls
     */
    setupEventListeners() {
        // Close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.modal;
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });

        // Cancel buttons
        document.querySelectorAll('[data-modal]').forEach(btn => {
            if (btn.classList.contains('btn')) {
                btn.addEventListener('click', (e) => {
                    const modalId = e.target.dataset.modal;
                    if (modalId) {
                        this.closeModal(modalId);
                    }
                });
            }
        });

        // Click overlay to close
        this.overlay.addEventListener('click', () => {
            this.closeAllModals();
        });
    }

    /**
     * Open a modal
     * @param {string} modalId - Modal element ID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.overlay.classList.add('active');
        }
    }

    /**
     * Close a modal
     * @param {string} modalId - Modal element ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.overlay.classList.remove('active');
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.overlay.classList.remove('active');
    }

    /**
     * Reset a form in a modal
     * @param {string} formId - Form element ID
     */
    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Clear any hidden ID fields
            const idField = form.querySelector('input[type="hidden"]');
            if (idField) {
                idField.value = '';
            }
        }
    }
}

// Create global modal manager instance
const modalManager = new ModalManager();

