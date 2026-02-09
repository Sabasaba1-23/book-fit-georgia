
INSERT INTO public.badges (key, title, description, icon, tier, visibility_priority, auto_criteria) VALUES
('verified_partner', 'Verified Partner', 'Identity and credentials verified by our team', 'shield-check', 'trust', 100, NULL),
('certified_trainer', 'Certified Trainer', 'Professional certifications reviewed and approved', 'award', 'trust', 95, NULL),
('verified_studio', 'Verified Studio', 'Studio location and business verified', 'building', 'trust', 90, NULL),
('exp_5_years', '5+ Years Experience', 'Over 5 years of professional training experience', 'clock', 'experience', 70, '{"field": "years_experience", "min": 5}'::jsonb),
('exp_10_years', '10+ Years Experience', 'Over 10 years of professional training experience', 'clock', 'experience', 75, '{"field": "years_experience", "min": 10}'::jsonb),
('sessions_100', '100+ Sessions', 'Completed over 100 sessions on the platform', 'trophy', 'performance', 60, '{"metric": "sessions_completed", "min": 100}'::jsonb),
('sessions_500', '500+ Sessions', 'Completed over 500 sessions on the platform', 'trophy', 'performance', 65, '{"metric": "sessions_completed", "min": 500}'::jsonb),
('top_rated', 'Top Rated', 'Maintains an average rating of 4.8 or higher', 'star', 'performance', 80, '{"metric": "avg_rating", "min": 4.8, "min_reviews": 5}'::jsonb),
('reliable', 'Reliable', 'Very low cancellation rate', 'check-circle', 'performance', 55, '{"metric": "completion_rate", "min": 95}'::jsonb),
('first_booking', 'First Booking', 'Completed their first booking', 'heart', 'loyalty', 20, '{"metric": "user_bookings", "min": 1}'::jsonb),
('regular', 'Regular', 'Completed 5 bookings', 'repeat', 'loyalty', 25, '{"metric": "user_bookings", "min": 5}'::jsonb),
('dedicated', 'Dedicated', 'Completed 10 bookings', 'flame', 'loyalty', 30, '{"metric": "user_bookings", "min": 10}'::jsonb),
('power_user', 'Power User', 'Completed 25 bookings', 'zap', 'loyalty', 35, '{"metric": "user_bookings", "min": 25}'::jsonb);
