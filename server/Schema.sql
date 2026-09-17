-- create database PixShare_database;
-- create schema database;

create extension if not exist pgcrypt;

drop table if exists notifications;
drop table if exists collection_collaborators;
drop table if exists collection_images;
drop table if exists collections;
drop table if exists images;
drop table if exists users;

-- User data table, Fact Table
create table users (
    user_id  serial Primary Key,
    firstName varchar(30),
    lastName varchar(30),
    username varchar(50),
    password_hash varchar(50),
    created_at timestamp default now()
)

-- Images data table, references User
create table images(
    image_id Serial Primary Key,
    user_id int not null references User(user_id) on delete cascade;
    url text not null,
    caption text not null,
    created_at timestamp default now()
)

-- Collections data table, references User 
create table collections (
    collection_id serial primary key,
    owner_id int not null references users(user_id) on delete cascade,
    name varchar(150) not null,
    description text,
    is_public boolean not null default false,
    created_at timestamp default now()
);


-- Collection-images data table, references Collection, Image
create table collection_images (
    collection_id int not null references collections(collection_id) on delete cascade,
    image_id int not null references images(image_id) on delete cascade,
    added_at timestamp default now(),
    primary key (collection_id, image_id)
);

-- Collection-collaborators data table, references Collection, User
create table collection_collaborators (
    collection_id int not null references collections(collection_id) on delete cascade,
    user_id int not null references users(user_id) on delete cascade,
    role varchar(20) not null default 'editor',
    added_at timestamp default now(),
    primary key (collection_id, user_id)
);


-- Notifications data table, references User
create table notifications (
    notification_id serial primary key,
    user_id int not null references users(user_id) on delete cascade,
    message text not null,
    is_read boolean not null default false,
    created_at timestamp default now()
);
