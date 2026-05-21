// Removido o import de CSS que quebra o navegador nativo

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const permissionOverlay = document.getElementById('permission-overlay');
  const grantPermissionBtn = document.getElementById('grant-permission-btn');
  const cameraStream = document.getElementById('camera-stream');
  const playBtn = document.getElementById('play-btn'); // Selecionando o botão de play
  const replayBtn = document.getElementById('replay-btn'); // Botão de replay (rolagem mais lenta)
  
  const scriptInput = document.getElementById('script-input');
  const saveScriptBtn = document.getElementById('save-script-btn');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const prompterText = document.getElementById('prompter-text');
  const prompterWrapper = document.getElementById('prompter-wrapper');
  
  // Clone para efeito de loop infinito
  const prompterTextClone = prompterText.cloneNode(true);
  prompterTextClone.removeAttribute('id');
  prompterTextClone.setAttribute('aria-hidden', 'true');
  prompterWrapper.appendChild(prompterTextClone);
  const readingTimeDisplay = document.getElementById('reading-time-display');
  
  // State - Começa pausado para você poder clicar no Play
  let isScrolling = false; 
  let scrollOffset = 0;
  let animationFrameId = null;
  let lastFrameTime = null;
  let cycleDistance = 0;
  let needsMeasurement = true;
  
  const SCROLL_SPEED_PX_PER_SECOND = 90;
  const REPLAY_SPEED_FACTOR = 0.7; // Replay roda a 70% da velocidade atual
  let scrollSpeed = SCROLL_SPEED_PX_PER_SECOND; // Velocidade atual (mutável)
  const SAVED_SCRIPT_STORAGE_KEY = 'teleprompter:script';
  const FONT_SIZE_STORAGE_KEY = 'teleprompter:font-size';
  const FONT_SIZE_MIN = 16;
  const FONT_SIZE_MAX = 120;
  const DEFAULT_FONT_SIZE = 56;

  // Função para calcular e atualizar o tempo de leitura na tela
  const updateReadingTime = (text) => {
    const WORDS_PER_MINUTE = 150; 
    
    const wordsArray = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = wordsArray.length;
    
    if (wordCount === 0) {
      readingTimeDisplay.textContent = "00:00";
      return;
    }

    const totalSeconds = Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    readingTimeDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  };
  
  // 1. Camera & Mic Permission
  grantPermissionBtn.addEventListener('click', async () => {
    console.log("Botão de permissão clicado!"); // Para você ver no console (F12)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      cameraStream.srcObject = stream;
      cameraStream.style.opacity = '1';
      
      // Esconde o modal de permissão
      permissionOverlay.style.display = 'none';
      
    } catch (err) {
      console.error('Erro ao acessar dispositivos.', err);
      alert('Certifique-se de estar usando HTTPS ou Localhost e que a câmera não está em uso por outro App.');
    }
  });

  // Alternar Play/Pause
  playBtn.addEventListener('click', () => {
    isScrolling = !isScrolling;
    playBtn.textContent = isScrolling ? '⏸️ Pause' : '▶️ Play';
    if (isScrolling) {
      lastFrameTime = performance.now(); // Reseta o tempo para não dar um "salto"
    }
  });

  // Replay: reinicia a rolagem do começo a 70% da velocidade atual
  replayBtn.addEventListener('click', () => {
    scrollSpeed = SCROLL_SPEED_PX_PER_SECOND * REPLAY_SPEED_FACTOR;
    scrollOffset = 0; // Volta o texto para o início
    renderPrompterPosition();

    isScrolling = true;
    playBtn.textContent = '⏸️ Pause';
    lastFrameTime = performance.now(); // Evita salto ao retomar a animação
  });

  // 2. Lógica de Salvar
  const loadSavedScript = () => {
    return window.localStorage.getItem(SAVED_SCRIPT_STORAGE_KEY);
  };

  const clampFontSize = (value) => {
    const fontSize = Number.parseInt(value, 10);

    if (Number.isNaN(fontSize)) {
      return DEFAULT_FONT_SIZE;
    }

    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, fontSize));
  };

  const loadSavedFontSize = () => {
    return clampFontSize(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY));
  };

  saveScriptBtn.addEventListener('click', () => {
    const scriptText = scriptInput.value;
    window.localStorage.setItem(SAVED_SCRIPT_STORAGE_KEY, scriptText);
    scrollOffset = 0; // Reseta o scroll ao salvar novo texto
    updatePrompterText(scriptText);
    renderPrompterPosition();
  });

  const updatePrompterText = (text) => {
    prompterText.textContent = text;
    prompterTextClone.textContent = text;
    needsMeasurement = true;
  };

  const measureScrollCycle = () => {
    const textHeight = prompterText.getBoundingClientRect().height;
    const wrapperHeight = prompterWrapper.getBoundingClientRect().height;
    cycleDistance = textHeight + wrapperHeight;
    needsMeasurement = false;
  };

  const renderPrompterPosition = () => {
    if (needsMeasurement) measureScrollCycle();
    const translateY = -scrollOffset;
    prompterText.style.transform = `translate3d(0, ${translateY}px, 0)`;
    prompterTextClone.style.transform = `translate3d(0, ${translateY + cycleDistance}px, 0)`;
  };

  const applyFontSize = (value, shouldPreserveScroll = false) => {
    if (needsMeasurement) measureScrollCycle();

    const previousCycleDistance = cycleDistance;
    const scrollProgress = previousCycleDistance > 0 ? scrollOffset / previousCycleDistance : 0;
    const fontSize = clampFontSize(value);

    prompterText.style.fontSize = `${fontSize}px`;
    prompterTextClone.style.fontSize = `${fontSize}px`;
    fontSizeSlider.value = String(fontSize);
    fontSizeValue.textContent = `${fontSize}px`;

    needsMeasurement = true;

    if (shouldPreserveScroll) {
      measureScrollCycle();
      scrollOffset = cycleDistance > 0 ? scrollProgress * cycleDistance : 0;
    }

    renderPrompterPosition();
    return fontSize;
  };

  fontSizeSlider.addEventListener('input', (event) => {
    const fontSize = applyFontSize(event.target.value, true);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  });

  const animateScroll = (timestamp) => {
    if (isScrolling) {
      if (lastFrameTime === null) lastFrameTime = timestamp;
      const elapsedSeconds = (timestamp - lastFrameTime) / 1000;
      lastFrameTime = timestamp;

      if (cycleDistance > 0) {
        scrollOffset = (scrollOffset + scrollSpeed * elapsedSeconds) % cycleDistance;
      }
      renderPrompterPosition();
    } else {
      lastFrameTime = null; // Garante que a conta recomeça do zero ao despausar
    }
    animationFrameId = requestAnimationFrame(animateScroll);
  };

  scriptInput.addEventListener('input', (event) => {
    updateReadingTime(event.target.value);
  });

  // Inicialização
  const savedScript = loadSavedScript() || scriptInput.value;
  const savedFontSize = loadSavedFontSize();
  scriptInput.value = savedScript;
  updatePrompterText(savedScript);
  applyFontSize(savedFontSize);
  animationFrameId = requestAnimationFrame(animateScroll);
  updateReadingTime(savedScript);  
});
