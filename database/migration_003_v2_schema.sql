-- =====================================================
-- MIGRATION 003: Hidayat AI Workspace v2.0 Schema
-- Tanggal: 28 Juli 2026
-- Ref: Spesifikasi Produk §7.2, §3.3, §4.3, §5, §6
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABEL: book_projects (§3.3 — Form Proyek Buku)
-- =====================================================
CREATE TABLE IF NOT EXISTS book_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Identitas
    working_title TEXT NOT NULL,
    author_name TEXT DEFAULT '',
    editor_name TEXT DEFAULT '',
    publisher TEXT DEFAULT '',
    book_type TEXT DEFAULT 'buku-siswa' CHECK (book_type IN (
        'buku-siswa','buku-guru','modul-ajar','lks-lkpd','pengayaan',
        'akademik','monograf','populer','dakwah','bank-soal','kamus'
    )),
    isbn TEXT DEFAULT '',

    -- Sasaran
    jenjang TEXT DEFAULT 'MA' CHECK (jenjang IN ('MI','MTs','MA','SD','SMP','SMA','Umum')),
    kelas TEXT DEFAULT '',
    fase TEXT DEFAULT '',
    usia_target TEXT DEFAULT '',
    karakteristik_pembaca TEXT DEFAULT '',
    prasyarat TEXT DEFAULT '',

    -- Kurikulum
    kurikulum_acuan TEXT DEFAULT '',
    cp_kd_tujuan TEXT DEFAULT '',
    alokasi_waktu TEXT DEFAULT '',
    jumlah_pertemuan INTEGER DEFAULT 0,
    jumlah_bab INTEGER DEFAULT 0,

    -- Gaya
    gaya_bahasa TEXT DEFAULT 'formal',
    panjang_paragraf TEXT DEFAULT 'sedang',
    keterbacaan TEXT DEFAULT '',
    penggunaan_arab TEXT DEFAULT 'dengan-transliterasi',

    -- Keluaran yang direncanakan
    output_types JSONB DEFAULT '["docx","pdf"]'::JSONB,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','writing','review','final','published')),
    version INTEGER DEFAULT 1,
    word_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: book_chapters (§3.4 — Struktur Bab)
-- =====================================================
CREATE TABLE IF NOT EXISTS book_chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    book_project_id UUID REFERENCES book_projects(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,

    -- Konten per elemen struktur bab
    pembuka TEXT DEFAULT '',
    tujuan_pembelajaran TEXT DEFAULT '',
    peta_konsep TEXT DEFAULT '',
    materi_inti TEXT DEFAULT '',
    dalil_pendukung TEXT DEFAULT '',   -- Ayat/Hadis/Kitab bila relevan
    contoh_kasus TEXT DEFAULT '',
    aktivitas TEXT DEFAULT '',
    rangkuman TEXT DEFAULT '',
    refleksi TEXT DEFAULT '',
    asesmen_diagnostik TEXT DEFAULT '',
    asesmen_formatif TEXT DEFAULT '',
    asesmen_sumatif TEXT DEFAULT '',
    remedial TEXT DEFAULT '',
    pengayaan TEXT DEFAULT '',
    glosarium JSONB DEFAULT '[]'::JSONB,
    referensi_bab JSONB DEFAULT '[]'::JSONB,

    -- AI metadata
    ai_generated BOOLEAN DEFAULT false,
    ai_model TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,

    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','writing','review','final')),
    version INTEGER DEFAULT 1,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: sources (§4 — Islamic Reference Center, §7.3)
-- =====================================================
CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Tipe & tingkat
    source_type TEXT NOT NULL CHECK (source_type IN (
        'quran','hadith','tafsir','kitab','regulasi','buku-teks',
        'jurnal','web','manual','api-result'
    )),
    source_tier TEXT DEFAULT 'B' CHECK (source_tier IN ('A','B','C')),

    -- Metadata bibliografi (§7.3)
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    institution TEXT DEFAULT '',
    edition TEXT DEFAULT '',
    editor_or_tahqiq TEXT DEFAULT '',
    publisher TEXT DEFAULT '',
    publication_year TEXT DEFAULT '',
    volume TEXT DEFAULT '',
    page TEXT DEFAULT '',
    chapter TEXT DEFAULT '',
    item_number TEXT DEFAULT '',   -- nomor hadis / nomor regulasi

    -- Referensi Islam
    surah TEXT DEFAULT '',
    ayah TEXT DEFAULT '',
    hadith_number TEXT DEFAULT '',
    hadith_degree TEXT DEFAULT '',  -- Shahih/Hasan/Dhaif/Maudhu'
    hadith_evaluator TEXT DEFAULT '',

    -- Identifikasi digital
    doi TEXT DEFAULT '',
    isbn TEXT DEFAULT '',
    issn TEXT DEFAULT '',
    regulation_number TEXT DEFAULT '',

    -- Tautan & lisensi
    original_url TEXT DEFAULT '',
    download_url TEXT DEFAULT '',
    license TEXT DEFAULT '',
    access_date DATE,

    -- Konten
    quotation TEXT DEFAULT '',
    normalized_text TEXT DEFAULT '',
    language TEXT DEFAULT 'id',

    -- Verifikasi
    verification_status TEXT DEFAULT 'unverified' CHECK (
        verification_status IN ('unverified','verified','disputed','rejected')
    ),
    verifier TEXT DEFAULT '',
    verification_note TEXT DEFAULT '',

    -- Soft delete
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: citations (Citation Links ke sumber)
-- =====================================================
CREATE TABLE IF NOT EXISTS citations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID REFERENCES book_chapters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    citation_text TEXT DEFAULT '',
    page_reference TEXT DEFAULT '',
    context TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: sermon_projects (§5 — Studio Dakwah)
-- =====================================================
CREATE TABLE IF NOT EXISTS sermon_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),

    -- Form §5.2
    sermon_type TEXT DEFAULT 'ceramah' CHECK (sermon_type IN (
        'khutbah-jumat','ceramah','kultum','tausiyah',
        'kajian-tematik','kajian-kitab','ramadan','naskah-video',
        'podcast','konten-sosmed','materi-pengajian'
    )),
    theme TEXT NOT NULL,
    tujuan TEXT DEFAULT '',
    event_date DATE,
    location TEXT DEFAULT '',
    duration_minutes INTEGER DEFAULT 20,

    -- Audiens
    audience_type TEXT DEFAULT 'jamaah-umum' CHECK (audience_type IN (
        'anak','remaja','siswa','guru','orang-tua',
        'jamaah-umum','akademisi','ibu-ibu','bapak-bapak'
    )),
    language_level TEXT DEFAULT 'umum',
    style TEXT DEFAULT 'edukatif' CHECK (style IN (
        'persuasif','edukatif','akademik','populer','reflektif'
    )),

    -- Sumber & rujukan
    mazhab_rujukan TEXT DEFAULT '',
    ayat_input TEXT DEFAULT '',
    hadis_input TEXT DEFAULT '',
    kisah_input TEXT DEFAULT '',
    local_examples TEXT DEFAULT '',

    -- Output yang dihasilkan
    naskah_content TEXT DEFAULT '',
    slide_outline TEXT DEFAULT '',
    handout_content TEXT DEFAULT '',
    doa_penutup TEXT DEFAULT '',

    -- Catatan risiko
    risk_notes TEXT DEFAULT '',
    ai_model TEXT DEFAULT '',

    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: code_projects (§6 — Code & Automation)
