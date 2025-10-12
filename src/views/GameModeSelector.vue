<template>
  <div class="game-mode-selector">
    <div class="selector-container">
      <div class="header">
        <h1 class="title">{{ $t('gameMode.selectMode') }}</h1>
      </div>

      <div class="mode-cards">
        <!-- Cash Games Card -->
        <div class="mode-card cash-games" @click="selectMode('cash')">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>{{ $t('gameMode.cashGames') }}</h2>
          <p>{{ $t('gameMode.cashDesc') }}</p>
          <div class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        <!-- Tournaments Card -->
        <div class="mode-card tournaments" @click="selectMode('tournament')">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </div>
          <h2>{{ $t('gameMode.tournaments') }}</h2>
          <p>{{ $t('gameMode.tournamentsDesc') }}</p>
          <div class="coming-soon-badge">{{ $t('gameMode.comingSoon') }}</div>
          <div class="arrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['mode-selected']);

function selectMode(mode) {
  emit('mode-selected', mode);
}
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   GameModeSelector - Premium Style
   ======================================== */

.game-mode-selector {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: hidden;
}

.selector-container {
  width: 100%;
  max-width: 600px;
  height: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header {
  text-align: center;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
}

.title {
  font-size: 1.85rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  margin-bottom: 0;
  text-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
}

.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  justify-content: center;
  max-height: calc(100vh - 150px);
}

.mode-card {
  position: relative;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 18px;
  padding: 1.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.mode-card:hover::before {
  opacity: 1;
}

.mode-card.cash-games {
  border-color: rgba(16, 185, 129, 0.3);
}

.mode-card.cash-games:hover {
  border-color: rgba(16, 185, 129, 0.6);
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 16px -1px rgba(0, 0, 0, 0.4),
    0 20px 40px -3px rgba(16, 185, 129, 0.3),
    0 0 0 1px rgba(16, 185, 129, 0.1) inset;
}

.mode-card.tournaments {
  border-color: rgba(212, 175, 55, 0.3);
}

.mode-card.tournaments:hover {
  border-color: rgba(212, 175, 55, 0.6);
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 8px 16px -1px rgba(0, 0, 0, 0.4),
    0 20px 40px -3px rgba(212, 175, 55, 0.3),
    0 0 0 1px rgba(212, 175, 55, 0.1) inset;
}

.card-icon {
  width: 90px;
  height: 90px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  transition: all 0.4s ease;
  flex-shrink: 0;
}

.mode-card.cash-games .card-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
  border-color: rgba(16, 185, 129, 0.3);
}

.mode-card.tournaments .card-icon {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  border-color: rgba(212, 175, 55, 0.3);
}

.card-icon svg {
  width: 48px;
  height: 48px;
  color: #d4af37;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
  transition: all 0.4s ease;
}

.mode-card.cash-games .card-icon svg {
  color: #10b981;
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
}

.mode-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.mode-card:hover .card-icon svg {
  transform: scale(1.15);
}

.mode-card h2 {
  font-size: 1.55rem;
  font-weight: 700;
  color: #f9fafb;
  text-align: center;
  margin-bottom: 0.65rem;
  flex-shrink: 0;
}

.mode-card.cash-games h2 {
  color: #10b981;
  text-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.mode-card.tournaments h2 {
  color: #d4af37;
  text-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
}

.mode-card p {
  font-size: 0.95rem;
  color: #9ca3af;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 0;
  flex-shrink: 0;
}

.coming-soon-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.9), rgba(184, 134, 11, 0.9));
  color: #0a0e1a;
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
}

.arrow {
  position: absolute;
  bottom: 1.25rem;
  right: 1.25rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.4;
  transition: all 0.4s ease;
}

.arrow svg {
  width: 24px;
  height: 24px;
  color: #9ca3af;
}

.mode-card:hover .arrow {
  opacity: 1;
  transform: translateX(8px);
}

.mode-card.cash-games:hover .arrow svg {
  color: #10b981;
}

.mode-card.tournaments:hover .arrow svg {
  color: #d4af37;
}

/* ========================================
   RESPONSIVE DESIGN - Mobile Optimized
   ======================================== */

/* Mobile-first: ensure no overflow and fit both cards */
@media (max-width: 480px) {
  .game-mode-selector {
    padding: 1rem 0.85rem;
  }

  .selector-container {
    padding: 0 0.35rem;
  }

  .header {
    margin-bottom: 1.15rem;
  }

  .title {
    font-size: 1.6rem;
    line-height: 1.2;
  }

  .mode-cards {
    gap: 1rem;
    max-height: calc(100vh - 120px);
  }

  .mode-card {
    padding: 1.35rem 1.15rem;
  }

  .mode-card h2 {
    font-size: 1.35rem;
  }

  .mode-card p {
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .card-icon {
    width: 70px;
    height: 70px;
    margin-bottom: 1rem;
  }

  .card-icon svg {
    width: 40px;
    height: 40px;
  }

  .coming-soon-badge {
    font-size: 0.62rem;
    padding: 0.28rem 0.7rem;
    top: 0.85rem;
    right: 0.85rem;
  }

  .arrow {
    bottom: 1.15rem;
    right: 1.15rem;
    width: 26px;
    height: 26px;
  }

  .arrow svg {
    width: 21px;
    height: 21px;
  }
}

/* Tablet and larger */
@media (min-width: 640px) {
  .game-mode-selector {
    padding: 1.75rem 1.25rem;
  }

  .header {
    margin-bottom: 1.75rem;
  }

  .mode-cards {
    gap: 1.75rem;
    max-height: calc(100vh - 180px);
  }

  .mode-card {
    padding: 2.25rem 2rem;
  }

  .title {
    font-size: 2.35rem;
  }

  .mode-card h2 {
    font-size: 1.85rem;
  }

  .mode-card p {
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .card-icon {
    width: 105px;
    height: 105px;
    margin-bottom: 1.5rem;
  }

  .card-icon svg {
    width: 56px;
    height: 56px;
  }

  .coming-soon-badge {
    font-size: 0.7rem;
    padding: 0.4rem 0.95rem;
    top: 1.25rem;
    right: 1.25rem;
  }

  .arrow {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 34px;
    height: 34px;
  }

  .arrow svg {
    width: 26px;
    height: 26px;
  }
}
</style>
