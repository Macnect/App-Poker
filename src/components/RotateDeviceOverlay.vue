<template>
  <div class="rotate-overlay">
    <div class="rotate-backdrop"></div>
    <div class="rotate-content">
      <div class="icon-container">
        <svg class="rotate-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
          <!-- Móvil en posición horizontal (inicial) -->
          <g class="phone-horizontal">
            <rect x="20" y="35" width="60" height="30" rx="3" stroke="currentColor" stroke-width="2.5" fill="rgba(212, 175, 55, 0.1)"/>
            <circle cx="75" cy="50" r="2" fill="currentColor"/>
            <line x1="25" y1="43" x2="70" y2="43" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
            <line x1="25" y1="50" x2="70" y2="50" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
            <line x1="25" y1="57" x2="70" y2="57" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>
          </g>

          <!-- Flecha curva de rotación -->
          <g class="rotation-arrow">
            <path d="M 85 50 A 25 25 0 0 1 70 75" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.8"/>
            <path d="M 70 75 L 65 72 M 70 75 L 68 69" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
          </g>

          <!-- Móvil en posición vertical (objetivo) -->
          <g class="phone-vertical">
            <rect x="35" y="15" width="30" height="60" rx="3" stroke="currentColor" stroke-width="2.5" fill="rgba(212, 175, 55, 0.2)" stroke-dasharray="4 3" opacity="0.6"/>
            <circle cx="50" cy="70" r="2" fill="currentColor" opacity="0.6"/>
            <line x1="40" y1="22" x2="60" y2="22" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
          </g>
        </svg>
      </div>
      <div class="text-container">
        <h2 class="title">Modo Vertical Requerido</h2>
        <p class="subtitle">Para una experiencia óptima, por favor gira tu dispositivo a orientación vertical</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rotate-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  z-index: 9999;
  overflow: hidden;
}

.rotate-backdrop {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 69, 19, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(60px);
  animation: pulse 3s ease-in-out infinite;
}

.rotate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem 2rem;
  position: relative;
  z-index: 1;
}

.icon-container {
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.2) 0%, rgba(184, 115, 51, 0.15) 100%);
  border: 2px solid rgba(184, 115, 51, 0.3);
  border-radius: 24px;
  padding: 2rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.rotate-icon {
  width: 80px;
  height: 80px;
  color: #D4AF37;
  filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
}

.phone-horizontal {
  animation: phone-rotate 3s ease-in-out infinite;
  transform-origin: 50% 50%;
}

.rotation-arrow {
  animation: arrow-pulse 3s ease-in-out infinite;
}

.phone-vertical {
  animation: phone-fade 3s ease-in-out infinite;
}

.text-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 340px;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  background: linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  line-height: 1.5;
  letter-spacing: 0.3px;
}

@keyframes phone-rotate {
  0%, 100% {
    transform: rotate(0deg) translate(0, 0);
    opacity: 1;
  }
  45% {
    transform: rotate(0deg) translate(0, 0);
    opacity: 1;
  }
  55% {
    transform: rotate(20deg) translate(2px, -2px);
    opacity: 0.7;
  }
  65% {
    transform: rotate(60deg) translate(5px, -5px);
    opacity: 0.4;
  }
  75% {
    transform: rotate(90deg) translate(8px, -8px);
    opacity: 0.2;
  }
  85% {
    transform: rotate(90deg) translate(8px, -8px);
    opacity: 0;
  }
}

@keyframes arrow-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  45% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  85%, 100% {
    opacity: 0.6;
  }
}

@keyframes phone-fade {
  0%, 45% {
    opacity: 0.3;
  }
  55% {
    opacity: 0.5;
  }
  75%, 100% {
    opacity: 0.8;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive para pantallas más pequeñas */
@media (max-height: 600px) {
  .rotate-content {
    gap: 1.5rem;
    padding: 2rem 1.5rem;
  }

  .icon-container {
    padding: 1.5rem;
  }

  .rotate-icon {
    width: 64px;
    height: 64px;
  }

  .title {
    font-size: 1.25rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }
}
</style>