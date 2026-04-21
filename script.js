const appState = {
  bedtime: "22:00",
  wakeTime: "07:00",
  targetSleep: 9,
  streakDays: [false, false, false, false, false, false, false],
};

const pages = Array.from(document.querySelectorAll("[data-page]"));
const navButtons = Array.from(document.querySelectorAll("[data-go-to]"));
const goalsForm = document.querySelector("#goalsForm");
const bedtimeInput = document.querySelector("#bedtimeInput");
const wakeTimeInput = document.querySelector("#wakeTimeInput");
const targetSleepInput = document.querySelector("#targetSleepInput");
const targetSleepValue = document.querySelector("#targetSleepValue");

const bedtimeGoal = document.querySelector("#bedtimeGoal");
const wakeGoal = document.querySelector("#wakeGoal");
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
      isToday: i === 0,
    });
  }

  return dates;
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
  const config = getWeekConfig();

  config.forEach((item, index) => {
    const cell = document.createElement("button");
    cell.className = "tracker-cell";
    cell.type = "button";
    cell.innerHTML = `
      <span class="day">${item.day}</span>
      <span class="date">${item.date}</span>
    `;
    cell.disabled = item.isToday;
    cell.classList.toggle("is-today", item.isToday);
    cell.classList.toggle("is-done", appState.streakDays[index]);
    cell.setAttribute(
      "aria-label",
      `${item.day} ${item.date}${item.isToday ? " (today)" : ""}`
    );

    if (!item.isToday) {
      cell.addEventListener("click", () => {
        appState.streakDays[index] = !appState.streakDays[index];
        renderTracker();
        updateStats();
      });
    }

    trackerGrid.appendChild(cell);
  });
}

function updateStats() {
  const stats = computeStreakStats(appState.streakDays);
  const completedDays = appState.streakDays.filter(Boolean).length;
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

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetPage = button.dataset.goTo;
    if (targetPage) {
      showPage(targetPage);
    }
  });
});

targetSleepInput.addEventListener("input", updateTargetDisplay);

goalsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  appState.bedtime = bedtimeInput.value;
  appState.wakeTime = wakeTimeInput.value;
  appState.targetSleep = Number(targetSleepInput.value);
  syncGoalsToHome();
  showPage("home");
});

function initialize() {
  bedtimeInput.value = appState.bedtime;
  wakeTimeInput.value = appState.wakeTime;
  targetSleepInput.value = String(appState.targetSleep);
  updateTargetDisplay();
  syncGoalsToHome();
  renderTracker();
  updateStats();
}

initialize();
