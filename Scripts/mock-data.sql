-- Mock Data for Testing
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Test User ID (matches App.tsx)
-- User ID: 11111111-1111-1111-1111-111111111111
-- Email: test@poker.com

-- Clean up existing test data (optional - uncomment if needed)
-- DELETE FROM buy_ins WHERE session_id IN (SELECT id FROM sessions WHERE join_code LIKE 'TEST%');
-- DELETE FROM results WHERE session_id IN (SELECT id FROM sessions WHERE join_code LIKE 'TEST%');
-- DELETE FROM session_members WHERE session_id IN (SELECT id FROM sessions WHERE join_code LIKE 'TEST%');
-- DELETE FROM members WHERE session_id IN (SELECT id FROM sessions WHERE join_code LIKE 'TEST%');
-- DELETE FROM sessions WHERE join_code LIKE 'TEST%';

-- Insert Test Sessions (Groups)
INSERT INTO sessions (id, name, join_code, date, note, status, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Friday Night Poker', 'TEST001', '2025-10-10', 'Weekly game at Johns place', 'completed', NOW() - INTERVAL '4 days'),
  ('33333333-3333-3333-3333-333333333333', 'Weekend Tournament', 'TEST002', '2025-10-13', 'Monthly tournament', 'active', NOW() - INTERVAL '1 day'),
  ('44444444-4444-4444-4444-444444444444', 'Casual Game', 'TEST003', '2025-10-14', 'Quick game tonight', 'active', NOW());

-- Link test user to sessions
INSERT INTO session_members (user_id, session_id, role, joined_at) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'admin', NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'admin', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'admin', NOW());

-- Insert Members for Session 1 (Friday Night Poker - COMPLETED)
INSERT INTO members (id, session_id, name, created_at) VALUES
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222222', 'Alice', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222222', 'Bob', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', 'Charlie', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', 'Diana', NOW() - INTERVAL '4 days');

-- Buy-ins for Session 1 (Friday Night Poker)
INSERT INTO buy_ins (session_id, member_id, amount_cents, created_at) VALUES
  -- Alice: $100 buy-in
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555551', 10000, NOW() - INTERVAL '4 days'),
  -- Bob: $100 buy-in, then $50 rebuy
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', 10000, NOW() - INTERVAL '4 days'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', 5000, NOW() - INTERVAL '4 days' + INTERVAL '1 hour'),
  -- Charlie: $100 buy-in
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555553', 10000, NOW() - INTERVAL '4 days'),
  -- Diana: $100 buy-in
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555554', 10000, NOW() - INTERVAL '4 days');

-- Results for Session 1 (Friday Night Poker - showing winners and losers)
INSERT INTO results (session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
  -- Alice won $75 (bought in $100, cashed out $175)
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555551', 7500, 17500, NOW() - INTERVAL '4 days'),
  -- Bob lost $150 (bought in $150 total, cashed out $0)
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555552', -15000, 0, NOW() - INTERVAL '4 days'),
  -- Charlie won $125 (bought in $100, cashed out $225)
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555553', 12500, 22500, NOW() - INTERVAL '4 days'),
  -- Diana lost $50 (bought in $100, cashed out $50)
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555554', -5000, 5000, NOW() - INTERVAL '4 days');

-- Insert Members for Session 2 (Weekend Tournament - ACTIVE)
INSERT INTO members (id, session_id, name, created_at) VALUES
  ('66666666-6666-6666-6666-666666666661', '33333333-3333-3333-3333-333333333333', 'Emma', NOW() - INTERVAL '1 day'),
  ('66666666-6666-6666-6666-666666666662', '33333333-3333-3333-3333-333333333333', 'Frank', NOW() - INTERVAL '1 day'),
  ('66666666-6666-6666-6666-666666666663', '33333333-3333-3333-3333-333333333333', 'Grace', NOW() - INTERVAL '1 day'),
  ('66666666-6666-6666-6666-666666666664', '33333333-3333-3333-3333-333333333333', 'Henry', NOW() - INTERVAL '1 day'),
  ('66666666-6666-6666-6666-666666666665', '33333333-3333-3333-3333-333333333333', 'Ivy', NOW() - INTERVAL '1 day');

-- Buy-ins for Session 2 (Weekend Tournament)
INSERT INTO buy_ins (session_id, member_id, amount_cents, created_at) VALUES
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666661', 20000, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666662', 20000, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666663', 20000, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666664', 20000, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666665', 20000, NOW() - INTERVAL '1 day');

-- Results for Session 2 (active tournament - partial results)
INSERT INTO results (session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
  -- Emma up $50 so far
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666661', 5000, 25000, NOW() - INTERVAL '1 day'),
  -- Frank down $100
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666662', -10000, 10000, NOW() - INTERVAL '1 day'),
  -- Grace up $200
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666663', 20000, 40000, NOW() - INTERVAL '1 day'),
  -- Henry down $150
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666664', -15000, 5000, NOW() - INTERVAL '1 day'),
  -- Ivy even
  ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666665', 0, 20000, NOW() - INTERVAL '1 day');

-- Insert Members for Session 3 (Casual Game - just started)
INSERT INTO members (id, session_id, name, created_at) VALUES
  ('77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444444', 'Jack', NOW()),
  ('77777777-7777-7777-7777-777777777772', '44444444-4444-4444-4444-444444444444', 'Kate', NOW()),
  ('77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444444', 'Leo', NOW());

-- Buy-ins for Session 3 (just started)
INSERT INTO buy_ins (session_id, member_id, amount_cents, created_at) VALUES
  ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777771', 5000, NOW()),
  ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777772', 5000, NOW()),
  ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777773', 5000, NOW());

-- No results yet for Session 3 (game just started)

-- Verify the data
SELECT
  s.name as session_name,
  s.join_code,
  s.date,
  s.status,
  COUNT(DISTINCT m.id) as member_count,
  COUNT(DISTINCT b.id) as buy_in_count,
  COUNT(DISTINCT r.id) as result_count,
  SUM(b.amount_cents) as total_buy_ins_cents
FROM sessions s
LEFT JOIN members m ON s.id = m.session_id
LEFT JOIN buy_ins b ON s.id = b.session_id
LEFT JOIN results r ON s.id = r.session_id
WHERE s.join_code LIKE 'TEST%'
GROUP BY s.id, s.name, s.join_code, s.date, s.status
ORDER BY s.date DESC;

-- Summary stats for test user
SELECT
  'Total Sessions' as metric,
  COUNT(DISTINCT s.id) as value
FROM sessions s
JOIN session_members sm ON s.id = sm.session_id
WHERE sm.user_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT
  'Total Members' as metric,
  COUNT(DISTINCT m.id) as value
FROM members m
JOIN sessions s ON m.session_id = s.id
JOIN session_members sm ON s.id = sm.session_id
WHERE sm.user_id = '11111111-1111-1111-1111-111111111111'
UNION ALL
SELECT
  'Total Buy-ins' as metric,
  COUNT(*) as value
FROM buy_ins b
JOIN sessions s ON b.session_id = s.id
JOIN session_members sm ON s.id = sm.session_id
WHERE sm.user_id = '11111111-1111-1111-1111-111111111111';
