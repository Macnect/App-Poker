import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import i18n from '../i18n'; // Importamos la instancia de i18n

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref(localStorage.getItem('locale') || 'es');

  function setLocale(newLocale) {
    locale.value = newLocale;
  }

  // Observador que actualiza la librería i18n y el localStorage cuando cambia el idioma
  watch(locale, (newLocale) => {
    i18n.global.locale.value = newLocale;
    localStorage.setItem('locale', newLocale);
  });

  return {
    locale,
    setLocale,
  };
});