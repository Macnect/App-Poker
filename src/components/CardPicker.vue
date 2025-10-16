<template>
  <div class="modal-overlay" @click.self="gameStore.closeCardPicker()">
    <div class="card-picker-content">
      <div v-if="gameStore.isFlopMultiSelect" class="flop-indicator">
        Seleccionando Flop: {{ gameStore.flopSelectIndex + 1 }} de 3
      </div>
      <div v-if="gameStore.isPlayerCardsMultiSelect" class="player-cards-indicator">
        Seleccionando carta {{ gameStore.playerCardsSelectIndex + 1 }} de {{ totalPlayerCards }}
      </div>
      <div v-for="suit in deck" :key="suit.name" class="suit-row">
        <div
          v-for="card in suit.cards"
          :key="card.id"
          class="card"
          :class="[suit.colorClass, { disabled: gameStore.usedCards.has(card.id) }]"
          @click="selectCard(card)"
        >
          {{ card.rank }}
          <span class="suit-icon" v-html="suit.icon"></span>
        </div>
      </div>
      <button class="close-btn" @click="gameStore.closeCardPicker()">Cerrar</button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useGameStore } from '../store/game';

// Try to inject the store, fallback to useGameStore for backward compatibility
const gameStore = inject('pokerStore', null) || useGameStore();

const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits = [
  { name: 'Spades', id: 'S', icon: '&spades;', colorClass: 'black' },
  { name: 'Hearts', id: 'H', icon: '&hearts;', colorClass: 'red' },
  { name: 'Clubs', id: 'C', icon: '&clubs;', colorClass: 'green' },
  { name: 'Diamonds', id: 'D', icon: '&diams;', colorClass: 'blue' },
];

const deck = suits.map(suit => ({
  ...suit,
  cards: ranks.map(rank => ({
    id: rank + suit.id,
    rank: rank,
  }))
}));

const totalPlayerCards = computed(() => {
  return gameStore.gameVariant === 'omaha' ? 4 : 2;
});

function selectCard(card) {
  if (gameStore.usedCards.has(card.id)) return;
  gameStore.assignCard(card.id);
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.card-picker-content {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  padding: 1.5rem;
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.flop-indicator {
  font-family: 'Poppins', sans-serif;
  text-align: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0a0e1a;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.player-cards-indicator {
  font-family: 'Poppins', sans-serif;
  text-align: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.suit-row {
  display: flex;
  gap: 0.5rem;
}

.card {
  width: 50px;
  height: 70px;
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Arial Black', sans-serif;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  color: white;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.card:hover:not(.disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.5);
  border-color: rgba(212, 175, 55, 0.6);
}

.suit-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.card.black {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
}
.card.red {
  background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%);
}
.card.green {
  background: linear-gradient(135deg, #2f855a 0%, #276749 100%);
}
.card.blue {
  background: linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%);
}

.card.disabled {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  border-color: rgba(74, 85, 104, 0.3);
}

.card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: rgba(74, 85, 104, 0.3);
}

.close-btn {
  margin-top: 1rem;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.25rem;
  }
  .card-picker-content {
    padding: 0.4rem;
    gap: 0.3rem;
    max-width: 100%;
    width: 100%;
  }
  .flop-indicator {
    font-size: 0.95rem;
    padding: 0.6rem 0.8rem;
  }
  .player-cards-indicator {
    font-size: 0.95rem;
    padding: 0.6rem 0.8rem;
  }
  .suit-row {
    gap: 0.15rem;
    justify-content: space-between;
  }
  .card {
    /* Aprovecha al máximo el ancho: 13 cards + 12 gaps */
    /* 100vw - padding modal (0.25rem × 2) - padding content (0.4rem × 2) */
    width: calc((100vw - 0.5rem - 0.8rem - (12 * 0.15rem)) / 13);
    height: calc(((100vw - 0.5rem - 0.8rem - (12 * 0.15rem)) / 13) * 1.4);
    font-size: clamp(0.9rem, 2.8vw, 1.6rem);
    border-radius: 5px;
    border-width: 1.5px;
  }
  .suit-icon {
    font-size: clamp(0.65rem, 2vw, 1.1rem);
  }
  .close-btn {
    padding: 10px 20px;
    font-size: 0.95rem;
    margin-top: 0.5rem;
  }
}

/* Landscape mode optimizations for better fit on short screens */
@media screen and (orientation: landscape) and (max-height: 600px) {
  .modal-overlay {
    padding: 0.5rem;
    align-items: flex-start;
    overflow-y: auto;
  }

  .card-picker-content {
    padding: 1rem;
    gap: 0.5rem;
    margin: auto;
    max-height: 100%;
  }

  .suit-row {
    gap: 0.4rem;
  }

  .card {
    width: clamp(32px, 5vw, 42px);
    height: clamp(45px, 7vw, 60px);
    font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  }

  .suit-icon {
    font-size: clamp(0.8rem, 1.8vw, 1.1rem);
  }

  .close-btn {
    margin-top: 0.5rem;
    padding: 8px 20px;
  }
}
</style>