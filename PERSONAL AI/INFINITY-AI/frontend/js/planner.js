Auth.requireLogin();
document.getElementById("logoutBtn")?.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
});

const goalsInput = document.getElementById("goalsInput");
const generatePlanBtn = document.getElementById("generatePlanBtn");
const planResult = document.getElementById("planResult");
const plannerHistory = document.getElementById("plannerHistory");
const banner = document.getElementById("plannerBanner");

function formatDate(iso) {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function showPlan(text) {
    planResult.textContent = text;
    planResult.classList.remove("placeholder");
}

async function loadHistory() {
    try {
        const data = await apiRequest("/planner");
        if (!data.plans.length) {
            plannerHistory.innerHTML = `<div class="empty-hint">Your daily plans will show up here.</div>`;
            return;
        }
        plannerHistory.innerHTML = data.plans
            .map(
                p => `
            <div class="history-card" data-id="${p.id}">
                <div class="history-date">${formatDate(p.created_at)}</div>
                <div class="history-preview"></div>
                <button class="history-delete"><i class="bi bi-trash"></i></button>
            </div>`
            )
            .join("");

        plannerHistory.querySelectorAll(".history-card").forEach((card, i) => {
            card.querySelector(".history-preview").textContent =
                data.plans[i].goals.slice(0, 120) + (data.plans[i].goals.length > 120 ? "…" : "");
            card.addEventListener("click", e => {
                if (e.target.closest(".history-delete")) return;
                showPlan(data.plans[i].plan);
            });
        });

        plannerHistory.querySelectorAll(".history-delete").forEach(btn => {
            btn.addEventListener("click", async e => {
                e.stopPropagation();
                const id = btn.closest(".history-card").dataset.id;
                try {
                    await apiRequest(`/planner/${id}`, { method: "DELETE" });
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

generatePlanBtn.addEventListener("click", async () => {
    const goals = goalsInput.value.trim();
    if (!goals) {
        showBanner(banner, "Please list at least one goal or priority.");
        return;
    }

    generatePlanBtn.disabled = true;
    generatePlanBtn.innerHTML = `<span class="spinner-dot"></span> Planning...`;

    try {
        const data = await apiRequest("/planner/generate", { method: "POST", body: { goals } });
        showPlan(data.plan.plan);
        loadHistory();
    } catch (err) {
        showBanner(banner, err.message);
    } finally {
        generatePlanBtn.disabled = false;
        generatePlanBtn.innerHTML = `<i class="bi bi-stars"></i> Create My Plan`;
    }
});

loadHistory();
