<template>
  <div class="view-container">
    <!-- Panel de Configuración (visible cuando no hay mano activa) -->
    <div v-if="!handIsActive" class="configuration-panel">
      <!-- Botón de guardar minimalista en la esquina superior -->
      <button
        class="save-icon-btn"
        @click="saveConfiguration"
        :title="saveButtonText"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="save-icon">
          <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
        <span v-if="saveButtonText === '✓ Guardado'" class="saved-indicator">✓</span>
      </button>

      <h2></h2>
      <div class="config-item">
        <label for="player-count">Número de Jugadores:</label>
        <select id="player-count" v-model.number="selectedPlayers">
          <option v-for="n in 8" :key="n" :value="n + 1">{{ n + 1 }} Jugadores</option>
        </select>
      </div>
      <div class="config-item">
        <label>Ciegas:</label>
        <div class="blinds-inline-container">
          <input id="sb-input" type="number" v-model.number="sbInput" min="1" class="blind-input" placeholder="SB">
          <span class="blind-separator">/</span>
          <input id="bb-input" type="number" v-model.number="bbInput" min="1" class="blind-input" placeholder="BB">
        </div>
      </div>
      <div class="config-item">
        <label for="currency-select">Moneda:</label>
        <select
          id="currency-select"
          v-model="selectedCurrency"
          @change="handleCurrencyChange"
        >
          <option v-for="currency in displayedCurrencies" :key="currency.symbol" :value="currency.symbol">
            {{ currency.symbol }} - {{ currency.name }}
          </option>
          <option v-if="!showAllCurrencies" value="__show_more__" class="show-more-option">
            + Ver todas las monedas
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
      <button class="start-hand-btn" @click="loadHandClicked">Iniciar Mano</button>
    </div>

    <!-- Contenedor del Editor de Manos (ahora con layout de Grid) -->
    <div v-else class="hand-editor-content">
      <PokerTable />
      <ActionPanel v-if="gameStore.gamePhase !== 'replay'" v-model="tableColorForActionPanel" />
      <DisplayOptions v-else v-model="tableColorForActionPanel" />
      <CardPicker v-if="gameStore.isCardPickerOpen" />
    </div>
    
    <!-- Overlay que pide girar el dispositivo (se muestra en móvil vertical) -->
    <RotateDeviceOverlay v-if="showRotateOverlay" />

    <ConfigurationModal
      v-if="showPositionModal"
      :positions="availablePositions"
      @confirm="handlePositionSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useGameStore } from '../store/game';
import PokerTable from '../components/PokerTable.vue';
import ActionPanel from '../components/ActionPanel.vue';
import DisplayOptions from '../components/DisplayOptions.vue';
import ConfigurationModal from '../components/ConfigurationModal.vue';
import CardPicker from '../components/CardPicker.vue';
import RotateDeviceOverlay from '../components/RotateDeviceOverlay.vue';

const gameStore = useGameStore();
const handIsActive = computed(() => gameStore.gamePhase !== 'setup');
const tableColorForActionPanel = ref('#28563a');

const selectedPlayers = ref(6);
const sbInput = ref(1);
const bbInput = ref(2);
const selectedCurrency = ref('$');
const selectedSpecialRule = ref('Ninguno');
const selectedBombPotBB = ref(2);

const showRotateOverlay = ref(false);
const showAllCurrencies = ref(false);
const saveButtonText = ref('Guardar cambios');

const checkOrientation = () => {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  showRotateOverlay.value = handIsActive.value && !isPortrait && isCoarsePointer;
};

// Guardar configuración en localStorage
function saveConfiguration() {
  const config = {
    selectedPlayers: selectedPlayers.value,
    sbInput: sbInput.value,
    bbInput: bbInput.value,
    selectedCurrency: selectedCurrency.value,
    selectedSpecialRule: selectedSpecialRule.value,
    selectedBombPotBB: selectedBombPotBB.value
  };

  localStorage.setItem('handConfiguration', JSON.stringify(config));

  // Feedback visual
  saveButtonText.value = '✓ Guardado';
  setTimeout(() => {
    saveButtonText.value = 'Guardar cambios';
  }, 2000);
}

// Cargar configuración desde localStorage
function loadConfiguration() {
  const savedConfig = localStorage.getItem('handConfiguration');

  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      selectedPlayers.value = config.selectedPlayers || 6;
      sbInput.value = config.sbInput || 1;
      bbInput.value = config.bbInput || 2;
      selectedCurrency.value = config.selectedCurrency || '$';
      selectedSpecialRule.value = config.selectedSpecialRule || 'Ninguno';
      selectedBombPotBB.value = config.selectedBombPotBB || 2;
    } catch (error) {
      console.error('Error al cargar la configuración guardada:', error);
    }
  }
}

