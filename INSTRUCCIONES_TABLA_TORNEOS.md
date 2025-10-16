# Instrucciones para Crear la Tabla de Manos de Torneo en Supabase

## Pasos para ejecutar la migración:

### Opción 1: Usando el Editor SQL de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú lateral izquierdo, selecciona **"SQL Editor"**
3. Haz clic en **"New query"**
4. Abre el archivo `supabase/migrations/create_tournament_hands_table.sql` que se encuentra en tu proyecto
5. Copia todo el contenido del archivo SQL
6. Pégalo en el editor SQL de Supabase
7. Haz clic en **"Run"** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)
8. Si todo está correcto, verás el mensaje de éxito: **"Success. No rows returned"**

### Opción 2: Usando Supabase CLI (Si tienes el CLI instalado)

1. Abre tu terminal en la raíz del proyecto
2. Ejecuta:
   ```bash
   supabase db push
   ```
   Esto aplicará todas las migraciones pendientes, incluyendo la tabla de torneos.

## Verificación

Para verificar que la tabla se creó correctamente:

1. Ve a **"Table Editor"** en el panel de Supabase
2. Busca la tabla **`manos_guardadas_torneos`**
3. Deberías ver todas las columnas:
   - `id` (UUID, Primary Key)
   - `usuario_id` (UUID, Foreign Key a auth.users)
   - `fecha` (Timestamp)
   - `fecha_creacion` (Timestamp)
   - `posicion_heroe` (Text)
   - `cantidad_jugadores` (Integer)
   - `historial` (JSONB)
   - `ciega_pequena` (Numeric)
   - `ciega_grande` (Numeric)
   - `moneda` (Text)
   - `game_variant` (Text)
   - `buy_in` (Numeric) - **Específico de torneos**
   - `tournament_type` (Text) - **Específico de torneos**
   - `is_itm` (Boolean) - **Específico de torneos**
   - `remaining_players` (Integer) - **Específico de torneos**
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

## Características de la Tabla

### Seguridad (RLS)
- ✅ Row Level Security (RLS) habilitado
- ✅ Los usuarios solo pueden ver, insertar, actualizar y eliminar sus propias manos
- ✅ Las políticas están vinculadas a `auth.uid()`

### Índices para Rendimiento
- ✅ Índice en `usuario_id` para búsquedas rápidas por usuario
- ✅ Índice en `fecha_creacion` (descendente) para ordenar manos recientes
- ✅ Índice en `tournament_type` para filtrar por tipo de torneo

### Triggers
- ✅ Trigger automático para actualizar `updated_at` cuando se modifica una mano

## Diferencias con Manos de Cash

Las manos de **torneos** (`manos_guardadas_torneos`) se almacenan separadas de las manos de **cash games** (`manos_guardadas`), permitiendo:

- Filtrado independiente por tipo de juego
- Estadísticas separadas para cash vs torneos
- Campos específicos de torneos sin afectar la estructura de manos de cash
- Mejor organización y rendimiento de consultas

## Campos Específicos de Torneos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `buy_in` | Numeric | Precio del torneo (buy-in) |
| `tournament_type` | Text | Normal, Progressive KO, Total KO, Mystery KO |
| `is_itm` | Boolean | Si el jugador está In The Money (ITM) |
| `remaining_players` | Integer | Cantidad de participantes restantes |

## Solución de Problemas

### Error: "relation 'manos_guardadas_torneos' does not exist"
- **Causa**: La tabla no se ha creado todavía
- **Solución**: Ejecuta el script SQL como se indica en la Opción 1

### Error: "permission denied for table manos_guardadas_torneos"
- **Causa**: Las políticas RLS no se aplicaron correctamente
- **Solución**: Vuelve a ejecutar todo el script SQL completo

### Las manos no se guardan
- **Causa**: El usuario no está autenticado
- **Solución**: Verifica que `authStore.user` tenga un ID válido

## Próximos Pasos

Una vez creada la tabla:

1. ✅ Las manos de torneo se guardarán automáticamente en `manos_guardadas_torneos`
2. ✅ Las manos de cash seguirán guardándose en `manos_guardadas`
3. ✅ Cada apartado mostrará solo sus manos correspondientes
4. ✅ El filtrado por fecha funcionará independientemente en cada apartado
