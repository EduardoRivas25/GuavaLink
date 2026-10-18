-- Trazabilidad productor -> huerta -> registro de exportación -> embarque.
-- La migración es aditiva para conservar los datos y pantallas existentes.

alter table public.orchards
  add column if not exists producer_id uuid references public.producers(id) on delete cascade;

create index if not exists orchards_producer_id_idx
  on public.orchards(producer_id);

create table if not exists public.export_registrations (
  id uuid primary key default gen_random_uuid(),
  producer_id uuid not null references public.producers(id) on delete cascade,
  registration_number text not null,
  created_at timestamptz not null default now(),
  unique (producer_id, registration_number)
);

create index if not exists export_registrations_producer_id_idx
  on public.export_registrations(producer_id);

alter table public.receptions
  add column if not exists producer_id uuid references public.producers(id),
  add column if not exists producer_qr text,
  add column if not exists orchard_id uuid references public.orchards(id),
  add column if not exists export_registration_id uuid references public.export_registrations(id),
  add column if not exists export_registration_number text,
  add column if not exists shipment_id uuid references public.shipments(id),
  add column if not exists boxes integer not null default 0 check (boxes >= 0),
  add column if not exists weight_kg numeric(12, 2) not null default 0 check (weight_kg >= 0),
  add column if not exists incidents text,
  add column if not exists received_by text;

create index if not exists receptions_producer_id_idx on public.receptions(producer_id);
create index if not exists receptions_shipment_id_idx on public.receptions(shipment_id);

create or replace function public.sync_shipment_received_kilos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_id uuid;
begin
  affected_id := case when tg_op = 'DELETE' then old.shipment_id else new.shipment_id end;
  if affected_id is not null then
    update public.shipments s
       set kilos = coalesce((
         select sum(r.weight_kg)
           from public.receptions r
          where r.shipment_id = affected_id
       ), 0)
     where s.id = affected_id;
  end if;

  if tg_op = 'UPDATE' then
    if old.shipment_id is distinct from new.shipment_id and old.shipment_id is not null then
      update public.shipments s
         set kilos = coalesce((
           select sum(r.weight_kg)
             from public.receptions r
            where r.shipment_id = old.shipment_id
         ), 0)
       where s.id = old.shipment_id;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists receptions_sync_shipment_kilos on public.receptions;
create trigger receptions_sync_shipment_kilos
after insert or update or delete on public.receptions
for each row execute function public.sync_shipment_received_kilos();

