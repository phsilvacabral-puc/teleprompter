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
      </section>

      <!-- Right Side: Teleprompter Display -->
      <section class="prompter-section panel-glass">

        <!-- Botão Play/Pause -->
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
//  LÓGICA DO TELEPROMPTER
// =============================

// Elements
const permissionOverlay = document.getElementById('permission-overlay');
const grantPermissionBtn = document.getElementById('grant-permission-btn');
const cameraStream = document.getElementById('camera-stream');

const scriptInput = document.getElementById('script-input');


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



const prompterText = document.getElementById('prompter-text');
const playBtn = document.getElementById('play-btn');

// State
let isScrolling = false; // começa pausado
let scrollPosition = 0;
const scrollSpeed = 1.5;


// 1. Permissão da câmera/microfone
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
scriptInput.addEventListener('input', (e) => {
  const texto = e.target.value;

  // Atualiza o teleprompter
  prompterText.textContent = texto;

  // Calcula tempo estimado
  const { totalPalavras, min, sec } = calcularTempoEstimado(texto);

  timeDisplay.textContent =
    `🕒 Estimativa: ${min} min ${sec}s — ${totalPalavras} palavras`;
});



// 3. Função de rolagem
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


// 4. Botão Play/Pause
playBtn.addEventListener('click', () => {
  isScrolling = !isScrolling;

  if (isScrolling) {
    playBtn.textContent = "⏸️ Pause";
    animateScroll();
  } else {
    playBtn.textContent = "▶️ Play";
  }
});
