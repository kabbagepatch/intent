const { invoke } = window.__TAURI__.core;
const tauriPositioner = window.__TAURI__.positioner;

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

const tauriNotification = window.__TAURI__.notification;
let notifPermissionGranted = false;
async function requestNotifications() {
  notifPermissionGranted = await tauriNotification.isPermissionGranted();
  if (!notifPermissionGranted) {
    const permission = await tauriNotification.requestPermission();
    notifPermissionGranted = permission === 'granted';
  }
}

const { load } = window.__TAURI__.store;
const tauriStore = await load('store.json', { autoSave: false });
const storeMap = {};
const populateStoreMap = async () => {
  const storeEntries = (await tauriStore.entries());
  storeEntries.forEach(entry => { storeMap[entry[0]] = entry[1] });
  ['widget', 'audio', 'notif', 'autostart'].forEach(s => {
    if (!storeMap[`${s}_setting`]) {
      storeMap[`${s}_setting`] = 'enable';
      tauriStore.set(`${s}_setting`, 'enable');
    }
  });
  if (!storeMap.snooze_duration) {
    storeMap['snooze_duration'] = 5;
    tauriStore.set('snooze_duration', 5);
  }
  tauriStore.save();
}

const tauriAutostart = window.__TAURI__.autostart;
async function toggleAutostart(enable) {
  if (enable && !await tauriAutostart.isEnabled()) {
    await tauriAutostart.enable();
  }
  if (!enable && await tauriAutostart.isEnabled()) {
    await tauriAutostart.disable();
  }
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

let curTheme = '';

const setTheme = () => {
  let theme = 'afternoon';
  const currentHour = new Date().getHours();
  if (currentHour < 5) theme = 'night';
  else if (currentHour < 12) theme = 'morning';
  else if (currentHour < 18) theme = 'afternoon';
  else if (currentHour < 21) theme = 'evening';
  else theme = 'night';

  if (!Object.keys(themes).includes(theme)) return;
  if (curTheme === theme) return;

  curTheme = theme;
  const vars = themes[theme];
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value);
    }
  });

  if (theme === 'night' && stars) {
    createStars();
  }

  const settingsSvg = document.getElementById('settings-icon');
  const backSvg = document.getElementById('back-icon');
  const snoozeSvg = document.getElementById('snooze-icon');
  const aboutSvg = document.getElementById('about-icon');
  [settingsSvg, backSvg, snoozeSvg, aboutSvg].forEach((icon) => {
    if (icon) {
      icon.style.fill = vars['color-text'];
    }
  })

  const title = document.getElementById('greeting')
  if (title) {
    if (theme === 'night') {
      theme = 'evening';
    }
    title.textContent = `Good ${theme[0].toUpperCase()}${theme.slice(1).toLowerCase()}!`;
  }
}

setTheme();
await populateStoreMap();
toggleAutostart(storeMap['autostart_setting'] === 'enable');
requestNotifications();

const setPresets = async(isWidget = false) => {
  const intent = storeMap.intent;
  const endTime = storeMap.endtime;
  const remainingTime = endTime - Date.now();
  
  const h = Math.max(Math.floor(remainingTime / 3600000), 0);
  const m = Math.max(Math.floor((remainingTime % 3600000) / 60000), 0);
  if (isWidget) {
    document.getElementById('widget-title').textContent = intent;
    document.getElementById('timer-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
  } else {
    if (remainingTime > 0) {
      if (intent) document.getElementById('intent-input').value = intent;
      document.getElementById('hours-input').value = h;
      document.getElementById('minutes-input').value = m;
    }
  }
}

const switchMode = async (mode='FORM', x=400, y=500) => {
  if (mode === 'FORM') {
    currentWindow.setDecorations(true);
    currentWindow.setSize(new tauriWindow.LogicalSize(x, y));
    await currentWindow.setShadow(true);
  } else {
    currentWindow.setDecorations(false);
    currentWindow.setSize(new tauriWindow.LogicalSize(x, y));
    await currentWindow.setShadow(false);
  }

  await reposition();
}

const form = document.getElementById('form');
if (form) {
  setPresets();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
    tauriStore.set('intent', formProps.intent);
    const timeAdded = ((formProps.hours * 3600 + formProps.minutes * 60) * 1000);
    tauriStore.set('endtime', Date.now() + timeAdded);
    tauriStore.save();

    await switchMode('WIDGET', 300, 70);
    window.location.replace("widget.html");
  });
}


