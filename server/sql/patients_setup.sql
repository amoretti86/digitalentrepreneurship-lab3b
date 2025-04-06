create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  services text[] not null,
  insurance text not null,
  address text not null,
  created_at timestamp with time zone default now()
);

alter table patients enable row level security;

create policy "Patients can access their own data"
  on patients
  for all
  using (auth.email() = email)
  with check (auth.email() = email);