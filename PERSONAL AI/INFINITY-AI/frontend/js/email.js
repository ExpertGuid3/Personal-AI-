Auth.requireLogin();
document.getElementById("logoutBtn")?.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
});

const emailPrompt = document.getElementById("emailPrompt");
const emailTone = document.getElementById("emailTone");
const generateEmailBtn = document.getElementById("generateEmailBtn");
const emailResult = document.getElementById("emailResult");
const copyEmailBtn = document.getElementById("copyEmailBtn");
const emailHistory = document.getElementById("emailHistory");
const banner = document.getElementById("emailBanner");

function formatDate(iso) {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function showResult(text) {
    emailResult.textContent = text;
    emailResult.classList.remove("placeholder");
    copyEmailBtn.style.display = "inline-flex";
}

async function loadHistory() {
    try {
        const data = await apiRequest("/api/email");
        if (!data.emails.length) {
            emailHistory.innerHTML = `<div class="empty-hint">Your generated emails will show up here.</div>`;
            return;
        }
        emailHistory.innerHTML = data.emails
            .map(
                e => `
            <div class="history-card" data-id="${e.id}">
                <div class="history-date">${formatDate(e.created_at)} · ${e.tone}</div>
                <div class="history-preview"></div>
                <button class="history-delete"><i class="bi bi-trash"></i></button>
            </div>`
            )
            .join("");

        emailHistory.querySelectorAll(".history-card").forEach((card, i) => {
            card.querySelector(".history-preview").textContent =
                data.emails[i].prompt.slice(0, 120) + (data.emails[i].prompt.length > 120 ? "…" : "");
            card.addEventListener("click", e => {
                if (e.target.closest(".history-delete")) return;
                showResult(data.emails[i].result);
            });
        });

        emailHistory.querySelectorAll(".history-delete").forEach(btn => {
            btn.addEventListener("click", async e => {
                e.stopPropagation();
                const id = btn.closest(".history-card").dataset.id;
                try {
                    await apiRequest(`/api/email/${id}`, { method: "DELETE" });
                    loadHistory();
                } catch (err) {
                    showBanner(banner, err.message);
                }
            });
        });
    } catch (err) {
        showBanner(banner, err.message);
    }
}

generateEmailBtn.addEventListener("click", async () => {
    const prompt = emailPrompt.value.trim();
    if (!prompt) {
        showBanner(banner, "Please describe what the email should be about.");
        return;
    }

    generateEmailBtn.disabled = true;
    generateEmailBtn.innerHTML = `<span class="spinner-dot"></span> Generating...`;

    try {
        const data = await apiRequest("/api/email/generate", {
            method: "POST",
            body: { prompt, tone: emailTone.value },
        });
        showResult(data.email.result);
        loadHistory();
    } catch (err) {
        showBanner(banner, err.message);
    } finally {
        generateEmailBtn.disabled = false;
        generateEmailBtn.innerHTML = `<i class="bi bi-stars"></i> Generate Email`;
    }
});

copyEmailBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(emailResult.textContent).then(() => {
        copyEmailBtn.innerHTML = `<i class="bi bi-check2"></i> Copied!`;
        setTimeout(() => {
            copyEmailBtn.innerHTML = `<i class="bi bi-clipboard"></i> Copy to clipboard`;
        }, 1500);
    });
});

loadHistory();
