// Storage Keys & Simulation Constants
const STORAGE_KEY_NOTICES = 'CAMPUS_OFFLINE_NOTICES';
const STORAGE_KEY_LOGS = 'CAMPUS_OFFLINE_PACKET_LOGS';

let notices = [];
let packetLogs = [];
let isSimulationRunning = false;
let hopSpeedMs = 900;

// Node status state: true = online, false = offline
const nodeStates = { 'A': true, 'B': true, 'C': true };

const DEFAULT_SAMPLE_NOTICES = [
    {
        id: 'PKT-9481',
        title: 'Urgent: Heavy Rainfall & Campus Shuttle Advisory',
        message: 'Due to severe waterlogging on East Campus Road, all evening college shuttles are rerouted via North Gate. Afternoon lab evaluations for 5th Sem will conclude 30 mins early.',
        sender: 'Prof. Sarah Jenkins (HOD - CSE)',
        priority: 'Urgent',
        audience: 'All CSE Students',
        timestamp: 'Today, 11:30 AM',
        hops: 4,
        path: ['Teacher', 'Classroom A', 'Classroom B', 'Classroom C', 'Student Devices'],
        status: 'Delivered'
    },
    {
        id: 'PKT-7204',
        title: 'End-Semester Computer Networks Lab Exam Schedule',
        message: 'The final practical examination for Computer Networks Lab (5th Sem CSE) is scheduled on Friday at 9:30 AM in Lab 3. Bring verified rough records without fail.',
        sender: 'Dr. Robert Miller (Lab In-Charge)',
        priority: 'Normal',
        audience: '5th Semester CSE Only',
        timestamp: 'Yesterday, 03:15 PM',
        hops: 4,
        path: ['Teacher', 'Classroom A', 'Classroom B', 'Classroom C', 'Student Devices'],
        status: 'Delivered'
    },
    {
        id: 'PKT-5519',
        title: 'National Level Hackathon Internal Selection Call',
        message: 'Shortlisted teams for Smart India Hackathon internal round must assemble in Seminar Hall-1 by 2:00 PM with project posters and architecture diagrams.',
        sender: 'Prof. Ananya Rao (Innovation Cell)',
        priority: 'Normal',
        audience: 'All CSE Students',
        timestamp: '2 days ago',
        hops: 4,
        path: ['Teacher', 'Classroom A', 'Classroom B', 'Classroom C', 'Student Devices'],
        status: 'Delivered'
    }
];

const DEFAULT_SAMPLE_LOGS = [
    { time: '11:30:02 AM', id: 'PKT-9481', node: 'Teacher (Origin)', next: 'Classroom A', action: 'Packet injected into ad-hoc mesh', hops: '0', priority: 'Urgent', status: 'Queued' },
    { time: '11:30:03 AM', id: 'PKT-9481', node: 'Classroom A', next: 'Classroom B', action: 'Store-and-Forward hop relay', hops: '1', priority: 'Urgent', status: 'Relayed' },
    { time: '11:30:04 AM', id: 'PKT-9481', node: 'Classroom B', next: 'Classroom C', action: 'Opportunistic peer transfer', hops: '2', priority: 'Urgent', status: 'Relayed' },
    { time: '11:30:05 AM', id: 'PKT-9481', node: 'Classroom C', next: 'Student Terminals', action: 'Broadcast flood to local devices', hops: '3', priority: 'Urgent', status: 'Relayed' },
    { time: '11:30:06 AM', id: 'PKT-9481', node: 'Student Devices', next: 'Destination', action: 'Payload unpacked and cached locally', hops: '4', priority: 'Urgent', status: 'Delivered' }
];

document.addEventListener('DOMContentLoaded', () => {
    initStorage();
    initEventListeners();
    renderAllViews();
});

function initStorage() {
    const storedNotices = localStorage.getItem(STORAGE_KEY_NOTICES);
    notices = storedNotices ? JSON.parse(storedNotices) : [...DEFAULT_SAMPLE_NOTICES];
    saveNoticesToStorage();

    const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    packetLogs = storedLogs ? JSON.parse(storedLogs) : [...DEFAULT_SAMPLE_LOGS];
    saveLogsToStorage();
}

function saveNoticesToStorage() { localStorage.setItem(STORAGE_KEY_NOTICES, JSON.stringify(notices)); }
function saveLogsToStorage() { localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(packetLogs)); }

