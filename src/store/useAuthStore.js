import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { supabase } from '@/supabase';
import { useGameStore } from './game';
import { useSessionStore } from './useSessionStore';
import { useTripStore } from './useTripStore';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const profile = ref(null);
  const isInitialized = ref(false);

  async function fetchUserProfile() {
    if (!user.value) return;
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.value.id)
        .single();
      if (error) throw error;
      profile.value = data;
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
    }
  }

  // Listener simple que SÓLO gestiona el estado de autenticación.
  function listenToAuthState() {
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;
      isInitialized.value = true;
    });
  }

  // WATCHER: El corazón de la nueva solución.
  // Reacciona cuando el usuario cambia (login/logout).
  watch(user, async (newUser, oldUser) => {
    if (newUser) {
      // Si hay un nuevo usuario (login), cargamos su perfil y todos sus datos.
      await fetchUserProfile();
      const gameStore = useGameStore();
      const sessionStore = useSessionStore();
      const tripStore = useTripStore();
      await Promise.all([
        gameStore.fetchHands(),
        sessionStore.fetchSessions(),
        tripStore.fetchTrips()
      ]);
    } else if (oldUser && !newUser) {
      // Si el usuario desaparece (logout), limpiamos los stores.
      profile.value = null;
      useGameStore().savedHands = [];
      useSessionStore().savedSessions = [];
      useTripStore().savedTrips = [];
    }
  });

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_usuario: username } }
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return {
    user,
    session,
    profile,
    isInitialized,
    listenToAuthState, // Reemplaza a initializeAuth
    signIn,
    signUp,
    signOut,
  };
});