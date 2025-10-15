<template>
  <div class="saved-hands-container">
    <h2>Manos Guardadas</h2>

    <div class="filters-container">
      <div class="filter-group">
        <button v-if="selectedDate" @click="selectedDate = null" class="clear-btn">Mostrar Todas las Manos</button>
      </div>
      <div class="filter-group">
        <button @click="toggleHandStrengthSort" class="sort-btn">
          {{ sortKey === 'strength' ? 'Ordenar por Fecha' : 'Ordenar por Mano de Héroe' }}
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

    <!-- Overlay que pide girar el dispositivo (se muestra en móvil horizontal) -->
    <RotateDeviceOverlay v-if="showRotateOverlay" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/game'
import { useAuthStore } from '../store/useAuthStore'
import PlayingCard from '../components/PlayingCard.vue';
import RotateDeviceOverlay from '../components/RotateDeviceOverlay.vue';

const gameStore = useGameStore();
const authStore = useAuthStore();
const emit = defineEmits(['switch-view']);

const isLoading = computed(() => !authStore.isInitialized);

const selectedDate = ref(null);
const sortKey = ref('date');

const showModal = ref(false);
const showToast = ref(false);
const selectedHandId = ref(null);

const showRotateOverlay = ref(false);

const checkOrientation = () => {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  showRotateOverlay.value = !isPortrait && isCoarsePointer;
};

const HAND_STRENGTH_MAP = { 'AA': 1, 'KK': 2, 'QQ': 3, 'AKs': 4, 'JJ': 5, 'AQs': 6, 'KQs': 7, 'AJs': 8, 'KJs': 9, 'TT': 10, 'AKo': 11, 'ATs': 12, 'QJs': 13, 'KTs': 14, 'QTs': 15, 'JTs': 16, '99': 17, 'AQo': 18, 'A9s': 19, 'K9s': 20, 'Q9s': 21, 'J9s': 22, 'T9s': 23, 'A8s': 24, '88': 25, 'K8s': 26, 'Q8s': 27, 'J8s': 28, 'AJo': 29, 'A5s': 30, 'T8s': 31, '98s': 32, 'A7s': 33, 'A4s': 34, 'K7s': 35, '77': 36, 'A3s': 37, 'Q7s': 38, 'A6s': 39, 'KJo': 40, 'A2s': 41, 'K6s': 42, '87s': 43, 'T7s': 44, 'K5s': 45, '66': 46, 'ATo': 47, 'J7s': 48, 'Q6s': 49, 'K4s': 50, '97s': 51, '76s': 52, 'K3s': 53, 'Q5s': 54, '55': 55, 'K2s': 56, 'J6s': 57, 'T6s': 58, 'Q4s': 59, '86s': 60, 'Q3s': 61, '65s': 62, 'KTo': 63, 'A9o': 64, 'Q2s': 65, '44': 66, 'J5s': 67, '96s': 68, 'J4s': 69, '75s': 70, 'QJo': 71, 'A8o': 72, 'T5s': 73, 'J3s': 74, '54s': 75, '85s': 76, 'K9o': 77, 'Q9o': 78, '33': 79, 'J2s': 80, '64s': 81, 'T4s': 82, 'J9o': 83, 'T9o': 84, 'A7o': 85, 'K8o': 86, '95s': 87, '22': 88, '74s': 89, 'T3s': 90, '53s': 91, 'Q8o': 92, 'A5o': 93, '84s': 94, 'A4o': 95, 'K7o': 96, 'J8o': 97, 'T2s': 98, 'A6o': 99, '98o': 100, '43s': 101, 'A3o': 102, 'K6o': 103, '63s': 104, 'T8o': 105, 'A2o': 106, 'Q7o': 107, 'J7o': 108, 'K5o': 109, '87o': 110, '52s': 111, 'K4o': 112, 'T7o': 113, '76o': 114, 'Q6o': 115, '94s': 116, 'K3o': 117, 'J6o': 118, '83s': 119, 'K2o': 120, 'Q5o': 121, '97o': 122, '73s': 123, '42s': 124, 'T6o': 125, '65o': 126, 'Q4o': 127, 'J5o': 128, '86o': 129, 'Q3o': 130, 'J4o': 131, '96o': 132, '75o': 133, 'T5o': 134, 'Q2o': 135, '62s': 136, 'J3o': 137, '82s': 138, '54o': 139, '85o': 140, 'J2o': 141, '93s': 142, 'T4o': 143, '64o': 144, '95o': 145, '72s': 146, 'T3o': 147, '74o': 148, '53o': 149, '84o': 150, 'T2o': 151, '43o': 152, '92s': 153, '63o': 154, '83o': 155, '73o': 156, '52o': 157, '94o': 158, '42o': 159, '82o': 160, '62o': 161, '93o': 162, '72o': 163, '92o': 164, };
const RANK_ORDER = 'AKQJT98765432';

