// ===== PERFECT FINAL ANTI-FLASH SYSTEM =====
(function () {
    try {
        var antiFlashStyle = document.createElement('style');
        antiFlashStyle.id = 'antiFlashStyle';

        antiFlashStyle.textContent = `
            #defaultBg{
    opacity:1 !important;
}

html.has-custom-bg #defaultBg{
    display:none !important;
}
        `;

        document.head.appendChild(antiFlashStyle);

        const hasBg =
            localStorage.getItem('ambientTab_hasBackground') === 'true';

        // 🔥 IMPORTANT CHANGE
        if (hasBg) {
            document.documentElement.classList.add('has-custom-bg');
        }
        // ❌ else remove completely (NO show-default-bg here)

    } catch (e) { }

    // Permanently purge legacy live wallpaper storage keys
    try {
        localStorage.removeItem('halo_live_wallpaper_url');
    } catch (e) { }
})();

// ===== CLOCK FUNCTIONALITY =====
// Auto-detect region and timezone
const timeEl = document.getElementById('clockTime');
const dateEl = document.getElementById('clockDate');
const zoneEl = document.getElementById('clockZone');
const analogCanvas = document.getElementById('analogClock');
const analogInfo = document.getElementById('analogClockInfo');

// Auto detect locale & timezone
const locale = navigator.language || 'en-US';
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Clock mode state
let clockMode = 'digital'; // 'digital' or 'analog'
let analogAnimationFrame = null;

// Digital clock style: 'default' | 'orbit' | 'dragon'
const CLOCK_STYLES = ['default', 'orbit', 'dragon'];
const CLOCK_STYLE_LABELS = { default: 'Default', orbit: 'Orbit', dragon: 'Dragon' };
const CLOCK_STYLE_KEY = 'ambientTab_clockStyle';
const CLOCK_STYLE_DEF_V3_KEY = 'halo_clock_style_v3_default';
let clockStyle = 'dragon'; // 3rd theme ('dragon' / Pirata One) is default
try {
    if (!localStorage.getItem(CLOCK_STYLE_DEF_V3_KEY)) {
        localStorage.setItem(CLOCK_STYLE_DEF_V3_KEY, '1');
        const currentSaved = localStorage.getItem(CLOCK_STYLE_KEY);
        if (!currentSaved || currentSaved === 'default') {
            localStorage.setItem(CLOCK_STYLE_KEY, 'dragon');
            clockStyle = 'dragon';
        }
    }
    const savedStyle = localStorage.getItem(CLOCK_STYLE_KEY);
    if (savedStyle && CLOCK_STYLES.indexOf(savedStyle) !== -1) {
        clockStyle = savedStyle;
    } else {
        clockStyle = 'dragon';
    }
} catch (e) { }

// Load clock mode from localStorage
function loadClockMode() {
    const saved = localStorage.getItem('ambientTab_clockMode');
    if (saved === 'analog' || saved === 'digital') {
        clockMode = saved;
    } else {
        clockMode = 'digital'; // default
    }
    applyClockMode();
}

// Save clock mode
function saveClockMode() {
    localStorage.setItem('ambientTab_clockMode', clockMode);
}

// Apply current clock mode (toggle visibility)
function applyClockMode() {
    const digitalBox = document.querySelector('.clock-box');
    const styleArrow = document.getElementById('clockFontBtn');
    if (styleArrow) styleArrow.style.display = clockMode === 'digital' ? '' : 'none';
    if (clockMode === 'digital') {
        digitalBox.style.display = 'flex';
        analogCanvas.style.display = 'none';
        analogInfo.style.display = 'none';
        if (analogAnimationFrame) {
            cancelAnimationFrame(analogAnimationFrame);
            analogAnimationFrame = null;
        }
        // Update digital time immediately
        updateClock();
    } else {
        digitalBox.style.display = 'none';
        analogCanvas.style.display = 'block';
        analogInfo.style.display = 'block';
        startAnalogClock();
    }
}

// Toggle clock mode
function toggleClockMode() {
    clockMode = clockMode === 'digital' ? 'analog' : 'digital';
    saveClockMode();
    applyClockMode();
    showToast(`Clock switched to ${clockMode} mode`, 'info');
}

// Draw analog clock (premium modern style)
function drawAnalogClock() {
    const now = new Date();
    const ctx = analogCanvas.getContext('2d');
    const width = analogCanvas.width;
    const height = analogCanvas.height;
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    // Determine theme colors
    const isLight = document.body.classList.contains('light-theme');
    const handColor = isLight ? '#222' : '#fff';
    const markerColor = isLight ? '#333' : '#ddd';
    const secondHandColor = '#f97316'; // warm orange
    const dialStrokeColor = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const dialFillColor = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw dial face (very subtle fill)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = dialFillColor;
    ctx.fill();
    ctx.strokeStyle = dialStrokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw hour markers (12 dots)
    for (let i = 0; i < 12; i++) {
        const angle = i * 30 * Math.PI / 180 - Math.PI / 2;
        const x = centerX + (radius - 6) * Math.cos(angle);
        const y = centerY + (radius - 6) * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = markerColor;
        ctx.fill();
    }

    // Get time
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Hour hand (thick, with slight rounding)
    const hourAngle = (hours * 30 + minutes * 0.5 + seconds * 0.5 / 60) * Math.PI / 180 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * 0.5 * Math.cos(hourAngle), centerY + radius * 0.5 * Math.sin(hourAngle));
    ctx.strokeStyle = handColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Minute hand (medium)
    const minuteAngle = (minutes * 6 + seconds * 0.1) * Math.PI / 180 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * 0.7 * Math.cos(minuteAngle), centerY + radius * 0.7 * Math.sin(minuteAngle));
    ctx.strokeStyle = handColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Second hand (thin, smooth, accent color)
    const secondAngle = (seconds * 6 + milliseconds * 0.006) * Math.PI / 180 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * 0.8 * Math.cos(secondAngle), centerY + radius * 0.8 * Math.sin(secondAngle));
    ctx.strokeStyle = secondHandColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = handColor;
    ctx.fill();

    // Update analog info (date and timezone)
    setAnalogInfo(getAnalogInfoText(now));
}

function startAnalogClock() {
    function update() {
        drawAnalogClock();
        analogAnimationFrame = requestAnimationFrame(update);
    }
    update();
}

function updateClock() {
    const now = new Date();

    // Time (HH:MM:SS – auto 12/24h based on user's locale)
    const timeFormatter = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone
    });
    const plainTime = timeFormatter.format(now);

    if (clockStyle === 'default') {
        // Original clock – untouched
        timeEl.textContent = plainTime;
    } else {
        // Orbit / Dragon: styled "face" drawn over a hidden default-size sizer,
        // so the clock box keeps the exact same width & height as the default.
        const wrapDigits = (str) => Array.from(str).map(ch => '<span class="d">' + escapeHtml(ch) + '</span>').join('');
        let seenMinute = false;
        let timeHtml = '';
        timeFormatter.formatToParts(now).forEach(part => {
            const v = part.value;
            if (part.type === 'hour') {
                timeHtml += wrapDigits(v);
            } else if (part.type === 'minute') {
                seenMinute = true;
                timeHtml += wrapDigits(v);
            } else if (part.type === 'second') {
                timeHtml += '<span class="clock-sec">' + wrapDigits(v) + '</span>';
            } else if (part.type === 'dayPeriod') {
                timeHtml += '<span class="clock-ampm">' + escapeHtml(v.trim()) + '</span>';
            } else if (part.type === 'literal') {
                if (v.indexOf(':') !== -1) {
                    timeHtml += '<span class="clock-colon' + (seenMinute ? ' clock-colon-sec' : '') + '">:</span>';
                }
            } else {
                timeHtml += wrapDigits(v);
            }
        });
        timeEl.innerHTML =
            '<span class="clock-sizer" aria-hidden="true">' + escapeHtml(plainTime) + '</span>' +
            '<span class="clock-face" data-style="' + clockStyle + '">' + timeHtml + '</span>';
        fitClockFace();
    }

    // Date + Day + Year (written form)
    const dateStr = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone
    }).format(now);

    // Timezone display
    const zoneStr = timeZone.replace('_', ' ');

    // Date & timezone follow the selected clock style (same box size as default)
    setClockText(dateEl, dateStr);
    setClockText(zoneEl, zoneStr);
}

// Default style = plain text (original). Orbit / Dragon = styled face over a hidden sizer.
function setClockText(el, text) {
    if (!el) return true;
    if (clockStyle === 'default') {
        el.textContent = text;
        return true;
    }
    el.innerHTML =
        '<span class="clock-sizer" aria-hidden="true">' + escapeHtml(text) + '</span>' +
        '<span class="clock-face clock-face-text" data-text-style="' + clockStyle + '">' + escapeHtml(text) + '</span>';
    return fitClockFace(el);
}

// ----- Analog clock: day / date / location text follows the same style as digital -----
let analogInfoKey = '';

function getAnalogInfoText(now) {
    return `${new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)} • ${timeZone.replace('_', ' ')}`;
}

// Redraws only when text/style changed (analog draws every frame), or when forced
function setAnalogInfo(text, force) {
    if (!analogInfo) return;
    const key = clockStyle + '|' + text;
    if (!force && key === analogInfoKey && analogInfo.dataset.fitted === '1') return;
    analogInfoKey = key;
    // fitted stays empty while the analog clock is hidden, so it re-fits when it becomes visible
    analogInfo.dataset.fitted = setClockText(analogInfo, text) ? '1' : '';
}

// Shrink a styled face (never enlarge) so it is never wider than the default text
function fitClockFace(root) {
    root = root || timeEl;
    const face = root.querySelector('.clock-face');
    const sizer = root.querySelector('.clock-sizer');
    if (!face || !sizer) return true;
    face.style.setProperty('--fit', '1');
    const avail = sizer.offsetWidth;
    const natural = face.offsetWidth;
    const scale = natural > avail && natural > 0 && avail > 0 ? avail / natural : 1;
    face.style.setProperty('--fit', scale.toFixed(3));
    return avail > 0; // false when the element is hidden (not measurable yet)
}

function updateClockStyleButton() {
    const btn = document.getElementById('clockFontBtn');
    if (!btn) return;
    const next = CLOCK_STYLES[(CLOCK_STYLES.indexOf(clockStyle) + 1) % CLOCK_STYLES.length];
    btn.title = 'Clock style: ' + CLOCK_STYLE_LABELS[clockStyle] + ' — click for ' + CLOCK_STYLE_LABELS[next];
}

// After a style switch, re-fit once the web font has really loaded and layout has settled.
// (On the first switch the font may not be downloaded yet, so the first fit used fallback metrics.)
function refitClockAfterFontLoad() {
    const refit = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fitClockFace(timeEl);
                fitClockFace(dateEl);
                fitClockFace(zoneEl);
                setAnalogInfo(getAnalogInfoText(new Date()), true);
            });
        });
    };

    if (document.fonts && document.fonts.load && document.fonts.ready) {
        // document.fonts.ready alone can resolve before the download has even started,
        // so explicitly request the active style's font(s) with the text actually shown.
        const specs = clockStyle === 'orbit' ? ['500 1em Orbitron', '600 1em Orbitron']
            : clockStyle === 'dragon' ? ['1em "Pirata One"']
                : [];
        const sample = (timeEl.textContent + ' ' + dateEl.textContent + ' ' + zoneEl.textContent).trim() || ' ';
        Promise.all(specs.map(spec => document.fonts.load(spec, sample)))
            .then(() => document.fonts.ready)
            .then(refit)
            .catch(refit);
    } else {
        refit();
    }
}

function cycleClockStyle() {
    clockStyle = CLOCK_STYLES[(CLOCK_STYLES.indexOf(clockStyle) + 1) % CLOCK_STYLES.length];
    try { localStorage.setItem(CLOCK_STYLE_KEY, clockStyle); } catch (e) { }
    updateClockStyleButton();
    updateClock();
    setAnalogInfo(getAnalogInfoText(new Date()), true);   // analog day/date/location changes together
    refitClockAfterFontLoad();
}

(function initClockStyleSwitcher() {
    const btn = document.getElementById('clockFontBtn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleClockStyle();
        });
    }
    updateClockStyleButton();
    refitClockAfterFontLoad();
    // re-fit once web fonts finish loading, and when the screen size changes
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            if (clockMode === 'digital') {
                updateClock();
                refitClockAfterFontLoad();
            }
        });
    }
    window.addEventListener('resize', () => {
        if (clockMode === 'digital') updateClock();
        else setAnalogInfo(getAnalogInfoText(new Date()), true);
    });
})();

// ===== VERSION CONSTANT =====
const APP_VERSION = '1.1.1';

// ===== REVIEW POPUP START =====
// Review popup logic – appears 3 days after first install
const INSTALL_TIME_KEY = 'halo_install_time';
const REVIEW_DONE_KEY = 'halo_review_done';
const REVIEW_STORE_URL = 'https://chromewebstore.google.com/detail/halo-new-tab-dashboard/kifggjjndifjphaldpnilgieghlhelpc';

// Initialize installation timestamp if not present
function initReviewPopup() {
    if (!localStorage.getItem(INSTALL_TIME_KEY)) {
        localStorage.setItem(INSTALL_TIME_KEY, Date.now().toString());
    }
}

// Check if popup should be shown
function shouldShowReviewPopup() {
    const installTime = localStorage.getItem(INSTALL_TIME_KEY);
    const reviewDone = localStorage.getItem(REVIEW_DONE_KEY) === 'true';

    if (!installTime || reviewDone) return false;

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    return (now - parseInt(installTime, 10)) >= threeDaysMs;
}

// Show the popup and attach event handlers
function showReviewPopup() {
    const popup = document.getElementById('reviewPopup');
    if (!popup) return;

    // Prevent duplicate listeners
    if (popup.dataset.listenersAttached === 'true') return;

    popup.classList.add('active');

    const reviewNowBtn = popup.querySelector('.review-btn-primary');
    const cancelBtn = popup.querySelector('.review-btn-secondary');

    const handleReviewDone = () => {
        localStorage.setItem(REVIEW_DONE_KEY, 'true');
        popup.classList.remove('active');
    };

    const handleReviewNow = () => {
        window.open(REVIEW_STORE_URL, '_blank');
        handleReviewDone();
    };

    const handleCancel = () => {
        handleReviewDone();
    };

    if (reviewNowBtn) {
        reviewNowBtn.removeEventListener('click', handleReviewNow);
        reviewNowBtn.addEventListener('click', handleReviewNow);
    }
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', handleCancel);
        cancelBtn.addEventListener('click', handleCancel);
    }

    popup.dataset.listenersAttached = 'true';
}
// ===== REVIEW POPUP END =====

// ===== HELPER: Update HTML classes for default/custom background (fix for removal flash) =====
function updateHtmlBgClass(hasCustomBackground) {
    const html = document.documentElement;
    if (hasCustomBackground) {
        html.classList.remove('show-default-bg');
        html.classList.add('has-custom-bg');
    } else {
        html.classList.remove('has-custom-bg');
        html.classList.add('show-default-bg');
    }
}

// ===== BACKGROUND FLAGS HELPERS (anti-flash) =====
function setBackgroundFlags(type) {
    localStorage.setItem('ambientTab_hasBackground', 'true');
    localStorage.setItem('ambientTab_bgType', type);
    updateHtmlBgClass(true);
}

function clearBackgroundFlags() {
    localStorage.removeItem('ambientTab_hasBackground');
    localStorage.removeItem('ambientTab_bgType');
    updateHtmlBgClass(false);
}

function syncBackgroundFlagsWithExisting() {
    // Called after loading background from DB to ensure flags match actual state
    const hasVideo = video.classList.contains('video-active');
    const hasPhoto = photo.classList.contains('photo-active');
    if (hasVideo || hasPhoto) {
        const type = hasVideo ? 'video' : 'photo';
        setBackgroundFlags(type);
    } else {
        clearBackgroundFlags();
    }
}

// ===== TODO FUNCTIONALITY (Integrated from todo.html) =====
// DOM Elements
const todoInput = document.getElementById('todoInput');
const todoListContainer = document.getElementById('todoListContainer');
const todoCount = document.getElementById('todoCount');

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem('ambientTab_tasks')) || [];

// Initialize
function initTodo() {
    renderTasks();
    updateCount();
    // Clear todo input on load to prevent autofill leak
    if (todoInput) todoInput.value = '';
}

// Render all tasks
function renderTasks() {
    todoListContainer.innerHTML = '';

    if (tasks.length === 0) {
        todoListContainer.innerHTML = `
                    <div class="empty-tasks">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No tasks yet. Add one above!</p>
                    </div>
                `;
        return;
    }

    tasks.forEach((task, index) => {
        const taskElement = createTaskElement(task, index + 1);
        todoListContainer.appendChild(taskElement);
    });
}

// Create task element
function createTaskElement(task, taskNumber) {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskItem.dataset.id = task.id;

    taskItem.innerHTML = `
                <div class="task-number">${taskNumber}</div>
                <div class="task-text">${escapeHtml(task.text)}</div>
                <button class="task-delete" title="Delete task">
                    <i class="fas fa-times"></i>
                </button>
            `;

    // Add click events
    const deleteBtn = taskItem.querySelector('.task-delete');
    const taskText = taskItem.querySelector('.task-text');

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
    });

    // Toggle complete on click
    taskText.addEventListener('click', () => {
        toggleTaskComplete(task.id);
    });

    // Task number click also toggles complete
    taskItem.querySelector('.task-number').addEventListener('click', () => {
        toggleTaskComplete(task.id);
    });

    return taskItem;
}

// Add new task
function addTask() {
    const text = todoInput.value.trim();

    if (text === '') {
        // Show error animation
        todoInput.style.boxShadow = '0 0 0 2px rgba(255, 107, 107, 0.3)';
        setTimeout(() => {
            todoInput.style.boxShadow = '';
        }, 500);
        return;
    }

    // Create task object
    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Add to beginning of array
    tasks.unshift(newTask);

    // Save to localStorage
    saveTasks();

    // Clear input
    todoInput.value = '';

    // Update UI
    renderTasks();
    updateCount();

    // Scroll to top
    todoListContainer.scrollTop = 0;
}

// Delete task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
    updateCount();
}

// Toggle task completion
function toggleTaskComplete(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    saveTasks();
    renderTasks();
}

// Update task count
function updateCount() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;

    if (completed > 0) {
        todoCount.textContent = `${completed}/${total}`;
    } else {
        todoCount.textContent = total;
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('ambientTab_tasks', JSON.stringify(tasks));
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== EXISTING BACKGROUND AND MEDIA CODE =====

// DOM Elements
const defaultBg = document.getElementById('defaultBg');
const video = document.getElementById('bgVideo');
const photo = document.getElementById('bgPhoto');
const muteBtn = document.getElementById('bgMuteBtn');
const overlay = document.getElementById('overlay');
const uploadBtn = document.getElementById('uploadBgBtn');
const removeBtn = document.getElementById('removeBgBtn');
const uploadInput = document.getElementById('bgUploadInput');
const uploadModal = document.getElementById('bgUploadModal');
const mediaPreview = document.getElementById('mediaPreview');
const imagePreview = document.getElementById('imagePreview');
const mediaPreviewPlaceholder = document.getElementById('mediaPreviewPlaceholder');
const uploadZone = document.getElementById('uploadZone');
const cancelBtn = document.getElementById('cancelBgBtn');
const confirmBtn = document.getElementById('confirmBgBtn');
const mediaError = document.getElementById('mediaError');
const fileRequirements = document.getElementById('fileRequirements');
const mediaTabs = document.querySelectorAll('.media-tab');
const videoResolutionInfo = document.getElementById('videoResolutionInfo');
const resolutionValue = document.getElementById('resolutionValue');
const fileSizeValue = document.getElementById('fileSizeValue');

// Ambient Control Elements
const playPauseBtn = document.querySelector('.play-pause-btn');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const volumeDownBtn = document.querySelector('.volume-down-btn');
const volumeUpBtn = document.querySelector('.volume-up-btn');
const nowPlaying = document.querySelector('.now-playing');

// ===== NEW ELEMENTS FOR RIGHT PANEL =====
const bgSpeakerBtn = document.getElementById('bgSpeakerBtn');
const bgRemoveBtn = document.getElementById('bgRemoveBtn');

// ===== NEW ELEMENTS FOR CUSTOMIZE / HIDE BOXES =====
const customizeBtn = document.getElementById('customizeBtn');
const customizeSub = document.getElementById('customizeSubButtons');
const hideBoxesBtn = document.getElementById('hideBoxesBtn');
const hideBoxesModal = document.getElementById('hideBoxesModal');
const cancelHideBoxesBtn = document.getElementById('cancelHideBoxesBtn');
const confirmHideBoxesBtn = document.getElementById('confirmHideBoxesBtn');
const widgetToggleList = document.getElementById('widgetToggleList');
const clockQuotePopup = document.getElementById('clockQuotePopup');

// ===== CLOCK MODE BUTTON =====
const clockModeBtn = document.getElementById('clockModeBtn');

// ===== PIN CONTROL BAR BUTTON (static / auto-hide toggle) =====
const pinControlsBtn = document.getElementById('pinControlsBtn');
const CONTROLS_PINNED_KEY = 'halo_controls_pinned';
let controlsPinned = false;

function setControlsPinned(pinned, save = true) {
    controlsPinned = !!pinned;
    document.body.classList.toggle('controls-pinned', controlsPinned);
    if (!controlsPinned) {
        // When unpinned, immediately schedule auto-hide if mouse isn't hovering
        if (typeof hideControls === 'function') {
            hideControls(300);
        }
    }
    if (pinControlsBtn) {
        pinControlsBtn.classList.toggle('active', controlsPinned);
        pinControlsBtn.title = controlsPinned
            ? 'Unpin Control Bar (auto-hide)'
            : 'Pin Control Bar (keep it visible)';
    }
    if (save) {
        try { localStorage.setItem(CONTROLS_PINNED_KEY, controlsPinned ? 'true' : 'false'); } catch (e) { }
    }
}

// Ensure auto-hide is default: clear any stale/accidental pin state from older sessions once
try {
    if (!localStorage.getItem('halo_panel_autohide_fixed_v1')) {
        localStorage.removeItem(CONTROLS_PINNED_KEY);
        localStorage.setItem('halo_panel_autohide_fixed_v1', 'true');
    }
} catch (e) { }

// Restore saved pin state (defaults to false for clean auto-hide)
try {
    setControlsPinned(localStorage.getItem(CONTROLS_PINNED_KEY) === 'true', false);
} catch (e) { }

// ===== REPLACE LINK MODAL ELEMENTS =====
const replaceLinkModal = document.getElementById('replaceLinkModal');
const cancelReplaceLinkBtn = document.getElementById('cancelReplaceLinkBtn');
const confirmReplaceLinkBtn = document.getElementById('confirmReplaceLinkBtn');

// ===== DELETE CONFIRM MODAL ELEMENTS =====
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// ===== EDIT QUICK LINKS BUTTON =====
const editQuickLinksBtn = document.getElementById('editQuickLinksBtn');

let selectedFile = null;
let currentMediaType = 'video'; // 'video' or 'photo'
let hideControlsTimeout = null;
let isPlaying = false;
let currentVolume = 80;
let videoQualityOptimized = false;
let isRemovingBackground = false; // Guard flag to prevent infinite error loop

// ===== VISIBILITY STATE =====
let widgetVisibility = {
    clock: true,
    weather: true,
    todo: true,
    links: true,
    notes: true,
    media: true,
    calendar: false, // iOS-style calendar widget — hidden by default, unhide via eye toggle
    photoWidget: false, // iOS 26/27-style photo widget — hidden by default, unhide via eye toggle
    pomodoro: true,
    dailyFocus: true,
    quoteCapsule: true
};
const widgetIds = ['clock', 'weather', 'todo', 'links', 'notes', 'media', 'calendar', 'photoWidget', 'pomodoro', 'dailyFocus', 'quoteCapsule']; // Used for hide boxes

// ===== VOLUME FEEDBACK STATE =====
let volumeUpDelta = 0;
let volumeDownDelta = 0;
let volumeUpFeedbackTimeout = null;
let volumeDownFeedbackTimeout = null;

// IndexedDB setup
const DB_NAME = 'AmbientTabDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';
let db = null;

// Video optimization settings - UPDATED FOR 1080p/4K support
const MAX_1080P_RESOLUTION = 1920 * 1080; // 1080p resolution limit
const MAX_4K_RESOLUTION = 3840 * 2160;    // 4K resolution limit
const MAX_VIDEO_FILE_SIZE = 150 * 1024 * 1024; // 150MB for videos
const MAX_PHOTO_FILE_SIZE = 10 * 1024 * 1024; // 10MB for photos
const MAX_DURATION_1080P = 60;   // 60 seconds for 1080p or below
const MAX_DURATION_4K = 30;      // 30 seconds for above 1080p up to 4K
const OPTIMIZED_CODECS = ['avc1.42E01E', 'avc1.4D401E', 'vp09.00.10.08'];

// ===== TOAST NOTIFICATION SYSTEM (PREMIUM UPGRADE) =====
const toastContainer = document.getElementById('toastContainer');
let activeToasts = [];

function showToast(message, type = 'info', duration = 3000) {
    // Deduplication: check if identical toast is already visible
    const existing = activeToasts.find(t => t.message === message && t.type === type);
    if (existing) {
        // Reset timer for existing toast
        clearTimeout(existing.timeout);
        existing.timeout = setTimeout(() => hideToast(existing.id), duration);
        return;
    }

    const id = String(Date.now()) + String(Math.random());
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = `toast-${id}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-exclamation-circle';
    else if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close">
          <i class="fas fa-times"></i>
        </button>
      `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        hideToast(id);
    });

    // Trigger reflow for animation
    setTimeout(() => toast.classList.add('show'), 10);

    const toastObj = {
        id: id,
        message: message,
        type: type,
        element: toast,
        timeout: setTimeout(() => hideToast(id), duration)
    };

    activeToasts.push(toastObj);
}

window.hideToast = function (id) {
    const toastObj = activeToasts.find(t => t.id == id);
    if (!toastObj) return;

    const toast = toastObj.element;
    toast.classList.remove('show');

    setTimeout(() => {
        if (toast.parentNode) toast.remove();
        activeToasts = activeToasts.filter(t => t.id != id);
    }, 300);

    clearTimeout(toastObj.timeout);
};

// Initialize IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };

        request.onerror = function (event) {
            console.error('Error opening IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Save background to IndexedDB (supports optional item ID, defaults to 1 for legacy)
async function saveBackgroundToDB(file, type, id) {
    id = id || 1;
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const bgData = {
                id: id,
                type: type,
                data: event.target.result,
                mimeType: file.type,
                name: file.name,
                timestamp: Date.now()
            };

            const request = store.put(bgData);

            request.onsuccess = () => {
                console.log('Background saved successfully (id=' + id + ')');
                resolve(bgData);
            };

            request.onerror = (e) => {
                console.error('IndexedDB put failed', e);
                reject(e);
            };
        };

        reader.onerror = (e) => reject(e);

        reader.readAsArrayBuffer(file);
    });
}

// Load background from IndexedDB (supports item ID, defaults to 1)
async function loadBackgroundFromDB(id) {
    id = id || 1;
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(null);
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = function (event) {
            const bgData = event.target.result;
            if (bgData) {
                resolve(bgData);
            } else {
                resolve(null);
            }
        };

        request.onerror = function (event) {
            console.error('Error loading from IndexedDB:', event.target.error);
            resolve(null);
        };
    });
}

// Remove background from IndexedDB (optional ID: if passed deletes that ID, else deletes 1)
async function removeBackgroundFromDB(id) {
    id = id || 1;
    return new Promise((resolve) => {
        if (!db) {
            resolve();
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = function () {
            resolve();
        };

        request.onerror = function () {
            resolve();
        };
    });
}

// Clean up video/photo error handlers before clearing src
function cleanupMediaErrorHandlers() {
    // Remove error handlers to prevent them from firing when we clear src
    video.onerror = null;
    photo.onerror = null;
}

// Set up video error handler
function setupVideoErrorHandler() {
    video.onerror = function () {
        // Don't trigger if we're in the middle of removing background
        if (isRemovingBackground) return;

        // Check if src is empty or invalid
        if (!video.src || video.src === '' || video.src === 'blob:' || video.src === window.location.href) {
            return;
        }

        // Clean up any failed custom wallpaper URL
        try { localStorage.removeItem('halo_live_wallpaper_url'); } catch (e) { }
        try {
            var rawActive = localStorage.getItem('halo_active_wallpaper');
            if (rawActive) {
                var wp = JSON.parse(rawActive);
                if (wp && wp.type === 'video') localStorage.removeItem('halo_active_wallpaper');
            }
        } catch (e) { }

        // Graceful fallback to default background (never force bg.mp4)
        if (!isRemovingBackground) {
            removeBackground();
        }
    };
}

// Set up photo error handler
function setupPhotoErrorHandler() {
    photo.onerror = function () {
        // Don't trigger if we're in the middle of removing background
        if (isRemovingBackground) return;

        // Check if src is empty or invalid
        if (!photo.src || photo.src === '' || photo.src === 'blob:' || photo.src === window.location.href) {
            return;
        }

        // Only call removeBackground if not already removing
        if (!isRemovingBackground) {
            removeBackground();
        }
    };
}

// ===== HELPER: Update visibility of speaker/remove buttons based on current background =====
function updateBackgroundControlsVisibility() {
    const hasVideo = video.classList.contains('video-active');
    const hasPhoto = photo.classList.contains('photo-active');
    const hasAnyBackground = hasVideo || hasPhoto;

    // Remove button: visible if ANY background is active
    if (bgRemoveBtn) {
        bgRemoveBtn.style.display = hasAnyBackground ? 'flex' : 'none';
    }

    // Speaker button: permanently hidden – mute/unmute moved to Ambient Control
    if (bgSpeakerBtn) {
        bgSpeakerBtn.style.display = 'none';
    }
}

function applyVideoBackground(src) {
    if (photo) {
        photo.removeAttribute('src');
        photo.classList.remove('photo-active');
    }
    if (defaultBg) defaultBg.style.display = 'none';

    if (video) {
        video.src = src;
        video.muted = true;
        video.volume = 0;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('loop', '');
        video.classList.add('video-active');
        setupVideoErrorHandler();
        optimizeVideoPlayback();
        video.play().catch(function (err) {
            console.log('Video autoplay prevented, waiting for interaction:', err);
            document.addEventListener('click', function tryPlay() {
                video.play().catch(function () { });
                document.removeEventListener('click', tryPlay);
            }, { once: true });
        });
    }
    if (removeBtn) removeBtn.classList.add('bg-active');
    if (bgRemoveBtn) bgRemoveBtn.style.display = 'flex';
    setBackgroundFlags('video');
}

function applyPhotoBackground(src) {
    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.classList.remove('video-active');
    }
    if (defaultBg) defaultBg.style.display = 'none';

    if (photo) {
        photo.src = src;
        photo.classList.add('photo-active');
        setupPhotoErrorHandler();
    }
    if (removeBtn) removeBtn.classList.add('bg-active');
    if (bgRemoveBtn) bgRemoveBtn.style.display = 'flex';
    setBackgroundFlags('photo');
}

