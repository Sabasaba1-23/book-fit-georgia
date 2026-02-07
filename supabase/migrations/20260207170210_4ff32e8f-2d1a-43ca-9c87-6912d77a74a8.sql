-- Update handle_new_user to properly handle partner registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile for all users
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Check if registering as partner
  IF (NEW.raw_user_meta_data->>'is_partner')::boolean = true THEN
    -- Assign partner role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'partner');
    
    -- Create partner profile
    INSERT INTO public.partner_profiles (user_id, display_name, partner_type, phone_number, approved)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'partner_type', 'individual')::partner_type,
      COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
      false
    );
  ELSE
    -- Default role: user
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$$;

-- Make sure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();