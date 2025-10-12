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
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   SettingsView - Configuration Panel
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.settings-container {
  display: flex;
  justify-content: center;
  padding: 3rem 2rem;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
}

.settings-panel {
  width: 100%;
  max-width: 550px;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h2 {
  margin: 0 0 2.5rem 0;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 1.75rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  border-radius: 14px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.setting-item:hover {
  border-color: rgba(212, 175, 55, 0.25);
  transform: scale(1.01);
}

.setting-item label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.setting-item select {
  padding: 16px 20px;
  font-size: 1.15rem;
  font-weight: 500;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.setting-item select:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
}

.setting-item select:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.setting-item select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

/* Copyright Notice */
.copyright-notice {
  margin-top: 2.5rem;
  padding-top: 1.75rem;
  border-top: 1.5px solid rgba(212, 175, 55, 0.2);
  text-align: center;
  font-size: 0.9rem;
  color: #d1d5db;
  font-weight: 500;
  letter-spacing: 0.025em;
  line-height: 1.6;
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 640px) {
  .settings-container {
    padding: 2rem 1rem;
  }

  .settings-panel {
    padding: 2rem 1.5rem;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .setting-item {
    padding: 1.5rem;
  }

  .setting-item select {
    padding: 14px 18px;
    font-size: 1.05rem;
  }

  .copyright-notice {
    font-size: 0.85rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
  }
}
</style>