import { supabase } from '@/supabase';

/**
 * ============================================================================
 * ARCHIVO CENTRAL DE OPERACIONES DE BASE DE DATOS
 * ============================================================================
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

export const apiFetchHands = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('manos_guardadas')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha_creacion', { ascending: false });

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