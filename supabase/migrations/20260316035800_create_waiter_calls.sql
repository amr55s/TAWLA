create table public.waiter_calls (
    id uuid default gen_random_uuid() primary key,
    table_id uuid references public.tables(id) on delete cascade not null,
    type text not null check (type in ('assistance', 'bill')),
    status text not null default 'active' check (status in ('active', 'resolved')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone
);

alter table public.waiter_calls enable row level security;

-- Allow anonymous users to create waiter calls for their table
create policy "Enable insert for all users"
    on public.waiter_calls for insert
    with check (true);

-- Allow admins/waiters to read/update the state of the calls
create policy "Enable read access for all users"
    on public.waiter_calls for select
    using (true);

create policy "Enable update for all users"
    on public.waiter_calls for update
    using (true)
    with check (true);
