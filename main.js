import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const permissionOverlay = document.getElementById('permission-overlay');
  const grantPermissionBtn = document.getElementById('grant-permission-btn');
  const cameraStream = document.getElementById('camera-stream');
  
  const scriptInput = document.getElementById('script-input');
  const prompterText = document.getElementById('prompter-text');
  
  // State
  let isScrolling = true;
  let scrollPosition = 0;
  let animationFrameId = null;
  const scrollSpeed = 1.5; // pixels per frame
  
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
    prompterText.textContent = e.target.value;
  });

  // 3. Scrolling Logic
  const animateScroll = () => {
    if (!isScrolling) return;
    
    scrollPosition -= scrollSpeed;
    
    // Check if we scrolled past the top
    const textHeight = prompterText.getBoundingClientRect().height;
    const containerHeight = prompterText.parentElement.getBoundingClientRect().height;
    
    // Stop condition: when text is completely out of view
    // Position is initially at top: 100% of container, so 0 transform is container height
    if (-scrollPosition > textHeight + containerHeight) {
      scrollPosition = 0; // reset
    }
    
    prompterText.style.transform = `translateY(${scrollPosition}px)`;
    animationFrameId = requestAnimationFrame(animateScroll);
  };

  // Iniciar rolagem automaticamente
  animateScroll();
});
