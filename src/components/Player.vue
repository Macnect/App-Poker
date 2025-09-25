<template>
  <div class="player-container" :style="seatStyle">

    <!-- Se añade la clase condicional 'is-hero' -->
    <div class="player-seat" :class="{ faded: !player.inHand, active: isActivePlayer, 'is-hero': player.name === 'Hero' }">

      <div v-if="player.isDealer" class="dealer-button" :style="dealerButtonStyle">D</div>

      <!-- Player cards positioned above the panel -->
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

      <!-- Player panel below the cards -->
      <div class="player-panel">
        <div class="player-info">
          <div class="player-name">{{ player.name }} ({{ player.position }})</div>
          <div class="player-stack">
            <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.stack }}</span>
            <span v-else>{{ (player.stack / gameStore.bigBlind).toFixed(1) }} BBs</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="player.betThisRound > 0" class="bet-box" :style="betBoxStyle">
      <ChipStack :amount="player.betThisRound" :bigBlind="gameStore.bigBlind" />
      <div class="bet-info">
        <div class="bet-amount-container">
          <div class="bet-amount-text">
            <span v-if="!gameStore.displayInBBs">{{ gameStore.currency }}{{ player.betThisRound }}</span>
            <span v-else>{{ (player.betThisRound / gameStore.bigBlind).toFixed(1) }} BBs</span>
          </div>
        </div>
        <img v-if="player.isAllIn" src="/icons/all-in-icon.svg" alt="All-in" class="all-in-icon" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../store/game'
import PlayingCard from './PlayingCard.vue';
import ChipStack from './ChipStack.vue';

const props = defineProps({
  player: Object,
  playerCount: Number,
  index: Number,
  heroIndex: Number,
})

const gameStore = useGameStore();

function handleCardClick(playerId, cardIndex) {
  const target = { type: 'player', id: playerId, cardIndex: cardIndex };
  if (props.player.cards[cardIndex]) {
    gameStore.unassignCard(target);
  } else {
    gameStore.openCardPicker(target);
  }
}

