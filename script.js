const DEFAULT_STATE = {
  bedtime: "22:00",
  wakeTime: "07:00",
  targetSleep: 9,
  checkIns: [],
  name: "Sleeper",
  theme: "twilight",
  reminderTime: "21:45",
  nudgesEnabled: true,
  bedtimeAlarm: "default-chime",
  wakeAlarm: "default-bell",
};

const appState = { ...DEFAULT_STATE };
let currentUser = null;

const pages = Array.from(document.querySelectorAll("[data-page]"));
const navButtons = Array.from(document.querySelectorAll("[data-go-to]"));

const authForm = document.querySelector("#authForm");
const authEmailInput = document.querySelector("#authEmailInput");
const authPasswordInput = document.querySelector("#authPasswordInput");
const signInButton = document.querySelector("#signInButton");
const signUpButton = document.querySelector("#signUpButton");
const authFeedback = document.querySelector("#authFeedback");
const authStatus = document.querySelector("#authStatus");

const signupForm = document.querySelector("#signupForm");
const nameInput = document.querySelector("#nameInput");
const goalsForm = document.querySelector("#goalsForm");
const bedtimeInput = document.querySelector("#bedtimeInput");
const wakeTimeInput = document.querySelector("#wakeTimeInput");
const targetSleepInput = document.querySelector("#targetSleepInput");
const targetSleepValue = document.querySelector("#targetSleepValue");

const homeGreeting = document.querySelector("#homeGreeting");
const motivationLine = document.querySelector("#motivationLine");
const bedtimeGoal = document.querySelector("#bedtimeGoal");
const wakeGoal = document.querySelector("#wakeGoal");
const bedtimeStatus = document.querySelector("#bedtimeCheckStatus");
const wakeStatus = document.querySelector("#wakeCheckStatus");
const bedtimeCheckButton = document.querySelector("#bedtimeCheckButton");
const wakeCheckButton = document.querySelector("#wakeCheckButton");
const clearTodayButton = document.querySelector("#clearTodayButton");
const homeSignOutButton = document.querySelector("#homeSignOutButton");

const trackerGrid = document.querySelector("#trackerGrid");
const currentStreak = document.querySelector("#currentStreak");
const longestStreak = document.querySelector("#longestStreak");
const totalPoints = document.querySelector("#totalPoints");
const levelProgress = document.querySelector("#levelProgress");
const streakMessage = document.querySelector("#streakMessage");
const weeklyConsistency = document.querySelector("#weeklyConsistency");
const onTimeCheckIns = document.querySelector("#onTimeCheckIns");
const trendMessage = document.querySelector("#trendMessage");
const reminderText = document.querySelector("#reminderText");
const historyList = document.querySelector("#historyList");
const leaderboardYouLabel = document.querySelector("#leaderboardYouLabel");
const leaderboardYouPoints = document.querySelector("#leaderboardYouPoints");
const leaderboardRankHint = document.querySelector("#leaderboardRankHint");

const settingsEmailValue = document.querySelector("#settingsEmailValue");
const settingsNameValue = document.querySelector("#settingsNameValue");
const settingsBedtimeValue = document.querySelector("#settingsBedtimeValue");
const settingsWakeValue = document.querySelector("#settingsWakeValue");
const settingsTargetValue = document.querySelector("#settingsTargetValue");
const settingsThemeValue = document.querySelector("#settingsThemeValue");
const settingsReminderValue = document.querySelector("#settingsReminderValue");
const settingsNudgesValue = document.querySelector("#settingsNudgesValue");
const settingsBedtimeAlarmValue = document.querySelector("#settingsBedtimeAlarmValue");
const settingsWakeAlarmValue = document.querySelector("#settingsWakeAlarmValue");
const settingsNotificationValue = document.querySelector("#settingsNotificationValue");

