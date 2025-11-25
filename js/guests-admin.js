// ========================================
// GUEST LIST ADMIN MANAGEMENT
// ========================================

const API_BASE_URL = 'http://localhost:3000/api';

let guestData = {
    categories: [],
    metadata: {
        totalExpectedGuests: 0,
        lastUpdated: null,
        notes: "All guest counts are tentative"
    }
};

let currentCategoryIndex = null;
let currentGuestIndex = null;
let isEditingCategory = false;
let isEditingGuest = false;

// DOM Elements
const categoriesContainer = document.getElementById('categoriesContainer');
const categoryModal = document.getElementById('categoryModal');
const guestModal = document.getElementById('guestModal');
const categoryForm = document.getElementById('categoryForm');
const guestForm = document.getElementById('guestForm');
const saveBtn = document.getElementById('saveBtn');
const refreshBtn = document.getElementById('refreshBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGuestData();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Category Modal
    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    document.querySelector('#categoryModal .close').addEventListener('click', closeCategoryModal);
    document.getElementById('cancelCategoryBtn').addEventListener('click', closeCategoryModal);
    categoryForm.addEventListener('submit', handleCategorySubmit);

    // Guest Modal
    document.querySelector('#guestModal .close').addEventListener('click', closeGuestModal);
    document.getElementById('cancelGuestBtn').addEventListener('click', closeGuestModal);
    guestForm.addEventListener('submit', handleGuestSubmit);

    // Controls
    saveBtn.addEventListener('click', saveGuestData);
    refreshBtn.addEventListener('click', loadGuestData);

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) closeCategoryModal();
        if (e.target === guestModal) closeGuestModal();
    });
}

// Load Guest Data
async function loadGuestData() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/guests`);
        if (!response.ok) throw new Error('Failed to load guest data');
        
        guestData = await response.json();
        renderCategories();
        updateStats();
        hideLoading();
    } catch (error) {
        console.error('Error loading guest data:', error);
        showError('Failed to load guest data. Make sure the server is running.');
    }
}

// Save Guest Data
async function saveGuestData() {
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Update metadata
        guestData.metadata.lastUpdated = new Date().toISOString();
        guestData.metadata.totalExpectedGuests = calculateTotalExpected();

        const response = await fetch(`${API_BASE_URL}/guests`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(guestData)
        });

        if (!response.ok) throw new Error('Failed to save guest data');

        showSuccess('Guest list saved successfully!');
        await loadGuestData();
    } catch (error) {
        console.error('Error saving guest data:', error);
        showError('Failed to save guest data. Please try again.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// Render Categories
function renderCategories() {
    categoriesContainer.innerHTML = '';

    if (guestData.categories.length === 0) {
        categoriesContainer.innerHTML = '<div class="loading">No categories yet. Add your first category to get started.</div>';
        return;
    }

    guestData.categories.forEach((category, catIndex) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        categoryCard.innerHTML = `
            <div class="category-header">
                <h2>${category.name}</h2>
                <div class="category-actions">
                    <button class="btn btn-edit" onclick="editCategory(${catIndex})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteCategory(${catIndex})">Delete</button>
                </div>
            </div>
            <div class="guests-list">
                ${renderGuests(category.guests, catIndex)}
            </div>
            <button class="add-guest-btn" onclick="openGuestModal(${catIndex})">+ Add Guest</button>
        `;

        categoriesContainer.appendChild(categoryCard);
    });
}

// Render Guests
function renderGuests(guests, categoryIndex) {
    if (guests.length === 0) {
        return '<div class="loading" style="padding: 1rem; color: #666;">No guests in this category yet.</div>';
    }

    return guests.map((guest, guestIndex) => `
        <div class="guest-item">
            <div class="guest-info">
                <span class="guest-name">${escapeHtml(guest.name)}</span>
                <div class="guest-details">
                    <span>Expected: <strong>${guest.expectedCount}</strong></span>
                    <span class="guest-badge ${guest.isExact ? 'badge-exact' : 'badge-approximate'}">
                        ${guest.isExact ? 'Exact' : 'Approximate'}
                    </span>
                    ${guest.phone ? `<span>Phone: ${escapeHtml(guest.phone)}</span>` : ''}
                    ${guest.notes ? `<span>Notes: ${escapeHtml(guest.notes)}</span>` : ''}
                </div>
            </div>
            <div class="guest-actions">
                <button class="btn btn-edit" onclick="editGuest(${categoryIndex}, ${guestIndex})">Edit</button>
                <button class="btn btn-danger" onclick="deleteGuest(${categoryIndex}, ${guestIndex})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Category Modal Functions
function openCategoryModal(categoryIndex = null) {
    isEditingCategory = categoryIndex !== null;
    currentCategoryIndex = categoryIndex;
    
    const modalTitle = document.getElementById('modalTitle');
    const categoryNameInput = document.getElementById('categoryName');
    
    if (isEditingCategory) {
        modalTitle.textContent = 'Edit Category';
        categoryNameInput.value = guestData.categories[categoryIndex].name;
    } else {
        modalTitle.textContent = 'Add Category';
        categoryNameInput.value = '';
    }
    
    categoryModal.style.display = 'block';
    categoryNameInput.focus();
}

