// ═══════════════════════════════════════════════════════════════════════════
// BACKEND API INTEGRATION - Authentication & API Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Authentication Token Management
 */

// Get JWT token from localStorage
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Set JWT token
function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

// Clear JWT token (logout)
function clearAuthToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * API Request Helper
 */
async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${CONFIG.API_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });

        const data = await response.json();

        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            clearAuthToken();
            if (!window.location.pathname.includes('login') && !window.location.pathname.includes('index')) {
                window.location.href = 'login.html';
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Authentication Functions
 */

// Login function
async function loginWithBackend(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    if (data && data.success) {
        setAuthToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
    } else {
        return { success: false, error: data?.error || 'Login failed' };
    }
}

// Logout function
async function logoutFromBackend() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthToken();
        window.location.href = 'login.html';
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Verify authentication on page load
async function verifyAuth() {
    if (!isAuthenticated()) {
        return false;
    }

    const data = await apiRequest('/auth/me');
    if (!data || !data.success) {
        clearAuthToken();
        return false;
    }

    // Update user data
    localStorage.setItem('user', JSON.stringify(data.user));
    return true;
}

/**
 * Lead Management Functions
 */

// Fetch all leads
async function fetchLeadsFromBackend(filters = {}) {
    const params = new URLSearchParams(filters);
    const data = await apiRequest(`/leads?${params}`);
    return data?.success ? data.leads : [];
}

// Create new lead
async function createLeadInBackend(leadData) {
    const data = await apiRequest('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData)
    });
    return data;
}

// Update lead status
async function updateLeadStatusInBackend(leadId, status, notes = '') {
    const data = await apiRequest(`/leads/${leadId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
    });
    return data;
}

// Get single lead
async function getLeadFromBackend(leadId) {
    const data = await apiRequest(`/leads/${leadId}`);
    return data?.success ? data.lead : null;
}

// Get lead statistics
async function getLeadStatsFromBackend() {
    const data = await apiRequest('/leads/stats/summary');
    return data?.success ? data.stats : null;
}

/**
 * Message/Chat Functions
 */

// Fetch messages
async function fetchMessagesFromBackend(leadId = null) {
    const params = leadId ? `?lead_id=${leadId}` : '';
    const data = await apiRequest(`/messages${params}`);
    return data?.success ? data.messages : [];
}

// Send message
async function sendMessageToBackend(leadId, message) {
    const data = await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ lead_id: leadId, message })
    });
    return data;
}

// Get unread message count
async function getUnreadCountFromBackend() {
    const data = await apiRequest('/messages/unread/count');
    return data?.success ? data.unread_count : 0;
}

/**
 * Admin Functions
 */

// Get dashboard stats (admin only)
async function getAdminDashboardFromBackend() {
    const data = await apiRequest('/admin/dashboard');
    return data?.success ? data.dashboard : null;
}

// Get all agents (admin only)
async function getAgentsFromBackend() {
    const data = await apiRequest('/admin/agents');
    return data?.success ? data.agents : [];
}

/**
 * NO AUTO-REDIRECT - Portals handle their own authentication
 * This prevents the flash/close bug
 */

console.log('✅ Backend API Integration Loaded');
console.log('📍 API URL:', CONFIG.API_URL);
