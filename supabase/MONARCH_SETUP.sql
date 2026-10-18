-- MONARCH Private Finance 1.2
-- Cole este script UMA VEZ no SQL Editor do projeto Supabase destinado ao MONARCH.
-- Os dados pertencem SOMENTE ao usuário autenticado. Nenhuma service_role key no front-end.

create table if not exists public.finance_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.finance_documents enable row level security;

-- Idempotente ao executar novamente.
drop policy if exists "monarch_select_own" on public.finance_documents;
drop policy if exists "monarch_insert_own" on public.finance_documents;
drop policy if exists "monarch_update_own" on public.finance_documents;
drop policy if exists "monarch_delete_own" on public.finance_documents;

create policy "monarch_select_own" on public.finance_documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "monarch_insert_own" on public.finance_documents
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "monarch_update_own" on public.finance_documents
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- No DELETE policy: deleting all MONARCH records uses a revisioned overwrite
-- of the JSON document, which makes concurrent edits detectable.

create or replace function public.monarch_save_document(
  p_document jsonb,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_new_revision bigint;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_document is null or jsonb_typeof(p_document) <> 'object'
     or jsonb_typeof(p_document->'transactions') <> 'array'
     or jsonb_typeof(p_document->'bills') <> 'array'
     or jsonb_typeof(p_document->'goals') <> 'array' then
    raise exception 'Invalid MONARCH document';
  end if;
  if pg_column_size(p_document) > 2097152 then
    raise exception 'Document too large (2MB limit)';
  end if;

  if p_expected_revision = 0 then
    insert into public.finance_documents (user_id, data, revision, updated_at)
    values (v_uid, p_document, 1, now())
    on conflict (user_id) do nothing
    returning revision into v_new_revision;
  elsif p_expected_revision > 0 then
    update public.finance_documents
       set data = p_document, revision = revision + 1, updated_at = now()
     where user_id = v_uid and revision = p_expected_revision
    returning revision into v_new_revision;
  else
    raise exception 'Invalid revision';
  end if;

  -- null means another device saved a newer version first. Client asks
  -- explicitly before overwriting, never silently discards changes.
  return v_new_revision;
end;
$$;

revoke all on function public.monarch_save_document(jsonb, bigint) from public;
revoke all on function public.monarch_save_document(jsonb, bigint) from anon;
grant execute on function public.monarch_save_document(jsonb, bigint) to authenticated;

-- Protege até mesmo se houver grants de tabelas mais amplos:
revoke all on public.finance_documents from anon;
grant select, insert, update on public.finance_documents to authenticated;

-- Conferência opcional (execute em uma segunda consulta):
-- select relname, relrowsecurity from pg_class where oid='public.finance_documents'::regclass;