const settingsForm = document.querySelector("#settingsForm");
const settingsNameInput = document.querySelector("#settingsNameInput");
const themeSelect = document.querySelector("#themeSelect");
const reminderTimeInput = document.querySelector("#reminderTimeInput");
const nudgesToggle = document.querySelector("#nudgesToggle");
const bedtimeAlarmSelect = document.querySelector("#bedtimeAlarmSelect");
const wakeAlarmSelect = document.querySelector("#wakeAlarmSelect");
const alarmFilesInput = document.querySelector("#alarmFilesInput");
const settingsSignOutButton = document.querySelector("#settingsSignOutButton");
const settingsSaveFeedback = document.querySelector("#settingsSaveFeedback");
const testBedtimeAlarmButton = document.querySelector("#testBedtimeAlarmButton");
const testWakeAlarmButton = document.querySelector("#testWakeAlarmButton");
const notificationPermissionButton = document.querySelector("#notificationPermissionButton");
const alarmImportFeedback = document.querySelector("#alarmImportFeedback");

const dbLoading = document.querySelector("#dbLoading");
const dbError = document.querySelector("#dbError");
const retryLoadButton = document.querySelector("#retryLoadButton");

let alarmOptions = [];
let scheduleTimerId = null;
let dbReady = false;
let authCooldownUntil = 0;
let authCooldownTimerId = null;

const lastNotificationMinuteByType = {
  bedtime: "",
  wake: "",
};

const builtInAlarmOptions = [
  { value: "default-chime", label: "Default Chime", frequency: 880, durationMs: 420 },
  { value: "default-bell", label: "Default Bell", frequency: 660, durationMs: 560 },
  { value: "default-soft", label: "Default Soft Tone", frequency: 540, durationMs: 360 },
];

function showPage(pageName) {
  const nextPage = pages.find((page) => page.dataset.page === pageName);
  if (!nextPage) return;

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === pageName);
  });

  nextPage.classList.add("is-entering");
  window.setTimeout(() => nextPage.classList.remove("is-entering"), 220);

  updateBottomNav(pageName);
  if (pageName === "history") renderHistory();
  if (pageName === "settings") syncSettingsForm();
}

function updateBottomNav(pageName) {
  const tabs = Array.from(document.querySelectorAll(".nav-item"));
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.goTo === pageName);
  });
}

function formatSleepHours(value) {
  const normalized = Number(value);
  return `${normalized % 1 === 0 ? normalized.toFixed(0) : normalized} ${
    normalized === 1 ? "hour" : "hours"
  }`;
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return ((hours * 60 + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
}

function offsetTime(value, deltaMinutes) {
  const minutes = (parseTimeToMinutes(value) + deltaMinutes + 24 * 60) % (24 * 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMinuteDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 24 * 60 - diff);
}

function formatTimeLabel(isoValue) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getCurrentMinuteLabel(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getWeekConfig() {
  const today = new Date();
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const days = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      day: dayNames[date.getDay()],
      date: date.getDate(),
      dayKey: getDayKey(date),
      isToday: i === 0,
    });
  }

  return days;
}

function getCheckInForDay(dayKey) {
  return appState.checkIns.find((entry) => entry.day_key === dayKey) || null;
}

function upsertCheckInLocal(dayKey, patch) {
  const current = getCheckInForDay(dayKey);
  if (current) {
    Object.assign(current, patch);
    return;
  }

  appState.checkIns.push({
    day_key: dayKey,
    bedtime_on_time: null,
    wake_on_time: null,
    bedtime_checked_at: null,
    wake_checked_at: null,
    ...patch,
  });
}

function getWeekResults() {
  const week = getWeekConfig();
  return week.map((day) => {
    const entry = getCheckInForDay(day.dayKey);
    const complete = Boolean(entry) && entry.bedtime_on_time === true && entry.wake_on_time === true;
    return { ...day, entry, complete };
  });
}

function computeStreakStats(completions) {
  let current = 0;
  for (let i = completions.length - 1; i >= 0; i -= 1) {
    if (!completions[i]) break;
    current += 1;
  }

  let longest = 0;
  let running = 0;
  completions.forEach((flag) => {
    if (flag) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  });

  return { current, longest };
}

function applyTheme() {
  const themeClassMap = {
    twilight: "theme-twilight",
    dawn: "theme-dawn",
    midnight: "theme-midnight",
  };
  Object.values(themeClassMap).forEach((name) => document.body.classList.remove(name));
  document.body.classList.add(themeClassMap[appState.theme] || "theme-twilight");
}

