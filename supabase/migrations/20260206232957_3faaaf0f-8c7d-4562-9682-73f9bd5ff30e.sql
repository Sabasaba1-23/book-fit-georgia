
-- Drop FK constraint so we can seed demo partners without auth.users entries
ALTER TABLE public.partner_profiles DROP CONSTRAINT partner_profiles_user_id_fkey;

DO $$
DECLARE
  p1 uuid := gen_random_uuid();
  p2 uuid := gen_random_uuid();
  p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid();
  p5 uuid := gen_random_uuid();
  p6 uuid := gen_random_uuid();
BEGIN

INSERT INTO public.partner_profiles (id, user_id, display_name, partner_type, bio, location, sports, languages, logo_url, approved) VALUES
  (p1, gen_random_uuid(), 'Giorgi Kapanadze', 'individual', 'Professional boxing coach with 15 years of experience. Former national champion.', 'Tbilisi, Vake', ARRAY['Boxing', 'Kickboxing'], ARRAY['en', 'ka'], NULL, true),
  (p2, gen_random_uuid(), 'FitZone Gym', 'gym', 'Modern fitness center in the heart of Tbilisi with state-of-the-art equipment.', 'Tbilisi, Saburtalo', ARRAY['CrossFit', 'Weightlifting', 'Yoga'], ARRAY['en', 'ka', 'ru'], NULL, true),
  (p3, gen_random_uuid(), 'Ana Beridze', 'individual', 'Certified yoga instructor and wellness coach. Specializing in Vinyasa and Hatha yoga.', 'Tbilisi, Old Town', ARRAY['Yoga', 'Pilates', 'Meditation'], ARRAY['en', 'ka'], NULL, true),
  (p4, gen_random_uuid(), 'SportLife Arena', 'gym', 'Multi-sport complex offering group classes and individual training sessions.', 'Tbilisi, Gldani', ARRAY['Swimming', 'Tennis', 'Basketball'], ARRAY['ka', 'ru'], NULL, true),
  (p5, gen_random_uuid(), 'Dato Kvaratskhelia', 'individual', 'Football coach and former professional player. Youth development specialist.', 'Batumi', ARRAY['Football', 'Futsal'], ARRAY['en', 'ka'], NULL, true),
  (p6, gen_random_uuid(), 'Peak Performance Studio', 'gym', 'Boutique fitness studio focused on functional training and body transformation.', 'Tbilisi, Vera', ARRAY['CrossFit', 'HIIT', 'Functional Training'], ARRAY['en', 'ka', 'ru'], NULL, true);

