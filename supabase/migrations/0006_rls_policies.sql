alter table public.profiles enable row level security;
alter table public.dreams enable row level security;
alter table public.objectives enable row level security;
alter table public.daily_actions enable row level security;
alter table public.habits enable row level security;
alter table public.habit_checkins enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "dreams_all_own" on public.dreams for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "objectives_all_own" on public.objectives for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_actions_all_own" on public.daily_actions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habits_all_own" on public.habits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_checkins_all_own" on public.habit_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
