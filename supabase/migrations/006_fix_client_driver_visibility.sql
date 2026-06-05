-- Permite al cliente ver el perfil del conductor de su viaje activo
create policy "Clients can view their active driver profile"
  on public.users for select
  using (
    exists (
      select 1 from public.trips t
      where t.client_id = auth.uid()
        and t.driver_id = users.id
        and t.status not in ('FINISHED', 'CANCELLED')
    )
  );

-- Permite al cliente ver los datos del vehículo de su conductor
create policy "Clients can view their active driver vehicle"
  on public.driver_profiles for select
  using (
    exists (
      select 1 from public.trips t
      where t.client_id = auth.uid()
        and t.driver_id = driver_profiles.user_id
        and t.status not in ('FINISHED', 'CANCELLED')
    )
  );