// Load saved background from DB or localStorage
async function loadSavedBackground() {
    try {
        var activeWp = null;
        try {
            var rawActive = localStorage.getItem('halo_active_wallpaper');
            if (rawActive) activeWp = JSON.parse(rawActive);
        } catch (e) { }

        // If no active wallpaper set, default to Black and White live wallpaper!
        if (!activeWp) {
            activeWp = {
                id: 'wp_black_and_white',
                url: 'Black and white.mp4',
                type: 'video',
                title: 'Black & White'
            };
            try {
                localStorage.setItem('halo_active_wallpaper', JSON.stringify(activeWp));
            } catch (e) { }
        }

        // If default photo explicitly chosen
        if (activeWp.id === 'default' || activeWp.id === 'wp_default_photo' || activeWp.url === 'bg.jpg') {
            clearBackgroundFlags();
            document.documentElement.classList.add('show-default-bg');
            if (defaultBg) defaultBg.style.display = 'block';
            updateBackgroundControlsVisibility();
            return;
        }

        // Active wallpaper from DB by item ID
        if (activeWp.source === 'db' && activeWp.id) {
            const bgData = await loadBackgroundFromDB(activeWp.id);
            if (bgData) {
                const blob = new Blob([bgData.data], { type: bgData.mimeType });
                const blobUrl = URL.createObjectURL(blob);
                if (bgData.type === 'video') applyVideoBackground(blobUrl);
                else applyPhotoBackground(blobUrl);
                updateBackgroundControlsVisibility();
                return;
            }
        }

        // Active wallpaper from URL or bundled extension asset
        var activeUrl = resolveMediaUrl(activeWp.url);
        var activeType = activeWp.type;

        if (activeUrl && activeType === 'video') {
            applyVideoBackground(activeUrl);
        } else if (activeUrl && activeType === 'photo') {
            applyPhotoBackground(activeUrl);
        } else {
            clearBackgroundFlags();
            document.documentElement.classList.add('show-default-bg');
            if (defaultBg) defaultBg.style.display = 'block';
        }
        updateBackgroundControlsVisibility();
    } catch (error) {
        console.error('Error loading background:', error);
        clearBackgroundFlags();
        if (defaultBg) defaultBg.style.display = 'block';
    }
}

// Optimize video playback performance
function optimizeVideoPlayback() {
    if (!video.src || videoQualityOptimized) return;

    video.playsInline = true;
    video.muted = true;
    video.volume = 0;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.loop = true;

    video.style.transform = 'translateZ(0)';
    video.style.backfaceVisibility = 'hidden';
    video.style.perspective = '1000px';

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Ambient Background',
            artist: 'Ambient Tab',
        });
    }

    videoQualityOptimized = true;
    console.log('Video playback optimized for performance');
}

// Check video resolution and return appropriate info
function checkVideoResolution(videoElement) {
    return new Promise((resolve) => {
        if (!videoElement.videoWidth || !videoElement.videoHeight) {
            videoElement.onloadedmetadata = function () {
                const width = videoElement.videoWidth;
                const height = videoElement.videoHeight;
                const resolution = width * height;
                let category = '';
                if (resolution <= MAX_1080P_RESOLUTION) {
                    category = '1080p';
                } else if (resolution <= MAX_4K_RESOLUTION) {
                    category = '4K';
                } else {
                    category = 'above4K';
                }
                resolve({
                    width: width,
                    height: height,
                    resolution: resolution,
                    category: category
                });
            };
        } else {
            const width = videoElement.videoWidth;
            const height = videoElement.videoHeight;
            const resolution = width * height;
            let category = '';
            if (resolution <= MAX_1080P_RESOLUTION) {
                category = '1080p';
            } else if (resolution <= MAX_4K_RESOLUTION) {
                category = '4K';
            } else {
                category = 'above4K';
            }
            resolve({
                width: width,
                height: height,
                resolution: resolution,
                category: category
            });
        }
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== SIDE PANEL (VERTICAL CONTROLS) AUTO-HIDE SYSTEM =====
function showControls() {
    if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
        hideControlsTimeout = null;
    }
    document.body.classList.add('show-bg-controls');
}

function hideControls(delay = 350) {
    if (controlsPinned) return;

    // Do not hide if the transparency settings popup is open
    const popup = document.getElementById('haloTransparencyPopup');
    if (popup && popup.classList.contains('active')) return;

    if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
    }
    hideControlsTimeout = setTimeout(() => {
        if (!controlsPinned) {
            document.body.classList.remove('show-bg-controls');
            const customizeSub = document.getElementById('customizeSubButtons');
            if (customizeSub) customizeSub.classList.remove('visible');
        }
        hideControlsTimeout = null;
    }, delay);
}

// Show background controls when cursor is near right edge (within 70px)
function handleMouseMove(e) {
    if (controlsPinned) return;
    const windowWidth = window.innerWidth;
    const mouseX = e.clientX;

    if (windowWidth - mouseX <= 70) {
        showControls();
    } else {
        const verticalControls = document.getElementById('verticalControls');
        const popup = document.getElementById('haloTransparencyPopup');
        const isHoveringControls = verticalControls && verticalControls.matches(':hover');
        const isHoveringPopup = popup && popup.classList.contains('active') && popup.matches(':hover');
        if (!isHoveringControls && !isHoveringPopup) {
            hideControls(350);
        }
    }
}

// Keep controls visible when hovering over them
function handleControlsMouseEnter() {
    showControls();
}

// Immediately schedule auto-hide when cursor leaves the side panel
function handleControlsMouseLeave(e) {
    if (controlsPinned) return;
    const verticalControls = document.getElementById('verticalControls');
    const popup = document.getElementById('haloTransparencyPopup');
    if (e && e.relatedTarget) {
        if (verticalControls && verticalControls.contains(e.relatedTarget)) return;
        if (popup && popup.classList.contains('active') && popup.contains(e.relatedTarget)) return;
    }
    hideControls(350);
}

// ----- Ambient Control: exclusively for background video -----
function attachAmbientListeners() {
    if (!video) return;
    video.removeEventListener('play', onBackgroundVideoPlay);
    video.removeEventListener('pause', onBackgroundVideoPause);
    video.removeEventListener('ended', onBackgroundVideoEnded);
    video.addEventListener('play', onBackgroundVideoPlay);
    video.addEventListener('pause', onBackgroundVideoPause);
    video.addEventListener('ended', onBackgroundVideoEnded);
}

function onBackgroundVideoPlay() {
    isPlaying = true;
    updatePlayPauseIcon(true);
    if (nowPlaying) nowPlaying.textContent = 'Background video playing';
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
    }
}

function onBackgroundVideoPause() {
    isPlaying = false;
    updatePlayPauseIcon(false);
    if (nowPlaying) nowPlaying.textContent = 'Background video paused';
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
    }
}

function onBackgroundVideoEnded() {
    isPlaying = false;
    updatePlayPauseIcon(false);
    if (nowPlaying) nowPlaying.textContent = 'Background video ended';
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
    }
}

function updatePlayPauseIcon(playing) {
    if (!playPauseBtn) return;
    const icon = playPauseBtn.querySelector('i');
    if (!icon) return;
    if (playing) {
        icon.className = 'fas fa-pause';
        playPauseBtn.title = 'Pause';
        playPauseBtn.classList.add('active');
    } else {
        icon.className = 'fas fa-play';
        playPauseBtn.title = 'Resume';
        playPauseBtn.classList.remove('active');
    }
}

// Mute/Unmute toggle (exclusive in Ambient Control) - Video backgrounds are 100% silent
function toggleMute() {
    if (!video || !video.src) {
        showToast('No background video', 'warning');
        return;
    }
    video.muted = true;
    video.volume = 0;
    updateMuteIcon();
    showToast('Live wallpapers are strictly silent ✨', 'info');
}

function updateMuteIcon() {
    if (!prevBtn) return;
    const icon = prevBtn.querySelector('i');
    if (icon) {
        icon.className = 'fas fa-volume-mute';
        prevBtn.title = 'Live wallpaper is silent';
    }
}

// Pause/Resume background video (no play, only pause/resume)
function togglePlayPause() {
    if (!video.src) {
        showToast('No background video', 'warning');
        return;
    }
    if (video.paused) {
        if (video.ended) {
            video.currentTime = 0;
        }
        video.play().catch(error => {
            console.log('Background video resume interrupted:', error);
            showToast('Resume failed: ' + error.message, 'error');
        });
    } else {
        video.pause();
    }
}

// Volume Up – Video background is strictly silent
function volumeUp() {
    if (!video.src) {
        showToast('No background video', 'warning');
        return;
    }
    video.volume = 0;
    video.muted = true;
    showToast('Live wallpaper audio is muted by design', 'info');
}

// Volume Down – Video background is strictly silent
function volumeDown() {
    if (!video.src) {
        showToast('No background video', 'warning');
        return;
    }
    video.volume = 0;
    video.muted = true;
    showToast('Live wallpaper audio is muted by design', 'info');
}

// Show inline volume feedback near the clicked button
function showVolumeFeedback(button, text) {
    const existing = button.parentNode.querySelector('.volume-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('span');
    feedback.className = 'volume-feedback';
    feedback.textContent = text;
    button.style.position = 'relative';
    button.appendChild(feedback);

    setTimeout(() => {
        if (feedback.parentNode) feedback.remove();
    }, 800);
}

// Apply current volume to background video (only)
function applyVolumeToAllMedia() {
    if (video.src) {
        video.muted = true;
        video.volume = 0;
    }
}

// Switch media type tabs
function switchMediaType(type) {
    currentMediaType = type;

    mediaTabs.forEach(tab => {
        if (tab.dataset.type === type) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    const savedSec = document.getElementById('savedWallpapersSection');
    const prevCont = document.querySelector('.media-preview-container');
    const upZone = document.getElementById('uploadZone');
    const modalActs = document.querySelector('#bgUploadModal .modal-actions');

    if (type === 'saved') {
        if (savedSec) savedSec.style.display = 'flex';
        if (prevCont) prevCont.style.display = 'none';
        if (upZone) upZone.style.display = 'none';
        if (modalActs) modalActs.style.display = 'none';
        if (videoResolutionInfo) videoResolutionInfo.classList.remove('active');
        if (typeof renderSavedWallpapersShelf === 'function') {
            renderSavedWallpapersShelf();
        }
        return;
    } else {
        if (savedSec) savedSec.style.display = 'none';
        if (prevCont) prevCont.style.display = 'block';
        if (upZone) upZone.style.display = 'flex';
        if (modalActs) modalActs.style.display = 'flex';
    }

    if (uploadInput) {
        uploadInput.accept = "video/mp4,video/webm,image/*";
    }
    if (fileRequirements) {
        fileRequirements.textContent = 'Max file size: 150MB (Video) / 10MB (Photo) | Formats: MP4, WebM, JPG, PNG, WebP';
    }
    if (videoResolutionInfo) {
        videoResolutionInfo.classList.remove('active');
    }

    resetPreview();
}

// Reset preview
function resetPreview() {
    mediaPreview.style.display = 'none';
    mediaPreview.src = '';
    mediaPreview.onloadedmetadata = null;
    mediaPreview.onerror = null;
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    imagePreview.onerror = null;
    mediaPreviewPlaceholder.style.display = 'block';
    selectedFile = null;
    confirmBtn.classList.remove('active');
    mediaError.classList.remove('active');
    resolutionValue.textContent = '-';
    fileSizeValue.textContent = '-';
}

// Handle file validation and preview
async function handleFile(file) {
    mediaError.classList.remove('active');
    confirmBtn.classList.remove('active');
    resolutionValue.textContent = '-';
    fileSizeValue.textContent = '-';

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
        mediaError.textContent = 'Please select a video or image file.';
        mediaError.classList.add('active');
        return;
    }

    currentMediaType = isVideo ? 'video' : 'photo';

    // Check file size based on actual file type
    let maxSize = isVideo ? MAX_VIDEO_FILE_SIZE : MAX_PHOTO_FILE_SIZE;
    if (file.size > maxSize) {
        const maxSizeMB = isVideo ? 150 : 10;
        mediaError.textContent = `File size exceeds ${maxSizeMB}MB limit.`;
        mediaError.classList.add('active');
        return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (isVideo) {
        mediaPreview.src = previewUrl;
        mediaPreview.style.display = 'block';
        imagePreview.style.display = 'none';
        mediaPreviewPlaceholder.style.display = 'none';

        fileSizeValue.textContent = formatFileSize(file.size);

        mediaPreview.onloadedmetadata = async function () {
            const resolutionInfo = await checkVideoResolution(mediaPreview);
            resolutionValue.textContent = `${resolutionInfo.width}×${resolutionInfo.height}`;

            // Check resolution limits
            if (resolutionInfo.category === 'above4K') {
                mediaError.textContent = 'Video resolution exceeds 4K (3840×2160). Please select a lower resolution video.';
                mediaError.classList.add('active');
                mediaPreview.style.display = 'none';
                mediaPreviewPlaceholder.style.display = 'block';
                selectedFile = null;
                URL.revokeObjectURL(previewUrl);
                return;
            }

            // Determine max allowed duration based on resolution category
            let maxAllowedDuration = 0;
            if (resolutionInfo.category === '1080p') {
                maxAllowedDuration = MAX_DURATION_1080P;
            } else if (resolutionInfo.category === '4K') {
                maxAllowedDuration = MAX_DURATION_4K;
            }

            if (mediaPreview.duration > maxAllowedDuration) {
                mediaError.textContent = `Video exceeds ${maxAllowedDuration} second limit for ${resolutionInfo.category} resolution. Please select a shorter video.`;
                mediaError.classList.add('active');
                mediaPreview.style.display = 'none';
                mediaPreviewPlaceholder.style.display = 'block';
                selectedFile = null;
                URL.revokeObjectURL(previewUrl);
                return;
            }

            selectedFile = file;
            confirmBtn.classList.add('active');
            mediaPreview.currentTime = 0;

            mediaPreview.muted = true;
            mediaPreview.play().catch(e => {
                console.log('Preview autoplay prevented:', e);
            });
        };

        mediaPreview.onerror = function () {
            mediaError.textContent = 'Unable to load video. Please try another file.';
            mediaError.classList.add('active');
            mediaPreview.style.display = 'none';
            mediaPreviewPlaceholder.style.display = 'block';
            selectedFile = null;
            URL.revokeObjectURL(previewUrl);
        };
    } else {
        imagePreview.src = previewUrl;
        imagePreview.style.display = 'block';
        mediaPreview.style.display = 'none';
        mediaPreviewPlaceholder.style.display = 'none';

        /* 🔥 FIX: IMAGE PREVIEW – NO ZOOM, FULL IMAGE */
        imagePreview.style.width = '100%';
        imagePreview.style.height = '100%';
        imagePreview.style.objectFit = 'contain';   // ✅ MAIN FIX
        imagePreview.style.objectPosition = 'center';
        imagePreview.style.background = '#000';

        selectedFile = file;
        confirmBtn.classList.add('active');

        imagePreview.onerror = function () {
            mediaError.textContent = 'Unable to load image. Please try another file.';
            mediaError.classList.add('active');
            imagePreview.style.display = 'none';
            mediaPreviewPlaceholder.style.display = 'block';
            selectedFile = null;
            URL.revokeObjectURL(previewUrl);
        };
    }

}

// Set background from file (delegates to unified shelf manager)
async function setBackground(file) {
    if (!file) return;
    try {
        await addNewWallpaperFromFile(file);
    } catch (error) {
        console.error('Error setting background:', error);
        showToast('Failed to set background', 'error');
    }
}

// Remove background
async function removeBackground() {
    // Guard flag to prevent recursive calls
    if (isRemovingBackground) return;
    isRemovingBackground = true;

    try {
        // 🔥 VERY IMPORTANT: detach error handlers FIRST
        cleanupMediaErrorHandlers();

        // 🔥 Remove from IndexedDB & LocalStorage
        await removeBackgroundFromDB().catch(function () { });
        try { localStorage.removeItem('halo_live_wallpaper_url'); } catch(e) {}
        try { localStorage.removeItem('halo_active_wallpaper'); } catch(e) {}
        if (typeof updateSavedWallpapersActiveState === 'function') {
            updateSavedWallpapersActiveState();
        }

        // 🔥 Proper media cleanup (BEST PRACTICE)
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load(); // resets media element
            video.classList.remove('video-active');
        }

        if (photo) {
            photo.removeAttribute('src');
            photo.classList.remove('photo-active');
        }

        // 🔥 Reset UI
        if (defaultBg) defaultBg.style.display = 'block';
        if (muteBtn) muteBtn.classList.remove('video-active');
        if (removeBtn) removeBtn.classList.remove('bg-active');
        if (bgRemoveBtn) bgRemoveBtn.style.display = 'none';
        videoQualityOptimized = false;

        // Reset ambient control UI safely
        updatePlayPauseIcon(false);
        if (nowPlaying) nowPlaying.textContent = 'Background video stopped';
        updateMuteIcon();

        // Clear background flags and update HTML class (anti-flash & visibility fix)
        clearBackgroundFlags();

        console.log('Background removed successfully');
        showToast('Background reset to default', 'info');
    } catch (error) {
        console.error('Error removing background:', error);
        if (defaultBg) defaultBg.style.display = 'block';
        clearBackgroundFlags();
        showToast('Error removing background', 'error');
    } finally {
        isRemovingBackground = false;
        // Update visibility of speaker/remove buttons
        updateBackgroundControlsVisibility();
    }
}

// =====================================================================
// UNIFIED SAVED WALLPAPERS GALLERY & EXCHANGE TRAY
// Unified shelf: starter wallpapers, in-place replacement, cancel safety
// =====================================================================
const LS_SAVED_WALLPAPERS = 'halo_saved_wallpapers';
const LS_ACTIVE_WALLPAPER = 'halo_active_wallpaper';

function resolveMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('chrome-extension://')) {
        return url;
    }
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL(url);
    }
    return url;
}

const STARTER_WALLPAPERS = [
    {
        id: 'wp_black_and_white',
        url: 'Black and white.mp4',
        type: 'video',
        title: 'Black & White'
    },
    {
        id: 'wp_grey',
        url: 'Grey.mp4',
        type: 'video',
        title: 'Grey Motion'
    },
    {
        id: 'wp_eyes',
        url: 'eyes.jpg',
        type: 'photo',
        title: 'Eyes'
    },
    {
        id: 'wp_default_photo',
        url: 'bg.jpg',
        type: 'photo',
        title: 'Default Background'
    }
];

function getSavedWallpapers() {
    try {
        const raw = localStorage.getItem(LS_SAVED_WALLPAPERS);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // If old bg.mp4 exists, migrate to new defaults
                var hasBgMp4 = parsed.some(function (item) { return item.url === 'bg.mp4' || item.id === 'wp_default_video'; });
                if (hasBgMp4) {
                    parsed = parsed.filter(function (item) { return item.url !== 'bg.mp4' && item.id !== 'wp_default_video'; });
                }

                var modified = false;
                if (!parsed.some(function (item) { return item.id === 'wp_black_and_white'; })) {
                    parsed.unshift(STARTER_WALLPAPERS[0]);
                    modified = true;
                }
                if (!parsed.some(function (item) { return item.id === 'wp_grey'; })) {
                    parsed.splice(1, 0, STARTER_WALLPAPERS[1]);
                    modified = true;
                }
                if (!parsed.some(function (item) { return item.id === 'wp_eyes'; })) {
                    parsed.splice(2, 0, STARTER_WALLPAPERS[2]);
                    modified = true;
                }
                if (hasBgMp4 || modified) {
                    saveWallpapersList(parsed);
                }

                // Deduplicate any repeated entries
                const seenKeys = new Set();
                const cleaned = [];
                for (var i = 0; i < parsed.length; i++) {
                    var item = parsed[i];
                    var key = item.source === 'db' ? item.id : (item.url || item.id);
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        cleaned.push(item);
                    }
                }
                return cleaned;
            }
        }
    } catch (e) { }

    saveWallpapersList(STARTER_WALLPAPERS);
    return STARTER_WALLPAPERS.slice();
}

function saveWallpapersList(list) {
    try {
        localStorage.setItem(LS_SAVED_WALLPAPERS, JSON.stringify(list));
    } catch (e) { }
}

function resumeAllVideos() {
    var vids = document.querySelectorAll('video');
    vids.forEach(function (v) {
        if (v && (v.hasAttribute('autoplay') || v.classList.contains('video-active') || v.classList.contains('saved-card-media'))) {
            v.play().catch(function () { });
        }
    });
}

async function activateWallpaper(item) {
    if (!item) return;

    try {
        localStorage.setItem(LS_ACTIVE_WALLPAPER, JSON.stringify({
            id: item.id,
            url: item.url || '',
            type: item.type,
            title: item.title,
            source: item.source || 'url'
        }));
        localStorage.removeItem('halo_live_wallpaper_url');
    } catch (e) { }

    if (item.source === 'db' && item.id) {
        const bgData = await loadBackgroundFromDB(item.id);
        if (bgData) {
            const blob = new Blob([bgData.data], { type: bgData.mimeType });
            const blobUrl = URL.createObjectURL(blob);
            if (bgData.type === 'video') {
                applyVideoBackground(blobUrl);
            } else {
                applyPhotoBackground(blobUrl);
            }
        }
    } else {
        var mediaUrl = resolveMediaUrl(item.url);

        if (item.url === 'bg.jpg' || !item.url) {
            if (video) { video.pause(); video.removeAttribute('src'); video.classList.remove('video-active'); }
            if (photo) { photo.removeAttribute('src'); photo.classList.remove('photo-active'); }
            if (defaultBg) defaultBg.style.display = 'block';
            clearBackgroundFlags();
            document.documentElement.classList.add('show-default-bg');
        } else if (item.type === 'video') {
            applyVideoBackground(mediaUrl);
        } else {
            applyPhotoBackground(mediaUrl);
        }
    }

    updateBackgroundControlsVisibility();
    updateSavedWallpapersActiveState();
    resumeAllVideos();

    if (uploadModal) uploadModal.classList.remove('active');
    showToast((item.title || 'Wallpaper') + ' applied ✨', 'success');
}

async function replaceWallpaperCard(targetId, file) {
    if (!file || !targetId) return;

    const isVideo = file.type.startsWith('video/');
    const fileType = isVideo ? 'video' : 'photo';

    // 1. Save binary file to IndexedDB with targetId as key
    await saveBackgroundToDB(file, fileType, targetId);

    // 2. Update the existing card in the shelf in-place
    var list = getSavedWallpapers();
    var idx = list.findIndex(function (item) { return item.id === targetId; });
    var updatedItem = {
        id: targetId,
        type: fileType,
        title: file.name || (isVideo ? 'Custom Video' : 'Custom Photo'),
        source: 'db',
        url: '',
        updatedAt: Date.now()
    };

    if (idx !== -1) {
        list[idx] = updatedItem;
    } else {
        list.push(updatedItem);
    }
    saveWallpapersList(list);

    // 3. Immediately activate the replaced wallpaper
    await activateWallpaper(updatedItem);

    // 4. Re-render shelf
    await renderSavedWallpapersShelf();
    showToast('Wallpaper replaced and applied! ✨', 'success');
}

async function addNewWallpaperFromFile(file) {
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const fileType = isVideo ? 'video' : 'photo';
    const newId = 'wp_' + Date.now();

    await saveBackgroundToDB(file, fileType, newId);

    var list = getSavedWallpapers();
    var newItem = {
        id: newId,
        type: fileType,
        title: file.name || (isVideo ? 'Custom Video' : 'Custom Photo'),
        source: 'db',
        url: '',
        addedAt: Date.now()
    };
    list.push(newItem);
    if (list.length > 12) list = list.slice(-12);
    saveWallpapersList(list);

    await activateWallpaper(newItem);
    await renderSavedWallpapersShelf();
}

function addNewWallpaperFromUrl(url) {
    if (!url) return;
    var isVideo = !!url.match(/\.(mp4|webm|mov)(\?|$)/i);
    var newId = 'wp_' + Date.now();
    var list = getSavedWallpapers();
    var newItem = {
        id: newId,
        type: isVideo ? 'video' : 'photo',
        title: isVideo ? 'Custom Video' : 'Custom Photo',
        source: 'url',
        url: url,
        addedAt: Date.now()
    };
    list.push(newItem);
    if (list.length > 12) list = list.slice(-12);
    saveWallpapersList(list);

    activateWallpaper(newItem);
    renderSavedWallpapersShelf();
}

async function deleteSavedWallpaper(id) {
    var list = getSavedWallpapers();
    var target = list.find(function (item) { return item.id === id; });
    if (target && target.source === 'db') {
        await removeBackgroundFromDB(id).catch(function () { });
    }

    list = list.filter(function (item) { return item.id !== id; });
    saveWallpapersList(list);

    var activeWp = null;
    try {
        var rawActive = localStorage.getItem(LS_ACTIVE_WALLPAPER);
        if (rawActive) activeWp = JSON.parse(rawActive);
    } catch (e) { }

    if (activeWp && activeWp.id === id) {
        if (list.length > 0) {
            await activateWallpaper(list[0]);
        } else {
            removeBackground();
        }
    }

    await renderSavedWallpapersShelf();
    showToast('Wallpaper removed from shelf', 'info');
}

function updateSavedWallpapersActiveState() {
    var grid = document.getElementById('savedWallpapersGrid');
    if (!grid) return;

    var activeId = null;
    try {
        var rawActive = localStorage.getItem(LS_ACTIVE_WALLPAPER);
        if (rawActive) {
            var activeWp = JSON.parse(rawActive);
            activeId = activeWp.id;
        }
    } catch (e) { }

    // If no active ID, highlight Black & White default
    if (!activeId) {
        activeId = 'wp_black_and_white';
    }

    var cards = grid.querySelectorAll('.saved-wallpaper-card');
    cards.forEach(function (card) {
        var cardId = card.getAttribute('data-id');
        var isActive = (activeId && cardId === activeId);
        card.classList.toggle('active', !!isActive);
    });
}

var currentReplaceTargetId = null;

function handleReplaceCard(cardId) {
    currentReplaceTargetId = cardId;
    var replaceInput = document.getElementById('replaceWallpaperInput');
    if (replaceInput) {
        replaceInput.value = '';
        replaceInput.click();
    }
}

function initWallpaperReplacement() {
    var replaceInput = document.getElementById('replaceWallpaperInput');
    if (!replaceInput || replaceInput.dataset.initialized) return;
    replaceInput.dataset.initialized = 'true';

    replaceInput.addEventListener('change', async function (e) {
        var file = e.target.files[0];
        var targetId = currentReplaceTargetId;
        replaceInput.value = '';
        currentReplaceTargetId = null;
        replaceInput.blur();

        if (!file || !targetId) {
            resumeAllVideos();
            return;
        }

        var isVideo = file.type.startsWith('video/');
        var isPhoto = file.type.startsWith('image/');
        if (!isVideo && !isPhoto) {
            showToast('Please select a video or image file', 'warning');
            resumeAllVideos();
            return;
        }

        try {
            await replaceWallpaperCard(targetId, file);
        } catch (err) {
            console.error('Error replacing wallpaper:', err);
            showToast('Failed to replace wallpaper', 'error');
        } finally {
            resumeAllVideos();
        }
    });

    replaceInput.addEventListener('cancel', function () {
        currentReplaceTargetId = null;
        replaceInput.blur();
        resumeAllVideos();
    });

    window.addEventListener('focus', function () {
        resumeAllVideos();
    });
}

