import { supabase } from '@/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * ============================================================================
 * ARCHIVO CENTRAL DE OPERACIONES DE BASE DE DATOS
 * ============================================================================
 */

// Función auxiliar para obtener el usuario actual de forma segura
const getCurrentUser = async () => {
  console.log('[DEBUG] getCurrentUser: Starting...');

  // First, try to get user from authStore (reactive and up-to-date)
  const authStore = useAuthStore();
  if (authStore.user) {
    console.log('[DEBUG] getCurrentUser: User found in authStore, ID:', authStore.user.id);
    return authStore.user;
  }

  console.log('[DEBUG] getCurrentUser: No user in authStore, falling back to Supabase calls...');

  try {
    // Add short timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session retrieval timeout')), 3000)
    );

    const sessionPromise = supabase.auth.getSession();
    const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
    console.log('[DEBUG] getCurrentUser: getSession returned, session exists:', !!session, 'error:', error ? error.message : 'none');

    if (error) {
      console.error("[DEBUG] getCurrentUser: Error from getSession:", error);
      return null;
    }
    if (!session?.user) {
      console.warn("[DEBUG] getCurrentUser: No session or user found");
      return null;
    }
    console.log('[DEBUG] getCurrentUser: User authenticated via getSession, ID:', session.user.id, 'email:', session.user.email);
    return session.user;
  } catch (timeoutError) {
    console.error('[DEBUG] getCurrentUser: Timeout or error getting session:', timeoutError.message);
    // As fallback, try to get user directly
    console.log('[DEBUG] getCurrentUser: Attempting fallback with getUser...');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[DEBUG] getCurrentUser: getUser error:', userError);
        return null;
      }
      if (user) {
        console.log('[DEBUG] getCurrentUser: Fallback successful, user ID:', user.id);
        return user;
      }
    } catch (fallbackError) {
      console.error('[DEBUG] getCurrentUser: Fallback failed:', fallbackError.message);
    }
    return null;
  }
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
  
  const { data, error } = await supabase
    .from('sesiones_juego')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error("Error en apiAddSession:", error);
    throw error;
  }
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
// API para Manos Guardadas (manos_guardadas)
// ----------------------------------------------------------------------------

export const apiFetchHands = async (date = null, limit = null, offset = 0) => {
  console.log('[DEBUG] apiFetchHands: Starting with params - date:', date, 'limit:', limit, 'offset:', offset);
  const user = await getCurrentUser();
  console.log('[DEBUG] apiFetchHands: User obtained:', user ? `ID: ${user.id}` : 'not authenticated');

  console.log('[DEBUG] apiFetchHands: Building query...');
  let query = supabase
    .from('manos_guardadas')
    .select('*');

  // Re-enable user filter - ensure RLS policy allows select for authenticated users
  if (user) {
    query = query.eq('usuario_id', user.id);
    console.log('[DEBUG] apiFetchHands: Added user filter for ID:', user.id);
  } else {
    console.log('[DEBUG] apiFetchHands: No user filter applied');
  }

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    query = query.gte('fecha_creacion', startDate.toISOString()).lt('fecha_creacion', endDate.toISOString());
    console.log('[DEBUG] apiFetchHands: Added date filter from', startDate.toISOString(), 'to', endDate.toISOString());
  }

  query = query.order('fecha_creacion', { ascending: false });
  console.log('[DEBUG] apiFetchHands: Added ordering by fecha_creacion desc');

  if (limit !== null && limit !== undefined) {
    query = query.range(offset || 0, (offset || 0) + limit - 1);
    console.log('[DEBUG] apiFetchHands: Added range from', offset || 0, 'to', (offset || 0) + limit - 1);
  }

  console.log('[DEBUG] apiFetchHands: Executing query...');

  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
  );

  const queryPromise = query;
  const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

  console.log('[DEBUG] apiFetchHands: Query completed - error:', error ? `${error.message} (code: ${error.code})` : 'none', 'data count:', data ? data.length : 'null');

  if (error) {
    console.error("[DEBUG] apiFetchHands: Full error object:", error);
    throw error;
  }

  console.log('[DEBUG] apiFetchHands: Returning data array of length:', data?.length || 0);
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

// ----------------------------------------------------------------------------
// API para Viajes de Poker (viajes_poker y relacionadas)
// ----------------------------------------------------------------------------

