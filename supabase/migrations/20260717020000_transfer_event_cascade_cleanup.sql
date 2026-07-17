-- Transfer events remain append-only while their service request exists.
-- Allow only the nested delete fired by the declared ON DELETE CASCADE chain
-- when the parent service request itself is legitimately removed.
create or replace function public.prevent_transfer_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  raise exception 'Transfer events are append-only' using errcode = '55000';
end;
$$;

revoke all on function public.prevent_transfer_event_mutation()
  from public, anon, authenticated;
