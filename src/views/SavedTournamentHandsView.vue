<template>
  <div class="saved-hands-container">
    <h2>Manos Guardadas de Torneos</h2>

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
              <span v-if="hand.tournament_type" class="tournament-type-badge">
                {{ hand.tournament_type }}
              </span>
              <span v-if="hand.is_itm" class="itm-badge">
                ITM
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
              <span class="group-label">Board</span>
              <div class="cards-display">
                <template v-if="getBoardFromHand(hand).length > 0">
                  <PlayingCard v-for="(card, index) in getBoardFromHand(hand)" :key="`board-${card}-${index}`" :cardId="card" />
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
                <span v-if="hand.tournament_type" class="tournament-type-badge">
                  {{ hand.tournament_type }}
                </span>
                <span v-if="hand.is_itm" class="itm-badge">
                  ITM
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
                <span class="group-label">Board</span>
                <div class="cards-display">
                  <template v-if="getBoardFromHand(hand).length > 0">
                    <PlayingCard v-for="(card, index) in getBoardFromHand(hand)" :key="`board-${card}-${index}`" :cardId="card" />
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

    <div v-if="tournamentStore.hasMore && !selectedDate" class="load-more-container">
      <button @click="tournamentStore.loadMoreHands(selectedDate)">Cargar Más</button>
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

    <RotateDeviceOverlay v-if="showRotateOverlay" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useTournamentStore } from '../store/tournament'
import { useAuthStore } from '../store/useAuthStore'
import PlayingCard from '../components/PlayingCard.vue';
import RotateDeviceOverlay from '../components/RotateDeviceOverlay.vue';
import DatePicker from '../components/DatePicker.vue';

const tournamentStore = useTournamentStore();
const authStore = useAuthStore();
const emit = defineEmits(['switch-view']);

const isLoading = computed(() => !authStore.isInitialized);

const selectedDate = ref(null);
const datePickerValue = ref('');

const showModal = ref(false);
const showToast = ref(false);
const selectedHandId = ref(null);

const showRotateOverlay = ref(false);

const checkOrientation = () => {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  showRotateOverlay.value = !isPortrait && isCoarsePointer;
};

const groupedHands = computed(() => {
  const groups = {};
  tournamentStore.savedHands.forEach(hand => {
    const date = hand.fecha.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(hand);
  });
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
  return sortedDates.map(date => ({ date, hands: groups[date] }));
});

const filteredAndSortedHands = computed(() => {
  let hands = [...tournamentStore.savedHands];
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

function loadHandForReplay(hand) { tournamentStore.loadHand(hand); emit('switch-view', 'TournamentHandView'); }

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
function getHeroFromHand(hand) { if (!hand.historial || hand.historial.length === 0) return null; const finalState = hand.historial[hand.historial.length - 1]; return finalState.players.find(p => p.name === 'Hero'); }
function getBoardFromHand(hand) { if (!hand.historial || hand.historial.length === 0) return []; const finalState = hand.historial[hand.historial.length - 1]; return finalState.board.filter(card => card); }
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
function confirmDelete(handId) { selectedHandId.value = handId; showModal.value = true; }
function closeModal() { showModal.value = false; selectedHandId.value = null; }
async function deleteAndClose() {
  if (selectedHandId.value) {
    await tournamentStore.deleteHand(selectedHandId.value);
    showToast.value = true;
    setTimeout(() => { showToast.value = false; }, 3000);
    closeModal();
  }
}

onMounted(() => {
  window.addEventListener('resize', checkOrientation);
  checkOrientation();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkOrientation);
});
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   SavedTournamentHandsView - Premium Purple
   ======================================== */

.saved-hands-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-y: auto;
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
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
  border: 1px solid rgba(168, 85, 247, 0.15);
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
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
}

.selected-date-header h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #a855f7;
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.025em;
  text-transform: capitalize;
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
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
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

.date-header {
  cursor: pointer;
  color: #a855f7;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-bottom: 1.5px solid rgba(168, 85, 247, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
  text-transform: capitalize;
}

.date-header:hover {
  color: #c084fc;
  border-bottom-color: rgba(168, 85, 247, 0.5);
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
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateX(5px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(168, 85, 247, 0.08);
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
  color: #a855f7;
  font-weight: 600;
}

.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.game-variant-badge,
.tournament-type-badge,
.itm-badge {
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

.tournament-type-badge {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.7) 0%, rgba(126, 34, 206, 0.8) 100%);
  color: white;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.itm-badge {
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
  border: 1.5px solid rgba(168, 85, 247, 0.4);
  background: rgba(168, 85, 247, 0.08);
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
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  box-shadow:
    0 2px 6px rgba(124, 58, 237, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

.hand-actions button:not(.delete-btn):hover {
  background: linear-gradient(135deg, #a855f7 0%, #c084fc 100%);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(124, 58, 237, 0.4),
    0 0 16px rgba(124, 58, 237, 0.2);
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
  border: 1px solid rgba(168, 85, 247, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 400px;
  width: 90%;
  text-align: center;

  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(168, 85, 247, 0.03);

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
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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
  border: 1.5px solid rgba(168, 85, 247, 0.25);
  color: #f9fafb;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.load-more-container button:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(168, 85, 247, 0.5);
  transform: translateY(-3px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 16px rgba(168, 85, 247, 0.08);
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 768px) {
  .saved-hands-container {
    padding: 1rem;
  }

  h2 {
    font-size: 1.6rem;
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
  .tournament-type-badge,
  .itm-badge {
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
