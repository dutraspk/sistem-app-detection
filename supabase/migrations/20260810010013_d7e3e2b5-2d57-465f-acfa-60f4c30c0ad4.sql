CREATE TABLE public.deteccoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera TEXT NOT NULL,
  setor TEXT,
  trabalhador TEXT,
  validacao TEXT NOT NULL DEFAULT 'Bloqueado',
  epis_detectados TEXT[] NOT NULL DEFAULT '{}',
  epis_faltando TEXT[] NOT NULL DEFAULT '{}',
  confianca NUMERIC,
  frame_url TEXT,
  ocorreu_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deteccoes TO anon;
GRANT SELECT ON public.deteccoes TO authenticated;
GRANT ALL ON public.deteccoes TO service_role;

ALTER TABLE public.deteccoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deteccoes sao publicas para leitura"
  ON public.deteccoes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX deteccoes_ocorreu_em_idx ON public.deteccoes (ocorreu_em DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.deteccoes;