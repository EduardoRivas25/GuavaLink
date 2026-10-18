alter table public.receptions
  add constraint receptions_validation_values_check
  check (
    validated_at is null
    or (
      accepted_weight_kg is not null
      and accepted_weight_kg > 0
      and price_per_kg is not null
      and price_per_kg > 0
    )
  );

create or replace function public.create_payment_from_receptions(
  p_folio text,
  p_producer_id uuid,
  p_producer_folio text,
  p_producer_name text,
  p_orchard text,
  p_date text,
  p_reception_ids uuid[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_payment_id uuid;
  eligible_count integer;
begin
  if p_reception_ids is null or cardinality(p_reception_ids) = 0 then
    raise exception 'Selecciona al menos una recepción para el pago.';
  end if;

  if cardinality(p_reception_ids) <> (
    select count(distinct reception_id)
      from unnest(p_reception_ids) as selected(reception_id)
  ) then
    raise exception 'La selección contiene recepciones duplicadas.';
  end if;

  select count(*)
    into eligible_count
    from public.receptions r
   where r.id = any(p_reception_ids)
     and r.producer_id = p_producer_id
     and r.validated_at is not null
     and r.accepted_weight_kg > 0
     and r.price_per_kg > 0
     and not exists (
       select 1
         from public.payment_receptions pr
        where pr.reception_id = r.id
     );

  if eligible_count <> cardinality(p_reception_ids) then
    raise exception 'Una o varias recepciones no están disponibles para este pago.';
  end if;

  insert into public.payments (
    folio,
    producer_id,
    producer_folio,
    producer_name,
    orchard,
    amount,
    date,
    status
  )
  values (
    p_folio,
    p_producer_id,
    p_producer_folio,
    p_producer_name,
    coalesce(nullif(trim(p_orchard), ''), 'Varias huertas'),
    0,
    p_date,
    'Pendiente'
  )
  returning id into new_payment_id;

  insert into public.payment_receptions (
    payment_id,
    reception_id,
    accepted_weight_kg,
    price_per_kg
  )
  select
    new_payment_id,
    r.id,
    r.accepted_weight_kg,
    r.price_per_kg
  from public.receptions r
  where r.id = any(p_reception_ids)
    and r.producer_id = p_producer_id;

  return new_payment_id;
end;
$$;
