const { invoke } = window.__TAURI__.core;

let greetInputEl;
let greetMsgEl;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
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
else if (currentHour < 16) curTheme = 'afternoon';
else if (currentHour < 22) curTheme = 'evening';
else curTheme = 'night';

const stars = document.getElementById("stars");

function createStars() {
  console.log('createStars', stars)
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
      console.log(key, value);
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

const form = document.getElementById('form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const formProps = Object.fromEntries(formData);
  console.log(formProps);
});