function closeCategoryModal() {
    categoryModal.style.display = 'none';
    categoryForm.reset();
    isEditingCategory = false;
    currentCategoryIndex = null;
}

function handleCategorySubmit(e) {
    e.preventDefault();
    const categoryName = document.getElementById('categoryName').value.trim();
    
    if (!categoryName) return;

    if (isEditingCategory) {
        guestData.categories[currentCategoryIndex].name = categoryName;
    } else {
        guestData.categories.push({
            name: categoryName,
            guests: []
        });
    }

    closeCategoryModal();
    renderCategories();
    updateStats();
}

// Guest Modal Functions
function openGuestModal(categoryIndex, guestIndex = null) {
    isEditingGuest = guestIndex !== null;
    currentCategoryIndex = categoryIndex;
    currentGuestIndex = guestIndex;
    
    const modalTitle = document.getElementById('guestModalTitle');
    const guestNameInput = document.getElementById('guestName');
    const guestPhoneInput = document.getElementById('guestPhone');
    const expectedCountInput = document.getElementById('expectedCount');
    const isExactInput = document.getElementById('isExact');
    const guestNotesInput = document.getElementById('guestNotes');
    
    if (isEditingGuest) {
        modalTitle.textContent = 'Edit Guest';
        const guest = guestData.categories[categoryIndex].guests[guestIndex];
        guestNameInput.value = guest.name;
        guestPhoneInput.value = guest.phone || '';
        expectedCountInput.value = guest.expectedCount;
        isExactInput.checked = guest.isExact;
        guestNotesInput.value = guest.notes || '';
    } else {
        modalTitle.textContent = 'Add Guest';
        guestNameInput.value = '';
        guestPhoneInput.value = '';
        expectedCountInput.value = 1;
        isExactInput.checked = false;
        guestNotesInput.value = '';
    }
    
    guestModal.style.display = 'block';
    guestNameInput.focus();
}

function closeGuestModal() {
    guestModal.style.display = 'none';
    guestForm.reset();
    isEditingGuest = false;
    currentCategoryIndex = null;
    currentGuestIndex = null;
}

function handleGuestSubmit(e) {
    e.preventDefault();
    const guestName = document.getElementById('guestName').value.trim();
    const guestPhone = document.getElementById('guestPhone').value.trim();
    const expectedCount = parseInt(document.getElementById('expectedCount').value);
    const isExact = document.getElementById('isExact').checked;
    const notes = document.getElementById('guestNotes').value.trim() || null;
    
    if (!guestName || expectedCount < 1) return;

    const guest = {
        name: guestName,
        phone: guestPhone || null,
        expectedCount: expectedCount,
        isExact: isExact,
        notes: notes
    };

    if (isEditingGuest) {
        guestData.categories[currentCategoryIndex].guests[currentGuestIndex] = guest;
    } else {
        guestData.categories[currentCategoryIndex].guests.push(guest);
    }

    closeGuestModal();
    renderCategories();
    updateStats();
}

// Delete Functions
function deleteCategory(index) {
    if (!confirm(`Are you sure you want to delete the category "${guestData.categories[index].name}" and all its guests?`)) {
        return;
    }
    guestData.categories.splice(index, 1);
    renderCategories();
    updateStats();
}

function deleteGuest(categoryIndex, guestIndex) {
    const guest = guestData.categories[categoryIndex].guests[guestIndex];
    if (!confirm(`Are you sure you want to delete "${guest.name}"?`)) {
        return;
    }
    guestData.categories[categoryIndex].guests.splice(guestIndex, 1);
    renderCategories();
    updateStats();
}

function editCategory(index) {
    openCategoryModal(index);
}

function editGuest(categoryIndex, guestIndex) {
    openGuestModal(categoryIndex, guestIndex);
}

// Update Stats
function updateStats() {
    const totalCategories = guestData.categories.length;
    const totalGuests = guestData.categories.reduce((sum, cat) => sum + cat.guests.length, 0);
    const totalExpected = calculateTotalExpected();

    document.getElementById('totalCategories').textContent = totalCategories;
    document.getElementById('totalGuests').textContent = totalGuests;
    document.getElementById('totalExpected').textContent = totalExpected;
}

function calculateTotalExpected() {
    return guestData.categories.reduce((sum, category) => {
        return sum + category.guests.reduce((catSum, guest) => catSum + guest.expectedCount, 0);
    }, 0);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    categoriesContainer.innerHTML = '<div class="loading">Loading guest data...</div>';
}

function hideLoading() {
    // Loading is handled by renderCategories
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    categoriesContainer.insertBefore(errorDiv, categoriesContainer.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.admin-container').insertBefore(successDiv, document.querySelector('.stats-section'));
    setTimeout(() => successDiv.remove(), 3000);
}

// Make functions globally available for onclick handlers
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.openGuestModal = openGuestModal;
window.editGuest = editGuest;
window.deleteGuest = deleteGuest;

