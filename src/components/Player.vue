<template>
  <div class="player-container" :style="seatStyle" :class="{ 'is-9-max': playerCount >= 9 }">

    <div class="player-cards">
        <div class="card-placeholder" @click="handleCardClick(player.id, 0)">
          <PlayingCard v-if="player.cards[0]" :cardId="player.cards[0]" />
          <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="140" rx="8" fill="#4A5568"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="300">+</text>
          </svg>
        </div>
        <div class="card-placeholder" @click="handleCardClick(player.id, 1)">
          <PlayingCard v-if="player.cards[1]" :cardId="player.cards[1]" />
          <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="140" rx="8" fill="#4A5568"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="300">+</text>
          </svg>
        </div>
    </div>
    
    <div class="player-seat" :class="{ faded: !player.inHand, active: isActivePlayer, 'is-hero': player.name === 'Hero' }">

      <div class="player-info-panel" :style="player.name === 'Hero' ? { background: '#68d39199', backgroundImage: 'none' } : (player.tag ? { background: player.tag + '99', backgroundImage: 'none' } : {})">
        <div class="player-info">
          <div class="player-position">
            <div v-if="player.position === 'BTN'" class="dealer-button-inline">D</div>
            <span v-else>{{ player.position }}</span>
          </div>
          <div class="player-name">
            <div v-if="gameStore.isPreActionPhase" class="editable-name-wrapper">
              <input
                type="text"
                :value="player.name"
                @change="gameStore.updatePlayerName(player.id, $event.target.value)"
                class="player-input player-name-input"
              />
            </div>
            <span v-else>{{ player.name }}</span>
          </div>
          <div class="player-stack">
            <div v-if="gameStore.isPreActionPhase" class="stack-input-wrapper">
              <span>{{ gameStore.currency }}</span>
              <input
                type="number"
                :value="player.stack"
                @change="gameStore.updatePlayerStack(player.id, $event.target.value)"
                class="player-input player-stack-input"
              />
            </div>
            <span v-else>
              <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.stack }}</span>
              <span v-else>{{ formatBBs(player.stack / gameStore.bigBlind) }}</span>
            </span>
          </div>
        </div>
      </div>
      
      <button v-if="gameStore.gamePhase !== 'replay'" @click="gameStore.toggleNotesPanel(player.id)" class="edit-notes-btn" ref="editBtnRef">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </button>

      <div
        v-if="player.notes && !gameStore.isPreActionPhase"
        class="notes-display-wrapper"
        ref="notesDisplayRef"
        @click.stop.prevent="toggleTooltip"
        @touchstart.stop.prevent="toggleTooltip"
        @mouseenter.passive="handleMouseEnter"
        @mouseleave.passive="handleMouseLeave"
      >
        <svg class="notes-display-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
    </div>

    <div
      v-if="player.betThisRound > 0"
      class="bet-box"
      :class="{ 'bomb-pot-bet': player.isBombPot, 'all-in-only': player.isAllIn }"
      :style="betBoxStyle"
    >
      <!-- Si está en all-in, mostramos el icono del triángulo y la cantidad debajo -->
      <template v-if="player.isAllIn">
        <img src="/icons/all-in-icon.svg" alt="All-in" class="all-in-icon" />
        <div class="bet-amount-text">
          <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.betThisRound }}</span>
          <span v-else>{{ formatBBs(player.betThisRound / gameStore.bigBlind) }}</span>
        </div>
      </template>

      <!-- Si NO está en all-in, mostramos las fichas y la cantidad -->
      <template v-else>
        <ChipStack :amount="player.betThisRound" :bigBlind="gameStore.bigBlind" :isBombPot="player.isBombPot" />
        <div class="bet-info">
          <div class="bet-amount-container">
            <div class="bet-amount-text">
              <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.betThisRound }}</span>
              <span v-else>{{ formatBBs(player.betThisRound / gameStore.bigBlind) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="showCheckIndicator && player.inHand"
      class="check-indicator"
    >
      Check
    </div>

  </div>

  <!-- Panel de notas usando Teleport para renderizarlo en el centro de la mesa -->
  <!-- Only render Teleport when target exists to prevent mount/unmount errors -->
  <Teleport v-if="teleportTarget" to="#poker-table-main">
    <div v-if="isNotesPanelOpen" class="notes-panel notes-panel-centered" ref="notesPanelRef">
      <textarea
        :value="player.notes"
        @input="gameStore.updatePlayerNotes(player.id, $event.target.value)"
        placeholder="Notas sobre el jugador..."
      ></textarea>
      <div class="tags-container">
        <div
          v-for="color in tagColors"
          :key="color"
          class="tag-selector"
          :class="{ selected: player.tag === color }"
          :style="{ backgroundColor: color }"
          @click="gameStore.updatePlayerTag(player.id, color)"
        ></div>
      </div>
    </div>
  </Teleport>

  <!-- Tooltip de notas usando Teleport para renderizarlo centrado en la mesa -->
  <Teleport v-if="teleportTarget" to="#poker-table-main">
    <div
      v-if="isTooltipVisible && player.notes"
      class="notes-tooltip-centered"
      ref="tooltipRef"
      @click.stop
    >
      {{ player.notes }}
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '../store/game'
import PlayingCard from './PlayingCard.vue';
import ChipStack from './ChipStack.vue';

const notesPanelRef = ref(null);
const editBtnRef = ref(null);
const teleportTarget = ref(null);
const showCheckIndicator = ref(false);
const notesDisplayRef = ref(null);
const tooltipRef = ref(null);
const isTooltipVisible = ref(false);
let checkIndicatorTimeout = null;
let tooltipClickedManually = false;

const tagColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

const props = defineProps({
  player: Object,
  playerCount: Number,
  index: Number,
  heroIndex: Number,
})

const gameStore = useGameStore();

const isNotesPanelOpen = computed(() => gameStore.openNotesPanelPlayerId === props.player.id);

// Watch for check action and auto-hide after 2 seconds
watch(() => props.player.lastAction, (newAction) => {
  // Clear any existing timeout
  if (checkIndicatorTimeout) {
    clearTimeout(checkIndicatorTimeout);
    checkIndicatorTimeout = null;
  }

  if (newAction === 'check') {
    // Show the indicator
    showCheckIndicator.value = true;

    // Auto-hide after 2 seconds
    checkIndicatorTimeout = setTimeout(() => {
      showCheckIndicator.value = false;
      checkIndicatorTimeout = null;
    }, 2000);
  } else {
    // Hide immediately for any other action
    showCheckIndicator.value = false;
  }
});

// Check if teleport target exists to prevent errors
function checkTeleportTarget() {
  teleportTarget.value = document.querySelector('#poker-table-main');
}

function handleCardClick(playerId, cardIndex) {
  if (gameStore.gamePhase === 'replay') return;
  const target = { type: 'player', id: playerId, cardIndex: cardIndex };
  if (props.player.cards[cardIndex]) {
    gameStore.unassignCard(target);
  } else {
    gameStore.openCardPicker(target);
  }
}

function handleClickOutside(event) {
  if (isNotesPanelOpen.value && notesPanelRef.value && !notesPanelRef.value.contains(event.target) && editBtnRef.value && !editBtnRef.value.contains(event.target)) {
    gameStore.closeNotesPanel();
  }
}

function handleMouseEnter() {
  // Solo mostrar con hover si NO fue clickeado manualmente (desktop con mouse)
  if (!tooltipClickedManually) {
    isTooltipVisible.value = true;
  }
}

function handleMouseLeave() {
  // Solo ocultar con hover si NO fue clickeado manualmente
  if (!tooltipClickedManually) {
    isTooltipVisible.value = false;
  }
}

function toggleTooltip(event) {
  event.stopPropagation();
  event.preventDefault();

  if (tooltipClickedManually && isTooltipVisible.value) {
    // Ya está abierto y fue clickeado antes, cerrarlo
    tooltipClickedManually = false;
    isTooltipVisible.value = false;
  } else {
    // Abrirlo y marcarlo como clickeado manualmente
    tooltipClickedManually = true;
    isTooltipVisible.value = true;
  }
}

// Cerrar tooltip al hacer click fuera
function handleClickOutsideTooltip(event) {
  if (isTooltipVisible.value &&
      notesDisplayRef.value &&
      !notesDisplayRef.value.contains(event.target) &&
      tooltipRef.value &&
      !tooltipRef.value.contains(event.target)) {
    isTooltipVisible.value = false;
    tooltipClickedManually = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('click', handleClickOutsideTooltip);

  checkTeleportTarget();
  // Re-check teleport target when DOM updates
  const observer = new MutationObserver(checkTeleportTarget);
  observer.observe(document.body, { childList: true, subtree: true });

  // Clean up observer on unmount
  onUnmounted(() => {
    observer.disconnect();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('click', handleClickOutsideTooltip);

  // Clean up check indicator timeout
  if (checkIndicatorTimeout) {
    clearTimeout(checkIndicatorTimeout);
    checkIndicatorTimeout = null;
  }
});

const isActivePlayer = computed(() => gameStore.activePlayerIndex === props.player.id);

// Format BBs to hide .0 decimals but show other decimals
function formatBBs(value) {
  const formatted = value.toFixed(1);
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
}

// --- LÓGICA DE POSICIONAMIENTO DE ASIENTOS (MODIFICADA PARA RESPONSIVE) ---
// Las coordenadas ahora son porcentajes del radio de la mesa (ej: x: 50 es el borde derecho).
// La posición [0] es siempre la inferior central (la vista del Héroe).
const PREDEFINED_LAYOUTS = {
  2: [ { x: 50, y: -8 }, { x:-50, y: -8 } ],
  3: [ { x: 0, y: 48 }, { x: -50, y: -8 }, { x: 50, y: -8 } ],
  4: [ { x: 0, y: 48 }, { x: -50, y: -8 }, { x: 0, y: -48 }, { x: 50, y: -8 } ],
  5: [ { x: 0, y: 48 }, { x: -50, y: 15 }, { x: -50, y: -40 }, { x: 50, y: -40 }, { x: 50, y: 15 } ],
  6: [ { x: 0, y: 48 }, { x: -40, y: 20 }, { x: -42, y: -32 }, { x: 0, y: -48 }, { x: 42, y: -32 }, { x: 40, y: 20 } ],
  7: [ { x: 0, y: 48 }, { x: -40, y: 32 }, { x: -50, y: -16 }, { x: -20, y: -45 }, { x: 20, y: -45 }, { x: 50, y: -16 }, { x:40, y: 32 } ],
  8: [ { x: 0, y: 48 }, { x: -40, y: 42 }, { x: -50, y: 0 }, { x: -40, y: -42 }, { x: 0, y: -48 }, { x: 40, y: -42 }, { x: 50, y: 0 }, { x: 40, y: 42 } ],
  9: [ { x: 0, y: 48 }, { x: -30, y: 44 }, { x: -42, y: 8 }, { x: -40, y: -30 }, { x: -14, y: -48 }, { x: 14, y: -48 }, { x: 40, y: -30 }, { x: 42, y: 8 }, { x: 30, y: 44 } ],
};

// Posicionamiento de las apuestas para cada configuración de mesa
const BET_PREDEFINED_LAYOUTS = {
  2: [
    { bottom: 'calc(-70% + 45px)', left: '-20%', transform: 'translateX(-50%)' }, // Hero (abajo centro)
    { top: 'calc(96% + 5px)', left: '120%', transform: 'translateX(-50%)' },     // Oponente (arriba)
  ],
  3: [
    { bottom: 'calc(45% + 45px)', left: '55%', transform: 'translateX(-50%)' }, // Hero (abajo centro) - visualIndex 0
    { top: '120%', right: '-40%', transform: 'translate(50%, -60%)', marginRight: '10px' }, // Izquierda - visualIndex 1 (hacia el centro)
    { top: '0%', left: '-70%', transform: 'translate(0%, 280%)', marginLeft: '10px' },  // Derecha - visualIndex 2 (hacia el centro)
  ],
  4: [
    { bottom: 'calc(45% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo)
    { top: '120%', right: '-40%', transform: 'translate(50%, -60%)', marginRight: '10px' }, // Izquierda
    { top: 'calc(90% + 5px)', left: '50%', transform: 'translateX(-50%)' },     // Arriba
    { top: '120%', left: '-40%', transform: 'translate(-50%, -60%)', marginLeft: '10px' },  // Derecha
  ],
  5: [
    { bottom: 'calc(45% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo)
    { bottom: '5%', right: '-60%', transform: 'translate(50%, 0)', marginRight: '10px' },     // Izquierda abajo
    { top: '110%', right: '-40%', transform: 'translate(50%, -50%)', marginRight: '10px' },     // Izquierda arriba
    { top: '110%', left: '-40%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },      // Derecha arriba
    { bottom: '5%', left: '-60%', transform: 'translate(-50%, 0)', marginLeft: '10px' },      // Derecha abajo
  ],
  6: [
    { top: 'calc(-52% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo) - apuesta arriba del jugador
    { bottom: '15%', left: '120%', transform: 'translate(-50%, 0)', marginLeft: '10px' },     // Izquierda abajo - apuesta a la derecha
    { top: '115%', left: '30%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },     // Izquierda arriba - apuesta a la derecha
    { bottom: 'calc(-30% + 5px)', left: '50%', transform: 'translateX(-50%)' },     // Arriba centro - apuesta debajo del jugador
    { top: '115%', right: '30%', transform: 'translate(50%, -50%)', marginRight: '10px' },      // Derecha arriba - apuesta a la izquierda
    { bottom: '15%', right: '120%', transform: 'translate(50%, 0)', marginRight: '10px' },      // Derecha abajo - apuesta a la izquierda
  ],
  7: [
    { bottom: 'calc(45% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo)
    { bottom: '30%', right: '-50%', transform: 'translate(50%, 0)', marginRight: '10px' },     // Izquierda abajo
    { top: '110%', right: '0%', transform: 'translate(50%, -50%)', marginRight: '10px' },     // Izquierda medio
    { top: 'calc(95% + 5px)', left: '30%', transform: 'translateX(-50%)' },     // Arriba izquierda
    { top: 'calc(95% + 5px)', left: '70%', transform: 'translateX(-50%)' },     // Arriba derecha
    { top: '110%', left: '0%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },      // Derecha medio
    { bottom: '30%', left: '-40%', transform: 'translate(-50%, 0)', marginLeft: '10px' },      // Derecha abajo
  ],
  8: [
    { bottom: 'calc(45% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo)
    { bottom: '60%', right: '-50%', transform: 'translate(50%, 0)', marginRight: '10px' },     // Izquierda abajo
    { top: '90%', right: '-50%', transform: 'translate(50%, -50%)', marginRight: '10px' },     // Izquierda medio
    { top: '115%', right: '-15%', transform: 'translate(50%, -50%)', marginRight: '10px' },     // Izquierda arriba
    { top: 'calc(90% + 5px)', left: '50%', transform: 'translateX(-50%)' },     // Arriba centro
    { top: '115%', left: '-15%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },      // Derecha arriba
    { top: '90%', left: '-50%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },      // Derecha medio
    { bottom: '60%', left: '-50%', transform: 'translate(-50%, 0)', marginLeft: '10px' },      // Derecha abajo
  ],
  9: [
    { bottom: 'calc(45% + 45px)', left: '50%', transform: 'translateX(-50%)' }, // Hero (abajo centro)
    { bottom: 'calc(35% + 45px)', left: '120%', transform: 'translateX(-50%)' }, // Izquierda Hero
    { bottom: '0%', right: '-40%', transform: 'translate(50%, 0)', marginRight: '10px' },     // Izquierda medio abajo
    { top: '80%', right: '-40%', transform: 'translate(50%, -50%)', marginRight: '10px' },     // Izquierda arriba
    { top: 'calc(90% + 5px)', left: '80%', transform: 'translateX(-50%)' },     // Arriba izquierda
    { top: 'calc(90% + 5px)', left: '35%', transform: 'translateX(-50%)' },     // Arriba derecha
    { top: '80%', left: '-40%', transform: 'translate(-50%, -50%)', marginLeft: '10px' },      // Derecha arriba
    { bottom: '0%', left: '-40%', transform: 'translate(-50%, 0)', marginLeft: '10px' },      // Derecha medio abajo
    { bottom: 'calc(35% + 45px)', left: '-20%', transform: 'translateX(-50%)' }, // Derecha Hero
  ],
};

const seatCoordinates = computed(() => {
  // Si el jugador tiene coordenadas personalizadas, úsalas
  if (props.player.x !== null && props.player.y !== null) {
    return { x: props.player.x, y: props.player.y };
  }
  // El visualIndex [0] es siempre el Héroe en la parte inferior.
  const visualIndex = (props.index - props.heroIndex + props.playerCount) % props.playerCount;
  if (PREDEFINED_LAYOUTS[props.playerCount]) {
    return PREDEFINED_LAYOUTS[props.playerCount][visualIndex];
  }
  // Fallback para 10+ jugadores (aunque la UI actual no lo permite, es bueno tenerlo)
  return { x: 0, y: 0 };
});

// --- ESTILO DE ASIENTO (MODIFICADO PARA RESPONSIVE) ---
const seatStyle = computed(() => {
  const { x, y } = seatCoordinates.value; // x e y ya son porcentajes
  return {
    // Posiciona el centro del contenedor del jugador en las coordenadas calculadas
    top: `calc(50% + ${y}%)`,
    left: `calc(50% + ${x}%)`,
    // Luego, usa transform para mover el elemento por la mitad de su propio tamaño
    // para que quede perfectamente centrado en ese punto.
    transform: 'translate(-50%, -50%)',
  };
});

const betBoxStyle = computed(() => {
  // El visualIndex [0] es siempre el Héroe en la parte inferior.
  const visualIndex = (props.index - props.heroIndex + props.playerCount) % props.playerCount;

  // Usamos el sistema de layouts predefinidos para las apuestas
  if (BET_PREDEFINED_LAYOUTS[props.playerCount]) {
    return BET_PREDEFINED_LAYOUTS[props.playerCount][visualIndex];
  }

  // Fallback por si no existe configuración para esta cantidad de jugadores
  return { bottom: 'calc(100% + 45px)', left: '50%', transform: 'translateX(-50%)' };
});
</script>

<style scoped>
/* --- ESTILOS BASE (ESCRITORIO) --- */
.player-container {
  position: absolute;
  z-index: 5;
  /* El tamaño del jugador es un porcentaje del tamaño de la mesa, haciéndolo responsive */
  width: 18%;
  max-width: 150px; /* Evita que sea demasiado grande en pantallas enormes */
  height: 50%;
}

.player-seat {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 110%;
  height: 60px;
  background: none;
  border: none;
  transition: all 0.3s ease;
}

.player-info-panel {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(45, 55, 72, 0.95) 0%, rgba(26, 32, 44, 0.95) 100%);
  border: 1px solid rgba(74, 85, 104, 0.5);
  border-radius: 8px;
  padding: 6px 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  text-align: center;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.player-cards {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 5%;
  width: 95%;
  z-index: 12;
  margin-bottom: 0;
}

.card-placeholder {
  width: 70%; 
  height: auto;
  aspect-ratio: 100 / 140; 
  cursor: pointer;
  position: relative;
}

.player-position {
  font-weight: 600;
  font-size: clamp(0.65rem, 1.1vw, 0.85em);
  color: #d4af37;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  line-height: 1;
  text-align: center;
  margin-bottom: 2px;
}

.player-name {
  font-weight: 700;
  font-size: clamp(0.7rem, 1.1vw, 0.9em);
  color: #E2E8F0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  word-break: break-word;
  hyphens: auto;
  line-height: 1.1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin-bottom: 2px;
  text-align: center;
  max-width: 100%;
}

.player-stack {
  font-family: 'Roboto Mono', monospace;
  font-size: clamp(0.75rem, 1.25vw, 0.95em);
  font-weight: 700;
  color: #FFFFFF;
  background-color: rgba(0,0,0,0.3);
  border-radius: 4px;
  padding: 1px 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active .player-info-panel {
  border-color: #ffd700;
  border-width: 2px;
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.7),
              0 0 12px rgba(255, 215, 0, 0.5) inset,
              0 4px 15px rgba(0, 0, 0, 0.4);
  animation: active-player-pulse 2s infinite ease-in-out;
}

@keyframes active-player-pulse {
  0%, 100% {
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.7),
                0 0 12px rgba(255, 215, 0, 0.5) inset,
                0 4px 15px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 35px rgba(255, 215, 0, 0.85),
                0 0 18px rgba(255, 215, 0, 0.65) inset,
                0 4px 15px rgba(0, 0, 0, 0.4);
  }
}

.faded {
  opacity: 0.5;
}

.dealer-button-inline {
  display: inline-flex;
  width: 18px;
  height: 18px;
  background: #d4af37;
  color: #1a202c;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.7rem;
  justify-content: center;
  align-items: center;
  border: 1px solid #d4af37;
  margin: 0 auto;
}

.bet-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 11;
  transition: all 0.2s ease;
}

/* Reduce size for bomb pot bets to prevent overlapping */
.bet-box.bomb-pot-bet {
  transform: scale(0.50);
  transform-origin: center center;
}

.bet-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: -8px; /* <--- ¡AQUÍ ESTÁ LA MAGIA! AJUSTA ESTE VALOR */
}

.bet-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.bet-amount-text {
  background-color: rgba(0,0,0,0.8);
  border: 1px solid #000;
  padding: 0.5px 4px;
  border-radius: 6px;
  font-size: 0.6em;
  font-weight: bold;
  color: white;
  white-space: nowrap;
}

.all-in-icon {
  width: 40px;
  height: 40px;
}

.check-indicator {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #d4af37;
  font-weight: bold;
  font-size: 0.7em;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 13;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.is-hero .player-info-panel {
  border-color: #68d391;
  box-shadow: 0 0 15px #68d391, 0 0 12px #68d391 inset, 0 4px 15px rgba(0, 0, 0, 0.4);
}

.player-input {
  background-color: #1a202c;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  border-radius: 4px;
  text-align: center;
  padding: 2px 4px;
  max-width: 100%;
}
.player-name-input {
  font-size: 0.9em;
  width: 70px;
}
.player-stack-input {
  font-size: 1em;
  width: 70px;
  -moz-appearance: textfield;
}
.player-stack-input::-webkit-outer-spin-button,
.player-stack-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.stack-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.editable-name-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.edit-notes-btn, .notes-display-wrapper {
  position: absolute;
  top: 2px;
  right: -8px;
  z-index: 15;
}

.edit-notes-btn {
  background: rgba(45, 55, 72, 0.9);
  border: 1.5px solid rgba(74, 85, 104, 0.5);
  border-radius: 50%;
  width: 22px;
  height: 22px;
  padding: 2px;
  cursor: pointer;
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-notes-btn:hover {
  background: rgba(74, 85, 104, 1);
  color: white;
}
.notes-panel {
  width: 220px;
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  z-index: 9999; /* Z-index muy alto para estar sobre todo */
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  max-width: 90vw;
  pointer-events: auto; /* Enable interactions inside portal */
}

.notes-panel-centered {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
}

@media screen and (max-width: 768px) {
  .notes-panel {
    width: 280px;
    padding: 12px;
  }

  .notes-panel-centered {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
  }

  .notes-panel textarea {
    height: 120px;
    font-size: 1rem;
  }

  .tags-container {
    gap: 8px;
  }

  .tag-selector {
    width: 28px;
    height: 28px;
  }
}
.notes-panel textarea {
  width: 100%;
  height: 100px;
  resize: vertical;
  background-color: #1a202c;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 5px;
  font-family: inherit;
  font-size: 0.9rem;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-selector {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s;
}
.tag-selector:hover {
  transform: scale(1.1);
}
.tag-selector.selected {
  border-color: white;
  box-shadow: 0 0 5px white;
}
.notes-display-wrapper {
  position: absolute;
  top: -4px;
  left: -8px;
  z-index: 9998 !important; /* Muy alto para estar sobre todo excepto modales */
  pointer-events: auto !important;
  display: block !important;
  cursor: pointer;
  touch-action: manipulation; /* Mejora respuesta táctil en móvil */
}
.notes-display-icon {
  width: 20px;
  height: 20px;
  color: #d4af37;
  cursor: pointer;
  background-color: rgba(45, 55, 72, 0.95);
  border-radius: 50%;
  padding: 3px;
  border: 1.5px solid rgba(212, 175, 55, 0.6);
  position: relative;
  z-index: 9998;
  transition: all 0.2s ease;
  pointer-events: auto;
  display: block;
}

.notes-display-icon:hover {
  color: #ffd700;
  background-color: rgba(55, 65, 81, 1);
  border-color: rgba(255, 215, 0, 0.8);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.notes-display-icon:active {
  transform: scale(0.95);
}

/* Tooltip de notas centrado en la mesa */
.notes-tooltip-centered {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  min-width: 250px;
  max-width: min(500px, 85vw);
  max-height: 70vh;
  overflow-y: auto;
  background-color: #1a202c;
  color: #fff;
  text-align: left;
  border-radius: 10px;
  padding: 16px 18px;
  z-index: 9999;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  border: 2px solid rgba(212, 175, 55, 0.5);
  box-shadow:
    0 10px 40px rgba(0,0,0,0.8),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 0 25px rgba(212, 175, 55, 0.2);
  animation: tooltipFadeIn 0.25s ease;
  pointer-events: auto;
  /* Styled scrollbar for dark theme */
  scrollbar-width: thin;
  scrollbar-color: rgba(212, 175, 55, 0.6) rgba(26, 32, 44, 0.4);
}

/* Webkit scrollbar styling for Chrome/Safari */
.notes-tooltip-centered::-webkit-scrollbar {
  width: 10px;
}

.notes-tooltip-centered::-webkit-scrollbar-track {
  background: rgba(26, 32, 44, 0.5);
  border-radius: 5px;
  margin: 4px 0;
}

.notes-tooltip-centered::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.6);
  border-radius: 5px;
  border: 2px solid rgba(26, 32, 44, 0.3);
}

.notes-tooltip-centered::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.8);
  border: 2px solid rgba(26, 32, 44, 0.2);
}

.notes-tooltip-centered::-webkit-scrollbar-thumb:active {
  background: rgba(212, 175, 55, 1);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* --- MEDIA QUERY PARA MÓVIL EN RETRATO (PORTRAIT) --- */
@media screen and (max-width: 768px) and (orientation: portrait) {
  .player-container {
    width: 24%;
    max-width: 110px;
    height: 45%;
  }

  .player-seat {
    height: 65px; /* Increased to accommodate wrapped text */
  }

  .player-info-panel {
    padding: 5px 3px;
    border-radius: 8px;
    min-height: 60px;
  }

  .player-cards {
    bottom: 40%;
    gap: 4%;
    width: 90%;
    margin-bottom: 0;
    left: 55%;
  }

  .card-placeholder {
    width: 68%;
  }

  .player-position {
    font-size: clamp(0.6rem, 1.6vw, 0.75rem);
    margin-bottom: 1px;
  }

  .player-name {
    font-size: clamp(0.6rem, 1.7vw, 0.8rem);
    gap: 2px;
    margin-bottom: 1px;
    flex-wrap: wrap;
    max-width: 100%;
    line-height: 1.1;
  }

  .player-stack {
    font-size: clamp(0.7rem, 2vw, 0.9rem);
    padding: 1px 3px;
  }

  .dealer-button-inline {
    width: 16px;
    height: 16px;
    font-size: 0.65rem;
  }

  .bet-box {
    gap: 2px;
  }

  /* Bomb pot bets on mobile portrait - slightly less aggressive scaling */
  .bet-box.bomb-pot-bet {
    transform: scale(0.45);
  }

  .bet-amount-text {
    font-size: 0.55em;
    padding: 2px 6px;
  }

  .all-in-icon {
    width: 32px;
    height: 32px;
  }

  .edit-notes-btn {
    width: 20px;
    height: 20px;
    top: 2px;
    right: -6px;
    padding: 1.5px;
  }

  .notes-display-wrapper {
    width: 18px;
    height: 18px;
    top: 2px;
    left: -6px;
  }

  /* Tooltip de notas en móvil - más grande y legible */
  .notes-tooltip-centered {
    font-size: 1.1rem;
    padding: 16px 18px;
    min-width: 260px;
    max-width: 85vw;
    max-height: 60vh;
    line-height: 1.7;
    border-radius: 12px;
  }

  .notes-display-icon {
    width: 22px;
    height: 22px;
    transition: transform 0.2s ease;
  }

  .notes-display-icon:active {
    transform: scale(0.9);
  }

  .check-indicator {
    font-size: 0.6em;
    padding: 2px 6px;
  }
}

/* --- MEDIA QUERY PARA MÓVIL/TABLET EN HORIZONTAL --- */
@media screen and (max-width: 900px) and (orientation: landscape) {
  .player-container {
    width: 20%; /* Aumentamos el ancho relativo para que no se vea tan pequeño */
    height: 45%;
    max-width: 120px; /* Limitamos el ancho máximo en píxeles */
  }
  .player-seat {
    height: 45px; /* Reducimos aún más la altura del panel */
  }
  .player-info-panel {
    padding: 2px; /* Menos padding */
    border-radius: 6px;
  }
  .player-cards {
    top: -55%; /* Subimos las cartas para que se solapen con el panel */
    gap: 2%;
  }
  .dealer-button-inline {
    width: 16px;
    height: 16px;
    font-size: 0.65rem;
  }
  .bet-box {
    transform: scale(0.75) translateY(-50%); /* Hacemos más pequeña la info de apuesta */
  }

  /* Bomb pot bets on mobile landscape - even more compact */
  .bet-box.bomb-pot-bet {
    transform: scale(0.40) translateY(-50%);
  }

  /* Ocultamos el botón de edición para maximizar el espacio, pero mantenemos visible las notas en modo lectura */
  .edit-notes-btn, .player-tag {
    display: none;
  }

  /* Tooltip de notas en landscape - ajustado para pantalla horizontal */
  .notes-tooltip-centered {
    font-size: 0.95rem;
    padding: 12px 14px;
    min-width: 220px;
    max-width: 75vw;
    max-height: 55vh;
    line-height: 1.5;
  }

  .notes-display-icon {
    width: 18px;
    height: 18px;
  }

  .check-indicator {
    font-size: 0.55em;
    padding: 2px 5px;
  }
}
/* --- ESTILOS PARA 9+ JUGADORES (MÁS COMPACTO) --- */
.is-9-max .player-seat {
  height: 50px;
  width: 100%;
}

.is-9-max .player-info-panel {
  padding: 3px 2px;
}

.is-9-max .player-position {
  font-size: clamp(0.65rem, 1.1vw, 0.85em);
}

.is-9-max .player-name {
  font-size: clamp(0.7rem, 1.1vw, 0.9em);
  gap: 2px;
}

.is-9-max .player-stack {
  font-size: clamp(0.75rem, 1.25vw, 0.95em);
}

.is-9-max .player-cards {
  bottom: 100%;
  left: 50%;
  width: 95%;
  gap: 5%;
  margin-bottom: 0;
}

.is-9-max .card-placeholder {
  width: 60%;
}

.is-9-max .edit-notes-btn {
  width: 16px;
  height: 16px;
  top: 2px;
  right: -8px;
  padding: 1.5px;
}

.is-9-max .dealer-button-inline {
  width: 16px;
  height: 16px;
  font-size: 0.65rem;
}

/* 9-max en retrato (portrait) */
@media screen and (max-width: 768px) and (orientation: portrait) {
  .is-9-max .player-container {
    width: 20%;
    max-width: 95px;
  }

  .is-9-max .player-seat {
    height: 58px; /* Increased to accommodate wrapped text in 9-max */
  }

  .is-9-max .player-info-panel {
    padding: 4px 2px;
    min-height: 55px;
  }

  .is-9-max .player-cards {
    bottom: 40%;
    gap: 4%;
    width: 90%;
    margin-bottom: 0;
  }

  .is-9-max .card-placeholder {
    width: 58%;
  }

  .is-9-max .player-position {
    font-size: clamp(0.6rem, 1.6vw, 0.75rem);
    margin-bottom: 1px;
  }

  .is-9-max .player-name {
    font-size: clamp(0.6rem, 1.7vw, 0.8rem);
    gap: 2px;
    /* Ensure text wrapping in 9-max portrait mode */
    flex-wrap: wrap;
    max-width: 100%;
    line-height: 1.1;
  }

  .is-9-max .player-stack {
    font-size: clamp(0.7rem, 2vw, 0.9rem);
  }

  .is-9-max .dealer-button-inline {
    width: 14px;
    height: 14px;
    font-size: 0.6rem;
  }

  .is-9-max .bet-amount-text {
    font-size: 0.5em;
  }

  /* Bomb pot bets in 9-max portrait - extra compact */
  .is-9-max .bet-box.bomb-pot-bet {
    transform: scale(0.40);
  }

  .is-9-max .edit-notes-btn {
    width: 18px;
    height: 18px;
    top: 2px;
    right: -6px;
    padding: 1.5px;
  }

  .is-9-max .check-indicator {
    font-size: 0.55em;
    padding: 2px 5px;
  }
}

@media screen and (max-width: 900px) and (orientation: landscape) {
  .is-9-max .player-seat {
    height: 40px;
  }

  /* Bomb pot bets in 9-max landscape - most compact */
  .is-9-max .bet-box.bomb-pot-bet {
    transform: scale(0.35) translateY(-50%);
  }
}
</style>