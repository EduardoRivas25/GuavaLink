alter table public.receptions
  add column if not exists incident_type text,
  add column if not exists incident_severity text,
  add column if not exists quality_status text;

alter table public.receptions
  drop constraint if exists receptions_status_check,
  drop constraint if exists receptions_workflow_status_check;

update public.receptions
   set quality_status = status
 where status is not null
   and status not in ('Pendiente', 'Validada', 'Rechazada')
   and quality_status is null;

update public.receptions
   set status = case when validated_at is not null then 'Validada' else 'Pendiente' end
 where status is null
    or status not in ('Pendiente', 'Validada', 'Rechazada');

alter table public.receptions
  add constraint receptions_workflow_status_check
  check (status in ('Pendiente', 'Validada', 'Rechazada'));

alter table public.receptions
  alter column status set default 'Pendiente';

update public.shipments
   set status = 'En preparación'
 where status is null
    or status not in (
      'En preparación',
      'Listo para salir',
      'En tránsito',
      'Entregado'
    );

create table if not exists public.reception_incidents (
  id uuid primary key default gen_random_uuid(),
  reception_id uuid not null references public.receptions(id) on delete cascade,
  incident_type text not null
    check (incident_type in ('Daño', 'Calidad', 'Peso', 'Documentación', 'Otro')),
  description text not null,
  severity text not null default 'Media'
    check (severity in ('Baja', 'Media', 'Alta')),
  status text not null default 'Pendiente'
    check (status in ('Pendiente', 'Revisada', 'Resuelta')),
  created_at timestamptz not null default now(),
  unique (reception_id, incident_type, description)
);

create index if not exists reception_incidents_reception_id_idx
  on public.reception_incidents(reception_id);

grant select, insert, update, delete
  on public.reception_incidents
  to anon, authenticated;

insert into public.reception_incidents (
  reception_id,
  incident_type,
  description,
  severity
)
select
  r.id,
  case
    when r.incident_type in ('Daño', 'Calidad', 'Peso', 'Documentación', 'Otro')
      then r.incident_type
    else 'Otro'
  end,
  trim(r.incidents),
  case
    when r.incident_severity in ('Baja', 'Media', 'Alta')
      then r.incident_severity
    else 'Media'
  end
from public.receptions r
where nullif(trim(coalesce(r.incidents, '')), '') is not null
  and lower(trim(r.incidents)) not in ('sin daños', 'sin incidencias', 'ninguna')
on conflict (reception_id, incident_type, description) do nothing;

create or replace function public.enforce_reception_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  shipment_status text;
begin
  if new.status is null
     or new.status not in ('Pendiente', 'Validada', 'Rechazada') then
    raise exception 'Estado de recepción no válido.';
  end if;

  if tg_op = 'UPDATE' then
    if old.shipment_id is not null
       and new.shipment_id is distinct from old.shipment_id then
      raise exception 'Una recepción ya asignada no puede cambiar de embarque.';
    end if;

    if old.status in ('Validada', 'Rechazada')
       and new.status is distinct from old.status then
      raise exception 'Una recepción validada o rechazada no puede cambiar de estado.';
    end if;

    if old.validated_at is not null and (
      new.accepted_weight_kg is distinct from old.accepted_weight_kg
      or new.price_per_kg is distinct from old.price_per_kg
      or new.validated_at is distinct from old.validated_at
    ) then
      raise exception 'Los kilos y el precio de una recepción validada son inmutables.';
    end if;
  end if;

  if new.status = 'Validada' then
    if new.accepted_weight_kg is null or new.accepted_weight_kg <= 0
       or new.price_per_kg is null or new.price_per_kg <= 0 then
      raise exception 'Para validar una recepción, indica kilos aceptados y precio mayores a cero.';
    end if;
    new.validated_at := coalesce(new.validated_at, now());
  elsif new.status = 'Rechazada' then
    if new.validated_at is not null then
      raise exception 'Una recepción validada no puede convertirse en rechazada.';
    end if;
  elsif tg_op = 'INSERT' then
    new.validated_at := null;
  end if;

  if new.shipment_id is not null then
    if new.status <> 'Validada' then
      raise exception 'Solo se pueden asignar a un embarque recepciones validadas.';
    end if;

    select s.status
      into shipment_status
      from public.shipments s
     where s.id = new.shipment_id;

    if not found then
      raise exception 'El embarque indicado no existe.';
    end if;

    if shipment_status in ('En tránsito', 'Entregado', 'Cancelado') then
      raise exception 'No se pueden asignar recepciones a un embarque en tránsito, entregado o cancelado.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists receptions_enforce_workflow on public.receptions;
create trigger receptions_enforce_workflow
before insert or update on public.receptions
for each row execute function public.enforce_reception_workflow();

create or replace function public.enforce_shipment_workflow()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  assigned_count integer;
begin
  if new.status is null or new.status not in (
    'En preparación',
    'Listo para salir',
    'En tránsito',
    'Entregado'
  ) then
    raise exception 'Estado de embarque no válido.';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not (
      (old.status = 'En preparación' and new.status = 'Listo para salir')
      or (old.status = 'Listo para salir' and new.status = 'En tránsito')
      or (old.status = 'En tránsito' and new.status = 'Entregado')
    ) then
      raise exception 'El embarque debe avanzar al siguiente estado del flujo.';
    end if;
  end if;

  if new.status in ('En tránsito', 'Entregado')
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    select count(*)
      into assigned_count
      from public.receptions r
     where r.shipment_id = new.id
       and r.status = 'Validada'
       and r.validated_at is not null;

    if assigned_count = 0 then
      raise exception 'El embarque requiere al menos una recepción asignada antes de salir.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists shipments_enforce_workflow on public.shipments;
create trigger shipments_enforce_workflow
before insert or update on public.shipments
for each row execute function public.enforce_shipment_workflow();

create or replace function public.sync_reception_incident()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if nullif(trim(coalesce(new.incidents, '')), '') is null
     or lower(trim(new.incidents)) in ('sin daños', 'sin incidencias', 'ninguna') then
    return new;
  end if;

  insert into public.reception_incidents (
    reception_id,
    incident_type,
    description,
    severity
  )
  values (
    new.id,
    case
      when new.incident_type in ('Daño', 'Calidad', 'Peso', 'Documentación', 'Otro')
        then new.incident_type
      else 'Otro'
    end,
    trim(new.incidents),
    case
      when new.incident_severity in ('Baja', 'Media', 'Alta')
        then new.incident_severity
      else 'Media'
    end
  )
  on conflict (reception_id, incident_type, description)
  do update set severity = excluded.severity;

  return new;
end;
$$;

drop trigger if exists receptions_sync_incident on public.receptions;
create trigger receptions_sync_incident
after insert or update of incidents, incident_type, incident_severity
on public.receptions
for each row execute function public.sync_reception_incident();
