<template>
  <TournamentHandView @go-to-cash="$emit('go-to-cash')" />
</template>

<script setup>
import TournamentHandView from './TournamentHandView.vue';

defineEmits(['go-to-cash']);
</script>

<style scoped>
/* No se necesitan estilos adicionales - TournamentHandView maneja todo */
</style>
