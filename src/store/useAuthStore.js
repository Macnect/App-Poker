import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
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
    if (!user.value) {
      profile.value = null;
      return;
    };
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
      profile.value = null;
    }
  }

  function listenToAuthState() {
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;
      isInitialized.value = true;
    });
  }

  watch(user, async (newUser, oldUser) => {
    await fetchUserProfile();

    if (newUser?.id !== oldUser?.id) {
      if (newUser) {
        const gameStore = useGameStore();
        const sessionStore = useSessionStore();
        const tripStore = useTripStore();
        await Promise.all([
          gameStore.fetchHands(),
          sessionStore.fetchSessions(),
          tripStore.fetchTrips()
        ]);
      } else {
        profile.value = null;
        useGameStore().savedHands = [];
        // ==========================================================
        // ===> INICIO DEL CAMBIO: LIMPIEZA DE SESIÓN ACTIVA       <===
        // ==========================================================
        const sessionStore = useSessionStore();
        sessionStore.clearActiveSession(); // Limpia la sesión del localStorage
        sessionStore.savedSessions = []; // Limpia las sesiones guardadas
        // ==========================================================
        // ===> FIN DEL CAMBIO                                     <===
        // ==========================================================
        useTripStore().savedTrips = [];
      }
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
    // ==========================================================
    // ===> INICIO DEL CAMBIO: LIMPIEZA DE SESIÓN ACTIVA       <===
    // ==========================================================
    // También limpiamos aquí para asegurar que se borre al hacer clic en "Salir"
    useSessionStore().clearActiveSession();
    // ==========================================================
    // ===> FIN DEL CAMBIO                                     <===
    // ==========================================================
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return {
    user,
    session,
    profile,
    rol: computed(() => profile.value?.rol),
    isInitialized,
    listenToAuthState,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
  };
});