import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase' // Usamos el alias '@' que configuraste

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const user = ref(null)
  const session = ref(null)
  const profile = ref(null)

  // --- ACTIONS ---

  // Escucha cambios en el estado de autenticación (login, logout)
  function listenToAuthState() {
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (user.value) {
        await fetchUserProfile()
      } else {
        profile.value = null
      }
    })
  }

  // Obtiene el perfil del usuario desde nuestra tabla 'perfiles'
  async function fetchUserProfile() {
    if (!user.value) return
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (error) throw error
      profile.value = data
    } catch (error) {
      console.error('Error fetching user profile:', error.message)
    }
  }

  // Iniciar sesión
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  // Registrarse
  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Pasamos metadatos que el trigger usará para crear el perfil
        data: {
          nombre_usuario: username
        }
      }
    })
    if (error) throw error
    return data
  }

  // Cerrar sesión
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    session,
    profile,
    listenToAuthState,
    fetchUserProfile,
    signIn,
    signUp,
    signOut,
  }
})