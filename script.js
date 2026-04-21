const appState = {
  name: "Sleeper",
  bedtime: "22:00",
  wakeTime: "07:00",
  targetSleep: 9,
  checkIns: [],
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
const bedtimeGoal = document.querySelector("#bedtimeGoal");
const wakeGoal = document.querySelector("#wakeGoal");
const bedtimeStatus = document.querySelector("#bedtimeCheckStatus");
const wakeStatus = document.querySelector("#wakeCheckStatus");
const bedtimeCheckInButton = document.querySelector("#bedtimeCheckButton");
const wakeCheckInButton = document.querySelector("#wakeCheckButton");
const trackerGrid = document.querySelector("#trackerGrid");
const currentStreak = document.querySelector("#currentStreak");
const longestStreak = document.querySelector("#longestStreak");
const totalPoints = document.querySelector("#totalPoints");
const levelProgress = document.querySelector("#levelProgress");
const streakMessage = document.querySelector("#streakMessage");

function showPage(pageName) {
  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.page === pageName);
  });
  updateBottomNav(pageName);
}

function formatSleepHours(value) {
  return `${value} ${value === 1 ? "hour" : "hours"}`;
}

function updateTargetDisplay() {
  const target = Number(targetSleepInput.value);
  appState.targetSleep = target;
  targetSleepValue.textContent = formatSleepHours(target);
}

function getWeekConfig() {
  const today = new Date();
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dates = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push({
      day: dayNames[date.getDay()],
      date: date.getDate(),
      dayKey: getDayKey(date),
      isToday: i === 0,
    });
  }

  return dates;
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60 + minutes) % (24 * 60);
}

function getMinuteDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 24 * 60 - diff);
}

function upsertCheckIn(dayKey, patch) {
  const existing = appState.checkIns.find((entry) => entry.dayKey === dayKey);
  if (existing) {
    Object.assign(existing, patch);
    return;
  }
  appState.checkIns.push({
    dayKey,
    bedtimeOnTime: null,
    wakeOnTime: null,
    ...patch,
  });
}

function getCheckInForDay(dayKey) {
  return appState.checkIns.find((entry) => entry.dayKey === dayKey) || null;
}

function getWeekResults() {
  const week = getWeekConfig();
  return week.map((item) => {
    const entry = getCheckInForDay(item.dayKey);
    const complete =
      Boolean(entry) && entry.bedtimeOnTime === true && entry.wakeOnTime === true;
    return { ...item, complete, entry };
  });
}

function computeStreakStats(days) {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (!days[i]) {
      break;
    }
    current += 1;
  }

  let longest = 0;
  let temp = 0;
  days.forEach((flag) => {
    if (flag) {
      temp += 1;
      longest = Math.max(longest, temp);
    } else {
      temp = 0;
    }
  });

  return { current, longest };
}

function renderTracker() {
  trackerGrid.innerHTML = "";
  const config = getWeekResults();

  config.forEach((item) => {
    const cell = document.createElement("div");
    cell.className = "tracker-cell";
    cell.innerHTML = `
      <span class="day">${item.day}</span>
      <span class="date">${item.date}</span>
    `;
    cell.classList.toggle("is-today", item.isToday);
    cell.classList.toggle("is-done", item.complete);
    cell.setAttribute(
      "aria-label",
      `${item.day} ${item.date}${item.isToday ? " (today)" : ""}`
    );

    trackerGrid.appendChild(cell);
  });
}

function updateStats() {
  const completeWeek = getWeekResults().map((item) => item.complete);
  const stats = computeStreakStats(completeWeek);
  const completedDays = completeWeek.filter(Boolean).length;
  const points = completedDays * 100;

  currentStreak.textContent = String(stats.current);
  longestStreak.textContent = String(stats.longest);
  totalPoints.textContent = String(points);
  streakMessage.textContent =
    completedDays > 0
      ? `Great work! You completed ${completedDays} sleep check${completedDays > 1 ? "s" : ""} this week.`
      : "Start your streak today!";

  const progressPct = Math.min(100, Math.round((points / 500) * 100));
  levelProgress.style.width = `${progressPct}%`;
}

function syncGoalsToHome() {
  bedtimeGoal.textContent = `Goal: ${appState.bedtime}`;
  wakeGoal.textContent = `Goal: ${appState.wakeTime}`;
}

function syncProfileToHome() {
  homeGreeting.textContent = `Hey, ${appState.name}!`;
}

function updateBottomNav(pageName) {
  const tabs = Array.from(document.querySelectorAll(".nav-item"));
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.goTo === pageName);
  });
}

function formatCheckInStatus(type) {
  const todayKey = getDayKey(new Date());
  const entry = getCheckInForDay(todayKey);
  const flag = entry ? entry[`${type}OnTime`] : null;

  if (flag === true) {
    return "Checked in on time";
  }
  if (flag === false) {
    return "Checked in outside ±30 min";
  }
  return "Not checked in yet";
}

function updateCheckInStatusUi() {
  bedtimeStatus.textContent = formatCheckInStatus("bedtime");
  wakeStatus.textContent = formatCheckInStatus("wake");
}

function handleTimedCheckIn(type) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const goalMinutes = parseTimeToMinutes(
    type === "bedtime" ? appState.bedtime : appState.wakeTime
  );
  const dayKey = getDayKey(now);
  const onTime = getMinuteDistance(nowMinutes, goalMinutes) <= 30;

  upsertCheckIn(dayKey, {
    [`${type}OnTime`]: onTime,
    [`${type}CheckedAt`]: now.toISOString(),
  });

  updateCheckInStatusUi();
  renderTracker();
  updateStats();
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
if (bedtimeCheckInButton) {
  bedtimeCheckInButton.addEventListener("click", () => handleTimedCheckIn("bedtime"));
}
if (wakeCheckInButton) {
  wakeCheckInButton.addEventListener("click", () => handleTimedCheckIn("wake"));
}

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const cleanName = nameInput.value.trim();
  appState.name = cleanName || "Sleeper";
  syncProfileToHome();
  showPage("goals");
});

goalsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appState.bedtime = bedtimeInput.value;
  appState.wakeTime = wakeTimeInput.value;
  appState.targetSleep = Number(targetSleepInput.value);
  syncGoalsToHome();
  showPage("home");
});

function initialize() {
  nameInput.value = appState.name;
  bedtimeInput.value = appState.bedtime;
  wakeTimeInput.value = appState.wakeTime;
  targetSleepInput.value = String(appState.targetSleep);
  syncProfileToHome();
  updateTargetDisplay();
  syncGoalsToHome();
  updateCheckInStatusUi();
  renderTracker();
  updateStats();
  updateBottomNav("home");
}

initialize();
