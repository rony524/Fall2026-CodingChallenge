Rony Condori Gonzales

rony.h.condori.gonzales@vanderbilt.edu

Pixshare

This app took me a week. I knew much about apis and html,css,javascript. Although I never learned backend, it felt easy to grasp and was the most fun I actually had in this project as I slowly grasped how to actually build the backend, not just relearn something like apis in another language. The hardest part was REACT frontend, mainly because it is extensive, requires alot of debugging and is just really experience heavy in terms of profeciecny. So many issues with the backend came up with specific protocols being needed like SSL for it to run. Otherwise, the main pitfalls was the frontend and the iterative process of debugging each component and fixing them up together.


I understand that the process is supposed to test how much you learn, but when I interacted with others who were also attempting the challenge, I noticed that they did not have the same knoweldge of what was possible to create. I think maybe showing examples could get people to try and create more creative designs and just how creative you can get.

DOCUMENTATION

A photo-sharing app built to learn full-stack development — React + TypeScript (Vite) on the frontend, Express + PostgreSQL (hosted on Supabase) on the backend.

How to run this locally

This project is split into two separate applications that run at the same time — a frontend (client/) and a backend (server/) — plus a PostgreSQL database hosted on Supabase rather than running locally. All three pieces need to be running/configured for the app to work.

Prerequisites: Node.js and npm installed, and a free Supabase account with a project created (for the database).

1. Set up the database.
In your Supabase project, open the SQL Editor and run the contents of server/schema.sql. This creates all the tables the app needs. (This only needs to be done once — or again if you want to reset all data.)

2. Set up and run the backend.

cd server
npm install

Create a file named .env inside server/ (copy server/.env.example as a starting point) with:

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=any-long-random-string
PORT=3000

(Get the real DATABASE_URL from Supabase → Project Settings → Database → Connection string, with the password revealed.)

Then start it:

node index.js

It should print API running on http://localhost:3000. Leave this running.

3. Set up and run the frontend, in a separate terminal.

cd client
npm install

Create a file named .env inside client/ with:

VITE_API_URL=http://localhost:3000

Then start it:

npm run dev

This prints a local URL (typically http://localhost:5173) — open that in a browser.

4. Create an account.
There's no seed data, so the database starts empty. Sign up through the app's own UI, or create a test user directly via:

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"testpass123\"}"
Tech stack
Layer	Technology
Frontend	React 19, TypeScript, Vite
Backend	Node.js, Express 5
Database	PostgreSQL (hosted on Supabase)
Auth	express-session (cookie-based), bcrypt for password hashing


File structure
PixShare/
├── client/                    React frontend
│   ├── src/
│   │   ├── api/                fetch wrappers, one file per backend resource
│   │   ├── components/         reusable UI pieces (Navbar, forms, feed, etc.)
│   │   ├── pages/               top-level pages (HomePage)
│   │   ├── types/                shared TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                    Express backend
│   ├── routes/                  one file per resource (auth, images, collections, notifications)
│   ├── middleware/               requireAuth, errorHandler
│   ├── db.js                     shared PostgreSQL connection pool
│   ├── index.js                  app entry point / middleware setup
│   ├── schema.sql                database table definitions
│   └── package.json
└── README.md



Environment variables
File,	Variable,	Purpose
server/.env,  DATABASE_URL, 	  Supabase Postgres connection string
	            SESSION_SECRET, 	signs the login session cookie
	            PORT	,           port the API listens on (default 3000)
client/.env,	VITE_API_URL, 	  base URL the frontend sends API requests to


Known limitations

Image "upload" currently accepts a URL to an already-hosted image rather than a file picked from your device. The Friends feature has frontend UI but no backend route yet. Search filters the currently loaded feed client-side rather than querying the backend.