function buildMotivationLine(completedDays) {
  if (!appState.nudgesEnabled) return "Motivational nudges are turned off.";
  if (completedDays >= 5) return "Amazing consistency - keep protecting your sleep rhythm.";
  if (completedDays >= 2) return "Nice momentum. Stay within your check-in windows tonight.";
  return "One good night at a time - you've got this.";
}

function syncProfileToHome(completedDays = 0) {
  homeGreeting.textContent = `Hey, ${appState.name}!`;
  motivationLine.textContent = buildMotivationLine(completedDays);
  motivationLine.classList.toggle("hidden", !appState.nudgesEnabled);
}

function syncGoalsToHome() {
  bedtimeGoal.textContent = `Goal: ${appState.bedtime}`;
  wakeGoal.textContent = `Goal: ${appState.wakeTime}`;
  reminderText.textContent = `Reminder time: ${appState.reminderTime}`;
}

function getAlarmLabel(value) {
  const match = alarmOptions.find((option) => option.value === value);
  return match ? match.label : "Not selected";
}

function getNotificationStatusLabel() {
  if (!("Notification" in window)) return "Unavailable";
  if (Notification.permission === "granted") return "Enabled";
  if (Notification.permission === "denied") return "Blocked";
  return "Not enabled";
}

function syncSettingsSummary(points) {
  settingsEmailValue.textContent = currentUser?.email || "Not logged in";
  settingsNameValue.textContent = appState.name;
  settingsBedtimeValue.textContent = appState.bedtime;
  settingsWakeValue.textContent = appState.wakeTime;
  settingsTargetValue.textContent = formatSleepHours(appState.targetSleep);
  settingsThemeValue.textContent =
    appState.theme === "midnight"
      ? "Midnight Blue"
      : appState.theme === "dawn"
        ? "Dawn Glow"
        : "Twilight Purple";
  settingsReminderValue.textContent = appState.reminderTime;
  settingsNudgesValue.textContent = appState.nudgesEnabled ? "Enabled" : "Disabled";
  settingsBedtimeAlarmValue.textContent = getAlarmLabel(appState.bedtimeAlarm);
  settingsWakeAlarmValue.textContent = getAlarmLabel(appState.wakeAlarm);
  settingsNotificationValue.textContent = getNotificationStatusLabel();

  leaderboardYouLabel.textContent = appState.name;
  leaderboardYouPoints.textContent = `${points} pts`;
  leaderboardRankHint.textContent =
    points >= 1900 ? "You're close to the top!" : "Keep checking in to climb the board.";
}

function notify(message) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Sleep Streaks", { body: message });
  }
}

function playTone(freq, durationMs) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gainNode.gain.value = 0.001;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  const now = audioContext.currentTime;
  gainNode.gain.exponentialRampToValueAtTime(0.24, now + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  oscillator.stop(now + durationMs / 1000 + 0.03);
}

function playAlarmByValue(alarmValue) {
  const choice = alarmOptions.find((option) => option.value === alarmValue);
  if (!choice) {
    playTone(760, 420);
    return;
  }

  if (choice.filePath) {
    const audio = new Audio(choice.filePath);
    audio.play().catch(() => {
      playTone(choice.frequency || 700, choice.durationMs || 430);
    });
    return;
  }

  playTone(choice.frequency || 700, choice.durationMs || 430);
}

function triggerAlarm(type) {
  if (type === "bedtime") {
    playAlarmByValue(appState.bedtimeAlarm);
    notify(`It's bedtime (${appState.bedtime}).`);
    return;
  }
  playAlarmByValue(appState.wakeAlarm);
  notify(`Wake-up time (${appState.wakeTime}).`);
}

function runAlarmSchedulerTick() {
  const minuteLabel = getCurrentMinuteLabel();
  if (minuteLabel === appState.bedtime && lastNotificationMinuteByType.bedtime !== minuteLabel) {
    triggerAlarm("bedtime");
    lastNotificationMinuteByType.bedtime = minuteLabel;
  }
  if (minuteLabel === appState.wakeTime && lastNotificationMinuteByType.wake !== minuteLabel) {
    triggerAlarm("wake");
    lastNotificationMinuteByType.wake = minuteLabel;
  }
  if (minuteLabel !== appState.bedtime) lastNotificationMinuteByType.bedtime = "";
  if (minuteLabel !== appState.wakeTime) lastNotificationMinuteByType.wake = "";
}