export const apiFetchTrips = async () => {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data: viajes, error: viajesError } = await supabase
        .from('viajes_poker')
        .select(`*, participantes_viaje(*), resultados_diarios_viaje(*)`)
        .eq('creador_id', user.id)
        .order('fecha_creacion', { ascending: false });

    if (viajesError) {
        console.error("Error en apiFetchTrips:", viajesError);
        throw viajesError;
    }

    return viajes.map(viaje => {
        const dailyResults = {};
        const tripDays = [];
        viaje.resultados_diarios_viaje.forEach(r => {
            const fecha = r.fecha;
            if (!dailyResults[fecha]) {
                dailyResults[fecha] = {};
                tripDays.push(fecha);
            }
            const participante = viaje.participantes_viaje.find(p => p.id === r.participante_id);
            if (participante) {
                dailyResults[fecha][participante.id] = {
                    result: r.resultado,
                    hours: r.horas_jugadas,
                    stake: r.stake
                };
            }
        });
        
        return { ...viaje, players: viaje.participantes_viaje.map(p => ({
            id: p.id,
            name: p.nombre_jugador,
            individualBankroll: p.aportacion_banca,
            participation: p.porcentaje_participacion
        })), tripDays: tripDays.sort(), dailyResults };
    });
};

// *** FUNCIÓN COMPLETAMENTE REESCRITA PARA SIMPLIFICAR ***
export const apiAddOrUpdateTrip = async (tripData) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Usuario no autenticado");
    
    let tripId = tripData.id;

    // PASO 1: Insertar o actualizar el viaje principal.
    const tripPayload = {
        creador_id: user.id,
        ciudad: tripData.city,
        casino: tripData.casino,
        moneda: tripData.currency,
        tipo_reparto: tripData.repartoType,
        activo: tripData.isTripActive,
        fecha_viaje: new Date().toISOString().split('T')[0],
    };

    if (tripId) { // Es una actualización
        tripPayload.id = tripId;
        const { error } = await supabase.from('viajes_poker').update(tripPayload).eq('id', tripId);
        if (error) throw new Error(`Error actualizando el viaje principal: ${error.message}`);
    } else { // Es una inserción
        const { data, error } = await supabase.from('viajes_poker').insert(tripPayload).select('id').single();
        if (error) throw new Error(`Error creando el viaje principal: ${error.message}`);
        tripId = data.id;
    }

    // PASO 2: Borrar participantes y resultados antiguos para evitar duplicados.
    await supabase.from('resultados_diarios_viaje').delete().eq('viaje_id', tripId);
    await supabase.from('participantes_viaje').delete().eq('viaje_id', tripId);
    
    // PASO 3: Insertar los nuevos participantes.
    const participantsPayload = tripData.players.map(p => ({
        viaje_id: tripId,
        nombre_jugador: p.name,
        aportacion_banca: p.individualBankroll || 0,
        porcentaje_participacion: p.participation || 0
    }));

    const { data: newParticipants, error: participantsError } = await supabase
        .from('participantes_viaje')
        .insert(participantsPayload)
        .select('id, nombre_jugador');
        
    if (participantsError) throw new Error(`Error guardando participantes: ${participantsError.message}`);

    // PASO 4: Insertar los nuevos resultados diarios.
    const resultsPayload = [];
    Object.entries(tripData.dailyResults).forEach(([date, dailyData]) => {
        Object.entries(dailyData).forEach(([frontendPlayerId, resultData]) => {
            const playerFrontend = tripData.players.find(p => p.id === frontendPlayerId);
            const participantBackend = newParticipants.find(p => p.nombre_jugador === playerFrontend.name);
            if (participantBackend) {
                resultsPayload.push({
                    viaje_id: tripId,
                    participante_id: participantBackend.id,
                    fecha: date,
                    resultado: resultData.result || 0,
                    horas_jugadas: resultData.hours || 0,
                    stake: resultData.stake || ''
                });
            }
        });
    });

    if (resultsPayload.length > 0) {
        const { error: resultsError } = await supabase.from('resultados_diarios_viaje').insert(resultsPayload);
        if (resultsError) throw new Error(`Error guardando resultados diarios: ${resultsError.message}`);
    }

    return tripId; // Devolvemos el ID del viaje guardado/actualizado.
};

export const apiDeleteTrip = async (tripId) => {
    const { error } = await supabase.from('viajes_poker').delete().eq('id', tripId);
    if (error) {
        console.error("Error en apiDeleteTrip:", error);
        throw error;
    }
};