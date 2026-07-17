-- =====================================================================
-- GarageFlow C — 0009 quote snapshot fields (for clean PDFs)
-- A quote keeps a self-contained snapshot of the client + vehicle + terms so
-- the printable document is correct even if CRM links change later.
-- =====================================================================
alter table public.quotes
  add column if not exists client_name text,
  add column if not exists vehicle_label text,
  add column if not exists conditions text,
  add column if not exists valid_until date,
  add column if not exists service_request_id uuid references public.service_requests(id) on delete set null;
