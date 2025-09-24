<template>
  <div class="poker-table-container">
    <div class="poker-table" :style="{ backgroundColor: tableColor }">
      
      <div class="center-content">
        <div class="pot">
          Bote: 
          <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ gameStore.totalPot }}</span>
          <span v-else>{{ (gameStore.totalPot / gameStore.bigBlind).toFixed(1) }} BBs</span>
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

    <div class="controls-panel">
      <ActionPanel v-if="gameStore.gamePhase !== 'replay'" v-model:modelValue="tableColor" />
      <DisplayOptions v-else v-model:modelValue="tableColor" />
      <div class="game-controls">
        <button class="reset-btn" @click="gameStore.resetHand()">Nueva Mano</button>
        <template v-if="gameStore.gamePhase !== 'replay'">
          <button @click="gameStore.navigateHistory(-1)" title="Acción anterior">Anterior</button>
          <button @click="gameStore.navigateHistory(1)" title="Siguiente acción">Siguiente</button>
          <button class="save-btn" @click="gameStore.saveCurrentHand()">Guardar Mano</button>
        </template>
        <template v-if="gameStore.gamePhase === 'replay'">
          <button v-if="!gameStore.isReplaying" @click="gameStore.playReplay()" class="play-btn">Play</button>
          <button v-else @click="gameStore.pauseReplay()" class="pause-btn">Pause</button>
          <button @click="gameStore.restartReplay()">Reiniciar</button>
          <button @click="gameStore.navigateHistory(-1)" title="Acción anterior">Anterior</button>
          <button @click="gameStore.navigateHistory(1)" title="Siguiente acción">Siguiente</button>

          <!-- SELECTOR DE VELOCIDAD AÑADIDO -->
          <select
            :value="gameStore.replaySpeed"
            @change="gameStore.setReplaySpeed($event.target.value)"
            title="Velocidad de reproducción"
          >
            <option value="0.5">x0.5</option>
            <option value="1">x1</option>
            <option value="1.25">x1.25</option>
            <option value="1.5">x1.5</option>
            <option value="1.75">x1.75</option>
            <option value="2">x2</option>
            <option value="3">x3</option>
          </select>
          
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '../store/game';
import Player from './Player.vue';
import ActionPanel from './ActionPanel.vue';
import DisplayOptions from './DisplayOptions.vue';
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
  if (!isBoardCardClickable(index)) return;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
  margin-top: 20px;
}
.poker-table {
  position: relative;
  width: 1000px;
  height: 480px; 
  border-radius: 240px;
  border: 15px solid #5a3a22;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.6);
  transition: background-color 0.3s ease;
}
.center-content {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.pot {
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 5px 15px;
  border-radius: 8px;
}
.board {
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  min-width: 385px;
  justify-content: center;
}
.card-placeholder {
  width: var(--board-card-width);
  height: var(--board-card-height);
  background-color: transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}
.card-placeholder:hover {
  outline: 2px solid #f6e05e;
}
.controls-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.game-controls {
  display: flex;
  gap: 12px;
}
/* REGLA CSS MODIFICADA PARA INCLUIR EL SELECT */
.game-controls > button, .game-controls > select {
  padding: 12px 20px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  border: 1px solid #000;
  background-color: #718096;
  color: white; /* Añadido para asegurar consistencia */
  cursor: pointer; /* Añadido para asegurar consistencia */
}
.game-controls > button:hover, .game-controls > select:hover {
  background-color: #4A5568;
}
.reset-btn { background-color: #e53e3e !important; }
.reset-btn:hover { background-color: #c53030 !important; }
.save-btn { background-color: #48bb78 !important; }
.save-btn:hover { background-color: #38a169 !important; }
.play-btn { background-color: #38a169 !important; }
.play-btn:hover { background-color: #2f855a !important; }
.pause-btn { background-color: #dd6b20 !important; }
.pause-btn:hover { background-color: #c05621 !important; }

.card-placeholder.locked {
  cursor: not-allowed;
  opacity: 0.6;
}
.card-placeholder.locked:hover {
  outline: none;
}
</style>