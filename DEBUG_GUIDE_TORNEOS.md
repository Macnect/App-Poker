# Guía de Debugging - Manos de Torneo

## Resumen de cambios

He añadido **logging comprehensivo** en todo el flujo de guardado y carga de manos de torneo. Ahora puedes ver exactamente qué está pasando en cada paso del proceso.

## Cómo usar esta guía

1. **Abre la consola del navegador** (F12 → pestaña Console)
2. **Sigue los pasos** en orden
3. **Copia todos los mensajes** que veas con `[DEBUG]`
4. **Compara con los ejemplos** de esta guía

---

## Flujo Completo: Guardar una Mano de Torneo

### Paso 1: Iniciar y jugar una mano

1. Ve a **Torneos** → **Crear Mano**
2. Haz clic en **"Iniciar Mano"**
3. Selecciona tu posición (Hero)
4. Juega la mano (realiza algunas acciones)

**Deberías ver en consola:**
```
[DEBUG] TournamentHandView: Component mounted
[DEBUG] TournamentHandView: Initial activeTab value: crear
[DEBUG] TournamentHandView: Auth initialized: true
[DEBUG] TournamentHandView: User: <tu-user-id>
```

### Paso 2: Hacer clic en el botón "Guardar Mano" (icono de diskette)

**Deberías ver esta secuencia EXACTA:**

```
[DEBUG] ActionPanel.handleSaveHand: Button clicked!
[DEBUG] ActionPanel.handleSaveHand: Using store: tournament
[DEBUG] ActionPanel.handleSaveHand: History length: <número>
[DEBUG] ActionPanel.handleSaveHand: Hero position: <posición>
[DEBUG] ActionPanel.handleSaveHand: Calling gameStore.saveCurrentHand()...
```

**Luego:**

```
[DEBUG] apiAddTournamentHand: Starting...
[DEBUG] apiAddTournamentHand: User authenticated, ID: <tu-user-id>
[DEBUG] apiAddTournamentHand: Data to insert: {
  usuario_id: <tu-user-id>,
  posicion_heroe: <posición>,
  cantidad_jugadores: <número>,
  tournament_type: <tipo>,
  buy_in: <buy-in>,
  historial_length: <número>
}
[DEBUG] apiAddTournamentHand: Executing INSERT query...
```

**Si todo va bien:**

```
[DEBUG] apiAddTournamentHand: Hand saved successfully! ID: <algún-uuid>
[DEBUG] Mano de torneo guardada con ID: <algún-uuid>
[DEBUG] ActionPanel.handleSaveHand: saveCurrentHand() returned: Hand ID: <algún-uuid>
[DEBUG] ActionPanel.handleSaveHand: Hand saved successfully, loading in replay mode...
[DEBUG] ActionPanel.handleSaveHand: Replay loaded
[DEBUG] ActionPanel.handleSaveHand: Visual feedback activated
```

### Paso 3: Ir a "Manos Guardadas"

Haz clic en la pestaña **"Manos Guardadas"**

**Deberías ver:**

```
[DEBUG] TournamentHandView: activeTab changed from crear to guardadas
[DEBUG] TournamentHandView: Tab is now "guardadas", loading hands...
[DEBUG] TournamentHandView.loadSavedHands: Starting...
[DEBUG] TournamentHandView.loadSavedHands: Calling tournamentStore.fetchHands()
```

**Luego:**

```
[DEBUG] tournamentStore.fetchHands: Starting with date: null
[DEBUG] apiFetchTournamentHands: Starting with params - date: null limit: 20 offset: 0
[DEBUG] apiFetchTournamentHands: User obtained: ID: <tu-user-id>
[DEBUG] apiFetchTournamentHands: Building query...
[DEBUG] apiFetchTournamentHands: Added user filter for ID: <tu-user-id>
[DEBUG] apiFetchTournamentHands: Added ordering by fecha_creacion desc
[DEBUG] apiFetchTournamentHands: Added range from 0 to 19
[DEBUG] apiFetchTournamentHands: Executing query...
```

**Si todo funciona correctamente:**

```
[DEBUG] apiFetchTournamentHands: Query completed - error: none data count: 1
[DEBUG] apiFetchTournamentHands: Returning data array of length: 1
[DEBUG] tournamentStore.fetchHands: Received 1 hands
[DEBUG] tournamentStore.fetchHands: Total hands now: 1 , hasMore: false
[DEBUG] TournamentHandView.loadSavedHands: fetchHands() completed
[DEBUG] TournamentHandView.loadSavedHands: Manos de torneo cargadas: 1
[DEBUG] TournamentHandView.loadSavedHands: First hand: {id: <uuid>, ...}
[DEBUG] TournamentHandView.loadSavedHands: isLoadingHands set to false
[DEBUG] TournamentHandView.groupedHands: Computing with 1 hands
[DEBUG] TournamentHandView.groupedHands: Returning 1 groups
[DEBUG] TournamentHandView.filteredAndSortedHands: Computing with 1 hands
[DEBUG] TournamentHandView.filteredAndSortedHands: Selected date: null
[DEBUG] TournamentHandView.filteredAndSortedHands: Returning 1 hands
```

