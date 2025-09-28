<template>
  <div class="player-container" :style="seatStyle" :class="{ 'is-9-max': playerCount >= 9 }">

    <div class="player-cards">
        <div class="card-placeholder" @click="handleCardClick(player.id, 0)">
          <PlayingCard v-if="player.cards[0]" :cardId="player.cards[0]" />
          <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="140" rx="8" fill="#4A5568"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="bold">+</text>
          </svg>
        </div>
        <div class="card-placeholder" @click="handleCardClick(player.id, 1)">
          <PlayingCard v-if="player.cards[1]" :cardId="player.cards[1]" />
          <svg v-else width="100%" height="100%" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="140" rx="8" fill="#4A5568"/>
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="60" font-weight="bold">+</text>
          </svg>
        </div>
    </div>
    
    <div class="player-seat" :class="{ faded: !player.inHand, active: isActivePlayer, 'is-hero': player.name === 'Hero' }">
      
      <div v-if="player.isDealer" class="dealer-button" :style="dealerButtonStyle">D</div>

      <div class="player-info-panel">
        <div class="player-info">
          <div class="player-name">
            <span v-if="player.tag" class="player-tag" :style="{ backgroundColor: player.tag }"></span>
            <div v-if="gameStore.isPreActionPhase" class="editable-name-wrapper">
              <input
                type="text"
                :value="player.name"
                @change="gameStore.updatePlayerName(player.id, $event.target.value)"
                class="player-input player-name-input"
              />
              <span class="player-position-static">({{ player.position }})</span>
            </div>
            <span v-else>{{ player.name }} ({{ player.position }})</span>
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
              <span v-else>{{ (player.stack / gameStore.bigBlind).toFixed(1) }} BBs</span>
            </span>
          </div>
        </div>
      </div>
      
      <button v-if="gameStore.isPreActionPhase" @click="gameStore.toggleNotesPanel(player.id)" class="edit-notes-btn" ref="editBtnRef">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      </button>

      <div v-if="!gameStore.isPreActionPhase && player.notes" class="notes-display-wrapper">
        <svg class="notes-display-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <div class="notes-tooltip">{{ player.notes }}</div>
      </div>
    </div>

    <div v-if="isNotesPanelOpen" class="notes-panel" :style="notesPanelStyle" ref="notesPanelRef">
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

    <div v-if="player.betThisRound > 0" class="bet-box" :style="betBoxStyle">
      <ChipStack :amount="player.betThisRound" :bigBlind="gameStore.bigBlind" />
      <div class="bet-info">
        <div class="bet-amount-container">
          <div class="bet-amount-text">
            <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.betThisRound }}</span>
            <span v-else>{{ (player.betThisRound / gameStore.bigBlind).toFixed(1) }}</span>
          </div>
        </div>
        <img v-if="player.isAllIn" src="/icons/all-in-icon.svg" alt="All-in" class="all-in-icon" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../store/game'
import PlayingCard from './PlayingCard.vue';
import ChipStack from './ChipStack.vue';

const notesPanelRef = ref(null);
const editBtnRef = ref(null);

const tagColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

const props = defineProps({
  player: Object,
  playerCount: Number,
  index: Number,
  heroIndex: Number,
})

const gameStore = useGameStore();

const isNotesPanelOpen = computed(() => gameStore.openNotesPanelPlayerId === props.player.id);

