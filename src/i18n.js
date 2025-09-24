import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';

// Puedes añadir más importaciones de idiomas aquí
// import fr from './locales/fr.json';
// import zh from './locales/zh.json';

const i18n = createI18n({
  legacy: false, // Importante para usarlo en Composition API
  locale: localStorage.getItem('locale') || 'es', // Carga el idioma guardado o usa español por defecto
  fallbackLocale: 'en', // Idioma de respaldo si una traducción no existe
  messages: {
    es,
    en,
    // fr,
    // zh,
  },
});

export default i18n;