function getHandRank(cards) {
  if (!cards || cards.length < 2 || !cards[0] || !cards[1]) return 999;
  const rank1 = cards[0].charAt(0), suit1 = cards[0].charAt(1);
  const rank2 = cards[1].charAt(0), suit2 = cards[1].charAt(1);
  const isSuited = suit1 === suit2, isPair = rank1 === rank2;
  const [r1, r2] = [RANK_ORDER.indexOf(rank1), RANK_ORDER.indexOf(rank2)].sort((a,b) => a - b);
  const highRank = RANK_ORDER[r1], lowRank = RANK_ORDER[r2];
  let handKey;
  if (isPair) handKey = `${highRank}${lowRank}`;
  else if (isSuited) handKey = `${highRank}${lowRank}s`;
  else handKey = `${highRank}${lowRank}o`;
  return HAND_STRENGTH_MAP[handKey] || 999;
}

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
    hands = hands.filter(hand => hand.fecha.split('T')[0] === selectedDate.value);
  }
  if (sortKey.value === 'strength') {
    hands.sort((a, b) => getHandRank(getHeroFromHand(a)?.cards) - getHandRank(getHeroFromHand(b)?.cards));
  } else {
    hands.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
  return hands;
});

function toggleHandStrengthSort() { sortKey.value = sortKey.value === 'strength' ? 'date' : 'strength'; }
function loadHandForReplay(hand) { gameStore.loadHand(hand); emit('switch-view', 'CurrentHandView'); }
function getHeroFromHand(hand) { if (!hand.historial || hand.historial.length === 0) return null; const finalState = hand.historial[hand.historial.length - 1]; return finalState.players.find(p => p.name === 'Hero'); }
function getBoardFromHand(hand) { if (!hand.historial || hand.historial.length === 0) return []; const finalState = hand.historial[hand.historial.length - 1]; return finalState.board.filter(card => card); }
function getBoard2FromHand(hand) { if (!hand.historial || hand.historial.length === 0) return []; const finalState = hand.historial[hand.historial.length - 1]; return finalState.board2 ? finalState.board2.filter(card => card) : []; }
function isDoubleBoardBombPot(hand) { return hand.bomb_pot_type === 'double' && hand.regla_especial === 'Bomb Pot'; }
function getGameVariantLabel(hand) { return hand.game_variant === 'omaha' ? 'Omaha' : "Hold'em"; }
function getGameVariantClass(hand) { return hand.game_variant === 'omaha' ? 'variant-omaha' : 'variant-holdem'; }
function confirmDelete(handId) { selectedHandId.value = handId; showModal.value = true; }
function closeModal() { showModal.value = false; selectedHandId.value = null; }
async function deleteAndClose() {
  if (selectedHandId.value) {
    await gameStore.deleteHand(selectedHandId.value);
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
   SavedHandsView - Premium Style
   ======================================== */

.saved-hands-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow-y: auto; /* Permite scroll solo si el contenido excede la altura */
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
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

.filter-group label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.sort-btn, .clear-btn {
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.sort-btn {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  color: #f9fafb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sort-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.clear-btn {
  background: linear-gradient(135deg, rgba(113, 128, 150, 0.6) 0%, rgba(74, 85, 104, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.clear-btn:hover {
  background: linear-gradient(135deg, rgba(113, 128, 150, 0.8) 0%, rgba(74, 85, 104, 1) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
  color: #d1d5db;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border-bottom: 1.5px solid rgba(212, 175, 55, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
}

.date-header:hover {
  color: #d4af37;
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
  animation: hero-glow-list 2s infinite ease-in-out;
  width: fit-content;
}

@keyframes hero-glow-list {
  0%, 100% {
    background-color: rgba(16, 185, 129, 0.05);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
  }
  50% {
    background-color: rgba(16, 185, 129, 0.12);
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.5);
  }
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
  }

  .date-header {
    font-size: 1.1rem;
  }
}

/* Ajustes para pantallas pequeñas */
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

/* Ajustes adicionales para pantallas muy pequeñas */
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