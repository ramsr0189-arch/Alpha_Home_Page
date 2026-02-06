// ═══════════════════════════════════════════════════════════════════════════
// ALPHAPROFIN - AUTHENTICATION SYSTEM
// Secure login for agents and admins
// ═══════════════════════════════════════════════════════════════════════════

const AlphaAuth = {
    currentUser: null,
    sessionKey: 'AlphaSession_v3',

    // Check if user is logged in
    isLoggedIn() {
        const session = this.getSession();
        if (!session) return false;

        // Check if session expired (8 hours)
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

        if (hoursDiff > 8) {
            this.logout();
            return false;
        }

        this.currentUser = session.user;
        return true;
    },

    // Get current session
    getSession() {
        try {
            const data = localStorage.getItem(this.sessionKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    // Login
    login(name, password) {
        const user = window.AlphaDB.tables.users.find(u =>
            u.name.toLowerCase() === name.toLowerCase() &&
            u.password === password &&
            u.active
        );

        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }

        const session = {
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            },
            loginTime: new Date().toISOString()
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        this.currentUser = session.user;

        window.AlphaDB.audit('LOGIN', user.name, user.id);

        return { success: true, user: session.user };
    },

    // Logout
    logout() {
        if (this.currentUser) {
            window.AlphaDB.audit('LOGOUT', this.currentUser.name, this.currentUser.id);
        }
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
    },

    // Get current user
    getUser() {
        if (!this.currentUser) {
            const session = this.getSession();
            this.currentUser = session ? session.user : null;
        }
        return this.currentUser;
    },

    // Check if admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Require login (redirect if not logged in)
    requireLogin(redirectTo = 'login.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    window.AlphaAuth = AlphaAuth;
}
