-- Add accepted-weight and price snapshots for validated receptions and payments.

alter table public.receptions
  add column if not exists accepted_weight_kg numeric(12, 2)
    check (accepted_weight_kg is null or accepted_weight_kg >= 0),
  add column if not exists price_per_kg numeric(12, 2)
    check (price_per_kg is null or price_per_kg >= 0),
  add column if not exists validated_at timestamptz;

alter table public.payments
  add column if not exists producer_id uuid
    references public.producers(id) on delete restrict;

update public.payments payment
   set producer_id = producer.id
  from public.producers producer
 where payment.producer_id is null
   and payment.producer_folio = producer.folio;

create index if not exists payments_producer_id_idx
  on public.payments(producer_id);

create table if not exists public.payment_receptions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  reception_id uuid not null unique references public.receptions(id) on delete restrict,
  accepted_weight_kg numeric(12, 2) not null check (accepted_weight_kg > 0),
  price_per_kg numeric(12, 2) not null check (price_per_kg >= 0),
  amount numeric(14, 2)
    generated always as (round(accepted_weight_kg * price_per_kg, 2)) stored,
  created_at timestamptz not null default now()
);

create index if not exists payment_receptions_payment_id_idx
  on public.payment_receptions(payment_id);

create or replace function public.prepare_payment_reception()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  reception_record record;
  payment_producer_id uuid;
begin
  select r.producer_id, r.accepted_weight_kg, r.price_per_kg, r.validated_at
    into reception_record
    from public.receptions r
   where r.id = new.reception_id;

  if not found then
    raise exception 'La recepción indicada no existe.';
  end if;

  if reception_record.validated_at is null then
    raise exception 'Solo se pueden pagar recepciones validadas.';
  end if;

  if reception_record.producer_id is null then
    raise exception 'La recepción debe tener un productor asociado.';
  end if;

  if reception_record.accepted_weight_kg is null
     or reception_record.accepted_weight_kg <= 0 then
    raise exception 'La recepción debe tener kilos aceptados mayores a cero.';
  end if;

  if reception_record.price_per_kg is null then
    raise exception 'La recepción debe tener un precio por kilo definido.';
  end if;

  select p.producer_id
    into payment_producer_id
    from public.payments p
   where p.id = new.payment_id;

  if payment_producer_id is distinct from reception_record.producer_id then
    raise exception 'El pago y la recepción deben pertenecer al mismo productor.';
  end if;

  new.accepted_weight_kg := reception_record.accepted_weight_kg;
  new.price_per_kg := reception_record.price_per_kg;
  return new;
end;
$$;

drop trigger if exists payment_receptions_prepare on public.payment_receptions;
create trigger payment_receptions_prepare
before insert on public.payment_receptions
for each row execute function public.prepare_payment_reception();

create or replace function public.sync_payment_amount()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op <> 'INSERT' and old.payment_id is not null then
    update public.payments p
       set amount = coalesce((
         select sum(pr.amount)
           from public.payment_receptions pr
          where pr.payment_id = old.payment_id
       ), 0)
     where p.id = old.payment_id;
  end if;

  if tg_op <> 'DELETE' and new.payment_id is not null then
    update public.payments p
       set amount = coalesce((
         select sum(pr.amount)
           from public.payment_receptions pr
          where pr.payment_id = new.payment_id
       ), 0)
     where p.id = new.payment_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_receptions_sync_amount on public.payment_receptions;
create trigger payment_receptions_sync_amount
after insert or update or delete on public.payment_receptions
for each row execute function public.sync_payment_amount();
