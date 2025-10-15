<template>
  <div class="action-panel-container">
    <div class="action-panel-wrapper">
      <div class="actions-grid">
        <div class="grid-turn-info">{{ $t('actionPanel.turnOf') }} <strong>{{ gameStore.activePlayer?.name }}</strong></div>
        <button @click="gameStore.performAction('fold')" class="grid-fold btn-fold">{{ $t('actionPanel.fold') }}</button>
        <button @click="handleCheckCall" :disabled="isCallDisabled" class="grid-call btn-call">{{ checkOrCallLabel.toUpperCase() }}</button>

        <button @click="handleBetRaise" :disabled="isRaiseDisabled" class="grid-raise btn-raise">{{ betOrRaiseLabel.toUpperCase() }}</button>

        <input type="number" v-model="displayRaiseAmount" class="grid-input" />
        <div v-if="isAllIn" class="all-in-indicator">▲</div>

        <input
          type="range"
          :min="minRaiseValue"
          :max="maxSliderValue"
          :step="gameStore.bigBlind"
          v-model.number="raiseAmount"
          class="grid-slider"
          @wheel="handleWheelScroll"
          :style="sliderStyle"
        />

        <div class="grid-quick-bets">
          <button @click="setRaiseAmountByPot(0.25)">25%</button>
          <button @click="setRaiseAmountByPot(0.33)">33%</button>
          <button @click="setRaiseAmountByPot(0.50)">50%</button>
          <button @click="setRaiseAmountByPot(0.75)">75%</button>
          <button @click="setRaiseAmountByPot(1)">{{ $t('actionPanel.pot') }}</button>
          <button @click="setRaiseAmountByPot(1.5)">150%</button>
          <button @click="setRaiseAmountToAllIn" class="btn-allin">{{ $t('actionPanel.allIn') }}</button>
        </div>

        <button @click="gameStore.navigateHistory(-1)" class="grid-prev btn-nav" v-if="gameStore.gamePhase !== 'replay'">◀</button>
        <button @click="gameStore.navigateHistory(1)" class="grid-next btn-nav" v-if="gameStore.gamePhase !== 'replay'">▶</button>
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
      <button class="save-hand-round" @click="handleSaveHand" :title="handSaved ? '✓ Guardado' : 'Guardar Mano'">
        <svg v-if="!handSaved" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-icon">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        <span v-if="handSaved" class="saved-indicator">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../store/game';
import { useSettingsStore } from '../store/useSettingsStore';

const { t } = useI18n();

const gameStore = useGameStore();
const settingsStore = useSettingsStore();

const handSaved = ref(false);

async function handleSaveHand() {
  await gameStore.saveCurrentHand();
  handSaved.value = true;
  setTimeout(() => {
    handSaved.value = false;
  }, 2000);
}

const amountToCall = computed(() => {
  if (!gameStore.activePlayer) return 0;
  return gameStore.currentBet - gameStore.activePlayer.betThisRound;
});

const checkOrCallLabel = computed(() => {
  if (amountToCall.value <= 0) return t('actionPanel.check');
  if (gameStore.displayInBBs) {
    const bbValue = (amountToCall.value / gameStore.bigBlind).toFixed(1);
    return `${t('actionPanel.call')} ${bbValue} BB`;
  }
  return `${t('actionPanel.call')} ${amountToCall.value}`;
});

const maxSliderValue = computed(() => {
    if (!gameStore.activePlayer) return 0;
    const playerMaxStack = gameStore.activePlayer.stack + gameStore.activePlayer.betThisRound;

    // Si es Pot Limit Omaha, aplicar reglas PLO
    if (gameStore.gameVariant === 'omaha') {
        // P = pot antes de la acción actual (sin contar la apuesta que enfrentamos)
        const P = gameStore.totalPot;

        // b = cantidad que debemos igualar (call)
        const b = gameStore.currentBet - gameStore.activePlayer.betThisRound;

        let maxPotLimitBet;

        if (b === 0) {
            // Caso A: Abriendo la acción (no hay apuesta previa)
            // Máximo = P + BB
            maxPotLimitBet = P + gameStore.bigBlind;
        } else {
            // Caso B: Hay una apuesta que debemos igualar
            // Máximo total = P + 2*b (que es call + raise máxima)
            maxPotLimitBet = P + (2 * b);
        }

        // Retornar el menor entre el stack del jugador y el límite de pot
        return Math.min(playerMaxStack, maxPotLimitBet);
    }

    // Para No-Limit Hold'em, no hay límite (solo el stack del jugador)
    return playerMaxStack;
});

