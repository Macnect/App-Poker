<template>
  <div class="view-container">
    <!-- Panel de Configuración (visible cuando no hay mano activa) -->
    <div v-if="!handIsActive" class="tabs-container">
      <!-- Sistema de pestañas -->
      <div class="tabs-header">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'crear' }"
          @click="activeTab = 'crear'"
        >
          Crear Mano
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'guardadas' }"
          @click="activeTab = 'guardadas'"
        >
          Manos Guardadas
        </button>
      </div>

      <!-- Contenido de la pestaña "Crear Mano" -->
      <div v-if="activeTab === 'crear'" class="configuration-panel">
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
        <label for="game-variant-select">Tipo de Juego:</label>
        <select id="game-variant-select" v-model="selectedGameVariant">
          <option value="holdem">No-Limit Hold'em</option>
          <option value="omaha">Pot Limit Omaha</option>
          <option value="pineapple">Crazy Pineapple</option>
        </select>
      </div>
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
      <div v-if="selectedSpecialRule === 'Bomb Pot'" class="config-item">
        <label for="bomb-pot-type-select">Tipo de Bomb Pot:</label>
        <select id="bomb-pot-type-select" v-model="selectedBombPotType">
          <option value="single">Single Board</option>
          <option value="double">Double Board</option>
        </select>
      </div>
      <button class="start-hand-btn" @click="loadHandClicked">Iniciar Mano</button>
      </div>

      <!-- Contenido de la pestaña "Manos Guardadas" -->
      <div v-else-if="activeTab === 'guardadas'" class="saved-hands-container">
        <div class="filters-container">
          <div class="filter-group date-filter-group">
            <label for="date-picker">Filtrar por Fecha:</label>
            <DatePicker
              v-model="datePickerValue"
              @change="onDatePickerChange"
              placeholder="Seleccionar fecha"
            />
            <button v-if="selectedDate" @click="clearDateFilter" class="clear-date-btn" title="Limpiar filtro">
              ✕
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="loading-message">
          Cargando manos...
        </div>
        <div v-else-if="selectedDate && filteredAndSortedHands.length === 0" class="no-hands">
          No se encontraron manos para la fecha seleccionada.
        </div>
        <div v-else-if="!selectedDate && groupedHands.length === 0" class="no-hands">
          No se encontraron manos.
        </div>
        <div v-else-if="selectedDate" class="hands-container">
          <div class="selected-date-header">
            <h3>{{ formattedSelectedDate }}</h3>
            <p>{{ filteredAndSortedHands.length }} {{ filteredAndSortedHands.length === 1 ? 'mano' : 'manos' }}</p>
          </div>
          <ul class="hands-list">
            <li v-for="hand in filteredAndSortedHands" :key="hand.id">
              <div class="hand-info">
                <span><strong>Hora:</strong> {{ new Date(hand.fecha).toLocaleTimeString('es-ES') }}</span>
                <span><strong>Hero:</strong> {{ hand.posicion_heroe }}</span>
                <span><strong>Jugadores:</strong> {{ hand.cantidad_jugadores }}</span>
                <div class="badges-container">
                  <span class="game-variant-badge" :class="getGameVariantClass(hand)">
                    {{ getGameVariantLabel(hand) }}
                  </span>
                  <span v-if="hand.regla_especial === 'Bomb Pot'" class="special-rule-badge bomb-pot-badge">
                    BOMB POT
                  </span>
                  <span v-if="hand.regla_especial === 'Mississippi'" class="special-rule-badge mississippi-badge">
                    MISSISSIPPI
                  </span>
                  <span v-if="hand.regla_especial === 'Straddle'" class="special-rule-badge straddle-badge">
                    STRADDLE
                  </span>
                </div>
              </div>

              <div class="hand-preview">
                <div class="card-group hero-hand-preview">
                  <span class="group-label">Hero</span>
                  <div class="cards-display">
                    <template v-if="getHeroFromHand(hand)?.cards">
                      <PlayingCard v-for="(card, index) in getHeroFromHand(hand).cards" :key="`hero-${card}-${index}`" :cardId="card" />
                    </template>
                  </div>
                </div>
                <div class="card-group">
                  <span class="group-label">Board 1</span>
                  <div class="cards-display">
                    <template v-if="getBoardFromHand(hand).length > 0">
                      <PlayingCard v-for="(card, index) in getBoardFromHand(hand)" :key="`board-${card}-${index}`" :cardId="card" />
                    </template>
                  </div>
                </div>
                <div v-if="isDoubleBoardBombPot(hand)" class="card-group">
                  <span class="group-label">Board 2</span>
                  <div class="cards-display">
                    <template v-if="getBoard2FromHand(hand).length > 0">
                      <PlayingCard v-for="(card, index) in getBoard2FromHand(hand)" :key="`board2-${card}-${index}`" :cardId="card" />
                    </template>
                  </div>
                </div>
              </div>

              <div class="hand-actions">
                <button @click="loadHandForReplay(hand)">Cargar Replay</button>
                <button class="delete-btn" @click="confirmDelete(hand.id)">Eliminar</button>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="grouped-hands-container">
          <div v-for="group in groupedHands" :key="group.date" class="date-group">
            <h3 @click="selectedDate = group.date" class="date-header">{{ new Date(group.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</h3>
            <ul class="hands-list">
              <li v-for="hand in group.hands" :key="hand.id">
                <div class="hand-info">
                  <span><strong>Hora:</strong> {{ new Date(hand.fecha).toLocaleTimeString('es-ES') }}</span>
                  <span><strong>Hero:</strong> {{ hand.posicion_heroe }}</span>
                  <span><strong>Jugadores:</strong> {{ hand.cantidad_jugadores }}</span>
                  <div class="badges-container">
                    <span class="game-variant-badge" :class="getGameVariantClass(hand)">
                      {{ getGameVariantLabel(hand) }}
                    </span>
                    <span v-if="hand.regla_especial === 'Bomb Pot'" class="special-rule-badge bomb-pot-badge">
                      BOMB POT
                    </span>
                    <span v-if="hand.regla_especial === 'Mississippi'" class="special-rule-badge mississippi-badge">
                      MISSISSIPPI
                    </span>
                    <span v-if="hand.regla_especial === 'Straddle'" class="special-rule-badge straddle-badge">
                      STRADDLE
                    </span>
                  </div>
                </div>

                <div class="hand-preview">
                  <div class="card-group hero-hand-preview">
                    <span class="group-label">Hero</span>
                    <div class="cards-display">
                      <template v-if="getHeroFromHand(hand)?.cards">
                        <PlayingCard v-for="(card, index) in getHeroFromHand(hand).cards" :key="`hero-${card}-${index}`" :cardId="card" />
                      </template>
                    </div>
                  </div>
                  <div class="card-group">
                    <span class="group-label">Board 1</span>
                    <div class="cards-display">
                      <template v-if="getBoardFromHand(hand).length > 0">
                        <PlayingCard v-for="(card, index) in getBoardFromHand(hand)" :key="`board-${card}-${index}`" :cardId="card" />
                      </template>
                    </div>
                  </div>
                  <div v-if="isDoubleBoardBombPot(hand)" class="card-group">
                    <span class="group-label">Board 2</span>
                    <div class="cards-display">
                      <template v-if="getBoard2FromHand(hand).length > 0">
                        <PlayingCard v-for="(card, index) in getBoard2FromHand(hand)" :key="`board2-${card}-${index}`" :cardId="card" />
                      </template>
                    </div>
                  </div>
                </div>

                <div class="hand-actions">
                  <button @click="loadHandForReplay(hand)">Cargar Replay</button>
                  <button class="delete-btn" @click="confirmDelete(hand.id)">Eliminar</button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div v-if="gameStore.hasMore && !selectedDate" class="load-more-container">
          <button @click="gameStore.loadMoreHands(selectedDate)">Cargar Más</button>
        </div>

        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro de que desea eliminar esta mano?</p>
            <div class="modal-actions">
              <button class="cancel-btn" @click="closeModal">No</button>
              <button class="confirm-btn" @click="deleteAndClose">Sí</button>
            </div>
          </div>
        </div>

        <div v-if="showToast" class="toast success-toast">
          <div class="toast-icon">✓</div>
          <div class="toast-message">Mano eliminada con éxito</div>
        </div>
      </div>
    </div>

    <!-- Contenedor del Editor de Manos (ahora con layout de Grid) -->
    <div v-else class="hand-editor-content">
      <PokerTable />
      <ActionPanel v-if="gameStore.gamePhase !== 'replay'" />
      <DisplayOptions v-else />
      <CardPicker v-if="gameStore.isCardPickerOpen" />
    </div>
    
    <!-- Overlay que pide girar el dispositivo (se muestra en móvil horizontal) -->
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
import { useAuthStore } from '../store/useAuthStore';
import PokerTable from '../components/PokerTable.vue';
import ActionPanel from '../components/ActionPanel.vue';
import DisplayOptions from '../components/DisplayOptions.vue';
import ConfigurationModal from '../components/ConfigurationModal.vue';
import CardPicker from '../components/CardPicker.vue';
import RotateDeviceOverlay from '../components/RotateDeviceOverlay.vue';
import PlayingCard from '../components/PlayingCard.vue';
import DatePicker from '../components/DatePicker.vue';

const gameStore = useGameStore();
const authStore = useAuthStore();

// Estado para las pestañas
const activeTab = ref('crear');
const handIsActive = computed(() => gameStore.gamePhase !== 'setup');

const selectedGameVariant = ref('holdem');
const selectedPlayers = ref(6);
const sbInput = ref(1);
const bbInput = ref(2);
const selectedCurrency = ref('$');
const selectedSpecialRule = ref('Ninguno');
const selectedBombPotBB = ref(2);
const selectedBombPotType = ref('single');

const showRotateOverlay = ref(false);
const showAllCurrencies = ref(false);
const saveButtonText = ref('Guardar cambios');

const checkOrientation = () => {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  showRotateOverlay.value = !isPortrait && isCoarsePointer;
};

// Guardar configuración en localStorage
function saveConfiguration() {
  const config = {
    selectedGameVariant: selectedGameVariant.value,
    selectedPlayers: selectedPlayers.value,
    sbInput: sbInput.value,
    bbInput: bbInput.value,
    selectedCurrency: selectedCurrency.value,
    selectedSpecialRule: selectedSpecialRule.value,
    selectedBombPotBB: selectedBombPotBB.value,
    selectedBombPotType: selectedBombPotType.value
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
      selectedGameVariant.value = config.selectedGameVariant || 'holdem';
      selectedPlayers.value = config.selectedPlayers || 6;
      sbInput.value = config.sbInput || 1;
      bbInput.value = config.bbInput || 2;
      selectedCurrency.value = config.selectedCurrency || '$';
      selectedSpecialRule.value = config.selectedSpecialRule || 'Ninguno';
      selectedBombPotBB.value = config.selectedBombPotBB || 2;
      selectedBombPotType.value = config.selectedBombPotType || 'single';
    } catch (error) {
      console.error('Error al cargar la configuración guardada:', error);
    }
  }
}

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
    selectedSpecialRule.value === 'Bomb Pot' ? selectedBombPotBB.value : null,
    selectedSpecialRule.value === 'Bomb Pot' ? selectedBombPotType.value : 'single',
    selectedGameVariant.value
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

// ========================================
// LÓGICA DE MANOS GUARDADAS
// ========================================
const isLoading = computed(() => !authStore.isInitialized);
const selectedDate = ref(null);
const datePickerValue = ref('');
const showModal = ref(false);
const showToast = ref(false);
const selectedHandId = ref(null);

const groupedHands = computed(() => {
  const groups = {};
  gameStore.savedHands.forEach(hand => {
    const date = hand.fecha.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(hand);
  });
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
  return sortedDates.map(date => ({ date, hands: groups[date] }));
});

const filteredAndSortedHands = computed(() => {
  let hands = [...gameStore.savedHands];
  if (selectedDate.value) {
    const startOfDay = new Date(selectedDate.value + 'T00:00:00');
    const endOfDay = new Date(selectedDate.value + 'T23:59:59.999');
    hands = hands.filter(hand => {
      const handDate = new Date(hand.fecha);
      return handDate >= startOfDay && handDate <= endOfDay;
    });
  }
  hands.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  return hands;
});

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  const date = new Date(selectedDate.value + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

watch(selectedDate, (newDate) => {
  if (newDate) {
    datePickerValue.value = newDate;
  } else {
    datePickerValue.value = '';
  }
});

function loadHandForReplay(hand) {
  gameStore.loadHand(hand);
  activeTab.value = 'crear';
}

function onDatePickerChange() {
  if (datePickerValue.value) {
    selectedDate.value = datePickerValue.value;
  } else {
    selectedDate.value = null;
  }
}

function clearDateFilter() {
  selectedDate.value = null;
  datePickerValue.value = '';
}

function getHeroFromHand(hand) {
  if (!hand.historial || hand.historial.length === 0) return null;
  const finalState = hand.historial[hand.historial.length - 1];
  return finalState.players.find(p => p.name === 'Hero');
}

function getBoardFromHand(hand) {
  if (!hand.historial || hand.historial.length === 0) return [];
  const finalState = hand.historial[hand.historial.length - 1];
  return finalState.board.filter(card => card);
}

function getBoard2FromHand(hand) {
  if (!hand.historial || hand.historial.length === 0) return [];
  const finalState = hand.historial[hand.historial.length - 1];
  return finalState.board2 ? finalState.board2.filter(card => card) : [];
}

function isDoubleBoardBombPot(hand) {
  return hand.bomb_pot_type === 'double' && hand.regla_especial === 'Bomb Pot';
}

function getGameVariantLabel(hand) {
  if (hand.game_variant === 'omaha') return 'Omaha';
  if (hand.game_variant === 'pineapple') return 'Pineapple';
  return "Hold'em";
}

function getGameVariantClass(hand) {
  if (hand.game_variant === 'omaha') return 'variant-omaha';
  if (hand.game_variant === 'pineapple') return 'variant-pineapple';
  return 'variant-holdem';
}

function confirmDelete(handId) {
  selectedHandId.value = handId;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  selectedHandId.value = null;
}

async function deleteAndClose() {
  if (selectedHandId.value) {
    await gameStore.deleteHand(selectedHandId.value);
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
    closeModal();
  }
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
  overflow-y: auto;
  box-sizing: border-box;
}

/* ========================================
   TABS CONTAINER & HEADER - Premium Style
   ======================================== */
.tabs-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tabs-header {
  display: flex;
  gap: 0;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px 16px 0 0;
  padding: 8px;
  margin: 1.5rem 1.5rem 0 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.tab-btn {
  flex: 1;
  padding: 14px 24px;
  font-size: 1.05rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  color: #d1d5db;
  letter-spacing: 0.025em;
}

.tab-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  color: #f9fafb;
}

.tab-btn.active {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  color: #1f2937;
  font-weight: 700;
  box-shadow:
    0 4px 12px rgba(212, 175, 55, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transform: translateY(-2px);
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
  padding: 2.5rem 2.5rem 1.5rem 2.5rem;
  max-width: 520px;
  margin: 0 auto 1.5rem auto;

  /* Premium glass card effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 0 0 20px 20px;
  border-top: none;

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
/* Default: vertical stacking for portrait mode */
.hand-editor-content {
  width: 100%;
  max-width: 100vw;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: 100%;
  grid-template-areas:
    "table"
    "controls";
  gap: 20px;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* Explicit grid area assignments for child components */
.hand-editor-content > :nth-child(1) {
  grid-area: table;
  min-height: 0;
  min-width: 0;
}

.hand-editor-content > :nth-child(2) {
  grid-area: controls;
  min-height: 0;
  min-width: 0;
}

.rotate-device-prompt {
  display: none;
}

/* ========================================
    RESPONSIVE DESIGN - Mobile & Tablet
    ======================================== */

/* Landscape mode (including mobile) - horizontal layout */
@media screen and (orientation: landscape) {
  .hand-editor-content {
    grid-template-columns: 1fr minmax(300px, 360px);
    grid-template-rows: 100%;
    grid-template-areas: "table controls";
    gap: 16px;
    padding: 14px;
    align-items: stretch;
  }

  /* Ensure table area uses all available space */
  .hand-editor-content > :nth-child(1) {
    width: 100%;
    height: 100%;
  }

  /* Ensure controls area is properly sized */
  .hand-editor-content > :nth-child(2) {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

/* Landscape mode - Configuration panel optimizations */
@media screen and (orientation: landscape) {
  .configuration-panel {
    padding: 2rem 1.5rem 1.5rem 1.5rem;
    margin: 0.5rem auto;
    gap: 12px;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  h2 {
    font-size: 1.4rem;
    margin-bottom: 0;
  }

  .config-item {
    gap: 10px;
  }

  label {
    font-size: 0.85rem;
  }

  select,
  input[type="number"] {
    padding: 12px 16px;
    font-size: 1rem;
    width: 240px;
  }

  #currency-select {
    width: 320px;
    padding-left: 20px;
  }

  .blinds-inline-container {
    gap: 12px;
  }

  .blind-input {
    width: 95px;
    padding: 12px 16px;
    font-size: 1.1rem;
  }

  .blind-separator {
    font-size: 1.6rem;
  }

  .start-hand-btn {
    padding: 14px 38px;
    font-size: 1.15rem;
    margin-top: 10px;
  }

  .save-icon-btn {
    top: 14px;
    right: 14px;
    width: 38px;
    height: 38px;
  }

  .save-icon {
    width: 20px;
    height: 20px;
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

/* ========================================
   SAVED HANDS CONTAINER - Premium Style
   ======================================== */
.saved-hands-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto 1.5rem auto;
  flex: 1;
  overflow-y: auto;
}

h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #d4af37;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.025em;
  text-transform: capitalize;
}

.loading-message, .no-hands {
  margin-top: 3rem;
  text-align: center;
  color: #d1d5db;
  font-size: 1.2rem;
  font-weight: 500;
}

/* ========================================
   FILTERS CONTAINER - Premium Card
   ======================================== */
.filters-container {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-filter-group {
  flex: 1;
  min-width: 280px;
}

.filter-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.clear-date-btn {
  width: 38px;
  height: 38px;
  padding: 0;
  font-size: 1.2rem;
  font-weight: 700;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid rgba(220, 38, 38, 0.3);
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.6) 0%, rgba(185, 28, 28, 0.8) 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.clear-date-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(185, 28, 28, 1) 100%);
  transform: scale(1.05);
  box-shadow:
    0 4px 8px rgba(220, 38, 38, 0.4),
    0 0 12px rgba(220, 38, 38, 0.2);
}

/* ========================================
   SELECTED DATE HEADER - Premium
   ======================================== */
.selected-date-header {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
}

.selected-date-header p {
  font-size: 1rem;
  font-weight: 500;
  color: #d1d5db;
  margin: 0;
}

/* ========================================
   GROUPED HANDS CONTAINER
   ======================================== */
.grouped-hands-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.date-group {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
}

.date-header {
  cursor: pointer;
  color: #d4af37;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-bottom: 1.5px solid rgba(212, 175, 55, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
  text-transform: capitalize;
}

.date-header:hover {
  color: #f0d060;
  border-bottom-color: rgba(212, 175, 55, 0.5);
  transform: translateX(5px);
}

/* ========================================
   HANDS LIST - Premium Cards
   ======================================== */
.hands-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hands-list li {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.15);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.hands-list li:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateX(5px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.hand-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  flex-basis: 200px;
  flex-shrink: 0;
  color: #d1d5db;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
}

.hand-info span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.hand-info strong {
  color: #d4af37;
  font-weight: 600;
}

.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.game-variant-badge,
.special-rule-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.variant-holdem {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.variant-omaha {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.7) 0%, rgba(126, 34, 206, 0.8) 100%);
  color: white;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.variant-pineapple {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.7) 0%, rgba(219, 39, 119, 0.8) 100%);
  color: white;
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.bomb-pot-badge {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.7) 0%, rgba(220, 38, 38, 0.8) 100%);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.mississippi-badge {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.7) 0%, rgba(217, 119, 6, 0.8) 100%);
  color: white;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.straddle-badge {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.7) 0%, rgba(5, 150, 105, 0.8) 100%);
  color: white;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.hand-preview {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.card-group {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
}

.group-label {
  font-weight: 600;
  font-size: 1.05rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  font-size: 0.95rem;
}

.cards-display {
  display: flex;
  gap: 5px;
}

.cards-display :deep(.playing-card) {
  width: 45px;
  height: 63px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.cards-display :deep(.rank) {
  font-size: 1.5rem;
}

.cards-display :deep(.suit-icon) {
  font-size: 1rem;
}

.hero-hand-preview {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1.5px solid rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.08);
  width: fit-content;
}

/* ========================================
   HAND ACTIONS - Premium Buttons
   ======================================== */
.hand-actions {
  display: flex;
  gap: 0.75rem;
}

.hand-actions button {
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.hand-actions button:not(.delete-btn) {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  box-shadow:
    0 2px 6px rgba(4, 120, 87, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.hand-actions button:not(.delete-btn):hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(4, 120, 87, 0.4),
    0 0 16px rgba(4, 120, 87, 0.2);
}

.delete-btn {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(185, 28, 28, 0.9) 100%);
  color: white;
  box-shadow:
    0 2px 6px rgba(220, 38, 38, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.delete-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(185, 28, 28, 1) 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(220, 38, 38, 0.4),
    0 0 16px rgba(220, 38, 38, 0.2);
}

/* ========================================
   MODAL - Premium Overlay
   ======================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(212, 175, 55, 0.03);
  animation: modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #f9fafb;
}

.modal-content p {
  margin: 0 0 2rem 0;
  color: #d1d5db;
  font-size: 1.1rem;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-btn, .confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-btn {
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.8) 0%, rgba(45, 55, 72, 1) 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cancel-btn:hover {
  background: linear-gradient(135deg, rgba(74, 85, 104, 1) 0%, rgba(45, 55, 72, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.confirm-btn {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 1) 100%);
  color: white;
  box-shadow:
    0 2px 6px rgba(220, 38, 38, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 1) 0%, rgba(185, 28, 28, 1) 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(220, 38, 38, 0.5),
    0 0 20px rgba(220, 38, 38, 0.2);
}

/* ========================================
   TOAST NOTIFICATIONS - Premium
   ======================================== */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 1000;
  animation: slideInToast 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInToast {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.success-toast {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
}

.toast-icon {
  font-size: 1.6rem;
  font-weight: bold;
}

.toast-message {
  font-size: 1.05rem;
  font-weight: 600;
}

/* ========================================
   LOAD MORE BUTTON - Premium
   ======================================== */
.load-more-container {
  text-align: center;
  margin-top: 2.5rem;
  margin-bottom: 2rem;
}

.load-more-container button {
  padding: 12px 28px;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  color: #f9fafb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.load-more-container button:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-3px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 16px rgba(212, 175, 55, 0.08);
}

/* ========================================
   RESPONSIVE DESIGN - Saved Hands
   ======================================== */
@media (max-width: 768px) {
  .saved-hands-container {
    padding: 1rem;
  }

  .hands-list li {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .hand-info {
    flex-direction: column;
    flex-basis: auto;
    width: 100%;
    font-size: 0.85rem;
    gap: 0.3rem;
  }

  .game-variant-badge,
  .special-rule-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }

  .badges-container {
    gap: 0.25rem;
  }

  .hand-preview {
    justify-content: space-around;
    width: 100%;
  }

  .card-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .cards-display {
    flex: 1;
    gap: 3px;
    overflow-x: auto;
    max-width: 100%;
  }

  .cards-display :deep(.playing-card) {
    width: 32px;
    height: 45px;
    flex-shrink: 0;
  }

  .cards-display :deep(.rank) {
    font-size: 1.05rem;
  }

  .cards-display :deep(.suit-icon) {
    font-size: 0.8rem;
  }

  .hero-hand-preview {
    padding: 6px 8px;
  }

  .hand-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .filters-container {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .date-filter-group {
    width: 100%;
    min-width: unset;
  }

  .filter-group label {
    font-size: 0.85rem;
  }

  .clear-date-btn {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .date-header {
    font-size: 1.1rem;
  }

  .tabs-header {
    margin: 1rem 1rem 0 1rem;
    padding: 6px;
  }

  .tab-btn {
    padding: 12px 18px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .cards-display :deep(.playing-card) {
    width: 30px;
    height: 42px;
  }

  .cards-display :deep(.rank) {
    font-size: 1rem;
  }

  .cards-display :deep(.suit-icon) {
    font-size: 0.75rem;
  }

  .cards-display {
    gap: 3px;
  }

  .tabs-header {
    margin: 0.75rem 0.75rem 0 0.75rem;
  }

  .tab-btn {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .cards-display :deep(.playing-card) {
    width: 28px;
    height: 39px;
  }

  .cards-display :deep(.rank) {
    font-size: 1rem;
  }

  .cards-display :deep(.suit-icon) {
    font-size: 0.75rem;
  }

  .cards-display {
    gap: 2px;
  }

  .hero-hand-preview {
    padding: 5px 6px;
  }

  .group-label {
    font-size: 0.85rem;
    min-width: 50px;
  }
}
</style>