function createWallpaperCard(config) {
    var card = document.createElement('div');
    card.className = 'saved-wallpaper-card';
    card.setAttribute('data-id', config.id);
    if (config.url) card.setAttribute('data-url', config.url);

    var mediaHtml = '';
    if (config.type === 'video') {
        mediaHtml = `<video class="saved-card-media" src="${config.url || ''}" muted loop autoplay playsinline preload="auto"></video>`;
    } else {
        mediaHtml = `<img class="saved-card-media" src="${config.url || 'bg.jpg'}" alt="${config.title || 'Wallpaper'}" />`;
    }

    card.innerHTML = `
        <button type="button" class="saved-card-del-btn" title="Remove from shelf">✕</button>
        <span class="saved-card-active-pill"><i class="fas fa-check"></i> Active</span>
        ${mediaHtml}
        <div class="saved-card-overlay">
            <div class="saved-card-actions">
                <button type="button" class="card-action-btn action-set" title="Set as background">
                    <i class="fas fa-check"></i>
                </button>
                <button type="button" class="card-action-btn action-replace" title="Replace wallpaper">
                    <i class="fas fa-arrows-rotate"></i>
                </button>
            </div>
        </div>
    `;

    // Action button: Set as background
    var setBtn = card.querySelector('.action-set');
    if (setBtn) {
        setBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            config.onSet();
        });
    }

    // Action button: Replace wallpaper
    var replaceBtn = card.querySelector('.action-replace');
    if (replaceBtn) {
        replaceBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            config.onReplace();
        });
    }

    // Whole card click activates wallpaper
    card.addEventListener('click', function (e) {
        if (e.target.closest('.saved-card-del-btn') || e.target.closest('.card-action-btn')) return;
        config.onSet();
    });

    // Delete handler
    var delBtn = card.querySelector('.saved-card-del-btn');
    if (delBtn) {
        delBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            config.onDelete();
        });
    }

    return card;
}

async function renderSavedWallpapersShelf() {
    var grid = document.getElementById('savedWallpapersGrid');
    if (!grid) return;

    grid.innerHTML = '';
    var list = getSavedWallpapers();

    for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var mediaUrl = item.url;

        if (item.source === 'db' && item.id) {
            try {
                var bgData = await loadBackgroundFromDB(item.id);
                if (bgData) {
                    var blob = new Blob([bgData.data], { type: bgData.mimeType });
                    mediaUrl = URL.createObjectURL(blob);
                }
            } catch (e) { }
        } else if (mediaUrl) {
            mediaUrl = resolveMediaUrl(mediaUrl);
        }

        var card = createWallpaperCard({
            id: item.id,
            url: mediaUrl,
            type: item.type,
            title: item.title,
            onSet: (function (wp) {
                return function () {
                    activateWallpaper(wp);
                };
            })(item),
            onReplace: (function (wp) {
                return function () {
                    handleReplaceCard(wp.id);
                };
            })(item),
            onDelete: (function (wp) {
                return function () {
                    deleteSavedWallpaper(wp.id);
                };
            })(item)
        });

        grid.appendChild(card);
    }

    // Upload & Hold Empty Slot Card
    var uploadSlotCard = document.createElement('div');
    uploadSlotCard.className = 'saved-wallpaper-card saved-upload-card';
    uploadSlotCard.setAttribute('data-id', 'upload_slot');
    uploadSlotCard.innerHTML = `
        <i class="fas fa-cloud-arrow-up"></i>
        <span>Upload &amp; Hold</span>
    `;
    uploadSlotCard.addEventListener('click', function () {
        switchMediaType('upload');
    });
    grid.appendChild(uploadSlotCard);

    updateSavedWallpapersActiveState();
    resumeAllVideos();
}

function initSavedWallpapers() {
    var applyUrlBtn = document.getElementById('applyDirectWallpaperUrlBtn');
    var directUrlInput = document.getElementById('directWallpaperUrlInput');

    function handleDirectUrl() {
        if (!directUrlInput) return;
        var url = directUrlInput.value.trim();
        if (url) {
            addNewWallpaperFromUrl(url);
            directUrlInput.value = '';
        } else {
            showToast('Please enter a valid video or image URL', 'warning');
        }
    }

    if (applyUrlBtn) {
        applyUrlBtn.addEventListener('click', handleDirectUrl);
    }
    if (directUrlInput) {
        directUrlInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleDirectUrl();
            }
        });
    }

    initWallpaperReplacement();
    renderSavedWallpapersShelf();
}

// ========== NEW FEATURE: THEME TOGGLE ==========
function initTheme() {
    const savedTheme = localStorage.getItem('ambientTab_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('ambientTab_theme', isLight ? 'light' : 'dark');
    showToast(`Theme switched to ${isLight ? 'dark' : 'light'}`, 'info');
}


// ========== NEW FEATURE: HOW TO MODAL ==========
function openHowToModal() {
    const modal = document.getElementById('howToModal');
    modal.classList.add('active');
}

function closeHowToModal() {
    const modal = document.getElementById('howToModal');
    modal.classList.remove('active');
}

// ========== HIDE BOXES IMPLEMENTATION ==========
function openHideBoxesModal() {
    // Populate toggle list
    widgetToggleList.innerHTML = '';
    const widgetNames = {
        clock: 'Clock',
        weather: 'Weather',
        todo: 'To-Do',
        links: 'Quick Links',
        notes: 'Notes',
        media: 'Spotify & Sounds',
        calendar: 'Calendar',
        photoWidget: 'Photo Widget',
        pomodoro: 'Pomodoro Timer',
        dailyFocus: 'Daily Focus',
        quoteCapsule: 'Daily Quote'
    };

    widgetIds.forEach(id => {
        const li = document.createElement('li');
        li.className = 'widget-toggle-item';
        let icon = '';
        if (id === 'clock') icon = 'clock';
        else if (id === 'weather') icon = 'cloud-sun';
        else if (id === 'todo') icon = 'tasks';
        else if (id === 'links') icon = 'bookmark';
        else if (id === 'notes') icon = 'pencil-alt';
        else if (id === 'media') icon = 'music';
        else if (id === 'calendar') icon = 'calendar-alt';
        else if (id === 'photoWidget') icon = 'image';
        else if (id === 'pomodoro') icon = 'stopwatch';
        else if (id === 'dailyFocus') icon = 'bullseye';
        else if (id === 'quoteCapsule') icon = 'quote-left';

        li.innerHTML = `
          <span class="widget-toggle-label">
            <i class="fas fa-${icon}" style="width:24px;"></i>
            ${widgetNames[id]}
          </span>
          <span class="toggle-switch ${widgetVisibility[id] ? 'active' : ''}" data-widget="${id}">
            <span class="toggle-slider"></span>
          </span>
        `;
        widgetToggleList.appendChild(li);
    });

    // Add click listeners to toggles
    document.querySelectorAll('.toggle-switch').forEach(t => {
        t.addEventListener('click', function (e) {
            e.stopPropagation();
            const widget = this.dataset.widget;
            widgetVisibility[widget] = !widgetVisibility[widget];
            this.classList.toggle('active', widgetVisibility[widget]);
        });
    });

    hideBoxesModal.classList.add('active');
}

function closeHideBoxesModal() {
    hideBoxesModal.classList.remove('active');
}

function applyVisibility() {
    // Special handling for clock
    if (!widgetVisibility.clock) {
        // Show quote popup
        clockQuotePopup.classList.add('active');
        setTimeout(() => {
            clockQuotePopup.classList.remove('active');
        }, 5000);
    }

    // Apply visibility to each widget
    widgetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = widgetVisibility[id] ? '' : 'none';
        }
    });

    // Save visibility state
    localStorage.setItem('ambientTab_widgetVisibility', JSON.stringify(widgetVisibility));
    showToast('Visibility updated', 'info');
}

function loadVisibility() {
    const saved = localStorage.getItem('ambientTab_widgetVisibility');
    if (saved) {
        try {
            widgetVisibility = JSON.parse(saved);
            // Apply immediately
            widgetIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = widgetVisibility[id] ? '' : 'none';
                }
            });
        } catch (e) { }
    }
}

// ========== iOS-STYLE GLASS CALENDAR WIDGET ==========
(function () {
    'use strict';

    const widgetEl = document.getElementById('calendar');
    if (!widgetEl) return;

    const monthEl = document.getElementById('iosCalMonth');
    const yearEl = document.getElementById('iosCalYear');
    const weekdaysEl = document.getElementById('iosCalWeekdays');
    const daysEl = document.getElementById('iosCalDays');
    const prevBtn = document.getElementById('iosCalPrevBtn');
    const nextBtn = document.getElementById('iosCalNextBtn');
    const todayBtn = document.getElementById('iosCalTodayBtn');
    const todayLabelEl = document.getElementById('iosCalTodayLabel');

    if (!monthEl || !weekdaysEl || !daysEl) return;

    const CELL_SIZE = 19; // keep in sync with .ios-cal-day width/height in CSS
    const ROW_GAP = 2;    // keep in sync with .ios-cal-days row-gap in CSS

    // Viewed month/year (independent of "today", so navigation doesn't move the real date)
    const now0 = new Date();
    let viewYear = now0.getFullYear();
    let viewMonth = now0.getMonth(); // 0-11

    function rowsNeeded(y, m) {
        const firstDow = new Date(y, m, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        return Math.ceil((firstDow + daysInMonth) / 7);
    }

    // The grid's height always matches the REAL current month, so that month always shows
    // fully with no scrolling. Browsing to a month that needs more rows scrolls instead of
    // growing the widget; a shorter month just leaves a little breathing room at the bottom.
    function syncGridHeight() {
        const today = new Date();
        const rows = rowsNeeded(today.getFullYear(), today.getMonth());
        const px = rows * CELL_SIZE + (rows - 1) * ROW_GAP;
        daysEl.style.height = px + 'px';
    }

    function buildWeekdayHeader() {
        weekdaysEl.innerHTML = '';
        // Locale-aware short weekday labels, starting Sunday (matches the day-grid order below)
        const base = new Date(2023, 0, 1); // a Sunday
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const label = new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
            const span = document.createElement('span');
            span.textContent = label;
            weekdaysEl.appendChild(span);
        }
    }

    // Previous-month arrow only appears once the user has browsed ahead of the real
    // current month, and disappears again as soon as they land back on it.
    function updateNavVisibility() {
        if (!prevBtn) return;
        const today = new Date();
        const isAfterCurrent =
            (viewYear > today.getFullYear()) ||
            (viewYear === today.getFullYear() && viewMonth > today.getMonth());
        prevBtn.classList.toggle('is-shown', isAfterCurrent);
    }

    function renderMonth() {
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
        const todayDate = today.getDate();

        // Month + year label (localized)
        const labelDate = new Date(viewYear, viewMonth, 1);
        monthEl.textContent = new Intl.DateTimeFormat(locale, { month: 'long' }).format(labelDate);
        yearEl.textContent = String(viewYear);

        const firstOfMonth = new Date(viewYear, viewMonth, 1);
        const startOffset = firstOfMonth.getDay(); // 0 = Sunday
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        daysEl.innerHTML = '';
        const totalCells = 42; // 6 full weeks max — loop breaks early for shorter months

        for (let cell = 0; cell < totalCells; cell++) {
            const dayNum = cell - startOffset + 1;
            const cellDiv = document.createElement('div');
            let displayNum, isOutside = false, cellDow;

            if (dayNum < 1) {
                displayNum = daysInPrevMonth + dayNum;
                isOutside = true;
                cellDow = ((cell) % 7);
            } else if (dayNum > daysInMonth) {
                displayNum = dayNum - daysInMonth;
                isOutside = true;
                cellDow = ((cell) % 7);
            } else {
                displayNum = dayNum;
                cellDow = ((cell) % 7);
            }

            cellDiv.className = 'ios-cal-day';
            if (isOutside) cellDiv.classList.add('is-outside');
            if (cellDow === 0 || cellDow === 6) cellDiv.classList.add('is-weekend');
            if (!isOutside && isCurrentMonth && displayNum === todayDate) {
                cellDiv.classList.add('is-today');
            }
            cellDiv.textContent = String(displayNum);
            daysEl.appendChild(cellDiv);

            // Stop once we've filled the last real day of the month and its trailing week
            if (dayNum >= daysInMonth && (cell + 1) % 7 === 0) break;
        }

        if (todayLabelEl) {
            const todayStr = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(today);
            todayLabelEl.textContent = todayStr;
        }

        updateNavVisibility();
    }

    function goToToday() {
        const d = new Date();
        viewYear = d.getFullYear();
        viewMonth = d.getMonth();
        renderMonth();
    }

    // Prev button only ever steps back down to the real current month, never before it
    // (it's hidden entirely once it gets there — see updateNavVisibility).
    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            const today = new Date();
            if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) return;
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            renderMonth();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            renderMonth();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }

    buildWeekdayHeader();
    syncGridHeight();
    renderMonth();

    // Keep "today" highlight (and grid height, if the real month rolled over) accurate
    // if the widget is left open for a long time
    let lastCheckedDate = new Date().getDate();
    let lastCheckedMonth = new Date().getMonth();
    setInterval(function () {
        const now = new Date();
        if (now.getDate() !== lastCheckedDate || now.getMonth() !== lastCheckedMonth) {
            lastCheckedDate = now.getDate();
            lastCheckedMonth = now.getMonth();
            syncGridHeight();
            renderMonth();
        }
    }, 60000);

    // Refresh the highlighted day whenever the widget is unhidden via Hide Widgets
    const confirmHideBtn = document.getElementById('confirmHideBoxesBtn');
    if (confirmHideBtn) {
        confirmHideBtn.addEventListener('click', function () {
            if (widgetEl.style.display !== 'none') renderMonth();
        });
    }
})();

/* =========================================================================
   NEW: iOS 26/27 STYLE PHOTO WIDGET
   - Up to 3 photos, saved locally (localStorage, compressed to keep it light)
   - First photo: click the "+" in the empty state -> pick a file directly
   - 2nd / 3rd photo: hover the widget -> "+" appears -> opens a small popup
     showing existing photo(s) + a "+" tile to add another -> Save (tick)
   - Photos are never zoomed/cropped (object-fit: contain) inside the widget
   - Scroll inside the widget (wheel or touch swipe) to browse photos with a
     soft parallax crossfade motion
   - Each photo in the popup has an ✕ to remove it
   ========================================================================= */
(function () {
    'use strict';

    const widgetEl = document.getElementById('photoWidget');
    if (!widgetEl) return;

    const frameEl = document.getElementById('photoWidgetFrame');
    const trackEl = document.getElementById('photoWidgetTrack');
    const emptyEl = document.getElementById('photoWidgetEmpty');
    const emptyAddBtn = document.getElementById('photoEmptyAddBtn');
    const hoverAddBtn = document.getElementById('photoHoverAddBtn');
    const dotsEl = document.getElementById('photoWidgetDots');
    const fileInput = document.getElementById('photoWidgetInput');

    const manageModal = document.getElementById('photoManageModal');
    const manageGrid = document.getElementById('photoManageGrid');
    const cancelManageBtn = document.getElementById('cancelPhotoManageBtn');
    const saveManageBtn = document.getElementById('savePhotoManageBtn');

    if (!frameEl || !trackEl || !fileInput || !manageModal || !manageGrid) return;

    const STORAGE_KEY = 'ambientTab_photoWidgetImages';
    const ACTIVE_INDEX_KEY = 'ambientTab_photoWidgetActiveIndex';
    const MAX_PHOTOS = 3;
    const MAX_DIM = 900; // longest side, px — keeps localStorage usage sane

    let images = loadImages();       // persisted images: array of dataURLs (max 3)
    let tempImages = [];             // working copy while the manage popup is open
    let currentIndex = loadActiveIndex(); // which photo is currently shown — restored from last session
    let pendingFileMode = null;      // 'direct' (first photo) | 'popup' (adding via popup)
    let pendingPopupSlot = null;     // index in tempImages being replaced/added via popup
    let dotsHideTimer = null;        // auto-hide timer for the dots indicator

    // Briefly reveal the dots indicator (e.g. right after a scroll/swipe),
    // then fade it back out after a short delay.
    function flashDots() {
        if (!dotsEl) return;
        dotsEl.classList.add('is-visible');
        clearTimeout(dotsHideTimer);
        dotsHideTimer = setTimeout(function () {
            dotsEl.classList.remove('is-visible');
        }, 1500);
    }

    function loadImages() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.slice(0, MAX_PHOTOS) : [];
        } catch (e) {
            return [];
        }
    }

    function saveImages() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
        } catch (e) {
            showToast('Could not save photos — storage may be full.', 'error');
        }
    }

    // Remember which photo was active so a page refresh reopens on the same one
    // instead of always jumping back to the first photo.
    function loadActiveIndex() {
        try {
            const raw = localStorage.getItem(ACTIVE_INDEX_KEY);
            const parsed = parseInt(raw, 10);
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (e) {
            return 0;
        }
    }

    function saveActiveIndex(i) {
        try {
            localStorage.setItem(ACTIVE_INDEX_KEY, String(i));
        } catch (e) {
            // non-critical — silently ignore
        }
    }

    // Resize-only compression (no cropping) so the full photo always stays visible
    function compressPhotoWidgetImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type || !file.type.startsWith('image/')) {
                reject(new Error('Please select an image file.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > MAX_DIM || h > MAX_DIM) {
                        const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
                        w = Math.max(1, Math.round(w * scale));
                        h = Math.max(1, Math.round(h * scale));
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) { reject(new Error('Image processing failed.')); return; }
                    ctx.drawImage(img, 0, 0, w, h);
                    let data = canvas.toDataURL('image/webp', 0.85);
                    if (!data.startsWith('data:image/webp')) {
                        data = canvas.toDataURL('image/jpeg', 0.85);
                    }
                    resolve(data);
                };
                img.onerror = () => reject(new Error('Could not read this image.'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(new Error('Could not read this file.'));
            reader.readAsDataURL(file);
        });
    }

    // ---------- Main widget rendering ----------
    function renderWidget(targetIndex) {
        trackEl.innerHTML = '';
        dotsEl.innerHTML = '';
        dotsEl.classList.remove('is-visible');
        clearTimeout(dotsHideTimer);

        const hasPhotos = images.length > 0;
        widgetEl.classList.toggle('has-photos', hasPhotos);
        hoverAddBtn.style.display = hasPhotos && images.length < MAX_PHOTOS ? 'flex' : 'none';

        if (!hasPhotos) {
            currentIndex = 0;
            saveActiveIndex(0);
            return;
        }

        if (typeof targetIndex === 'number') {
            currentIndex = Math.max(0, Math.min(targetIndex, images.length - 1));
        } else if (currentIndex > images.length - 1) {
            currentIndex = images.length - 1;
        } else if (currentIndex < 0) {
            currentIndex = 0;
        }
        saveActiveIndex(currentIndex);

        images.forEach((src, i) => {
            const slide = document.createElement('div');
            slide.className = 'photo-slide' + (i === currentIndex ? ' active' : '');
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Widget photo ' + (i + 1);
            img.draggable = false;
            slide.appendChild(img);
            trackEl.appendChild(slide);
        });

        if (images.length > 1) {
            images.forEach((_, i) => {
                const dot = document.createElement('span');
                if (i === currentIndex) dot.classList.add('is-active');
                dotsEl.appendChild(dot);
            });
        }
    }

    function goToIndex(nextIndex) {
        if (images.length <= 1) return;
        nextIndex = Math.max(0, Math.min(nextIndex, images.length - 1));
        if (nextIndex === currentIndex) return;

        const direction = nextIndex > currentIndex ? 'up' : 'down';
        const slides = trackEl.querySelectorAll('.photo-slide');
        const leaving = slides[currentIndex];
        const entering = slides[nextIndex];

        if (leaving) {
            leaving.classList.remove('active');
            leaving.classList.add(direction === 'up' ? 'leaving-up' : 'leaving-down');
            setTimeout(() => leaving.classList.remove('leaving-up', 'leaving-down'), 650);
        }
        if (entering) {
            entering.classList.remove('leaving-up', 'leaving-down');
            // force reflow so the parallax transition replays from the offset state
            void entering.offsetWidth;
            entering.classList.add('active');
        }

        currentIndex = nextIndex;
        saveActiveIndex(currentIndex);

        dotsEl.querySelectorAll('span').forEach((dot, i) => {
            dot.classList.toggle('is-active', i === nextIndex);
        });

        flashDots();
    }

    // ---------- Scroll / swipe inside the widget to browse photos (parallax) ----------
    let wheelLock = false;
    frameEl.addEventListener('wheel', function (e) {
        if (images.length <= 1) return;
        e.preventDefault();
        if (wheelLock) return;
        wheelLock = true;
        setTimeout(() => { wheelLock = false; }, 550);
        if (e.deltaY > 0 || e.deltaX > 0) {
            goToIndex(currentIndex + 1);
        } else if (e.deltaY < 0 || e.deltaX < 0) {
            goToIndex(currentIndex - 1);
        }
    }, { passive: false });

    let touchStartY = null;
    frameEl.addEventListener('touchstart', function (e) {
        if (images.length <= 1) return;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    frameEl.addEventListener('touchend', function (e) {
        if (images.length <= 1 || touchStartY === null) return;
        const dy = touchStartY - e.changedTouches[0].clientY;
        touchStartY = null;
        if (Math.abs(dy) < 24) return;
        if (dy > 0) goToIndex(currentIndex + 1);
        else goToIndex(currentIndex - 1);
    }, { passive: true });

    // ---------- Empty state: first photo goes straight to the file picker ----------
    if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (document.body.classList.contains('layout-edit-mode')) return;
            pendingFileMode = 'direct';
            fileInput.value = '';
            fileInput.click();
        });
    }

    // ---------- Hover "+": open the manage popup to add photo #2 / #3 ----------
    if (hoverAddBtn) {
        hoverAddBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            openManageModal();
        });
    }

    fileInput.addEventListener('change', async function (e) {
        const file = e.target.files && e.target.files[0];
        const mode = pendingFileMode;
        pendingFileMode = null;
        if (!file) return;

        try {
            const dataUrl = await compressPhotoWidgetImage(file);
            if (mode === 'direct') {
                images = [dataUrl];
                saveImages();
                renderWidget(0);
                showToast('Photo added', 'success');
            } else if (mode === 'popup') {
                const slot = pendingPopupSlot;
                pendingPopupSlot = null;
                if (slot === null || slot === undefined) return;
                tempImages[slot] = dataUrl;
                renderManageGrid();
            }
        } catch (err) {
            showToast(err.message || 'Could not add this photo', 'error');
        } finally {
            fileInput.value = '';
        }
    });

    // ---------- Manage popup: existing photo(s) small, "+" tile to add next, ✕ to remove ----------
    function openManageModal() {
        if (images.length >= MAX_PHOTOS) {
            // Nothing new to add, but still let them remove one to free a slot
        }
        tempImages = images.slice(0, MAX_PHOTOS);
        renderManageGrid();
        manageModal.classList.add('active');
    }

    function closeManageModal() {
        manageModal.classList.remove('active');
        tempImages = [];
        pendingPopupSlot = null;
    }

    function renderManageGrid() {
        manageGrid.innerHTML = '';

        tempImages.forEach((src, i) => {
            const tile = document.createElement('div');
            tile.className = 'photo-manage-tile filled';

            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Photo ' + (i + 1);
            tile.appendChild(img);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'photo-tile-remove';
            removeBtn.title = 'Remove photo';
            removeBtn.setAttribute('aria-label', 'Remove photo');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tempImages.splice(i, 1);
                renderManageGrid();
            });
            tile.appendChild(removeBtn);

            manageGrid.appendChild(tile);
        });

        // One "+" add tile, only while under the 3-photo max
        if (tempImages.length < MAX_PHOTOS) {
            const addTile = document.createElement('div');
            addTile.className = 'photo-manage-tile add-tile';
            addTile.title = 'Add photo';
            addTile.innerHTML = '<i class="fas fa-plus"></i>';
            addTile.addEventListener('click', () => {
                pendingFileMode = 'popup';
                pendingPopupSlot = tempImages.length;
                fileInput.value = '';
                fileInput.click();
            });
            manageGrid.appendChild(addTile);
        }
    }

    if (cancelManageBtn) {
        cancelManageBtn.addEventListener('click', closeManageModal);
    }

    if (saveManageBtn) {
        saveManageBtn.addEventListener('click', function () {
            images = tempImages.slice(0, MAX_PHOTOS);
            saveImages();
            closeManageModal();
            renderWidget(0);
            showToast('Photos updated', 'success');
        });
    }

    manageModal.addEventListener('click', function (e) {
        if (e.target === manageModal) closeManageModal();
    });

    // Re-render whenever the widget gets unhidden via Hide Widgets
    const confirmHideBtn2 = document.getElementById('confirmHideBoxesBtn');
    if (confirmHideBtn2) {
        confirmHideBtn2.addEventListener('click', function () {
            if (widgetEl.style.display !== 'none') renderWidget();
        });
    }

    // No explicit target index here — renderWidget() falls back to the
    // currentIndex restored from storage, so the widget reopens on whichever
    // photo was active last time instead of always the first one.
    renderWidget();
})();

// ========== NOTES SYSTEM ==========
const NOTES_STORAGE_KEY = 'ambientTab_notes';
let notes = [];
let editingNoteId = null; // Track note being edited

function initNotes() {
    loadNotesFromStorage();
    renderNotes();
}

function loadNotesFromStorage() {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved) {
        try {
            notes = JSON.parse(saved);
        } catch (e) {
            notes = [];
        }
    } else {
        notes = [];
    }
}

function saveNotesToStorage() {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;

    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-notes"><i class="fas fa-pencil-alt"></i><p>No notes yet. Click "Add Note" to create one.</p></div>';
        return;
    }

    let html = '';
    notes.forEach((note, index) => {
        const date = new Date(note.timestamp);
        const formattedDate = date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        // Strip HTML for preview (support both plain text & rich HTML notes)
        const plainText = htmlToPlainText ? htmlToPlainText(note.text) : note.text;
        const preview = plainText.length > 30 ? plainText.substring(0, 30) + '…' : plainText;
        html += `
            <div class="note-item" data-id="${note.id}">
                <div class="note-content">
                    <div class="note-number">${index + 1}</div>
                    <div class="note-text-preview">${escapeHtml(preview)}</div>
                    <div class="note-time">${formattedDate}</div>
                </div>
                <button class="note-delete" title="Delete note"><i class="fas fa-times"></i></button>
            </div>
        `;
    });
    notesList.innerHTML = html;

    // Attach delete listeners
    document.querySelectorAll('.note-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteItem = btn.closest('.note-item');
            const id = noteItem.dataset.id;
            deleteNote(id);
        });
    });

    // Attach edit listeners to note content
    document.querySelectorAll('.note-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteItem = content.closest('.note-item');
            const id = noteItem.dataset.id;
            openNoteForEdit(id);
        });
    });
}

// Open note for editing
function openNoteForEdit(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    editingNoteId = id;
    openNotesModal(note.text);
}

function addNote(text) {
    const plain = typeof htmlToPlainText === 'function' ? htmlToPlainText(text).trim() : text.replace(/<[^>]+>/g, '').trim();
    if (!plain) return;
    const newNote = {
        id: Date.now().toString(),
        text: text,
        timestamp: new Date().toISOString()
    };
    notes.unshift(newNote);
    saveNotesToStorage();
    renderNotes();
    showToast('Note added', 'success');
}

function updateNote(id, newText) {
    const plain = typeof htmlToPlainText === 'function' ? htmlToPlainText(newText).trim() : newText.replace(/<[^>]+>/g, '').trim();
    if (!plain) return;
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return;
    notes[index].text = newText;
    notes[index].timestamp = new Date().toISOString();
    saveNotesToStorage();
    renderNotes();
    showToast('Note updated', 'success');
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotesToStorage();
    renderNotes();
    showToast('Note deleted', 'info');
}

// ===== PREMIUM NOTES MODAL - RICH EDITOR =====

