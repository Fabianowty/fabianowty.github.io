const toBytes = utf8.toBytes;
const fromBytes = utf8.fromBytes;

const toHex = hex.toBytes;
const fromHex = hex.fromBytes;

const textarea = document.getElementById('text');

const mode = document.getElementById('mode');
const key = document.getElementById('key');
const iv = document.getElementById('vector');
const num = document.getElementById('number');

const radioBoxes = document.querySelector('.radioboxes');

const textZone = document.querySelector('.right');

function executeAction() {
  document.getElementById('error').textContent = 'Ошибок нет';

  const currentAction = [...radioBoxes.children].find((radio) => radio.checked)
    .id;
  const currentMode = mode.value;

  const currentInput = textarea.value;
  let currentNum = parseInt(num.value, 10);

  if(currentMode === 'CTR') {
    currentNum = new Counter(currentNum);
  }

  const currentKey = toBytes(key.value);
  const currentIV = toBytes(iv.value);

  const bytes = (currentAction === 'encrypt' ? toBytes : toHex)(currentInput);

  const md = new window[currentMode](currentKey, currentIV, currentNum);
  const e = md[currentAction](bytes);

  textZone.textContent = (currentAction === 'encrypt' ? fromHex : fromBytes)(e);
}

function handleMode() {
  const currentMode = mode.value;

  switch(currentMode) {
    case 'ECB': {
      hide(iv);
      hide(num);

      break;
    }

    case 'CBC': {
      show(iv);
      hide(num);

      break;

    }

    case 'CFB': {
      show(iv);
      show(num);

      break;

    }

    case 'OFB': {
      show(iv);
      hide(num);

      break;

    }

    case 'CTR': {
      hide(iv);
      show(num);

      break;

    }
  }
}

function hide(el) {
  el.style.display = 'none';
}

function show(el) {
  el.style.display = '';
}

textarea.addEventListener('input', executeAction);

mode.addEventListener('change', handleMode);
mode.addEventListener('change', executeAction);

key.addEventListener('input', executeAction);
iv.addEventListener('input', executeAction);
num.addEventListener('input', executeAction);

radioBoxes.addEventListener('change', () => {
  [textarea.value, textZone.textContent] = [
    textZone.textContent,
    textarea.value,
  ];
});
radioBoxes.addEventListener('change', executeAction);

window.addEventListener('error', function (err) {
  console.log(err);
  document.getElementById('error').textContent = err.error.message;
});

handleMode();
executeAction();