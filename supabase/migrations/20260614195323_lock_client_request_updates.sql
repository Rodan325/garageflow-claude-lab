-- =====================================================================
-- GarageFlow C — 0007 lock client-side request edits (security hardening)
-- A client may ONLY change the status of their own request (via the allowed
-- transitions). They cannot edit service, vehicle, dates, contact, etc. after
-- creation. Garage members keep full control of their requests.
-- =====================================================================
create or replace function public.guard_request_transition()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_member boolean := public.is_garage_member(new.garage_id);
  is_owner_client boolean := (new.client_id = auth.uid());
begin
  if tg_op = 'UPDATE' then
    -- Client column lock: clients can only touch `status` (updated_at is set by trigger).
    if is_owner_client and not is_member then
      if new.garage_id is distinct from old.garage_id
        or new.client_id is distinct from old.client_id
        or new.service_id is distinct from old.service_id
        or new.service_name is distinct from old.service_name
        or new.client_vehicle_id is distinct from old.client_vehicle_id
        or new.vehicle_label is distinct from old.vehicle_label
        or new.requested_date is distinct from old.requested_date
        or new.requested_time is distinct from old.requested_time
        or new.proposed_date is distinct from old.proposed_date
        or new.proposed_time is distinct from old.proposed_time
        or new.note is distinct from old.note
        or new.contact_name is distinct from old.contact_name
        or new.contact_phone is distinct from old.contact_phone
        or new.contact_email is distinct from old.contact_email
        or new.reference is distinct from old.reference
        or new.customer_id is distinct from old.customer_id
        or new.appointment_id is distinct from old.appointment_id
      then
        raise exception 'Un client ne peut modifier que le statut de sa demande';
      end if;
    end if;

    if new.status is distinct from old.status then
      if is_member then
        if not (
          (old.status = 'pending' and new.status in ('accepted','declined','reschedule_proposed','cancelled')) or
          (old.status = 'reschedule_proposed' and new.status in ('declined','accepted','cancelled')) or
          (old.status in ('accepted','confirmed') and new.status in ('confirmed','completed','cancelled'))
        ) then
          raise exception 'Transition non autorisee (garage): % -> %', old.status, new.status;
        end if;
      elsif is_owner_client then
        if not (
          (old.status = 'reschedule_proposed' and new.status in ('confirmed','cancelled')) or
          (old.status = 'accepted' and new.status in ('confirmed','cancelled')) or
          (old.status in ('pending','reschedule_proposed','accepted') and new.status = 'cancelled')
        ) then
          raise exception 'Transition non autorisee (client): % -> %', old.status, new.status;
        end if;
      else
        raise exception 'Acces non autorise a cette demande';
      end if;
    end if;
  end if;
  return new;
end;
$$;