function startAlarmScheduler() {
  if (scheduleTimerId) window.clearInterval(scheduleTimerId);
  scheduleTimerId = window.setInterval(runAlarmSchedulerTick, 1000);
}

function populateAlarmSelectors() {
  const buildOptionsMarkup = () =>
    alarmOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
  bedtimeAlarmSelect.innerHTML = buildOptionsMarkup();
  wakeAlarmSelect.innerHTML = buildOptionsMarkup();
}

async function loadAlarmOptions() {
  let discovered = [];
  try {
    const response = await fetch("./alarms/manifest.json", { cache: "no-store" });
    if (response.ok) {
      const manifest = await response.json();
      if (Array.isArray(manifest)) {
        discovered = manifest
          .filter((entry) => entry && entry.file && entry.label)
          .map((entry) => ({
            value: `file-${entry.file}`,
            label: entry.label,
            filePath: `./alarms/${entry.file}`,
          }));
      }
    }
  } catch (error) {
    // ignore optional manifest loading
  }

  alarmOptions = [...builtInAlarmOptions, ...discovered];
  populateAlarmSelectors();
}

function updateTargetDisplay() {
  appState.targetSleep = Number(targetSleepInput.value);
  targetSleepValue.textContent = formatSleepHours(appState.targetSleep);
}

function renderTracker() {
  const week = getWeekResults();
  trackerGrid.innerHTML = "";

  week.forEach((item) => {
    const cell = document.createElement("div");
    cell.className = "tracker-cell";
    cell.classList.toggle("is-today", item.isToday);
    cell.classList.toggle("is-done", item.complete);
    cell.setAttribute("aria-label", `${item.day} ${item.date}${item.isToday ? " (today)" : ""}`);
    cell.innerHTML = `<span class="day">${item.day}</span><span class="date">${item.date}</span>`;
    trackerGrid.appendChild(cell);
  });
}

function applyStatusClass(element, value) {
  element.classList.remove("is-success", "is-failed");
  if (value === true) element.classList.add("is-success");
  else if (value === false) element.classList.add("is-failed");
}

function updateCheckInStatusUi() {
  const todayEntry = getCheckInForDay(getDayKey(new Date()));
  const bedtimeValue = todayEntry?.bedtime_on_time;
  const wakeValue = todayEntry?.wake_on_time;

  const bedtimeSuffix = todayEntry?.bedtime_checked_at
    ? ` at ${formatTimeLabel(todayEntry.bedtime_checked_at)}`
    : "";
  const wakeSuffix = todayEntry?.wake_checked_at
    ? ` at ${formatTimeLabel(todayEntry.wake_checked_at)}`
    : "";

  bedtimeStatus.textContent =
    bedtimeValue === true
      ? `On time${bedtimeSuffix}`
      : bedtimeValue === false
        ? `Outside ±30 min${bedtimeSuffix}`
        : "Not checked in yet.";

  wakeStatus.textContent =
    wakeValue === true
      ? `On time${wakeSuffix}`
      : wakeValue === false
        ? `Outside ±30 min${wakeSuffix}`
        : "Not checked in yet.";

  applyStatusClass(bedtimeStatus, bedtimeValue);
  applyStatusClass(wakeStatus, wakeValue);
}

function formatBooleanLabel(value, checkedAt) {
  if (value === true) return `On time${checkedAt ? ` (${formatTimeLabel(checkedAt)})` : ""}`;
  if (value === false) return `Outside window${checkedAt ? ` (${formatTimeLabel(checkedAt)})` : ""}`;
  return "No check-in";
}