const minRaiseValue = computed(() => {
  if (!gameStore.activePlayer) return 0;

  // Si es Pot Limit Omaha, aplicar reglas PLO para el mínimo
  if (gameStore.gameVariant === 'omaha') {
      const b = gameStore.currentBet - gameStore.activePlayer.betThisRound;

      if (b === 0) {
          // Abriendo la acción: mínimo = 2 * BB
          const minOpen = 2 * gameStore.bigBlind;
          return Math.min(minOpen, maxSliderValue.value);
      } else {
          // Hay una apuesta: mínimo = call + tamaño de la subida anterior
          const previousRaise = gameStore.currentBet - (gameStore.lastRaiseAmount || 0);
          const minRaise = gameStore.currentBet + previousRaise;
          return Math.min(minRaise, maxSliderValue.value);
      }
  }

  // Para No-Limit Hold'em, usar la lógica original
  const raiseDifference = gameStore.currentBet - (gameStore.lastRaiseAmount || 0);
  const min = gameStore.currentBet + Math.max(raiseDifference, gameStore.bigBlind);
  return Math.min(min, maxSliderValue.value);
});

const raiseAmount = ref(minRaiseValue.value);
watch(minRaiseValue, (newVal) => {
    if(raiseAmount.value < newVal) {
        raiseAmount.value = newVal;
    }
});
watch(() => gameStore.activePlayerIndex, () => {
    raiseAmount.value = minRaiseValue.value;
});

const displayRaiseAmount = computed({
  get() {
    if (gameStore.displayInBBs) {
      return (raiseAmount.value / gameStore.bigBlind).toFixed(1);
    }
    return raiseAmount.value;
  },
  set(newValue) {
    if (gameStore.displayInBBs) {
      raiseAmount.value = Math.round(parseFloat(newValue) * gameStore.bigBlind);
    } else {
      raiseAmount.value = parseInt(newValue) || 0;
    }
  }
});

const sliderStyle = computed(() => {
  if (!gameStore.activePlayer) return {};
  const min = minRaiseValue.value;
  const max = maxSliderValue.value;
  const current = raiseAmount.value;
  if (max <= min) {
    return {
      '--slider-fill-percentage': '100%',
      '--slider-active-color': '#dc2626',
      'background': 'linear-gradient(to right, #dc2626 100%, rgba(31, 41, 55, 0.8) 100%)'
    };
  }
  const percentage = ((current - min) / (max - min)) * 100;

  // Calculate progressive color based on percentage with smoother transitions
  let color;
  if (percentage < 20) {
    // Green to Lime transition (0-20%)
    const ratio = percentage / 20;
    color = interpolateColor('#10b981', '#84cc16', ratio);
  } else if (percentage < 35) {
    // Lime to Yellow transition (20-35%)
    const ratio = (percentage - 20) / 15;
    color = interpolateColor('#84cc16', '#facc15', ratio);
  } else if (percentage < 50) {
    // Yellow to Amber transition (35-50%)
    const ratio = (percentage - 35) / 15;
    color = interpolateColor('#facc15', '#f59e0b', ratio);
  } else if (percentage < 65) {
    // Amber to Orange transition (50-65%)
    const ratio = (percentage - 50) / 15;
    color = interpolateColor('#f59e0b', '#fb923c', ratio);
  } else if (percentage < 80) {
    // Orange to Deep Orange transition (65-80%)
    const ratio = (percentage - 65) / 15;
    color = interpolateColor('#fb923c', '#f97316', ratio);
  } else if (percentage < 90) {
    // Deep Orange to Red transition (80-90%)
    const ratio = (percentage - 80) / 10;
    color = interpolateColor('#f97316', '#ef4444', ratio);
  } else {
    // Red to Deep Red (90-100%)
    const ratio = (percentage - 90) / 10;
    color = interpolateColor('#ef4444', '#dc2626', ratio);
  }

  return {
    '--slider-fill-percentage': `${percentage}%`,
    '--slider-active-color': color,
    'background': `linear-gradient(to right, ${color} ${percentage}%, rgba(31, 41, 55, 0.8) ${percentage}%)`
  };
});

