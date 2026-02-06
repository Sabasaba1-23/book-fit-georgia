
-- Assign admin role to admin@admin.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('7a1892fb-88ec-4db9-a4be-e3d2a4766605', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