// Helper: get plain text from HTML (for preview/storage backward-compat)
function htmlToPlainText(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// Notes modal functions
function openNotesModal(initialText = '') {
    const modal = document.getElementById('notesModal');
    const editor = document.getElementById('noteEditor');
    const title = document.getElementById('notesModalTitle');
    if (!modal || !editor) return;

    // Set title based on edit vs new
    if (title) title.textContent = editingNoteId ? 'Edit Note' : 'New Note';

    // Load content: if existing note has HTML tags, use as-is; otherwise set as text
    if (initialText && /<[a-z][\s\S]*>/i.test(initialText)) {
        editor.innerHTML = initialText;
    } else {
        editor.textContent = initialText;
    }

    modal.classList.add('active');
    setTimeout(() => {
        editor.focus();
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }, 60);

    updateToolbarState();
}

function closeNotesModal() {
    const modal = document.getElementById('notesModal');
    if (modal) {
        modal.classList.remove('active');
        editingNoteId = null;
    }
}

// Toolbar state: highlight active format buttons based on cursor position
function updateToolbarState() {
    const boldBtn = document.getElementById('tbBold');
    const italicBtn = document.getElementById('tbItalic');
    const bulletBtn = document.getElementById('tbBullet');
    const orderedBtn = document.getElementById('tbOrdered');

    if (!boldBtn) return;

    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');

    boldBtn.classList.toggle('active-format', isBold);
    italicBtn.classList.toggle('active-format', isItalic);

    // Check list state
    const isUL = document.queryCommandState('insertUnorderedList');
    const isOL = document.queryCommandState('insertOrderedList');
    bulletBtn.classList.toggle('active-format', isUL);
    orderedBtn.classList.toggle('active-format', isOL);
}

// Event listeners for notes modal
function initNotesModalEvents() {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');         // X in header
    const cancelNoteModalBtn = document.getElementById('cancelNoteModalBtn'); // footer cancel
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const notesModal = document.getElementById('notesModal');
    const editor = document.getElementById('noteEditor');

    // Toolbar buttons
    const tbBold = document.getElementById('tbBold');
    const tbItalic = document.getElementById('tbItalic');
    const tbBullet = document.getElementById('tbBullet');
    const tbOrdered = document.getElementById('tbOrdered');
    const tbClear = document.getElementById('tbClear');

    // Prevent toolbar from stealing editor focus
    const toolbar = document.getElementById('notesToolbar');
    if (toolbar) {
        toolbar.addEventListener('mousedown', (e) => e.preventDefault());
    }

    if (tbBold) tbBold.addEventListener('click', () => { document.execCommand('bold', false, null); updateToolbarState(); editor && editor.focus(); });
    if (tbItalic) tbItalic.addEventListener('click', () => { document.execCommand('italic', false, null); updateToolbarState(); editor && editor.focus(); });
    if (tbBullet) tbBullet.addEventListener('click', () => { document.execCommand('insertUnorderedList', false, null); updateToolbarState(); editor && editor.focus(); });
    if (tbOrdered) tbOrdered.addEventListener('click', () => { document.execCommand('insertOrderedList', false, null); updateToolbarState(); editor && editor.focus(); });
    if (tbClear) tbClear.addEventListener('click', () => {
        document.execCommand('removeFormat', false, null);
        // Also remove list if inside one
        if (document.queryCommandState('insertUnorderedList')) document.execCommand('insertUnorderedList', false, null);
        if (document.queryCommandState('insertOrderedList')) document.execCommand('insertOrderedList', false, null);
        updateToolbarState();
        editor && editor.focus();
    });

    // Track selection changes to update toolbar state
    if (editor) {
        editor.addEventListener('keyup', updateToolbarState);
        editor.addEventListener('mouseup', updateToolbarState);
        editor.addEventListener('keydown', (e) => {
            // Ctrl+B / Ctrl+I native shortcuts — just update state after
            if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'i')) {
                setTimeout(updateToolbarState, 10);
            }
            // Ctrl+Enter to save
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                saveNoteBtn && saveNoteBtn.click();
            }
        });
    }

    document.addEventListener('selectionchange', () => {
        if (document.activeElement === editor) updateToolbarState();
    });

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            editingNoteId = null;
            openNotesModal('');
        });
    }

    const doClose = () => closeNotesModal();
    if (cancelNoteBtn) cancelNoteBtn.addEventListener('click', doClose);
    if (cancelNoteModalBtn) cancelNoteModalBtn.addEventListener('click', doClose);

    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            const editorEl = document.getElementById('noteEditor');
            if (!editorEl) return;
            const html = editorEl.innerHTML.trim();
            const plain = htmlToPlainText(html).trim();
            if (!plain) {
                showToast('Please enter a note', 'warning');
                return;
            }
            if (editingNoteId) {
                updateNote(editingNoteId, html);
            } else {
                addNote(html);
            }
            closeNotesModal();
        });
    }

    if (notesModal) {
        notesModal.addEventListener('click', (e) => {
            if (e.target === notesModal) closeNotesModal();
        });
    }
}



// ========== ENHANCED QUICK LINKS (BOOKMARKS) SYSTEM ==========
// ----- Constants & State -----
const QUICK_LINKS_STORAGE_KEY = 'ambientTab_quickLinks_v2';
const DEFAULT_BOOKMARKS = [
    { name: "Spotify", url: "https://open.spotify.com", category: "fun", icon: "fab fa-spotify" },
    { name: "Netflix", url: "https://netflix.com", category: "fun", icon: "fab fa-netflix" },
    { name: "Discord", url: "https://discord.com/app", category: "fun", icon: "fab fa-discord" },
    { name: "Twitch", url: "https://twitch.tv", category: "fun", icon: "fab fa-twitch" },
    { name: "Instagram", url: "https://instagram.com", category: "social", icon: "fab fa-instagram" },
    { name: "Telegram", url: "https://web.telegram.org", category: "social", icon: "fab fa-telegram" },
    { name: "Twitter", url: "https://twitter.com", category: "social", icon: "fab fa-twitter" },
    { name: "Facebook", url: "https://facebook.com", category: "social", icon: "fab fa-facebook" },
    { name: "Neo", url: "https://halonewtab.site", category: "search", icon: "favicon.png" },
    { name: "GitHub", url: "https://github.com", category: "work", icon: "fab fa-github" },
    { name: "LinkedIn", url: "https://linkedin.com", category: "work", icon: "fab fa-linkedin" },
    { name: "HackerOne", url: "https://hackerone.com", category: "work", icon: "fas fa-bug" },
    { name: "Amazon", url: "https://www.amazon.in", category: "work", icon: "fab fa-amazon" },
    { name: "Notion", url: "https://www.notion.so", category: "work", icon: "fas fa-book" },
    { name: "Canva", url: "https://www.canva.com", category: "work", icon: "fas fa-palette" },
    { name: "ChatGPT", url: "https://chat.openai.com", category: "search", icon: "fas fa-robot" },
    { name: "Claude", url: "https://claude.ai", category: "search", icon: "fas fa-brain" },
    { name: "Google", url: "https://google.com", category: "search", icon: "fab fa-google" },
    { name: "YouTube", url: "https://youtube.com", category: "search", icon: "fab fa-youtube" },
    { name: "Google Maps", url: "https://maps.google.com", category: "search", icon: "fas fa-map" },
    { name: "Google Translate", url: "https://translate.google.com", category: "search", icon: "fas fa-language" },
    { name: "Binance", url: "https://binance.com", category: "crypto", icon: "fas fa-coins" },
    { name: "Pump.fun", url: "https://pump.fun", category: "crypto", icon: "fas fa-rocket" },
    { name: "Dexscreener", url: "https://dexscreener.com", category: "crypto", icon: "fas fa-chart-line" },
    { name: "TradingView", url: "https://tradingview.com", category: "crypto", icon: "fas fa-chart-area" }
];

let quickLinks = new Array(9).fill(null);
let editMode = false;
let activeQuickLinkSlot = 0;
let pendingDeleteIndex = null;

let filteredBookmarks = [...DEFAULT_BOOKMARKS];
let selectedBookmarkIndex = null;
let activeCategory = 'all';
let searchTerm = '';
let activeIconChangeIndex = null;

const linksSlot = document.getElementById('links');
const bookmarksPickerModal = document.getElementById('bookmarksPickerModal');
const bookmarksGrid = document.getElementById('bookmarksGrid');
const cancelBookmarksBtn = document.getElementById('cancelBookmarksBtn');
const confirmBookmarksBtn = document.getElementById('confirmBookmarksBtn');
const bookmarksBtn = document.getElementById('bookmarksBtn');
const searchBookmarksInput = document.getElementById('searchBookmarks');
const categoryTabs = document.querySelectorAll('.category-tab');
const addCustomBookmarkBtn = document.getElementById('addCustomBookmark');
const customNameInput = document.getElementById('customName');
const customUrlInput = document.getElementById('customUrl');
const quickLinkIconInput = document.getElementById('quickLinkIconInput');

function getFaviconUrl(url, size = 64) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    } catch (e) {
        return null;
    }
}

function escapeAttribute(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function initQuickLinks() {
    loadQuickLinksFromStorage();
    renderQuickLinks();
    protectLinksSlot();
    updateEditButtonVisibility();
}

function protectLinksSlot() {
    if (!linksSlot) return;
    const observer = new MutationObserver(() => {
        if (!linksSlot.querySelector('.quick-links-grid')) renderQuickLinks();
    });
    observer.observe(linksSlot, { childList: true, subtree: true });
}

function renderQuickLinks() {
    if (!linksSlot) return;
    let html = `
        <div class="quick-links-header">
            <span class="quick-links-title"><i class="fas fa-bookmark"></i> Quick Links</span>
            <button type="button" class="quick-links-card-edit-btn${editMode ? ' active' : ''}" id="quickLinksCardEditBtn" title="${editMode ? 'Done editing' : 'Edit Quick Apps (Drag to Reorder & Remove)'}">
                <i class="fas ${editMode ? 'fa-check' : 'fa-pencil-alt'}"></i>
                <span>${editMode ? 'Done' : 'Edit'}</span>
            </button>
        </div>
        <div class="quick-links-trash-drop${editMode ? ' visible' : ''}" id="quickLinksTrashDrop">
            <i class="fas fa-trash-alt"></i>
            <span>Drag here to remove</span>
        </div>
        <div class="quick-links-grid${editMode ? ' edit-mode' : ''}">
    `;

    for (let i = 0; i < 9; i++) {
        const link = quickLinks[i];
        if (link) {
            const customIcon = typeof link.customIcon === 'string' && link.customIcon.startsWith('data:image/')
                ? link.customIcon
                : null;
            const faviconUrl = customIcon || getFaviconUrl(link.url);
            const fallbackClass = escapeAttribute(link.icon || 'fas fa-globe');
            const iconHtml = faviconUrl
                ? `<img src="${escapeAttribute(faviconUrl)}" alt="" draggable="false" onerror="this.onerror=null;this.outerHTML='<i class=\\'${fallbackClass}\\'></i>';">`
                : `<i class="${fallbackClass}"></i>`;

            html += `
                <div class="quick-link-box filled" data-index="${i}" draggable="true" title="${escapeAttribute(link.name || 'Quick App')} (Drag to reorder)">
                    <div class="quick-link-icon">
                        ${iconHtml}
                        ${editMode ? `
                          <button type="button" class="quick-link-delete" data-index="${i}" title="Remove ${escapeAttribute(link.name || 'app')}" aria-label="Remove quick link">
                            <i class="fas fa-times"></i>
                          </button>
                        ` : ''}
                    </div>
                    ${editMode ? `
                      <button type="button" class="quick-link-icon-change" data-index="${i}" title="Change icon" aria-label="Change icon">
                        <i class="fas fa-camera"></i>
                      </button>
                    ` : ''}
                </div>
            `;
        } else {
            html += `
                <div class="quick-link-box empty" data-index="${i}" title="Add Quick Link (or drag an app here)">
                    <i class="fas fa-plus"></i>
                </div>
            `;
        }
    }

    html += '</div>';
    linksSlot.innerHTML = html;
    attachSlotEventListeners();
}

function attachSlotEventListeners() {
    // Header Edit/Done button
    const cardEditBtn = document.getElementById('quickLinksCardEditBtn');
    if (cardEditBtn) {
        cardEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEditMode();
        });
    }

    // Mobile-Style Drag-To-Trash Drop Zone
    const trashDrop = document.getElementById('quickLinksTrashDrop');
    if (trashDrop) {
        trashDrop.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            trashDrop.classList.add('drop-hover');
        });
        trashDrop.addEventListener('dragleave', () => {
            trashDrop.classList.remove('drop-hover');
        });
        trashDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            trashDrop.classList.remove('drop-hover');
            const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(sourceIdx) && sourceIdx >= 0 && sourceIdx < 9 && quickLinks[sourceIdx]) {
                const name = quickLinks[sourceIdx].name || 'App';
                quickLinks[sourceIdx] = null;
                saveQuickLinksToStorage();
                renderQuickLinks();
                showToast(`"${name}" removed`, 'info');
            }
        });
    }

    let draggedSlotIndex = null;

    // Mobile-Style Drag and Drop on Quick Link Slots
    document.querySelectorAll('.quick-link-box').forEach(box => {
        const boxIdx = parseInt(box.dataset.index, 10);

        // Allow dragging filled boxes
        if (box.classList.contains('filled')) {
            box.addEventListener('dragstart', (e) => {
                draggedSlotIndex = boxIdx;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(boxIdx));
                box.classList.add('is-dragging');
                const trash = document.getElementById('quickLinksTrashDrop');
                if (trash) trash.classList.add('visible');
            });

            box.addEventListener('dragend', () => {
                draggedSlotIndex = null;
                box.classList.remove('is-dragging');
                document.querySelectorAll('.quick-link-box').forEach(b => b.classList.remove('drop-hover'));
                const trash = document.getElementById('quickLinksTrashDrop');
                if (trash && !editMode) trash.classList.remove('visible');
            });
        }

        // Dragover / Dragleave for hover feedback (on any slot)
        box.addEventListener('dragover', (e) => {
            if (draggedSlotIndex === null || draggedSlotIndex === boxIdx) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            box.classList.add('drop-hover');
        });

        box.addEventListener('dragleave', () => {
            box.classList.remove('drop-hover');
        });

        // Drop on slot: swap or move
        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.classList.remove('drop-hover');
            const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(sourceIdx) && sourceIdx >= 0 && sourceIdx < 9 && sourceIdx !== boxIdx) {
                const temp = quickLinks[sourceIdx];
                quickLinks[sourceIdx] = quickLinks[boxIdx];
                quickLinks[boxIdx] = temp;
                saveQuickLinksToStorage();
                renderQuickLinks();
                showToast('App moved', 'info');
            }
        });

        // Normal click behavior: open in the same page/tab
        if (box.classList.contains('filled')) {
            box.addEventListener('click', (e) => {
                if (editMode) return;
                if (e.target.closest('.quick-link-icon-change') || e.target.closest('.quick-link-delete')) return;
                const link = quickLinks[boxIdx];
                if (link && link.url) {
                    if (e.ctrlKey || e.metaKey) {
                        window.open(link.url, '_blank');
                    } else {
                        window.location.href = link.url;
                    }
                }
            });
            box.addEventListener('auxclick', (e) => {
                if (editMode || e.button !== 1) return;
                const link = quickLinks[boxIdx];
                if (link && link.url) window.open(link.url, '_blank');
            });
        } else {
            box.addEventListener('click', () => {
                if (editMode) return;
                activeQuickLinkSlot = boxIdx;
                openBookmarksPicker();
            });
        }
    });

    // Custom icon change picker
    document.querySelectorAll('.quick-link-icon-change').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!editMode || !quickLinkIconInput) return;
            activeIconChangeIndex = parseInt(btn.dataset.index, 10);
            quickLinkIconInput.value = '';
            quickLinkIconInput.click();
        });
    });

    // Mobile-style 1-tap delete: instantly removes like on smartphone
    document.querySelectorAll('.quick-link-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            if (isNaN(idx) || !quickLinks[idx]) return;
            const name = quickLinks[idx].name || 'App';
            quickLinks[idx] = null;
            saveQuickLinksToStorage();
            renderQuickLinks();
            showToast(`"${name}" removed`, 'info');
        });
    });
}

function compressQuickLinkImage(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Please select an image file.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const SIZE = 128;
                const canvas = document.createElement('canvas');
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Image processing failed.')); return; }

                // Cover crop -> always a clean square -> CSS keeps it circular.
                const scale = Math.max(SIZE / img.width, SIZE / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (SIZE - w) / 2;
                const y = (SIZE - h) / 2;
                ctx.clearRect(0, 0, SIZE, SIZE);
                ctx.drawImage(img, x, y, w, h);

                // WebP keeps localStorage considerably smaller where supported.
                let data = canvas.toDataURL('image/webp', 0.82);
                if (!data.startsWith('data:image/webp')) {
                    data = canvas.toDataURL('image/jpeg', 0.82);
                }
                resolve(data);
            };
            img.onerror = () => reject(new Error('Could not read this image.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read this file.'));
        reader.readAsDataURL(file);
    });
}

if (quickLinkIconInput) {
    quickLinkIconInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        const index = activeIconChangeIndex;
        activeIconChangeIndex = null;
        if (!file || index === null || index === undefined || !quickLinks[index]) return;

        try {
            const dataUrl = await compressQuickLinkImage(file);
            quickLinks[index].customIcon = dataUrl;
            renderQuickLinks();
            showToast('Icon changed — click ✓ to save', 'success');
        } catch (err) {
            console.error('Quick link icon error:', err);
            showToast(err.message || 'Could not change icon', 'error');
        } finally {
            quickLinkIconInput.value = '';
        }
    });
}

// ----- Bookmarks Picker Modal -----
function openBookmarksPicker(targetSlot = null) {
    if (targetSlot !== null) activeQuickLinkSlot = targetSlot;
    resetModalState();
    filterBookmarks();
    bookmarksPickerModal.classList.add('active');
}
function closeBookmarksPicker() {
    bookmarksPickerModal.classList.remove('active');
    resetModalState();
}
function resetModalState() {
    selectedBookmarkIndex = null;
    confirmBookmarksBtn.disabled = true;
    if (searchBookmarksInput) searchBookmarksInput.value = '';
    if (customNameInput) customNameInput.value = '';
    if (customUrlInput) customUrlInput.value = '';
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.category === 'all'));
    activeCategory = 'all';
    searchTerm = '';
    filteredBookmarks = [...DEFAULT_BOOKMARKS];
}

function renderBookmarksGrid() {
    if (!bookmarksGrid) return;
    bookmarksGrid.innerHTML = '';
    filteredBookmarks.forEach((bookmark, idx) => {
        const item = document.createElement('div');
        item.className = 'bookmark-item';
        item.dataset.index = idx;
        const faviconUrl = getFaviconUrl(bookmark.url);
        const fallback = escapeAttribute(bookmark.icon || 'fas fa-globe');
        const iconHtml = faviconUrl
            ? `<img src="${escapeAttribute(faviconUrl)}" alt="" onerror="this.onerror=null; this.parentNode.innerHTML='<i class=\\'${fallback}\\'></i>';">`
            : `<i class="${fallback}"></i>`;
        item.innerHTML = `<div class="bookmark-icon">${iconHtml}</div><span class="bookmark-name">${escapeHtml(bookmark.name)}</span><span class="bookmark-category">${escapeHtml(bookmark.category)}</span>`;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.bookmark-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            selectedBookmarkIndex = idx;
            confirmBookmarksBtn.disabled = false;
        });
        bookmarksGrid.appendChild(item);
    });
}

function filterBookmarks() {
    const category = activeCategory;
    const term = searchTerm.toLowerCase().trim();
    filteredBookmarks = DEFAULT_BOOKMARKS.filter(bookmark => {
        const matchesCategory = category === 'all' || bookmark.category === category;
        const matchesSearch = term === '' || bookmark.name.toLowerCase().includes(term) || bookmark.url.toLowerCase().includes(term);
        return matchesCategory && matchesSearch;
    });
    renderBookmarksGrid();
}

function assignBookmarkToActiveSlot() {
    if (selectedBookmarkIndex === null) return;
    const bookmark = { ...filteredBookmarks[selectedBookmarkIndex] };
    quickLinks[activeQuickLinkSlot] = bookmark;
    saveQuickLinksToStorage();
    renderQuickLinks();
    showToast(`Link "${bookmark.name}" added`, 'success');
}

function addCustomBookmark() {
    const name = customNameInput.value.trim();
    let url = customUrlInput.value.trim();
    if (!name || !url) {
        showToast('Please enter both name and URL', 'warning');
        return;
    }
    if (!url.match(/^https?:\/\//i)) url = 'https://' + url;
    const customBookmark = { name, url, category: 'custom', icon: 'fas fa-link' };
    DEFAULT_BOOKMARKS.push(customBookmark);
    // Rebuild filteredBookmarks using the existing filtering/search/category system
    // so the custom bookmark's position honors the current filters exactly like
    // any other bookmark would.
    filterBookmarks();
    // Locate the EXACT custom bookmark we just created (by object reference) in the
    // freshly filtered list, rather than assuming it's first in the DOM. This avoids
    // accidentally selecting an unrelated bookmark (e.g. Spotify) when list order/index
    // shifts due to filtering.
    const exactIndex = filteredBookmarks.indexOf(customBookmark);
    if (exactIndex !== -1) {
        const targetItem = bookmarksGrid.querySelector(`.bookmark-item[data-index="${exactIndex}"]`);
        if (targetItem) {
            document.querySelectorAll('.bookmark-item').forEach(el => el.classList.remove('selected'));
            targetItem.classList.add('selected');
            selectedBookmarkIndex = exactIndex;
            confirmBookmarksBtn.disabled = false;
            // Scroll the newly created custom bookmark into view so the user can
            // visibly see it highlighted/selected BEFORE clicking Confirm to set it.
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    showToast('Custom bookmark created', 'success');
}

function loadQuickLinksFromStorage() {
    const saved = localStorage.getItem(QUICK_LINKS_STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            quickLinks = Array.isArray(parsed) && parsed.length === 9 ? parsed : new Array(9).fill(null);
        } catch (e) {
            quickLinks = new Array(9).fill(null);
        }
    } else {
        quickLinks = new Array(9).fill(null);
    }
}

function saveQuickLinksToStorage() {
    try {
        localStorage.setItem(QUICK_LINKS_STORAGE_KEY, JSON.stringify(quickLinks));
        updateEditButtonVisibility();
        return true;
    } catch (e) {
        showToast('Could not save quick links. Storage is full.', 'error');
        return false;
    }
}

function toggleEditMode() {
    if (!editMode) {
        editMode = true;
        renderQuickLinks();
        if (editQuickLinksBtn) {
            const icon = editQuickLinksBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-check';
            editQuickLinksBtn.title = 'Done Editing Quick Links';
        }
        return;
    }

    const saved = saveQuickLinksToStorage();
    editMode = false;
    renderQuickLinks();
    if (editQuickLinksBtn) {
        const icon = editQuickLinksBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-pencil-alt';
        editQuickLinksBtn.title = 'Edit Quick Links';
    }
    if (saved) showToast('Quick links saved', 'success');
}

function updateEditButtonVisibility() {
    if (editQuickLinksBtn) editQuickLinksBtn.style.display = 'flex';
}

function handleBookmarksBtnClick() {
    const emptyIndex = quickLinks.findIndex(link => link === null);
    if (emptyIndex !== -1) {
        activeQuickLinkSlot = emptyIndex;
        openBookmarksPicker();
    } else {
        openReplaceLinkModal();
    }
}

function openReplaceLinkModal() { replaceLinkModal.classList.add('active'); }
function closeReplaceLinkModal() { replaceLinkModal.classList.remove('active'); }
function closeDeleteConfirmModal() { deleteConfirmModal.classList.remove('active'); pendingDeleteIndex = null; }
function confirmDelete() {
    if (pendingDeleteIndex !== null) {
        quickLinks[pendingDeleteIndex] = null;
        renderQuickLinks();
        showToast('Link removed — click ✓ to save', 'info');
        closeDeleteConfirmModal();
    }
}

function initBookmarksPickerEvents() {
    if (cancelBookmarksBtn) cancelBookmarksBtn.addEventListener('click', closeBookmarksPicker);
    if (confirmBookmarksBtn) confirmBookmarksBtn.addEventListener('click', () => { assignBookmarkToActiveSlot(); closeBookmarksPicker(); });
    if (searchBookmarksInput) searchBookmarksInput.addEventListener('input', e => { searchTerm = e.target.value; filterBookmarks(); });
    document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.category;
        filterBookmarks();
    }));
    if (addCustomBookmarkBtn) addCustomBookmarkBtn.addEventListener('click', addCustomBookmark);
    if (customUrlInput) customUrlInput.addEventListener('keypress', e => { if (e.key === 'Enter') addCustomBookmark(); });

    if (bookmarksBtn) bookmarksBtn.addEventListener('click', handleBookmarksBtnClick);

    if (cancelReplaceLinkBtn) cancelReplaceLinkBtn.addEventListener('click', closeReplaceLinkModal);
    if (confirmReplaceLinkBtn) confirmReplaceLinkBtn.addEventListener('click', () => {
        closeReplaceLinkModal();
        openBookmarksPicker();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && replaceLinkModal.classList.contains('active')) closeReplaceLinkModal();
    });
    replaceLinkModal.addEventListener('click', e => { if (e.target === replaceLinkModal) closeReplaceLinkModal(); });

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && deleteConfirmModal.classList.contains('active')) closeDeleteConfirmModal(); });
    deleteConfirmModal.addEventListener('click', e => { if (e.target === deleteConfirmModal) closeDeleteConfirmModal(); });

    if (editQuickLinksBtn) editQuickLinksBtn.addEventListener('click', toggleEditMode);
}

// ========== iOS / APPLE STYLE WEATHER WIDGET – FREE OPEN-METEO API ==========
const weatherEl = document.getElementById('weather');
const WEATHER_PERMISSION_KEY = 'ambientTab_weatherPermissionGranted';
const WEATHER_CACHE_KEY = 'ambientTab_weatherCacheV2';
const WEATHER_UNIT_KEY = 'ambientTab_weatherUnit';

let weatherPermissionGranted = localStorage.getItem(WEATHER_PERMISSION_KEY) === 'true';
let weatherUnit = localStorage.getItem(WEATHER_UNIT_KEY) === 'F' ? 'F' : 'C';
let weatherDataCache = null;
let weatherLocationName = null;
let weatherCoords = null;
let weatherEventsBound = false;
let weatherAutoRefreshTimer = null;
let weatherIsLoading = false;

// ---- Restore last known weather from localStorage (instant paint on load) ----
(function restoreWeatherCache() {
    try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.temp === 'number') {
            weatherDataCache = parsed;
            weatherLocationName = parsed.location || null;
            if (parsed.coords) weatherCoords = parsed.coords;
        }
    } catch (e) { /* ignore corrupt cache */ }
})();

function saveWeatherCache() {
    try {
        if (weatherDataCache) {
            localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherDataCache));
        }
    } catch (e) { /* storage full – ignore */ }
}