const switchToForm = async () => {
  await switchMode('FORM');
  window.location.replace("index.html");
}

const startTimer = async (endTime) => {
  const audioEnabled = storeMap['audio_setting'] === 'enable';
  const notifEnabled = storeMap['notif_setting'] === 'enable';
  const progressCircle = document.getElementById('progress-circle');
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = 0;

  const totalRemainingTime = endTime - Date.now();
  let timeLeft = totalRemainingTime;
  if (timeLeft <= 0) return;

  const interval = setInterval(async () => {
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
      if (audioEnabled) await new Audio('./assets/chime.mp3').play();
      if (notifEnabled) tauriNotification.sendNotification({
        title: 'Intent',
        body: 'Time\'s up! Nicely done. Take a break, look for things you might\'ve been ignoring. Snooze if more time needed'
      })
      progressCircle.style.strokeDashoffset = circumference;
      document.getElementById('snooze-button').style.display = 'block';
      document.getElementById('timer-text').style.display = 'none';
    }
  }, 1000);
}

const snooze = () => {
  const snoozeTime = storeMap['snooze_duration'];
  document.getElementById('snooze-button').style.display = 'none';
  document.getElementById('timer-text').style.display = 'block';
  document.getElementById('timer-hours').textContent = String(0).padStart(2, '0');
  document.getElementById('timer-minutes').textContent = String(snoozeTime).padStart(2, '0');
  startTimer(Date.now() + (snoozeTime * 60 * 1000));
}

const widgetContainer = document.getElementsByClassName('widget-container');
if (widgetContainer.length) {
  setPresets(true);
  document.getElementById('snooze-button').addEventListener('click', snooze);

  const endTime = await tauriStore.get('endtime');
  startTimer(endTime);
}

const backButton = document.getElementById('back-button');
if (backButton) {
  backButton.addEventListener('click', switchToForm);
}

const aboutButton = document.getElementById('about-button');
if (aboutButton) {
  aboutButton.addEventListener('click', () => {
    window.location.replace("about.html");
  });
}

const settingsButton = document.getElementById('settings-button');
if (settingsButton) {
  settingsButton.addEventListener('click', () => {
    window.location.replace("settings.html");
  });
}

const setInitialSettings = async () => {
  document.getElementById('widget_enable').checked = true;
  document.getElementById('autostart_disable').checked = true;
  document.getElementById('audio_disable').checked = true;

  Object.keys(storeMap).forEach(key => {
    const value = storeMap[key];

    if (!key.includes('setting')) return;
    key = key.split('_')[0];
    console.log(key, value);
    document.getElementById(`${key}_enable`).checked = value === 'enable';
    document.getElementById(`${key}_disable`).checked = value !== 'enable';
  })
}

const settings = document.getElementById('settings');
if (settings) {
  setInitialSettings();

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', async (event) => {
      console.log(`${event.target.name}: ${event.target.value}`);
      const settingKey = `${event.target.name}_setting`;
      const settingValue = event.target.value;
      tauriStore.set(settingKey, settingValue);
      tauriStore.save();

      if (event.target.name === 'autostart') toggleAutostart(settingValue === 'enable');
    });
  });

  const snoozeInput = document.getElementById('snooze-time');
  snoozeInput.value = storeMap['snooze_duration'];
  snoozeInput.addEventListener('input', async (event) => {
    const snoozeValue = parseInt(event.target.value, 10);
    storeMap['snooze_duration'] = snoozeValue;
    tauriStore.set('snooze_duration', snoozeValue);
    tauriStore.save();
  })
}
