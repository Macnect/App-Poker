# 🔍 Guía de Troubleshooting - Manos de Torneo

## Problema: No aparecen las manos guardadas en Torneos

Sigue estos pasos en orden para encontrar y solucionar el problema:

---

## ✅ Paso 1: Verifica que la tabla existe

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Clic en **"Table Editor"** (menú lateral izquierdo)
3. Busca la tabla **`manos_guardadas_torneos`**

### ❌ Si NO aparece la tabla:
- **Problema**: La tabla no se creó
- **Solución**: Ejecuta el script SQL (`create_tournament_hands_table.sql`) como se indica en `INSTRUCCIONES_TABLA_TORNEOS.md`

### ✅ Si SÍ aparece la tabla:
- Continúa al Paso 2

---

## ✅ Paso 2: Verifica las políticas RLS (Row Level Security)

1. En Supabase, estando en la tabla `manos_guardadas_torneos`
2. Haz clic en el botón **"RLS"** (arriba a la derecha)
3. Verifica que aparezcan **4 políticas activas**:
   - ✅ Los usuarios pueden ver sus propias manos de torneo (SELECT)
   - ✅ Los usuarios pueden insertar sus propias manos de torneo (INSERT)
   - ✅ Los usuarios pueden actualizar sus propias manos de torneo (UPDATE)
   - ✅ Los usuarios pueden eliminar sus propias manos de torneo (DELETE)

### ❌ Si NO aparecen las políticas:
- **Problema**: El script SQL no se ejecutó completo
- **Solución**: Vuelve a ejecutar TODO el script SQL completo

### ✅ Si SÍ aparecen las políticas:
- Continúa al Paso 3

---

## ✅ Paso 3: Abre la Consola del Navegador (DevTools)

### En Chrome/Edge:
1. Presiona `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Ve a la pestaña **"Console"**

### En Firefox:
1. Presiona `F12` o `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
2. Ve a la pestaña **"Consola"**

---

## ✅ Paso 4: Guarda una mano en Torneos

1. En tu aplicación, ve a **Torneos**
2. Clic en **"Iniciar Mano"**
3. Selecciona tu posición
4. Juega la mano
5. Haz clic en el botón de **"Guardar Mano"** (ícono de diskette)

---

## ✅ Paso 5: Busca mensajes en la Consola

Mira la consola del navegador y busca estos mensajes:

### 🟢 Mensajes CORRECTOS (todo está bien):
```
[DEBUG] Mano de torneo guardada con ID: [algún-uuid]
[DEBUG] tournamentStore.fetchHands: Starting with date: null
[DEBUG] tournamentStore.fetchHands: Received 1 hands
[DEBUG] tournamentStore.fetchHands: Total hands now: 1 , hasMore: false
[DEBUG] Manos de torneo cargadas: 1
```

Si ves estos mensajes, tu mano SÍ se guardó correctamente.

---

### 🔴 Mensaje de ERROR 1: "relation does not exist"

```
Error en apiAddTournamentHand: relation "public.manos_guardadas_torneos" does not exist
```

**Causa**: La tabla no existe en Supabase
**Solución**: Ejecuta el script SQL para crear la tabla

---

### 🔴 Mensaje de ERROR 2: "permission denied"

```
Error en apiAddTournamentHand: permission denied for table manos_guardadas_torneos
```

**Causa**: Las políticas RLS no están configuradas correctamente
**Solución**: Vuelve a ejecutar TODO el script SQL (especialmente la parte de políticas)

---

### 🔴 Mensaje de ERROR 3: "Usuario no autenticado"

```
Error en apiAddTournamentHand: Usuario no autenticado
```

**Causa**: No has iniciado sesión en la aplicación
**Solución**: Cierra sesión y vuelve a iniciar sesión

---

### 🔴 Mensaje de ERROR 4: "Timeout"

```
Query timeout after 10 seconds
```

**Causa**: Problema de conexión con Supabase
**Solución**:
1. Verifica tu conexión a internet
2. Verifica que el proyecto de Supabase esté activo
3. Verifica las credenciales en tu archivo `.env` o configuración de Supabase

---

## ✅ Paso 6: Verifica en Supabase que la mano se guardó

1. Ve a **Supabase Dashboard** → **Table Editor**
2. Haz clic en la tabla **`manos_guardadas_torneos`**
3. Busca tu mano guardada (debería aparecer en la primera fila)

### ✅ Si la mano APARECE en Supabase:
- **La mano se guardó correctamente**
- El problema es que la UI no se está actualizando
- Continúa al Paso 7

### ❌ Si la mano NO APARECE en Supabase:
- **La mano NO se guardó**
- Revisa los mensajes de error en la consola (Paso 5)

---

## ✅ Paso 7: Verifica que las manos se cargan correctamente

1. En la aplicación, ve a **Torneos**
2. Haz clic en la pestaña **"Manos Guardadas"**
3. Observa la consola del navegador

### 🟢 Mensajes CORRECTOS:
```
[DEBUG] tournamentStore.fetchHands: Starting with date: null
[DEBUG] apiFetchTournamentHands: Starting with params - date: null limit: 20 offset: 0
[DEBUG] apiFetchTournamentHands: Building query...
[DEBUG] apiFetchTournamentHands: User obtained: ID: [tu-user-id]
[DEBUG] apiFetchTournamentHands: Added user filter for ID: [tu-user-id]
[DEBUG] apiFetchTournamentHands: Added ordering by fecha_creacion desc
[DEBUG] apiFetchTournamentHands: Added range from 0 to 19
[DEBUG] apiFetchTournamentHands: Executing query...
[DEBUG] apiFetchTournamentHands: Query completed - error: none data count: 1
[DEBUG] apiFetchTournamentHands: Returning data array of length: 1
[DEBUG] tournamentStore.fetchHands: Received 1 hands
[DEBUG] Manos de torneo cargadas: 1
```

### 🔴 Si hay ERRORES:
- Copia todo el mensaje de error
- Busca el error correspondiente en el Paso 5

---

## ✅ Paso 8: Verifica el campo de fecha

Si la mano se guardó en Supabase PERO no aparece en la UI:

1. En Supabase, abre la tabla **`manos_guardadas_torneos`**
2. Mira la columna **`fecha`** de tu mano guardada
3. Verifica que tenga un valor como: `2025-01-15T10:30:00.000Z`

### ❌ Si el campo `fecha` está vacío o NULL:
- **Problema**: El campo de fecha no se guardó
- **Solución**: Necesitamos arreglar el código del store

---

## 🆘 Si nada funciona

Si después de seguir todos los pasos aún no funciona:

### Información que necesito:

1. **Screenshot de la consola del navegador** con TODOS los mensajes
2. **Screenshot de Supabase** mostrando la tabla `manos_guardadas_torneos`
3. **Responde estas preguntas**:
   - ¿La tabla existe en Supabase? (SÍ/NO)
   - ¿Aparecen las 4 políticas RLS? (SÍ/NO)
   - ¿Estás logueado en la aplicación? (SÍ/NO)
   - ¿Aparece algún error en la consola? (SÍ/NO) - ¿Cuál?
   - ¿La mano aparece en Supabase? (SÍ/NO)

Con esa información podré ayudarte a encontrar el problema exacto.

---

## 📋 Checklist Rápido

- [ ] Tabla `manos_guardadas_torneos` existe en Supabase
- [ ] 4 políticas RLS activas
- [ ] Usuario logueado en la aplicación
- [ ] No hay errores en la consola al guardar
- [ ] La mano aparece en Supabase
- [ ] No hay errores en la consola al cargar manos
- [ ] El campo `fecha` tiene un valor válido
