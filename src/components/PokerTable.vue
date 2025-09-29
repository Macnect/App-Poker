<template>
  <div class="poker-table-container">
    <div class="poker-table" :style="{ backgroundColor: tableColor }">
      
      <div class="center-content" :style="{ '--board-x': gameStore.tableLayout.board.x + '%', '--board-y': gameStore.tableLayout.board.y + '%' }">
        <div class="pot">
          Bote: 
          <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ gameStore.totalPot }}</span>
          <span v-else>{{ (gameStore.totalPot / gameStore.bigBlind).toFixed(1) }}</span>
        </div>

        <div class="board">
          <div 
            v-for="(card, index) in 5" 
            :key="`board-${index}`" 
            class="card-placeholder"
            :class="{ locked: !isBoardCardClickable(index) }"
            @click="handleBoardCardClick(index)"
          >
            <PlayingCard v-if="gameStore.board[index]" :cardId="gameStore.board[index]" />
            <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="140" rx="8" fill="#374151"/>
              <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="bold">+</text>
            </svg>
          </div>
        </div>
      </div>

      <Player
        v-for="(player, index) in gameStore.players"
        :key="player.id"
        :player="player"
        :player-count="gameStore.players.length"
        :index="index"
        :hero-index="heroIndex" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '../store/game';
import Player from './Player.vue';
import PlayingCard from './PlayingCard.vue';

const gameStore = useGameStore();
const tableColor = ref('#28563a');

const clickablePhases = computed(() => ['flop', 'turn', 'river', 'showdown']);

function isBoardCardClickable(index) {
  if (gameStore.gamePhase === 'replay' || gameStore.gamePhase === 'showdown') {
    return true;
  }
  if (index <= 2) {
    return clickablePhases.value.includes(gameStore.gamePhase);
  }
  if (index === 3) {
    return gameStore.gamePhase === 'turn' || gameStore.gamePhase === 'river';
  }
  if (index === 4) {
    return gameStore.gamePhase === 'river';
  }
  return false;
}

function handleBoardCardClick(index) {
  if (!isBoardCardClickable(index) || gameStore.gamePhase === 'replay') return;
  const target = { type: 'board', id: index };
  if (gameStore.board[index]) {
    gameStore.unassignCard(target);
  } else {
    gameStore.openCardPicker(target);
  }
}

const heroIndex = computed(() => {
  const index = gameStore.players.findIndex(p => p.name === 'Hero');
  return index !== -1 ? index : 0;
});
</script>

<style scoped>
.poker-table-container {
  width: 90%;
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  min-width: 0;
}

.poker-table {
  position: relative;
  width: 90%;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 50%;
  border-style: solid;
  border-color: #5a3a22;
  border-width: clamp(8px, 1.2vmin, 15px);
  box-shadow: inset 0 0 clamp(15px, 2.5vmin, 30px) rgba(0, 0, 0, 0.6);
  transition: background-color 0.3s ease;
  right: -15px;
  top: 10px;
}

.center-content {
  position: absolute;
  top: calc(50% + var(--board-y, 0%));
  left: calc(50% + var(--board-x, 0%));
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(5px, 1.5vh, 15px);
  width: 55%;
}

.pot {
  font-size: clamp(0.9rem, 2.5vmin, 1.3rem);
  font-weight: bold;
  color: white;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 0.05em 1em;
  border-radius: 8px;
}

.board {
  display: flex;
  gap: 2%;
  padding: 1.5%;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  width: 100%;
  justify-content: center;
  z-index: 10;
}

.card-placeholder {
  width: 18%;
  aspect-ratio: 100 / 140;
  background-color: transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.card-placeholder:hover {
  outline: 2px solid #f6e05e;
}

.card-placeholder.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.card-placeholder.locked:hover {
  outline: none;
}
</style>