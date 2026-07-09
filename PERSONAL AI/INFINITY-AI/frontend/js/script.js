/* ==========================================
   ENTRANCE ANIMATIONS
   (feature cards on homepage, login/register cards)
========================================== */

const cards = document.querySelectorAll(".feature-card,.login-card");

cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";

    setTimeout(() => {
        card.style.transition = "all .7s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
    }, index * 150);
});

/* ==========================================
   NAVBAR "Login" button -> if already logged in,
   send the person straight to their dashboard.
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    if (typeof Auth !== "undefined" && Auth.isLoggedIn()) {
        document.querySelectorAll('a[href="login.html"]').forEach(a => {
            a.href = "dashboard.html";
            a.textContent = "Dashboard";
        });
        document.querySelectorAll('a[href="register.html"]').forEach(a => {
            a.textContent = a.textContent.trim() === "Get Started" ? "Go to Dashboard" : a.textContent;
            a.href = "dashboard.html";
        });
    }
});
