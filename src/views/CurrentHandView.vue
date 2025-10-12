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

      <h2>Generar Mano</h2>
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
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   Inspired by high-end casinos & modern poker apps
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

/* Apply Poppins font to all elements */
* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1; /* Enhanced legibility */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.view-container {
  width: 100%;
  max-width: 100vw;
  height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-x: hidden;
  overflow-y: auto; /* Permite scroll solo si el contenido excede la altura */
}

/* ========================================
   CONFIGURATION PANEL - Premium Card Style
   ======================================== */
.configuration-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 2.5rem 2.5rem 1.5rem 2.5rem; /* Reduced padding for better fit */
  max-width: 520px;
  margin: 0.5rem auto;

  /* Premium glass card effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;

  /* Multi-layer shadow for depth - Subtle version */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(212, 175, 55, 0.03);

  position: relative;
  backdrop-filter: blur(10px);

  /* Subtle animation on mount */
  animation: cardSlideIn 0.5s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium accent line at top - Subtle version */
.configuration-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(212, 175, 55, 0.3) 50%,
    transparent 100%
  );
  border-radius: 0 0 4px 4px;
}

/* ========================================
   SAVE BUTTON - Premium Icon Style
   ======================================== */
.save-icon-btn {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 44px;
  height: 44px;
  padding: 10px;

  /* Premium button styling */
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  border-radius: 12px;

  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;

  /* Subtle glow effect */
  box-shadow:
    0 2px 8px rgba(212, 175, 55, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.save-icon-btn:hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 4px 16px rgba(212, 175, 55, 0.15),
    0 0 20px rgba(212, 175, 55, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.save-icon-btn:active {
  transform: translateY(-1px) scale(1.02);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.25) 100%);
}

.save-icon {
  width: 24px;
  height: 24px;
  color: #d4af37;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.2));
  transition: all 0.3s ease;
}

.save-icon-btn:hover .save-icon {
  filter: drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3));
}

.saved-indicator {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid rgba(10, 14, 26, 0.95);
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);
  animation: popInGlow 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popInGlow {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ========================================
   TYPOGRAPHY - Premium Hierarchy
   ======================================== */
h2 {
  font-size: 1.8rem;
  margin-bottom: 0;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

/* ========================================
   FORM ELEMENTS - Refined Inputs
   ======================================== */
.config-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  width: 100%;
}

label {
  font-weight: 600;
  font-size: 1.1rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  font-size: 0.95rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* Shared input/select styling */
select,
input[type="number"] {
  padding: 16px 20px;
  font-size: 1.15rem;
  font-weight: 500;
  width: 280px;
  text-align: center;
  box-sizing: border-box;
  border-radius: 12px;

  /* Premium dark theme styling */
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

select:hover,
input[type="number"]:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 8px rgba(212, 175, 55, 0.05);
}

select:focus,
input[type="number"]:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

/* Dropdown options styling - Dark background for readability */
select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

select option:hover,
select option:focus,
select option:checked {
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  color: #d4af37;
}

/* Currency select - wider for better readability */
#currency-select {
  width: 380px;
  text-align: left;
  padding-left: 24px;
}

.show-more-option {
  font-weight: 600;
  color: #d4af37;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%) !important;
}

/* ========================================
   BLINDS INPUT - Side by Side Premium
   ======================================== */
.blinds-inline-container {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.blind-input {
  width: 110px;
  padding: 16px 20px;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  border-radius: 12px;
  box-sizing: border-box;

  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.blind-input:hover {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 8px rgba(212, 175, 55, 0.05);
}

.blind-input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.blind-separator {
  font-size: 2rem;
  font-weight: 300;
  color: rgba(212, 175, 55, 0.6);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.15);
  user-select: none;
}

/* ========================================
   START HAND BUTTON - Premium CTA
   ======================================== */
.start-hand-btn {
  padding: 18px 48px;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 14px;
  margin-top: 16px;
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  /* Premium emerald gradient */
  background: linear-gradient(135deg, #047857 0%, #059669 100%);

  /* Multi-layer shadow for depth - Subtle version */
  box-shadow:
    0 4px 6px -1px rgba(4, 120, 87, 0.3),
    0 10px 20px -3px rgba(4, 120, 87, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 -2px 0 rgba(0, 0, 0, 0.15) inset;

  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Shine effect overlay */
.start-hand-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.start-hand-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(4, 120, 87, 0.35),
    0 16px 32px -4px rgba(4, 120, 87, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 0 24px rgba(4, 120, 87, 0.15),
    0 -2px 0 rgba(0, 0, 0, 0.15) inset;
}

.start-hand-btn:hover::before {
  left: 100%;
}

.start-hand-btn:active {
  transform: translateY(-1px) scale(1);
  box-shadow:
    0 4px 8px -1px rgba(4, 120, 87, 0.4),
    0 8px 16px -2px rgba(4, 120, 87, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 1px 0 rgba(0, 0, 0, 0.3) inset;
}

/* ========================================
   HAND EDITOR LAYOUT - Grid System
   ======================================== */
.hand-editor-content {
  width: 100%;
  max-width: 100vw;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 100%;
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: hidden;
}

.rotate-device-prompt {
  display: none;
}

/* ========================================
   RESPONSIVE DESIGN - Mobile & Tablet
   ======================================== */

/* Mobile portrait - hide editor, show rotation prompt */
@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
  .hand-editor-content {
    /* display: none; */
  }
}

/* Mobile landscape - side-by-side layout */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .hand-editor-content {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 350px);
    grid-template-rows: 100%;
    gap: 10px;
    padding: 10px;
  }
}

/* Small screens - responsive adjustments */
@media screen and (max-width: 640px) {
  .configuration-panel {
    padding: 3.5rem 1.5rem 2rem 1.5rem; /* Maintain top padding for save button */
    margin: 1rem;
    gap: 20px;
    border-radius: 16px;
  }

  h2 {
    font-size: 2rem;
  }

  .config-item {
    width: 100%;
  }

  label {
    font-size: 0.9rem;
  }

  select,
  input[type="number"] {
    width: 100%;
    max-width: 350px;
    padding: 14px 18px;
    font-size: 1.1rem;
  }

  #currency-select {
    width: 100%;
    max-width: 350px;
    padding-left: 18px;
  }

  .blinds-inline-container {
    gap: 12px;
  }

  .blind-input {
    width: 95px;
    padding: 14px 16px;
    font-size: 1.15rem;
  }

  .blind-separator {
    font-size: 1.6rem;
  }

  .start-hand-btn {
    width: 100%;
    padding: 16px 32px;
    font-size: 1.25rem;
  }

  .save-icon-btn {
    top: 14px;
    right: 14px;
    width: 40px;
    height: 40px;
  }

  .save-icon {
    width: 22px;
    height: 22px;
  }
}

/* Extra small screens */
@media screen and (max-width: 380px) {
  .configuration-panel {
    padding: 3rem 1rem 1.5rem 1rem; /* Maintain top padding for save button */
    gap: 16px;
  }

  .blind-input {
    width: 85px;
    padding: 12px 14px;
  }

  .start-hand-btn {
    padding: 14px 28px;
    font-size: 1.15rem;
  }
}
</style>