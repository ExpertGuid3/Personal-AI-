/* ==========================================
   INFINITY AI — shared API helper
   Include this BEFORE any other page script.
========================================== */

const API_BASE_URL = "https://personal-ai-dada.onrender.com";

const Auth = {
    getToken() {
        return localStorage.getItem("infinity_token");
    },
    setToken(token) {
        localStorage.setItem("infinity_token", token);
    },
    getUser() {
        try {
            return JSON.parse(localStorage.getItem("infinity_user") || "null");
        } catch {
            return null;
        }
    },
    setUser(user) {
        localStorage.setItem("infinity_user", JSON.stringify(user));
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    logout() {
        localStorage.removeItem("infinity_token");
        localStorage.removeItem("infinity_user");
        window.location.href = "index.html";
    },
    /** Redirects to login if there's no token. Call at the top of protected pages. */
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = "login.html";
        }
    },
};

/**
 * Wrapper around fetch() that adds the JWT header, the API base URL,
 * and JSON handling. Redirects to login on 401.
 */
async function apiRequest(path, { method = "GET", body = null } = {}) {
    const headers = { "Content-Type": "application/json" };
    const token = Auth.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });
    } catch (err) {
        throw new Error(
            "Could not reach the INFINITY AI backend. Is the Flask server running on port 5000?"
        );
    }

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        Auth.logout();
        throw new Error((data && data.error) || "Session expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error((data && data.error) || `Request failed (${response.status})`);
    }

    return data;
}

/* Small helper to show inline error/success banners without needing a UI library */
function showBanner(containerEl, message, type = "error") {
    if (!containerEl) return;
    containerEl.textContent = message;
    containerEl.className = `api-banner ${type}`;
    containerEl.style.display = "block";
}