// ---- WMO weather code -> icon / label / theme ----
function getWeatherInfo(code, isDay) {
    const day = isDay === undefined ? true : !!isDay;
    const sunIcon = day ? 'fa-sun' : 'fa-moon';
    const partIcon = day ? 'fa-cloud-sun' : 'fa-cloud-moon';
    const clearTheme = day ? 'clear-day' : 'clear-night';
    const cloudTheme = day ? 'cloud-day' : 'cloud-night';

    const map = {
        0: { label: 'Clear Sky', icon: sunIcon, theme: clearTheme },
        1: { label: 'Mainly Clear', icon: sunIcon, theme: clearTheme },
        2: { label: 'Partly Cloudy', icon: partIcon, theme: cloudTheme },
        3: { label: 'Overcast', icon: 'fa-cloud', theme: cloudTheme },
        45: { label: 'Foggy', icon: 'fa-smog', theme: 'fog' },
        48: { label: 'Rime Fog', icon: 'fa-smog', theme: 'fog' },
        51: { label: 'Light Drizzle', icon: 'fa-cloud-rain', theme: 'rain' },
        53: { label: 'Drizzle', icon: 'fa-cloud-rain', theme: 'rain' },
        55: { label: 'Heavy Drizzle', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        56: { label: 'Freezing Drizzle', icon: 'fa-cloud-rain', theme: 'rain' },
        57: { label: 'Freezing Drizzle', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        61: { label: 'Light Rain', icon: 'fa-cloud-rain', theme: 'rain' },
        63: { label: 'Rainy', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        65: { label: 'Heavy Rain', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        66: { label: 'Freezing Rain', icon: 'fa-cloud-rain', theme: 'rain' },
        67: { label: 'Freezing Rain', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        71: { label: 'Light Snow', icon: 'fa-snowflake', theme: 'snow' },
        73: { label: 'Snowfall', icon: 'fa-snowflake', theme: 'snow' },
        75: { label: 'Heavy Snow', icon: 'fa-snowflake', theme: 'snow' },
        77: { label: 'Snow Grains', icon: 'fa-snowflake', theme: 'snow' },
        80: { label: 'Light Showers', icon: 'fa-cloud-sun-rain', theme: 'rain' },
        81: { label: 'Rain Showers', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        82: { label: 'Heavy Showers', icon: 'fa-cloud-showers-heavy', theme: 'rain' },
        85: { label: 'Snow Showers', icon: 'fa-snowflake', theme: 'snow' },
        86: { label: 'Snow Showers', icon: 'fa-snowflake', theme: 'snow' },
        95: { label: 'Thunderstorm', icon: 'fa-cloud-bolt', theme: 'thunder' },
        96: { label: 'Storm & Hail', icon: 'fa-cloud-bolt', theme: 'thunder' },
        99: { label: 'Storm & Hail', icon: 'fa-cloud-bolt', theme: 'thunder' }
    };

    return map[code] || { label: 'Weather', icon: partIcon, theme: cloudTheme };
}

// ---- Small helpers ----
function wxTemp(c) {
    if (typeof c !== 'number' || isNaN(c)) return '--';
    return weatherUnit === 'F' ? Math.round((c * 9) / 5 + 32) : Math.round(c);
}

function wxClockLabel(iso) {
    if (!iso || iso.length < 16) return '--';
    let hh = parseInt(iso.slice(11, 13), 10);
    const mm = iso.slice(14, 16);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return hh + ':' + mm + ' ' + ampm;
}

// ---- Initialize Weather Box ----
function initWeatherBox() {
    if (!weatherEl) return;
    bindWeatherEvents();

    // If cached data exists, render immediately
    if (weatherDataCache && typeof weatherDataCache.temp === 'number') {
        renderWeatherCard(weatherDataCache);
        return;
    }

    // Auto-load weather seamlessly via IP lookup so the widget works immediately
    fetchWeatherByIP();
}

// ---- Loading state ----
function showWeatherLoading() {
    if (!weatherEl) return;
    if (weatherDataCache && typeof weatherDataCache.temp === 'number') {
        // Card already visible – sirf shimmer overlay lagao
        const card = weatherEl.querySelector('.wx-card');
        if (card && !card.querySelector('.wx-skeleton')) {
            const sk = document.createElement('div');
            sk.className = 'wx-skeleton';
            card.appendChild(sk);
        }
        return;
    }
    weatherEl.innerHTML = `
        <div class="wx-card" data-wx="cloud-day">
          <div class="wx-bg"></div>
          <div class="wx-glow"></div>
          <div class="wx-gloss"></div>
          <div class="wx-state">
            <div class="wx-state-icon"><i class="fas fa-satellite-dish"></i></div>
            <div class="wx-state-title">Getting weather…</div>
            <div class="wx-state-sub">One moment please</div>
          </div>
          <div class="wx-skeleton"></div>
        </div>
      `;
}

function clearWeatherLoading() {
    if (!weatherEl) return;
    const sk = weatherEl.querySelector('.wx-skeleton');
    if (sk) sk.remove();
}

// ---- Click / unit toggle (bound only once) ----
function bindWeatherEvents() {
    if (weatherEventsBound || !weatherEl) return;
    weatherEventsBound = true;

    weatherEl.addEventListener('click', (e) => {
        if (document.body.classList.contains('layout-edit-mode')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const unitBtn = e.target.closest('[data-wx-unit]');
        if (unitBtn) {
            e.stopPropagation();
            e.preventDefault();
            toggleWeatherUnit();
            return;
        }
        const locBtn = e.target.closest('.wx-loc');
        if (locBtn) {
            e.stopPropagation();
            e.preventDefault();
            promptCitySearch();
            return;
        }
        weatherClickHandler(e);
    });
}

function toggleWeatherUnit() {
    weatherUnit = weatherUnit === 'C' ? 'F' : 'C';
    try { localStorage.setItem(WEATHER_UNIT_KEY, weatherUnit); } catch (e) { }
    if (weatherDataCache) renderWeatherCard(weatherDataCache);
}

// ---- Manual City Search Prompt ----
async function promptCitySearch() {
    const current = weatherLocationName || '';
    const city = prompt('Enter city name (e.g. London, New York, Tokyo, Mumbai):', current);
    if (!city || !city.trim()) return;

    showWeatherLoading();
    try {
        const query = encodeURIComponent(city.trim());
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1&language=en&format=json`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
            const loc = data.results[0];
            const lat = loc.latitude;
            const lon = loc.longitude;
            weatherCoords = { lat, lon };
            weatherLocationName = loc.name + (loc.country ? ', ' + loc.country : '');
            weatherPermissionGranted = true;
            try { localStorage.setItem(WEATHER_PERMISSION_KEY, 'true'); } catch (e) { }
            fetchWeatherAndUpdate(lat, lon);
            if (typeof showToast === 'function') {
                showToast('Weather updated for ' + loc.name, 'success', 2500);
            }
        } else {
            clearWeatherLoading();
            alert('Could not find city "' + city + '". Please try again.');
            if (weatherDataCache) renderWeatherCard(weatherDataCache);
        }
    } catch (err) {
        clearWeatherLoading();
        console.warn('City search failed:', err);
        alert('Network error searching for city. Please check connection.');
        if (weatherDataCache) renderWeatherCard(weatherDataCache);
    }
}

// ---- Fallback Card with Manual City Option ----
function showWeatherManualPrompt() {
    if (!weatherEl) return;
    weatherEl.innerHTML = `
      <div class="wx-card" data-wx="cloud-day">
        <div class="wx-bg"></div>
        <div class="wx-glow"></div>
        <div class="wx-gloss"></div>
        <div class="wx-state">
          <div class="wx-state-icon"><i class="fas fa-location-dot"></i></div>
          <div class="wx-state-title">Location Unavailable</div>
          <div class="wx-state-sub">Tap below to set your city</div>
          <div class="wx-chip wx-set-city-chip"><i class="fas fa-search"></i> Set City Manually</div>
        </div>
      </div>
    `;
    const chip = weatherEl.querySelector('.wx-set-city-chip');
    if (chip) {
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            promptCitySearch();
        });
    }
}

// ---- Fast & Silent IP-Based Geolocation Fallback (No GPS Prompt Required) ----
async function fetchWeatherByIP() {
    weatherIsLoading = true;
    showWeatherLoading();

    // 1. Primary: GeoJS (Cloudflare CDN, free, CORS-enabled, reliable)
    try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (res.ok) {
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
                const lat = parseFloat(data.latitude);
                const lon = parseFloat(data.longitude);
                if (!isNaN(lat) && !isNaN(lon)) {
                    weatherCoords = { lat, lon };
                    weatherLocationName = data.city || data.region || data.country || 'Local Weather';
                    weatherPermissionGranted = true;
                    try { localStorage.setItem(WEATHER_PERMISSION_KEY, 'true'); } catch (e) { }
                    fetchWeatherAndUpdate(lat, lon);
                    return true;
                }
            }
        }
    } catch (err) {
        console.info('GeoJS IP lookup unavailable, trying secondary backup...');
    }

    // 2. Secondary fallback: ipapi.co
    try {
        const res2 = await fetch('https://ipapi.co/json/');
        if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.latitude && data2.longitude) {
                const lat = parseFloat(data2.latitude);
                const lon = parseFloat(data2.longitude);
                if (!isNaN(lat) && !isNaN(lon)) {
                    weatherCoords = { lat, lon };
                    weatherLocationName = data2.city || data2.region || data2.country_name || 'Local Weather';
                    weatherPermissionGranted = true;
                    try { localStorage.setItem(WEATHER_PERMISSION_KEY, 'true'); } catch (e) { }
                    fetchWeatherAndUpdate(lat, lon);
                    return true;
                }
            }
        }
    } catch (err2) {
        console.info('Secondary IP lookup unavailable.');
    }

    // 3. Fallback to cached data or manual prompt
    weatherIsLoading = false;
    clearWeatherLoading();
    if (weatherDataCache && typeof weatherDataCache.temp === 'number') {
        renderWeatherCard(weatherDataCache);
        return true;
    }

    showWeatherManualPrompt();
    return false;
}

function weatherClickHandler(e) {
    if (e) e.stopPropagation();
    if (weatherIsLoading) return;

    // If coordinates are already known, refresh weather directly
    if (weatherCoords && typeof weatherCoords.lat === 'number') {
        showWeatherLoading();
        fetchWeatherAndUpdate(weatherCoords.lat, weatherCoords.lon);
        return;
    }

    // Otherwise try GPS first; if denied or unavailable, silently use IP lookup
    showWeatherLoading();
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                weatherPermissionGranted = true;
                try { localStorage.setItem(WEATHER_PERMISSION_KEY, 'true'); } catch (e) { }
                const { latitude, longitude } = position.coords;
                weatherCoords = { lat: latitude, lon: longitude };
                fetchWeatherAndUpdate(latitude, longitude);
                fetchLocationName(latitude, longitude);
            },
            (error) => {
                console.info('GPS geolocation unavailable or denied (' + (error ? error.message : '') + '), using IP geolocation fallback.');
                fetchWeatherByIP();
            },
            { timeout: 5000, maximumAge: 300000 }
        );
    } else {
        fetchWeatherByIP();
    }
}

// ---- Network helper : Direct fetch using extension host_permissions ----
function wxRequest(url, cb) {
    fetch(url)
        .then((r) => {
            if (!r.ok) throw new Error('HTTP error ' + r.status);
            return r.json();
        })
        .then((d) => cb(true, d))
        .catch((err) => {
            console.warn('Weather fetch error:', err.message || err);
            cb(false, null);
        });
}

// ---- Main fetch ----
async function fetchWeatherAndUpdate(lat, lon) {
    // ===== SAFETY CHECK =====
    if (!lat || !lon) {
        if (weatherCoords) {
            lat = weatherCoords.lat;
            lon = weatherCoords.lon;
        } else if (weatherDataCache) {
            renderWeatherCard(weatherDataCache);
            return;
        } else {
            initWeatherBox();
            return;
        }
    }

    weatherCoords = { lat, lon };
    weatherIsLoading = true;
    showWeatherLoading();

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
        `&current_weather=true&timezone=auto&forecast_days=2&temperature_unit=celsius&wind_speed_unit=kmh`;

    wxRequest(url, (ok, data) => {
        weatherIsLoading = false;
        clearWeatherLoading();

        if (!ok || !data) {
            showWeatherUnavailable();
            return;
        }

        const cur = data.current || {};
        const legacy = data.current_weather || {};
        const daily = data.daily || {};

        const temp = typeof cur.temperature_2m === 'number' ? cur.temperature_2m : legacy.temperature;

        if (typeof temp !== 'number') {
            showWeatherUnavailable();
            return;
        }

        weatherDataCache = {
            temp: temp,
            feels: typeof cur.apparent_temperature === 'number' ? cur.apparent_temperature : temp,
            humidity: typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : null,
            wind: typeof cur.wind_speed_10m === 'number' ? cur.wind_speed_10m : legacy.windspeed,
            code: typeof cur.weather_code === 'number' ? cur.weather_code : legacy.weathercode,
            isDay: typeof cur.is_day === 'number' ? cur.is_day : 1,
            max: daily.temperature_2m_max ? daily.temperature_2m_max[0] : null,
            min: daily.temperature_2m_min ? daily.temperature_2m_min[0] : null,
            sunrise: daily.sunrise ? daily.sunrise[0] : null,
            sunset: daily.sunset ? daily.sunset[0] : null,
            location: weatherLocationName || (weatherDataCache && weatherDataCache.location) || null,
            coords: { lat, lon },
            updated: Date.now()
        };

        saveWeatherCache();
        renderWeatherCard(weatherDataCache);
        startWeatherAutoRefresh();

        // Location name pata nahi hai to le aao
        if (!weatherLocationName) fetchLocationName(lat, lon);
    });
}

function showWeatherUnavailable() {
    if (!weatherEl) return;
    weatherIsLoading = false;

    // Purana data hai to usi ko dikhao, warna error card
    if (weatherDataCache && typeof weatherDataCache.temp === 'number') {
        renderWeatherCard(weatherDataCache);
        return;
    }

    weatherEl.innerHTML = `
      <div class="wx-card" data-wx="fog">
        <div class="wx-bg"></div>
        <div class="wx-glow"></div>
        <div class="wx-gloss"></div>
        <div class="wx-state">
          <div class="wx-state-icon"><i class="fas fa-cloud-rain"></i></div>
          <div class="wx-state-title">Weather unavailable</div>
          <div class="wx-state-sub">Check your connection</div>
          <div class="wx-chip">Tap to retry</div>
        </div>
      </div>
    `;
}

function fetchLocationName(lat, lon) {
    const url =
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;

    wxRequest(url, (ok, data) => {
        if (!ok || !data) {
            console.warn('Could not fetch location name');
            return;
        }

        if (data && data.results && data.results[0]) {
            const loc = data.results[0];

            weatherLocationName =
                loc.name ||
                loc.admin1 ||
                loc.admin2 ||
                'Your location';

            if (weatherDataCache) {
                weatherDataCache.location = weatherLocationName;
                saveWeatherCache();
                renderWeatherCard(weatherDataCache);
            }
        }
    });
}

// ---- The actual iOS style card renderer ----
function renderWeatherCard(d) {
    if (!weatherEl || !d) return;
    bindWeatherEvents();

    const info = getWeatherInfo(d.code, d.isDay);
    const locationDisplay = d.location || weatherLocationName || 'Your location';
    const unitLabel = weatherUnit === 'C' ? '°C' : '°F';

    // High / Low
    let hl = '';
    if (typeof d.max === 'number' && typeof d.min === 'number') {
        hl = `<span class="wx-hl">&nbsp;· H:${wxTemp(d.max)}° L:${wxTemp(d.min)}°</span>`;
    }

    // Sunrise ya sunset – jo next aane wala hai
    let sunIcon = 'fa-clock';
    let sunVal = '--';
    if (d.isDay && d.sunset) {
        sunIcon = 'fa-arrow-down';
        sunVal = wxClockLabel(d.sunset);
    } else if (d.sunrise) {
        sunIcon = 'fa-arrow-up';
        sunVal = wxClockLabel(d.sunrise);
    }

    weatherEl.innerHTML = `
        <div class="wx-card" data-wx="${info.theme}">
          <div class="wx-bg"></div>
          <div class="wx-glow"></div>
          <div class="wx-gloss"></div>

          <div class="wx-content">
            <div class="wx-top">
              <div class="wx-loc" title="Click to change city" style="cursor: pointer;">
                <i class="fas fa-location-dot"></i>
                <span>${escapeHtml(locationDisplay)}</span>
                <i class="fas fa-pencil" style="font-size: 8px; opacity: 0.6; margin-left: 2px;"></i>
              </div>
              <div class="wx-sun" title="${d.isDay ? 'Sunset' : 'Sunrise'}">
                <i class="fas ${sunIcon}"></i>
                <span>${sunVal}</span>
              </div>
              <button class="wx-unit" data-wx-unit title="Switch unit">${unitLabel}</button>
            </div>

            <div class="wx-main">
              <div class="wx-left">
                <div class="wx-temp">${wxTemp(d.temp)}<span class="wx-deg">°</span></div>
                <div class="wx-cond">${info.label}${hl}</div>
              </div>
              <div class="wx-icon"><i class="fas ${info.icon}"></i></div>
            </div>

            <div class="wx-stats">
              <div class="wx-stat" title="Feels like">
                <i class="fas fa-temperature-half"></i>
                <span>${wxTemp(d.feels)}°</span>
              </div>
              <div class="wx-stat" title="Humidity">
                <i class="fas fa-droplet"></i>
                <span>${d.humidity !== null && d.humidity !== undefined ? Math.round(d.humidity) + '%' : '--'}</span>
              </div>
              <div class="wx-stat" title="Wind speed">
                <i class="fas fa-wind"></i>
                <span>${typeof d.wind === 'number' ? Math.round(d.wind) : '--'} km/h</span>
              </div>
            </div>
          </div>
        </div>
      `;

    weatherEl.style.cursor = 'pointer';
}

// Purane naam ka wrapper – baaki code ke liye compatible
function updateWeatherUI(temp, location = '') {
    if (!weatherEl) return;

    if (location) weatherLocationName = location;

    if (weatherDataCache) {
        if (typeof temp === 'number') weatherDataCache.temp = temp;
        if (weatherLocationName) weatherDataCache.location = weatherLocationName;
        renderWeatherCard(weatherDataCache);
        return;
    }

    if (typeof temp === 'number') {
        renderWeatherCard({
            temp: temp,
            feels: temp,
            humidity: null,
            wind: null,
            code: 0,
            isDay: 1,
            location: weatherLocationName || location
        });
    } else {
        initWeatherBox();
    }
}

// ---- Auto refresh har 15 minute ----
function startWeatherAutoRefresh() {
    if (weatherAutoRefreshTimer) clearInterval(weatherAutoRefreshTimer);
    weatherAutoRefreshTimer = setInterval(() => {
        if (weatherPermissionGranted && weatherCoords && !document.hidden) {
            fetchWeatherAndUpdate(weatherCoords.lat, weatherCoords.lon);
        }
    }, 15 * 60 * 1000);
}

// Automatically refresh weather on tab load without triggering browser GPS prompts
function autoFetchWeatherIfGranted() {
    // 1. If coordinates are already known, refresh weather directly
    if (weatherCoords && typeof weatherCoords.lat === 'number') {
        fetchWeatherAndUpdate(weatherCoords.lat, weatherCoords.lon);
        return;
    }

    // 2. If cached data exists with coordinates, restore coords and refresh
    if (weatherDataCache && weatherDataCache.coords && typeof weatherDataCache.coords.lat === 'number') {
        weatherCoords = weatherDataCache.coords;
        fetchWeatherAndUpdate(weatherCoords.lat, weatherCoords.lon);
        return;
    }

    // 3. Auto-load weather seamlessly via IP lookup so the widget works without GPS prompts
    fetchWeatherByIP();
}

// ========== SCROLL HINT OVERLAY (suppressed in zero-scroll mode) ==========
function initScrollHint() {
    const scrollHint = document.getElementById('scrollHint');
    if (scrollHint) {
        scrollHint.style.display = 'none';
        scrollHint.classList.remove('active');
    }
    return;

    // Auto-dismiss after 5 seconds, save to localStorage
    let dismissTimer = setTimeout(() => {
        dismissScrollHint();
    }, 5000);

    function dismissScrollHint() {
        clearTimeout(dismissTimer);
        localStorage.setItem('halo_scroll_hint_seen', 'true');
        scrollHint.classList.add('fade-out');
        scrollHint.classList.remove('active');
        // Clean up after transition
        setTimeout(() => {
            scrollHint.style.display = 'none';
        }, 600);
    }

    // Also dismiss on scroll (user already got the hint)
    const onScroll = () => {
        if (window.scrollY > 10) {
            dismissScrollHint();
            window.removeEventListener('scroll', onScroll);
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}

// ========== ONBOARDING POPUP (first‑time experience) ==========
function initOnboarding() {
    const onboardingModal = document.getElementById('onboardingModal');
    const gotItBtn = document.getElementById('onboardingGotItBtn');
    const seen = localStorage.getItem('halo_onboarding_seen');

    if (!seen) {
        // Show the modal
        onboardingModal.classList.add('active');
    }

    function closeOnboarding() {
        localStorage.setItem('halo_onboarding_seen', 'true');
        onboardingModal.classList.remove('active');
        // After onboarding is dismissed, show scroll hint (with small delay for smooth UX)
        setTimeout(() => {
            initScrollHint();
        }, 400);
    }

    gotItBtn.addEventListener('click', closeOnboarding);

    // Optional: close by clicking outside (like other modals)
    onboardingModal.addEventListener('click', (e) => {
        if (e.target === onboardingModal) {
            closeOnboarding();
        }
    });
}

// ========== ADDITIONAL EVENT LISTENERS FOR NEW UI ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Clock initialization
    loadClockMode(); // Load saved clock mode
    updateClock();
    setInterval(updateClock, 1000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateClock();
    });

    // Version check and auto-update
    const storedVersion = localStorage.getItem('ambientTab_version');
    if (storedVersion !== APP_VERSION) {
        localStorage.setItem('ambientTab_version', APP_VERSION);
        // Safe reinitialization – version changed, ensure all data structures are up to date
        // (migrations are already handled per feature)
        console.log(`Version updated from ${storedVersion} to ${APP_VERSION}`);
    }

    try {
        await initIndexedDB();
        await loadSavedBackground();
    } catch (error) {
        console.error('Error initializing app:', error);
    }

    // Ambient Control listeners (exclusively for background video)
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', toggleMute);
    }
    // Next button is hidden, no listener needed
    if (volumeUpBtn) {
        volumeUpBtn.addEventListener('click', volumeUp);
    }
    if (volumeDownBtn) {
        volumeDownBtn.addEventListener('click', volumeDown);
    }

    // Set initial volume
    applyVolumeToAllMedia();

    loadVisibility();
    // Initialize Quick Links system
    initQuickLinks();
    initBookmarksPickerEvents();
    // Initialize Notes
    initNotes();
    initNotesModalEvents();

    // Vertical controls / side panel auto-hide listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', (e) => {
        if (!e.relatedTarget && !e.toElement) {
            hideControls(250);
        }
    });
    window.addEventListener('blur', () => {
        hideControls(200);
    });

    const bgControls = document.getElementById('backgroundControls');
    if (bgControls) {
        bgControls.addEventListener('mouseenter', handleControlsMouseEnter);
        bgControls.addEventListener('mouseleave', handleControlsMouseLeave);
    }

    // Also keep vertical controls visible when hovered and auto-hide when left
    const verticalControls = document.getElementById('verticalControls');
    if (verticalControls) {
        verticalControls.addEventListener('mouseenter', handleControlsMouseEnter);
        verticalControls.addEventListener('mouseleave', handleControlsMouseLeave);
    }

    // Dismiss customize sub-buttons when clicking anywhere outside
    document.addEventListener('click', (e) => {
        const customizeSub = document.getElementById('customizeSubButtons');
        const customizeBtn = document.getElementById('customizeBtn');
        if (customizeSub && customizeSub.classList.contains('visible')) {
            if (!customizeSub.contains(e.target) && (!customizeBtn || !customizeBtn.contains(e.target))) {
                customizeSub.classList.remove('visible');
            }
        }
    });

    // Old mute button – fully disabled (no mute control outside Ambient)
    muteBtn.addEventListener('click', () => { });

    // Upload button in old controls – we trigger it from the new icon
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
        switchMediaType('saved');
    });

    mediaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchMediaType(tab.dataset.type);
        });
    });

    cancelBtn.addEventListener('click', () => {
        uploadModal.classList.remove('active');
        resetPreview();
        resumeAllVideos();
    });

    confirmBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        await setBackground(selectedFile);

        uploadModal.classList.remove('active');
        resetPreview();
        resumeAllVideos();
    });

    removeBtn.addEventListener('click', removeBackground);

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        handleFile(file);
        uploadInput.value = '';
    });

    uploadZone.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(96, 165, 250, 0.5)';
        uploadZone.style.background = 'rgba(96, 165, 250, 0.1)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        uploadZone.style.background = 'transparent';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        uploadZone.style.background = 'transparent';

        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('video/') || file.type.startsWith('image/'))) {
            handleFile(file);
        } else {
            mediaError.textContent = 'Please drop a video or image file.';
            mediaError.classList.add('active');
        }
    });

    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.remove('active');
            resetPreview();
            resumeAllVideos();
        }
    });

    window.addEventListener('beforeunload', () => {
        if (mediaPreview.src && mediaPreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(mediaPreview.src);
        }
        if (imagePreview.src && imagePreview.src.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview.src);
        }
    });

    // ===== NEW BUTTON HANDLERS =====
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Upload background (reuse existing upload logic)
    const uploadIconBtn = document.getElementById('uploadBgIconBtn');
    if (uploadIconBtn) {
        uploadIconBtn.addEventListener('click', () => {
            uploadBtn.click(); // triggers the hidden upload button
        });
    }

    // ===== NEW: SPEAKER BUTTON HANDLER – DISABLED =====
    if (bgSpeakerBtn) {
        bgSpeakerBtn.addEventListener('click', () => { });
    }

    // ===== NEW: REMOVE BUTTON HANDLER =====
    if (bgRemoveBtn) {
        bgRemoveBtn.addEventListener('click', () => {
            removeBackground();
        });
    }

    // ===== CUSTOMIZE BUTTON =====
    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            customizeSub.classList.toggle('visible');
        });
    }

    // ===== HIDE BOXES =====
    if (hideBoxesBtn) {
        hideBoxesBtn.addEventListener('click', () => {
            openHideBoxesModal();
            customizeSub.classList.remove('visible');
        });
    }

    // ===== CLOCK MODE BUTTON =====
    if (clockModeBtn) {
        clockModeBtn.addEventListener('click', () => {
            toggleClockMode();
            customizeSub.classList.remove('visible');
        });
    }

    // ===== PIN CONTROL BAR BUTTON =====
    // 1st click -> control bar becomes static (always visible on the right side)
    // 2nd click -> back to default (slides in on right-edge hover, hides when cursor leaves)
    if (pinControlsBtn) {
        pinControlsBtn.addEventListener('click', () => {
            setControlsPinned(!controlsPinned);
            customizeSub.classList.remove('visible');
            showToast(
                controlsPinned
                    ? 'Control bar pinned — it will stay visible'
                    : 'Control bar unpinned — auto-hide is back',
                'info',
                2200
            );
        });
    }

    // ===== HIDE BOXES MODAL BUTTONS =====
    if (cancelHideBoxesBtn) {
        cancelHideBoxesBtn.addEventListener('click', closeHideBoxesModal);
    }
    if (confirmHideBoxesBtn) {
        confirmHideBoxesBtn.addEventListener('click', () => {
            applyVisibility();
            closeHideBoxesModal();
        });
    }

    // ===== BOOKMARKS BUTTON =====
    if (bookmarksBtn) {
        bookmarksBtn.addEventListener('click', handleBookmarksBtnClick);
    }

    // How to use
    const howToBtn = document.getElementById('howToBtn');
    if (howToBtn) {
        howToBtn.addEventListener('click', openHowToModal);
    }

    // Close modal via X or outside click
    const closeHowToBtn = document.getElementById('closeHowToModal');
    if (closeHowToBtn) {
        closeHowToBtn.addEventListener('click', closeHowToModal);
    }
    const howToModal = document.getElementById('howToModal');
    if (howToModal) {
        howToModal.addEventListener('click', (e) => {
            if (e.target === howToModal) {
                closeHowToModal();
            }
        });
    }


    // Initialize theme from localStorage
    initTheme();
    initSavedWallpapers();
    // Initial visibility of speaker/remove buttons (in case a background was loaded)
    updateBackgroundControlsVisibility();

    // ===== WEATHER INIT – must happen AFTER weather slot is empty =====
    initWeatherBox();
    autoFetchWeatherIfGranted();

    // Set initial ambient control UI based on current video state safely
    if (video && video.src && !video.paused) {
        updatePlayPauseIcon(true);
        if (nowPlaying) nowPlaying.textContent = 'Background video playing';
    } else if (video && video.src) {
        updatePlayPauseIcon(false);
        if (nowPlaying) nowPlaying.textContent = 'Background video paused';
    } else {
        updatePlayPauseIcon(false);
        if (nowPlaying) nowPlaying.textContent = 'Background video stopped';
    }
    updateMuteIcon();

    // Initialize Todo after DOM ready (listener already attached, but also clear input)
    initTodo();

    // ===== INIT ONBOARDING (first‑time popup) =====
    initOnboarding();

    // ===== REVIEW POPUP: CHECK AND SHOW AFTER ONBOARDING =====
    initReviewPopup();
    if (shouldShowReviewPopup()) {
        showReviewPopup();
    }
});

function handleResize() {
    if (window.innerWidth < 768) {
        overlay.style.backdropFilter = 'blur(1px)';
    } else {
        overlay.style.backdropFilter = 'blur(0.5px)';
    }
}

window.addEventListener('resize', handleResize);
handleResize();

// Todo input listener (isolated, only on todoInput)
if (todoInput) {
    todoInput.removeEventListener('keypress', todoKeypressHandler);
    todoInput.addEventListener('keypress', todoKeypressHandler);
}

function todoKeypressHandler(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent any form submission
        addTask();
    }
}

async function load(id, file) {
    // Remove the clock from load function since it's now integrated
    if (id === "clock") {
        console.log("Clock is now integrated directly in index.html");
        return;
    }

    // Remove todo from load function since it's now integrated
    if (id === "todo") {
        console.log("Todo is now integrated directly in index.html");
        return;
    }

    try {
        const r = await fetch(file);
        if (!r.ok) throw new Error(`Failed to load ${file}`);

        if (id === "media") {
            console.log("Using custom ambient control");
            return;
        }

        document.getElementById(id).innerHTML = await r.text();

        if (window.initComponent && window.initComponent[id]) {
            window.initComponent[id]();
        }
    } catch (error) {
        console.error(`Error loading ${id}:`, error);
        // Keep static fallback, no need to show error
    }
}

/* =========================================================================
   HALO — DRAG & DROP LAYOUT ENGINE (v2)
   - Sidebar > Customize > Move Boxes se enable hota hai
   - Sirf POSITION control karta hai (CSS transform se).
     Box ki width/height ko ye system bilkul touch nahi karta —
     wo pehle jaisi hi dynamic/default rehti hai (notes, clock, todo sab).
   - Positions localStorage me save hoti hain, Reset se default layout wapas.
   ========================================================================= */
(function () {
    'use strict';

    const STORAGE_KEY = 'halo_layout_positions_v2';
    const SLOT_IDS = ['clock', 'weather', 'todo', 'links', 'notes', 'media', 'calendar', 'photoWidget', 'pomodoro', 'dailyFocus', 'quoteCapsule'];
    const MIN_CUSTOM_WIDTH = 768;   // isse chhoti screens par default stacked layout
    const SNAP = 8;                 // pixel grid snapping
    const EDIT_HEADROOM = 260;      // edit mode me neeche extra canvas

    let dashboard = null;
    let saveBar = null;
    let moveBtn = null;

    let positions = {};             // { id: { xr, y } }  -> sirf position, koi size nahi
    let backup = null;              // cancel ke liye snapshot
    let editing = false;
    let dragState = null;
    let rafId = null;
    let heightTimer = null;
    let resizeTimer = null;

    /* ---------------- helpers ---------------- */

    function toast(msg, type, dur) {
        if (typeof showToast === 'function') showToast(msg, type || 'info', dur || 2600);
    }

    function clamp(v, min, max) {
        if (max < min) max = min;
        return Math.min(Math.max(v, min), max);
    }

    function snap(v) {
        return Math.round(v / SNAP) * SNAP;
    }

    function readStore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return {};
            const clean = {};
            SLOT_IDS.forEach(function (id) {
                const p = parsed[id];
                if (p && isFinite(p.xr) && isFinite(p.y)) {
                    clean[id] = {
                        xr: clamp(Number(p.xr), 0, 1),
                        y: Math.max(0, Number(p.y))
                    };
                }
            });
            return clean;
        } catch (e) {
            return {};
        }
    }

    function writeStore() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearStore() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('halo_layout_positions_v1'); // purana data bhi saaf
        } catch (e) { }
    }

    function hasPositions() {
        return Object.keys(positions).length > 0;
    }

    function customAllowed() {
        return window.innerWidth >= MIN_CUSTOM_WIDTH;
    }

    function visibleSlots() {
        const out = [];
        SLOT_IDS.forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            if (window.getComputedStyle(el).display === 'none') return;
            out.push(el);
        });
        return out;
    }

    function canvasWidth() {
        return dashboard ? dashboard.clientWidth : 0;
    }

    // current translate values (px) — CSS variables me store hote hain
    function getShift(el) {
        const x = parseFloat(el.style.getPropertyValue('--halo-x')) || 0;
        const y = parseFloat(el.style.getPropertyValue('--halo-y')) || 0;
        return { x: x, y: y };
    }

    function setShift(el, x, y) {
        el.style.setProperty('--halo-x', Math.round(x) + 'px');
        el.style.setProperty('--halo-y', Math.round(y) + 'px');
    }

    function clearShift(el) {
        el.style.removeProperty('--halo-x');
        el.style.removeProperty('--halo-y');
    }

    /* ---------------- layout apply ---------------- */

    // Scroll headroom ek out-of-flow spacer se milta hai.
    // (Pehle #dashboard ki min-height badhai jaati thi, jisse grid ki auto rows
    //  stretch ho kar clock/weather ke neeche wale boxes niche khisak jaate the.)
    function getSpacer() {
        let sp = document.getElementById('haloLayoutSpacer');
        if (!sp) {
            sp = document.createElement('div');
            sp.id = 'haloLayoutSpacer';
            sp.setAttribute('aria-hidden', 'true');
            dashboard.appendChild(sp);
        }
        return sp;
    }

    function updateCanvasHeight() {
        if (!dashboard || !document.body.classList.contains('layout-custom')) return;
        let maxBottom = 0;
        visibleSlots().forEach(function (el) {
            const b = el.offsetTop + getShift(el).y + el.offsetHeight;
            if (b > maxBottom) maxBottom = b;
        });
        const pad = editing ? EDIT_HEADROOM : 40;
        // grid rows ko chhue bina sirf scroll area extend hota hai
        getSpacer().style.height = Math.round(maxBottom + pad) + 'px';
    }

    function scheduleHeight() {
        clearTimeout(heightTimer);
        heightTimer = setTimeout(updateCanvasHeight, 90);
    }

    // Jo box ki position save nahi hai, uski current (natural) position le lo
    function captureMissingPositions() {
        if (!dashboard) return;
        const W = canvasWidth() || 1;
        visibleSlots().forEach(function (el) {
            if (positions[el.id]) return;
            const shift = getShift(el);
            positions[el.id] = {
                xr: clamp((el.offsetLeft + shift.x) / W, 0, 1),
                y: Math.max(0, Math.round(el.offsetTop + shift.y))
            };
        });
    }

    function applyLayout() {
        if (!dashboard) return;

        if (!hasPositions() || !customAllowed()) {
            deactivate();
            return;
        }

        document.body.classList.add('layout-custom');
        const W = canvasWidth() || 1;

        // Ensure quoteCapsule is always pushed cleanly below dailyFocus if both share the same column
        if (positions['dailyFocus'] && positions['quoteCapsule']) {
            const dfY = positions['dailyFocus'].y || 0;
            const qcY = positions['quoteCapsule'].y || 0;
            const dfXr = positions['dailyFocus'].xr || 0;
            const qcXr = positions['quoteCapsule'].xr || 0;
            if (Math.abs(dfXr - qcXr) < 0.15 && qcY < dfY + 54) {
                positions['quoteCapsule'].y = dfY + 54;
            }
        }

        visibleSlots().forEach(function (el) {
            const p = positions[el.id];
            if (!p) {
                // naya ya dobara dikhaya gaya box — apni natural jagah par hi rahe
                clearShift(el);
                return;
            }

            // NOTE: width/height yahan kabhi set nahi hoti — box apne CSS se hi size leta hai
            const naturalLeft = el.offsetLeft;
            const naturalTop = el.offsetTop;
            const w = el.offsetWidth;

            const left = clamp(Math.round(p.xr * W), 0, Math.max(0, W - w));
            const top = Math.max(0, Math.round(p.y));

            setShift(el, left - naturalLeft, top - naturalTop);
        });

        updateCanvasHeight();
    }

    function deactivate() {
        if (!dashboard) return;
        document.body.classList.remove('layout-custom');
        dashboard.style.minHeight = '';
        const sp = document.getElementById('haloLayoutSpacer');
        if (sp && sp.parentElement) sp.parentElement.removeChild(sp);
        SLOT_IDS.forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            clearShift(el);
            el.classList.remove('is-dragging');
            // purane version ke inline styles agar bache ho to saaf
            el.style.left = '';
            el.style.top = '';
            el.style.width = '';
        });
    }

    /* ---------------- edit mode ---------------- */

    function enterEditMode() {
        if (editing) return;

        if (!customAllowed()) {
            toast('Drag & drop needs a wider screen (768px+)', 'warning');
            return;
        }

        backup = JSON.stringify(positions);
        captureMissingPositions();
        applyLayout();

        editing = true;
        document.body.classList.add('layout-edit-mode');
        if (moveBtn) moveBtn.classList.add('active');
        if (saveBar) saveBar.classList.add('visible');
        updateCanvasHeight();
        toast('Drag boxes anywhere, then press Save', 'info', 3200);
    }

    function exitEditMode(restore) {
        if (!editing) return;

        if (restore) {
            try {
                positions = backup ? JSON.parse(backup) : {};
            } catch (e) {
                positions = {};
            }
        }

        editing = false;
        endDrag(true);
        document.body.classList.remove('layout-edit-mode');
        if (moveBtn) moveBtn.classList.remove('active');
        if (saveBar) saveBar.classList.remove('visible');

        applyLayout();
    }

    function saveLayout() {
        const ok = writeStore();
        exitEditMode(false);
        toast(ok ? 'Layout saved' : 'Could not save layout', ok ? 'success' : 'error');
    }

    function resetLayout() {
        clearStore();
        positions = {};
        backup = '{}';
        editing = false;
        endDrag(true);
        document.body.classList.remove('layout-edit-mode');
        if (moveBtn) moveBtn.classList.remove('active');
        if (saveBar) saveBar.classList.remove('visible');
        deactivate();
        toast('Layout reset to default', 'info');
    }

    /* ---------------- dragging ---------------- */

    function onPointerDown(e) {
        if (!editing || dragState) return;
        if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;

        const el = e.target && e.target.closest ? e.target.closest('.slot') : null;
        if (!el || !el.parentElement || el.parentElement.id !== 'dashboard') return;

        const shift = getShift(el);

        dragState = {
            el: el,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY + window.pageYOffset,
            startLeft: el.offsetLeft + shift.x,   // visual position
            startTop: el.offsetTop + shift.y,
            left: el.offsetLeft + shift.x,
            top: el.offsetTop + shift.y,
            moved: false
        };

        try { el.setPointerCapture(e.pointerId); } catch (err) { }
        el.classList.add('is-dragging');
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;

        // scroll-aware delta — drag ke beech page scroll ho to bhi position sahi rahe
        const dx = e.clientX - dragState.startX;
        const dy = (e.clientY + window.pageYOffset) - dragState.startY;

        if (!dragState.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        dragState.moved = true;

        const el = dragState.el;
        const maxX = Math.max(0, canvasWidth() - el.offsetWidth);

        dragState.left = clamp(snap(dragState.startLeft + dx), 0, maxX);
        dragState.top = Math.max(0, snap(dragState.startTop + dy));

        if (!rafId) {
            rafId = requestAnimationFrame(function () {
                rafId = null;
                if (!dragState) return;
                setShift(dragState.el,
                    dragState.left - dragState.el.offsetLeft,
                    dragState.top - dragState.el.offsetTop);
            });
        }

        // viewport edge ke paas auto-scroll
        if (e.clientY < 70) {
            window.scrollBy(0, -14);
        } else if (e.clientY > window.innerHeight - 70) {
            window.scrollBy(0, 14);
        }

        e.preventDefault();
    }

    function endDrag(silent) {
        if (!dragState) return;

        const el = dragState.el;
        try { el.releasePointerCapture(dragState.pointerId); } catch (err) { }
        el.classList.remove('is-dragging');

        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        if (!silent && dragState.moved) {
            const W = canvasWidth() || 1;
            positions[el.id] = {
                xr: clamp(dragState.left / W, 0, 1),
                y: Math.max(0, dragState.top)
            };
            setShift(el, dragState.left - el.offsetLeft, dragState.top - el.offsetTop);
        }

        dragState = null;
        updateCanvasHeight();
    }

    function onPointerUp(e) {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        endDrag(false);
    }

    /* ---------------- init ---------------- */

    function init() {
        dashboard = document.getElementById('dashboard');
        if (!dashboard) return;

        saveBar = document.getElementById('layoutSaveBar');
        moveBtn = document.getElementById('moveBoxesBtn');

        positions = readStore();
        applyLayout();

        // sidebar button
        if (moveBtn) {
            moveBtn.addEventListener('click', function () {
                const sub = document.getElementById('customizeSubButtons');
                if (sub) sub.classList.remove('visible');
                if (editing) exitEditMode(true); else enterEditMode();
            });
        }

        const saveBtn = document.getElementById('layoutSaveBtn');
        const cancelBtn = document.getElementById('layoutCancelBtn');
        const resetBtn = document.getElementById('layoutResetBtn');

        if (saveBtn) saveBtn.addEventListener('click', saveLayout);
        if (cancelBtn) cancelBtn.addEventListener('click', function () { exitEditMode(true); });
        if (resetBtn) resetBtn.addEventListener('click', resetLayout);

        // drag listeners
        dashboard.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', function () { endDrag(false); });

        // esc = cancel
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && editing) exitEditMode(true);
        });

        // box ka content/size badle to sirf position dobara clamp ho (size untouched)
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(function () {
                if (!document.body.classList.contains('layout-custom')) return;
                if (dragState) return;
                clearTimeout(heightTimer);
                heightTimer = setTimeout(function () {
                    applyLayout();
                }, 90);
            });
            SLOT_IDS.forEach(function (id) {
                const el = document.getElementById(id);
                if (el) ro.observe(el);
            });
        }

        // widget visibility change ke baad layout dobara apply
        const confirmHide = document.getElementById('confirmHideBoxesBtn');
        if (confirmHide) {
            confirmHide.addEventListener('click', function () {
                setTimeout(function () {
                    if (hasPositions()) applyLayout();
                }, 60);
            });
        }

        // clock mode change ke baad position refresh
        const clockModeBtnEl = document.getElementById('clockModeBtn');
        if (clockModeBtnEl) {
            clockModeBtnEl.addEventListener('click', function () {
                setTimeout(function () { if (hasPositions()) applyLayout(); }, 350);
            });
        }

        // responsive
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (editing && !customAllowed()) {
                    exitEditMode(true);
                    toast('Drag mode closed — screen too small', 'warning');
                    return;
                }
                applyLayout();
            }, 140);
        });

        window.addEventListener('load', function () {
            setTimeout(function () { if (hasPositions()) applyLayout(); }, 120);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// =====================================================================
// LIQUID GLASS SYSTEM — Per-Widget Transparency, Ambient Blend, Spotify, Pomodoro
// =====================================================================
(function haloLiquidGlass() {
    'use strict';

    // === STORAGE KEYS ===
    var LS_KEYS = {
        glassAlpha: 'halo_glass_alpha',
        borderAlpha: 'halo_border_alpha',
        blur: 'halo_blur',
        focusDim: 'halo_focus_dim',
        specular: 'halo_specular',
        ambientGlow: 'halo_ambient_glow',
        ambientBlend: 'halo_ambient_blend',
        searchEngine: 'halo_search_engine',
        widgetMap: 'halo_widget_transparency_map',
        dailyFocusText: 'halo_daily_focus_text',
        dailyFocusDone: 'halo_daily_focus_done',
        dailyFocusDate: 'halo_daily_focus_date'
    };

    var SEARCH_ENGINES = {
        google: { label: 'G', url: 'https://www.google.com/search?q=' },
        bing:   { label: 'B', url: 'https://www.bing.com/search?q=' },
        ddg:    { label: 'D', url: 'https://duckduckgo.com/?q=' }
    };
    var ENGINE_ORDER = ['google', 'bing', 'ddg'];

    // === GLOBAL STATE ===
    var glassAlpha = parseFloat(localStorage.getItem(LS_KEYS.glassAlpha)) || 2.5;
    var borderAlpha = parseFloat(localStorage.getItem(LS_KEYS.borderAlpha)) || 6;
    var blurVal = parseFloat(localStorage.getItem(LS_KEYS.blur)) || 20;
    var focusDimEnabled = localStorage.getItem(LS_KEYS.focusDim) !== 'false';
    var specularEnabled = localStorage.getItem(LS_KEYS.specular) !== 'false';
    var ambientGlowEnabled = localStorage.getItem(LS_KEYS.ambientGlow) !== 'false';
    var ambientBlendEnabled = localStorage.getItem(LS_KEYS.ambientBlend) !== 'false';
    var currentEngine = localStorage.getItem(LS_KEYS.searchEngine) || 'google';
    if (!SEARCH_ENGINES[currentEngine]) currentEngine = 'google';

    var widgetTransparencyMap = {};
    try {
        widgetTransparencyMap = JSON.parse(localStorage.getItem(LS_KEYS.widgetMap)) || {};
    } catch (e) {
        widgetTransparencyMap = {};
    }

    var currentTarget = 'global';

    function save(key, val) {
        try { localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : String(val)); } catch (e) { }
    }

    // === APPLY CSS VARIABLES (GLOBAL & PER-WIDGET) ===
    function applyCSSVars() {
        var r = document.documentElement.style;
        r.setProperty('--halo-glass-alpha', (glassAlpha / 100).toFixed(4));
        r.setProperty('--halo-border-alpha', (borderAlpha / 100).toFixed(4));
        r.setProperty('--halo-blur', blurVal + 'px');
        var hoverGlass = glassAlpha === 0 ? 0 : Math.min((glassAlpha / 100) + 0.02, 0.7);
        var hoverBorder = borderAlpha === 0 ? 0 : Math.min((borderAlpha / 100) + 0.03, 0.8);
        r.setProperty('--halo-glass-hover-alpha', hoverGlass.toFixed(4));
        r.setProperty('--halo-border-hover-alpha', hoverBorder.toFixed(4));
        r.setProperty('--specular-opacity', specularEnabled ? '1' : '0');
    }

    function applyAllWidgetCustomizations() {
        Object.keys(widgetTransparencyMap).forEach(function (widgetId) {
            var conf = widgetTransparencyMap[widgetId];
            if (!conf) return;
            var el = document.getElementById(widgetId);
            if (el) {
                el.style.setProperty('--halo-glass-alpha', (conf.glass / 100).toFixed(4));
                el.style.setProperty('--halo-border-alpha', (conf.border / 100).toFixed(4));
                el.style.setProperty('--halo-blur', conf.blur + 'px');
            }
        });
    }

    // === PER-WIDGET TRANSPARENCY SLIDER ENGINE ===
    function initTransparencyControls() {
        var glassSlider = document.getElementById('glassAlphaSlider');
        var borderSlider = document.getElementById('borderAlphaSlider');
        var blurSlider = document.getElementById('blurSlider');
        var glassLabel = document.getElementById('glassAlphaValue');
        var borderLabel = document.getElementById('borderAlphaValue');
        var blurLabel = document.getElementById('blurValue');
        var targetSelect = document.getElementById('haloTargetWidgetSelect');
        var resetBtn = document.getElementById('haloResetWidgetBtn');

        function updateSliderUI(g, b, bl) {
            if (glassSlider) glassSlider.value = g;
            if (borderSlider) borderSlider.value = b;
            if (blurSlider) blurSlider.value = bl;
            if (glassLabel) glassLabel.textContent = g + '%';
            if (borderLabel) borderLabel.textContent = b + '%';
            if (blurLabel) blurLabel.textContent = bl + 'px';
        }

        function refreshControlsForTarget() {
            if (currentTarget === 'global') {
                if (resetBtn) resetBtn.style.display = 'none';
                updateSliderUI(glassAlpha, borderAlpha, blurVal);
            } else {
                var conf = widgetTransparencyMap[currentTarget];
                if (conf) {
                    if (resetBtn) resetBtn.style.display = 'flex';
                    updateSliderUI(conf.glass, conf.border, conf.blur);
                } else {
                    if (resetBtn) resetBtn.style.display = 'none';
                    updateSliderUI(glassAlpha, borderAlpha, blurVal);
                }
            }
        }

        if (targetSelect) {
            targetSelect.addEventListener('change', function () {
                currentTarget = this.value;
                refreshControlsForTarget();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (currentTarget === 'global') return;
                var el = document.getElementById(currentTarget);
                if (el) {
                    el.style.removeProperty('--halo-glass-alpha');
                    el.style.removeProperty('--halo-border-alpha');
                    el.style.removeProperty('--halo-blur');
                }
                delete widgetTransparencyMap[currentTarget];
                save(LS_KEYS.widgetMap, widgetTransparencyMap);
                refreshControlsForTarget();
                if (typeof showToast === 'function') {
                    showToast('Widget reset to global style', 'info', 1500);
                }
            });
        }

        function handleValueChange(prop, val) {
            if (currentTarget === 'global') {
                if (prop === 'glass') { glassAlpha = val; save(LS_KEYS.glassAlpha, val); }
                else if (prop === 'border') { borderAlpha = val; save(LS_KEYS.borderAlpha, val); }
                else if (prop === 'blur') { blurVal = val; save(LS_KEYS.blur, val); }
                applyCSSVars();
            } else {
                if (!widgetTransparencyMap[currentTarget]) {
                    widgetTransparencyMap[currentTarget] = { glass: glassAlpha, border: borderAlpha, blur: blurVal };
                }
                widgetTransparencyMap[currentTarget][prop] = val;
                save(LS_KEYS.widgetMap, widgetTransparencyMap);
                var el = document.getElementById(currentTarget);
                if (el) {
                    var conf = widgetTransparencyMap[currentTarget];
                    el.style.setProperty('--halo-glass-alpha', (conf.glass / 100).toFixed(4));
                    el.style.setProperty('--halo-border-alpha', (conf.border / 100).toFixed(4));
                    el.style.setProperty('--halo-blur', conf.blur + 'px');
                }
                if (resetBtn) resetBtn.style.display = 'flex';
            }
        }

        if (glassSlider) {
            glassSlider.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (glassLabel) glassLabel.textContent = val + '%';
                handleValueChange('glass', val);
            });
        }
        if (borderSlider) {
            borderSlider.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (borderLabel) borderLabel.textContent = val + '%';
                handleValueChange('border', val);
            });
        }
        if (blurSlider) {
            blurSlider.addEventListener('input', function () {
                var val = parseFloat(this.value);
                if (blurLabel) blurLabel.textContent = val + 'px';
                handleValueChange('blur', val);
            });
        }

        refreshControlsForTarget();
    }

    // === TRANSPARENCY POPUP TOGGLE ===
    function initTransparencyPopup() {
        var btn = document.getElementById('transparencyBtn');
        var popup = document.getElementById('haloTransparencyPopup');
        if (!btn || !popup) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var isActive = popup.classList.toggle('active');
            btn.classList.toggle('popup-open', isActive);
            if (!isActive && typeof hideControls === 'function') {
                hideControls(400);
            }
        });

        document.addEventListener('click', function (e) {
            if (popup.classList.contains('active') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                popup.classList.remove('active');
                btn.classList.remove('popup-open');
                if (typeof hideControls === 'function') {
                    hideControls(300);
                }
            }
        });
    }

    // === TOGGLES (Specular, Ambient Blend) ===
    function initToggles() {
        var specularToggle = document.getElementById('specularToggle');
        var ambientBlendToggle = document.getElementById('ambientBlendToggle');

        if (specularToggle) {
            specularToggle.classList.toggle('active', specularEnabled);
            specularToggle.addEventListener('click', function () {
                specularEnabled = !specularEnabled;
                this.classList.toggle('active', specularEnabled);
                save(LS_KEYS.specular, specularEnabled);
                applyCSSVars();
            });
        }

        if (ambientBlendToggle) {
            ambientBlendToggle.classList.toggle('active', ambientBlendEnabled);
            ambientBlendToggle.addEventListener('click', function () {
                ambientBlendEnabled = !ambientBlendEnabled;
                this.classList.toggle('active', ambientBlendEnabled);
                save(LS_KEYS.ambientBlend, ambientBlendEnabled);
                if (!ambientBlendEnabled) {
                    document.querySelectorAll('.slot, #haloSearchBar').forEach(function (el) {
                        el.classList.remove('ambient-blended');
                    });
                }
            });
        }
    }

    // === UNTOUCHED IDLE AMBIENT BLEND ENGINE (Strictly Per-Widget, Independent) ===
    function initAmbientBlendEngine() {
        var widgets = document.querySelectorAll('.slot, #haloSearchBar');
        var widgetLeaveTimers = {};

        function wakeWidget(el) {
            el.classList.remove('ambient-blended');
            if (widgetLeaveTimers[el.id]) {
                clearTimeout(widgetLeaveTimers[el.id]);
                delete widgetLeaveTimers[el.id];
            }
        }

        function blendWidget(el) {
            if (!ambientBlendEnabled) return;
            el.classList.add('ambient-blended');
        }

        widgets.forEach(function (widget) {
            // Waking up widget A does NOT affect any other widget
            widget.addEventListener('mouseenter', function () {
                wakeWidget(this);
            });
            widget.addEventListener('mouseleave', function () {
                var self = this;
                if (!ambientBlendEnabled) return;
                widgetLeaveTimers[self.id] = setTimeout(function () {
                    blendWidget(self);
                }, 1800);
            });
            widget.addEventListener('click', function () {
                wakeWidget(this);
            });
            widget.addEventListener('focusin', function () {
                wakeWidget(this);
            });
        });

        // Initial state: blend idle widgets gently on load without triggering other widgets
        setTimeout(function () {
            if (ambientBlendEnabled) {
                widgets.forEach(function (w) {
                    if (!w.matches(':hover') && !w.contains(document.activeElement)) {
                        blendWidget(w);
                    }
                });
            }
        }, 1500);
    }

    // === SPECULAR REFRACTION (mousemove) ===
    function initSpecularHighlight() {
        var dashboard = document.getElementById('dashboard');
        if (!dashboard) return;

        document.addEventListener('mousemove', function (e) {
            if (!specularEnabled) return;
            var slots = dashboard.querySelectorAll('.slot');
            for (var i = 0; i < slots.length; i++) {
                var rect = slots[i].getBoundingClientRect();
                var relX = e.clientX - rect.left;
                var pct = (relX / rect.width) * 100;
                var specX = ((pct / 100) * 150 - 100) + '%';
                slots[i].style.setProperty('--specular-x', specX);
            }
        }, { passive: true });
    }

    // === 3D PARALLAX TILT (VisionOS Spatial Glass Feel) ===
    function init3DParallaxTilt() {
        var dashboard = document.getElementById('dashboard');
        if (!dashboard) return;

        var slots = dashboard.querySelectorAll('.slot');
        slots.forEach(function (slot) {
            slot.addEventListener('mousemove', function (e) {
                if (document.body.classList.contains('layout-edit-mode')) return;
                var rect = slot.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                var cx = rect.left + rect.width / 2;
                var cy = rect.top + rect.height / 2;
                var dx = (e.clientX - cx) / (rect.width / 2);
                var dy = (e.clientY - cy) / (rect.height / 2);
                var maxTilt = 4.0; // subtle, luxurious 4deg tilt
                var rx = (-dy * maxTilt).toFixed(2);
                var ry = (dx * maxTilt).toFixed(2);
                slot.style.setProperty('--tilt-rx', rx + 'deg');
                slot.style.setProperty('--tilt-ry', ry + 'deg');
            });

            slot.addEventListener('mouseleave', function () {
                slot.style.setProperty('--tilt-rx', '0deg');
                slot.style.setProperty('--tilt-ry', '0deg');
            });
        });
    }

    // === SPOTLIGHT COMMAND PALETTE & SEARCH BAR ===
    function initSearchBar() {
        var input = document.getElementById('haloSearchInput');
        var engineBtn = document.getElementById('haloSearchEngineBtn');
        var dropdown = document.getElementById('spotlightDropdown');
        var resultsList = document.getElementById('spotlightResultsList');
        var searchBarContainer = document.getElementById('haloSearchBar');
        if (!input) return;

        var currentSuggestions = [];
        var selectedIndex = 0;

        function updateEngineBtn() {
            if (engineBtn) {
                engineBtn.textContent = SEARCH_ENGINES[currentEngine].label;
                engineBtn.title = 'Search with ' + currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1);
            }
        }
        updateEngineBtn();

        function evaluateMath(expr) {
            var cleaned = expr.trim().replace(/x/gi, '*');
            if (!/^[\d\s\+\-\*\/\%\.\(\)]+$/.test(cleaned)) return null;
            if (!/[\+\-\*\/\%]/.test(cleaned) || !/\d/.test(cleaned)) return null;
            try {
                var fn = new Function('"use strict"; return (' + cleaned + ');');
                var res = fn();
                if (typeof res === 'number' && isFinite(res)) {
                    return Math.round(res * 1000000) / 1000000;
                }
            } catch (e) { }
            return null;
        }

        function generateSuggestions(query) {
            var list = [];
            var q = query.trim();
            if (!q) return list;

            // 1. Math Calculation Preview
            var mathRes = evaluateMath(q);
            if (mathRes !== null) {
                list.push({
                    type: 'calc',
                    icon: 'fa-calculator',
                    title: '= ' + mathRes,
                    desc: 'Calculation result — Press Enter to copy',
                    badge: 'Math',
                    action: function () {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(String(mathRes));
                        }
                        if (typeof showToast === 'function') showToast('Copied: ' + mathRes, 'success', 2000);
                    }
                });
            }

            // 2. Todo Task command: "t: buy milk" or "todo: buy milk"
            var todoMatch = q.match(/^(t:|todo:)\s*(.+)/i);
            if (todoMatch) {
                var taskText = todoMatch[2].trim();
                if (taskText) {
                    list.push({
                        type: 'todo',
                        icon: 'fa-check-circle',
                        title: 'Add Task: "' + taskText + '"',
                        desc: 'Appends item to your Todo list',
                        badge: 'Task',
                        action: function () {
                            var tInput = document.getElementById('todoInput');
                            if (tInput && typeof addTask === 'function') {
                                tInput.value = taskText;
                                addTask();
                            } else if (typeof tasks !== 'undefined' && Array.isArray(tasks)) {
                                tasks.push({ id: Date.now(), text: taskText, completed: false, createdAt: new Date().toISOString() });
                                if (typeof saveTasks === 'function') saveTasks();
                                if (typeof renderTasks === 'function') renderTasks();
                                if (typeof updateCount === 'function') updateCount();
                            }
                            if (typeof showToast === 'function') showToast('Added task: ' + taskText, 'success', 2200);
                        }
                    });
                }
            }

            // 3. Ultra Focus / Pomodoro command: "f: 25", "focus: 25", "focus", "pomo"
            var focusMatch = q.match(/^(f:|focus:|p:|pomo:)\s*(\d*)/i);
            if (focusMatch || q.toLowerCase() === 'focus' || q.toLowerCase() === 'pomo') {
                var mins = focusMatch && focusMatch[2] ? parseInt(focusMatch[2], 10) : 25;
                list.push({
                    type: 'focus',
                    icon: 'fa-bolt',
                    title: 'Start Ultra Focus (' + (mins || 25) + ' min)',
                    desc: 'Launches full immersion mode',
                    badge: 'Focus',
                    action: function () {
                        if (typeof ultraFocusApi !== 'undefined' && ultraFocusApi && ultraFocusApi.open) {
                            ultraFocusApi.open();
                        } else {
                            var trig = document.getElementById('dailyFocusUltraBtn') || document.getElementById('pomodoroUltraBtn');
                            if (trig) trig.click();
                        }
                    }
                });
            }

            // 4. Weather command: "w: Paris" or "weather: Paris"
            var wxMatch = q.match(/^(w:|weather:)\s*(.+)/i);
            if (wxMatch) {
                var city = wxMatch[2].trim();
                if (city) {
                    list.push({
                        type: 'weather',
                        icon: 'fa-cloud-sun',
                        title: 'Check Weather: "' + city + '"',
                        desc: 'Updates dashboard weather card',
                        badge: 'Weather',
                        action: function () {
                            fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1&language=en&format=json')
                                .then(function (r) { return r.json(); })
                                .then(function (d) {
                                    if (d && d.results && d.results.length > 0) {
                                        var loc = d.results[0];
                                        weatherCoords = { lat: loc.latitude, lon: loc.longitude };
                                        weatherLocationName = loc.name + (loc.country ? ', ' + loc.country : '');
                                        weatherPermissionGranted = true;
                                        try { localStorage.setItem(WEATHER_PERMISSION_KEY, 'true'); } catch (e) { }
                                        fetchWeatherAndUpdate(loc.latitude, loc.longitude);
                                        if (typeof showToast === 'function') showToast('Weather: ' + loc.name, 'success', 2200);
                                    } else {
                                        if (typeof showToast === 'function') showToast('City not found: ' + city, 'error', 2500);
                                    }
                                })
                                .catch(function (err) {
                                    if (typeof showToast === 'function') showToast('Search failed: ' + err.message, 'error', 2500);
                                });
                        }
                    });
                }
            }

            // 5. Music / Spotify command: "sp: lofi", "music: artist"
            var musicMatch = q.match(/^(sp:|spotify:|music:|song:)\s*(.+)/i);
            if (musicMatch) {
                var track = musicMatch[2].trim();
                if (track) {
                    list.push({
                        type: 'music',
                        icon: 'fa-music',
                        title: 'Play: "' + track + '"',
                        desc: 'Instant background music playback',
                        badge: 'Music',
                        action: function () {
                            var spInput = document.getElementById('spotifySearchInput');
                            if (spInput) spInput.value = track;
                            if (typeof triggerInlinePlay === 'function') triggerInlinePlay(track);
                        }
                    });
                }
            }

            // 6. Matching Pinned Quick Apps (matches name or URL domain)
            if (typeof quickLinks !== 'undefined' && Array.isArray(quickLinks)) {
                var lowerQ = q.toLowerCase();
                quickLinks.forEach(function (app) {
                    if (app && app.name && app.url) {
                        var appName = app.name.toLowerCase();
                        if (appName.indexOf(lowerQ) !== -1 || (lowerQ.length >= 2 && app.url.toLowerCase().indexOf(lowerQ) !== -1)) {
                            list.push({
                                type: 'app',
                                icon: 'fa-compass',
                                title: 'Launch ' + app.name,
                                desc: app.url,
                                badge: 'App',
                                action: function () {
                                    window.location.href = app.url;
                                }
                            });
                        }
                    }
                });
            }

            // 7. Standard Web Search (always available as fallback)
            list.push({
                type: 'search',
                icon: 'fa-search',
                title: 'Search for "' + q + '"',
                desc: 'Search the web using ' + currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1),
                badge: currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1),
                action: function () {
                    window.open(SEARCH_ENGINES[currentEngine].url + encodeURIComponent(q), '_blank');
                }
            });

            return list;
        }

        function renderSpotlight() {
            if (!dropdown || !resultsList) return;
            if (currentSuggestions.length === 0) {
                dropdown.style.display = 'none';
                if (searchBarContainer) searchBarContainer.classList.remove('spotlight-active');
                return;
            }

            if (selectedIndex >= currentSuggestions.length) selectedIndex = 0;
            if (selectedIndex < 0) selectedIndex = currentSuggestions.length - 1;

            resultsList.innerHTML = '';
            currentSuggestions.forEach(function (item, idx) {
                var row = document.createElement('div');
                row.className = 'spotlight-item' + (idx === selectedIndex ? ' selected' : '');
                row.dataset.index = idx;
                row.innerHTML =
                    '<div class="spotlight-item-icon"><i class="fas ' + item.icon + '"></i></div>' +
                    '<div class="spotlight-item-content">' +
                        '<div class="spotlight-item-title">' + (typeof escapeHtml === 'function' ? escapeHtml(item.title) : item.title) + '</div>' +
                        '<div class="spotlight-item-desc">' + (typeof escapeHtml === 'function' ? escapeHtml(item.desc) : item.desc) + '</div>' +
                    '</div>' +
                    '<div class="spotlight-item-badge">' + (typeof escapeHtml === 'function' ? escapeHtml(item.badge) : item.badge) + '</div>';

                row.addEventListener('click', function (e) {
                    e.stopPropagation();
                    executeItem(idx);
                });
                row.addEventListener('mouseenter', function () {
                    selectedIndex = idx;
                    updateSelectionUI();
                });
                resultsList.appendChild(row);
            });

            dropdown.style.display = 'block';
            if (searchBarContainer) searchBarContainer.classList.add('spotlight-active');
        }

        function updateSelectionUI() {
            if (!resultsList) return;
            var rows = resultsList.querySelectorAll('.spotlight-item');
            rows.forEach(function (r, i) {
                r.classList.toggle('selected', i === selectedIndex);
            });
        }

        function executeItem(idx) {
            if (idx < 0 || idx >= currentSuggestions.length) return;
            var item = currentSuggestions[idx];
            if (item && item.action) {
                item.action();
            }
            closeSpotlight();
            if (input) input.value = '';
        }

        function closeSpotlight() {
            if (dropdown) dropdown.style.display = 'none';
            if (searchBarContainer) searchBarContainer.classList.remove('spotlight-active');
            currentSuggestions = [];
            selectedIndex = 0;
        }

        input.addEventListener('keydown', function (e) {
            if (dropdown && dropdown.style.display !== 'none' && currentSuggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % currentSuggestions.length;
                    updateSelectionUI();
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                    updateSelectionUI();
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeSpotlight();
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    executeItem(selectedIndex);
                    return;
                }
            } else if (e.key === 'Enter') {
                var query = this.value.trim();
                if (query) {
                    if (query.toLowerCase().startsWith('sp:') || query.toLowerCase().startsWith('spotify:')) {
                        var song = query.replace(/^(sp:|spotify:)\s*/i, '').trim();
                        var spInput = document.getElementById('spotifySearchInput');
                        if (spInput) { spInput.value = song; }
                        triggerInlinePlay(song);
                    } else {
                        window.open(SEARCH_ENGINES[currentEngine].url + encodeURIComponent(query), '_blank');
                    }
                    this.value = '';
                }
            }
        });

        input.addEventListener('input', function () {
            var val = this.value;
            if (!val.trim()) {
                closeSpotlight();
                return;
            }
            currentSuggestions = generateSuggestions(val);
            selectedIndex = 0;
            renderSpotlight();
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (dropdown && dropdown.style.display !== 'none' && !dropdown.contains(e.target) && e.target !== input) {
                closeSpotlight();
            }
        });

        if (engineBtn) {
            engineBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var idx = ENGINE_ORDER.indexOf(currentEngine);
                currentEngine = ENGINE_ORDER[(idx + 1) % ENGINE_ORDER.length];
                save(LS_KEYS.searchEngine, currentEngine);
                updateEngineBtn();
                if (typeof showToast === 'function') {
                    showToast('Search engine: ' + currentEngine.charAt(0).toUpperCase() + currentEngine.slice(1), 'info', 1500);
                }
            });
        }
    }

    // === AMBIENT GLOW ===
    function initAmbientGlow() {
        var glowEl = document.getElementById('haloAmbientGlow');
        var btn = document.getElementById('ambientGlowBtn');

        function applyGlow() {
            if (glowEl) glowEl.classList.toggle('active', ambientGlowEnabled);
            if (btn) btn.classList.toggle('active', ambientGlowEnabled);
        }

        applyGlow();

        if (btn) {
            btn.addEventListener('click', function () {
                ambientGlowEnabled = !ambientGlowEnabled;
                save(LS_KEYS.ambientGlow, ambientGlowEnabled);
                applyGlow();
                if (typeof showToast === 'function') {
                    showToast('Ambient Glow ' + (ambientGlowEnabled ? 'On' : 'Off'), 'info', 1500);
                }
            });
        }
    }

    // === MUSIC & NATIVE AUDIO AMBIENT SOUNDSCAPES ===
    var PRESET_MAP = {
        'lofi': 'lofi chill beats',
        'focus': 'deep focus study beats',
        'piano': 'peaceful piano relax',
        'hits': 'top hits',
        'chill': 'chill acoustic vibes',
        'jazz': 'coffee jazz relax',
        'sleep': 'sleep ambient rain',
        'workout': 'workout pump beats',
        'rock': 'classic rock'
    };

    function triggerInlinePlay(query) {
        var spInput = document.getElementById('spotifySearchInput');
        var playBtn = document.getElementById('spotifyPlayBtn');
        var instantCard = document.getElementById('instantTrackCard');
        var instantAudio = document.getElementById('instantAudioEl');
        var instantArt = document.getElementById('instantTrackArt');
        var instantTitle = document.getElementById('instantTrackTitle');
        var instantArtist = document.getElementById('instantTrackArtist');
        var instantIcon = document.getElementById('instantTrackIcon');
        var pills = document.querySelectorAll('.spotify-pill');

        var q = (typeof query === 'string' ? query : (spInput ? spInput.value : '')).trim();

        // Switch to Music panel if not visible
        var tabSpotify = document.getElementById('mediaTabSpotify');
        var tabSounds = document.getElementById('mediaTabSounds');
        var panelSpotify = document.getElementById('spotifyPanel');
        var panelSounds = document.getElementById('soundscapePanel');
        if (tabSpotify && tabSounds && panelSpotify && panelSounds) {
            tabSpotify.classList.add('active');
            tabSounds.classList.remove('active');
            panelSpotify.classList.remove('hidden');
            panelSounds.classList.remove('active');
        }

        // Empty query: Toggle play/pause of audio preview or play active preset
        if (!q) {
            if (instantAudio && instantAudio.src) {
                if (instantAudio.paused) {
                    instantAudio.play().then(function () {
                        if (instantIcon) instantIcon.className = 'fas fa-pause';
                        if (instantCard) instantCard.classList.add('is-playing');
                    }).catch(function (e) { console.warn(e); });
                } else {
                    instantAudio.pause();
                    if (instantIcon) instantIcon.className = 'fas fa-play';
                    if (instantCard) instantCard.classList.remove('is-playing');
                }
                return;
            } else {
                var activePill = document.querySelector('.spotify-pill.active') || pills[0];
                q = (activePill && (activePill.getAttribute('data-genre') || activePill.textContent.trim())) || 'lofi chill beats';
            }
        }

        // Clean query if it's a genre preset keyword
        var cleanQ = q.toLowerCase().replace(/^[^\w\s]+/, '').trim();
        if (PRESET_MAP[cleanQ]) {
            cleanQ = PRESET_MAP[cleanQ];
        }

        // Case: Pasted Spotify URL (fallback search)
        var spotifyMatch = cleanQ.match(/(?:open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+))/i);
        if (spotifyMatch) {
            cleanQ = 'lofi focus beats';
        }

        // Search and stream real preview via iTunes API
        if (playBtn) playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(cleanQ) + '&entity=song&limit=1')
            .then(function (res) {
                if (!res.ok) throw new Error('Search failed');
                return res.json();
            })
            .then(function (data) {
                if (data.results && data.results.length > 0) {
                    var track = data.results[0];
                    if (instantTitle) instantTitle.textContent = track.trackName || q;
                    if (instantArtist) instantArtist.textContent = track.artistName || 'Unknown Artist';
                    if (instantArt) {
                        var artUrl = (track.artworkUrl100 || '').replace('100x100bb', '200x200bb');
                        instantArt.src = artUrl || 'favicon.png';
                    }
                    if (instantAudio && track.previewUrl) {
                        instantAudio.src = track.previewUrl;
                        instantAudio.play().then(function () {
                            if (instantIcon) instantIcon.className = 'fas fa-pause';
                            if (instantCard) instantCard.classList.add('is-playing');
                        }).catch(function (err) {
                            console.warn('Playback error:', err);
                            if (instantIcon) instantIcon.className = 'fas fa-play';
                            if (instantCard) instantCard.classList.remove('is-playing');
                        });
                    }
                    if (instantCard) instantCard.classList.add('active');
                    if (spInput) spInput.value = '';

                    if (typeof showToast === 'function') {
                        showToast('Playing: ' + (track.trackName || q) + ' — ' + (track.artistName || ''), 'success', 2500);
                    }
                } else {
                    if (typeof showToast === 'function') {
                        showToast('No audio found for "' + q + '". Try another title!', 'warning', 2500);
                    }
                }
            })
            .catch(function (err) {
                console.error('Track fetch error:', err);
                if (typeof showToast === 'function') {
                    showToast('Could not fetch song. Check network connection.', 'error', 2500);
                }
            })
            .finally(function () {
                if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
    }

    function initSpotifyAndSounds() {
        var tabSpotify = document.getElementById('mediaTabSpotify');
        var tabSounds = document.getElementById('mediaTabSounds');
        var panelSpotify = document.getElementById('spotifyPanel');
        var panelSounds = document.getElementById('soundscapePanel');
        var spotifyInput = document.getElementById('spotifySearchInput');
        var spotifyPlayBtn = document.getElementById('spotifyPlayBtn');
        var pills = document.querySelectorAll('.spotify-pill');
        var instantCard = document.getElementById('instantTrackCard');
        var instantPlayBtn = document.getElementById('instantTrackPlayBtn');
        var instantAudio = document.getElementById('instantAudioEl');
        var instantIcon = document.getElementById('instantTrackIcon');

        function pauseInstantTrack() {
            if (instantAudio) {
                instantAudio.pause();
            }
            if (instantIcon) {
                instantIcon.className = 'fas fa-play';
            }
            if (instantCard) {
                instantCard.classList.remove('is-playing');
            }
        }

        if (tabSpotify && tabSounds && panelSpotify && panelSounds) {
            tabSpotify.addEventListener('click', function () {
                tabSpotify.classList.add('active');
                tabSounds.classList.remove('active');
                panelSpotify.classList.remove('hidden');
                panelSounds.classList.remove('active');
            });
            tabSounds.addEventListener('click', function () {
                tabSounds.classList.add('active');
                tabSpotify.classList.remove('active');
                panelSpotify.classList.add('hidden');
                panelSounds.classList.add('active');
            });
        }

        // Preset buttons: play genre directly in native track card
        pills.forEach(function (pill) {
            pill.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                pills.forEach(function (p) { p.classList.remove('active'); });
                pill.classList.add('active');

                var genre = pill.getAttribute('data-genre') || pill.textContent.trim().replace(/^[^\w\s]+/, '').trim();
                triggerInlinePlay(genre);
            });
        });

        // Instant track audio preview controls
        if (instantPlayBtn && instantAudio) {
            instantPlayBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!instantAudio.src) {
                    var activePill = document.querySelector('.spotify-pill.active');
                    var genre = (activePill && (activePill.getAttribute('data-genre') || activePill.textContent.trim())) || 'lofi chill beats';
                    triggerInlinePlay(genre);
                    return;
                }
                if (instantAudio.paused) {
                    instantAudio.play().then(function () {
                        if (instantIcon) instantIcon.className = 'fas fa-pause';
                        if (instantCard) instantCard.classList.add('is-playing');
                    }).catch(function (err) {
                        console.warn('Playback error:', err);
                    });
                } else {
                    instantAudio.pause();
                    if (instantIcon) instantIcon.className = 'fas fa-play';
                    if (instantCard) instantCard.classList.remove('is-playing');
                }
            });

            instantAudio.addEventListener('ended', function () {
                if (instantIcon) instantIcon.className = 'fas fa-play';
                if (instantCard) instantCard.classList.remove('is-playing');
            });
            instantAudio.addEventListener('pause', function () {
                if (instantIcon) instantIcon.className = 'fas fa-play';
                if (instantCard) instantCard.classList.remove('is-playing');
            });
            instantAudio.addEventListener('play', function () {
                if (instantIcon) instantIcon.className = 'fas fa-pause';
                if (instantCard) instantCard.classList.add('is-playing');
            });
        }

        if (spotifyInput) {
            spotifyInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerInlinePlay(this.value);
                }
            });
        }
        if (spotifyPlayBtn) {
            spotifyPlayBtn.addEventListener('click', function (e) {
                e.preventDefault();
                triggerInlinePlay(spotifyInput ? spotifyInput.value : '');
            });
        }

        // Web Audio Procedural Soundscapes
        var audioCtx = null;
        var activeNodes = {};
        var masterGain = null;

        function getAudioContext() {
            if (!audioCtx) {
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                masterGain = audioCtx.createGain();
                masterGain.gain.value = 0.7;
                masterGain.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        var soundVolSlider = document.getElementById('soundVolumeSlider');
        if (soundVolSlider) {
            soundVolSlider.addEventListener('input', function () {
                if (masterGain) {
                    masterGain.gain.value = parseFloat(this.value) / 100;
                }
            });
        }

        function playRain() {
            var ctx = getAudioContext();
            var bufferSize = ctx.sampleRate * 2;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.4;
            }
            var noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            var filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 850;

            var gain = ctx.createGain();
            gain.gain.value = 0.5;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            noise.start();
            return { source: noise, gain: gain };
        }

        function playWaves() {
            var ctx = getAudioContext();
            var bufferSize = ctx.sampleRate * 3;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            var lastOut = 0.0;
            for (var i = 0; i < bufferSize; i++) {
                var white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
            var noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            var filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 450;

            var waveGain = ctx.createGain();
            waveGain.gain.value = 0.4;

            // LFO for wave swell
            var osc = ctx.createOscillator();
            osc.frequency.value = 0.12; // 8-second wave period
            var oscGain = ctx.createGain();
            oscGain.gain.value = 0.25;
            osc.connect(oscGain);
            oscGain.connect(waveGain.gain);

            noise.connect(filter);
            filter.connect(waveGain);
            waveGain.connect(masterGain);

            noise.start();
            osc.start();
            return { source: noise, osc: osc, gain: waveGain };
        }

        function playFire() {
            var ctx = getAudioContext();
            var bufferSize = ctx.sampleRate * 2;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                // Occasional crackle spikes
                if (Math.random() < 0.002) {
                    data[i] = (Math.random() * 2 - 1) * 0.9;
                } else {
                    data[i] = (Math.random() * 2 - 1) * 0.08;
                }
            }
            var noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            var filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200;

            var gain = ctx.createGain();
            gain.gain.value = 0.6;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            noise.start();
            return { source: noise, gain: gain };
        }

        function playCafe() {
            var ctx = getAudioContext();
            var bufferSize = ctx.sampleRate * 2;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.15;
            }
            var noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            var filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 650;
            filter.Q.value = 1.8;

            var gain = ctx.createGain();
            gain.gain.value = 0.4;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);
            noise.start();
            return { source: noise, gain: gain };
        }

        var soundFns = { rain: playRain, waves: playWaves, fire: playFire, cafe: playCafe };

        document.querySelectorAll('.sound-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var type = this.getAttribute('data-sound');
                if (activeNodes[type]) {
                    try {
                        activeNodes[type].source.stop();
                        if (activeNodes[type].osc) activeNodes[type].osc.stop();
                    } catch (e) { }
                    delete activeNodes[type];
                    this.classList.remove('playing');
                } else {
                    if (soundFns[type]) {
                        activeNodes[type] = soundFns[type]();
                        this.classList.add('playing');
                    }
                }
            });
        });
    }

    // === POMODORO TIMER ENGINE & ULTRA FOCUS INTEGRATION ===
    var ultraFocusApi = null;

    function initUltraFocusMode(pomodoroApi) {
        var overlay = document.getElementById('ultraFocusOverlay');
        var pill = document.getElementById('focusDynamicPill');
        var closeBtn = document.getElementById('ultraCloseBtn');
        var minimizeBtn = document.getElementById('ultraMinimizeBtn');
        var pillExpandBtn = document.getElementById('pillExpandBtn');
        var pillCloseBtn = document.getElementById('pillCloseBtn');
        var pillPlayBtn = document.getElementById('pillPlayBtn');

        var triggerDaily = document.getElementById('dailyFocusUltraBtn');
        var triggerPomo = document.getElementById('pomodoroUltraBtn');

        var taskInput = document.getElementById('ultraTaskInput');
        var taskCheck = document.getElementById('ultraTaskCheck');
        var playBtn = document.getElementById('ultraPlayBtn');
        var resetBtn = document.getElementById('ultraResetBtn');
        var skipBtn = document.getElementById('ultraSkipBtn');
        var modeTabs = document.querySelectorAll('.ultra-mode-tab');

        var boxBreathingBtn = document.getElementById('ultraBoxBreathingBtn');
        var boxBreathingModal = document.getElementById('boxBreathingModal');
        var boxBreathingCloseBtn = document.getElementById('boxBreathingCloseBtn');
        var boxBreathingReadyBtn = document.getElementById('boxBreathingReadyBtn');
        var breathingOrb = document.getElementById('breathingOrb');
        var breathingStageLabel = document.getElementById('breathingStageLabel');
        var breathingCountdown = document.getElementById('breathingCountdown');
        var breathingRounds = document.getElementById('breathingRounds');

        var neuralBtns = document.querySelectorAll('.neural-btn');
        var neuralVolSlider = document.getElementById('ultraNeuralVolSlider');

        var statMinutes = document.getElementById('ultraStatMinutes');
        var statSessions = document.getElementById('ultraStatSessions');
        var streakBadge = document.getElementById('ultraFocusStreakBadge');

        // Analytics state
        var LS_FOCUS_MINUTES = 'halo_focus_minutes_today';
        var LS_FOCUS_SESSIONS = 'halo_focus_sessions_today';
        var LS_FOCUS_DATE = 'halo_focus_analytics_date';

        var today = new Date().toDateString();
        if (localStorage.getItem(LS_FOCUS_DATE) !== today) {
            localStorage.setItem(LS_FOCUS_DATE, today);
            localStorage.setItem(LS_FOCUS_MINUTES, '0');
            localStorage.setItem(LS_FOCUS_SESSIONS, '0');
        }

        var focusedMinutes = parseInt(localStorage.getItem(LS_FOCUS_MINUTES), 10) || 0;
        var completedSessions = parseInt(localStorage.getItem(LS_FOCUS_SESSIONS), 10) || 0;

        function updateStatsUI() {
            if (statMinutes) statMinutes.textContent = focusedMinutes + 'm';
            if (statSessions) statSessions.textContent = completedSessions;
            if (streakBadge) streakBadge.textContent = '🔥 ' + completedSessions + ' Sessions';
        }
        updateStatsUI();

        function addFocusedMinute() {
            focusedMinutes++;
            localStorage.setItem(LS_FOCUS_MINUTES, String(focusedMinutes));
            updateStatsUI();
        }

        function addCompletedSession() {
            completedSessions++;
            localStorage.setItem(LS_FOCUS_SESSIONS, String(completedSessions));
            updateStatsUI();
        }

        // Open Ultra Focus
        function openUltraFocus() {
            if (overlay) overlay.classList.add('active');
            if (pill) pill.classList.remove('active');
            document.body.classList.add('ultra-focus-open');

            // Sync task from daily focus
            var mainFocusInput = document.getElementById('focusInput');
            var mainFocusCheck = document.getElementById('focusCheckbox');
            if (mainFocusInput && taskInput) {
                taskInput.value = mainFocusInput.value;
            }
            if (mainFocusCheck && taskCheck) {
                var isDone = mainFocusCheck.classList.contains('completed');
                taskCheck.classList.toggle('completed', isDone);
                if (taskInput) taskInput.classList.toggle('completed', isDone);
            }

            pomodoroApi.syncUltraDisplay();
            if (typeof toggleMusicDrawer === 'function') toggleMusicDrawer(false);
        }

        function closeUltraFocus() {
            if (overlay) overlay.classList.remove('active');
            if (pill) pill.classList.remove('active');
            document.body.classList.remove('ultra-focus-open');
            if (typeof toggleMusicDrawer === 'function') toggleMusicDrawer(false);
            if (typeof stopUltraMusic === 'function') stopUltraMusic();
            if (typeof stopNeural === 'function') stopNeural();
        }

        function minimizeToPill() {
            if (overlay) overlay.classList.remove('active');
            if (pill) pill.classList.add('active');
            document.body.classList.remove('ultra-focus-open');
            pomodoroApi.syncUltraDisplay();
        }

        function toggleUltraFocus() {
            if (overlay && overlay.classList.contains('active')) {
                closeUltraFocus();
            } else {
                openUltraFocus();
            }
        }

        if (triggerDaily) triggerDaily.addEventListener('click', openUltraFocus);
        if (triggerPomo) triggerPomo.addEventListener('click', openUltraFocus);
        if (closeBtn) closeBtn.addEventListener('click', closeUltraFocus);
        if (minimizeBtn) minimizeBtn.addEventListener('click', minimizeToPill);
        if (pillExpandBtn) pillExpandBtn.addEventListener('click', openUltraFocus);
        if (pillCloseBtn) pillCloseBtn.addEventListener('click', function () {
            if (pill) pill.classList.remove('active');
        });
        if (pill) {
            pill.addEventListener('click', function (e) {
                if (e.target.closest('.pill-btn')) return;
                openUltraFocus();
            });
        }

        // Sync task input changes
        if (taskInput) {
            taskInput.addEventListener('input', function () {
                var mainFocusInput = document.getElementById('focusInput');
                if (mainFocusInput) {
                    mainFocusInput.value = this.value;
                    try {
                        localStorage.setItem(LS_KEYS.dailyFocusText, this.value);
                        localStorage.setItem(LS_KEYS.dailyFocusDate, today);
                    } catch (e) { }
                }
                var pillTask = document.getElementById('pillTaskDisplay');
                if (pillTask) pillTask.textContent = this.value || 'Deep Work';
            });
        }

        if (taskCheck) {
            taskCheck.addEventListener('click', function () {
                var isCompleted = this.classList.toggle('completed');
                if (taskInput) taskInput.classList.toggle('completed', isCompleted);
                var mainFocusCheck = document.getElementById('focusCheckbox');
                var mainFocusInput = document.getElementById('focusInput');
                if (mainFocusCheck) mainFocusCheck.classList.toggle('completed', isCompleted);
                if (mainFocusInput) mainFocusInput.classList.toggle('completed', isCompleted);
                try { localStorage.setItem(LS_KEYS.dailyFocusDone, isCompleted ? 'true' : 'false'); } catch (e) { }
                if (isCompleted && typeof showToast === 'function') {
                    showToast('Target goal achieved! 🎉', 'success', 2000);
                }
            });
        }

        // Pomodoro controls from Ultra Focus
        if (playBtn) {
            playBtn.addEventListener('click', function () {
                pomodoroApi.togglePlay();
            });
        }
        if (pillPlayBtn) {
            pillPlayBtn.addEventListener('click', function () {
                pomodoroApi.togglePlay();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                pomodoroApi.reset();
            });
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', function () {
                pomodoroApi.skip();
            });
        }

        modeTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                modeTabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                pomodoroApi.setMode(tab.getAttribute('data-mode'));
            });
        });

        // Web Audio Neural Frequency Generator
        var neuralCtx = null;
        var activeNeuralSource = null;
        var neuralGain = null;
        var currentNeuralFreq = null;

        function getNeuralCtx() {
            if (!neuralCtx) {
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                neuralCtx = new AudioContext();
                neuralGain = neuralCtx.createGain();
                neuralGain.gain.value = 0.4;
                neuralGain.connect(neuralCtx.destination);
            }
            if (neuralCtx.state === 'suspended') {
                neuralCtx.resume();
            }
            return neuralCtx;
        }

        if (neuralVolSlider) {
            neuralVolSlider.addEventListener('input', function () {
                if (neuralGain) {
                    neuralGain.gain.value = parseFloat(this.value) / 100;
                }
            });
        }

        function stopNeural() {
            if (activeNeuralSource) {
                try {
                    if (typeof activeNeuralSource.stop === 'function') activeNeuralSource.stop();
                    if (activeNeuralSource.osc1 && typeof activeNeuralSource.osc1.stop === 'function') activeNeuralSource.osc1.stop();
                    if (activeNeuralSource.osc2 && typeof activeNeuralSource.osc2.stop === 'function') activeNeuralSource.osc2.stop();
                    if (activeNeuralSource.sources && Array.isArray(activeNeuralSource.sources)) {
                        activeNeuralSource.sources.forEach(function (s) { try { if (s && s.stop) s.stop(); } catch (e) { } });
                    }
                    if (activeNeuralSource.timer) clearInterval(activeNeuralSource.timer);
                } catch (e) { }
                activeNeuralSource = null;
            }
            currentNeuralFreq = null;
            neuralBtns.forEach(function (b) { b.classList.remove('active'); });
        }

        function playNeuralBinaural(carrier, diff) {
            stopNeural();
            var ctx = getNeuralCtx();
            var merger = ctx.createChannelMerger(2);

            var oscLeft = ctx.createOscillator();
            oscLeft.type = 'sine';
            oscLeft.frequency.value = carrier;

            var oscRight = ctx.createOscillator();
            oscRight.type = 'sine';
            oscRight.frequency.value = carrier + diff;

            oscLeft.connect(merger, 0, 0);
            oscRight.connect(merger, 0, 1);
            merger.connect(neuralGain);

            oscLeft.start();
            oscRight.start();
            activeNeuralSource = { osc1: oscLeft, osc2: oscRight };
        }

        function playBrownNoise() {
            stopNeural();
            var ctx = getNeuralCtx();
            var bufferSize = ctx.sampleRate * 2;
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            var lastOut = 0.0;
            for (var i = 0; i < bufferSize; i++) {
                var white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
            var noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            var filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            noise.connect(filter);
            filter.connect(neuralGain);
            noise.start();
            activeNeuralSource = noise;
        }

        neuralBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var type = this.getAttribute('data-freq');
                if (currentNeuralFreq === type) {
                    stopNeural();
                    return;
                }
                neuralBtns.forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                currentNeuralFreq = type;

                if (type === 'gamma') playNeuralBinaural(200, 40); // 40Hz Gamma Focus
                else if (type === 'beta') playNeuralBinaural(200, 14); // 14Hz Beta Flow
                else if (type === 'alpha') playNeuralBinaural(200, 10); // 10Hz Alpha Mind
                else if (type === 'brown') playBrownNoise();
            });
        });

        // ===== ULTRA FOCUS SONGS & AUDIO PLAYER ENGINE =====
        var ultraAudio = document.getElementById('ultraAudioEl');
        var ultraMusicTabs = document.querySelectorAll('.ultra-music-tab');
        var ultraMusicContents = document.querySelectorAll('.ultra-music-content');
        var ultraStationBtns = document.querySelectorAll('.ultra-station-btn');
        var ultraSearchInput = document.getElementById('ultraSongSearchInput');
        var ultraSearchBtn = document.getElementById('ultraSongSearchBtn');
        var ultraSpotifyFrame = document.getElementById('ultraSpotifyFrame');
        var ultraSpotifyPills = document.querySelectorAll('.ultra-spotify-pill');

        // Minimal Squishy Music Pill & Drawer Elements
        var ultraMusicToggleBtn = document.getElementById('ultraMusicToggleBtn');
        var ultraMusicDrawer = document.getElementById('ultraMusicDrawer');
        var ultraDrawerCloseBtn = document.getElementById('ultraDrawerCloseBtn');
        var ultraMusicPillTitle = document.getElementById('ultraMusicPillTitle');
        var ultraMusicPillSub = document.getElementById('ultraMusicPillSub');
        var ultraMusicPillBadge = document.getElementById('ultraMusicPillBadge');
        var ultraMusicPillIcon = document.getElementById('ultraMusicPillIcon');
        var ultraSearchResultsList = document.getElementById('ultraSearchResultsList');

        var ultraPlayerTitle = document.getElementById('ultraPlayerTitle');
        var ultraPlayerArtist = document.getElementById('ultraPlayerArtist');
        var ultraPlayerArt = document.getElementById('ultraPlayerArt');
        var ultraPlayTrackBtn = document.getElementById('ultraPlayTrackBtn');
        var ultraPlayTrackIcon = document.getElementById('ultraPlayTrackIcon');
        var ultraPrevTrackBtn = document.getElementById('ultraPrevTrackBtn');
        var ultraNextTrackBtn = document.getElementById('ultraNextTrackBtn');
        var ultraSongVolSlider = document.getElementById('ultraSongVolSlider');
        var ultraMusicStatus = document.getElementById('ultraMusicStatus');

        var ultraPlaylist = [];
        var ultraTrackIndex = 0;
        var ultraIsPlaying = false;
        var activeStationName = '';

        function stopUltraMusic() {
            if (ultraAudio && !ultraAudio.paused) {
                ultraAudio.pause();
                setMusicPlayingState(false);
            }
        }

        // Squishy Minimal Music Capsule Toggle
        function toggleMusicDrawer(forceOpen) {
            if (!ultraMusicDrawer) return;
            var isCurrentlyOpen = !ultraMusicDrawer.classList.contains('collapsed');
            var shouldOpen = forceOpen !== undefined ? !!forceOpen : !isCurrentlyOpen;
            if (shouldOpen) {
                ultraMusicDrawer.classList.remove('collapsed');
                if (ultraMusicToggleBtn) ultraMusicToggleBtn.classList.add('open');
            } else {
                ultraMusicDrawer.classList.add('collapsed');
                if (ultraMusicToggleBtn) ultraMusicToggleBtn.classList.remove('open');
            }
        }

        if (ultraMusicToggleBtn) {
            ultraMusicToggleBtn.addEventListener('click', function () {
                toggleMusicDrawer();
            });
        }

        if (ultraDrawerCloseBtn) {
            ultraDrawerCloseBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleMusicDrawer(false);
            });
        }

        // Tab Switching (Stations | Search Song | Spotify)
        ultraMusicTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var target = this.getAttribute('data-tab');
                ultraMusicTabs.forEach(function (t) { t.classList.remove('active'); });
                this.classList.add('active');

                ultraMusicContents.forEach(function (c) { c.classList.remove('active'); });
                if (target === 'stations') {
                    var el = document.getElementById('ultraMusicStations');
                    if (el) el.classList.add('active');
                } else if (target === 'search') {
                    var el = document.getElementById('ultraMusicSearch');
                    if (el) el.classList.add('active');
                    if (ultraSearchInput) setTimeout(function () { ultraSearchInput.focus(); }, 100);
                } else if (target === 'spotify') {
                    var el = document.getElementById('ultraMusicSpotify');
                    if (el) el.classList.add('active');
                }
            });
        });

        // Set Volume
        var savedSongVol = localStorage.getItem('halo_ultra_song_volume');
        if (savedSongVol && ultraAudio && ultraSongVolSlider) {
            ultraAudio.volume = parseFloat(savedSongVol);
            ultraSongVolSlider.value = Math.round(parseFloat(savedSongVol) * 100);
        } else if (ultraAudio) {
            ultraAudio.volume = 0.75;
        }

        if (ultraSongVolSlider && ultraAudio) {
            ultraSongVolSlider.addEventListener('input', function () {
                var v = parseFloat(this.value) / 100;
                ultraAudio.volume = v;
                try { localStorage.setItem('halo_ultra_song_volume', String(v)); } catch (e) { }
            });
        }

        function updatePlayerUI(track) {
            if (!track) return;
            var tTitle = track.title || 'Focus Track';
            var tArtist = track.artist || activeStationName || 'Deep Work';
            var tArt = track.art || 'favicon.png';

            if (ultraPlayerTitle) ultraPlayerTitle.textContent = tTitle;
            if (ultraPlayerArtist) ultraPlayerArtist.textContent = tArtist;
            if (ultraPlayerArt) {
                ultraPlayerArt.src = tArt;
                ultraPlayerArt.onerror = function () { this.src = 'favicon.png'; };
            }

            // Sync with Minimal Squishy Pill
            if (ultraMusicPillTitle) ultraMusicPillTitle.textContent = tTitle;
            if (ultraMusicPillSub) ultraMusicPillSub.textContent = tArtist;
        }

        function setMusicPlayingState(playing) {
            ultraIsPlaying = !!playing;
            if (ultraPlayTrackIcon) {
                ultraPlayTrackIcon.className = ultraIsPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
            if (ultraMusicStatus) {
                ultraMusicStatus.textContent = ultraIsPlaying ? 'Playing' : 'Ready';
                ultraMusicStatus.classList.toggle('playing', ultraIsPlaying);
            }
            if (ultraMusicPillBadge) {
                ultraMusicPillBadge.textContent = ultraIsPlaying ? 'Playing' : 'Ready';
                ultraMusicPillBadge.classList.toggle('playing', ultraIsPlaying);
            }
            if (ultraMusicPillIcon) {
                ultraMusicPillIcon.innerHTML = ultraIsPlaying ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-headphones-simple"></i>';
            }
            if (!ultraIsPlaying && (!ultraAudio || !ultraAudio.src)) {
                if (ultraMusicPillTitle) ultraMusicPillTitle.textContent = 'Focus Soundtracks';
                if (ultraMusicPillSub) ultraMusicPillSub.textContent = 'Squishy Tap to Browse & Search';
            }
        }

        function playTrackByIndex(idx) {
            if (!ultraPlaylist || ultraPlaylist.length === 0) return;
            if (idx < 0) idx = ultraPlaylist.length - 1;
            if (idx >= ultraPlaylist.length) idx = 0;
            ultraTrackIndex = idx;
            var track = ultraPlaylist[idx];
            if (!track || !track.previewUrl) return;

            // Pause dashboard audio if playing to prevent dual sound
            var mainAudio = document.getElementById('instantAudioEl');
            if (mainAudio && !mainAudio.paused) mainAudio.pause();

            updatePlayerUI(track);

            // Highlight card in search results list if present
            if (ultraSearchResultsList) {
                var allCards = ultraSearchResultsList.querySelectorAll('.ultra-song-card');
                allCards.forEach(function (c) {
                    var cIdx = parseInt(c.getAttribute('data-idx'), 10);
                    c.classList.toggle('active', cIdx === idx);
                });
            }

            if (ultraAudio) {
                ultraAudio.src = track.previewUrl;
                ultraAudio.play().then(function () {
                    setMusicPlayingState(true);
                }).catch(function (err) {
                    console.info('Audio play pending user gesture:', err);
                    setMusicPlayingState(false);
                });
            }
        }

        // Auto advance to next song in the focus station queue when current track ends
        if (ultraAudio) {
            ultraAudio.addEventListener('ended', function () {
                if (ultraPlaylist && ultraPlaylist.length > 0) {
                    playTrackByIndex(ultraTrackIndex + 1);
                } else {
                    setMusicPlayingState(false);
                }
            });
            ultraAudio.addEventListener('pause', function () {
                setMusicPlayingState(false);
            });
            ultraAudio.addEventListener('play', function () {
                setMusicPlayingState(true);
            });
        }

        // Live Player Controls
        if (ultraPlayTrackBtn) {
            ultraPlayTrackBtn.addEventListener('click', function () {
                if (!ultraAudio) return;
                if (!ultraAudio.src) {
                    // Start default Lofi station if no track chosen yet
                    var defaultBtn = document.querySelector('.ultra-station-btn');
                    if (defaultBtn) defaultBtn.click();
                    return;
                }
                if (ultraAudio.paused) {
                    ultraAudio.play().then(function () {
                        setMusicPlayingState(true);
                    }).catch(function (e) { console.warn(e); });
                } else {
                    ultraAudio.pause();
                    setMusicPlayingState(false);
                }
            });
        }

        if (ultraNextTrackBtn) {
            ultraNextTrackBtn.addEventListener('click', function () {
                if (ultraPlaylist && ultraPlaylist.length > 0) {
                    playTrackByIndex(ultraTrackIndex + 1);
                }
            });
        }

        if (ultraPrevTrackBtn) {
            ultraPrevTrackBtn.addEventListener('click', function () {
                if (ultraPlaylist && ultraPlaylist.length > 0) {
                    playTrackByIndex(ultraTrackIndex - 1);
                }
            });
        }

        // Load Station Tracks dynamically from iTunes
        async function loadStation(genre, name, btn) {
            activeStationName = name;
            ultraStationBtns.forEach(function (b) { b.classList.remove('active'); });
            if (btn) btn.classList.add('active');

            if (ultraSearchResultsList) {
                ultraSearchResultsList.innerHTML = '<div class="ultra-search-empty-hint">Type a song or artist above to pick and play</div>';
            }

            if (ultraMusicStatus) ultraMusicStatus.textContent = 'Loading...';
            try {
                var query = encodeURIComponent(genre);
                var res = await fetch('https://itunes.apple.com/search?term=' + query + '&entity=song&limit=25');
                if (!res.ok) throw new Error('Network error');
                var data = await res.json();
                if (data && data.results && data.results.length > 0) {
                    ultraPlaylist = data.results
                        .filter(function (t) { return !!t.previewUrl; })
                        .map(function (t) {
                            return {
                                title: t.trackName || 'Focus Beat',
                                artist: t.artistName || name,
                                art: t.artworkUrl100 || t.artworkUrl60 || 'favicon.png',
                                previewUrl: t.previewUrl
                            };
                        });

                    if (ultraPlaylist.length > 0) {
                        playTrackByIndex(0);
                        if (typeof showToast === 'function') {
                            showToast('Playing ' + name + ' (' + ultraPlaylist.length + ' tracks)', 'info', 2000);
                        }
                    }
                } else {
                    if (ultraMusicStatus) ultraMusicStatus.textContent = 'Empty';
                }
            } catch (err) {
                console.warn('Failed loading station:', err);
                if (ultraMusicStatus) ultraMusicStatus.textContent = 'Offline';
            }
        }

        ultraStationBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var genre = this.getAttribute('data-genre');
                var name = this.getAttribute('data-name');
                loadStation(genre, name, this);
            });
        });

        function escapeMusicHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"']/g, function (m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });
        }

        function renderSearchResults(tracks) {
            if (!ultraSearchResultsList) return;
            ultraSearchResultsList.innerHTML = '';
            tracks.forEach(function (track, idx) {
                var card = document.createElement('div');
                card.className = 'ultra-song-card' + (idx === 0 ? ' active' : '');
                card.setAttribute('data-idx', String(idx));
                card.innerHTML =
                    '<img class="ultra-song-card-art" src="' + escapeMusicHtml(track.art || 'favicon.png') + '" alt="Art" onerror="this.src=\'favicon.png\'">' +
                    '<div class="ultra-song-card-info">' +
                        '<span class="ultra-song-card-title">' + escapeMusicHtml(track.title) + '</span>' +
                        '<span class="ultra-song-card-artist">' + escapeMusicHtml(track.artist) + '</span>' +
                    '</div>' +
                    '<i class="fas fa-play ultra-song-card-play"></i>';

                card.addEventListener('click', function () {
                    var i = parseInt(this.getAttribute('data-idx'), 10);
                    playTrackByIndex(i);
                    var allCards = ultraSearchResultsList.querySelectorAll('.ultra-song-card');
                    allCards.forEach(function (c) { c.classList.remove('active'); });
                    this.classList.add('active');
                });

                ultraSearchResultsList.appendChild(card);
            });
        }

        // Search for any custom song & pick to play
        async function searchAndPlaySong(query) {
            var q = (query || (ultraSearchInput ? ultraSearchInput.value : '')).trim();
            if (!q) return;

            toggleMusicDrawer(true);
            var searchTab = document.querySelector('.ultra-music-tab[data-tab="search"]');
            if (searchTab) searchTab.click();

            if (ultraSearchBtn) ultraSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            if (ultraMusicStatus) ultraMusicStatus.textContent = 'Searching...';
            if (ultraSearchResultsList) {
                ultraSearchResultsList.innerHTML = '<div class="ultra-search-empty-hint"><i class="fas fa-spinner fa-spin"></i> Searching songs for "' + escapeMusicHtml(q) + '"...</div>';
            }

            try {
                var res = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(q) + '&entity=song&limit=6');
                if (!res.ok) throw new Error('Search failed');
                var data = await res.json();
                if (data && data.results && data.results.length > 0) {
                    ultraPlaylist = data.results
                        .filter(function (t) { return !!t.previewUrl; })
                        .map(function (t) {
                            return {
                                title: t.trackName || q,
                                artist: t.artistName || 'Unknown Artist',
                                art: t.artworkUrl100 || t.artworkUrl60 || 'favicon.png',
                                previewUrl: t.previewUrl
                            };
                        });

                    activeStationName = 'Search: ' + q;
                    ultraStationBtns.forEach(function (b) { b.classList.remove('active'); });

                    if (ultraPlaylist.length > 0) {
                        renderSearchResults(ultraPlaylist);
                        playTrackByIndex(0);
                        if (typeof showToast === 'function') {
                            showToast('Playing: ' + ultraPlaylist[0].title + ' (Pick any to switch)', 'success', 2500);
                        }
                    } else {
                        if (ultraSearchResultsList) {
                            ultraSearchResultsList.innerHTML = '<div class="ultra-search-empty-hint">No playable previews found for "' + escapeMusicHtml(q) + '". Try another title.</div>';
                        }
                    }
                } else {
                    if (ultraSearchResultsList) {
                        ultraSearchResultsList.innerHTML = '<div class="ultra-search-empty-hint">No songs found for "' + escapeMusicHtml(q) + '". Try another title or artist.</div>';
                    }
                    if (ultraMusicStatus) ultraMusicStatus.textContent = 'Not found';
                }
            } catch (err) {
                console.warn('Song search failed:', err);
                if (ultraSearchResultsList) {
                    ultraSearchResultsList.innerHTML = '<div class="ultra-search-empty-hint">Network error searching songs. Please check connection.</div>';
                }
                if (ultraMusicStatus) ultraMusicStatus.textContent = 'Error';
            } finally {
                if (ultraSearchBtn) ultraSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
            }
        }

        if (ultraSearchBtn) {
            ultraSearchBtn.addEventListener('click', function () {
                searchAndPlaySong();
            });
        }
        if (ultraSearchInput) {
            ultraSearchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchAndPlaySong();
                }
            });
        }

        // Spotify Embed Pills in Ultra Focus
        ultraSpotifyPills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                ultraSpotifyPills.forEach(function (p) { p.classList.remove('active'); });
                this.classList.add('active');

                var src = this.getAttribute('data-src');
                if (ultraSpotifyFrame && src) {
                    ultraSpotifyFrame.src = src;
                }

                // Pause local audio preview so Spotify doesn't conflict
                if (ultraAudio && !ultraAudio.paused) {
                    ultraAudio.pause();
                    setMusicPlayingState(false);
                }

                if (ultraPlayerTitle) ultraPlayerTitle.textContent = 'Spotify: ' + this.textContent.trim();
                if (ultraPlayerArtist) ultraPlayerArtist.textContent = 'Playing in Spotify Embed';
                if (ultraMusicStatus) {
                    ultraMusicStatus.textContent = 'Spotify';
                    ultraMusicStatus.classList.add('playing');
                }
            });
        });

        // Box Breathing (4-4-4-4)
        var breathingTimer = null;
        var breathingPhase = 0;
        var breathingSeconds = 4;
        var breathingRound = 1;

        function updateBreathingUI() {
            if (!breathingOrb || !breathingStageLabel || !breathingCountdown) return;
            var phases = [
                { label: 'Inhale...', cls: 'inhale' },
                { label: 'Hold...', cls: 'hold' },
                { label: 'Exhale...', cls: 'exhale' },
                { label: 'Hold...', cls: 'hold' }
            ];
            var cur = phases[breathingPhase];
            breathingStageLabel.textContent = cur.label;
            breathingCountdown.textContent = breathingSeconds;
            if (breathingRounds) breathingRounds.textContent = 'Round ' + Math.min(breathingRound, 4) + ' of 4';

            breathingOrb.className = 'breathing-orb ' + cur.cls;
        }

        function startBoxBreathing() {
            if (boxBreathingModal) boxBreathingModal.classList.add('active');
            breathingPhase = 0;
            breathingSeconds = 4;
            breathingRound = 1;
            updateBreathingUI();

            if (breathingTimer) clearInterval(breathingTimer);
            breathingTimer = setInterval(function () {
                breathingSeconds--;
                if (breathingSeconds <= 0) {
                    breathingPhase = (breathingPhase + 1) % 4;
                    breathingSeconds = 4;
                    if (breathingPhase === 0) {
                        breathingRound++;
                    }
                }
                updateBreathingUI();
            }, 1000);
        }

        function closeBoxBreathing() {
            if (breathingTimer) clearInterval(breathingTimer);
            if (boxBreathingModal) boxBreathingModal.classList.remove('active');
        }

        if (boxBreathingBtn) boxBreathingBtn.addEventListener('click', startBoxBreathing);
        if (boxBreathingCloseBtn) boxBreathingCloseBtn.addEventListener('click', closeBoxBreathing);
        if (boxBreathingReadyBtn) {
            boxBreathingReadyBtn.addEventListener('click', function () {
                closeBoxBreathing();
                openUltraFocus();
                if (!pomodoroApi.isRunning()) {
                    pomodoroApi.togglePlay();
                }
            });
        }

        // Direct triggers from Daily Focus & Pomodoro Widgets
        var dailyFocusCard = document.getElementById('dailyFocus');
        if (dailyFocusCard) {
            dailyFocusCard.addEventListener('dblclick', function () {
                openUltraFocus();
            });
        }
        var pomodoroRingInner = document.querySelector('#pomodoro .pomodoro-ring-inner');
        if (pomodoroRingInner) {
            pomodoroRingInner.style.cursor = 'pointer';
            pomodoroRingInner.title = 'Click to open Ultra Focus (Shift+F)';
            pomodoroRingInner.addEventListener('click', function () {
                openUltraFocus();
            });
        }

        // Global Keyboard Shortcut handler (Shift + F, Alt + F, Esc, Space)
        document.addEventListener('keydown', function (e) {
            var activeEl = document.activeElement;
            var activeTag = (activeEl && activeEl.tagName) || '';
            var isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || (activeEl && activeEl.isContentEditable);
            var isEmptyInput = isInput && activeEl && (!activeEl.value || activeEl.value.trim() === '');

            // Shift + F or Alt + F: Toggle Ultra Focus
            var isShiftF = (e.shiftKey && (e.key === 'F' || e.key === 'f' || e.code === 'KeyF')) ||
                           (e.altKey && (e.key === 'F' || e.key === 'f' || e.code === 'KeyF'));

            if (isShiftF && (!isInput || isEmptyInput)) {
                e.preventDefault();
                if (isInput && activeEl) activeEl.blur();
                toggleUltraFocus();
            }

            // Esc: Close Ultra Focus or Box Breathing
            if (e.key === 'Escape') {
                if (boxBreathingModal && boxBreathingModal.classList.contains('active')) {
                    closeBoxBreathing();
                } else if (overlay && overlay.classList.contains('active')) {
                    closeUltraFocus();
                }
            }

            // Space: Toggle Play/Pause when in Ultra Focus (and not typing)
            if (e.code === 'Space' && overlay && overlay.classList.contains('active') && !isInput) {
                e.preventDefault();
                pomodoroApi.togglePlay();
            }

            // M: Toggle Focus Music Play/Pause (when in Ultra Focus and not typing)
            if ((e.key === 'm' || e.key === 'M') && overlay && overlay.classList.contains('active') && !isInput) {
                e.preventDefault();
                if (ultraPlayTrackBtn) ultraPlayTrackBtn.click();
            }

            // N: Next Focus Song (when in Ultra Focus and not typing)
            if ((e.key === 'n' || e.key === 'N') && overlay && overlay.classList.contains('active') && !isInput) {
                e.preventDefault();
                if (ultraNextTrackBtn) ultraNextTrackBtn.click();
            }
        });

        return {
            open: openUltraFocus,
            close: closeUltraFocus,
            toggle: toggleUltraFocus,
            addFocusedMinute: addFocusedMinute,
            addCompletedSession: addCompletedSession
        };
    }

    function initPomodoro() {
        var timeEl = document.getElementById('pomodoroTime');
        var badgeEl = document.getElementById('pomodoroBadge');
        var progressCircle = document.getElementById('pomodoroProgress');
        var playBtn = document.getElementById('pomodoroPlayBtn');
        var resetBtn = document.getElementById('pomodoroResetBtn');
        var skipBtn = document.getElementById('pomodoroSkipBtn');

        if (!timeEl || !progressCircle || !playBtn) return;

        var MODES = {
            work: { duration: 25 * 60, label: 'FOCUS', color: '#60a5fa' },
            shortBreak: { duration: 5 * 60, label: 'BREAK', color: '#34d399' },
            longBreak: { duration: 15 * 60, label: 'REST', color: '#a78bfa' }
        };
        var currentMode = 'work';
        var timeLeft = MODES[currentMode].duration;
        var timerId = null;
        var isRunning = false;
        var fullCircumference = 289;

        function updateDisplay() {
            var m = Math.floor(timeLeft / 60);
            var s = timeLeft % 60;
            var formatted = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
            timeEl.textContent = formatted;

            var total = MODES[currentMode].duration;
            var offset = fullCircumference * (1 - (timeLeft / total));
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = MODES[currentMode].color;
            if (badgeEl) {
                badgeEl.textContent = MODES[currentMode].label;
                badgeEl.style.color = MODES[currentMode].color;
            }
            if (playBtn) {
                playBtn.innerHTML = isRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            }

            // Sync with Ultra Focus & Dynamic Island elements
            var ultraTimer = document.getElementById('ultraTimerDisplay');
            var ultraBadge = document.getElementById('ultraModeBadge');
            var ultraProgress = document.getElementById('ultraRingProgress');
            var ultraPlay = document.getElementById('ultraPlayBtn');
            var pillTimer = document.getElementById('pillTimeDisplay');
            var pillPlay = document.getElementById('pillPlayBtn');

            if (ultraTimer) ultraTimer.textContent = formatted;
            if (pillTimer) pillTimer.textContent = formatted;
            if (ultraBadge) {
                ultraBadge.textContent = MODES[currentMode].label === 'FOCUS' ? 'DEEP WORK' : MODES[currentMode].label;
                ultraBadge.style.color = MODES[currentMode].color;
                ultraBadge.style.borderColor = MODES[currentMode].color;
            }
            if (ultraProgress) {
                var ultraCircumference = 660; // 2 * PI * 105
                var ultraOffset = ultraCircumference * (1 - (timeLeft / total));
                ultraProgress.style.strokeDashoffset = ultraOffset;
                ultraProgress.style.stroke = MODES[currentMode].color;
            }
            if (ultraPlay) {
                ultraPlay.innerHTML = isRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            }
            if (pillPlay) {
                pillPlay.innerHTML = isRunning ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            }
        }

        function playChime() {
            try {
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                var ctx = new AudioContext();
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
            } catch (e) { }
        }

        function tick() {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();

                // Track focused minutes in work mode
                if (currentMode === 'work' && ultraFocusApi && timeLeft % 60 === 0 && timeLeft !== MODES.work.duration) {
                    ultraFocusApi.addFocusedMinute();
                }
            } else {
                clearInterval(timerId);
                isRunning = false;
                playChime();
                if (currentMode === 'work') {
                    if (ultraFocusApi) ultraFocusApi.addCompletedSession();
                    currentMode = 'shortBreak';
                } else {
                    currentMode = 'work';
                }
                timeLeft = MODES[currentMode].duration;
                updateDisplay();
                if (typeof showToast === 'function') {
                    showToast('Pomodoro session completed!', 'success', 2500);
                }
            }
        }

        function toggleTimer() {
            if (isRunning) {
                clearInterval(timerId);
                isRunning = false;
            } else {
                isRunning = true;
                timerId = setInterval(tick, 1000);
            }
            updateDisplay();
        }

        function resetTimer() {
            clearInterval(timerId);
            isRunning = false;
            timeLeft = MODES[currentMode].duration;
            updateDisplay();
        }

        function skipTimer() {
            clearInterval(timerId);
            isRunning = false;
            if (currentMode === 'work') currentMode = 'shortBreak';
            else if (currentMode === 'shortBreak') currentMode = 'longBreak';
            else currentMode = 'work';
            timeLeft = MODES[currentMode].duration;
            updateDisplay();
        }

        function setTimerMode(mode) {
            if (!MODES[mode]) return;
            clearInterval(timerId);
            isRunning = false;
            currentMode = mode;
            timeLeft = MODES[currentMode].duration;
            updateDisplay();
        }

        playBtn.addEventListener('click', toggleTimer);
        if (resetBtn) resetBtn.addEventListener('click', resetTimer);
        if (skipBtn) skipBtn.addEventListener('click', skipTimer);

        updateDisplay();

        var pomoApi = {
            togglePlay: toggleTimer,
            reset: resetTimer,
            skip: skipTimer,
            setMode: setTimerMode,
            isRunning: function () { return isRunning; },
            syncUltraDisplay: updateDisplay
        };

        ultraFocusApi = initUltraFocusMode(pomoApi);
    }

    // === DAILY FOCUS GOAL ENGINE ===
    function initDailyFocus() {
        var input = document.getElementById('focusInput');
        var checkbox = document.getElementById('focusCheckbox');
        if (!input || !checkbox) return;

        var today = new Date().toDateString();
        var savedDate = localStorage.getItem(LS_KEYS.dailyFocusDate);
        if (savedDate !== today) {
            // New day: reset completion
            localStorage.setItem(LS_KEYS.dailyFocusDate, today);
            localStorage.setItem(LS_KEYS.dailyFocusDone, 'false');
        }

        var savedText = localStorage.getItem(LS_KEYS.dailyFocusText) || '';
        var isDone = localStorage.getItem(LS_KEYS.dailyFocusDone) === 'true';

        input.value = savedText;
        if (isDone) {
            checkbox.classList.add('completed');
            input.classList.add('completed');
        }

        input.addEventListener('input', function () {
            save(LS_KEYS.dailyFocusText, this.value);
            save(LS_KEYS.dailyFocusDate, today);
            var ultraInput = document.getElementById('ultraTaskInput');
            if (ultraInput) ultraInput.value = this.value;
            var pillTask = document.getElementById('pillTaskDisplay');
            if (pillTask) pillTask.textContent = this.value || 'Deep Work';
        });

        checkbox.addEventListener('click', function () {
            var completed = this.classList.toggle('completed');
            input.classList.toggle('completed', completed);
            save(LS_KEYS.dailyFocusDone, completed);

            var ultraCheck = document.getElementById('ultraTaskCheck');
            var ultraInput = document.getElementById('ultraTaskInput');
            if (ultraCheck) ultraCheck.classList.toggle('completed', completed);
            if (ultraInput) ultraInput.classList.toggle('completed', completed);

            if (completed && typeof showToast === 'function') {
                showToast('Focus goal achieved! ✨', 'success', 2000);
            }
        });
    }


    // === DAILY QUOTE CAPSULE ENGINE ===
    function initQuoteCapsule() {
        var quoteText = document.getElementById('quoteText');
        var quoteAuthor = document.getElementById('quoteAuthor');
        var shuffleBtn = document.getElementById('quoteShuffleBtn');
        if (!quoteText || !quoteAuthor) return;

        var quotes = [
            { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
            { text: "Make each day your masterpiece.", author: "John Wooden" },
            { text: "Focus is a muscle. Practice using it every single day.", author: "Steve Jobs" },
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Design is not just what it looks like, it's how it works.", author: "Jony Ive" },
            { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
            { text: "Clutter is nothing more than postponed decisions.", author: "Barbara Hemphill" },
            { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
            { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
            { text: "Quiet minds cannot be perplexed or frightened.", author: "Robert Louis Stevenson" },
            { text: "Light tomorrow with today.", author: "Elizabeth Barrett Browning" }
        ];

        function setQuote(idx) {
            var q = quotes[idx % quotes.length];
            quoteText.style.opacity = '0';
            setTimeout(function () {
                quoteText.textContent = '"' + q.text + '"';
                quoteAuthor.textContent = '— ' + q.author;
                quoteText.style.opacity = '1';
            }, 180);
        }

        var savedIdx = parseInt(localStorage.getItem('halo_quote_idx'), 10) || 0;
        setQuote(savedIdx);

        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', function () {
                savedIdx = (savedIdx + 1) % quotes.length;
                save('halo_quote_idx', savedIdx);
                setQuote(savedIdx);
            });
        }
    }

    // === BACKGROUND COLOR SAMPLING ===
    function initGlassTint() {
        function sampleColor() {
            var bgPhoto = document.getElementById('bgPhoto');
            if (!bgPhoto || !bgPhoto.classList.contains('photo-active') || !bgPhoto.src) return;
            try {
                var canvas = document.createElement('canvas');
                canvas.width = 8;
                canvas.height = 8;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(bgPhoto, 0, 0, 8, 8);
                var data = ctx.getImageData(0, 0, 8, 8).data;
                var r = 0, g = 0, b = 0, count = 0;
                for (var i = 0; i < data.length; i += 4) {
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                }
                r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
                document.documentElement.style.setProperty('--halo-glass-tint', 'rgba(' + r + ',' + g + ',' + b + ',0.03)');
            } catch (e) { }
        }
        var bgPhoto = document.getElementById('bgPhoto');
        if (bgPhoto) {
            bgPhoto.addEventListener('load', sampleColor);
            if (bgPhoto.complete && bgPhoto.src) sampleColor();
        }
    }

    // === KEYBOARD SHORTCUTS ===
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var input = document.getElementById('haloSearchInput');
                if (input) input.focus();
            }
        });
    }

    // === MAIN INIT ===
    function init() {
        applyCSSVars();
        applyAllWidgetCustomizations();
        initTransparencyControls();
        initTransparencyPopup();
        initToggles();
        initAmbientBlendEngine();
        initSpecularHighlight();
        init3DParallaxTilt();
        initSearchBar();
        initAmbientGlow();
        initSpotifyAndSounds();
        initPomodoro();
        initDailyFocus();
        initQuoteCapsule();
        initGlassTint();
        initKeyboardShortcuts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();