-- =====================================================================
-- GarageFlow C — 0016 require a validity date before sending a quote
-- A real garage quote must carry a "valable jusqu'au" date. A draft may be
-- saved without one, but `send_quote` now refuses to publish a quote whose
-- validity is missing or already past. (Client accept already blocks expiry.)
-- =====================================================================

create or replace function public.send_quote(p_id uuid)
returns public.quotes
language plpgsql security definer set search_path = public as $$
declare v_garage uuid; v_status text; v_valid date; v_lines int; v_quote public.quotes;
begin
  select garage_id, status, valid_until into v_garage, v_status, v_valid from public.quotes where id = p_id;
  if v_garage is null or not public.is_garage_member(v_garage) then raise exception 'Acces non autorise'; end if;
  if v_status <> 'draft' then raise exception 'Seul un brouillon peut etre envoye'; end if;
  select count(*) into v_lines from public.quote_lines where quote_id = p_id;
  if v_lines = 0 then raise exception 'Devis vide : ajoutez au moins une ligne'; end if;
  if v_valid is null then raise exception 'Renseignez une date de validite avant d''envoyer le devis'; end if;
  if v_valid < current_date then raise exception 'La date de validite doit etre aujourd''hui ou une date future'; end if;

  update public.quotes set
    status = 'sent',
    sent_at = now(),
    client_token = coalesce(client_token,
      replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
  where id = p_id
  returning * into v_quote;
  return v_quote;
end;
$$;