function resetDemoData() {
    if (confirm('Reset all notices and telemetry logs back to the default demo state?')) {
        notices = [...DEFAULT_SAMPLE_NOTICES];
        packetLogs = [...DEFAULT_SAMPLE_LOGS];
        saveNoticesToStorage();
        saveLogsToStorage();
        renderAllViews();
        showToast('System Reset', 'Demo data successfully reloaded.', '🔄');
    }
}

function initEventListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });

    document.getElementById('resetDemoBtn').addEventListener('click', resetDemoData);

    const speedSlider = document.getElementById('hopSpeedRange');
    const speedLabel = document.getElementById('speedValue');
    speedSlider.addEventListener('input', (e) => {
        hopSpeedMs = parseInt(e.target.value);
        speedLabel.textContent = `${hopSpeedMs}ms`;
    });

    document.getElementById('noticeForm').addEventListener('submit', handleNoticeSubmission);
    document.getElementById('searchFilter').addEventListener('input', renderStudentNotices);
    document.getElementById('priorityFilter').addEventListener('change', renderStudentNotices);

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('noticeModal')) closeModal();
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const activePanel = document.getElementById(tabId);
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    if (tabId === 'tab-students') {
        const unread = document.getElementById('unreadBadge');
        unread.textContent = '0';
        unread.style.display = 'none';
    }
}

function toggleNodeState(nodeKey) {
    nodeStates[nodeKey] = !nodeStates[nodeKey];
    const isOnline = nodeStates[nodeKey];
    const stateText = document.getElementById(`state-text-${nodeKey}`);
    const visualNode = document.getElementById(`visualNode${nodeKey}`);

    if (isOnline) {
        stateText.textContent = 'ONLINE';
        stateText.parentElement.style.color = '#15803d';
        visualNode.classList.remove('node-offline');
        showToast(`Classroom ${nodeKey}`, 'Node is now ONLINE and ready to relay.', '📶');
    } else {
        stateText.textContent = 'OFFLINE';
        stateText.parentElement.style.color = '#b91c1c';
        visualNode.classList.add('node-offline');
        showToast(`Classroom ${nodeKey}`, 'Node went OFFLINE. Buffering delay active.', '⚠️');
    }
}

async function handleNoticeSubmission(e) {
    e.preventDefault();
    if (isSimulationRunning) {
        alert('Simulation currently in progress. Please wait.');
        return;
    }

    const sender = document.getElementById('noticeSender').value.trim();
    const title = document.getElementById('noticeTitle').value.trim();
    const priority = document.getElementById('noticePriority').value;
    const audience = document.getElementById('targetAudience').value;
    const message = document.getElementById('noticeMessage').value.trim();

    if (!sender || !title || !message) return;

    const packetId = 'PKT-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newNotice = {
        id: packetId,
        title,
        message,
        sender,
        priority,
        audience,
        timestamp: `Today, ${timeFormatted}`,
        hops: 0,
        path: ['Teacher'],
        status: 'Transmitting'
    };

    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeMessage').value = '';

    switchTab('tab-overview');
    await runRelaySimulation(newNotice);
}

