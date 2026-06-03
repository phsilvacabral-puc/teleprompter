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

  // Elementos do Modo Slide
  const modeSelect = document.getElementById('mode-select');
  const densityControl = document.getElementById('density-control');
  const densitySelect = document.getElementById('density-select');
  
  // Elementos de Avanço Automático e Velocidade
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
  
  // Clone para efeito de loop infinito (Rolagem)
  const prompterTextClone = prompterText.cloneNode(true);
  prompterTextClone.removeAttribute('id');
  prompterTextClone.setAttribute('aria-hidden', 'true');
  scrollContainer.appendChild(prompterTextClone);
  
  // State - Rolagem
  let isScrolling = false; 
  let scrollOffset = 0;
  let animationFrameId = null;
  let lastFrameTime = null;
  let cycleDistance = 0;
  let needsMeasurement = true;
  let scrollSpeed = parseInt(scrollSpeedSlider.value, 10); // Inicializa com o valor do input
  
  // State - Slides
  let currentMode = 'scroll'; 
  let slidesArray = [];
  let currentSlideIndex = 0;
  let slideIntervalTimer = null;
  let isSlidePlaying = false;

  // Constantes
  const SAVED_SCRIPT_STORAGE_KEY = 'teleprompter:script';
  const FONT_SIZE_STORAGE_KEY = 'teleprompter:font-size';
  const FONT_SIZE_MIN = 16;
  const FONT_SIZE_MAX = 120;
  const DEFAULT_FONT_SIZE = 56;
  const READING_POSITION_CLASSES = { top: 'position-top', center: 'position-center', bottom: 'position-bottom' };
  const READING_POSITION_STORAGE_KEY = 'teleprompter:reading-position';
  const DEFAULT_READING_POSITION = 'center';

  // --- FUNÇÕES GERAIS ---
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

  // --- MUDANÇA DE MODO (SCROLL VS SLIDES) ---
  modeSelect.addEventListener('change', (e) => {
    currentMode = e.target.value;
    
    if (currentMode === 'slides') {
      densityControl.style.display = 'block';
      slideAdvanceControl.style.display = 'block';
      scrollSpeedControl.style.display = 'none'; // Esconde velocidade de rolagem
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
      scrollSpeedControl.style.display = 'flex'; // Mostra velocidade de rolagem
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

  // --- VELOCIDADE DA ROLAGEM ---
  scrollSpeedSlider.addEventListener('input', (e) => {
    scrollSpeed = parseInt(e.target.value, 10);
    scrollSpeedValue.textContent = scrollSpeed;
  });

  densitySelect.addEventListener('change', () => {
    if (currentMode === 'slides') processSlides(scriptInput.value);
  });

  // --- LÓGICA DE AVANÇO AUTOMÁTICO DE SLIDES ---
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

  const resetSlideAutoIfPlaying = () => {
    if (isSlidePlaying) startSlideAuto(); 
  };

  // --- LÓGICA DE PROCESSAMENTO DE SLIDES ---
  const processSlides = (text) => {
    const maxChars = parseInt(densitySelect.value, 10);
    slidesArray = [];
    
    const paragraphs = text.split(/\n\s*\n/); 
    paragraphs.forEach(paragraph => {
        let remainingText = paragraph.trim();
        if(!remainingText) return;

        while (remainingText.length > maxChars) {
            let chunk = remainingText.substring(0, maxChars);
            let splitIndex = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf(','), chunk.lastIndexOf('!'), chunk.lastIndexOf('?'));
            
            if (splitIndex === -1 || splitIndex < maxChars / 2) splitIndex = chunk.lastIndexOf(' ');
            if (splitIndex === -1) splitIndex = maxChars;

            let slideContent = remainingText.substring(0, splitIndex + 1).trim();
            slidesArray.push(slideContent);
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
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      renderCurrentSlide();
      resetSlideAutoIfPlaying();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentSlideIndex < slidesArray.length - 1) {
      currentSlideIndex++;
      renderCurrentSlide();
      resetSlideAutoIfPlaying();
    }
  });

  // --- LÓGICA DE ROLAGEM (SCROLL) ---
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

  // --- CONTROLES UNIFICADOS (BOTOES E TECLADO) ---
  playBtn.addEventListener('click', () => {
    if (currentMode === 'slides' && slideAdvanceSelect.value === 'auto') {
      isSlidePlaying = !isSlidePlaying;
      playBtn.textContent = isSlidePlaying ? 'Pause Slides' : 'Play Slides';
      if (isSlidePlaying) {
        if (currentSlideIndex >= slidesArray.length - 1) {
          currentSlideIndex = 0; 
          renderCurrentSlide();
        }
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
          if (currentSlideIndex < slidesArray.length - 1) {
            currentSlideIndex++;
            renderCurrentSlide();
          }
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentSlideIndex < slidesArray.length - 1) {
          currentSlideIndex++;
          renderCurrentSlide();
          resetSlideAutoIfPlaying();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentSlideIndex > 0) {
          currentSlideIndex--;
          renderCurrentSlide();
          resetSlideAutoIfPlaying();
        }
      }
    } else if (currentMode === 'scroll' && e.key === ' ') {
      e.preventDefault();
      isScrolling = !isScrolling;
      playBtn.textContent = isScrolling ? 'Pause' : 'Play';
      if (isScrolling) lastFrameTime = performance.now();
    }
  });

  // --- SALVAMENTO E FONTES ---
  const loadSavedScript = () => window.localStorage.getItem(SAVED_SCRIPT_STORAGE_KEY);
  
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

  // --- PERMISSÃO DE CÂMERA ---
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
  applyReadingPosition(window.localStorage.getItem(READING_POSITION_STORAGE_KEY) || DEFAULT_READING_POSITION);
  updateReadingTime(savedScript);
  updateFullscreenButton();
  
  animationFrameId = requestAnimationFrame(animateScroll);
});