const isActivePlayer = computed(() => gameStore.activePlayerIndex === props.player.id);
const PREDEFINED_LAYOUTS = {
  3: [ { x: 0, y: 190 }, { x: -450, y: -100 }, { x: 450, y: -100 }, ],
  5: [ { x: 0, y: 190 }, { x: -450, y: 80 }, { x: -350, y: -200 }, { x: 350, y: -200 }, { x: 450, y: 80 }, ],
  6: [ { x: 0, y: 190 }, { x: -450, y: 100 }, { x: -450, y: -120 }, { x: 0, y: -220 }, { x: 450, y: -120 }, { x: 450, y: 100 }, ],
  7: [ { x: 0, y: 190 }, { x: -350, y: 160 }, { x: -480, y: 0 }, { x: -350, y: -200 }, { x: 350, y: -200 }, { x: 480, y: 0 }, { x: 350, y: 160 }, ],
  9: [ { x: 0, y: 190 }, { x: -300, y: 170 }, { x: -480, y: 80 }, { x: -480, y: -80 }, { x: -300, y: -220 }, { x: 300, y: -220 }, { x: 480, y: -80 }, { x: 480, y: 80 }, { x: 300, y: 170 }, ]
};
const seatCoordinates = computed(() => {
  const visualIndex = (props.index - props.heroIndex + props.playerCount) % props.playerCount;
  if (PREDEFINED_LAYOUTS[props.playerCount]) {
    return PREDEFINED_LAYOUTS[props.playerCount][visualIndex];
  } else {
    const angleRad = (Math.PI * 2 / props.playerCount) * visualIndex + Math.PI / 2;
    const radiusX = 450;
    const radiusY = 220;
    return { x: Math.cos(angleRad) * radiusX, y: Math.sin(angleRad) * radiusY };
  }
});
const seatStyle = computed(() => {
  const { x, y } = seatCoordinates.value;
  return { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` };
});
const dealerButtonStyle = computed(() => {
  const { x, y } = seatCoordinates.value;
  const styles = {};
  if (Math.abs(y) > Math.abs(x)) {
    styles.left = '50%';
    styles.transform = 'translateX(-50%)';
    if (y > 0) {
      styles.bottom = '90%';
    } else {
      styles.top = '90%';
    }
  } else {
    styles.top = '50%';
    styles.transform = 'translateY(-50%)';
    if (x > 0) {
      styles.right = '90%';
    } else {
      styles.left = '90%';
    }
  }
  return styles;
});
const betBoxStyle = computed(() => {
  const { x, y } = seatCoordinates.value;
  const verticalThreshold = 150;
  const horizontalThreshold = 300;
  if (y < -verticalThreshold) return { top: '105%', left: '50%', transform: 'translateX(-50%)' };
  if (y > verticalThreshold) return { bottom: '105%', left: '50%', transform: 'translateX(-50%)' };
  if (x > horizontalThreshold) return { right: '105%', top: '50%', transform: 'translateY(-50%)' };
  if (x < -horizontalThreshold) return { left: '105%', top: '50%', transform: 'translateY(-50%)' };
  if (y > 0) return { bottom: '105%', left: '50%', transform: 'translateX(-50%)' };
  else return { top: '105%', left: '50%', transform: 'translateX(-50%)' };
});
</script>

<style scoped>
.player-container {
  position: absolute;
  top: 50%;
  left: 50%;
}
.player-seat {
  width: 160px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  padding: 10px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  position: relative;
}
.active {
  border-color: #f6e05e;
  box-shadow: 0 0 15px #f6e05e;
}
.faded {
  opacity: 0.4;
}
.dealer-button {
  position: absolute;
  width: 25px;
  height: 25px;
  background-color: white;
  color: black;
  border-radius: 50%;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid black;
  z-index: 10;
}
.player-info {
  text-align: center;
}
.player-name {
  font-weight: bold;
  font-size: 1.1em;
}
.player-stack {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 2px;
}
.all-in-icon {
  width: 60px;
  height: 60px;
}
.player-cards {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 0px; /* Space between cards and panel */
  margin-top: -12px; /* Position cards outside the border */
}
.player-panel {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  padding: 6px;
  min-width: 120px;
  text-align: center;
}
.card-placeholder {
  width: var(--player-card-width);
  height: var(--player-card-height);
  background-color: transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, opacity 0.3s ease; /* Smooth animations */
}
.card-placeholder:hover {
  outline: 2px solid #f6e05e;
  transform: scale(1.05); /* Slight scale on hover for animation */
}

.bet-box {
  position: absolute;
  background-color: transparent;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bet-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.bet-amount-container {
  width: 45px;
  display: flex;
  justify-content: center;
}

.bet-amount-text {
  background-color: rgba(20, 20, 20, 0.8);
  border: 1px solid #000;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 1em;
  font-weight: bold;
  color: white;
  white-space: nowrap;
}

/* --- ESTILOS ADITIVOS PARA EL HALO DEL HERO --- */
.is-hero {
  /* Usamos un color verde consistente con la app */
  border-color: #68d391; 
  /* La animación 'hero-glow' se encargará del brillo pulsante */
  animation: hero-glow 2s infinite ease-in-out;
}

@keyframes hero-glow {
  0%, 100% {
    box-shadow: 0 0 8px #68d391, 0 0 10px #68d391 inset;
  }
  50% {
    box-shadow: 0 0 20px #68d391, 0 0 15px #68d391 inset;
  }
}

/* Responsive design */
@media (max-width: 1200px) {
  .player-seat {
    width: 140px;
    padding: 8px;
  }
  .player-cards {
    margin-top: -10px; /* Adjust for reduced padding */
  }
  .player-panel {
    min-width: 100px;
    padding: 4px;
  }
  .player-name {
    font-size: 1em;
  }
  .player-stack {
    font-size: 1em;
  }
  .all-in-icon {
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 768px) {
  .player-seat {
    width: 120px;
    padding: 6px;
  }
  .player-cards {
    margin-top: -8px; /* Adjust for reduced padding */
  }
  .player-panel {
    min-width: 80px;
    padding: 3px;
  }
  .player-name {
    font-size: 0.9em;
  }
  .player-stack {
    font-size: 0.9em;
  }
  .all-in-icon {
    width: 40px;
    height: 40px;
  }
  .card-placeholder {
    width: calc(var(--player-card-width) * 0.8);
    height: calc(var(--player-card-height) * 0.8);
  }
}
</style>