// Helper function to interpolate between two hex colors
function interpolateColor(color1, color2, ratio) {
  const hex = (color) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const c1 = hex(color1);
  const c2 = hex(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const betOrRaiseLabel = computed(() => (gameStore.currentBet > 0 ? t('actionPanel.raise') : t('actionPanel.bet')));
const isCallDisabled = computed(() => !gameStore.activePlayer || amountToCall.value > gameStore.activePlayer.stack);
const isRaiseDisabled = computed(() => !gameStore.activePlayer || raiseAmount.value < minRaiseValue.value || raiseAmount.value > maxSliderValue.value);
const isAllIn = computed(() => gameStore.activePlayer && raiseAmount.value >= gameStore.activePlayer.stack);

function handleCheckCall() {
  const action = amountToCall.value > 0 ? 'call' : 'check';
  gameStore.performAction(action);
}
function handleBetRaise() {
  const action = gameStore.currentBet > 0 ? 'raise' : 'bet';
  gameStore.performAction(action, raiseAmount.value);
}

function setRaiseAmountByPot(multiplier) {
  if (!gameStore.activePlayer) return;
  
  let betValue = Math.round(gameStore.totalPot * multiplier);
  betValue = Math.max(minRaiseValue.value, betValue);
  betValue = Math.min(maxSliderValue.value, betValue);

  raiseAmount.value = betValue;
}

function setRaiseAmountToAllIn() {
  if (!gameStore.activePlayer) return;
  raiseAmount.value = maxSliderValue.value;
}


function handleWheelScroll(event) {
  // event.preventDefault(); // <-- ELIMINADO PARA SOLUCIONAR EL [VIOLATION]
  const step = gameStore.bigBlind;
  let newValue;
  if (event.deltaY < 0) {
    newValue = raiseAmount.value + step;
  } else {
    newValue = raiseAmount.value - step;
  }
  newValue = Math.max(minRaiseValue.value, newValue);
  newValue = Math.min(maxSliderValue.value, newValue);
  raiseAmount.value = newValue;
}
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   ActionPanel - Premium Control Panel
   ======================================== */

.action-panel-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 75%;
  margin: 0 auto;
}

.action-panel-wrapper {
  flex: 1;
  max-width: calc(100% - 112px); /* Panel más estrecho para dejar espacio a 3 botones */
  /* Premium button colors - more vibrant and sophisticated */
  --btn-red: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  --btn-green: linear-gradient(135deg, #047857 0%, #059669 100%);
  --btn-orange: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  --btn-purple: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  --btn-grey: linear-gradient(135deg, rgba(74, 85, 104, 0.8) 0%, rgba(55, 65, 81, 0.9) 100%);
  --slider-color-active: #d4af37;
  --slider-color-inactive: rgba(31, 41, 55, 0.8);

  /* Premium glass panel effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: clamp(6px, 1vw, 12px);

  /* Multi-layer shadow for depth */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(212, 175, 55, 0.03);

  backdrop-filter: blur(10px);
  color: white;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
}

.actions-grid {
  width: 100%;
  display: grid;
  gap: clamp(4px, 0.6vw, 8px);
  align-items: center;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: auto auto auto auto;
  grid-template-areas:
    "fold       call       turn-info  turn-info    turn-info    turn-info"
    "raise      input      slider     slider       slider       slider"
    "quick-bets quick-bets quick-bets quick-bets   quick-bets   quick-bets"
    "prev-action prev-action prev-action next-action next-action next-action";
}

/* Grid areas assignment */
.grid-turn-info {
  grid-area: turn-info;
  text-align: center;
  font-size: clamp(0.9rem, 2vmin, 1.2rem);
  font-weight: 600;
  color: #d1d5db;
  letter-spacing: 0.025em;
}

.grid-turn-info strong {
  color: #d4af37;
  font-weight: 700;
}

.grid-fold { grid-area: fold; }
.grid-call { grid-area: call; }
.grid-raise { grid-area: raise; }
.grid-input { grid-area: input; }
.grid-slider { grid-area: slider; }
.grid-quick-bets { grid-area: quick-bets; }
.grid-prev { grid-area: prev-action; }
.grid-next { grid-area: next-action; }

/* ========================================
   PREMIUM BUTTON STYLING
   ======================================== */
.grid-fold, .grid-call, .grid-raise, .grid-input, .btn-nav {
  height: clamp(26px, 5vmin, 48px);
  font-size: clamp(0.8rem, 1.6vmin, 1rem);
  font-weight: 700;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0.5%;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.grid-fold:hover, .grid-call:hover, .grid-raise:hover, .btn-nav:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.grid-fold:active, .grid-call:active, .grid-raise:active, .btn-nav:active {
  transform: translateY(0);
}

/* Premium input styling */
.grid-input {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  text-align: center;
  width: 100%;
  font-weight: 600;
  color: #f9fafb;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.grid-input:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.grid-input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1);
}

.all-in-indicator { display: none; }

/* ========================================
   QUICK BET BUTTONS - Premium Grid
   ======================================== */
.grid-quick-bets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto auto;
  gap: clamp(3px, 0.5vw, 5px);
  width: 100%;
  padding: 0;
}

.grid-quick-bets button {
  padding: clamp(4px, 1vmin, 8px) clamp(3px, 0.6vw, 8px);
  font-size: clamp(0.7rem, 1.5vmin, 0.9rem);
  font-weight: 600;
  border-radius: 6px;
  background: var(--btn-grey);
  color: white;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;

  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}

.grid-quick-bets button:hover {
  background: linear-gradient(135deg, rgba(74, 85, 104, 1) 0%, rgba(55, 65, 81, 1) 100%);
  transform: translateY(-2px);
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.grid-quick-bets button:active {
  transform: translateY(0);
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

.save-hand-round {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(212, 175, 55, 0.3);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  color: #d4af37;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 8px rgba(212, 175, 55, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.save-hand-round .save-icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.2));
  transition: all 0.3s ease;
}

.save-hand-round:hover {
  transform: scale(1.1);
  border-color: rgba(212, 175, 55, 0.6);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%);
  box-shadow:
    0 4px 16px rgba(212, 175, 55, 0.2),
    0 0 20px rgba(212, 175, 55, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.save-hand-round:hover .save-icon {
  filter: drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3));
}

.save-hand-round:active {
  transform: scale(1.05);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.25) 100%);
}

.save-hand-round .saved-indicator {
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
  text-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
  animation: popInSuccess 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popInSuccess {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.save-hand-round:has(.saved-indicator) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow:
    0 4px 16px rgba(16, 185, 129, 0.3),
    0 0 20px rgba(16, 185, 129, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

/* ========================================
   ACTION BUTTON COLORS - Premium Gradients
   ======================================== */
.btn-fold {
  background: var(--btn-red);
}

.btn-fold:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  filter: brightness(1.1);
}

.btn-call {
  background: var(--btn-green);
}

.btn-call:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.btn-raise {
  background: var(--btn-orange);
}

.btn-raise:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.btn-allin {
  background: var(--btn-purple) !important;
  letter-spacing: 0.05em;
  font-weight: 700;
  grid-column: span 2;
}

.btn-allin:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  filter: brightness(1.15);
}

.btn-nav {
  background: var(--btn-grey);
}

.btn-nav:hover {
  background: linear-gradient(135deg, rgba(74, 85, 104, 1) 0%, rgba(55, 65, 81, 1) 100%);
}

/* Disabled state - premium style */
button:disabled, .grid-slider:disabled {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.5) 0%, rgba(75, 85, 99, 0.6) 100%) !important;
  cursor: not-allowed;
  opacity: 0.5;
  transform: none !important;
}

