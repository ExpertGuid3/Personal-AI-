Auth.requireLogin();
document.getElementById("logoutBtn")?.addEventListener("click", e => {
    e.preventDefault();
    Auth.logout();
});

const taskList = document.getElementById("taskList");
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTaskBtn");
const banner = document.getElementById("todoBanner");

function renderTasks(tasks) {
    if (!tasks.length) {
        taskList.innerHTML = `<div class="empty-hint">No tasks yet — add your first one above.</div>`;
        return;
    }

    taskList.innerHTML = tasks
        .map(
            t => `
        <div class="task-row ${t.is_done ? "done" : ""}" data-id="${t.id}">
            <input type="checkbox" class="task-check" ${t.is_done ? "checked" : ""}>
            <span class="task-title"></span>
            <span class="priority-tag ${t.priority}">${t.priority}</span>
            <button class="task-delete"><i class="bi bi-trash"></i></button>
        </div>`
        )
        .join("");

    // set text safely (avoids HTML injection from task titles)
    taskList.querySelectorAll(".task-row").forEach((row, i) => {
        row.querySelector(".task-title").textContent = tasks[i].title;
    });

    taskList.querySelectorAll(".task-check").forEach(cb => {
        cb.addEventListener("change", async () => {
            const id = cb.closest(".task-row").dataset.id;
            try {
                await apiRequest(`/api/todos/${id}`, { method: "PUT", body: { is_done: cb.checked } });
                loadTasks();
            } catch (err) {
                showBanner(banner, err.message);
            }
        });
    });

    taskList.querySelectorAll(".task-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.closest(".task-row").dataset.id;
            try {
                await apiRequest(`/api/todos/${id}`, { method: "DELETE" });
                loadTasks();
            } catch (err) {
                showBanner(banner, err.message);
            }
        });
    });
}

async function loadTasks() {
    try {
        const data = await apiRequest("/api/todos");
        renderTasks(data.tasks);
    } catch (err) {
        showBanner(banner, err.message);
    }
}

addTaskBtn.addEventListener("click", async () => {
    const title = taskInput.value.trim();
    if (!title) return;

    addTaskBtn.disabled = true;
    try {
        await apiRequest("/api/todos", {
            method: "POST",
            body: { title, priority: taskPriority.value },
        });
        taskInput.value = "";
        loadTasks();
    } catch (err) {
        showBanner(banner, err.message);
    } finally {
        addTaskBtn.disabled = false;
    }
});

taskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addTaskBtn.click();
});

loadTasks();
