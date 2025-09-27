<template>
  <div class="poker-table-container">
    <div class="poker-table-wrapper">
      <div class="poker-table" :style="{ backgroundColor: tableColor }">
        
        <div class="center-content">
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

    <div class="controls-panel">
      <ActionPanel v-if="gameStore.gamePhase !== 'replay'" v-model:modelValue="tableColor" />
      <DisplayOptions v-else v-model:modelValue="tableColor" />
      
      <div class="game-controls">
        <template v-if="gameStore.gamePhase !== 'replay'">
          <button @click="gameStore.navigateHistory(-1)" title="Acción anterior">Anterior</button>
          <button @click="gameStore.navigateHistory(1)" title="Siguiente acción">Siguiente</button>
          <button class="save-btn" @click="handleSaveHand()">Guardar Mano</button>
          <button class="reset-btn" @click="confirmNewHand()">Nueva Mano</button>
        </template>
        <template v-if="gameStore.gamePhase === 'replay'">
          <button v-if="!gameStore.isReplaying" @click="gameStore.playReplay()" class="play-btn">Play</button>
          <button v-else @click="gameStore.pauseReplay()" class="pause-btn">Pause</button>
          <button @click="gameStore.restartReplay()">Reiniciar</button>
          <button @click="gameStore.navigateHistory(-1)" title="Acción anterior">Anterior</button>
          <button @click="gameStore.navigateHistory(1)" title="Siguiente acción">Siguiente</button>
          <select
            :value="gameStore.replaySpeed"
            @change="gameStore.setReplaySpeed($event.target.value)"
            title="Velocidad de reproducción"
          >
            <option value="0.5">x0.5</option>
            <option value="1">x1</option>
            <option value="1.5">x1.5</option>
            <option value="2">x2</option>
            <option value="3">x3</option>
          </select>
          <button @click="goToHandConfig" title="Ir a Configuración de Mano" class="new-hand-btn">Nueva Mano</button>
        </template>
      </div>
    </div>

    <!-- Modales -->
    <div v-if="showNewHandModal" class="modal-overlay" @click="closeNewHandModal"><div class="modal-content" @click.stop><h3>Confirmar Nueva Mano</h3><p>¿Desea guardar los cambios?</p><div class="modal-actions"><button class="cancel-btn" @click="justNewHand">No</button><button class="confirm-btn" @click="saveAndNewHand">Sí</button></div></div></div>
    <div v-if="showToast" class="toast success-toast"><div class="toast-icon">✓</div><div class="toast-message">¡Mano guardada con éxito!</div></div>
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
const showToast = ref(false);
const showNewHandModal = ref(false);
const clickablePhases = computed(() => ['flop', 'turn', 'river', 'showdown']);

function isBoardCardClickable(index) {
  if (gameStore.gamePhase === 'replay' || gameStore.gamePhase === 'showdown') return true;
  if (index <= 2) return clickablePhases.value.includes(gameStore.gamePhase);
  if (index === 3) return ['turn', 'river'].includes(gameStore.gamePhase);
  if (index === 4) return gameStore.gamePhase === 'river';
  return false;
}

function handleBoardCardClick(index) {
  if (!isBoardCardClickable(index)) return;
  const target = { type: 'board', id: index };
  if (gameStore.board[index]) gameStore.unassignCard(target);
  else gameStore.openCardPicker(target);
}

const heroIndex = computed(() => gameStore.players.findIndex(p => p.name === 'Hero'));
function handleSaveHand() { gameStore.saveCurrentHand(); showToast.value = true; setTimeout(() => { showToast.value = false; }, 3000); }
function confirmNewHand() { showNewHandModal.value = true; }
function closeNewHandModal() { showNewHandModal.value = false; }
function saveAndNewHand() { handleSaveHand(); gameStore.resetHand(); closeNewHandModal(); }
function justNewHand() { gameStore.resetHand(); closeNewHandModal(); }
function goToHandConfig() { gameStore.gamePhase = 'pre-action'; gameStore.resetHand(); }
</script>

<style scoped>
/* ESTILOS ESCRITORIO */
.poker-table-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2rem;
  width: 100vw;
  height: calc(100vh - 70px);
  box-sizing: border-box;
  overflow: hidden;
}

.poker-table-wrapper {
  position: relative;
  width: 1000px;
  height: 480px;
  transform: scale(0.9);
  margin-top: -10px;
  transform-origin: center top;
}

.poker-table {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 240px;
  border: 15px solid #5a3a22;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.6);
  transition: background-color 0.3s ease;
}

.center-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
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
  min-width: 420px;
  justify-content: center;
  z-index: 10;
}

.card-placeholder {
  width: var(--player-card-width);
  height: var(--player-card-height);
  background-color: transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.controls-panel {
  position: relative;
  width: 100%;
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.game-controls {
  display: none;
}

.card-placeholder.locked {
  cursor: not-allowed;
  opacity: 0.6;
}

.card-placeholder:hover {
  outline: 2px solid #f6e05e;
}

/* ESTILOS MODALES Y TOAST */
.toast{position:fixed;top:20px;right:20px;display:flex;align-items:center;gap:10px;padding:15px 20px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.3);z-index:1000;animation:slideIn .3s ease-out}.success-toast{background-color:#38a169;color:#fff}.toast-icon{font-size:1.5rem;font-weight:700}.toast-message{font-size:1rem;font-weight:700}@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:1000}.modal-content{background-color:#2d3748;border-radius:12px;padding:2rem;max-width:400px;width:90%;text-align:center;border:1px solid var(--border-color)}.modal-content h3{margin:0 0 1rem;font-size:1.5rem;color:#fff}.modal-content p{margin:0 0 2rem;color:#a0aec0;font-size:1.1rem}.modal-actions{display:flex;gap:1rem;justify-content:center}.cancel-btn,.confirm-btn{padding:10px 20px;border:none;border-radius:6px;font-size:1rem;cursor:pointer;transition:background-color .2s ease}.cancel-btn{background-color:#4A5568;color:#fff}.cancel-btn:hover{background-color:#2D3748}.confirm-btn{background-color:#38a169;color:#fff}.confirm-btn:hover{background-color:#2f855a}

/* --- MEDIA QUERY REFINADA PARA MÓVIL/TABLET EN HORIZONTAL --- */
@media screen and (max-width: 900px) and (orientation: landscape) {
  .poker-table-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
  }

  .poker-table-wrapper {
    flex: 1 1 auto;
    width: 100%;
    max-width: calc(100vw - 220px);
    margin: 0;
    transform: none;
    position: relative;
    height: 0;
    padding-bottom: 48%; /* Aspect Ratio 1000:480 */
  }

  .poker-table {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-width: 1.5vmin; /* Borde adaptable */
  }
  
  .controls-panel {
    width: 200px;
    height: 95vh;
    max-height: 400px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 1rem;
  }

  .game-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(26, 32, 44, 0.7);
    border-radius: 8px;
    margin-top: auto;
  }

  .game-controls > button, .game-controls > select {
    padding: 8px;
    font-size: 0.8rem;
    font-weight: bold;
    border-radius: 6px;
    border: 1px solid #000;
    background-color: #718096;
    color: white;
  }
  
  .game-controls .new-hand-btn,
  .game-controls .reset-btn {
    grid-column: 1 / -1;
    background-color: #e53e3e !important;
  }

  .game-controls .play-btn { background-color: #38a169 !important; }
  .game-controls .pause-btn { background-color: #dd6b20 !important; }
}
</style>