/* ========================================
   PREMIUM SLIDER STYLING
   ======================================== */
.grid-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 95%;
  height: clamp(14px, 2.2vmin, 18px);
  outline: none;
  border-radius: 10px;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  transition: background 0.2s ease;
}

.grid-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 100%;
  cursor: pointer;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right,
    var(--slider-active-color) var(--slider-fill-percentage),
    var(--slider-color-inactive) var(--slider-fill-percentage)
  );
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  transition: background 0.2s ease;
}

.grid-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: 2px solid rgba(0, 0, 0, 0.4);
  height: calc(clamp(14px, 2.2vmin, 18px) + 16px);
  width: clamp(18px, 2.5vmin, 24px);
  border-radius: 6px;
  background: linear-gradient(145deg, #f9fafb 0%, #e5e7eb 100%);
  cursor: pointer;
  margin-top: calc(clamp(14px, 2.2vmin, 18px) / -2 + -8px);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  transition: all 0.2s ease;
}

.grid-slider::-webkit-slider-thumb:hover {
  background: linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 0 2px rgba(212, 175, 55, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
}

/* Firefox slider styling */
.grid-slider::-moz-range-track {
  width: 100%;
  height: 100%;
  cursor: pointer;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right,
    var(--slider-active-color) var(--slider-fill-percentage),
    var(--slider-color-inactive) var(--slider-fill-percentage)
  );
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  transition: background 0.2s ease;
}

