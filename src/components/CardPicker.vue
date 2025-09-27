<template>
  <div class="modal-overlay" @click.self="gameStore.closeCardPicker()">
    <div class="card-picker-content">
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
import { useGameStore } from '../store/game';

const gameStore = useGameStore();

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

function selectCard(card) {
  if (gameStore.usedCards.has(card.id)) return;
  gameStore.assignCard(card.id);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex; justify-content: center; align-items: center; z-index: 2000;
  padding: 1rem;
}
.card-picker-content {
  background-color: #1a202c;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.suit-row {
  display: flex;
  gap: 0.5rem;
}
.card {
  width: 50px; height: 70px;
  border: 1px solid #4A5568;
  border-radius: 6px;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  font-family: 'Arial Black', sans-serif; font-size: 1.8rem; font-weight: bold;
  cursor: pointer;
  color: white;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
}
.card:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px #f6e05e;
}
.suit-icon {
  font-size: 1.2rem;
  line-height: 1;
}
.card.black { background-color: #2d3748; }
.card.red { background-color: #c53030; }
.card.green { background-color: #2f855a; }
.card.blue { background-color: #2b6cb0; }

.card.disabled {
  background-color: #4a5568;
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.card.disabled:hover {
  transform: none;
  box-shadow: none;
}
.close-btn {
  margin-top: 1rem;
  padding: 10px;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .card-picker-content {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  .suit-row {
    gap: 0.25rem;
  }
  .card {
    width: clamp(28px, 6vw, 40px); /* Ancho fluido */
    height: clamp(40px, 8.4vw, 56px); /* Alto fluido */
    font-size: clamp(1rem, 3vw, 1.5rem); /* Fuente fluida */
    border-radius: 4px;
  }
  .suit-icon {
    font-size: clamp(0.7rem, 2vw, 1rem);
  }
}
</style>