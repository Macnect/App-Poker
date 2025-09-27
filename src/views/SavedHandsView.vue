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
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '../store/game'
import { useAuthStore } from '../store/useAuthStore'
import PlayingCard from '../components/PlayingCard.vue';

const gameStore = useGameStore();
const authStore = useAuthStore();
const emit = defineEmits(['switch-view']);

const isLoading = computed(() => !authStore.isInitialized);

const selectedDate = ref(null);
const sortKey = ref('date');

const showModal = ref(false);
const showToast = ref(false);
const selectedHandId = ref(null);

const HAND_STRENGTH_MAP = { 'AA': 1, 'KK': 2, 'QQ': 3, 'AKs': 4, 'JJ': 5, 'AQs': 6, 'KQs': 7, 'AJs': 8, 'KJs': 9, 'TT': 10, 'AKo': 11, 'ATs': 12, 'QJs': 13, 'KTs': 14, 'QTs': 15, 'JTs': 16, '99': 17, 'AQo': 18, 'A9s': 19, 'K9s': 20, 'Q9s': 21, 'J9s': 22, 'T9s': 23, 'A8s': 24, '88': 25, 'K8s': 26, 'Q8s': 27, 'J8s': 28, 'AJo': 29, 'A5s': 30, 'T8s': 31, '98s': 32, 'A7s': 33, 'A4s': 34, 'K7s': 35, '77': 36, 'A3s': 37, 'Q7s': 38, 'A6s': 39, 'KJo': 40, 'A2s': 41, 'K6s': 42, '87s': 43, 'T7s': 44, 'K5s': 45, '66': 46, 'ATo': 47, 'J7s': 48, 'Q6s': 49, 'K4s': 50, '97s': 51, '76s': 52, 'K3s': 53, 'Q5s': 54, '55': 55, 'K2s': 56, 'J6s': 57, 'T6s': 58, 'Q4s': 59, '86s': 60, 'Q3s': 61, '65s': 62, 'KTo': 63, 'A9o': 64, 'Q2s': 65, '44': 66, 'J5s': 67, '96s': 68, 'J4s': 69, '75s': 70, 'QJo': 71, 'A8o': 72, 'T5s': 73, 'J3s': 74, '54s': 75, '85s': 76, 'K9o': 77, 'Q9o': 78, '33': 79, 'J2s': 80, '64s': 81, 'T4s': 82, 'J9o': 83, 'T9o': 84, 'A7o': 85, 'K8o': 86, '95s': 87, '22': 88, '74s': 89, 'T3s': 90, '53s': 91, 'Q8o': 92, 'A5o': 93, '84s': 94, 'A4o': 95, 'K7o': 96, 'J8o': 97, 'T2s': 98, 'A6o': 99, '98o': 100, '43s': 101, 'A3o': 102, 'K6o': 103, '63s': 104, 'T8o': 105, 'A2o': 106, 'Q7o': 107, 'J7o': 108, 'K5o': 109, '87o': 110, '52s': 111, 'K4o': 112, 'T7o': 113, '76o': 114, 'Q6o': 115, '94s': 116, 'K3o': 117, 'J6o': 118, '83s': 119, 'K2o': 120, 'Q5o': 121, '97o': 122, '73s': 123, '42s': 124, 'T6o': 125, '65o': 126, 'Q4o': 127, 'J5o': 128, '86o': 129, 'Q3o': 130, 'J4o': 131, '96o': 132, '75o': 133, 'T5o': 134, 'Q2o': 135, '62s': 136, 'J3o': 137, '82s': 138, '54o': 139, '85o': 140, 'J2o': 141, '93s': 142, 'T4o': 143, '64o': 144, '95o': 145, '72s': 146, 'T3o': 147, '74o': 148, '53o': 149, '84o': 150, 'T2o': 151, '43o': 152, '92s': 153, '63o': 154, '83o': 155, '73o': 156, '52o': 157, '94o': 158, '42o': 159, '82o': 160, '62o': 161, '93o': 162, '72o': 163, '92o': 164 };
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
    hands = hands.filter(hand => {
      const handDate = hand.fecha.split('T')[0];
      return handDate === selectedDate.value;
    });
  }

  if (sortKey.value === 'strength') {
    hands.sort((a, b) => {
      const heroA = getHeroFromHand(a);
      const heroB = getHeroFromHand(b);
      const rankA = getHandRank(heroA?.cards);
      const rankB = getHandRank(heroB?.cards);
      return rankA - rankB;
    });
  } else {
    hands.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
  return hands;
});