async function runRelaySimulation(notice) {
    isSimulationRunning = true;
    const broadcastBtn = document.getElementById('broadcastBtn');
    broadcastBtn.disabled = true;
    broadcastBtn.style.opacity = '0.6';

    const hudTitle = document.getElementById('hudNoticeTitle');
    const progressBar = document.getElementById('hopProgressBar');
    const progressText = document.getElementById('hopProgressText');
    const simPacket = document.getElementById('simPacket');
    const packetTag = document.getElementById('packetTag');

    hudTitle.textContent = `[${notice.id}] "${notice.title}"`;
    packetTag.textContent = notice.priority === 'Urgent' ? '⚡ URGENT' : 'DATA';
    if (notice.priority === 'Urgent') simPacket.classList.add('urgent-packet');
    else simPacket.classList.remove('urgent-packet');

    const hops = [
        { name: 'Teacher', elId: 'visualNodeTeacher', linkId: null, xPercent: 5 },
        { name: 'Classroom A', elId: 'visualNodeA', linkId: 'link-0-1', nodeKey: 'A', xPercent: 28 },
        { name: 'Classroom B', elId: 'visualNodeB', linkId: 'link-1-2', nodeKey: 'B', xPercent: 51 },
        { name: 'Classroom C', elId: 'visualNodeC', linkId: 'link-2-3', nodeKey: 'C', xPercent: 74 },
        { name: 'Student Devices', elId: 'visualNodeStudents', linkId: 'link-3-4', xPercent: 95 }
    ];

    simPacket.style.display = 'flex';
    simPacket.style.left = `${hops[0].xPercent}%`;

    addPacketLog(notice.id, 'Teacher (Origin)', 'Classroom A', 'Packet crafted & queued for transmission', 0, notice.priority, 'Queued');

    for (let i = 0; i < hops.length; i++) {
        const current = hops[i];
        const next = hops[i + 1];
        const currNodeEl = document.getElementById(current.elId);
        currNodeEl.classList.add('transmitting');

        if (current.nodeKey && !nodeStates[current.nodeKey]) {
            addPacketLog(notice.id, current.name, next ? next.name : 'Target', 'Node offline: buffering payload (Store & Wait)', i, notice.priority, 'Delayed');
            showToast('Store-and-Forward Active', `${current.name} offline. Buffering until link reconnects...`, '⏳');
            await sleep(hopSpeedMs * 1.5);
            addPacketLog(notice.id, current.name, next ? next.name : 'Target', 'Opportunistic link recovery: relayed', i, notice.priority, 'Relayed');
        }

        const percent = Math.round((i / (hops.length - 1)) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${i} / 4 Hops completed (${current.name})`;

        await sleep(hopSpeedMs);

        if (next) {
            const linkEl = document.getElementById(next.linkId);
            if (linkEl) linkEl.classList.add('active-link');
            simPacket.style.left = `${next.xPercent}%`;

            addPacketLog(notice.id, current.name, next.name, `Relayed payload to ${next.name} (Hop #${i + 1})`, i + 1, notice.priority, 'Relayed');
            notice.hops = i + 1;
            notice.path.push(next.name);

            await sleep(hopSpeedMs);
            if (linkEl) linkEl.classList.remove('active-link');
        }

        currNodeEl.classList.remove('transmitting');
        currNodeEl.classList.add('node-received');
    }

    notice.status = 'Delivered';
    notices.unshift(notice);
    saveNoticesToStorage();

    addPacketLog(notice.id, 'Student Devices', 'Destination', 'Notice unpacked & cached in local storage', 4, notice.priority, 'Delivered');

    playNotificationBeep(notice.priority === 'Urgent');
    showToast('Notice Delivered!', `"${notice.title}" reached student terminals.`, notice.priority === 'Urgent' ? '🚨' : '✅');
    incrementUnreadBadge();

    setTimeout(() => {
        hops.forEach(h => {
            const el = document.getElementById(h.elId);
            if (el) el.classList.remove('node-received');
        });
        simPacket.style.display = 'none';
        progressBar.style.width = '100%';
        progressText.textContent = 'Delivery Complete (4 / 4 Hops)';
    }, 2000);

    isSimulationRunning = false;
    broadcastBtn.disabled = false;
    broadcastBtn.style.opacity = '1';

    renderAllViews();
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function addPacketLog(id, node, next, action, hops, priority, status) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    packetLogs.unshift({ time, id, node, next, action, hops: hops.toString(), priority, status });
    if (packetLogs.length > 50) packetLogs.pop();
    saveLogsToStorage();
    renderPacketLogs();
}

function clearPacketLogs() {
    if (confirm('Clear all packet telemetry logs?')) {
        packetLogs = [];
        saveLogsToStorage();
        renderPacketLogs();
    }
}

function renderAllViews() {
    renderStats();
    renderTeacherHistory();
    renderStudentNotices();
    renderPacketLogs();
}

function renderStats() {
    document.getElementById('statTotalSent').textContent = notices.length;
    document.getElementById('statUrgentCount').textContent = notices.filter(n => n.priority === 'Urgent').length;
    document.getElementById('statDeliveredCount').textContent = notices.filter(n => n.status === 'Delivered').length;
    document.getElementById('statRelayedCount').textContent = packetLogs.filter(l => l.status === 'Relayed').length;
}

function renderTeacherHistory() {
    const container = document.getElementById('teacherHistoryList');
    if (!container) return;
    if (notices.length === 0) {
        container.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 2rem;">No notices dispatched yet.</div>';
        return;
    }
    container.innerHTML = notices.map(n => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-title">${escapeHtml(n.title)}</span>
                <span class="${n.priority === 'Urgent' ? 'badge-urgent' : 'badge-normal'}">${n.priority}</span>
            </div>
            <p class="history-preview">${escapeHtml(n.message)}</p>
            <div class="history-footer">
                <span class="history-time">🕒 ${n.timestamp}</span>
                <span class="notice-hops-chip">Hops: ${n.hops} | Delivered</span>
            </div>
        </div>
    `).join('');
}

function renderStudentNotices() {
    const container = document.getElementById('studentNoticesContainer');
    if (!container) return;
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;

    const filtered = notices.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchTerm) || n.message.toLowerCase().includes(searchTerm) || n.sender.toLowerCase().includes(searchTerm);
        const matchesPriority = priorityFilter === 'ALL' || n.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b;">
            <p style="font-size: 2rem; margin-bottom: 0.5rem;">📭</p>
            <strong>No notices found</strong>
        </div>`;
        return;
    }

    container.innerHTML = filtered.map(n => `
        <div class="notice-card ${n.priority === 'Urgent' ? 'urgent' : 'normal'}" onclick="openNoticeModal('${n.id}')">
            <div>
                <div class="notice-badge-row">
                    <span class="${n.priority === 'Urgent' ? 'badge-urgent' : 'badge-normal'}">
                        ${n.priority === 'Urgent' ? '🚨 URGENT NOTICE' : '📌 ROUTINE NOTICE'}
                    </span>
                    <span class="notice-timestamp">${n.timestamp}</span>
                </div>
                <h3 class="notice-headline">${escapeHtml(n.title)}</h3>
                <p class="notice-body-text">${escapeHtml(n.message)}</p>
            </div>
            <div class="notice-footer-meta">
                <span class="notice-sender">✍️ ${escapeHtml(n.sender)}</span>
                <span class="notice-hops-chip">📶 ${n.hops || 4} Hops</span>
            </div>
        </div>
    `).join('');
}

function renderPacketLogs() {
    const tbody = document.getElementById('packetLogBody');
    if (!tbody) return;
    if (packetLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #94a3b8; padding: 1.5rem;">No packet telemetry recorded yet.</td></tr>';
        return;
    }
    tbody.innerHTML = packetLogs.map(log => {
        let pillClass = 'pill-queued';
        if (log.status === 'Relayed') pillClass = 'pill-relayed';
        if (log.status === 'Delivered') pillClass = 'pill-delivered';
        if (log.status === 'Delayed') pillClass = 'pill-delayed';

        return `
            <tr>
                <td>${log.time}</td>
                <td><strong>${log.id}</strong></td>
                <td>${escapeHtml(log.node)}</td>
                <td>${escapeHtml(log.next)}</td>
                <td>${escapeHtml(log.action)}</td>
                <td>${log.hops}</td>
                <td><span style="color: ${log.priority === 'Urgent' ? '#ef4444' : '#10b981'}; font-weight: 600;">${log.priority}</span></td>
                <td><span class="status-pill ${pillClass}">${log.status}</span></td>
            </tr>
        `;
    }).join('');
}

function openNoticeModal(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (!notice) return;
    document.getElementById('modalTitle').innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${notice.priority === 'Urgent' ? '🚨' : '📌'}</span>
            <span>${escapeHtml(notice.title)}</span>
        </div>
    `;
    document.getElementById('modalBody').innerHTML = `
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.2rem; flex-wrap: wrap;">
            <span class="${notice.priority === 'Urgent' ? 'badge-urgent' : 'badge-normal'}">${notice.priority} Priority</span>
            <span class="tag-status">Target: ${escapeHtml(notice.audience || 'All Students')}</span>
            <span class="tag-status">Packet ID: ${notice.id}</span>
            <span class="tag-status">🕒 ${notice.timestamp}</span>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.2rem; margin-bottom: 1.5rem; line-height: 1.6; font-size: 0.95rem; color: #1e293b;">
            ${escapeHtml(notice.message)}
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
            <h4 style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase;">Ad-Hoc Network Relay Trace</h4>
            <div style="background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 0.8rem; padding: 0.75rem 1rem; border-radius: 6px;">
                ${(notice.path || ['Teacher', 'Classroom A', 'Classroom B', 'Classroom C', 'Students']).join(' ➔ ')}
            </div>
            <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.4rem;">
                Transmitted using Delay-Tolerant Store-and-Forward Mesh Protocol across ${notice.hops || 4} classroom physical hops.
            </p>
        </div>
    `;
    document.getElementById('noticeModal').style.display = 'flex';
}

function closeModal() { document.getElementById('noticeModal').style.display = 'none'; }

function showToast(title, message, icon = '🔔') {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    document.getElementById('toastIcon').textContent = icon;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
}

function incrementUnreadBadge() {
    const unread = document.getElementById('unreadBadge');
    let current = parseInt(unread.textContent) || 0;
    unread.textContent = current + 1;
    unread.style.display = 'inline-block';
}

function playNotificationBeep(isUrgent) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = isUrgent ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(isUrgent ? 880 : 587.33, ctx.currentTime);
        if (isUrgent) {
            osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
        } else {
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        }
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}