function handleCardClick(playerId, cardIndex) {
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const isActivePlayer = computed(() => gameStore.activePlayerIndex === props.player.id);

// --- LÓGICA DE POSICIONAMIENTO DE ASIENTOS (MODIFICADA PARA RESPONSIVE) ---
// Las coordenadas ahora son porcentajes del radio de la mesa (ej: x: 50 es el borde derecho).
// La posición [0] es siempre la inferior central (la vista del Héroe).
const PREDEFINED_LAYOUTS = {
  2: [ { x: 50, y: -10 }, { x: -50, y: -10 } ],
  3: [ { x: 0, y: 50 }, { x: -50, y: -25 }, { x: 45, y: -25 } ],
  4: [ { x: 0, y: 50 }, { x: -50, y: 0 }, { x: 0, y: -50 }, { x: 50, y: 0 } ],
  5: [ { x: 0, y: 50 }, { x: -45, y: 25 }, { x: -35, y: -40 }, { x: 35, y: -40 }, { x: 45, y: 25 } ],
  6: [ { x: 0, y: 50 }, { x: -48, y: 20 }, { x: -48, y: -40 }, { x: 0, y: -55 }, { x: 48, y: -40 }, { x: 48, y: 20 } ],
  7: [ { x: 0, y: 50 }, { x: -40, y: 35 }, { x: -50, y: -25 }, { x: -20, y: -50 }, { x: 20, y: -50 }, { x: 50, y: -25 }, { x: 40, y: 35 } ],
  8: [ { x: 2, y: 53 }, { x: -33, y: 50 }, { x: -55, y: -10 }, { x: -28, y: -48 }, { x: 0, y: -52 }, { x: 30, y: -48 }, { x: 55, y: -10 }, { x: 35, y: 50 } ],
  9: [ { x: 0, y: 50 }, { x: -30, y: 50 }, { x: -50, y: 5 }, { x: -45, y: -50 }, { x: -14, y: -60 }, { x: 16, y: -60 }, { x: 45, y: -50 }, { x: 50, y: 5 }, { x: 30, y: 50 } ],
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


const dealerButtonStyle = computed(() => {
  return {
    bottom: '-40px',
    left: '57%',
    transform: 'translateX(-50%)'
  };
});
const betBoxStyle = computed(() => {
  const { x, y } = seatCoordinates.value;
  const thresholdY = 30; // Umbral en porcentaje para decidir si está arriba/abajo
  const thresholdX = 35; // Umbral en porcentaje para decidir si está a los lados

  if (y > thresholdY) { // Asientos inferiores
    return { top: '-30%', left: '50%', transform: 'translateX(-50%)', zIndex: 11 };
  } else if (y < -thresholdY) { // Asientos superiores
    return { bottom: '-45%', left: '50%', transform: 'translateX(-50%)', zIndex: 11 };
  } else if (x < -thresholdX) { // Asientos de la izquierda
    return { right: '-40%', top: '50%', transform: 'translateY(-50%)', zIndex: 11 };
  } else { // Asientos de la derecha
    return { left: '-35%', top: '50%', transform: 'translateY(-50%)', zIndex: 11 };
  }
});
const notesPanelStyle = computed(() => {
  return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
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
  padding: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  text-align: center;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.player-cards {
  position: absolute;
  top: 10px;
  left: 62%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 5%;
  width: 100%;
  z-index: 1;
}

.card-placeholder {
  width: 70%; 
  height: auto;
  aspect-ratio: 100 / 140; 
  cursor: pointer;
  position: relative;
}

.player-name {
  font-weight: 700;
  /* Usamos clamp para un tamaño de fuente fluido */
  font-size: clamp(0.7rem, 1.2vw, 1.1em);
  color: #E2E8F0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}

.player-stack {
  font-family: 'Roboto Mono', monospace;
  font-size: clamp(0.8rem, 1.4vw, 1.2em);
  font-weight: 700;
  color: #FFFFFF;
  background-color: rgba(0,0,0,0.3);
  border-radius: 4px;
  padding: 2px 6px;
}

.active .player-info-panel {
  border-color: #f6e05e;
  box-shadow: 0 0 30px rgba(246, 224, 94, 0.5), 0 4px 15px rgba(0, 0, 0, 0.4);
}

.faded {
  opacity: 0.5;
}

.dealer-button {
  position: absolute;
  width: 25px;
  height: 25px;
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  color: #333;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(0,0,0,0.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 15;
}

.bet-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  z-index: 9;
}

.bet-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.bet-amount-text {
  background-color: rgba(0,0,0,0.8);
  border: 1px solid #000;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 1em;
  font-weight: bold;
  color: white;
  white-space: nowrap;
}

.all-in-icon {
  width: 40px;
  height: 40px;
}

.is-hero .player-info-panel {
  border-color: #68d391;
  animation: hero-glow 2s infinite ease-in-out;
}

@keyframes hero-glow {
  0%, 100% {
    box-shadow: 0 0 8px #68d391, 0 0 10px #68d391 inset, 0 4px 15px rgba(0, 0, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 20px #68d391, 0 0 15px #68d391 inset, 0 4px 15px rgba(0, 0, 0, 0.4);
  }
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
.player-position-static {
  font-size: 0.9em;
  color: #a0aec0;
}

.edit-notes-btn, .notes-display-wrapper {
  position: absolute;
  top: -4px;
  right: -26px;
  z-index: 15;
}

.edit-notes-btn {
  background: rgba(45, 55, 72, 0.9);
  border: 3px solid rgba(74, 85, 104, 0.5);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  padding: 2px;
  cursor: pointer;
  color: #cbd5e0;
}
.edit-notes-btn:hover {
  background: rgba(74, 85, 104, 1);
  color: white;
}
.notes-panel {
  position: absolute;
  width: 220px;
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
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
.player-tag {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.5);
}
.notes-display-wrapper {
  position: absolute;
  top: -4px;
  left: -8px;
  z-index: 15;
}
.notes-display-icon {
  width: 24px;
  height: 24px;
  color: #a0aec0;
  cursor: pointer;
  background-color: rgba(45, 55, 72, 0.9);
  border-radius: 50%;
  padding: 2px;
  border: 1px solid rgba(74, 85, 104, 0.5);
}
.notes-display-wrapper .notes-tooltip {
  visibility: hidden;
  opacity: 0;
  width: 200px;
  background-color: #1a202c;
  color: #fff;
  text-align: left;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 25;
  bottom: 125%;
  left: 50%;
  margin-left: -100px;
  transition: opacity 0.3s;
  font-size: 0.9rem;
  font-weight: normal;
  white-space: pre-wrap;
  border: 1px solid var(--border-color);
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
}
.notes-display-wrapper:hover .notes-tooltip {
  visibility: visible;
  opacity: 1;
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
  .dealer-button {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    bottom: -25px; /* Acercamos el botón de dealer */
  }
  .bet-box {
    transform: scale(0.75) translateY(-50%); /* Hacemos más pequeña la info de apuesta */
  }
  /* Ocultamos elementos no esenciales para maximizar el espacio */
  .edit-notes-btn, .notes-display-wrapper, .player-tag, .player-position-static {
    display: none;
  }
}
/* --- ESTILOS PARA 9+ JUGADORES (MÁS COMPACTO) --- */
.is-9-max .player-seat {
  height: 50px;
}

.is-9-max .player-info-panel {
  padding: 4px;
}

.is-9-max .player-name {
  font-size: clamp(0.6rem, 1.1vw, 0.9em);
}

.is-9-max .player-stack {
  font-size: clamp(0.7rem, 1.3vw, 1em);
}

.is-9-max .player-cards {
  top: -20px;
  gap: 1%;
  width: 80%;
  left: 50%;
}

.is-9-max .card-placeholder {
  width: 65%;
}

@media screen and (max-width: 900px) and (orientation: landscape) {
  .is-9-max .player-seat {
    height: 40px;
    bottom: 10px;
  }
  .is-9-max .player-cards {
    top: -50%;
  }
    .is-9-max .player-name, .is-9-max .player-stack {
    font-size: 0.7rem;
  }
}

/* --- ESTILOS PARA 9 JUGADORES (MÁS COMPACTO) --- */
.is-9-max .player-seat {
  height: 50px;
  width: 100%;
}

.is-9-max .player-info-panel {
  padding: 4px;
}

.is-9-max .player-name {
  font-size: clamp(0.6rem, 1.1vw, 0.9em);
  gap: 4px;
}

.is-9-max .player-stack {
  font-size: clamp(0.7rem, 1.3vw, 1em);
}

.is-9-max .player-cards {
  top: 23px; /* Sube un poco las cartas */
  left: 60%;
  width: 90%;
  gap: 2%;
}

.is-9-max .card-placeholder {
  width: 60%;
}

.is-9-max .edit-notes-btn {
  width: 26px;
  height: 26px;
  top: -8px;
  right: -20px;
}

.is-9-max .dealer-button {
  width: 22px;
  height: 22px;
  font-size: 0.9rem;
  bottom: -30px;
}

@media screen and (max-width: 900px) and (orientation: landscape) {
  .is-9-max .player-seat {
    height: 40px;
  }
  .is-9-max .player-cards {
    top: -60%;
  }
}
</style>