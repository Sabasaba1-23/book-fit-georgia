INSERT INTO public.user_roles (user_id, role)
VALUES ('3f409830-97c2-47ba-8655-afd376c77f8a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;