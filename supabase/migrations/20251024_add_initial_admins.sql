-- Add initial admin users
-- This adds peterabdo92@gmail.com and peter@raven-search.com as admins

INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'peterabdo92@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'peter@raven-search.com'
ON CONFLICT (user_id) DO NOTHING;
