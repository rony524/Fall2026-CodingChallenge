-- PixShare database schema (PostgreSQL / Supabase).
--
-- !! WARNING: this script DROPS every table below before recreating it, which deletes
-- !! all existing data. Only run it on a fresh or throwaway database. To change the
-- !! schema of a database that already has data, use ALTER TABLE instead.
--
-- Run it in the Supabase SQL editor. Then `npm run seed` adds a few mock users.
--
-- Relationships (an arrow means "belongs to"; ON DELETE CASCADE means deleting the
-- parent row automatically deletes its children):
--
--   images ──────────► users
--   collections ─────► users            (owner_id)
--   collection_images ► collections, images        (which photos are in which collection)
--   collection_collaborators ► collections, users  (who else can access a collection)
--   notifications ───► users
--
-- Postgres lowercases unquoted column names, so `firstName` is stored as `firstname`.

-- create database PixShare_database;
-- create schema database;

-- Extra Postgres functions; not used by the app yet (bcrypt hashing happens in Node).
create extension if not exists pgcrypto;

-- Drop in reverse dependency order: tables that reference others go first
drop table if exists notifications;
drop table if exists collection_collaborators;
drop table if exists collection_images;
drop table if exists collections;
drop table if exists images;
drop table if exists users;

-- Accounts. Only a bcrypt hash of the password is stored, never the password itself.
-- username is unique and required: it's the login name and how collaborators are invited.
create table users (
    user_id  serial Primary Key,
    firstName varchar(30),
    lastName varchar(30),
    username varchar(50) not null unique,
    password_hash text not null, -- bcrypt hashes are 60 chars
    created_at timestamp default now()
);

-- Photos. `url` points at an image hosted elsewhere; no file is stored in the database.
-- Deleting a user deletes their photos.
create table images(
    image_id Serial Primary Key,
    user_id int not null references users(user_id) on delete cascade,
    url text not null,
    caption text not null,
    created_at timestamp default now()
);

-- Collections of photos. owner_id is the creator, who always has full control.
-- Private by default; is_public lets anyone (even logged out) see its photos.
create table collections (
    collection_id serial primary key,
    owner_id int not null references users(user_id) on delete cascade,
    name varchar(150) not null,
    description text,
    is_public boolean not null default false,
    created_at timestamp default now()
);


-- Which photos are in which collection (many-to-many). The composite primary key means a
-- photo can be in a given collection only once. Deleting either side removes the link.
create table collection_images (
    collection_id int not null references collections(collection_id) on delete cascade,
    image_id int not null references images(image_id) on delete cascade,
    added_at timestamp default now(),
    primary key (collection_id, image_id)
);

-- People besides the owner who can access a collection. role is 'editor' (can add and
-- remove photos) or 'viewer' (read only); the API enforces those two values.
-- One row per (collection, user), so someone can't be added twice with different roles.
create table collection_collaborators (
    collection_id int not null references collections(collection_id) on delete cascade,
    user_id int not null references users(user_id) on delete cascade,
    role varchar(20) not null default 'editor',
    added_at timestamp default now(),
    primary key (collection_id, user_id)
);


-- Messages shown in the navbar bell (e.g. "You were added to a collection").
-- Each row is addressed to one user; is_read is flipped when they click it.
create table notifications (
    notification_id serial primary key,
    user_id int not null references users(user_id) on delete cascade,
    message text not null,
    is_read boolean not null default false,
    created_at timestamp default now()
);