watch(handIsActive, () => {
  checkOrientation();
});

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

// Las 3 monedas más utilizadas
const topCurrencies = [
  { symbol: '$', name: 'USD - Dólar estadounidense' },
  { symbol: '€', name: 'EUR - Euro' },
  { symbol: '£', name: 'GBP - Libra esterlina' }
];

// Monedas a mostrar según el estado
const displayedCurrencies = computed(() => {
  return showAllCurrencies.value ? currencies.value : topCurrencies;
});

// Manejar el cambio de selección de moneda
function handleCurrencyChange(event) {
  if (selectedCurrency.value === '__show_more__') {
    showAllCurrencies.value = true;
    // Mantener la moneda anteriormente seleccionada o usar la primera
    selectedCurrency.value = '$';
  }
}

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
  window.addEventListener('resize', checkOrientation);
  checkOrientation();
  loadConfiguration(); // Cargar configuración guardada al iniciar
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
  window.removeEventListener('keydown', handleKeyDown);
  gameStore.pauseReplay();
});
</script>

<style scoped>
.view-container {
  width: 100%;
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
}
.configuration-panel {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 30px; padding: 3.5rem;
  max-width: 500px; margin: 1rem auto;
  background-color: #2d3748; border-radius: 12px;
  position: relative;
}

/* Botón de guardar minimalista en la esquina superior */
.save-icon-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  padding: 8px;
  background-color: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.save-icon-btn:hover {
  background-color: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
}

.save-icon-btn:active {
  transform: translateY(0);
  background-color: rgba(59, 130, 246, 0.35);
}

.save-icon {
  width: 22px;
  height: 22px;
  color: #60a5fa;
}

.saved-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #22c55e;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  animation: popIn 0.3s ease;
}

@keyframes popIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
h2 { font-size: 2.5rem; margin-bottom: -50px; }
.config-item { display: flex; flex-direction: column; align-items: center; gap: 12px; }
label { font-weight: bold; font-size: 1.2rem; }
select, input[type="number"] { padding: 15px; font-size: 1.2rem; width: 250px; text-align: center; box-sizing: border-box; border-radius: 8px; }

#currency-select {
  width: 350px;
  text-align: left;
}

.show-more-option {
  font-weight: bold;
  color: #3b82f6;
  background-color: #f0f9ff;
}

/* Contenedor de ciegas en línea */
.blinds-inline-container {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.blind-input {
  width: 100px;
  padding: 15px;
  font-size: 1.2rem;
  text-align: center;
  border-radius: 8px;
  box-sizing: border-box;
}

.blind-separator {
  font-size: 1.8rem;
  font-weight: bold;
  color: #fff;
}

/* Botón de iniciar mano */
.start-hand-btn {
  padding: 8px 35px;
  font-size: 1.4rem;
  font-weight: bold;
  border-radius: 8px;
  margin-top: 10px;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #22c55e;
}

.start-hand-btn:hover {
  background-color: #16a34a;
}

.start-hand-btn:active {
  background-color: #15803d;
}

/* --- NUEVA LÓGICA DE LAYOUT CON GRID --- */
.hand-editor-content {
  width: 100%;
  height: 100%;
  display: grid;
  /* Por defecto (escritorio), una columna con la mesa arriba y el panel abajo */
  grid-template-rows: 1fr auto;
  grid-template-columns: 100%;
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
  overflow: hidden;
}

.rotate-device-prompt { display: none; }

/* Ocultar editor y mostrar aviso en móvil vertical */
@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
  /* .rotate-device-prompt { display: flex; } */
  .hand-editor-content {
      /* display: none;  */
  }
}

/* Reorganizar layout para pantallas apaisadas y no muy altas (móviles horizontales) */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .hand-editor-content {
    /* Columna flexible para la mesa (min 0), columna fija para acciones */
    grid-template-columns: minmax(0, 1fr) minmax(280px, 350px);
    grid-template-rows: 100%; /* Una sola fila */
    gap: 10px;
    padding: 10px;
  }
}

/* Estilos para el panel de configuración en pantallas pequeñas */
@media screen and (max-width: 640px) {
  .configuration-panel { padding: 1.5rem; margin: 1rem; gap: 15px; }
  h2 { font-size: 2rem; }
  .config-item { width: 100%; }
  select, input[type="number"] { width: 100%; max-width: 350px; }
  #currency-select { width: 100%; max-width: 350px; }
  .blinds-inline-container { gap: 10px; }
  .blind-input { width: 90px; padding: 12px; font-size: 1.1rem; }
  .blind-separator { font-size: 1.5rem; }
  .start-hand-btn { width: 100%; }
  .save-icon-btn { top: 10px; right: 10px; width: 36px; height: 36px; }
  .save-icon { width: 20px; height: 20px; }
}
</style>