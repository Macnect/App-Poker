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
.action-panel-wrapper {
  --btn-red: #f95f41;
  --btn-green: #70b75b;
  --btn-orange: #e39e49;
  --btn-purple: #a955cd;
  --btn-grey: #4A5568;
  --slider-color-active: #FAB76B;
  --slider-color-inactive: #1A202C;
  
  background-color: #2d3748;
  border-radius: 12px;
  padding: clamp(10px, 1.5vw, 20px);
  width: 90%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: clamp(2px, 0.4vw, 3px) solid var(--border-color);
  color: white;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
}

.actions-grid {
  width: 100%;
  display: grid;
  gap: clamp(8px, 1.2vw, 15px);
  align-items: center;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "fold       call       turn-info  color-select bbs-toggle"
    "raise      input      slider     slider       slider"
    "quick-bets quick-bets quick-bets quick-bets   quick-bets";
}

.grid-turn-info { grid-area: turn-info; text-align: center; font-size: clamp(1rem, 2.5vmin, 1.4rem); }
.grid-fold { grid-area: fold; }
.grid-call { grid-area: call; }
.grid-raise { grid-area: raise; }
.grid-input { grid-area: input; }
.grid-slider { grid-area: slider; }
.grid-quick-bets { grid-area: quick-bets; }
.grid-color-select { grid-area: color-select; }
.grid-bbs-toggle { grid-area: bbs-toggle; }

.grid-fold, .grid-call, .grid-raise, .grid-input, .grid-color-select, .grid-bbs-toggle {
  height: clamp(40px, 8vmin, 65px);
  font-size: clamp(0.8rem, 2.2vmin, 1.3rem);
  font-weight: bold;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  box-sizing: border-box;
  padding: 0 5px;
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.grid-input { background-color: #1A202C; text-align: center; width: 100%; }
.all-in-indicator { display: none; }

.grid-quick-bets { display: grid; grid-template-columns: repeat(auto-fit, minmax(40px, 1fr)); gap: 5px; }
.grid-quick-bets button {
  padding: clamp(6px, 1.5vmin, 12px);
  font-size: clamp(0.7rem, 1.8vmin, 1rem);
  border-radius: 6px;
  background-color: var(--btn-grey);
  color: white;
  cursor: pointer;
  border: 1px solid #000;
}

.grid-color-select, .grid-bbs-toggle { background-color: #718096; }
.btn-fold { background-color: var(--btn-red); }
.btn-call { background-color: var(--btn-green); }
.btn-raise { background-color: var(--btn-orange); }
.btn-allin { background-color: var(--btn-purple) !important; grid-column: 1 / -1; }
button:disabled, .grid-slider:disabled { background-color: #718096 !important; cursor: not-allowed; opacity: 0.6; }

.grid-slider { -webkit-appearance: none; appearance: none; width: 90%; height: clamp(12px, 2.2vmin, 16px); background: transparent; outline: none; border-radius: 8px; }
.grid-slider::-webkit-slider-runnable-track { width: 100%; height: 100%; cursor: pointer; border-radius: 8px; border: 1px solid #000; background: linear-gradient(to right, var(--slider-color-active) var(--slider-fill-percentage), var(--slider-color-inactive) var(--slider-fill-percentage)); }
.grid-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; border: 1px solid #000; height: calc(clamp(12px, 2.2vmin, 16px) + 14px); width: clamp(15px, 2.5vmin, 20px); border-radius: 4px; background: #E2E8F0; cursor: pointer; margin-top: calc(clamp(12px, 2.2vmin, 16px) / -2 + -7px); }

/* Media query para compactar el layout en contenedores más estrechos que el diseño ideal */
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
      "bbs-toggle color-select";
  }
}
</style>