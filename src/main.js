import './style.css';

document.querySelector('#app').innerHTML = `
  <video id="camera-stream" autoplay muted playsinline></video>
  <div id="camera-overlay"></div>

  <div class="app-container">
    <main class="split-view">
      
      <section class="editor-section panel-glass">
        <header>
          <h1>Teleprompter</h1>
          <p>Escreva seu roteiro abaixo</p>
        </header>
        <textarea id="script-input" placeholder="Digite seu texto aqui..."></textarea>

        <p id="time-estimate" style="margin-top:10px; font-size:14px; opacity:0.8;"></p>

        <div id="color-control" style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          flex-wrap: wrap;
        ">
          <span style="font-size:13px; opacity:0.7; white-space:nowrap;">🎨 Cor do texto</span>

          <div id="swatch-wrap" style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="swatch" data-color="#ffffff" title="Branco"
              style="width:26px;height:26px;border-radius:50%;background:#ffffff;border:2px solid #fff;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.2);transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#f5f5dc" title="Creme"
              style="width:26px;height:26px;border-radius:50%;background:#f5f5dc;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#facc15" title="Amarelo"
              style="width:26px;height:26px;border-radius:50%;background:#facc15;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#4ade80" title="Verde"
              style="width:26px;height:26px;border-radius:50%;background:#4ade80;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#60a5fa" title="Azul"
              style="width:26px;height:26px;border-radius:50%;background:#60a5fa;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#f87171" title="Vermelho"
              style="width:26px;height:26px;border-radius:50%;background:#f87171;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
            <button class="swatch" data-color="#000000" title="Preto"
              style="width:26px;height:26px;border-radius:50%;background:#000000;border:2px solid transparent;cursor:pointer;transition:transform 0.15s;"></button>
          </div>

          <input type="color" id="custom-color" value="#ffffff" title="Cor personalizada"
            style="width:26px;height:26px;border:2px solid transparent;padding:0;border-radius:50%;cursor:pointer;background:none;" />
        </div>
      </section>

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
const timeDisplay = document.getElementById('time-estimate');
const customColorInput = document.getElementById('custom-color');
const swatches = document.querySelectorAll('.swatch');

// Cor inicial
prompterText.style.color = '#ffffff';


// =============================
//  ESTIMATIVA DE TEMPO
// =============================

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
  timeDisplay.textContent = `🕒 Estimativa: ${min} min ${sec}s — ${totalPalavras} palavras`;
});


// =============================
//  CONTROLE DE COR
// =============================

function setActiveColor(color, activeSwatchEl) {
  prompterText.style.color = color;
  customColorInput.value = color;
  swatches.forEach(s => s.style.borderColor = 'transparent');
  customColorInput.style.borderColor = 'transparent';
  if (activeSwatchEl) {
    activeSwatchEl.style.borderColor = '#fff';
  } else {
    customColorInput.style.borderColor = '#fff';
  }
}

swatches.forEach(btn => {
  btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.2)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  btn.addEventListener('click', () => setActiveColor(btn.dataset.color, btn));
});

customColorInput.addEventListener('input', (e) => setActiveColor(e.target.value, null));


// =============================
//  PERMISSÃO DA CÂMERA
// =============================

grantPermissionBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    cameraStream.srcObject = stream;
    cameraStream.style.opacity = '1';
    permissionOverlay.classList.add('hidden');
  } catch (err) {
    console.error('Erro ao acessar câmera/microfone', err);
    alert('Não foi possível acessar a câmera/microfone.');
  }
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
    playBtn.textContent = '⏸️ Pause';
    animateScroll();
  } else {
    playBtn.textContent = '▶️ Play';
  }
});
