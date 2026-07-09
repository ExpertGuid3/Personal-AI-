Auth.requireLogin();
document.getElementById("logoutBtn")?.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
});

const noteInput = document.getElementById("noteInput");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryResult = document.getElementById("summaryResult");
const notesHistory = document.getElementById("notesHistory");
const banner = document.getElementById("notesBanner");

function formatDate(iso) {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function showSummary(text) {
    summaryResult.textContent = text;
    summaryResult.classList.remove("placeholder");
}

async function loadHistory() {
    try {
        const data = await apiRequest("/notes");
        if (!data.notes.length) {
            notesHistory.innerHTML = `<div class="empty-hint">Your summaries will show up here.</div>`;
            return;
        }
        notesHistory.innerHTML = data.notes
            .map(
                n => `
            <div class="history-card" data-id="${n.id}">
                <div class="history-date">${formatDate(n.created_at)}</div>
                <div class="history-preview"></div>
                <button class="history-delete"><i class="bi bi-trash"></i></button>
            </div>`
            )
            .join("");

        notesHistory.querySelectorAll(".history-card").forEach((card, i) => {
            card.querySelector(".history-preview").textContent =
                data.notes[i].summary.slice(0, 140) + (data.notes[i].summary.length > 140 ? "…" : "");
            card.addEventListener("click", e => {
                if (e.target.closest(".history-delete")) return;
                showSummary(data.notes[i].summary);
            });
        });

        notesHistory.querySelectorAll(".history-delete").forEach(btn => {
            btn.addEventListener("click", async e => {
                e.stopPropagation();
                const id = btn.closest(".history-card").dataset.id;
                try {
                    await apiRequest(`/notes/${id}`, { method: "DELETE" });
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

summarizeBtn.addEventListener("click", async () => {
    const text = noteInput.value.trim();
    if (!text) {
        showBanner(banner, "Please paste some text to summarize first.");
        return;
    }

    summarizeBtn.disabled = true;
    summarizeBtn.innerHTML = `<span class="spinner-dot"></span> Summarizing...`;

    try {
        const data = await apiRequest("/notes/summarize", { method: "POST", body: { text } });
        showSummary(data.note.summary);
        loadHistory();
    } catch (err) {
        showBanner(banner, err.message);
    } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = `<i class="bi bi-stars"></i> Summarize with AI`;
    }
});

loadHistory();
