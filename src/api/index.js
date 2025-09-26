import { supabase } from '@/supabase';

/**
 * ============================================================================
 * ARCHIVO CENTRAL DE OPERACIONES DE BASE DE DATOS
 * ============================================================================
 * Este archivo es el único punto de contacto con Supabase.
 * Los stores de Pinia llamarán a estas funciones.
 */

// Función auxiliar para obtener el usuario actual de forma segura
const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error al obtener la sesión:", error);
    return null;
  }
  if (!session?.user) {
    console.warn("Intento de operación sin usuario autenticado.");
    return null;
  }
  return session.user;
};


// ----------------------------------------------------------------------------
// API para Sesiones de Juego (sesiones_juego)
// ----------------------------------------------------------------------------

export const apiFetchSessions = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('sesiones_juego')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha', { ascending: false });

  if (error) {
    console.error("Error en apiFetchSessions:", error);
    throw error;
  }
  return data;
};

export const apiAddSession = async (sessionData) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Usuario no autenticado");

  const dataToInsert = { ...sessionData, usuario_id: user.id };
  
  console.log("API: Enviando a Supabase:", dataToInsert);

  const { data, error } = await supabase
    .from('sesiones_juego')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error("Error en apiAddSession:", error);
    throw error;
  }
  console.log("API: Respuesta de Supabase:", data);
  return data;
};

export const apiDeleteSession = async (sessionId) => {
  const { error } = await supabase
    .from('sesiones_juego')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error("Error en apiDeleteSession:", error);
    throw error;
  }
};

// ----------------------------------------------------------------------------
// API para Manos Guardadas (manos_guardadas) - ¡NUEVA SECCIÓN!
// ----------------------------------------------------------------------------

export const apiFetchHands = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('manos_guardadas')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha_creacion', { ascending: false }); // Ordenamos por fecha de creación

  if (error) {
    console.error("Error en apiFetchHands:", error);
    throw error;
  }
  return data;
};

export const apiAddHand = async (handData) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Usuario no autenticado");

  const dataToInsert = { ...handData, usuario_id: user.id };

  const { data, error } = await supabase
    .from('manos_guardadas')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error("Error en apiAddHand:", error);
    throw error;
  }
  return data;
};

export const apiDeleteHand = async (handId) => {
  const { error } = await supabase
    .from('manos_guardadas')
    .delete()
    .eq('id', handId);

  if (error) {
    console.error("Error en apiDeleteHand:", error);
    throw error;
  }
};