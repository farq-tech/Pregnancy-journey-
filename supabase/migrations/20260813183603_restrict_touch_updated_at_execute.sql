-- `touch_updated_at` only ever runs as a trigger, but PostgREST exposes every
-- function in `public` as an RPC endpoint. Since it is SECURITY DEFINER, leaving
-- EXECUTE granted to anon/authenticated lets any client call it directly.
-- Triggers run as the table owner and ignore these grants, so revoking is safe.
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
