<template>
  <div class="action-panel-wrapper">
    
    <div class="actions-grid">
      <!-- Fila 1 -->
      <div class="grid-turn-info">{{ $t('actionPanel.turnOf') }} <strong>{{ gameStore.activePlayer?.name }}</strong></div>
      <button @click="gameStore.performAction('fold')" class="grid-fold btn-fold">{{ $t('actionPanel.fold') }}</button>
      <button @click="handleCheckCall" :disabled="isCallDisabled" class="grid-call btn-call">{{ checkOrCallLabel.toUpperCase() }}</button>
      
      <!-- Fila 2 -->
      <button @click="handleBetRaise" :disabled="isRaiseDisabled" class="grid-raise btn-raise">{{ betOrRaiseLabel.toUpperCase() }}</button>
      
      <!-- Input ahora usa 'displayRaiseAmount' para ser dinámico -->
      <input type="number" v-model="displayRaiseAmount" class="grid-input" />
      
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

      <!-- Fila 3 -->
      <div class="grid-quick-bets">
        <button @click="setRaiseAmountByPot(0.25)">25%</button>
        <button @click="setRaiseAmountByPot(0.33)">33%</button>
        <button @click="setRaiseAmountByPot(0.50)">50%</button>
        <button @click="setRaiseAmountByPot(0.75)">75%</button>
        <button @click="setRaiseAmountByPot(1)">{{ $t('actionPanel.pot') }}</button>
        <!-- BOTÓN 150% AÑADIDO -->
        <button @click="setRaiseAmountByPot(1.5)">150%</button>
        <button @click="gameStore.performAction('all-in')" class="btn-allin">{{ $t('actionPanel.allIn') }}</button>
      </div>

      <!-- Controles de la mesa -->
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

function handleCheckCall() {
  const action = amountToCall.value > 0 ? 'call' : 'check';
  gameStore.performAction(action);
}
function handleBetRaise() {
  const action = gameStore.currentBet > 0 ? 'raise' : 'bet';
  gameStore.performAction(action, raiseAmount.value);
}

// --- FUNCIÓN CORREGIDA ---
function setRaiseAmountByPot(multiplier) {
  if (!gameStore.activePlayer) return;

  // 1. CORRECCIÓN: Usar 'gameStore.totalPot' en lugar de 'gameStore.pot'.
  let betValue = Math.round(gameStore.totalPot * multiplier);
  
  // 2. Asegura que el valor calculado no sea menor que la subida mínima permitida.
  betValue = Math.max(minRaiseValue.value, betValue);

  // 3. Asegura que el valor no exceda el stack total del jugador.
  betValue = Math.min(maxSliderValue.value, betValue);

  // 4. Actualiza el `raiseAmount` con el valor final y validado.
  raiseAmount.value = betValue;
}

function handleWheelScroll(event) {
  event.preventDefault();
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
/* El CSS es idéntico al que me pasaste */
.action-panel-wrapper {
  --btn-red: #FA5637;
  --btn-red-hover: #e04a2f;
  --btn-green: #6CCF4E;
  --btn-green-hover: #59b33f;
  --btn-orange: #F5A342;
  --btn-orange-hover: #de8f32;
  --btn-purple: #AF62D1;
  --btn-purple-hover: #9c51bb;
  --btn-grey: #4A5568;
  --btn-grey-hover: #2D3748;
  --slider-color-active: #FAB76B;
  --slider-color-inactive: #1A202C;
  background-color: #2d3748;
  border-radius: 12px;
  padding: 20px;
  width: 900px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  color: white;
}
.actions-grid {
  display: grid;
  grid-template-columns: 180px 120px 1fr 120px 120px;
  grid-template-rows: auto auto auto;
  gap: 15px;
  align-items: center;
  grid-template-areas:
    "fold       call       turn-info  color-select bbs-toggle"
    "raise      input      slider     slider       slider"
    "quick-bets quick-bets quick-bets quick-bets   quick-bets";
}
.grid-turn-info { grid-area: turn-info; text-align: center; font-size: 1.4rem; }
.grid-fold { grid-area: fold; }
.grid-call { grid-area: call; }
.grid-raise { grid-area: raise; }
.grid-input { grid-area: input; }
.grid-slider { grid-area: slider; margin-right: 20px; }
.grid-quick-bets { grid-area: quick-bets; }
.grid-color-select { grid-area: color-select; }
.grid-bbs-toggle { grid-area: bbs-toggle; }
.grid-fold, .grid-call, .grid-raise {
  height: 65px;
  font-size: 1.3rem;
  font-weight: bold;
  border: 1px solid #000;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.2;
  padding: 2px;
}
.grid-input {
  height: 65px;
  border-radius: 8px;
  border: 1px solid #000;
  background-color: #1A202C;
  color: white;
  font-size: 2rem;
  text-align: center;
  width: 100%;
}
.grid-quick-bets {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.grid-quick-bets button {
  flex-grow: 1;
  padding: 12px;
  font-size: 1rem;
  border: 1px solid #000;
  border-radius: 6px;
  background-color: var(--btn-grey);
  color: white;
  cursor: pointer;
}
.grid-quick-bets button:hover {
  background-color: var(--btn-grey-hover);
}
.grid-color-select, .grid-bbs-toggle {
  height: 65px;
  padding: 0 15px;
  font-size: 1.2rem;
  font-weight: bold;
  border: 1px solid #000;
  border-radius: 8px;
  background-color: #718096;
  color: white;
  cursor: pointer;
}
.btn-fold { background-color: var(--btn-red); }
.btn-fold:hover { background-color: var(--btn-red-hover); }
.btn-call { background-color: var(--btn-green); }
.btn-call:hover { background-color: var(--btn-green-hover); }
.btn-raise { background-color: var(--btn-orange); }
.btn-raise:hover { background-color: var(--btn-orange-hover); }
.btn-allin { background-color: var(--btn-purple) !important; }
.btn-allin:hover { background-color: var(--btn-purple-hover) !important; }
button:disabled {
  background-color: #718096 !important;
  cursor: not-allowed;
  opacity: 0.6;
}
.grid-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 16px;
  background: transparent;
  outline: none;
  border-radius: 8px;
}
.grid-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 16px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #000;
  background: linear-gradient(to right, 
    var(--slider-color-active) var(--slider-fill-percentage), 
    var(--slider-color-inactive) var(--slider-fill-percentage)
  );
}
.grid-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  border: 1px solid #000;
  height: 30px;
  width: 20px;
  border-radius: 4px;
  background: #E2E8F0;
  cursor: pointer;
  margin-top: -8px;
}
.grid-slider::-moz-range-track {
  width: 100%;
  height: 16px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #000;
  background: linear-gradient(to right, 
    var(--slider-color-active) var(--slider-fill-percentage), 
    var(--slider-color-inactive) var(--slider-fill-percentage)
  );
}
.grid-slider::-moz-range-thumb {
  border: 1px solid #000;
  height: 30px;
  width: 20px;
  border-radius: 4px;
  background: #E2E8F0;
  cursor: pointer;
}
</style>