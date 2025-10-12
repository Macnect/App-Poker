<template>
  <div class="tournaments-view">
    <div class="content-container">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      </div>

      <h1 class="title">{{ $t('tournaments.title') }}</h1>
      <p class="subtitle">{{ $t('tournaments.comingSoon') }}</p>

      <div class="features-list">
        <div class="feature-item">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>{{ $t('tournaments.feature1') }}</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>{{ $t('tournaments.feature2') }}</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>{{ $t('tournaments.feature3') }}</span>
        </div>
        <div class="feature-item">
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>{{ $t('tournaments.feature4') }}</span>
        </div>
      </div>

      <button class="back-button" @click="$emit('back-to-selector')">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {{ $t('tournaments.backToSelector') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

defineEmits(['back-to-selector']);
</script>

<style scoped>
.tournaments-view {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.content-container {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.icon-container {
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 8px 32px rgba(212, 175, 55, 0.15);
}

.icon-container svg {
  width: 64px;
  height: 64px;
  color: #d4af37;
  filter: drop-shadow(0 4px 8px rgba(212, 175, 55, 0.3));
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
}

.subtitle {
  font-size: 1.25rem;
  color: #9ca3af;
  font-weight: 400;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 3rem;
  padding: 0 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
  border: 1px solid rgba(156, 163, 175, 0.2);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  text-align: left;
  transition: all 0.3s ease;
}

.feature-item:hover {
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.1);
}

.feature-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3));
}

.feature-icon svg {
  width: 20px;
  height: 20px;
  color: #10b981;
}

.feature-item span {
  color: #e5e7eb;
  font-size: 1rem;
  font-weight: 500;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #f9fafb;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  border: 2px solid rgba(156, 163, 175, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.back-button:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.9) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.3),
    0 0 24px rgba(212, 175, 55, 0.1);
}

.back-button:active {
  transform: translateY(0);
}

@media (min-width: 640px) {
  .title {
    font-size: 3rem;
  }

  .subtitle {
    font-size: 1.5rem;
  }

  .features-list {
    padding: 0 2rem;
  }
}
</style>
