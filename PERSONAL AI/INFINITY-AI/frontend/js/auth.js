/* ==========================================
   LOGIN
========================================== */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    // Already logged in? skip straight to the dashboard.
    if (Auth.isLoggedIn()) window.location.href = "dashboard.html";

    const banner = document.getElementById("authBanner");
    const btn = document.getElementById("loginBtn");

    loginForm.addEventListener("submit", async e => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        btn.disabled = true;
        btn.textContent = "Logging in...";

        try {
            const data = await apiRequest("/auth/login", {
                method: "POST",
                body: { email, password },
            });
            Auth.setToken(data.token);
            Auth.setUser(data.user);
            window.location.href = "dashboard.html";
        } catch (err) {
            showBanner(banner, err.message);
            btn.disabled = false;
            btn.textContent = "Login";
        }
    });
}

/* ==========================================
   REGISTER
========================================== */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    if (Auth.isLoggedIn()) window.location.href = "dashboard.html";

    const banner = document.getElementById("authBanner");
    const btn = document.getElementById("registerBtn");

    registerForm.addEventListener("submit", async e => {
        e.preventDefault();

        const payload = {
            first_name: document.getElementById("firstName").value.trim(),
            last_name: document.getElementById("lastName").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            password: document.getElementById("password").value,
            confirm_password: document.getElementById("confirmPassword").value,
        };

        if (!document.getElementById("terms").checked) {
            showBanner(banner, "Please agree to the Terms & Conditions to continue.");
            return;
        }

        btn.disabled = true;
        btn.textContent = "Creating account...";

        try {
            const data = await apiRequest("/auth/register", {
                method: "POST",
                body: payload,
            });
            Auth.setToken(data.token);
            Auth.setUser(data.user);
            window.location.href = "dashboard.html";
        } catch (err) {
            showBanner(banner, err.message);
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    });
}
