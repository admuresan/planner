/**
 * Category management functionality
 */

class CategoryManager {
    constructor() {
        this.categories = [];
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for category actions
     */
    setupEventListeners() {
        // Manage categories button
        document.getElementById('manage-categories-btn').addEventListener('click', () => {
            this.openManageModal();
        });

        // Add category from manage modal
        document.getElementById('add-category-from-manage').addEventListener('click', () => {
            modalManager.closeModal('manage-categories-modal');
            this.openAddModal();
        });

        // Category form submission
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
        
        // Color preview update
        const colorInput = document.getElementById('category-color');
        const colorPreview = document.getElementById('category-color-preview');
        
        if (colorInput && colorPreview) {
            colorInput.addEventListener('input', (e) => {
                colorPreview.style.backgroundColor = e.target.value;
            });
        }
    }

    /**
     * Load all categories from the API
     */
    async loadCategories() {
        try {
            this.categories = await apiRequest('/categories');
            this.updateCategoryDropdown();
        } catch (error) {
            console.error('Failed to load categories:', error);
            alert('Failed to load categories');
        }
    }

    /**
     * Update the category dropdown in the event form
     */
    updateCategoryDropdown() {
        const select = document.getElementById('event-category');
        
        // Keep the "No Category" option
        select.innerHTML = '<option value="">No Category</option>';
        
        // Add all categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    /**
     * Open the add category modal
     */
    openAddModal() {
        modalManager.resetForm('category-form');
        document.getElementById('category-modal-title').textContent = 'Add Category';
        
        // Set default color and update preview
        const defaultColor = '#4CAF50';
        document.getElementById('category-color').value = defaultColor;
        const colorPreview = document.getElementById('category-color-preview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = defaultColor;
        }
        
        modalManager.openModal('category-modal');
    }

    /**
     * Open the edit category modal
     * @param {object} category - Category to edit
     */
    openEditModal(category) {
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-color').value = category.color;
        
        // Update color preview
        const colorPreview = document.getElementById('category-color-preview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = category.color;
        }
        
        document.getElementById('category-modal-title').textContent = 'Edit Category';
        modalManager.openModal('category-modal');
    }

    /**
     * Open the manage categories modal
     */
    async openManageModal() {
        await this.loadCategories();
        this.renderCategoriesList();
        modalManager.openModal('manage-categories-modal');
    }

    /**
     * Render the list of categories in the manage modal
     */
    renderCategoriesList() {
        const list = document.getElementById('categories-list');
        list.innerHTML = '';

        if (this.categories.length === 0) {
            list.innerHTML = '<p style="color: var(--text-light);">No categories yet. Create one to get started!</p>';
            return;
        }

        this.categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';

            const info = document.createElement('div');
            info.className = 'category-info';

            const colorBox = document.createElement('div');
            colorBox.className = 'category-color-box';
            colorBox.style.backgroundColor = category.color;

            const name = document.createElement('div');
            name.className = 'category-name';
            name.textContent = category.name;

            info.appendChild(colorBox);
            info.appendChild(name);

            const actions = document.createElement('div');
            actions.className = 'category-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-small btn-secondary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                modalManager.closeModal('manage-categories-modal');
                this.openEditModal(category);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-small btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.deleteCategory(category.id);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(info);
            item.appendChild(actions);

            list.appendChild(item);
        });
    }

    /**
     * Save a category (create or update)
     */
    async saveCategory() {
        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value;
        const color = document.getElementById('category-color').value;

        const categoryData = { name, color };

        try {
            if (id) {
                // Update existing
                await apiRequest(`/categories/${id}`, 'PUT', categoryData);
            } else {
                // Create new
                await apiRequest('/categories', 'POST', categoryData);
            }

            modalManager.closeModal('category-modal');
            await this.loadCategories();

            // Re-render events to update colors
            if (window.eventManager) {
                window.eventManager.renderAllEvents();
            }
        } catch (error) {
            console.error('Failed to save category:', error);
            alert('Failed to save category: ' + error.message);
        }
    }

    /**
     * Delete a category
     * @param {string} categoryId - Category ID to delete
     */
    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category? Events will keep their data but lose the category assignment.')) {
            return;
        }

        try {
            await apiRequest(`/categories/${categoryId}`, 'DELETE');
            await this.loadCategories();
            this.renderCategoriesList();

            // Re-render events
            if (window.eventManager) {
                window.eventManager.renderAllEvents();
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Failed to delete category: ' + error.message);
        }
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {object|null} Category object or null
     */
    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId) || null;
    }

    /**
     * Get color for a category ID
     * @param {string} categoryId - Category ID
     * @returns {string} Color hex code
     */
    getCategoryColor(categoryId) {
        if (!categoryId) {
            return '#CCCCCC'; // Default grey
        }
        const category = this.getCategoryById(categoryId);
        return category ? category.color : '#CCCCCC';
    }
}

// Global category manager instance (declared in main.js)

