<template>
  <div class="settings-container">
    <div class="settings-panel">
      <h2>{{ $t('settings.title') }}</h2>
      <div class="setting-item">
        <label for="language-select">{{ $t('settings.language') }}</label>
        <select id="language-select" v-model="settingsStore.locale">
          <option value="es">Español</option>
          <option value="en">English</option>
          <!-- Aquí puedes añadir más idiomas cuando crees sus archivos .json -->
        </select>
      </div>

      <!-- AVISO DE COPYRIGHT AÑADIDO -->
      <div class="copyright-notice">
        © {{ new Date().getFullYear() }} Tracker de Poker en Vivo. Protegido con Copyright. Todos los derechos reservados.
      </div>

    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../store/useSettingsStore';
const settingsStore = useSettingsStore();
</script>

<style scoped>
.settings-container {
  display: flex;
  justify-content: center;
  padding: 3rem;
}
.settings-panel {
  width: 100%;
  max-width: 500px;
  background-color: #2d3748;
  border-radius: 12px;
  padding: 2rem;
}
h2 {
  margin-top: 0;
  text-align: center;
}
.setting-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.setting-item label {
  font-weight: bold;
}
.setting-item select {
  padding: 12px;
  font-size: 1.1rem;
}

/* --- ESTILOS ADITIVOS PARA EL AVISO DE COPYRIGHT --- */
.copyright-notice {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 0.9rem;
  color: #a0aec0;
}
</style>