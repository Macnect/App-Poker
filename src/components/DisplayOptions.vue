<template>
  <div class="display-options-container">
    <div class="display-options-wrapper">
      <h3>Opciones Replay</h3>
      <div class="options-row">
        <label>Controles:</label>
        <button class="option-item" @click="gameStore.navigateHistory(-1)">◀</button>
        <button class="option-item" @click="gameStore.toggleReplay()">
          {{ gameStore.isReplaying ? '⏸️' : '▶️' }}
        </button>
        <button class="option-item" @click="gameStore.navigateHistory(1)">▶</button>
      </div>
      <div class="options-row">
        <label for="replay-speed-select">Velocidad:</label>
        <select id="replay-speed-select" class="option-item" @change="gameStore.setReplaySpeed($event.target.value)">
          <option value="2000">1x</option>
          <option value="1000">2x</option>
          <option value="500">4x</option>
        </select>
      </div>
    </div>

    <!-- Botones circulares externos -->
    <div class="external-controls">
      <select class="color-select-round" :value="settingsStore.tableColor" @input="settingsStore.setTableColor($event.target.value)" title="Color de mesa">
        <option value="#28563a">🟢</option>
        <option value="#3a4c8a">🔵</option>
        <option value="#8a3a3a">🔴</option>
        <option value="#553c9a">🟣</option>
        <option value="#b7791f">🟡</option>
        <option value="#1A202C">⚫</option>
        <option value="#4A5568">⚪</option>
      </select>
      <button class="bbs-toggle-round" @click="gameStore.toggleDisplayMode()" :title="gameStore.displayInBBs ? 'Cambiar a ' + gameStore.currency : 'Cambiar a BBs'">
        {{ gameStore.displayInBBs ? gameStore.currency : 'BB' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../store/game';
import { useSettingsStore } from '../store/useSettingsStore';

const gameStore = useGameStore();
const settingsStore = useSettingsStore();
</script>

<style scoped>
/* Tipografía premium */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.display-options-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 75%;
  margin: 0 auto;
}

.display-options-wrapper {
  flex: 1;
  max-width: calc(100% - 62px); /* Panel más estrecho para dejar espacio a los botones */
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  border-radius: 14px;
  padding: clamp(12px, 1.5vw, 24px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.15);
  color: white;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 1.5vh, 20px);
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.display-options-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

h3 {
  margin: 0 0 1rem 0;
  font-size: clamp(1.2rem, 3vmin, 1.6rem);
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.options-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.options-row label {
  font-weight: 600;
  color: rgba(212, 175, 55, 0.9);
  flex-shrink: 0;
  font-size: clamp(0.85rem, 2vmin, 1rem);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.option-item {
  height: clamp(38px, 6vmin, 52px);
  padding: 0 14px;
  font-size: clamp(0.9rem, 2.5vmin, 1.2rem);
  font-weight: 600;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

button.option-item:hover {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

select.option-item:hover {
  background: linear-gradient(135deg, #252f3f 0%, #131824 100%);
  border-color: rgba(212, 175, 55, 0.25);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
}

.option-item:focus {
  outline: none;
}

button.option-item:focus-visible {
  outline: 2px solid rgba(212, 175, 55, 0.5);
  outline-offset: 2px;
}

select.option-item:focus {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: rgba(212, 175, 55, 0.2);
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

select.option-item {
  flex-grow: 1;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23fff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  padding-right: 35px;
}

select.option-item option {
  background-color: #1f2937;
  color: white;
  padding: 8px;
}

button.option-item {
  min-width: 52px;
  font-weight: 700;
}

button.option-item:active {
  transform: translateY(0);
}

/* Landscape optimizations */
@media screen and (orientation: landscape) {
  .display-options-wrapper {
    padding: clamp(14px, 2vh, 22px);
    gap: clamp(10px, 1.5vh, 16px);
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    justify-content: flex-start;
  }

  h3 {
    font-size: clamp(1rem, 2.2vmin, 1.3rem);
    margin: 0 0 0.5rem 0;
  }

  .options-row {
    gap: 8px;
    flex-wrap: wrap;
    width: 100%;
  }

  .options-row label {
    font-size: clamp(0.75rem, 1.6vmin, 0.9rem);
    min-width: 70px;
    flex-shrink: 0;
  }

  .option-item {
    height: clamp(32px, 4.5vh, 44px);
    font-size: clamp(0.8rem, 1.8vmin, 1rem);
    padding: 0 10px;
  }

  button.option-item {
    min-width: 44px;
    flex: 0 0 auto;
  }

  select.option-item {
    flex: 1 1 auto;
    min-width: 100px;
  }

  .display-options-container {
    width: 100%;
    flex-direction: row;
    gap: 8px;
  }

  .external-controls {
    flex-direction: column;
    justify-content: flex-start;
    padding-top: clamp(14px, 2vh, 22px);
  }

  .color-select-round,
  .bbs-toggle-round {
    width: 45px;
    height: 45px;
  }
}

/* ========================================
   EXTERNAL CONTROLS - Round Buttons
   ======================================== */
.external-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-select-round,
.bbs-toggle-round {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(212, 175, 55, 0.3);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.95) 100%);
  color: white;
  font-size: clamp(0.75rem, 1.5vmin, 0.95rem);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.color-select-round {
  font-size: 1.5rem;
  padding: 0;
  text-align: center;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.color-select-round option {
  background-color: #1f2937;
  color: white;
  font-size: 1.2rem;
}

.color-select-round:hover,
.bbs-toggle-round:hover {
  transform: scale(1.1);
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 0 20px rgba(212, 175, 55, 0.1);
}

.color-select-round:active,
.bbs-toggle-round:active {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .display-options-container {
    width: 90%;
    flex-direction: column;
    gap: 10px;
  }

  .display-options-wrapper {
    max-width: 100%;
  }

  .external-controls {
    flex-direction: row;
    gap: 12px;
    justify-content: center;
  }

  .color-select-round,
  .bbs-toggle-round {
    width: 50px;
    height: 50px;
  }
}
</style>