<template>
  <div class="view-container">
    <div v-if="!handIsActive" class="configuration-panel">
      <h2>Configuración de la Mano</h2>

      <div class="config-item">
        <label for="player-count">Número de Jugadores:</label>
        <select id="player-count" v-model.number="selectedPlayers">
          <option v-for="n in 8" :key="n" :value="n + 1">
            {{ n + 1 }} Jugadores
          </option>
        </select>
      </div>
      
      <div class="blinds-container">
        <div class="config-item">
          <label for="sb-input">Ciega Pequeña:</label>
          <input id="sb-input" type="number" v-model.number="sbInput" min="1">
        </div>
        <div class="config-item">
          <label for="bb-input">Ciega Grande:</label>
          <input id="bb-input" type="number" v-model.number="bbInput" min="1">
        </div>
      </div>
      
      <div class="config-item">
        <label for="currency-select">Moneda:</label>
        <select id="currency-select" v-model="selectedCurrency">
          <option v-for="currency in currencies" :key="currency.symbol" :value="currency.symbol">
            {{ currency.symbol }} - {{ currency.name }}
          </option>
        </select>
      </div>

      <div class="config-item">
        <label for="special-rule-select">Regla Especial:</label>
        <select id="special-rule-select" v-model="selectedSpecialRule">
          <option value="Ninguno">Ninguno</option>
          <option value="Straddle">Straddle</option>
          <option value="Mississippi">Mississippi</option>
          <option value="Bomb Pot">Bomb Pot</option>
        </select>
      </div>

      <div v-if="selectedSpecialRule === 'Bomb Pot'" class="config-item">
        <label for="bomb-pot-bb-select">Bomb Pot BB:</label>
        <select id="bomb-pot-bb-select" v-model="selectedBombPotBB">
          <option value="2">2bb</option>
          <option value="3">3bb</option>
          <option value="4">4bb</option>
          <option value="5">5bb</option>
        </select>
      </div>

      <button @click="loadHandClicked">Iniciar Mano</button>
    </div>

    <!-- Contenedor del Editor de Manos (se oculta en móvil vertical) -->
    <div v-else class="hand-editor-content">
      <PokerTable />
      <CardPicker v-if="gameStore.isCardPickerOpen" />
    </div>
    
    <!-- Overlay que pide girar el dispositivo (se muestra en móvil vertical) -->
    <RotateDeviceOverlay class="rotate-device-prompt" />

    <ConfigurationModal
      v-if="showPositionModal"
      :positions="availablePositions"
      @confirm="handlePositionSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/game';
import PokerTable from '../components/PokerTable.vue';
import ConfigurationModal from '../components/ConfigurationModal.vue';
import CardPicker from '../components/CardPicker.vue';
// Importamos el componente de overlay para la rotación
import RotateDeviceOverlay from '../components/RotateDeviceOverlay.vue';

const gameStore = useGameStore();
const handIsActive = computed(() => gameStore.gamePhase !== 'setup');

const selectedPlayers = ref(6);
const sbInput = ref(1);
const bbInput = ref(2);
const selectedCurrency = ref('$');
const selectedSpecialRule = ref('Ninguno');
const selectedBombPotBB = ref(2);

const currencies = ref([
  { symbol: '$', name: 'USD - Dólar estadounidense' },
  { symbol: '€', name: 'EUR - Euro' },
  { symbol: '¥', name: 'JPY - Yen japonés' },
  { symbol: '£', name: 'GBP - Libra esterlina' },
  { symbol: 'A$', name: 'AUD - Dólar australiano' },
  { symbol: 'C$', name: 'CAD - Dólar canadiense' },
  { symbol: 'CHF', name: 'CHF - Franco suizo' },
  { symbol: 'CN¥', name: 'CNY - Yuan chino' },
  { symbol: 'SEK', name: 'SEK - Corona sueca' },
  { symbol: 'NZ$', name: 'NZD - Dólar neozelandés' },
  { symbol: 'Mex$', name: 'MXN - Peso mexicano' },
  { symbol: 'S$', name: 'SGD - Dólar de Singapur' },
  { symbol: 'HK$', name: 'HKD - Dólar de Hong Kong' },
  { symbol: 'NOK', name: 'NOK - Corona noruega' },
  { symbol: '₩', name: 'KRW - Won surcoreano' },
  { symbol: '₺', name: 'TRY - Lira turca' },
  { symbol: '₽', name: 'RUB - Rublo ruso' },
  { symbol: '₹', name: 'INR - Rupia india' },
  { symbol: 'R$', name: 'BRL - Real brasileño' },
  { symbol: 'R', name: 'ZAR - Rand sudafricano' },
  { symbol: 'zł', name: 'PLN - Zloty polaco' },
  { symbol: '฿', name: 'THB - Baht tailandés' },
  { symbol: 'Rp', name: 'IDR - Rupia indonesia' },
  { symbol: 'Ft', name: 'HUF - Forinto húngaro' },
  { symbol: 'Kč', name: 'CZK - Corona checa' },
  { symbol: '₪', name: 'ILS - Nuevo séquel israelí' },
  { symbol: 'CLP$', name: 'CLP - Peso chileno' },
  { symbol: '₱', name: 'PHP - Peso filipino' },
  { symbol: 'د.إ', name: 'AED - Dírham de los EAU' },
  { symbol: 'Col$', name: 'COP - Peso colombiano' }
]);

