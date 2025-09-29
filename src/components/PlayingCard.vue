<template>
  <div class="playing-card" :class="suitDetails.colorClass">
    <span class="rank">{{ rank }}</span>
    <span class="suit-icon" v-html="suitDetails.icon"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cardId: {
    type: String,
    required: true,
  }
});

const rank = computed(() => props.cardId ? props.cardId.slice(0, -1) : '');
const suit = computed(() => props.cardId ? props.cardId.slice(-1) : '');

const suitDetails = computed(() => {
  switch (suit.value) {
    case 'S': return { icon: '&spades;', colorClass: 'black' };
    case 'H': return { icon: '&hearts;', colorClass: 'red' };
    case 'C': return { icon: '&clubs;', colorClass: 'green' };
    case 'D': return { icon: '&diams;', colorClass: 'blue' };
    default: return { icon: '', colorClass: 'disabled' };
  }
});
</script>



<style scoped>
.playing-card {
  width: 100%;
  height: 100%;
  border: 1px solid #4A5568;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'Arial Black', sans-serif;
  font-weight: bold;
  color: white;
  user-select: none;
  box-sizing: border-box;
}

.rank {
  font-size: 1.6rem;
  line-height: 1.1;
}

.suit-icon {
  font-size: 1rem;
  line-height: 1;
}

.playing-card.black { background-color: #2d3748; }
.playing-card.red { background-color: #c53030; }
.playing-card.green { background-color: #2f855a; }
.playing-card.blue { background-color: #2b6cb0; }
.playing-card.disabled { background-color: #4a5568; }
</style>