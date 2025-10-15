<template>
  <div class="poker-table-container">
    <div class="poker-table" id="poker-table-main" :style="{ backgroundColor: settingsStore.tableColor }">
      
      <div class="center-content" :style="{ '--board-x': gameStore.tableLayout.board.x + '%', '--board-y': gameStore.tableLayout.board.y + '%' }">
        <div class="pot">
          Bote:
          <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ gameStore.totalPot }}</span>
          <span v-else>{{ formatBBs(gameStore.totalPot / gameStore.bigBlind) }}</span>
        </div>

        <!-- Mostrar dos boards si es Double Board Bomb Pot -->
        <div v-if="gameStore.bombPotType === 'double' && gameStore.specialRule === 'Bomb Pot'" class="double-board-container">
          <div class="board">
            <div
              v-for="(card, index) in 5"
              :key="`board1-${index}`"
              class="card-placeholder"
              :class="{ locked: !isBoardCardClickable(index) }"
              @click="handleBoardCardClick(index, 1)"
            >
              <PlayingCard v-if="gameStore.board[index]" :cardId="gameStore.board[index]" />
              <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="140" rx="8" fill="#374151"/>
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="300">+</text>
              </svg>
            </div>
          </div>

          <div class="board">
            <div
              v-for="(card, index) in 5"
              :key="`board2-${index}`"
              class="card-placeholder"
              :class="{ locked: !isBoardCardClickable(index) }"
              @click="handleBoardCardClick(index, 2)"
            >
              <PlayingCard v-if="gameStore.board2[index]" :cardId="gameStore.board2[index]" />
              <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="140" rx="8" fill="#374151"/>
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="300">+</text>
              </svg>
            </div>
          </div>
        </div>

        <!-- Board único para otros modos -->
        <div v-else class="board">
          <div
            v-for="(card, index) in 5"
            :key="`board-${index}`"
            class="card-placeholder"
            :class="{ locked: !isBoardCardClickable(index) }"
            @click="handleBoardCardClick(index, 1)"
          >
            <PlayingCard v-if="gameStore.board[index]" :cardId="gameStore.board[index]" />
            <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="140" rx="8" fill="#374151"/>
              <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="300">+</text>
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
import { computed } from 'vue';
import { useGameStore } from '../store/game';
import { useSettingsStore } from '../store/useSettingsStore';
import Player from './Player.vue';
import PlayingCard from './PlayingCard.vue';

const gameStore = useGameStore();
const settingsStore = useSettingsStore();

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

function handleBoardCardClick(index, boardNumber = 1) {
  if (!isBoardCardClickable(index) || gameStore.gamePhase === 'replay') return;
  const target = { type: 'board', id: index, boardNumber: boardNumber };

  const boardRef = boardNumber === 1 ? gameStore.board : gameStore.board2;

  if (boardRef[index]) {
    gameStore.unassignCard(target);
  } else {
    gameStore.openCardPicker(target);
  }
}

const heroIndex = computed(() => {
  const index = gameStore.players.findIndex(p => p.name === 'Hero');
  return index !== -1 ? index : 0;
});

// Format BBs to hide .0 decimals but show other decimals
function formatBBs(value) {
  const formatted = value.toFixed(1);
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
}
</script>

<style scoped>
.poker-table-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 0;
  min-width: 0;
  padding: 15px;
  padding-top: 8px;
  box-sizing: border-box;
}

.poker-table {
  position: relative;
  /* Reduce table size to 85% for better spacing */
  width: 85%;
  max-width: 85%;
  max-height: 85%;
  aspect-ratio: 16 / 9;
  /* Oval shape like a real poker table - wider than tall */
  border-radius: 50% / 40%;
  border-style: solid;
  border-color: #5a3a22;
  border-width: clamp(8px, 1.2vmin, 15px);
  box-shadow: inset 0 0 clamp(15px, 2.5vmin, 30px) rgba(0, 0, 0, 0.6);
  transition: background-color 0.3s ease;
}

/* Portrait optimizations */
@media screen and (orientation: portrait) {
  .poker-table-container {
    padding: 12px;
    padding-top: 6px;
  }

  .poker-table {
    aspect-ratio: 9 / 11;
    /* Slightly larger in portrait since more vertical space */
    width: 90%;
    max-width: 90%;
    max-height: 90%;
    /* Oval shape for portrait - slightly less curved vertically */
    border-radius: 45% / 50%;
  }

  .center-content {
    width: 60%;
    gap: clamp(2px, 0.5vh, 5px);
  }

  .pot {
    font-size: clamp(0.65rem, 2vmin, 0.9rem);
    padding: 0.4em 0.9em;
  }

  .board {
    gap: 2.5%;
    padding: 2%;
  }

  .card-placeholder {
    width: 17%;
  }
}

/* Landscape optimizations */
@media screen and (orientation: landscape) {
  .poker-table-container {
    width: 100%;
    height: 100%;
    padding: 12px;
    padding-top: 6px;
  }

  .poker-table {
    /* Smaller in landscape to prevent overlap with action panel */
    width: 85%;
    max-width: 85%;
    max-height: 85%;
  }

  .center-content {
    gap: clamp(2px, 0.4vh, 4px);
  }

  .pot {
    font-size: clamp(0.6rem, 1.6vmin, 0.85rem);
    padding: 0.3em 0.8em;
  }

  .board {
    gap: 1.5%;
    padding: 1%;
  }
}

.center-content {
  position: absolute;
  top: calc(50% + var(--board-y, 0%));
  left: calc(50% + var(--board-x, 0%));
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2px, 0.4vh, 4px);
  width: 55%;
}

.pot {
  font-size: clamp(0.7rem, 2vmin, 1rem);
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

/* Estilos para Double Board Bomb Pot */
.double-board-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.4vh, 4px);
  align-items: center;
  /* Escalar todo el contenedor para que las cartas sean más pequeñas pero proporcionales */
  transform: scale(0.85);
  transform-origin: center center;
}

/* Boards en double board mode mantienen proporciones */
.double-board-container .board {
  width: 100%;
  padding: 1.5%;
  gap: 2%;
}

/* Cartas en double board mantienen su proporción original */
.double-board-container .card-placeholder {
  width: 18%;
}

/* Ajustes adicionales para portrait en double board */
@media screen and (orientation: portrait) {
  .double-board-container {
    transform: scale(0.88);
  }

  .double-board-container .board {
    width: 100%;
    padding: 2%;
    gap: 2.5%;
  }

  .double-board-container .card-placeholder {
    width: 17%;
  }
}

/* Ajustes adicionales para landscape en double board */
@media screen and (orientation: landscape) {
  .double-board-container {
    transform: scale(0.82);
  }

  .double-board-container .board {
    width: 100%;
    padding: 1%;
    gap: 1.5%;
  }

  .double-board-container .card-placeholder {
    width: 18%;
  }
}

.board-label {
  font-size: clamp(0.65rem, 1.5vmin, 0.85rem);
  font-weight: 700;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  padding: 0.2em 0.8em;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(212, 175, 55, 0.3);
}
</style>