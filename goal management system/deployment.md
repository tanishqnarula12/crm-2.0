# Goal Management System - Deployment Guide

This guide details how to set up your database in **Supabase**, run the application locally, and deploy the frontend to **Vercel** for a professional, lag-free experience.

---

## Step 1: Database Setup (Supabase)

Supabase gives you a full Postgres database on a free tier that does not sleep or spin down like Render.

1. Go to [Supabase](https://supabase.com) and log in.
2. Create a **New Project**. Choose a database name, region (nearest to your users), and set a secure password.
3. Once the database is ready, go to the **SQL Editor** tab from the left sidebar.
4. Click **New Query**, open the `database.sql` file in this directory, and copy-paste its entire contents into the SQL Editor.
5. Click **Run**. This will:
   * Create the `clients` table.
   * Create the `goals` table with automatic cascade deletes (deleting a client automatically deletes their goals).
   * Enable **Row Level Security (RLS)** for data protection.
   * Create policies allowing public read, write, update, and delete access (since no login auth is required for this dashboard).

---

## Step 2: Local Configuration

To connect your local Vite app to your live Supabase project:

1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Find your **Project URL** and the **`anon` `public` key**.
3. Create a file named `.env.local` in the root of your project directory:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
4. Start your local dev server:
   ```bash
   npm run dev
   ```
5. *Note:* If you don't configure these environment variables, the system will automatically **fall back to Local Storage** so you can continue testing offline immediately.

---

## Step 3: Frontend Deployment (Vercel)

Since all operations are done client-side directly communicating with the Supabase API client, you only need to host the static React build, which is free and instantaneous on Vercel.

1. **Commit your code** to a private Git repository (GitHub/GitLab/Bitbucket). Do NOT commit the `.env.local` file.
2. Go to [Vercel](https://vercel.com) and log in.
3. Click **Add New** -> **Project** and import your Git repository.
4. Under **Configure Project**:
   * **Framework Preset**: Vite
   * **Root Directory**: `./` (default)
5. Expand **Environment Variables** and add:
   * `VITE_SUPABASE_URL` = (Your Supabase URL)
   * `VITE_SUPABASE_ANON_KEY` = (Your Supabase Anon API Key)
6. Click **Deploy**. Vercel will build your React app and assign you a free public domain (e.g., `goal-planner-nine.vercel.app`).
