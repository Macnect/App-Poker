<template>
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

      <select class="grid-color-select" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
        <option value="#28563a">Verde</option>
        <option value="#3a4c8a">Azul</option>
        <option value="#8a3a3a">Rojo</option>
        <option value="#553c9a">Morado</option>
        <option value="#b7791f">Oro</option>
        <option value="#1A202C">Negro</option>
        <option value="#4A5568">Gris</option>
      </select>
      <button class="grid-bbs-toggle" @click="gameStore.toggleDisplayMode()">
        {{ gameStore.displayInBBs ? gameStore.currency : 'BBs' }}
      </button>
      <button @click="gameStore.saveCurrentHand()" class="grid-save btn-save-hand">Guardar Mano</button>
      <button @click="gameStore.navigateHistory(-1)" class="grid-prev btn-nav" v-if="gameStore.gamePhase !== 'replay'">◀</button>
      <button @click="gameStore.navigateHistory(1)" class="grid-next btn-nav" v-if="gameStore.gamePhase !== 'replay'">▶</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../store/game';

const { t } = useI18n();

const props = defineProps({ modelValue: String });
const emit = defineEmits(['update:modelValue']);
const gameStore = useGameStore();

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
    return gameStore.activePlayer.stack + gameStore.activePlayer.betThisRound;
});

const minRaiseValue = computed(() => {
  if (!gameStore.activePlayer) return 0;
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
    return { '--slider-fill-percentage': '100%' };
  }
  const percentage = ((current - min) / (max - min)) * 100;
  return {
    '--slider-fill-percentage': `${percentage}%`
  };
});

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

.action-panel-wrapper {
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
  padding: clamp(8px, 1.2vw, 18px);
  width: 70%;
  margin-left: 16%;

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
  gap: clamp(6px, 0.8vw, 10px);
  align-items: center;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "fold       call       turn-info  turn-info    color-select bbs-toggle"
    "raise      input      slider     slider       slider       slider"
    "quick-bets quick-bets quick-bets save-hand    prev-action  next-action";
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
.grid-color-select { grid-area: color-select; }
.grid-bbs-toggle { grid-area: bbs-toggle; }
.grid-save { grid-area: save-hand; }
.grid-prev { grid-area: prev-action; }
.grid-next { grid-area: next-action; }

/* ========================================
   PREMIUM BUTTON STYLING
   ======================================== */
.grid-fold, .grid-call, .grid-raise, .grid-input, .grid-color-select, .grid-bbs-toggle, .grid-save, .btn-nav {
  height: clamp(28px, 6vmin, 55px);
  font-size: clamp(0.85rem, 1.8vmin, 1.1rem);
  font-weight: 700;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 18px;
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

.grid-fold:hover, .grid-call:hover, .grid-raise:hover, .grid-color-select:hover, .grid-bbs-toggle:hover, .grid-save:hover, .btn-nav:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

.grid-fold:active, .grid-call:active, .grid-raise:active, .grid-color-select:active, .grid-bbs-toggle:active, .grid-save:active, .btn-nav:active {
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
  grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
  gap: clamp(3px, 0.6vw, 6px);
}

.grid-quick-bets button {
  padding: clamp(6px, 1.2vmin, 12px);
  font-size: clamp(0.7rem, 1.5vmin, 0.9rem);
  font-weight: 600;
  border-radius: 8px;
  background: var(--btn-grey);
  color: white;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

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

/* Select dropdowns premium styling */
.grid-color-select, .grid-bbs-toggle {
  background: var(--btn-grey);
  font-weight: 600;
}

.grid-color-select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
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
  grid-column: 1 / -1;
  font-size: clamp(0.9rem, 1.8vmin, 1.2rem) !important;
  letter-spacing: 0.05em;
}

.btn-allin:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  filter: brightness(1.15);
}

.btn-save-hand {
  background: var(--btn-green);
}

.btn-save-hand:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
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
  background: transparent;
  outline: none;
  border-radius: 10px;
  cursor: pointer;
}

.grid-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 100%;
  cursor: pointer;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.3);
  background: linear-gradient(to right,
    var(--slider-color-active) var(--slider-fill-percentage),
    var(--slider-color-inactive) var(--slider-fill-percentage)
  );
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
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

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 900px) {
  .actions-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto auto 1fr auto;
    grid-template-areas:
      "turn-info  turn-info"
      "fold       call"
      "raise      input"
      "slider     slider"
      "quick-bets quick-bets"
      "save-hand  save-hand"
      "prev-action next-action"
      "bbs-toggle color-select";
  }
}

@media screen and (orientation: landscape) and (max-height: 600px) {
  .action-panel-wrapper {
    margin-left: auto;
    margin-right: 0;
  }
}
</style>