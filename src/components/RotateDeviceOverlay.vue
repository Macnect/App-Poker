<template>
  <div class="rotate-overlay">
    <div class="rotate-content">
      <svg class="rotate-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.25a2.25 2.25 0 00-2.25-2.25h-4.5a2.25 2.25 0 00-2.25 2.25v4.5A2.25 2.25 0 006.75 12h4.5a2.25 2.25 0 002.25-2.25v-2.25" />
      </svg>
      <p>Por favor, gira tu dispositivo a modo vertical para usar esta función.</p>
    </div>
  </div>
</template>

<style scoped>
.rotate-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--bg-color); color: var(--text-color); display: flex; justify-content: center; align-items: center; text-align: center; z-index: 9999; }
.rotate-content { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 2rem; }
.rotate-icon { width: 80px; height: 80px; animation: rotate-animation 2s infinite ease-in-out; }
p { font-size: 1.2rem; font-weight: bold; max-width: 300px; }
@keyframes rotate-animation { 0% { transform: rotate(0deg); } 50% { transform: rotate(90deg); } 100% { transform: rotate(90deg); } }
</style>