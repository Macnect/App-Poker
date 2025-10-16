-- Tabla para manos guardadas de torneos
-- Esta tabla es similar a 'manos_guardadas' pero incluye campos específicos de torneos

CREATE TABLE IF NOT EXISTS public.manos_guardadas_torneos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    posicion_heroe TEXT NOT NULL,
    cantidad_jugadores INTEGER NOT NULL,
    historial JSONB NOT NULL,
    ciega_pequena NUMERIC NOT NULL,
    ciega_grande NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT '$',
    game_variant TEXT DEFAULT 'holdem',

    -- Campos específicos de torneos
    buy_in NUMERIC NOT NULL DEFAULT 100,
    tournament_type TEXT DEFAULT 'Normal',
    is_itm BOOLEAN DEFAULT false,
    remaining_players INTEGER DEFAULT 50,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_manos_guardadas_torneos_usuario_id
    ON public.manos_guardadas_torneos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_manos_guardadas_torneos_fecha_creacion
    ON public.manos_guardadas_torneos(fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_manos_guardadas_torneos_tournament_type
    ON public.manos_guardadas_torneos(tournament_type);

-- Row Level Security (RLS)
ALTER TABLE public.manos_guardadas_torneos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias manos
CREATE POLICY "Los usuarios pueden ver sus propias manos de torneo"
    ON public.manos_guardadas_torneos
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden insertar sus propias manos
CREATE POLICY "Los usuarios pueden insertar sus propias manos de torneo"
    ON public.manos_guardadas_torneos
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden actualizar sus propias manos
CREATE POLICY "Los usuarios pueden actualizar sus propias manos de torneo"
    ON public.manos_guardadas_torneos
    FOR UPDATE
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden eliminar sus propias manos
CREATE POLICY "Los usuarios pueden eliminar sus propias manos de torneo"
    ON public.manos_guardadas_torneos
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manos_guardadas_torneos_updated_at
    BEFORE UPDATE ON public.manos_guardadas_torneos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de la tabla
COMMENT ON TABLE public.manos_guardadas_torneos IS 'Tabla para almacenar manos guardadas de torneos de poker';
COMMENT ON COLUMN public.manos_guardadas_torneos.buy_in IS 'Precio del torneo (buy-in)';
COMMENT ON COLUMN public.manos_guardadas_torneos.tournament_type IS 'Tipo de torneo: Normal, Progressive KO, Total KO, Mystery KO';
COMMENT ON COLUMN public.manos_guardadas_torneos.is_itm IS 'Si el jugador está In The Money (ITM)';
COMMENT ON COLUMN public.manos_guardadas_torneos.remaining_players IS 'Cantidad de participantes restantes en el torneo';