function toggleHandStrengthSort() {
  sortKey.value = sortKey.value === 'strength' ? 'date' : 'strength';
}

function loadHandForReplay(hand) {
  gameStore.loadHand(hand);
  emit('switch-view', 'CurrentHandView');
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
    setTimeout(() => {
      showToast.value = false;
    }, 3000);
    closeModal();
  }
}
</script>

<style scoped>
.saved-hands-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.loading-message, .no-hands {
  margin-top: 2rem;
  text-align: center;
  color: #a0aec0;
  font-size: 1.2rem;
}
.hands-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.hands-list li {
  background-color: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}
.filters-container {
  background-color: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-group label {
  font-weight: bold;
  color: #a0aec0;
}
.filter-group input[type="date"] {
  padding: 8px;
  border-radius: 4px;
}
.sort-btn, .clear-btn {
  font-size: 1rem;
  padding: 8px 16px;
}
.clear-btn {
  background-color: #718096;
}
.date-header {
  cursor: pointer;
  color: #a0aec0;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #4A5568;
}
.date-header:hover {
  color: #e2e8f0;
}
.grouped-hands-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.date-group {
  border: 1px solid #4A5568;
  border-radius: 8px;
  padding: 1rem;
}
.hand-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  flex-basis: 200px;
  flex-shrink: 0;
}
.hand-actions {
  display: flex;
  gap: 0.5rem;
}
.hand-preview {
  display: flex;
  flex-grow: 1;
  justify-content: flex-start;
  align-items: center;
  gap: 2rem;
}
.card-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-label {
  font-weight: bold;
  font-size: 1.1rem;
  color: #a0aec0;
}
.cards-display {
  display: flex;
  gap: 5px;
}
.cards-display :deep(.playing-card) {
  width: 45px;
  height: 63px;
  border-radius: 4px;
}
.cards-display :deep(.rank) {
  font-size: 1.5rem;
}
.cards-display :deep(.suit-icon) {
  font-size: 1rem;
}
.delete-btn {
  background-color: #c53030;
}
.delete-btn:hover {
  background-color: #9b2c2c;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: #2d3748;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid var(--border-color);
}
.modal-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: white;
}
.modal-content p {
  margin: 0 0 2rem 0;
  color: #a0aec0;
  font-size: 1.1rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.cancel-btn, .confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.cancel-btn {
  background-color: #4A5568;
  color: white;
}
.cancel-btn:hover {
  background-color: #2D3748;
}
.confirm-btn {
  background-color: #c53030;
  color: white;
}
.confirm-btn:hover {
  background-color: #9b2c2c;
}
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}
.success-toast {
  background-color: #38a169;
  color: white;
}
.toast-icon {
  font-size: 1.5rem;
  font-weight: bold;
}
.toast-message {
  font-size: 1rem;
  font-weight: bold;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.hero-hand-preview {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #68d391;
  animation: hero-glow-list 2s infinite ease-in-out;
}
.load-more-container {
  text-align: center;
  margin-top: 2rem;
}
.load-more-container button {
  padding: 10px 20px;
  background-color: #4A5568;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.load-more-container button:hover {
  background-color: #2D3748;
}
@keyframes hero-glow-list {
  0%, 100% {
    background-color: rgba(104, 211, 145, 0.05);
    box-shadow: 0 0 5px rgba(104, 211, 145, 0.5);
  }
  50% {
    background-color: rgba(104, 211, 145, 0.15);
    box-shadow: 0 0 12px rgba(104, 211, 145, 0.8);
  }
}
</style>