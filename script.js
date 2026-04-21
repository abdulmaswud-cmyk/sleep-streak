const appState = {
  name: "Sleeper",
  bedtime: "22:00",
  wakeTime: "07:00",
  targetSleep: 9,
  checkIns: [],
  theme: "twilight",
  reminderTime: "21:45",
  nudgesEnabled: true,
};

const pages = Array.from(document.querySelectorAll("[data-page]"));
const navButtons = Array.from(document.querySelectorAll("[data-go-to]"));
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

const settingsNameValue = document.querySelector("#settingsNameValue");
const settingsBedtimeValue = document.querySelector("#settingsBedtimeValue");
const settingsWakeValue = document.querySelector("#settingsWakeValue");
const settingsTargetValue = document.querySelector("#settingsTargetValue");
const settingsThemeValue = document.querySelector("#settingsThemeValue");
const settingsReminderValue = document.querySelector("#settingsReminderValue");
const settingsNudgesValue = document.querySelector("#settingsNudgesValue");
const settingsForm = document.querySelector("#settingsForm");
const settingsNameInput = document.querySelector("#settingsNameInput");
const themeSelect = document.querySelector("#themeSelect");
const reminderTimeInput = document.querySelector("#reminderTimeInput");
const nudgesToggle = document.querySelector("#nudgesToggle");
const settingsSaveFeedback = document.querySelector("#settingsSaveFeedback");

function showPage(pageName) {
  const nextPage = pages.find((page) => page.dataset.page === pageName);
  if (!nextPage) {
    return;
  }

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === pageName);
  });

  nextPage.classList.add("is-entering");
  window.setTimeout(() => {
    nextPage.classList.remove("is-entering");
  }, 220);

  updateBottomNav(pageName);
  if (pageName === "history") {
    renderHistory();
  } else if (pageName === "settings") {
    syncSettingsForm();
  }
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
  if (!isoValue) {
    return "";
  }
  const date = new Date(isoValue);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  return appState.checkIns.find((entry) => entry.dayKey === dayKey) || null;
}

function upsertCheckIn(dayKey, patch) {
  const current = getCheckInForDay(dayKey);
  if (current) {
    Object.assign(current, patch);
    return;
  }

  appState.checkIns.push({
    dayKey,
    bedtimeOnTime: null,
    wakeOnTime: null,
    bedtimeCheckedAt: null,
    wakeCheckedAt: null,
    ...patch,
  });
}

function getWeekResults() {
  const week = getWeekConfig();
  return week.map((day) => {
    const entry = getCheckInForDay(day.dayKey);
    const complete = Boolean(entry) && entry.bedtimeOnTime === true && entry.wakeOnTime === true;
    return { ...day, entry, complete };
  });
}

function computeStreakStats(completions) {
  let current = 0;
  for (let i = completions.length - 1; i >= 0; i -= 1) {
    if (!completions[i]) {
      break;
    }
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
  if (!appState.nudgesEnabled) {
    return "Motivational nudges are turned off.";
  }
  if (completedDays >= 5) {
    return "Amazing consistency - keep protecting your sleep rhythm.";
  }
  if (completedDays >= 2) {
    return "Nice momentum. Stay within your check-in windows tonight.";
  }
  return "One good night at a time - you've got this.";
}

function syncProfileToHome(completedDays = 0) {
  homeGreeting.textContent = `Hey, ${appState.name}!`;
  motivationLine.textContent = buildMotivationLine(completedDays);
  motivationLine.classList.toggle("is-hidden", !appState.nudgesEnabled);
}

function syncGoalsToHome() {
  bedtimeGoal.textContent = `Goal: ${appState.bedtime}`;
  wakeGoal.textContent = `Goal: ${appState.wakeTime}`;
  reminderText.textContent = `Reminder time: ${appState.reminderTime}`;
}

function syncSettingsSummary(points) {
  settingsNameValue.textContent = appState.name;
  settingsBedtimeValue.textContent = appState.bedtime;
  settingsWakeValue.textContent = appState.wakeTime;
  settingsTargetValue.textContent = formatSleepHours(appState.targetSleep);
  settingsThemeValue.textContent = appState.theme === "midnight" ? "Midnight Blue" : appState.theme === "dawn" ? "Dawn Glow" : "Twilight Purple";
  settingsReminderValue.textContent = appState.reminderTime;
  settingsNudgesValue.textContent = appState.nudgesEnabled ? "Enabled" : "Disabled";

  leaderboardYouLabel.textContent = appState.name;
  leaderboardYouPoints.textContent = `${points} pts`;
  leaderboardRankHint.textContent =
    points >= 1900 ? "You're close to the top!" : "Keep checking in to climb the board.";
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
    cell.innerHTML = `
      <span class="day">${item.day}</span>
      <span class="date">${item.date}</span>
    `;
    trackerGrid.appendChild(cell);
  });
}