-- =====================================================
CREATE TABLE IF NOT EXISTS code_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),

    project_name TEXT NOT NULL,
    submodule TEXT DEFAULT 'gas' CHECK (submodule IN (
        'gas','excel-sheets','office-vba','word-docs',
        'powerpoint-slides','web-db','debug-review'
    )),
    platform TEXT DEFAULT '',         -- Excel/Google Sheets/Apps Script dst.
    platform_version TEXT DEFAULT '',
    locale TEXT DEFAULT 'id',
    deployment_target TEXT DEFAULT '',

    -- Input yang disimpan
    requirements TEXT DEFAULT '',
    schema_description TEXT DEFAULT '',
    code_action TEXT DEFAULT 'buat-baru' CHECK (code_action IN (
        'buat-baru','tambah-fitur','perbaiki-error',
        'refaktor','audit-keamanan','optimasi'
    )),

    -- Output yang dihasilkan
    generated_code TEXT DEFAULT '',
    architecture_notes TEXT DEFAULT '',
    install_guide TEXT DEFAULT '',
    test_cases TEXT DEFAULT '',
    error_faq TEXT DEFAULT '',
    changelog TEXT DEFAULT '',

    ai_model TEXT DEFAULT '',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- TABEL: audit_logs (P-24 — Activity Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,    -- e.g. 'book.create', 'chapter.save', 'source.add'
    resource_type TEXT,      -- 'book_project','chapter','source','sermon', etc.
    resource_id UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    ip_address TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_book_projects_user ON book_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_book_chapters_project ON book_chapters(book_project_id);
CREATE INDEX IF NOT EXISTS idx_sources_user ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_deleted ON sources(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_citations_chapter ON citations(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sermon_projects_user ON sermon_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_code_projects_user ON code_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE book_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermon_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- book_projects
CREATE POLICY "Users manage own book projects"
ON book_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- book_chapters (via join ke book_projects)
CREATE POLICY "Users manage chapters of own books"
ON book_chapters FOR ALL
USING (EXISTS (
    SELECT 1 FROM book_projects bp
    WHERE bp.id = book_chapters.book_project_id AND bp.user_id = auth.uid()
));

-- sources
CREATE POLICY "Users manage own sources"
ON sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- citations
CREATE POLICY "Users manage own citations"
ON citations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sermon_projects
CREATE POLICY "Users manage own sermons"
ON sermon_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- code_projects
CREATE POLICY "Users manage own code projects"
ON code_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- audit_logs: read-only for own records
CREATE POLICY "Users view own audit logs"
ON audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow audit log inserts"
ON audit_logs FOR INSERT WITH CHECK (true);
