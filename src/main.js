import './style.css';

document.querySelector('#app').innerHTML = `
  <!-- Background Camera Video -->
  <video id="camera-stream" autoplay muted playsinline></video>
  <div id="camera-overlay"></div>

  <div class="app-container">
    <main class="split-view">
      
      <!-- Left Side: Script Editor -->
      <section class="editor-section panel-glass">
        <header>
          <h1>Teleprompter</h1>
          <p>Escreva seu roteiro abaixo</p>
        </header>

        <textarea id="script-input" placeholder="Digite seu texto aqui..."></textarea>

        <!-- COLOR PICKERS -->
        <div class="color-picker-container">
          <label>Cor do texto:</label>

          <!-- HEX -->
          <input type="color" id="color-picker" value="#ffffff">
          <input type="text" id="color-hex" value="#ffffff" maxlength="7">

          <!-- RGB -->
          <div class="rgb-group">
            <label>R</label>
            <input type="range" id="rgb-r" min="0" max="255" value="255">
            <span id="rgb-r-val">255</span>

            <label>G</label>
            <input type="range" id="rgb-g" min="0" max="255" value="255">
            <span id="rgb-g-val">255</span>

            <label>B</label>
            <input type="range" id="rgb-b" min="0" max="255" value="255">
            <span id="rgb-b-val">255</span>
          </div>
        </div>

      </section>

      <!-- Right Side: Teleprompter Display -->
      <section class="prompter-section panel-glass">

        <button id="play-btn" class="btn primary">▶️ Play</button>

        <div class="prompter-container">
          <div class="focus-indicator left"></div>
          <div class="focus-indicator right"></div>
          
          <div class="prompter-content-wrapper" id="prompter-wrapper">
            <div id="prompter-text" class="scrolling-text"></div>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- Permission Modal -->
  <div id="permission-overlay" class="permission-overlay">
    <div class="permission-dialog panel-glass">
      <h2>Permissão Necessária</h2>
      <p>Para utilizar o teleprompter com gravação, precisamos de acesso à sua câmera e microfone.</p>
      <button id="grant-permission-btn" class="btn primary">Conceder Permissão</button>
    </div>
  </div>
`;


// =============================
//  ELEMENTOS
// =============================

const permissionOverlay = document.getElementById('permission-overlay');
const grantPermissionBtn = document.getElementById('grant-permission-btn');
const cameraStream = document.getElementById('camera-stream');

const scriptInput = document.getElementById('script-input');
const prompterText = document.getElementById('prompter-text');
const playBtn = document.getElementById('play-btn');


// =============================
//  TEMPO ESTIMADO
// =============================

const timeDisplay = document.createElement("p");
timeDisplay.id = "time-estimate";
timeDisplay.style.marginTop = "10px";
timeDisplay.style.fontSize = "14px";
timeDisplay.style.opacity = "0.8";
scriptInput.parentElement.appendChild(timeDisplay);

const WPM = 150;

function calcularTempoEstimado(texto) {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const totalPalavras = palavras.length;

  const minutos = totalPalavras / WPM;
  const segundosTotais = Math.round(minutos * 60);

  const min = Math.floor(segundosTotais / 60);
  const sec = segundosTotais % 60;

  return { totalPalavras, min, sec };
}

scriptInput.addEventListener('input', (e) => {
  const texto = e.target.value;

  prompterText.textContent = texto;

  const { totalPalavras, min, sec } = calcularTempoEstimado(texto);

  timeDisplay.textContent =
    `🕒 Estimativa: ${min} min ${sec}s — ${totalPalavras} palavras`;
});


// =============================
//  COLOR PICKER (HEX + RGB)
// =============================

const colorPicker = document.getElementById("color-picker");
const colorHex = document.getElementById("color-hex");

const rgbR = document.getElementById("rgb-r");
const rgbG = document.getElementById("rgb-g");
const rgbB = document.getElementById("rgb-b");

const rgbRVal = document.getElementById("rgb-r-val");
const rgbGVal = document.getElementById("rgb-g-val");
const rgbBVal = document.getElementById("rgb-b-val");

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function applyColor(r, g, b) {
  const hex = rgbToHex(r, g, b);

  prompterText.style.color = hex;

  colorHex.value = hex;
  colorPicker.value = hex;

  rgbR.value = r;
  rgbG.value = g;
  rgbB.value = b;

  rgbRVal.textContent = r;
  rgbGVal.textContent = g;
  rgbBVal.textContent = b;
}

colorPicker.addEventListener("input", (e) => {
  const hex = e.target.value;
  const { r, g, b } = hexToRgb(hex);
  applyColor(r, g, b);
});

colorHex.addEventListener("input", (e) => {
  let value = e.target.value.trim();
  if (!value.startsWith("#")) value = "#" + value;

  const hexRegex = /^#[0-9A-Fa-f]{6}$/;

  if (hexRegex.test(value)) {
    const { r, g, b } = hexToRgb(value);
    applyColor(r, g, b);
  }

  e.target.value = value;
});

[rgbR, rgbG, rgbB].forEach((slider) => {
  slider.addEventListener("input", () => {
    const r = parseInt(rgbR.value);
    const g = parseInt(rgbG.value);
    const b = parseInt(rgbB.value);

    applyColor(r, g, b);
  });
});


// =============================
//  SCROLL DO TELEPROMPTER
// =============================

let isScrolling = false;
let scrollPosition = 0;
const scrollSpeed = 1.5;

const animateScroll = () => {
  if (!isScrolling) return;

  scrollPosition -= scrollSpeed;

  const textHeight = prompterText.getBoundingClientRect().height;
  const containerHeight = prompterText.parentElement.getBoundingClientRect().height;

  if (-scrollPosition > textHeight + containerHeight) {
    scrollPosition = 0;
  }

  prompterText.style.transform = `translateY(${scrollPosition}px)`;
  requestAnimationFrame(animateScroll);
};

playBtn.addEventListener('click', () => {
  isScrolling = !isScrolling;

  if (isScrolling) {
    playBtn.textContent = "⏸️ Pause";
    animateScroll();
  } else {
    playBtn.textContent = "▶️ Play";
  }
});


// =============================
//  PERMISSÃO DA CÂMERA
// =============================

grantPermissionBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    cameraStream.srcObject = stream;
    cameraStream.style.opacity = '1';
    permissionOverlay.classList.add('hidden');

  } catch (err) {
    console.error('Erro ao acessar câmera/microfone', err);
    alert('Não foi possível acessar a câmera/microfone.');
  }
});