.grid-slider::-moz-range-thumb {
  border: 2px solid rgba(0, 0, 0, 0.4);
  height: calc(clamp(14px, 2.2vmin, 18px) + 16px);
  width: clamp(18px, 2.5vmin, 24px);
  border-radius: 6px;
  background: linear-gradient(145deg, #f9fafb 0%, #e5e7eb 100%);
  cursor: pointer;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  transition: all 0.2s ease;
}

.grid-slider::-moz-range-thumb:hover {
  background: linear-gradient(145deg, #ffffff 0%, #f3f4f6 100%);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 0 2px rgba(212, 175, 55, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 768px) {
  .action-panel-container {
    width: 90%;
    flex-direction: column;
    gap: 10px;
  }

  .action-panel-wrapper {
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

  .actions-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto auto auto;
    grid-template-areas:
      "turn-info  turn-info"
      "fold       call"
      "raise      input"
      "slider     slider"
      "quick-bets quick-bets"
      "prev-action next-action";
  }

  .save-hand-round {
    width: 50px;
    height: 50px;
  }
}

/* Landscape optimizations - Vertical stacked layout */
@media screen and (orientation: landscape) {
  .action-panel-container {
    width: 100%;
    flex-direction: row;
    gap: 8px;
  }

  .action-panel-wrapper {
    width: 100%;
    margin: 0;
    padding: clamp(12px, 1.8vh, 20px);
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .external-controls {
    flex-direction: column;
    justify-content: flex-start;
    padding-top: clamp(12px, 1.8vh, 20px);
  }

  .color-select-round,
  .bbs-toggle-round,
  .save-hand-round {
    width: 45px;
    height: 45px;
  }

  .save-hand-round .save-icon {
    width: 20px;
    height: 20px;
  }

  .actions-grid {
    width: 100%;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto auto auto;
    gap: clamp(6px, 1vh, 10px);
    grid-template-areas:
      "turn-info  turn-info"
      "fold       call"
      "raise      input"
      "slider     slider"
      "quick-bets quick-bets"
      "prev-action next-action";
  }

  .grid-fold, .grid-call, .grid-raise, .grid-input, .btn-nav {
    height: clamp(32px, 4.5vh, 44px);
    font-size: clamp(0.75rem, 1.5vmin, 0.95rem);
    padding: 0 12px;
  }

  .grid-turn-info {
    font-size: clamp(0.8rem, 1.8vmin, 1rem);
    padding: 0.5em;
  }

  .grid-quick-bets {
    grid-template-columns: repeat(auto-fit, minmax(35px, 1fr));
    gap: clamp(3px, 0.5vw, 5px);
  }

  .grid-quick-bets button {
    padding: clamp(6px, 1.2vmin, 10px);
    font-size: clamp(0.6rem, 1.3vmin, 0.8rem);
  }

  .btn-allin {
    font-size: clamp(0.8rem, 1.5vmin, 1rem) !important;
  }

  .grid-slider {
    height: clamp(10px, 1.8vh, 14px);
  }

  .grid-slider::-webkit-slider-thumb {
    height: calc(clamp(10px, 1.8vh, 14px) + 12px);
    width: clamp(16px, 2vmin, 20px);
  }
}
</style>