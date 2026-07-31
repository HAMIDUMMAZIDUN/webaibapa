-- Schema Migrasi Database Hidayat AI Workspace
-- Tanggal: 27 Juli 2026

-- Mengaktifkan ekstensi UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel: user_permissions (Role & Hak Akses Pengguna)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'author' CHECK (role IN ('author', 'editor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel: projects (Proyek Buku / Riset / Karya Tulis)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    progress INTEGER DEFAULT 5 CHECK (progress >= 0 AND progress <= 100),
    book_details JSONB DEFAULT '{}'::JSONB, -- metadata buku MI/MTs/MA (judul, jenjang, mata pelajaran, dll.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel: project_chapters (Bab Buku & Konten Utama)
CREATE TABLE IF NOT EXISTS project_chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    blueprint JSONB DEFAULT '{}'::JSONB,
    citations JSONB DEFAULT '[]'::JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'writing', 'review', 'final')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel: documents (Berkas Referensi Pengguna)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    storage_path TEXT,
    checksum TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel: history (Riwayat Permintaan Prompt AI)
CREATE TABLE IF NOT EXISTS history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL,
    category TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabel: ai_usage (Log Penggunaan Token & Kuota AI — P-26 Compliant)
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    model TEXT DEFAULT 'gpt-4o-mini',
    feature TEXT DEFAULT 'Umum',
    request_id TEXT DEFAULT '',
    latency_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout', 'cached')),
    cache_hit BOOLEAN DEFAULT false,
    estimated_cost NUMERIC(10, 6) DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===================================================
-- POLICY ROW LEVEL SECURITY (RLS) SUPABASE
-- ===================================================

-- Mengaktifkan RLS untuk setiap tabel
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy untuk user_permissions
CREATE POLICY "Users can view their own permissions"
ON user_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Policy untuk projects
CREATE POLICY "Users can manage their own projects"
ON projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy untuk project_chapters
CREATE POLICY "Users can manage chapters of their own projects"
ON project_chapters FOR ALL
USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_chapters.project_id 
    AND projects.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_chapters.project_id 
    AND projects.user_id = auth.uid()
));

-- Policy untuk documents
CREATE POLICY "Users can manage their own documents"
ON documents FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy untuk history
CREATE POLICY "Users can manage their own history"
ON history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy untuk ai_usage
CREATE POLICY "Users can view their own usage"
ON ai_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System/Users can insert usage logs"
ON ai_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);