INSERT INTO public.training_listings (partner_id, title_en, title_ka, description_en, description_ka, sport, training_type, scheduled_at, duration_minutes, price_gel, max_spots, status, equipment_notes_en, equipment_notes_ka, background_image_url) VALUES
  (p1, 'Boxing Fundamentals', 'კრივის საფუძვლები', 'Learn proper stance, footwork, and basic combinations. Perfect for beginners.', 'ისწავლეთ სწორი პოზიცია, ფეხის მოძრაობა და ძირითადი კომბინაციები.', 'Boxing', 'one_on_one', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', 60, 80, 1, 'approved', 'Gloves provided. Bring comfortable clothes and water.', 'ხელთათმანები უზრუნველყოფილია.', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800'),
  (p1, 'Advanced Sparring Session', 'გაფართოებული სპარინგი', 'Controlled sparring for intermediate and advanced boxers.', 'კონტროლირებადი სპარინგი საშუალო და მოწინავე მოკრივეებისთვის.', 'Boxing', 'group', NOW() + INTERVAL '3 days' + INTERVAL '18 hours', 90, 50, 6, 'approved', 'Own gloves and mouthguard required.', 'საკუთარი ხელთათმანები აუცილებელია.', 'https://images.unsplash.com/photo-1517438322307-e67111335449?w=800'),
  (p2, 'Morning CrossFit WOD', 'დილის CrossFit WOD', 'Start your day with an intense CrossFit workout. All fitness levels welcome.', 'დაიწყეთ დღე ინტენსიური CrossFit ვარჯიშით.', 'CrossFit', 'group', NOW() + INTERVAL '1 day' + INTERVAL '7 hours', 60, 35, 15, 'approved', 'All equipment provided.', 'ყველა აღჭურვილობა უზრუნველყოფილია.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
  (p2, 'Olympic Weightlifting Basics', 'ოლიმპიური ძალოსნობის საფუძვლები', 'Learn snatch and clean & jerk technique with certified coaches.', 'ისწავლეთ რვა და ტოლჩოკის ტექნიკა.', 'Weightlifting', 'group', NOW() + INTERVAL '4 days' + INTERVAL '16 hours', 75, 45, 8, 'approved', 'Weightlifting shoes recommended.', 'ძალოსნობის ფეხსაცმელი რეკომენდებულია.', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800'),
  (p3, 'Sunrise Vinyasa Flow', 'აღმოსავლეთის ვინიასა', 'Energizing morning yoga flow. Suitable for all levels.', 'ენერგიული დილის იოგა.', 'Yoga', 'group', NOW() + INTERVAL '1 day' + INTERVAL '6 hours', 60, 30, 12, 'approved', 'Bring your own mat or rent one for 5 GEL.', 'წამოიღეთ ხალიჩა ან იქირავეთ 5 ლარად.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800'),
  (p3, 'Deep Stretch & Meditation', 'ღრმა გაჭიმვა და მედიტაცია', 'Slow-paced session focusing on flexibility and mental clarity.', 'ნელი ტემპის სესია მოქნილობაზე.', 'Yoga', 'one_on_one', NOW() + INTERVAL '5 days' + INTERVAL '19 hours', 75, 60, 1, 'approved', 'Mat and props provided.', 'ხალიჩა უზრუნველყოფილია.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'),
  (p4, 'Swimming for Beginners', 'ცურვა დამწყებთათვის', 'Learn to swim in our heated indoor pool. Small groups.', 'ისწავლეთ ცურვა გათბობილ აუზში.', 'Swimming', 'group', NOW() + INTERVAL '2 days' + INTERVAL '9 hours', 45, 40, 6, 'approved', 'Swimsuit and goggles required.', 'საცურაო კოსტუმი აუცილებელია.', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'),
  (p4, 'Tennis Coaching', 'ტენისის მწვრთნელი', 'Private tennis lesson with court included.', 'პირადი ტენისის გაკვეთილი კორტთან ერთად.', 'Tennis', 'one_on_one', NOW() + INTERVAL '3 days' + INTERVAL '14 hours', 60, 70, 1, 'approved', 'Rackets available for rent.', 'ჩოგანები ქირავდება.', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800'),
  (p5, 'Youth Football Training', 'ახალგაზრდული ფეხბურთი', 'Structured training for young players aged 10-16.', 'სტრუქტურირებული ვარჯიში 10-16 წლის მოთამაშეებისთვის.', 'Football', 'group', NOW() + INTERVAL '2 days' + INTERVAL '15 hours', 90, 25, 20, 'approved', 'Bring shin guards and cleats.', 'წამოიღეთ ფეხის დამცავი და ბუცები.', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800'),
  (p5, 'Private Futsal Coaching', 'ფუტსალის პირადი მწვრთნელი', 'One-on-one futsal skills development.', 'ფუტსალის უნარების განვითარება.', 'Futsal', 'one_on_one', NOW() + INTERVAL '4 days' + INTERVAL '11 hours', 60, 90, 1, 'approved', 'Indoor shoes required.', 'დარბაზის ფეხსაცმელი აუცილებელია.', 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=800'),
  (p6, 'HIIT Burn Session', 'HIIT წვის სესია', 'High-intensity interval training to maximize calorie burn.', 'მაღალი ინტენსივობის ინტერვალური ვარჯიში.', 'HIIT', 'group', NOW() + INTERVAL '1 day' + INTERVAL '18 hours', 45, 30, 20, 'approved', 'Towel and water bottle recommended.', 'პირსახოცი და წყლის ბოთლი რეკომენდებულია.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'),
  (p6, 'Functional Strength Program', 'ფუნქციური ძალა', 'Build real-world strength with compound movements.', 'ააშენეთ ძალა კომპლექსური მოძრაობებით.', 'Functional Training', 'group', NOW() + INTERVAL '5 days' + INTERVAL '8 hours', 60, 40, 10, 'approved', 'All equipment provided.', 'ყველა აღჭურვილობა უზრუნველყოფილია.', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800');

END $$;
