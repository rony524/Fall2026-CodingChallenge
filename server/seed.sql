-- Mock users for testing login. Safe to re-run (skips usernames that already exist).
-- Every account uses the password: Password123!
--   usernames: alice, bob, carol
-- Paste into the Supabase SQL editor, or run: npm run seed
--
-- The long strings are bcrypt hashes of that password (what the login route compares
-- against), not the password itself. Test data only: don't use this on a real deployment.
insert into users (firstName, lastName, username, password_hash) values
    ('Alice', 'Johnson', 'alice', '$2b$10$4Qk3fkb06yxcy/1Xx.G5hO4DeD13Gn70egeMXwH8naXcDE0tJm9pe'),
    ('Bob', 'Smith', 'bob', '$2b$10$IeBHzjLAdD7LD/EaeQDK1Od1DL6K4Kl4K9Ovl82hnzSSBAtLDqIxm'),
    ('Carol', 'Nguyen', 'carol', '$2b$10$gPUTD7nRAODvUnxWvDAn4OXc7/DHjjoHjHnpw1wR9Wm76n//v5DcS')
-- username is UNIQUE, so users that already exist are silently skipped
on conflict (username) do nothing;

-- To remove them again:
-- delete from users where username in ('alice', 'bob', 'carol');
