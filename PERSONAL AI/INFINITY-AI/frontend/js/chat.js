Auth.requireLogin();

const input = document.getElementById("message");
const sendBtn = document.getElementById("send");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const chatScroll = document.getElementById("chatScroll");
const newChatBtn = document.getElementById("newChat");
const sidebar = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebar");
const historyNav = document.getElementById("history");

let currentSessionId = null;

const user = Auth.getUser();
if (user) {
    document.getElementById("accountName").textContent = `${user.first_name} ${user.last_name}`;
}
document.getElementById("logoutMini")?.addEventListener("click", () => Auth.logout());

function timeNow() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

function showEmptyState(show) {
    emptyState.style.display = show ? "flex" : "none";
    emptyState.style.flexDirection = show ? "column" : "";
}

function addMessage(text, sender) {
    showEmptyState(false);

    const msg = document.createElement("div");
    msg.className = `msg msg-${sender}`;

    if (sender === "user") {
        msg.innerHTML = `
            <div class="msg-body">
                <div class="msg-text"></div>
                <div class="msg-time">${timeNow()}</div>
            </div>
        `;
    } else {
        msg.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div class="msg-body">
                <div class="msg-text"></div>
                <div class="msg-time">${timeNow()}</div>
            </div>
        `;
    }

    msg.querySelector(".msg-text").textContent = text;
    messagesEl.appendChild(msg);
    scrollToBottom();
    return msg;
}

function addTypingIndicator() {
    const msg = document.createElement("div");
    msg.className = "msg msg-ai";
    msg.id = "typingIndicator";
    msg.innerHTML = `
        <div class="msg-avatar thinking">🤖</div>
        <div class="msg-body">
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
    `;
    messagesEl.appendChild(msg);
    scrollToBottom();
}

function removeTypingIndicator() {
    document.getElementById("typingIndicator")?.remove();
}

function updateSendState() {
    sendBtn.classList.toggle("active", input.value.trim().length > 0);
}

function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
}

async function sendMessage(prefilledText) {
    const text = (prefilledText ?? input.value).trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";
    autoResize();
    updateSendState();
    addTypingIndicator();

    try {
        const data = await apiRequest("/api/chat/send", {
            method: "POST",
            body: { message: text, session_id: currentSessionId },
        });
        currentSessionId = data.session_id;
        removeTypingIndicator();
        addMessage(data.reply.content, "ai");
        loadSessions();
    } catch (err) {
        removeTypingIndicator();
        addMessage(`⚠️ ${err.message}`, "ai");
    }
}

sendBtn.addEventListener("click", () => sendMessage());

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

input.addEventListener("input", () => {
    autoResize();
    updateSendState();
});

document.querySelectorAll(".prompt-card").forEach(card => {
    card.addEventListener("click", () => {
        sendMessage(card.dataset.prompt);
    });
});

function startNewChat() {
    currentSessionId = null;
    messagesEl.innerHTML = "";
    input.value = "";
    autoResize();
    updateSendState();
    showEmptyState(true);
    document.querySelectorAll(".history-item").forEach(i => i.classList.remove("active"));
}

newChatBtn.addEventListener("click", startNewChat);

async function openSession(sessionId, itemEl) {
    currentSessionId = sessionId;
    document.querySelectorAll(".history-item").forEach(i => i.classList.remove("active"));
    itemEl?.classList.add("active");

    messagesEl.innerHTML = "";
    try {
        const data = await apiRequest(`/api/chat/history/${sessionId}`);
        if (!data.messages.length) {
            showEmptyState(true);
            return;
        }
        showEmptyState(false);
        data.messages.forEach(m => addMessage(m.content, m.role === "user" ? "user" : "ai"));
    } catch (err) {
        addMessage(`⚠️ ${err.message}`, "ai");
    }
}

async function loadSessions() {
    try {
        const data = await apiRequest("/api/chat/sessions");
        const emptyHint = document.getElementById("historyEmptyHint");

        historyNav.querySelectorAll(".history-item").forEach(el => el.remove());

        if (!data.sessions.length) {
            if (emptyHint) emptyHint.style.display = "block";
            return;
        }
        if (emptyHint) emptyHint.style.display = "none";

        data.sessions.forEach(s => {
            const item = document.createElement("div");
            item.className = "history-item" + (s.session_id === currentSessionId ? " active" : "");
            item.innerHTML = `<i class="bi bi-chat-left-text"></i><span></span>`;
            item.querySelector("span").textContent = s.title;
            item.addEventListener("click", () => openSession(s.session_id, item));
            historyNav.appendChild(item);
        });
    } catch (err) {
        console.error(err);
    }
}

toggleSidebarBtn.addEventListener("click", () => {
    if (window.innerWidth <= 900) {
        sidebar.classList.toggle("open");
    } else {
        sidebar.classList.toggle("collapsed");
    }
});

// initial state
updateSendState();
loadSessions();
