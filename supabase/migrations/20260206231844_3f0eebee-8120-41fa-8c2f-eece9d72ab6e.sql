
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'user');
CREATE TYPE public.partner_type AS ENUM ('individual', 'gym');
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE public.training_type AS ENUM ('one_on_one', 'group', 'event');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  language_preference TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Partner profiles table
CREATE TABLE public.partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  partner_type partner_type NOT NULL,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  bio TEXT,
  location TEXT,
  sports TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Training listings table
CREATE TABLE public.training_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE NOT NULL,
  title_en TEXT NOT NULL,
  title_ka TEXT,
  description_en TEXT,
  description_ka TEXT,
  sport TEXT NOT NULL,
  training_type training_type NOT NULL DEFAULT 'one_on_one',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price_gel NUMERIC(10,2) NOT NULL,
  max_spots INTEGER NOT NULL DEFAULT 1,
  background_image_url TEXT,
  equipment_notes_en TEXT,
  equipment_notes_ka TEXT,
  status listing_status NOT NULL DEFAULT 'draft',
  admin_notes TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.training_listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  spots INTEGER NOT NULL DEFAULT 1,
  booking_status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation threads
CREATE TABLE public.conversation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.training_listings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(thread_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.conversation_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _thread_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND thread_id = _thread_id
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON public.partner_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_listings_updated_at BEFORE UPDATE ON public.training_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  -- Default role: user
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- partner_profiles
CREATE POLICY "Anyone authenticated can view approved partners" ON public.partner_profiles FOR SELECT TO authenticated USING (approved = true);
CREATE POLICY "Partners can view own profile" ON public.partner_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all partners" ON public.partner_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create partner profile" ON public.partner_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Partners can update own profile" ON public.partner_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update partner profiles" ON public.partner_profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- training_listings
CREATE POLICY "Anyone can view approved listings" ON public.training_listings FOR SELECT TO authenticated
  USING (status = 'approved');
CREATE POLICY "Partners can view own listings" ON public.training_listings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can view all listings" ON public.training_listings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners can create listings" ON public.training_listings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Partners can update own listings" ON public.training_listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can update listings" ON public.training_listings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Partners can delete own listings" ON public.training_listings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can delete listings" ON public.training_listings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Partners can view bookings for their listings" ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.training_listings tl
    JOIN public.partner_profiles pp ON pp.id = tl.partner_id
    WHERE tl.id = listing_id AND pp.user_id = auth.uid()
  ));
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- conversation_threads
CREATE POLICY "Participants can view threads" ON public.conversation_threads FOR SELECT
  USING (public.is_conversation_participant(auth.uid(), id));
CREATE POLICY "Admins can view all threads" ON public.conversation_threads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create threads" ON public.conversation_threads FOR INSERT TO authenticated
  WITH CHECK (true);

-- conversation_participants
CREATE POLICY "Participants can view participants" ON public.conversation_participants FOR SELECT
  USING (public.is_conversation_participant(auth.uid(), thread_id));
CREATE POLICY "Admins can view all participants" ON public.conversation_participants FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can add participants" ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (true);

-- messages
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT
  USING (public.is_conversation_participant(auth.uid(), thread_id));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.is_conversation_participant(auth.uid(), thread_id) AND auth.uid() = sender_id);
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_training_listings_status ON public.training_listings(status);
CREATE INDEX idx_training_listings_sport ON public.training_listings(sport);
CREATE INDEX idx_training_listings_scheduled_at ON public.training_listings(scheduled_at);
CREATE INDEX idx_training_listings_partner_id ON public.training_listings(partner_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_listing_id ON public.bookings(listing_id);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_conversation_participants_thread_id ON public.conversation_participants(thread_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- Storage buckets for avatars and listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- Storage policies
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own listing images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
