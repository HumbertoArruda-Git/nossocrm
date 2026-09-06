-- Contagem e registro do rate limit numa única transação.
--
-- Antes, a aplicação fazia SELECT COUNT(*) e depois INSERT em chamadas
-- separadas. Duas requisições simultâneas liam a mesma contagem e ambas
-- passavam: o limite de 5 envios por 15 minutos podia ser ultrapassado por
-- qualquer cliente que disparasse as requisições em paralelo — exatamente o
-- que um script de abuso faz.
--
-- O advisory lock é por identificador, então visitantes diferentes não esperam
-- uns pelos outros. Ele é de transação, e a chamada via RPC é a própria
-- transação: não há lock vazando entre chamadas.
BEGIN;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max INTEGER,
    p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_max <= 0 OR p_window_minutes <= 0 THEN
        RAISE EXCEPTION 'Rate limit configuration must be positive';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext(p_endpoint || ':' || p_identifier));

    SELECT COUNT(*) INTO v_count
    FROM public.rate_limits AS r
    WHERE r.identifier = p_identifier
      AND r.endpoint = p_endpoint
      AND r.created_at >= NOW() - make_interval(mins => p_window_minutes);

    IF v_count >= p_max THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.rate_limits (identifier, endpoint)
    VALUES (p_identifier, p_endpoint);
    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

COMMIT;