function renderHistory() {
  const week = getWeekResults().slice().reverse();
  historyList.innerHTML = "";

  week.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="history-top-row">
        <strong>${item.day} ${item.date}</strong>
        <span class="history-badge ${item.complete ? "is-success" : "is-muted"}">
          ${item.complete ? "Complete day" : "Incomplete"}
        </span>
      </div>
      <p>
        Bedtime: ${formatBooleanLabel(item.entry?.bedtime_on_time, item.entry?.bedtime_checked_at)}
        · Wake: ${formatBooleanLabel(item.entry?.wake_on_time, item.entry?.wake_checked_at)}
      </p>
    `;
    historyList.appendChild(li);
  });
}

function updateStats() {
  const week = getWeekResults();
  const completions = week.map((item) => item.complete);
  const stats = computeStreakStats(completions);
  const completedDays = completions.filter(Boolean).length;
  const points = completedDays * 100;

  const onTimeCount = week.reduce((count, day) => {
    let total = count;
    if (day.entry?.bedtime_on_time === true) total += 1;
    if (day.entry?.wake_on_time === true) total += 1;
    return total;
  }, 0);

  currentStreak.textContent = String(stats.current);
  longestStreak.textContent = String(stats.longest);
  totalPoints.textContent = String(points);
  streakMessage.textContent =
    completedDays > 0
      ? `Great work! You completed ${completedDays} successful day${completedDays > 1 ? "s" : ""} this week.`
      : "Start your streak today!";

  const progressPct = Math.min(100, Math.round((points / 500) * 100));
  levelProgress.style.width = `${progressPct}%`;

  const consistency = Math.round((completedDays / 7) * 100);
  weeklyConsistency.textContent = `${consistency}%`;
  onTimeCheckIns.textContent = `${onTimeCount} / 14`;
  trendMessage.textContent =
    completedDays >= 4
      ? "Strong trend this week - keep following your rhythm."
      : "Complete both check-ins daily to improve your trend.";

  syncProfileToHome(completedDays);
  syncSettingsSummary(points);
}

function syncSettingsForm() {
  settingsNameInput.value = appState.name;
  themeSelect.value = appState.theme;
  reminderTimeInput.value = appState.reminderTime;
  nudgesToggle.checked = appState.nudgesEnabled;
  bedtimeAlarmSelect.value = appState.bedtimeAlarm;
  wakeAlarmSelect.value = appState.wakeAlarm;
}

function showFeedback(el, message, isSuccess = true) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("is-visible", true);
  el.style.color = isSuccess ? "#4f9f6f" : "#b0566f";
}

function clearFeedback(el) {
  if (!el) return;
  el.textContent = "";
  el.classList.remove("is-visible");
  el.style.removeProperty("color");
}

function isRateLimitError(error) {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.statusCode || 0);
  return status === 429 || message.includes("rate limit") || message.includes("too many requests");
}

function getAuthCooldownRemainingMs() {
  return Math.max(0, authCooldownUntil - Date.now());
}

function getAuthCooldownSeconds() {
  return Math.ceil(getAuthCooldownRemainingMs() / 1000);
}

function updateAuthButtonsForCooldown() {
  const remainingSeconds = getAuthCooldownSeconds();
  const inCooldown = remainingSeconds > 0;
  signInButton.disabled = inCooldown;
  signUpButton.disabled = inCooldown;
  signInButton.textContent = inCooldown ? `Wait ${remainingSeconds}s` : "Log In";
  signUpButton.textContent = inCooldown ? `Wait ${remainingSeconds}s` : "Sign Up";
}

function startAuthCooldown(ms) {
  authCooldownUntil = Date.now() + ms;
  updateAuthButtonsForCooldown();
  if (authCooldownTimerId) {
    window.clearInterval(authCooldownTimerId);
  }
  authCooldownTimerId = window.setInterval(() => {
    updateAuthButtonsForCooldown();
    if (getAuthCooldownRemainingMs() <= 0) {
      window.clearInterval(authCooldownTimerId);
      authCooldownTimerId = null;
      authCooldownUntil = 0;
      updateAuthButtonsForCooldown();
    }
  }, 1000);
}

async function upsertProfile() {
  if (!currentUser || !dbReady) return;

  const payload = {
    user_id: currentUser.id,
    email: currentUser.email,
    display_name: appState.name,
    bedtime_goal: appState.bedtime,
    wake_goal: appState.wakeTime,
    target_sleep_hours: appState.targetSleep,
    theme: appState.theme,
    reminder_time: appState.reminderTime,
    nudges_enabled: appState.nudgesEnabled,
    bedtime_alarm: appState.bedtimeAlarm,
    wake_alarm: appState.wakeAlarm,
    updated_at: new Date().toISOString(),
  };

  const { error } = await window.supabaseClient
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

async function saveCheckInToDb(dayKey, patch) {
  if (!currentUser || !dbReady) return;

  const current = getCheckInForDay(dayKey);
  const payload = {
    user_id: currentUser.id,
    day_key: dayKey,
    bedtime_on_time: patch.bedtime_on_time ?? current?.bedtime_on_time ?? null,
    wake_on_time: patch.wake_on_time ?? current?.wake_on_time ?? null,
    bedtime_checked_at: patch.bedtime_checked_at ?? current?.bedtime_checked_at ?? null,
    wake_checked_at: patch.wake_checked_at ?? current?.wake_checked_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await window.supabaseClient
    .from("sleep_checkins")
    .upsert(payload, { onConflict: "user_id,day_key" })
    .select()
    .single();

  if (error) throw error;
  upsertCheckInLocal(dayKey, data);
}

async function clearTodayCheckInsInDb() {
  if (!currentUser || !dbReady) return;
  const dayKey = getDayKey(new Date());
  const { error } = await window.supabaseClient
    .from("sleep_checkins")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("day_key", dayKey);

  if (error) throw error;
  appState.checkIns = appState.checkIns.filter((entry) => entry.day_key !== dayKey);
}

async function loadProfileAndCheckIns() {
  if (!currentUser || !dbReady) return;

  const [{ data: profile, error: profileError }, { data: checkins, error: checkinsError }] =
    await Promise.all([
      window.supabaseClient
        .from("user_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle(),
      window.supabaseClient
        .from("sleep_checkins")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("day_key", { ascending: true }),
    ]);

  if (profileError) throw profileError;
  if (checkinsError) throw checkinsError;

  Object.assign(appState, { ...DEFAULT_STATE, ...appState });

  if (profile) {
    appState.name = profile.display_name || appState.name;
    appState.bedtime = profile.bedtime_goal || appState.bedtime;
    appState.wakeTime = profile.wake_goal || appState.wakeTime;
    appState.targetSleep = Number(profile.target_sleep_hours ?? appState.targetSleep);
    appState.theme = profile.theme || appState.theme;
    appState.reminderTime = profile.reminder_time || appState.reminderTime;
    appState.nudgesEnabled = profile.nudges_enabled ?? appState.nudgesEnabled;
    appState.bedtimeAlarm = profile.bedtime_alarm || appState.bedtimeAlarm;
    appState.wakeAlarm = profile.wake_alarm || appState.wakeAlarm;
  }

  appState.checkIns = Array.isArray(checkins) ? checkins : [];

  applyTheme();
  bedtimeInput.value = appState.bedtime;
  wakeTimeInput.value = appState.wakeTime;
  targetSleepInput.value = String(appState.targetSleep);
  updateTargetDisplay();
  syncGoalsToHome();
  syncSettingsForm();
  updateCheckInStatusUi();
  renderTracker();
  renderHistory();
  updateStats();
  authStatus.textContent = currentUser.email || "Logged in";
}

async function handleTimedCheckIn(type) {
  const now = new Date();
  const dayKey = getDayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const goalMinutes = parseTimeToMinutes(type === "bedtime" ? appState.bedtime : appState.wakeTime);
  const onTime = getMinuteDistance(nowMinutes, goalMinutes) <= 30;

  const patch =
    type === "bedtime"
      ? {
          bedtime_on_time: onTime,
          bedtime_checked_at: now.toISOString(),
        }
      : {
          wake_on_time: onTime,
          wake_checked_at: now.toISOString(),
        };

  try {
    await saveCheckInToDb(dayKey, patch);
    updateCheckInStatusUi();
    renderTracker();
    updateStats();
    renderHistory();
  } catch (error) {
    showFeedback(settingsSaveFeedback, `Could not save check-in: ${error.message}`, false);
  }
}

async function handleAuthAction(type) {
  clearFeedback(authFeedback);
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  const remainingSeconds = getAuthCooldownSeconds();

  if (remainingSeconds > 0) {
    showFeedback(
      authFeedback,
      `Too many attempts. Please wait ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""} before trying again.`,
      false
    );
    updateAuthButtonsForCooldown();
    return;
  }

  if (!email || !password) {
    showFeedback(authFeedback, "Email and password are required.", false);
    return;
  }

  try {
    if (type === "signup") {
      const { error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      showFeedback(authFeedback, "Signup successful. Check your email if confirmation is required.");
    } else {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showFeedback(authFeedback, "Logged in successfully.");
    }
  } catch (error) {
    if (isRateLimitError(error)) {
      startAuthCooldown(65000);
      showFeedback(
        authFeedback,
        "Email rate limit reached. Please wait about a minute before trying again.",
        false
      );
      return;
    }
    showFeedback(authFeedback, error.message, false);
  }
}

async function signOut() {
  await window.supabaseClient.auth.signOut();
}

function bindEvents() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetPage = button.dataset.goTo;
      if (targetPage) showPage(targetPage);
    });
  });

  signInButton.addEventListener("click", () => handleAuthAction("signin"));
  signUpButton.addEventListener("click", () => handleAuthAction("signup"));
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAuthAction("signin");
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    appState.name = nameInput.value.trim() || "Sleeper";
    syncProfileToHome();
    try {
      await upsertProfile();
      showPage("goals");
    } catch (error) {
      showFeedback(settingsSaveFeedback, `Failed to save name: ${error.message}`, false);
    }
  });

  targetSleepInput.addEventListener("input", updateTargetDisplay);

  goalsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const previousBedtime = appState.bedtime;
    const previousAutoReminder = offsetTime(previousBedtime, -15);

    appState.bedtime = bedtimeInput.value;
    appState.wakeTime = wakeTimeInput.value;
    appState.targetSleep = Number(targetSleepInput.value);
    if (!appState.reminderTime || appState.reminderTime === previousAutoReminder) {
      appState.reminderTime = offsetTime(appState.bedtime, -15);
    }

    syncGoalsToHome();
    updateStats();

    try {
      await upsertProfile();
      showPage("home");
    } catch (error) {
      showFeedback(settingsSaveFeedback, `Failed to save goals: ${error.message}`, false);
    }
  });

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    appState.name = settingsNameInput.value.trim() || "Sleeper";
    appState.theme = themeSelect.value;
    appState.reminderTime = reminderTimeInput.value || offsetTime(appState.bedtime, -15);
    appState.nudgesEnabled = nudgesToggle.checked;
    appState.bedtimeAlarm = bedtimeAlarmSelect.value;
    appState.wakeAlarm = wakeAlarmSelect.value;

    applyTheme();
    syncGoalsToHome();
    syncSettingsForm();
    updateStats();

    try {
      await upsertProfile();
      showFeedback(settingsSaveFeedback, "Preferences saved.");
      window.setTimeout(() => clearFeedback(settingsSaveFeedback), 1800);
    } catch (error) {
      showFeedback(settingsSaveFeedback, `Failed to save settings: ${error.message}`, false);
    }
  });

  bedtimeCheckButton.addEventListener("click", () => handleTimedCheckIn("bedtime"));
  wakeCheckButton.addEventListener("click", () => handleTimedCheckIn("wake"));

  clearTodayButton.addEventListener("click", async () => {
    try {
      await clearTodayCheckInsInDb();
      updateCheckInStatusUi();
      renderTracker();
      updateStats();
      renderHistory();
    } catch (error) {
      showFeedback(settingsSaveFeedback, `Could not clear today's check-ins: ${error.message}`, false);
    }
  });

  homeSignOutButton.addEventListener("click", signOut);
  settingsSignOutButton.addEventListener("click", signOut);

  testBedtimeAlarmButton.addEventListener("click", () => playAlarmByValue(bedtimeAlarmSelect.value));
  testWakeAlarmButton.addEventListener("click", () => playAlarmByValue(wakeAlarmSelect.value));

  notificationPermissionButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showFeedback(settingsSaveFeedback, "Notifications are not supported in this browser.", false);
      return;
    }
    const result = await Notification.requestPermission();
    showFeedback(
      settingsSaveFeedback,
      result === "granted"
        ? "Notifications enabled."
        : result === "denied"
          ? "Notifications blocked by browser."
          : "Notification permission dismissed.",
      result === "granted"
    );
    updateStats();
  });

  alarmFilesInput.addEventListener("change", () => {
    const files = Array.from(alarmFilesInput.files || []).filter((file) => file.type.startsWith("audio/"));
    if (!files.length) {
      alarmImportFeedback.textContent = "No audio files selected.";
      return;
    }

    const imported = files.map((file, index) => ({
      value: `upload-${Date.now()}-${index}`,
      label: file.name,
      filePath: URL.createObjectURL(file),
    }));

    alarmOptions = [...alarmOptions, ...imported];
    populateAlarmSelectors();

    if (!appState.bedtimeAlarm && alarmOptions.length) appState.bedtimeAlarm = alarmOptions[0].value;
    if (!appState.wakeAlarm && alarmOptions.length) appState.wakeAlarm = alarmOptions[0].value;

    syncSettingsForm();
    updateStats();
    alarmImportFeedback.textContent = `Imported ${imported.length} alarm sound${imported.length > 1 ? "s" : ""}.`;
  });

  retryLoadButton.addEventListener("click", async () => {
    await bootstrapFromAuth();
  });

  updateAuthButtonsForCooldown();
}

