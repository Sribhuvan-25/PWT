-- Test Data Population Script for Poker Tracker App
-- This script creates sample data to test all app functionality

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM settlements;
-- DELETE FROM buy_ins;
-- DELETE FROM results;
-- DELETE FROM members;
-- DELETE FROM session_members;
-- DELETE FROM sessions;

-- Insert test sessions
INSERT INTO sessions (id, name, join_code, date, note, status, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Friday Night Poker', 'FRIDAY', '2024-01-15', 'Weekly poker night with friends', 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Weekly Tournament', 'WEEKLY', '2024-01-17', 'Tournament style with rebuys', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440003', 'High Stakes', 'HIGHST', '2024-01-19', 'High stakes cash game', 'active', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440004', 'Beginner Friendly', 'BEGIN', '2024-01-21', 'Low stakes for beginners', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert test members for each session
-- Friday Night Poker session members
INSERT INTO members (id, session_id, name, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Bob Smith', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Carol Davis', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'David Wilson', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');

-- Weekly Tournament session members
INSERT INTO members (id, session_id, name, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Eve Brown', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Frank Miller', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Grace Lee', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- High Stakes session members
INSERT INTO members (id, session_id, name, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'Henry Taylor', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'Ivy Anderson', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Beginner Friendly session members
INSERT INTO members (id, session_id, name, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'Jack White', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Kate Green', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert additional test sessions for more comprehensive testing
-- Additional Friday Night Poker sessions (completed with results)
INSERT INTO sessions (id, name, join_code, date, note, status, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Friday Night Poker #2', 'FRIDAY2', '2024-01-22', 'Another Friday night cash game', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Additional Weekly Tournament sessions
INSERT INTO sessions (id, name, join_code, date, note, status, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440002', 'Weekly Tournament #2', 'WEEKLY2', '2024-01-24', 'Tournament round 2', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Additional High Stakes session
INSERT INTO sessions (id, name, join_code, date, note, status, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440005', 'High Stakes #2', 'HIGHST2', '2024-01-25', 'High stakes cash game', 'active', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Insert buy-ins for sessions
-- Friday Night Poker Session 1 buy-ins
INSERT INTO buy_ins (id, session_id, member_id, amount_cents, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 10000, NOW() - INTERVAL '7 days'), -- Alice $100
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 10000, NOW() - INTERVAL '7 days'), -- Bob $100
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 10000, NOW() - INTERVAL '7 days'), -- Carol $100
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 10000, NOW() - INTERVAL '7 days'); -- David $100

-- Friday Night Poker Session 2 buy-ins
INSERT INTO buy_ins (id, session_id, member_id, amount_cents, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 15000, NOW() - INTERVAL '3 days'), -- Alice $150
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 15000, NOW() - INTERVAL '3 days'), -- Bob $150
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 15000, NOW() - INTERVAL '3 days'), -- Carol $150
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 15000, NOW() - INTERVAL '3 days'); -- David $150

-- Weekly Tournament buy-ins
INSERT INTO buy_ins (id, session_id, member_id, amount_cents, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 5000, NOW() - INTERVAL '6 days'),  -- Eve $50
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', 5000, NOW() - INTERVAL '6 days'),  -- Frank $50
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 5000, NOW() - INTERVAL '6 days'); -- Grace $50

-- High Stakes buy-ins
INSERT INTO buy_ins (id, session_id, member_id, amount_cents, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440008', 50000, NOW() - INTERVAL '1 day'), -- Henry $500
('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440009', 50000, NOW() - INTERVAL '1 day'); -- Ivy $500

-- Insert results (final cashouts and net results)
-- Friday Night Poker Session 1 results
INSERT INTO results (id, session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 2500, 12500, NOW() - INTERVAL '7 days'),  -- Alice won $25
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', -1500, 8500, NOW() - INTERVAL '7 days'),  -- Bob lost $15
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', -1000, 9000, NOW() - INTERVAL '7 days'),  -- Carol lost $10
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', 0, 10000, NOW() - INTERVAL '7 days');     -- David broke even

-- Friday Night Poker Session 2 results
INSERT INTO results (id, session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', -5000, 10000, NOW() - INTERVAL '3 days'), -- Alice lost $50
('990e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 10000, 25000, NOW() - INTERVAL '3 days'), -- Bob won $100
('990e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', -3000, 12000, NOW() - INTERVAL '3 days'), -- Carol lost $30
('990e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', -2000, 13000, NOW() - INTERVAL '3 days'); -- David lost $20

-- Weekly Tournament results
INSERT INTO results (id, session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 7500, 12500, NOW() - INTERVAL '6 days'),  -- Eve won $75
('990e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', -5000, 0, NOW() - INTERVAL '6 days'),     -- Frank lost $50
('990e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', -2500, 2500, NOW() - INTERVAL '6 days'); -- Grace lost $25

-- High Stakes results (active session - some players cashed out, others still playing)
INSERT INTO results (id, session_id, member_id, net_cents, cashout_cents, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440008', 25000, 75000, NOW() - INTERVAL '1 day'); -- Henry won $250

-- Insert some settlements (debt payments)
INSERT INTO settlements (id, session_id, from_member_id, to_member_id, amount_cents, settled_at, note, created_at, updated_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 1500, NOW() - INTERVAL '6 days', 'Paid back Friday game debt', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 1000, NOW() - INTERVAL '5 days', 'Settled up with Alice', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', 5000, NOW() - INTERVAL '4 days', 'Tournament debt settled', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days');

-- Insert test users (if you have a users table, otherwise these are just reference UUIDs)
-- Note: These are just UUIDs for testing - in a real app, users would come from Supabase Auth
-- You can use these UUIDs in your app's auth store for testing

-- Test User 1: Alice (admin of Friday Night Poker)
-- UUID: bb0e8400-e29b-41d4-a716-446655440001
-- Email: alice@test.com
-- Name: Alice Johnson

-- Test User 2: Bob (member of Friday Night Poker) 
-- UUID: bb0e8400-e29b-41d4-a716-446655440002
-- Email: bob@test.com
-- Name: Bob Smith

-- Test User 3: Eve (admin of Weekly Tournament)
-- UUID: bb0e8400-e29b-41d4-a716-446655440003
-- Email: eve@test.com
-- Name: Eve Brown

-- Test User 4: Henry (admin of High Stakes)
-- UUID: bb0e8400-e29b-41d4-a716-446655440004
-- Email: henry@test.com
-- Name: Henry Taylor

-- Test User 5: Jack (admin of Beginner Friendly)
-- UUID: bb0e8400-e29b-41d4-a716-446655440005
-- Email: jack@test.com
-- Name: Jack White

-- Insert session_members (simulate user memberships - using proper UUIDs)
INSERT INTO session_members (user_id, session_id, role, joined_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'admin', NOW() - INTERVAL '7 days'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'member', NOW() - INTERVAL '7 days'),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'admin', NOW() - INTERVAL '5 days'),
('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'admin', NOW() - INTERVAL '3 days'),
('bb0e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'admin', NOW() - INTERVAL '1 day');

-- Summary of test data created:
-- 
-- SESSIONS (6):
-- 1. Friday Night Poker (FRIDAY) - completed, 4 members, some settlements
-- 2. Weekly Tournament (WEEKLY) - completed, 3 members, 1 settlement  
-- 3. High Stakes (HIGHST) - active, 2 members, no settlements yet
-- 4. Beginner Friendly (BEGIN) - active, 2 members, no activity yet
-- 5. Friday Night Poker #2 (FRIDAY2) - completed, additional session
-- 6. Weekly Tournament #2 (WEEKLY2) - active, additional session
--
-- MEMBERS (11 total):
-- - Friday Night: Alice (admin), Bob, Carol, David
-- - Weekly Tournament: Eve (admin), Frank, Grace  
-- - High Stakes: Henry (admin), Ivy
-- - Beginner Friendly: Jack (admin), Kate
--
-- SESSIONS (5):
-- - 3 completed sessions with full results
-- - 2 active sessions (one with partial results)
--
-- BUY-INS (13):
-- - Various amounts: $50, $100, $150, $500
-- - Multiple buy-ins per session
--
-- RESULTS (9):
-- - Mix of winners and losers
-- - Different net amounts: -$50 to +$250
-- - Some players broke even
--
-- SETTLEMENTS (3):
-- - Debt payments between members
-- - Different amounts and notes
--
-- GROUP_MEMBERS (5):
-- - Test user memberships with different roles
-- - Admins and regular members

-- You can now test:
-- 1. Group listing and details
-- 2. Member balances and settle-up calculations  
-- 3. Session creation and management
-- 4. Buy-in tracking
-- 5. Cashout recording
-- 6. Settlement tracking
-- 7. Different user roles and permissions

-- ========================================
-- HOW TO USE TEST USERS IN YOUR APP
-- ========================================
--
-- To test with a specific user, update your auth store with one of these test users:
--
-- Example: Set Alice as the current user (admin of Friday Night Poker)
-- In your app's auth store, set:
-- user = {
--   id: 'bb0e8400-e29b-41d4-a716-446655440001',
--   email: 'alice@test.com',
--   name: 'Alice Johnson',
--   displayName: 'Alice Johnson'
-- }
--
-- Test Users Available:
-- 1. Alice (bb0e8400-e29b-41d4-a716-446655440001) - Admin of Friday Night Poker session
-- 2. Bob (bb0e8400-e29b-41d4-a716-446655440002) - Member of Friday Night Poker session  
-- 3. Eve (bb0e8400-e29b-41d4-a716-446655440003) - Admin of Weekly Tournament session
-- 4. Henry (bb0e8400-e29b-41d4-a716-446655440004) - Admin of High Stakes session
-- 5. Jack (bb0e8400-e29b-41d4-a716-446655440005) - Admin of Beginner Friendly session
--
-- Each user will see only their sessions when using getUserSessions().
-- Use "test-user-123" to see all sessions (for general testing).