const showPositionModal = ref(false);

const availablePositions = computed(() => {
  return getPositionsForCount(selectedPlayers.value);
});

function loadHandClicked() {
  showPositionModal.value = true;
}

function handlePositionSelected(heroPosition) {
  showPositionModal.value = false;
  gameStore.setupNewHand(
    selectedPlayers.value,
    heroPosition,
    selectedCurrency.value,
    sbInput.value,
    bbInput.value,
    selectedSpecialRule.value,
    selectedSpecialRule.value === 'Bomb Pot' ? selectedBombPotBB.value : null
  );
}

function getPositionsForCount(numPlayers) {
  if (numPlayers === 2) { return ['BTN / SB', 'BB']; }
  if (numPlayers === 3) { return ['BTN', 'SB', 'BB']; }
  if (numPlayers === 4) { return ['BTN', 'SB', 'BB', 'CO']; }
  if (numPlayers === 5) { return ['BTN', 'SB', 'BB', 'MP', 'CO']; }
  if (numPlayers === 6) { return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO']; }
  if (numPlayers === 7) { return ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO']; }
  if (numPlayers === 8) { return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO']; }
  if (numPlayers === 9) { return ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO']; }
  return [];
}

function handleKeyDown(event) {
  if (!handIsActive.value) return;
  if (document.activeElement.tagName === 'INPUT' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    return;
  }
  if (event.key === 'ArrowRight') gameStore.navigateHistory(1);
  else if (event.key === 'ArrowLeft') gameStore.navigateHistory(-1);
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  gameStore.pauseReplay();
});
</script>

<style scoped>
.view-container {
  width: 100%;
}
.configuration-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 3.5rem;
  max-width: 500px;
  margin: 5rem auto;
  background-color: #2d3748;
  border-radius: 12px;
}
h2 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}
.config-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
label {
  font-weight: bold;
  font-size: 1.2rem;
}
select, input[type="number"] {
  padding: 15px;
  font-size: 1.2rem;
  width: 250px;
  text-align: center;
  box-sizing: border-box;
  border-radius: 8px;
}
#currency-select {
  width: 350px;
  text-align: left;
}
.blinds-container {
  display: flex;
  gap: 20px;
}
.blinds-container .config-item {
  width: auto;
}
.blinds-container input {
  width: 150px;
}
button {
  padding: 18px 35px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 8px;
  margin-top: 10px;
}

/* --- LÓGICA DE VISIBILIDAD PARA EL EDITOR DE MANOS --- */

/* Por defecto, el prompt de rotación está oculto */
.rotate-device-prompt {
  display: none;
}

/* Media query para dispositivos táctiles (la mayoría de móviles y tablets) */
@media (hover: none) and (pointer: coarse) {
  /* Si el dispositivo está en vertical (portrait)... */
  @media (orientation: portrait) {
    /* ...mostramos el prompt de rotación... */
    .rotate-device-prompt {
      display: flex;
    }
    /* ...y ocultamos el contenido del editor. */
    .hand-editor-content {
      display: none;
    }
  }
}

/* --- ESTILOS RESPONSIVOS PARA EL PANEL DE CONFIGURACIÓN --- */
@media screen and (max-width: 640px) {
  .configuration-panel {
    padding: 2rem;
    margin: 2rem 1rem;
    gap: 20px;
  }
  h2 {
    font-size: 2rem;
  }
  .config-item {
    width: 100%;
  }
  select, input[type="number"] {
    width: 100%;
    max-width: 350px;
  }
  .blinds-container {
    flex-direction: column;
    width: 100%;
  }
  .blinds-container .config-item,
  .blinds-container input {
    width: 100%;
  }
  button {
    width: 100%;
  }
}
</style>