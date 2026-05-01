import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const permissionOverlay = document.getElementById('permission-overlay');
  const grantPermissionBtn = document.getElementById('grant-permission-btn');
  const cameraStream = document.getElementById('camera-stream');
  
  const scriptInput = document.getElementById('script-input');
  const prompterText = document.getElementById('prompter-text');
  const prompterWrapper = document.getElementById('prompter-wrapper');
  const prompterTextClone = prompterText.cloneNode(true);
  prompterTextClone.removeAttribute('id');
  prompterTextClone.setAttribute('aria-hidden', 'true');
  prompterWrapper.appendChild(prompterTextClone);
  
  // State
  let isScrolling = true;
  let scrollOffset = 0;
  let animationFrameId = null;
  let lastFrameTime = null;
  let cycleDistance = 0;
  let needsMeasurement = true;
  const SCROLL_SPEED_PX_PER_SECOND = 90;
  
  // 1. Camera & Mic Permission
  grantPermissionBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      cameraStream.srcObject = stream;
      cameraStream.style.opacity = '1';
      
      // Hide permission overlay
      permissionOverlay.classList.add('hidden');
      
    } catch (err) {
      console.error('Error accessing media devices.', err);
      alert('Não foi possível acessar a câmera/microfone. Por favor, permita o acesso para utilizar o teleprompter.');
    }
  });

  // 2. Sync Text
  scriptInput.addEventListener('input', (e) => {
    updatePrompterText(e.target.value);
  });

  // 3. Scrolling Logic
  const updatePrompterText = (text) => {
    prompterText.textContent = text;
    prompterTextClone.textContent = text;
    needsMeasurement = true;
  };

  const measureScrollCycle = () => {
    const hasText = prompterText.textContent.trim().length > 0;

    if (!hasText) {
      cycleDistance = 0;
      scrollOffset = 0;
      needsMeasurement = false;
      return;
    }

    const textHeight = prompterText.getBoundingClientRect().height;
    const wrapperHeight = prompterWrapper.getBoundingClientRect().height;

    cycleDistance = textHeight + wrapperHeight;

    if (cycleDistance > 0) {
      scrollOffset %= cycleDistance;
    }

    needsMeasurement = false;
  };

  const renderPrompterPosition = () => {
    if (needsMeasurement) {
      measureScrollCycle();
    }

    if (cycleDistance === 0) {
      prompterText.style.transform = 'translate3d(0, 0, 0)';
      prompterTextClone.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const translateY = -scrollOffset;
    prompterText.style.transform = `translate3d(0, ${translateY}px, 0)`;
    prompterTextClone.style.transform = `translate3d(0, ${translateY + cycleDistance}px, 0)`;
  };

  const animateScroll = (timestamp) => {
    if (!isScrolling) {
      lastFrameTime = null;
      animationFrameId = requestAnimationFrame(animateScroll);
      return;
    }

    if (lastFrameTime === null) {
      lastFrameTime = timestamp;
    }

    const elapsedSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    if (needsMeasurement) {
      measureScrollCycle();
    }

    if (cycleDistance > 0) {
      scrollOffset = (scrollOffset + SCROLL_SPEED_PX_PER_SECOND * elapsedSeconds) % cycleDistance;
    }

    renderPrompterPosition();
    animationFrameId = requestAnimationFrame(animateScroll);
  };

  const markForMeasurement = () => {
    needsMeasurement = true;
  };

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(markForMeasurement);
    resizeObserver.observe(prompterWrapper);
    resizeObserver.observe(prompterText);
  } else {
    window.addEventListener('resize', markForMeasurement);
  }

  document.addEventListener('visibilitychange', () => {
    lastFrameTime = null;

    if (!document.hidden) {
      needsMeasurement = true;
    }
  });

  // Iniciar rolagem automaticamente
  updatePrompterText(scriptInput.value);
  renderPrompterPosition();
  animationFrameId = requestAnimationFrame(animateScroll);
});
