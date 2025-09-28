<template>
  <div class="chip-stack-container">
    <div v-if="stackDetails.count > 0" class="chip-stack">
      <div
        v-for="i in stackDetails.count"
        :key="i"
        class="chip"
        :style="{
          backgroundColor: stackDetails.color,
          bottom: (i - 1) * 3 + 'px', // Reducimos el espaciado para un stack más compacto
          zIndex: stackDetails.count - i,
          '--chip-color': stackDetails.color, // Pasamos el color como variable CSS
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  bigBlind: {
    type: Number,
    required: true,
  },
});

const chipDenominations = [
  { value: 1000, color: '#D6A2E8' },
  { value: 500, color: '#82589F' },
  { value: 100, color: '#1A202C' },
  { value: 25, color: '#2F855A' },
  { value: 5, color: '#C53030' },
  { value: 1, color: '#E2E8F0' },
];

const stackDetails = computed(() => {
  if (props.amount <= 0) {
    return { color: 'transparent', count: 0 };
  }

  const primaryChip = chipDenominations.find(chip => props.amount >= chip.value) || chipDenominations[chipDenominations.length - 1];
  const betInBBs = props.amount / props.bigBlind;

  // --- LÓGICA DE CANTIDAD DE FICHAS AJUSTADA ---
  let count;
  if (betInBBs <= 1) {       // Apuestas mínimas (ciegas, limps)
    count = 2;
  } else if (betInBBs <= 5) { // Apuestas de continuación pequeñas
    count = 4;
  } else if (betInBBs <= 15) { // Subidas estándar, 3-bets
    count = 6;
  } else if (betInBBs <= 40) { // Apuestas grandes en el turn/river
    count = 8;
  } else if (betInBBs <= 100) { // Botes muy grandes
    count = 10;
  } else {                   // All-ins enormes
    count = 12; // Máximo de 12 fichas para mantenerlo visualmente limpio
  }

  return {
    color: primaryChip.color,
    count: count,
  };
});
</script>

<style scoped>
/* --- ESTILOS 3D COMPLETAMENTE NUEVOS --- */
.chip-stack-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 30px;
  width: 45px;
  /* La perspectiva es clave para el efecto 3D */
  perspective: 500px;
}

.chip-stack {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.chip {
  position: absolute;
  width: 15px;
  height: 25px;
  border-radius: 50%;
  box-sizing: border-box;
  left: 15px; /* Centrado en el contenedor de 45px */
  
  /* --- EFECTO 3D Y REALISMO --- */

  /* 1. Inclinación para dar perspectiva */
  transform: rotateX(70deg); 
  
  /* 2. Sombra proyectada por la ficha */
  box-shadow: 0 10px 8px rgba(0, 0, 0, 0.4);

  /* 3. Grosor y color del borde de la ficha */
  border-bottom: 5px solid color-mix(in srgb, var(--chip-color) 70%, black);

  /* 4. Reflejo de luz en la parte superior para dar volumen */
  background-image: radial-gradient(
    circle at 50% 10%, 
    rgba(255, 255, 255, 0.6), 
    transparent 70%
  );
}

/* Detalle de las franjas en la cara de la ficha */
.chip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 85%;
  height: 85%;
  border-radius: 50%;
  /* Usamos un borde discontinuo para un look clásico */
  border: 2px dashed color-mix(in srgb, var(--chip-color) 60%, white);
  opacity: 0.8;
}
</style>