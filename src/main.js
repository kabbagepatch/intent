const { invoke } = window.__TAURI__.core;
const tauriPositioner = window.__TAURI__.positioner;

const { load } = window.__TAURI__.store;
const tauriStore = await load('store.json', { autoSave: false });

const tauriWindow = window.__TAURI__.window;
const currentWindow = tauriWindow.getCurrentWindow();

async function reposition() {
  const monitor = await tauriWindow.currentMonitor();
  if (monitor) {
    const workAreaSize = monitor.workArea.size;
    const windowSize = await currentWindow.outerSize();
    const x = workAreaSize.width - windowSize.width;
    const y = workAreaSize.height - windowSize.height;
    await currentWindow.setPosition(new tauriWindow.PhysicalPosition(x, y));
  }
}
reposition();

let greetInputEl;
let greetMsgEl;

async function greet() {
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

const themes = {
  'morning': {
    'color-background-1': 'hsl(193, 69%, 88%)',
    'color-background-2': 'hsl(27, 71%, 73%)',
    'color-background-3': 'hsl(48, 100%, 87%)',
    'color-text': 'hsl(0, 0%, 9%)',
    'color-button': 'hsl(48, 100%, 87%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
  'afternoon': {
    'color-background-1': 'hsl(193, 69%, 88%)',
    'color-background-2': 'hsl(193, 65%, 78%)',
    'color-background-3': 'hsl(198, 83%, 38%)',
    'color-text': 'hsl(0, 0%, 96%)',
    'color-button': 'hsl(193, 69%, 88%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
  'evening': {
    'color-background-1': 'hsl(27, 71%, 73%)',
    'color-background-2': 'hsl(339, 60%, 46%)',
    'color-background-3': 'hsl(246, 100%, 18%)',
    'color-text': 'hsl(0, 0%, 96%)',
    'color-button': 'hsl(246, 100%, 18%)',
    'color-button-text': 'hsl(0, 0%, 96%)',
  },
  'night': {
    'color-background-1': 'hsl(246, 100%, 2%)',
    'color-background-2': 'hsl(246, 100%, 10%)',
    'color-background-3': 'hsl(246, 100%, 18%)',
    'color-text': 'hsl(42, 24%, 89%)',
    'color-button': 'hsl(42, 24%, 89%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
}
let curTheme = 'afternoon';
const currentHour = new Date().getHours();
if (currentHour < 5) curTheme = 'night';
if (currentHour < 12) curTheme = 'morning';
else if (currentHour < 18) curTheme = 'afternoon';
else if (currentHour < 22) curTheme = 'evening';
else curTheme = 'night';

const stars = document.getElementById("stars");

function createStars() {
	for (let i = 0; i < 50; i++) {
		let x = Math.floor(Math.random() * 96 + 2);
		let y = Math.floor(Math.random() * 80 + 1);
		const starPoint = document.createElement("div");
		starPoint.style.left = `${x}%`;
		starPoint.style.top = `${y}%`;
		stars.appendChild(starPoint);
	}
}

const setTheme = (theme) => {
  if (!Object.keys(themes).includes(theme)) return;
  curTheme = theme;
  const vars = themes[theme];
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value);
    }
  });

  if (theme === 'night') {
    createStars();
  }

  const title = document.getElementById('greeting')
  if (title) {
    if (theme === 'night') {
      theme = 'evening';
    }
    title.textContent = `Good ${theme[0].toUpperCase()}${theme.slice(1).toLowerCase()}!`;
  }
}

setTheme(curTheme);

const setPresets = async(isWidget = false) => {
  const intent = await tauriStore.get('intent');
  const endTime = await tauriStore.get('endtime');
  const remainingTime = endTime - Date.now();
  
  const h = Math.max(Math.floor(remainingTime / 3600000), 0);
  const m = Math.max(Math.floor((remainingTime % 3600000) / 60000), 0);
  if (isWidget) {
    document.getElementById('widget-title').textContent = intent;
    document.getElementById('timer-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
  } else {
    if (remainingTime > 0) {
      document.getElementById('intent-input').value = intent;
      document.getElementById('hours-input').value = h;
      document.getElementById('minutes-input').value = m;
    }
  }
}

const form = document.getElementById('form');
if (form) {
  setPresets();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
    tauriStore.set('intent', formProps.intent);
    tauriStore.set('endtime', Date.now() + ((formProps.hours * 3600 + formProps.minutes * 60) * 1000));
    tauriStore.save();

    currentWindow.setDecorations(false);
    currentWindow.setSize(new tauriWindow.LogicalSize(300, 70));
    await currentWindow.setShadow(false);
    await reposition();
    window.location.replace("widget.html");
  });
}


const switchToForm = async () => {
  currentWindow.setDecorations(true);
  currentWindow.setSize(new tauriWindow.LogicalSize(400, 500));
  await currentWindow.setShadow(true);
  await reposition();
  window.location.replace("index.html");
}

const widgetContainer = document.getElementById('widget-container');
if (widgetContainer) {
  setPresets(true);
  widgetContainer.addEventListener('click', switchToForm);

  const progressCircle = document.getElementById('progress-circle');
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = 0;

  const endTime = await tauriStore.get('endtime');
  const totalRemainingTime = endTime - Date.now();
  let timeLeft = totalRemainingTime;
  if (timeLeft > 0) {
    const interval = setInterval(() => {
      timeLeft = endTime - Date.now();
      let h = Math.max(Math.floor(timeLeft / 3600000), 0);
      let m = Math.max(Math.floor((timeLeft % 3600000) / 60000), 0);
      let s = Math.max(Math.floor((timeLeft % 60000) / 1000), 0);
      const timeFraction = timeLeft / totalRemainingTime;
      const offset = circumference * (1 - timeFraction);
      progressCircle.style.strokeDashoffset = offset;
      document.getElementById('timer-hours').textContent = String(h).padStart(2, '0');
      document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
      if (h === 0 && m === 0 && s === 0) {
        clearInterval(interval);
        document.getElementById('timer-hours').textContent = '00';
        document.getElementById('timer-minutes').textContent = '00';
        progressCircle.style.strokeDashoffset = circumference
      }
    }, 1000);
  }
}