---

## Posibles Errores y Diagnóstico

### Error 1: Usuario no autenticado

```
[DEBUG] apiAddTournamentHand: Usuario no autenticado
```

**Causa**: No has iniciado sesión o la sesión expiró
**Solución**: Cierra sesión y vuelve a iniciar sesión

---

### Error 2: Tabla no existe

```
[DEBUG] apiAddTournamentHand: Error inserting hand: relation "public.manos_guardadas_torneos" does not exist
[DEBUG] apiAddTournamentHand: Error code: 42P01
```

**Causa**: La tabla no fue creada en Supabase
**Solución**: Ejecuta el script SQL `create_tournament_hands_table.sql` en Supabase SQL Editor

---

### Error 3: Permission denied (RLS)

```
[DEBUG] apiAddTournamentHand: Error inserting hand: permission denied for table manos_guardadas_torneos
[DEBUG] apiAddTournamentHand: Error code: 42501
```

**Causa**: Las políticas RLS no están configuradas correctamente
**Solución**: Vuelve a ejecutar TODO el script SQL completo (especialmente la parte de políticas)

---

### Error 4: La mano se guarda pero no aparece en la lista

**Síntomas**: Ves los mensajes de éxito al guardar pero luego ves:

```
[DEBUG] apiFetchTournamentHands: Query completed - error: none data count: 0
[DEBUG] tournamentStore.fetchHands: Received 0 hands
[DEBUG] TournamentHandView.loadSavedHands: Manos de torneo cargadas: 0
```

**Diagnóstico**:
1. Ve a Supabase Dashboard → Table Editor → `manos_guardadas_torneos`
2. Verifica que la mano aparezca en la tabla
3. Verifica el campo `usuario_id` - debe coincidir con tu user ID

**Posibles causas**:
- Los `usuario_id` no coinciden
- Las políticas RLS están bloqueando el SELECT
- El campo `fecha_creacion` está vacío o NULL

---

### Error 5: Query timeout

```
[DEBUG] apiFetchTournamentHands: Query completed - error: Query timeout after 10 seconds
```

**Causa**: Problema de conexión con Supabase
**Solución**:
1. Verifica tu conexión a internet
2. Verifica que el proyecto de Supabase esté activo
3. Verifica las credenciales en tu configuración

---

## Qué información necesito si nada funciona

Si después de seguir esta guía todavía tienes problemas, necesito:

### 1. **TODOS los mensajes de consola**
Haz clic derecho en la consola → "Save as..." → Guarda como texto

### 2. **Screenshot de Supabase**
- Ve a Table Editor → `manos_guardadas_torneos`
- Captura de pantalla mostrando:
  - Si la tabla existe
  - Cuántas filas tiene
  - El botón RLS (arriba a la derecha) mostrando las políticas

### 3. **Responde estas preguntas**:
- [ ] ¿La tabla `manos_guardadas_torneos` existe en Supabase?
- [ ] ¿Aparecen las 4 políticas RLS activas?
- [ ] ¿Estás logueado en la aplicación?
- [ ] ¿Cuál es tu User ID? (lo ves en consola al inicio)
- [ ] ¿Aparece algún error en rojo en la consola?
- [ ] ¿La mano aparece en la tabla de Supabase después de guardarla?
- [ ] Si la mano aparece en Supabase, ¿cuál es el `usuario_id` de esa fila?

Con esta información podré identificar EXACTAMENTE dónde está el problema.

---

## Flujo Visual Esperado

```
USUARIO → BOTÓN GUARDAR
    ↓
ActionPanel.handleSaveHand()
    ↓
tournamentStore.saveCurrentHand()
    ↓
apiAddTournamentHand()
    ↓
Supabase INSERT query
    ↓
Mano guardada en base de datos
    ↓
savedHands.value.unshift(savedHand) ← Añade mano al array local
    ↓
Mano aparece en "Manos Guardadas"
```

---

## Checklist de Verificación Rápida

Antes de reportar un problema, verifica:

- [ ] La consola está abierta (F12)
- [ ] Todos los mensajes `[DEBUG]` están visibles
- [ ] Copiaste TODOS los mensajes de consola (no solo algunos)
- [ ] Verificaste en Supabase si la tabla existe
- [ ] Verificaste en Supabase si las políticas RLS están activas
- [ ] Verificaste en Supabase si la mano se guardó físicamente en la tabla
- [ ] Comparaste el `usuario_id` de la mano guardada con tu User ID de la consola

---

**Última actualización**: Debugging comprehensivo añadido - Todos los puntos del flujo están instrumentados con logs detallados