function applyStatusClass(element, value) {
  element.classList.remove("is-success", "is-failed");
  if (value === true) {
    element.classList.add("is-success");
  } else if (value === false) {
    element.classList.add("is-failed");
  }
}

function updateCheckInStatusUi() {
  const todayEntry = getCheckInForDay(getDayKey(new Date()));
  const bedtimeValue = todayEntry?.bedtimeOnTime;
  const wakeValue = todayEntry?.wakeOnTime;
  const bedtimeSuffix = todayEntry?.bedtimeCheckedAt
    ? ` at ${formatTimeLabel(todayEntry.bedtimeCheckedAt)}`
    : "";
  const wakeSuffix = todayEntry?.wakeCheckedAt ? ` at ${formatTimeLabel(todayEntry.wakeCheckedAt)}` : "";

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
  if (value === true) {
    return `On time${checkedAt ? ` (${formatTimeLabel(checkedAt)})` : ""}`;
  }
  if (value === false) {
    return `Outside window${checkedAt ? ` (${formatTimeLabel(checkedAt)})` : ""}`;
  }
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
        Bedtime: ${formatBooleanLabel(item.entry?.bedtimeOnTime, item.entry?.bedtimeCheckedAt)}
        · Wake: ${formatBooleanLabel(item.entry?.wakeOnTime, item.entry?.wakeCheckedAt)}
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
    if (day.entry?.bedtimeOnTime === true) {
      total += 1;
    }
    if (day.entry?.wakeOnTime === true) {
      total += 1;
    }
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
}

function handleTimedCheckIn(type) {
  const now = new Date();
  const dayKey = getDayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const goalMinutes = parseTimeToMinutes(type === "bedtime" ? appState.bedtime : appState.wakeTime);
  const onTime = getMinuteDistance(nowMinutes, goalMinutes) <= 30;

  upsertCheckIn(dayKey, {
    [`${type}OnTime`]: onTime,
    [`${type}CheckedAt`]: now.toISOString(),
  });

  updateCheckInStatusUi();
  renderTracker();
  updateStats();
  renderHistory();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetPage = button.dataset.goTo;
    if (targetPage) {
      showPage(targetPage);
    }
  });
});

targetSleepInput.addEventListener("input", updateTargetDisplay);
bedtimeCheckButton.addEventListener("click", () => handleTimedCheckIn("bedtime"));
wakeCheckButton.addEventListener("click", () => handleTimedCheckIn("wake"));

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appState.name = nameInput.value.trim() || "Sleeper";
  syncProfileToHome();
  showPage("goals");
});

goalsForm.addEventListener("submit", (event) => {
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
  showPage("home");
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appState.name = settingsNameInput.value.trim() || "Sleeper";
  appState.theme = themeSelect.value;
  appState.reminderTime = reminderTimeInput.value || offsetTime(appState.bedtime, -15);
  appState.nudgesEnabled = nudgesToggle.checked;

  applyTheme();
  syncGoalsToHome();
  updateStats();
  syncSettingsForm();

  settingsSaveFeedback.textContent = "Preferences saved.";
  window.setTimeout(() => {
    settingsSaveFeedback.textContent = "";
  }, 1800);
});

function initialize() {
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
  syncSettingsForm();
  updateBottomNav("intro");
}

initialize();
