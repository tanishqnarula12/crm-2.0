-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pan TEXT NOT NULL,
    age INTEGER NOT NULL,
    assumptions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    target_month INTEGER NOT NULL,
    target_year INTEGER NOT NULL,
    created_month INTEGER NOT NULL,
    created_year INTEGER NOT NULL,
    inflation NUMERIC NOT NULL,
    expected_return NUMERIC NOT NULL,
    sip_inc_rate NUMERIC NOT NULL,
    current_inv NUMERIC NOT NULL,
    current_sip NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (anonymous client access, since user wants single-advisor one-click entry)
CREATE POLICY "Allow anonymous read access on clients" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on clients" ON public.clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on clients" ON public.clients
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on clients" ON public.clients
    FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on goals" ON public.goals
    FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert access on goals" ON public.goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update access on goals" ON public.goals
    FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on goals" ON public.goals
    FOR DELETE USING (true);
