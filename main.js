document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const permissionOverlay = document.getElementById('permission-overlay');
  const grantPermissionBtn = document.getElementById('grant-permission-btn');
  const cameraStream = document.getElementById('camera-stream');
  const playBtn = document.getElementById('play-btn'); 
  const replayBtn = document.getElementById('replay-btn'); 
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  const scriptInput = document.getElementById('script-input');
  const saveScriptBtn = document.getElementById('save-script-btn');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const prompterText = document.getElementById('prompter-text');
  const scrollContainer = document.getElementById('scroll-container');
  const prompterWrapper = document.getElementById('prompter-wrapper');
  const positionButtons = Array.from(document.querySelectorAll('.position-btn'));
  const prompterSection = prompterWrapper.closest('.prompter-section');
  const readingTimeDisplay = document.getElementById('reading-time-display');

  const modeSelect = document.getElementById('mode-select');
  const densityControl = document.getElementById('density-control');
  const densitySelect = document.getElementById('density-select');
  
  const slideAdvanceControl = document.getElementById('slide-advance-control');
  const slideAdvanceSelect = document.getElementById('slide-advance-select');
  const slideIntervalControl = document.getElementById('slide-interval-control');
  const slideIntervalSlider = document.getElementById('slide-interval-slider');
  const slideIntervalValue = document.getElementById('slide-interval-value');
  
  const scrollSpeedControl = document.getElementById('scroll-speed-control');
  const scrollSpeedSlider = document.getElementById('scroll-speed-slider');
  const scrollSpeedValue = document.getElementById('scroll-speed-value');

  const scrollControls = document.getElementById('scroll-controls');
  const slideNavControls = document.getElementById('slide-nav-controls');
  const slideContainer = document.getElementById('slide-container');
  const slideText = document.getElementById('slide-text');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const slideCounter = document.getElementById('slide-counter');

  // Constantes
  const SAVED_SCRIPT_STORAGE_KEY = 'teleprompter:script';
  const FONT_SIZE_STORAGE_KEY = 'teleprompter:font-size';
  const COLOR_STORAGE_KEY = 'teleprompter:text-color';
  const FONT_SIZE_MIN = 16;
  const FONT_SIZE_MAX = 120;
  const DEFAULT_FONT_SIZE = 56;
  const DEFAULT_TEXT_COLOR = '#ffffff';
  const READING_POSITION_CLASSES = { top: 'position-top', center: 'position-center', bottom: 'position-bottom' };
  const READING_POSITION_STORAGE_KEY = 'teleprompter:reading-position';
  const DEFAULT_READING_POSITION = 'center';

  const SCROLL_SPEED_LEVELS = [
    { label: 'Muito baixa', speed: 30 },
    { label: 'Baixa', speed: 60 },
    { label: 'Média', speed: 90 },
    { label: 'Alta', speed: 150 },
    { label: 'Muito alta', speed: 220 },
  ];

  // Clone para loop infinito — deve vir ANTES do controle de cor
  const prompterTextClone = prompterText.cloneNode(true);
  prompterTextClone.removeAttribute('id');
  prompterTextClone.setAttribute('aria-hidden', 'true');
  scrollContainer.appendChild(prompterTextClone);

  // =============================
  //  CONTROLE DE COR DO TEXTO
  // =============================
  const editorSection = document.querySelector('.editor-section');

  const colorControl = document.createElement('div');
  colorControl.id = 'color-control';
  colorControl.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    flex-wrap: wrap;
  `;
  colorControl.innerHTML = `
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
  `;

  // Insere o controle de cor antes de .editor-actions
  const editorActions = editorSection.querySelector('.editor-actions');
  editorSection.insertBefore(colorControl, editorActions);

  const swatches = document.querySelectorAll('.swatch');
  const customColorInput = document.getElementById('custom-color');

  const applyTextColor = (color) => {
    prompterText.style.color = color;
    prompterTextClone.style.color = color;
    slideText.style.color = color;
    window.localStorage.setItem(COLOR_STORAGE_KEY, color);
  };

  const setActiveColor = (color, activeSwatchEl) => {
    applyTextColor(color);
    customColorInput.value = color;
    swatches.forEach(s => s.style.borderColor = 'transparent');
    customColorInput.style.borderColor = 'transparent';
    if (activeSwatchEl) {
      activeSwatchEl.style.borderColor = '#fff';
    } else {
      customColorInput.style.borderColor = '#fff';
    }
  };

  swatches.forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.2)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('click', () => setActiveColor(btn.dataset.color, btn));
  });

  customColorInput.addEventListener('input', (e) => setActiveColor(e.target.value, null));

  // =============================

  const getScrollSpeedLevel = (value) => {
    const index = Number.parseInt(value, 10);
    if (Number.isNaN(index)) return SCROLL_SPEED_LEVELS[2];
    return SCROLL_SPEED_LEVELS[Math.min(SCROLL_SPEED_LEVELS.length - 1, Math.max(0, index))];
  };

  const applyScrollSpeedLevel = (value) => {
    const speedLevel = getScrollSpeedLevel(value);
    scrollSpeed = speedLevel.speed;
    scrollSpeedValue.textContent = speedLevel.label;
    scrollSpeedSlider.setAttribute('aria-valuetext', speedLevel.label);
  };

  // State - Rolagem
  let isScrolling = false; 
  let scrollOffset = 0;
  let animationFrameId = null;
  let lastFrameTime = null;
  let cycleDistance = 0;
  let needsMeasurement = true;
  let scrollSpeed = getScrollSpeedLevel(scrollSpeedSlider.value).speed;
  
  // State - Slides
  let currentMode = 'scroll'; 
  let slidesArray = [];
  let currentSlideIndex = 0;
  let slideIntervalTimer = null;
  let isSlidePlaying = false;

  // --- FUNÇÕES GERAIS ---
  const loadSavedScript = () => window.localStorage.getItem(SAVED_SCRIPT_STORAGE_KEY);

  const isFullscreenSupported = () => Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen && document.exitFullscreen);

  const updateFullscreenButton = () => {
    const isFullscreen = Boolean(document.fullscreenElement);
    fullscreenBtn.textContent = isFullscreen ? 'Sair da tela cheia' : 'Tela cheia';
    fullscreenBtn.setAttribute('aria-pressed', String(isFullscreen));
  };

  const toggleFullscreen = async () => {
    if (!isFullscreenSupported()) {
      alert('Seu navegador não oferece suporte ao modo de tela cheia.'); return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (err) { console.error('Erro ao alternar modo.', err); }
  };

  const updateReadingTime = (text) => {
    const wordsArray = text.trim().split(/\s+/).filter(word => word.length > 0);
    if (wordsArray.length === 0) { readingTimeDisplay.textContent = "00:00"; return; }
    const totalSeconds = Math.ceil((wordsArray.length / 150) * 60);
    readingTimeDisplay.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
  };

  // --- MUDANÇA DE MODO ---
  modeSelect.addEventListener('change', (e) => {
    currentMode = e.target.value;
    if (currentMode === 'slides') {
      densityControl.style.display = 'block';
      slideAdvanceControl.style.display = 'block';
      scrollSpeedControl.style.display = 'none';
      scrollControls.style.display = 'none';
      slideNavControls.style.display = 'flex';
      scrollContainer.style.display = 'none';
      slideContainer.style.display = 'flex';
      isScrolling = false;
      updateSlideAdvanceUI();
      processSlides(scriptInput.value);
    } else {
      densityControl.style.display = 'none';
      slideAdvanceControl.style.display = 'none';
      slideIntervalControl.style.display = 'none';
      scrollSpeedControl.style.display = 'flex';
      scrollControls.style.display = 'flex';
      playBtn.style.display = 'block';
      playBtn.textContent = 'Play';
      slideNavControls.style.display = 'none';
      scrollContainer.style.display = 'block';
      slideContainer.style.display = 'none';
      stopSlideAuto();
      isSlidePlaying = false;
      updatePrompterTextScroll(scriptInput.value);
    }
  });

  scrollSpeedSlider.addEventListener('input', (e) => applyScrollSpeedLevel(e.target.value));
  densitySelect.addEventListener('change', () => { if (currentMode === 'slides') processSlides(scriptInput.value); });

  // --- SLIDES ---
  const updateSlideAdvanceUI = () => {
    if (slideAdvanceSelect.value === 'auto') {
      slideIntervalControl.style.display = 'flex';
      playBtn.style.display = 'block';
      playBtn.textContent = isSlidePlaying ? 'Pause Slides' : 'Play Slides';
    } else {
      slideIntervalControl.style.display = 'none';
      playBtn.style.display = 'none';
      stopSlideAuto();
      isSlidePlaying = false;
    }
  };

  slideAdvanceSelect.addEventListener('change', updateSlideAdvanceUI);
  slideIntervalSlider.addEventListener('input', (e) => {
    slideIntervalValue.textContent = `${e.target.value}s`;
    if (isSlidePlaying) startSlideAuto();
  });

  const startSlideAuto = () => {
    if (slideIntervalTimer) clearInterval(slideIntervalTimer);
    const seconds = parseInt(slideIntervalSlider.value, 10);
    slideIntervalTimer = setInterval(() => {
      if (currentSlideIndex < slidesArray.length - 1) {
        currentSlideIndex++;
        renderCurrentSlide();
      } else {
        stopSlideAuto();
        isSlidePlaying = false;
        playBtn.textContent = 'Play Slides';
      }
    }, seconds * 1000);
  };

  const stopSlideAuto = () => {
    if (slideIntervalTimer) clearInterval(slideIntervalTimer);
    slideIntervalTimer = null;
  };

  const resetSlideAutoIfPlaying = () => { if (isSlidePlaying) startSlideAuto(); };

  const processSlides = (text) => {
    const maxChars = parseInt(densitySelect.value, 10);
    slidesArray = [];
    const paragraphs = text.split(/\n\s*\n/);
    paragraphs.forEach(paragraph => {
      let remainingText = paragraph.trim();
      if (!remainingText) return;
      while (remainingText.length > maxChars) {
        let chunk = remainingText.substring(0, maxChars);
        let splitIndex = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf(','), chunk.lastIndexOf('!'), chunk.lastIndexOf('?'));
        if (splitIndex === -1 || splitIndex < maxChars / 2) splitIndex = chunk.lastIndexOf(' ');
        if (splitIndex === -1) splitIndex = maxChars;
        slidesArray.push(remainingText.substring(0, splitIndex + 1).trim());
        remainingText = remainingText.substring(splitIndex + 1).trim();
      }
      if (remainingText.length > 0) slidesArray.push(remainingText);
    });
    if (slidesArray.length === 0) slidesArray.push("...");
    currentSlideIndex = 0;
    renderCurrentSlide();
  };

  const renderCurrentSlide = () => {
    slideText.textContent = slidesArray[currentSlideIndex];
    slideCounter.textContent = `${currentSlideIndex + 1} / ${slidesArray.length}`;
  };

  prevBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) { currentSlideIndex--; renderCurrentSlide(); resetSlideAutoIfPlaying(); }
  });
  nextBtn.addEventListener('click', () => {
    if (currentSlideIndex < slidesArray.length - 1) { currentSlideIndex++; renderCurrentSlide(); resetSlideAutoIfPlaying(); }
  });

  // --- ROLAGEM ---
  const updatePrompterTextScroll = (text) => {
    prompterText.textContent = text;
    prompterTextClone.textContent = text;
    needsMeasurement = true;
  };

  const measureScrollCycle = () => {
    cycleDistance = prompterText.getBoundingClientRect().height + prompterWrapper.getBoundingClientRect().height;
    needsMeasurement = false;
  };

  const renderPrompterPosition = () => {
    if (needsMeasurement) measureScrollCycle();
    const translateY = -scrollOffset;
    prompterText.style.transform = `translate3d(0, ${translateY}px, 0)`;
    prompterTextClone.style.transform = `translate3d(0, ${translateY + cycleDistance}px, 0)`;
  };

  const animateScroll = (timestamp) => {
    if (isScrolling && currentMode === 'scroll') {
      if (lastFrameTime === null) lastFrameTime = timestamp;
      const elapsedSeconds = (timestamp - lastFrameTime) / 1000;
      lastFrameTime = timestamp;
      if (cycleDistance > 0) scrollOffset = (scrollOffset + scrollSpeed * elapsedSeconds) % cycleDistance;
      renderPrompterPosition();
    } else {
      lastFrameTime = null;
    }
    animationFrameId = requestAnimationFrame(animateScroll);
  };

  // --- CONTROLES ---
  playBtn.addEventListener('click', () => {
    if (currentMode === 'slides' && slideAdvanceSelect.value === 'auto') {
      isSlidePlaying = !isSlidePlaying;
      playBtn.textContent = isSlidePlaying ? 'Pause Slides' : 'Play Slides';
      if (isSlidePlaying) {
        if (currentSlideIndex >= slidesArray.length - 1) { currentSlideIndex = 0; renderCurrentSlide(); }
        startSlideAuto();
      } else {
        stopSlideAuto();
      }
    } else {
      isScrolling = !isScrolling;
      playBtn.textContent = isScrolling ? 'Pause' : 'Play';
      if (isScrolling) lastFrameTime = performance.now();
    }
  });

  replayBtn.addEventListener('click', () => {
    scrollOffset = 0;
    renderPrompterPosition();
    isScrolling = true;
    playBtn.textContent = 'Pause';
    lastFrameTime = performance.now();
  });

  document.addEventListener('keydown', (e) => {
    if (document.activeElement === scriptInput) return;
    if (currentMode === 'slides') {
      if (e.key === ' ') {
        e.preventDefault();
        if (slideAdvanceSelect.value === 'auto') {
          isSlidePlaying = !isSlidePlaying;
          playBtn.textContent = isSlidePlaying ? 'Pause Slides' : 'Play Slides';
          if (isSlidePlaying) {
            if (currentSlideIndex >= slidesArray.length - 1) { currentSlideIndex = 0; renderCurrentSlide(); }
            startSlideAuto();
          } else stopSlideAuto();
        } else {
          if (currentSlideIndex < slidesArray.length - 1) { currentSlideIndex++; renderCurrentSlide(); }
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSlideIndex < slidesArray.length - 1) { currentSlideIndex++; renderCurrentSlide(); resetSlideAutoIfPlaying(); }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSlideIndex > 0) { currentSlideIndex--; renderCurrentSlide(); resetSlideAutoIfPlaying(); }
      }
    } else if (currentMode === 'scroll' && e.key === ' ') {
      e.preventDefault();
      isScrolling = !isScrolling;
      playBtn.textContent = isScrolling ? 'Pause' : 'Play';
      if (isScrolling) lastFrameTime = performance.now();
    }
  });

  // --- SALVAR ---
  saveScriptBtn.addEventListener('click', () => {
    const scriptText = scriptInput.value;
    window.localStorage.setItem(SAVED_SCRIPT_STORAGE_KEY, scriptText);
    if (currentMode === 'scroll') {
      scrollOffset = 0;
      updatePrompterTextScroll(scriptText);
      renderPrompterPosition();
    } else {
      processSlides(scriptText);
      if (isSlidePlaying) startSlideAuto();
    }
  });

  scriptInput.addEventListener('input', (event) => updateReadingTime(event.target.value));

  // --- FONTE ---
  const clampFontSize = (value) => {
    const fontSize = Number.parseInt(value, 10);
    if (Number.isNaN(fontSize)) return DEFAULT_FONT_SIZE;
    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, fontSize));
  };

  const applyFontSize = (value, shouldPreserveScroll = false) => {
    if (needsMeasurement) measureScrollCycle();
    const previousCycleDistance = cycleDistance;
    const scrollProgress = previousCycleDistance > 0 ? scrollOffset / previousCycleDistance : 0;
    const fontSize = clampFontSize(value);
    prompterText.style.fontSize = `${fontSize}px`;
    prompterTextClone.style.fontSize = `${fontSize}px`;
    slideText.style.fontSize = `${fontSize}px`;
    fontSizeSlider.value = String(fontSize);
    fontSizeValue.textContent = `${fontSize}px`;
    needsMeasurement = true;
    if (shouldPreserveScroll && currentMode === 'scroll') {
      measureScrollCycle();
      scrollOffset = cycleDistance > 0 ? scrollProgress * cycleDistance : 0;
      renderPrompterPosition();
    }
    return fontSize;
  };

  fontSizeSlider.addEventListener('input', (event) => {
    const fontSize = applyFontSize(event.target.value, true);
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
  });

  // --- POSIÇÃO ---
  const applyReadingPosition = (positionKey) => {
    const key = READING_POSITION_CLASSES[positionKey] ? positionKey : DEFAULT_READING_POSITION;
    positionButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.position === key);
      btn.setAttribute('aria-pressed', String(btn.dataset.position === key));
    });
    prompterSection.classList.remove(...Object.values(READING_POSITION_CLASSES));
    prompterSection.classList.add(READING_POSITION_CLASSES[key]);
    needsMeasurement = true;
    if (currentMode === 'scroll') renderPrompterPosition();
    return key;
  };

  positionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = applyReadingPosition(btn.dataset.position);
      window.localStorage.setItem(READING_POSITION_STORAGE_KEY, key);
    });
  });

  // --- CÂMERA ---
  grantPermissionBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraStream.srcObject = stream;
      cameraStream.style.opacity = '1';
      permissionOverlay.style.display = 'none';
    } catch (err) { alert('Verifique as permissões da câmara.'); }
  });

  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);

  // --- INICIALIZAÇÃO ---
  const savedScript = loadSavedScript() || scriptInput.value;
  scriptInput.value = savedScript;

  if (currentMode === 'scroll') updatePrompterTextScroll(savedScript);
  else processSlides(savedScript);

  applyFontSize(clampFontSize(window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)));
  applyScrollSpeedLevel(scrollSpeedSlider.value);
  applyReadingPosition(window.localStorage.getItem(READING_POSITION_STORAGE_KEY) || DEFAULT_READING_POSITION);
  updateReadingTime(savedScript);
  updateFullscreenButton();

  // Aplica cor salva
  const savedColor = window.localStorage.getItem(COLOR_STORAGE_KEY) || DEFAULT_TEXT_COLOR;
  const savedSwatch = document.querySelector(`.swatch[data-color="${savedColor}"]`);
  setActiveColor(savedColor, savedSwatch || null);

  animationFrameId = requestAnimationFrame(animateScroll);
});