function initializeBaseUi() {
  nameInput.value = appState.name;
  bedtimeInput.value = appState.bedtime;
  wakeTimeInput.value = appState.wakeTime;
  targetSleepInput.value = String(appState.targetSleep);
  appState.reminderTime = offsetTime(appState.bedtime, -15);

  applyTheme();
  updateTargetDisplay();
  syncGoalsToHome();
  updateCheckInStatusUi();
  renderTracker();
  renderHistory();
  updateStats();
  updateBottomNav("intro");
}

async function loadAlarmAndDefaults() {
  await loadAlarmOptions();

  if (!alarmOptions.some((option) => option.value === appState.bedtimeAlarm)) {
    appState.bedtimeAlarm = alarmOptions[0]?.value || "";
  }
  if (!alarmOptions.some((option) => option.value === appState.wakeAlarm)) {
    appState.wakeAlarm = alarmOptions[1]?.value || alarmOptions[0]?.value || "";
  }

  syncSettingsForm();
  updateStats();
}

async function bootstrapFromAuth() {
  dbError.classList.add("hidden");
  dbLoading.classList.remove("hidden");

  try {
    if (!window.supabaseClient) {
      throw new Error("Supabase client not initialized.");
    }

    dbReady = true;
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;

    currentUser = data.session?.user || null;
    if (currentUser) {
      await loadProfileAndCheckIns();
      showPage("home");
    } else {
      authStatus.textContent = "Not logged in";
      showPage("intro");
    }

    dbLoading.classList.add("hidden");
  } catch (error) {
    dbLoading.classList.add("hidden");
    dbError.classList.remove("hidden");
    showFeedback(dbError.querySelector(".save-feedback"), error.message, false);
  }
}

function installAuthListener() {
  window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;

    if (currentUser) {
      authStatus.textContent = currentUser.email;
      await loadProfileAndCheckIns();
      showPage("home");
    } else {
      Object.assign(appState, { ...DEFAULT_STATE });
      appState.checkIns = [];
      initializeBaseUi();
      showPage("intro");
      authStatus.textContent = "Not logged in";
    }
  });
}

async function initialize() {
  bindEvents();
  initializeBaseUi();
  await loadAlarmAndDefaults();
  startAlarmScheduler();

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }

  try {
    if (window.supabaseClientReady) {
      await window.supabaseClientReady;
    }
  } catch (error) {
    dbLoading.classList.add("hidden");
    dbError.classList.remove("hidden");
    showFeedback(dbErrorMessage, error.message, false);
    return;
  }

  if (window.supabaseClient) {
    installAuthListener();
  }

  await bootstrapFromAuth();
}

initialize();
