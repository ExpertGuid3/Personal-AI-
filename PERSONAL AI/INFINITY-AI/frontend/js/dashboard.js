Auth.requireLogin();

const user = Auth.getUser();
if (user) {
    const heading = document.getElementById("welcomeHeading");
    if (heading) heading.textContent = `Welcome back, ${user.first_name} 👋`;
}

document.getElementById("logoutBtn")?.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
});

/* ==========================================
   STATS
========================================== */
async function loadStats() {
    try {
        const data = await apiRequest("/dashboard/stats");
        document.getElementById("statChats").textContent = data.chats;
        document.getElementById("statTasks").textContent = data.tasks_total;
        document.getElementById("statTasksPending").textContent = `${data.tasks_pending} pending`;
        document.getElementById("statNotes").textContent = data.notes;
        document.getElementById("statEmails").textContent = data.emails;
    } catch (err) {
        console.error(err);
    }
}

/* ==========================================
   RECENT ACTIVITY
========================================== */
function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
}

function badgeClass(status) {
    if (status === "Completed" || status === "Done") return "success";
    if (status === "Pending") return "warning";
    return "info";
}

async function loadActivity() {
    const el = document.getElementById("activityTable");
    try {
        const data = await apiRequest("/dashboard/activity");
        const rows = data.activity;

        if (!rows.length) {
            el.innerHTML = `
                <div class="activity-row activity-header"><span>Activity</span><span>Status</span><span>Date</span></div>
                <div class="activity-row"><span style="color:var(--text-muted);">No activity yet — try the AI tools!</span></div>`;
            return;
        }

        el.innerHTML =
            `<div class="activity-row activity-header"><span>Activity</span><span>Status</span><span>Date</span></div>` +
            rows
                .map(
                    r => `
                <div class="activity-row">
                    <span>${r.action}</span>
                    <span class="badge ${badgeClass(r.status)}">${r.status}</span>
                    <span>${timeAgo(r.created_at)}</span>
                </div>`
                )
                .join("");
    } catch (err) {
        el.innerHTML = `<div class="activity-row"><span style="color:var(--text-muted);">Could not load activity.</span></div>`;
    }
}

/* ==========================================
   TODAY'S TASKS (compact, top 5)
========================================== */
async function loadDashTasks() {
    const el = document.getElementById("dashTaskList");
    try {
        const data = await apiRequest("/todos");
        const tasks = data.tasks.slice(0, 5);

        if (!tasks.length) {
            el.innerHTML = `<li><span style="color:var(--text-muted);font-size:13px;">No tasks yet. Add some on the <a href="todo.html" style="color:#93c5fd;">Tasks page</a>.</span></li>`;
            return;
        }

        el.innerHTML = tasks
            .map(
                t => `
            <li>
                <input type="checkbox" data-id="${t.id}" ${t.is_done ? "checked" : ""}>
                <label style="${t.is_done ? "text-decoration:line-through;color:var(--text-muted);" : ""}">${t.title}</label>
            </li>`
            )
            .join("");

        el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener("change", async () => {
                try {
                    await apiRequest(`/todos/${cb.dataset.id}`, {
                        method: "PUT",
                        body: { is_done: cb.checked },
                    });
                    loadDashTasks();
                    loadStats();
                } catch (err) {
                    alert(err.message);
                }
            });
        });
    } catch (err) {
        el.innerHTML = `<li><span style="color:var(--text-muted);font-size:13px;">Could not load tasks.</span></li>`;
    }
}

/* ==========================================
   MINI AI ASSISTANT
========================================== */
const miniChat = document.getElementById("miniChat");
const miniInput = document.getElementById("miniInput");
const miniSend = document.getElementById("miniSend");
let miniSessionId = null;

function addMiniMsg(text, role) {
    const wrap = document.createElement("div");
    wrap.className = `mini-msg ${role === "user" ? "mini-user" : "mini-ai"}`;
    if (role === "user") {
        wrap.innerHTML = `<div class="mini-text"></div>`;
    } else {
        wrap.innerHTML = `<div class="mini-avatar">🤖</div><div class="mini-text"></div>`;
    }
    wrap.querySelector(".mini-text").textContent = text;
    miniChat.appendChild(wrap);
    miniChat.scrollTop = miniChat.scrollHeight;
}

async function sendMiniMessage() {
    const text = miniInput.value.trim();
    if (!text) return;

    addMiniMsg(text, "user");
    miniInput.value = "";

    const thinking = document.createElement("div");
    thinking.className = "mini-msg mini-ai";
    thinking.id = "miniThinking";
    thinking.innerHTML = `<div class="mini-avatar">🤖</div><div class="mini-text">Thinking…</div>`;
    miniChat.appendChild(thinking);
    miniChat.scrollTop = miniChat.scrollHeight;

    try {
        const data = await apiRequest("/api/chat/send", {
            method: "POST",
            body: { message: text, session_id: miniSessionId },
        });
        miniSessionId = data.session_id;
        document.getElementById("miniThinking")?.remove();
        addMiniMsg(data.reply.content, "ai");
        loadStats();
    } catch (err) {
        document.getElementById("miniThinking")?.remove();
        addMiniMsg(`⚠️ ${err.message}`, "ai");
    }
}

miniSend?.addEventListener("click", sendMiniMessage);
miniInput?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMiniMessage();
});

loadStats();
loadActivity();
loadDashTasks();
