(function () {
  // Check if canvas already exists
  if (document.getElementById('flowing-dots-canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'flowing-dots-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '0';
  canvas.style.opacity = '0.85';

  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let mouse = {
    x: -1000,
    y: -1000,
    radius: 160
  };

  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile ? 45 : 95;
  const CONNECT_DISTANCE = isMobile ? 90 : 135;

  const colorPalette = [
    { r: 6, g: 182, b: 212 },    // Cyan
    { r: 59, g: 130, b: 246 },   // Blue
    { r: 168, g: 85, b: 247 },   // Purple / Violet
    { r: 45, g: 212, b: 191 },   // Teal
    { r: 147, g: 51, b: 234 }    // Neon Purple
  ];

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 10;
      this.radius = Math.random() * 2 + 1;
      this.baseRadius = this.radius;

      // Flow velocities (gentle upward and diagonal drift)
      this.vx = (Math.random() - 0.45) * 0.6;
      this.vy = -(Math.random() * 0.7 + 0.3);

      this.color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      this.baseAlpha = Math.random() * 0.5 + 0.3;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulseAngle = Math.random() * Math.PI * 2;
      this.waveOffset = Math.random() * 1000;
    }

    update(time) {
      // Harmonic wave flow
      const wave = Math.sin((time * 0.001) + this.waveOffset) * 0.3;
      this.x += this.vx + wave;
      this.y += this.vy;

      // Pulsing alpha & slight glow
      this.pulseAngle += this.pulseSpeed;
      this.alpha = this.baseAlpha + Math.sin(this.pulseAngle) * 0.2;

      // Mouse interaction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouse.radius && dist > 0) {
        const force = (mouse.radius - dist) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        this.x -= Math.cos(angle) * force * 2.5;
        this.y -= Math.sin(angle) * force * 2.5;
        this.radius = this.baseRadius + force * 2;
      } else {
        this.radius = Math.max(this.baseRadius, this.radius - 0.05);
      }

      // Wrap around bounds
      if (this.y < -20) {
        this.y = height + 10;
        this.x = Math.random() * width;
      }
      if (this.x < -20) this.x = width + 10;
      if (this.x > width + 20) this.x = -10;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${Math.max(0, this.alpha)})`;
      ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
      ctx.shadowBlur = this.radius * 4;
      ctx.fill();
      ctx.shadowBlur = 0; // reset for performance
    }
  }

  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);

          // Subtle gradient connection line
          const gradient = ctx.createLinearGradient(
            particles[i].x, particles[i].y,
            particles[j].x, particles[j].y
          );
          gradient.addColorStop(0, `rgba(${particles[i].color.r}, ${particles[i].color.g}, ${particles[i].color.b}, ${alpha})`);
          gradient.addColorStop(1, `rgba(${particles[j].color.r}, ${particles[j].color.g}, ${particles[j].color.b}, ${alpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Connect with mouse cursor
      const dxMouse = mouse.x - particles[i].x;
      const dyMouse = mouse.y - particles[i].y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

      if (distMouse < mouse.radius) {
        const alpha = (1 - distMouse / mouse.radius) * 0.35;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(${particles[i].color.r}, ${particles[i].color.g}, ${particles[i].color.b}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  let animationFrameId;
  function animate(time) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update(time);
      particles[i].draw();
    }

    drawConnections();

    animationFrameId = requestAnimationFrame(animate);
  }

  function onResize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  window.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  animationFrameId = requestAnimationFrame(animate);
})();
