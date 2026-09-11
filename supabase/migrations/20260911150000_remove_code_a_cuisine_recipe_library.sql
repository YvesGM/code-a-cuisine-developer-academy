-- Recipes are persisted in Firebase Realtime Database per the Academy checklist.
-- Supabase remains responsible only for quota/throttling and workflow audit logs.

drop table if exists code_a_cuisine.recipes cascade;
