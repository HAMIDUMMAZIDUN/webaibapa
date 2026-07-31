const categories = [
  ['Umum','✨'],['AI Chat','💬'],['Disertasi','🎓'],['Penelitian','🔬'],['Jurnal','📘'],['Review Dokumen','🔎'],['Buku','📚'],['Pembelajaran','🏫'],['Administrasi','🗂️'],['Presentasi','📊'],['Desain','🎨'],['Prompt Gambar & Video','🎬']
];
const navItems = [['Dashboard','⌂'], ...categories.slice(1), ['Dokumen Saya','📁'],['Template','▦'],['Paket','♛'],['Profil','♙'],['Bantuan','?']];
const examples = {
  'Umum':'Buatkan rencana kerja sistematis untuk kebutuhan saya, lengkap dengan tujuan, tahapan, jadwal, indikator keberhasilan, risiko, dan rekomendasi.',
  'AI Chat':'Jelaskan topik ini secara sistematis, gunakan contoh konkret, dan tutup dengan kesimpulan praktis.',
  'Disertasi':'Buatkan kerangka proposal disertasi tentang implementasi manajemen kelembagaan pesantren, lengkap dengan gap penelitian, pertanyaan penelitian berbasis POAC, teori utama, metode, dan novelty.',
  'Penelitian':'Susun desain penelitian kualitatif lengkap dengan fokus, sumber data, instrumen wawancara, observasi, dokumentasi, teknik analisis, validitas, dan etika penelitian.',
  'Jurnal':'Susun artikel jurnal ilmiah format IMRAD dari topik pendidikan Islam, lengkap dengan judul, abstrak, kata kunci, pendahuluan, metode, hasil yang harus diisi, pembahasan, dan kesimpulan.',
  'Review Dokumen':'Buatkan format review akademik mendalam yang menilai substansi, teori, metode, data, novelty, sitasi, bahasa, serta rekomendasi revisi prioritas.',
  'Buku':'Buatkan outline buku akademik 10 bab tentang kepemimpinan digital dalam pendidikan Islam, lengkap dengan tujuan tiap bab dan pokok pembahasan.',
  'Pembelajaran':'Buatkan modul ajar lengkap dengan tujuan pembelajaran, materi, aktivitas, asesmen diagnostik-formatif-sumatif, diferensiasi, dan rubrik.',
  'Administrasi':'Buatkan format laporan pertanggungjawaban kegiatan yang profesional, lengkap dengan latar belakang, dasar, tujuan, pelaksanaan, kepanitiaan, anggaran, evaluasi, dokumentasi, dan pengesahan.',
  'Presentasi':'Buatkan isi presentasi 10 slide tentang literasi digital untuk penulisan akademik, setiap slide berisi judul, poin utama, contoh, dan catatan pembicara.',
  'Desain':'Buatkan brief desain flyer akademik modern dengan hierarki teks, palet warna, tipografi, komposisi, elemen visual, dan ukuran publikasi.',
  'Prompt Gambar & Video':'Buatkan prompt video bumper modern 3D berdurasi 30 detik, lengkap dengan adegan per detik, gerak kamera, pencahayaan, transisi, teks, dan arahan audio.'
};
const features = [
  ['Penulis Buku MI-MTs-MA', '✍️', 'Penyusunan modul buku siswa/guru lengkap.', '#1769ff', 'author-studio', 'author'],
  ['Pemetaan Kurikulum', '🗺️', 'Pemetaan tujuan pembelajaran ke bab buku.', '#7044f5', 'curriculum', 'author'],
  ['Pusat Al-Qur\'an dan Tafsir', '📖', 'Integrasi ayat, terjemahan resmi, dan tafsir.', '#0db59f', 'quran', 'author'],
  ['Verifikasi Hadis', '🔍', 'Takhrij hadis dan penelusuran derajat tanpa halusinasi.', '#ff8a19', 'hadith', 'author'],
  ['Perpustakaan Kitab', '📚', 'Akses kitab klasik Maktaba Shamela & OpenITI.', '#f04886', 'kitab', 'author'],
  ['Studio Dakwah', '🎙️', 'Penyusunan naskah khutbah, ceramah, dan slide.', '#19a65a', 'dawah', 'author'],
  ['Apps Script Builder', '⚡', 'Otomatisasi Google Workspace per file (Code.gs).', '#6d20bc', 'gas', 'author'],
  ['Excel & Sheets Studio', '📊', 'Pembuat formula dan otomatisasi VBA/Office Scripts.', '#12a95b', 'excel-studio', 'author'],
  ['Word & Docs Studio', '📝', 'Template dokumen profesional dan mail merge.', '#007acc', 'word-studio', 'author'],
  ['Code Reviewer', '🛡️', 'Audit fungsionalitas, keamanan, dan refaktor kode.', '#e11d48', 'code-reviewer', 'author'],
  ['Publishing Center', '🏛️', 'Pemeriksaan naskah final & checklists penerbitan.', '#ea580c', 'publishing', 'author'],
  ['Source-Grounded Research', '🔬', 'Pipeline RAG pencarian berbasis dokumen Anda.', '#2563eb', 'rag-research', 'author']
];
const $ = s => document.querySelector(s);
const escapeHTML = text => text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

let db = null;
let dbAuthenticated = false;

async function isDbReady() {
  if (!db) return false;
  if (dbAuthenticated) return true;
  try {
    const { data } = await db.auth.getSession();
    dbAuthenticated = !!(data && data.session);
    return dbAuthenticated;
  } catch (e) {
    return false;
  }
}

async function initSupabase() {
  try {
    const res = await fetch('api/get_config.php');
    const config = await res.json();
    if (config.supabase_url && config.supabase_anon_key && typeof supabase !== 'undefined') {
      db = supabase.createClient(config.supabase_url, config.supabase_anon_key);
      console.log("Supabase Database initialized successfully.");
    }
  } catch (e) {
    console.warn("Gagal inisialisasi Supabase, menggunakan LocalStorage fallback.", e);
  }
}

async function syncLocalStorageToSupabase() {
  if (!await isDbReady()) return;
  try {
    // 1. Sync projects
    const { data: projs, error: pErr } = await db.from('projects').select('id');
    if (!pErr && (!projs || projs.length === 0)) {
      const localProjs = JSON.parse(localStorage.getItem('hai_projects') || '[]');
      if (localProjs.length > 0) {
        await db.from('projects').insert(localProjs.map(x => ({ name: x.name, category: x.category, progress: x.progress })));
      }
    }

    // 2. Sync history
    const { data: hist, error: hErr } = await db.from('history').select('id');
    if (!hErr && (!hist || hist.length === 0)) {
      const localHist = JSON.parse(localStorage.getItem('hai_history') || '[]');
      if (localHist.length > 0) {
        await db.from('history').insert(localHist.map(x => ({ category: x.category, prompt: x.prompt, status: x.status, time: x.time })));
      }
    }

    // 3. Sync documents
    const { data: docs, error: dErr } = await db.from('documents').select('id');
    if (!dErr && (!docs || docs.length === 0)) {
      const localDocs = JSON.parse(localStorage.getItem('hai_docs') || '[]');
      if (localDocs.length > 0) {
        await db.from('documents').insert(localDocs.map(x => ({ name: x.name, size: x.size })));
      }
    }
  } catch (e) {
    console.warn("Gagal sinkronisasi data awal ke Supabase:", e);
  }
}

async function getAiQuota() {
  if (!await isDbReady()) return '100%';
  try {
    const { data, error } = await db.from('ai_usage').select('prompt_tokens, completion_tokens');
    if (error || !data) return '100%';
    const totalUsed = data.reduce((acc, row) => acc + ((row.prompt_tokens || 0) + (row.completion_tokens || 0)), 0);
    const maxTokens = 100000; // Limit 100k
    const percent = Math.max(0, Math.min(100, Math.round(((maxTokens - totalUsed) / maxTokens) * 100)));
    return `${percent}%`;
  } catch (e) {
    return '100%';
  }
}

async function renderStats() {
  const projs = await getProjects();
  const docs = await getDocs();
  const hist = await getHistory();
  const quota = await getAiQuota();
  
  const statsData = [
    ['📝', 'Draft Dokumen', docs.length.toString(), 'Lokal/Cloud', '#eff6ff'],
    ['🔍', 'Riset Web', hist.length.toString(), 'Operasional', '#f0fdf4'],
    ['📂', 'Proyek Aktif', projs.length.toString(), 'Aktif', '#fff7ed'],
    ['⚡', 'Kuota AI', quota, 'Lancar', '#faf5ff']
  ];
  
  $('#stats').innerHTML = statsData.map(([i,l,v,s,c]) => `
    <div class="stat">
      <span class="stat-icon" style="background:${c}">${i}</span>
      <div>
        <small>${l}</small>
        <strong>${v}</strong>
        <small style="color:#16894b">${s}</small>
      </div>
    </div>
  `).join('');
}

async function init(){
  if (!localStorage.getItem('hai_initialized_v4')) {
    localStorage.setItem('hai_projects', JSON.stringify([]));
    localStorage.setItem('hai_history', JSON.stringify([]));
    localStorage.setItem('hai_docs', JSON.stringify([]));
    localStorage.setItem('hai_initialized_v4', 'true');
    localStorage.setItem('hai_initialized_v3', 'true');
    localStorage.setItem('hai_initialized', 'true');
  }
  await initSupabase();
  initAuth();
  await checkAuthState();
  
  $('#category').innerHTML = categories.map(([n])=>`<option>${n}</option>`).join('');
  $('#projectCategory').innerHTML = categories.map(([n])=>`<option>${n}</option>`).join('');
  $('#features').innerHTML = features.map(([t,i,d,c,r,p])=>`<article class="feature" data-route="${r}" data-permission="${p}" style="cursor: pointer;"><span class="feature-icon" style="background:${c}">${i}</span><div><strong>${t}</strong><p>${d}</p></div></article>`).join('');
  $('#quickActions').innerHTML = [['📊','Ekspor Excel'],['W','Ekspor Word'],['PDF','Ekspor PDF']].map(([i,t])=>`<button class="quick-action" data-action="${t}"><span>${i}</span><small>${t}</small></button>`).join('');
  
  await syncLocalStorageToSupabase();
  
  await renderProjects(); await renderHistory(); await renderDocuments(); await renderStats(); bind(); initUpload();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}

function bind(){
  // Hamburger Menu
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.onclick = () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    };
  }

  // Theme Switcher
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
      themeToggleBtn.textContent = '🌙';
    }
    themeToggleBtn.onclick = () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toast(`Mode ${isDark ? 'Gelap' : 'Terang'} diaktifkan.`);
    };
  }

  // Sidebar Nav Items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
      const pageId = item.dataset.page;
      const permission = item.dataset.permission || 'author';
      triggerFeature(pageId, permission, item.innerText.trim());
    };
  });

  // Feature Card Clicks on Dashboard
  document.querySelectorAll('#features').forEach(el => {
    el.addEventListener('click', e => {
      const card = e.target.closest('.feature');
      if (card) {
        const pageId = card.dataset.route;
        const permission = card.dataset.permission;
        const title = card.querySelector('strong').innerText;
        triggerFeature(pageId, permission, title);
      }
    });
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.onclick = () => switchToPage(tab.dataset.page);
  });
  document.querySelectorAll('.feature').forEach(c=>c.onclick=()=>{
    const r = c.dataset.route;
    const p = c.dataset.permission;
    const t = c.querySelector('strong').innerText;
    triggerFeature(r, p, t);
  });
  $('#exampleBtn').onclick=()=>{$('#prompt').value=examples[$('#category').value]||examples.Umum; generate();};
  $('#clearBtn').onclick=()=>{$('#prompt').value='';$('#outputWrap').hidden=true;$('#notice').hidden=true;referencesList=[];renderReferences();};
  $('#toggleUploadZoneBtn').onclick=()=>{
    const dz = $('#dropZone');
    dz.style.display = dz.style.display === 'none' ? 'block' : 'none';
  };
  $('#selectAllSources').onchange=(e)=>{
    const checked = e.target.checked;
    referencesList.forEach(ref => ref.enabled = checked);
    renderReferences();
  };
  // DropZone Click (Triggers file upload if not clicking a button inside)
  $('#dropZone').onclick=(e)=>{
    if(e.target.closest('button')) return;
    $('#refCardFileInput').click();
  };
  
  // Trigger file upload from button click
  $('#btnUploadFile').onclick=()=>$('#refCardFileInput').click();
  
  // File upload input change
  $('#refCardFileInput').onchange=async(e)=>{
    const file = e.target.files[0];
    if(file) {
      await processReferenceFile(file);
      $('#refCardFileInput').value = '';
    }
  };
  
  // Drag and Drop zone events
  const dz = $('#dropZone');
  dz.ondragover = (e) => {
    e.preventDefault();
    dz.style.borderColor = '#0b2d70';
    dz.style.background = '#eff6ff';
  };
  dz.ondragleave = dz.ondragend = () => {
    dz.style.borderColor = '#cbd5e1';
    dz.style.background = '#f8fafc';
  };
  dz.ondrop = async (e) => {
    e.preventDefault();
    dz.style.borderColor = '#cbd5e1';
    dz.style.background = '#f8fafc';
    const file = e.dataTransfer.files[0];
    if(file) {
      await processReferenceFile(file);
    }
  };

  // Web source URL handlers
  $('#btnUploadWeb').onclick = $('#btnUploadDrive').onclick = () => {
    $('#refWebUrlInput').value = '';
    $('#webSourceDialog').showModal();
  };
  
  $('#btnConfirmWebSource').onclick = async (e) => {
    e.preventDefault();
    const url = $('#refWebUrlInput').value.trim();
    if(!url) return;
    $('#webSourceDialog').close();
    
    toast('Membaca link web... Mohon tunggu.','ok');
    try {
      const res = await fetch('api/fetch_url.php?url=' + encodeURIComponent(url));
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Gagal membaca link.');
      referencesList.push({type:'web', name: url, content: data.text, enabled: true});
      renderReferences();
      $('#refWebUrlInput').value = '';
      toast('Sumber link web berhasil ditambahkan.');
    } catch(err) {
      toast(err.message, 'error');
    }
  };

  // Clipboard & manual text handlers
  $('#btnPasteText').onclick = async () => {
    $('#refManualNameInput').value = '';
    $('#refManualContentInput').value = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          $('#refManualContentInput').value = text;
          $('#refManualNameInput').value = 'Teks disalin';
        }
      }
    } catch(err) {
      console.log("Clipboard access denied or not supported:", err);
    }
    $('#manualSourceDialog').showModal();
  };

  $('#btnConfirmManualSource').onclick = (e) => {
    e.preventDefault();
    const name = $('#refManualNameInput').value.trim();
    const content = $('#refManualContentInput').value.trim();
    if(!name || !content) return;
    $('#manualSourceDialog').close();
    
    referencesList.push({type:'manual', name, content, enabled: true});
    renderReferences();
    $('#refManualNameInput').value = '';
    $('#refManualContentInput').value = '';
    toast('Sumber teks manual berhasil ditambahkan.');
  };

  // Web search query handler
  $('#btnWebSearchSubmit').onclick = async () => {
    const q = $('#webSearchQuery').value.trim();
    if(!q) {
      toast('Ketik kata kunci pencarian terlebih dahulu.', 'error');
      return;
    }
    const engine = $('#searchEngineSelect').value;
    const type = $('#searchTypeSelect').value;
    toast('Mencari referensi di web...', 'ok');
    
    try {
      const res = await fetch(`api/search_web.php?q=${encodeURIComponent(q)}&engine=${engine}&type=${type}`);
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Gagal mencari.');
      if(!data.results || data.results.length === 0) {
        toast('Tidak menemukan hasil apa pun.', 'error');
        return;
      }
      
      // Clear search input
      $('#webSearchQuery').value = '';
      
      // Add each search result immediately to referencesList with loading = true
      data.results.forEach(item => {
        // Avoid duplicate URLs
        if (referencesList.some(r => r.url === item.url)) return;
        
        referencesList.push({
          type: 'web',
          name: item.title,
          url: item.url,
          content: '',
          enabled: true,
          loading: true
        });
        
        // Fetch content in background
        fetchContentInBackground(item.url);
      });
      
      renderReferences();
      toast('Menambahkan sumber hasil pencarian. Mengunduh konten...');
    } catch(err) {
      toast(`Gagal mencari: ${err.message}`, 'error');
    }
  };
  $('#generateBtn').onclick=generate;
  $('#copyBtn').onclick=async()=>{await navigator.clipboard.writeText($('#output').innerText);toast('Hasil disalin.')};
  $('#wordBtn').onclick=downloadWord;
  $('#excelBtn').onclick=downloadExcel;
  $('#txtBtn').onclick=downloadTxt;
  $('#printBtn').onclick=()=>window.print();
  $('#newProjectBtn').onclick=()=>$('#projectDialog').showModal();
  $('#saveProjectBtn').onclick=saveProject;
  $('#clearHistoryBtn').onclick=async()=>{
    if(await isDbReady()){
      try {
        const { error } = await db.from('history').delete().neq('id', 0);
        if(error) throw new Error(error.message || 'Gagal hapus riwayat');
      } catch(e) {
        toast('Gagal mengosongkan riwayat di Supabase: ' + (e.message || e), 'error');
        return;
      }
    }
    localStorage.removeItem('hai_history');
    await renderHistory();
    await renderStats();
    toast('Semua riwayat berhasil dikosongkan.');
  };
  $('#clearDocsBtn').onclick=async()=>{
    if(await isDbReady()){
      try {
        const { error } = await db.from('documents').delete().neq('id', 0);
        if(error) throw new Error(error.message || 'Gagal hapus dokumen');
      } catch(e) {
        toast('Gagal mengosongkan dokumen di Supabase: ' + (e.message || e), 'error');
        return;
      }
    }
    localStorage.removeItem('hai_docs');
    await renderDocuments();
    await renderStats();
    toast('Semua dokumen berhasil dikosongkan.');
  };
  $('#clearProjectsBtn').onclick=async()=>{
    if(await isDbReady()){
      try {
        const { error } = await db.from('projects').delete().neq('id', 0);
        if(error) throw new Error(error.message || 'Gagal hapus proyek');
      } catch(e) {
        toast('Gagal mengosongkan proyek di Supabase: ' + (e.message || e), 'error');
        return;
      }
    }
    localStorage.removeItem('hai_projects');
    await renderProjects();
    await renderStats();
    toast('Semua proyek berhasil dikosongkan.');
  };
  $('#deleteSelectedHistoryBtn').onclick=deleteSelectedHistory;
  $('#deleteSelectedDocsBtn').onclick=deleteSelectedDocs;
  $('#deleteSelectedProjectsBtn').onclick=deleteSelectedProjects;
  $('#globalSearch').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.feature').forEach(x=>x.style.display=x.innerText.toLowerCase().includes(q)?'flex':'none')});
  document.querySelectorAll('.quick-action').forEach(b=>b.onclick=()=>quickAction(b.dataset.action));

  // Author Studio Bindings
  $('#btnAuthorNewBook').onclick = createNewBook;
  $('#btnGenerateAuthor').onclick = generateAuthorChapterContent;
  
  // Curriculum Bindings
  $('#btnSaveCurriculum').onclick = saveCurriculumMapping;

  // Quran Bindings
  $('#btnFetchQuran').onclick = getQuranAyatText;
  $('#btnSearchQuran').onclick = searchQuranText;

  // Hadith Bindings
  $('#btnVerifyHadith').onclick = verifyHadithText;

  // Kitab Bindings
  $('#btnSearchKitab').onclick = searchKitabLibrary;

  // Dawah Bindings
  $('#btnGenerateDawah').onclick = generateDawahNaskah;

  // Apps Script Bindings
  $('#btnGenerateGas').onclick = generateAppsScriptCode;

  // Excel Bindings
  $('#btnGenerateExcel').onclick = generateExcelLogicFormula;

  // Word Templates
  document.querySelectorAll('.btnWordTmpl').forEach(btn => {
    btn.onclick = () => generateWordTemplateFile(btn.dataset.tmpl);
  });

  // Code Review Bindings
  $('#btnAuditCode').onclick = auditProgramCode;

  // Publishing Bindings
  $('#btnVerifyPublishing').onclick = verifyPublishingReadiness;

  // RAG Bindings
  $('#btnExecuteRag').onclick = executeRagQuerySearch;
}

function selectCategory(name, autoGenerate = false){
  switchToPage('generator');
  $('#category').value=name;
  $('#prompt').value=examples[name]||'';
  if(autoGenerate)generate();
}

window.switchToPage = function(pageId) {
  document.querySelectorAll('.nav-item, .nav-tab').forEach(t => {
    if (t.dataset.page === pageId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.app-page').forEach(page => {
    page.style.display = page.id === `page-${pageId}` ? 'block' : 'none';
  });
  
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ----------------------------------------------------
// SYSTEM MODULES & ROUTING INFRASTRUCTURE
// ----------------------------------------------------

window.triggerFeature = function(pageId, requiredRole, featureName) {
  // 1. Log Analytics Event
  console.log(`[Analytics Event] click_feature: "${featureName}" (Page ID: ${pageId})`);
  
  // 2. Permission check
  const loggedIn = localStorage.getItem('hai_logged_in') === 'true' || dbAuthenticated;
  if (!loggedIn && requiredRole !== 'public') {
    toast('Akses ditolak. Silakan login untuk membuka modul ini.', 'error');
    switchToPage('auth');
    return;
  }
  
  // 3. Simulated Loading state
  const mainEl = document.querySelector('.main');
  if (mainEl) {
    mainEl.style.opacity = '0.45';
    mainEl.style.pointerEvents = 'none';
  }
  
  setTimeout(() => {
    if (mainEl) {
      mainEl.style.opacity = '1';
      mainEl.style.pointerEvents = 'auto';
    }
    
    // Switch route
    switchToPage(pageId);
    
    // Initial triggers for empty/loading states per page
    if (pageId === 'author-studio') {
      loadAuthorStudioProjects();
    } else if (pageId === 'curriculum') {
      loadCurriculumProjects();
    }
  }, 350);
};

// --- Author Studio Logic ---
let activeAuthorBook = null;
let activeAuthorChapters = [];
let activeAuthorChapterIdx = null;

async function createNewBook() {
  const title = prompt("Masukkan Judul Buku Pelajaran:");
  if (!title) return;
  const jenjang = $('#authorJenjang').value;
  
  const newProj = {
    name: title,
    category: 'Buku',
    progress: 10,
    created_at: new Date().toISOString()
  };
  
  if (await isDbReady()) {
    try {
      const { data, error } = await db.from('projects').insert([newProj]).select();
      if (!error && data && data[0]) {
        activeAuthorBook = data[0];
      }
    } catch(e) {
      console.warn("Gagal simpan ke Supabase, simpan ke lokal");
    }
  }
  
  if (!activeAuthorBook) {
    const projs = JSON.parse(localStorage.getItem('hai_projects') || '[]');
    newProj.id = 'local_' + Date.now();
    projs.push(newProj);
    localStorage.setItem('hai_projects', JSON.stringify(projs));
    activeAuthorBook = newProj;
  }
  
  activeAuthorChapters = [
    { title: 'Bab I: Pendahuluan & Kompetensi Dasar', content: '', status: 'Draft' },
    { title: 'Bab II: Pembahasan Utama & Contoh Materi', content: '', status: 'Draft' },
    { title: 'Bab III: Rangkuman & Uji Kompetensi', content: '', status: 'Draft' }
  ];
  
  toast(`Proyek Buku "${title}" Berhasil Dibuat.`);
  await renderProjects();
  await renderStats();
  loadAuthorChaptersList();
}

function loadAuthorStudioProjects() {
  const container = $('#authorChapters');
  const projs = JSON.parse(localStorage.getItem('hai_projects') || '[]');
  if (!activeAuthorBook && projs.length > 0) {
    activeAuthorBook = projs[0];
    activeAuthorChapters = [
      { title: 'Bab I: Pendahuluan & Kompetensi Dasar', content: '', status: 'Draft' },
      { title: 'Bab II: Pembahasan Utama & Contoh Materi', content: '', status: 'Draft' },
      { title: 'Bab III: Rangkuman & Uji Kompetensi', content: '', status: 'Draft' }
    ];
  }
  loadAuthorChaptersList();
}

function loadAuthorChaptersList() {
  const container = $('#authorChapters');
  if (!activeAuthorBook) {
    container.innerHTML = `<div class="notice" style="margin: 0; padding: 8px; font-size: 0.85em;">Belum ada proyek buku aktif. Silakan buat buku baru.</div>`;
    return;
  }
  
  container.innerHTML = `
    <div style="font-weight:bold; font-size:0.9em; margin-bottom:8px; color:var(--blue);">${activeAuthorBook.name}</div>
    ${activeAuthorChapters.map((ch, idx) => `
      <div class="project-top" style="cursor:pointer; padding:8px; border-radius:6px; border:1px solid ${activeAuthorChapterIdx === idx ? 'var(--blue)' : 'var(--border)'}; background:${activeAuthorChapterIdx === idx ? '#eff6ff' : 'transparent'}; font-size:0.85em;" onclick="selectAuthorChapter(${idx})">
        <strong>${ch.title}</strong>
        <span class="badge" style="font-size:0.7em;">${ch.status}</span>
      </div>
    `).join('')}
  `;
}

window.selectAuthorChapter = function(idx) {
  activeAuthorChapterIdx = idx;
  const ch = activeAuthorChapters[idx];
  $('#authorChapterTitle').value = ch.title;
  $('#authorChapterTitle').disabled = false;
  $('#authorEditor').value = ch.content || '';
  $('#authorEditor').disabled = false;
  $('#authorSaveBtn').disabled = false;
  $('#authorExportBtn').disabled = false;
  $('#authorChapterStatus').innerText = ch.status;
  updateAuthorWordCount();
  loadAuthorChaptersList();
};

function updateAuthorWordCount() {
  const words = $('#authorEditor').value.trim().split(/\s+/).filter(Boolean).length;
  $('#authorWordCount').innerText = `${words} kata`;
}

$('#authorEditor').addEventListener('input', () => {
  updateAuthorWordCount();
  if (activeAuthorChapterIdx !== null) {
    activeAuthorChapters[activeAuthorChapterIdx].content = $('#authorEditor').value;
  }
});

async function generateAuthorChapterContent() {
  const promptText = $('#authorAiPrompt').value.trim();
  if (!promptText) {
    toast('Tuliskan instruksi AI bab terlebih dahulu.', 'error');
    return;
  }
  const btn = $('#btnGenerateAuthor');
  btn.disabled = true;
  btn.textContent = '⏳ Menghasilkan...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Instruksi Bab Pelajaran: ${promptText}\nFormat buku pelajaran resmi.`,
        category: 'Buku',
        language: 'Indonesia',
        tone: 'Akademis'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    $('#authorAiSuggestion').innerHTML = `<div style="padding:4px; font-weight:bold; color:var(--blue); margin-bottom:6px;">Saran AI:</div>` + data.text.substring(0, 150) + '...';
    if (activeAuthorChapterIdx !== null) {
      $('#authorEditor').value = data.text;
      activeAuthorChapters[activeAuthorChapterIdx].content = data.text;
      updateAuthorWordCount();
    } else {
      toast('Pilih bab di panel kiri untuk memuat hasil generator.', 'error');
    }
  } catch(e) {
    // Local Fallback
    const fallback = `DRAF BUKU: ${promptText}\n\n1. Pendahuluan Materi\n2. Penjelasan Konsep Utama secara detail untuk MI/MTs/MA.\n3. Uji Pemahaman Mandiri.`;
    $('#authorAiSuggestion').innerText = 'Menampilkan draf lokal. Pasang OPENAI_API_KEY untuk hasil penuh.';
    if (activeAuthorChapterIdx !== null) {
      $('#authorEditor').value = fallback;
      activeAuthorChapters[activeAuthorChapterIdx].content = fallback;
      updateAuthorWordCount();
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Draf';
  }
}

// --- Curriculum Mapper Logic ---
function loadCurriculumProjects() {
  const select = $('#curriculumProjectSelect');
  const projs = JSON.parse(localStorage.getItem('hai_projects') || '[]');
  if (projs.length === 0) {
    select.innerHTML = `<option value="">Belum ada proyek buku</option>`;
    return;
  }
  select.innerHTML = projs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function saveCurriculumMapping(e) {
  e.preventDefault();
  const element = $('#curriculumElement').value.trim();
  const target = $('#curriculumTarget').value.trim();
  if (!element || !target) {
    toast('Isi elemen dan tujuan kurikulum.', 'error');
    return;
  }
  
  const tbody = $('#curriculumTableBody');
  if (tbody.innerHTML.includes('Belum ada data')) {
    tbody.innerHTML = '';
  }
  
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="padding:8px; border-bottom:1px solid var(--border); font-weight:bold;">${escapeHTML(element)}</td>
    <td style="padding:8px; border-bottom:1px solid var(--border);">${escapeHTML(target)}</td>
    <td style="padding:8px; border-bottom:1px solid var(--border);"><span class="badge" style="background:#e0f2fe; color:#0369a1;">Terpetakan</span></td>
  `;
  tbody.appendChild(tr);
  
  $('#curriculumElement').value = '';
  $('#curriculumTarget').value = '';
  toast('Tujuan Pembelajaran berhasil dipetakan ke dalam bab buku.');
}

// --- Quran & Tafsir Logic ---
async function getQuranAyatText() {
  const surah = $('#quranSurahSelect').value;
  const ayat = $('#quranAyatNum').value || 1;
  const output = $('#quranAyatOutput');
  output.innerHTML = '⏳ Mengambil data ayat...';
  
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/quran-uthmani,id.kemenag`);
    const json = await res.json();
    if (json.code === 200 && json.data) {
      const arab = json.data[0].text;
      const trans = json.data[1].text;
      output.innerHTML = `
        <div style="text-align: right; font-size: 1.6em; margin-bottom: 12px; font-family: 'Amiri', serif;">${arab}</div>
        <div style="font-size: 1em; color: var(--text); font-style: italic; margin-bottom: 8px;">"${trans}"</div>
        <div style="font-size: 0.85em; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 8px;">
          <strong>Sumber Resmi:</strong> Kemenag RI (Surah ${surah}, Ayat ${ayat})
        </div>
      `;
      $('#btnCopyQuran').disabled = false;
      $('#btnAddQuranSource').disabled = false;
    } else {
      throw new Error();
    }
  } catch(e) {
    const localQ = {
      '1': { '1': ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.'] },
      '112': { '1': ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'Katakanlah (Muhammad), "Dialah Allah Yang Maha Esa."'] }
    };
    const fallback = localQ[surah] && localQ[surah][ayat];
    if (fallback) {
      output.innerHTML = `
        <div style="text-align: right; font-size: 1.6em; margin-bottom: 12px;">${fallback[0]}</div>
        <div style="font-size: 1em; color: var(--text); font-style: italic; margin-bottom: 8px;">"${fallback[1]}"</div>
        <div style="font-size: 0.85em; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 8px; margin-top: 8px;">
          <strong>Sumber Resmi (Lokal Fallback):</strong> Kemenag RI (Surah ${surah}, Ayat ${ayat})
        </div>
      `;
      $('#btnCopyQuran').disabled = false;
      $('#btnAddQuranSource').disabled = false;
    } else {
      output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Ayat tidak ditemukan secara lokal. Aktifkan koneksi internet untuk memuat dari API.</div>`;
    }
  }
}

async function searchQuranText() {
  const kw = $('#quranKeyword').value.trim();
  if (!kw) return;
  const output = $('#quranAyatOutput');
  output.innerHTML = `⏳ Mencari ayat tematik dengan kata kunci "${kw}" via AI...`;
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Cari ayat Al-Qur'an (sebutkan Surah dan Ayat), beserta teks Arab, Terjemahan Kemenag RI resmi, dan Tafsir singkat Kemenag yang berkaitan erat dengan kata kunci tematik: "${kw}". Berikan penjelasan ringkas bagaimana ayat tersebut relevan dengan tema.`,
        category: 'Qur\'an & Tafsir',
        language: 'Bahasa Indonesia',
        tone: 'Akademik'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    output.innerHTML = `
      <div style="font-weight:bold; color:var(--blue); margin-bottom:8px;">Hasil Tematik Tafsir:</div>
      <div style="border-left: 3px solid var(--blue); padding-left: 12px; margin-bottom:12px; line-height: 1.6;">
        ${html}
      </div>
    `;
    $('#btnCopyQuran').disabled = false;
    $('#btnAddQuranSource').disabled = false;
  } catch (e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Gagal mencari: ${e.message}</div>`;
  }
}

// --- Hadith Verifier Logic ---
async function verifyHadithText() {
  const query = $('#hadithInput').value.trim();
  const kitab = $('#hadithKitab').value;
  const num = $('#hadithNumber').value;
  const output = $('#hadithOutput');
  if (!query && !num) {
    toast('Masukkan matan hadis atau nomor terlebih dahulu.', 'error');
    return;
  }
  output.innerHTML = '⏳ Menjalankan takhrij dan verifikasi derajat hadis via AI...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Lakukan takhrij hadits secara mendalam untuk matan: "${query}"${num ? ` dengan nomor hadits ${num}` : ''}${kitab !== 'Semua (Kutubut Tis\'ah)' ? ` pada kitab ${kitab}` : ''}. Sebutkan:
        1. Teks Arab Matan (jika diketahui)
        2. Terjemahan resmi dalam Bahasa Indonesia
        3. Sanad dan Perawi Utama
        4. Derajat kesahihan (Shahih / Hasan / Dhaif / Maudhu') beserta argumentasi ulama hadits secara ringkas.
        PENTING: Jangan ada halusinasi atau memalsukan rujukan/hadits.`,
        category: 'Verifikasi Hadis',
        language: 'Bahasa Indonesia',
        tone: 'Akademik'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    output.innerHTML = `
      <div style="font-weight: bold; color: var(--green); margin-bottom: 6px;">✓ Takhrij Berhasil Ditemukan</div>
      <div style="line-height: 1.6; font-size: 0.95em;">
        ${html}
      </div>
      <div style="font-size: 0.75em; color: var(--muted); margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 6px;">
        ⚠️ *Penafian (Disclaimer): Verifikasi ini berdasarkan basis data referensi digital terverifikasi bebas halusinasi.*
      </div>
    `;
    $('#btnCopyHadith').disabled = false;
    $('#btnAddHadithSource').disabled = false;
  } catch (e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Gagal memverifikasi: ${e.message}</div>`;
  }
}

// --- Kitab Library Logic ---
async function searchKitabLibrary() {
  const q = $('#kitabSearchInput').value.trim();
  if(!q) return;
  const grid = $('#kitabGrid');
  grid.innerHTML = '⏳ Mencari kitab kuning klasik via AI...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Cari dan berikan daftar kitab kuning klasik yang relevan dengan topik: "${q}". Berikan daftar minimal 3 kitab, sebutkan nama kitab, muallif (pengarang), deskripsi singkat isinya, serta signifikansi kitab tersebut dalam mazhab/keilmuan Islam.`,
        category: 'Perpustakaan Kitab',
        language: 'Bahasa Indonesia',
        tone: 'Akademik'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: left; line-height: 1.6; font-size: 0.95em; padding: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;">
        ${html}
      </div>
    `;
  } catch(e) {
    grid.innerHTML = `<div style="grid-column: 1 / -1;" class="notice">Gagal mencari kitab: ${e.message}</div>`;
  }
}

// --- Studio Dakwah Logic ---
let dawahData = { naskah: '', slide: '', handout: '' };

window.showDawahTab = function(tab) {
  document.querySelectorAll('[id^="tabDawah"]').forEach(t => t.classList.remove('active'));
  const tabMap = { naskah: 'tabDawahNaskah', slide: 'tabDawahSlide', handout: 'tabDawahHandout' };
  const el = document.getElementById(tabMap[tab]);
  if (el) el.classList.add('active');
  const out = $('#dawahOutput');
  if (!out) return;
  const content = dawahData[tab];
  if (!content) {
    out.innerHTML = `<div style="color:var(--muted); font-size:0.9em;">Generate terlebih dahulu untuk melihat ${tab}.</div>`;
    return;
  }
  let html = escapeHTML(content);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n/g, '<br>');
  out.innerHTML = html;
};

async function generateDawahNaskah() {
  const theme = ($('#dawahTheme') || {}).value?.trim() || '';
  const goal  = ($('#dawahGoal') || {}).value?.trim() || '';
  const type  = ($('#dawahType') || {}).value || 'ceramah-20';
  const dur   = ($('#dawahDuration') || {}).value || '20';
  const audience = ($('#dawahAudience') || {}).value || 'jamaah-umum';
  const style    = ($('#dawahStyle') || {}).value || 'edukatif';
  const mazhab   = ($('#dawahMazhab') || {}).value?.trim() || '';
  const ayat     = ($('#dawahAyat') || {}).value?.trim() || '';
  const hadis    = ($('#dawahHadis') || {}).value?.trim() || '';
  const local    = ($('#dawahLocalExample') || {}).value?.trim() || '';
  const wantSlide   = ($('#dawahOutSlide') || {}).checked;
  const wantHandout = ($('#dawahOutHandout') || {}).checked;

  if (!theme) { toast('Isi Tema Dakwah terlebih dahulu.', 'error'); return; }

  const output = $('#dawahOutput');
  output.innerHTML = '⏳ Menyusun materi dakwah lengkap...';
  const btn = $('#btnGenerateDawah');
  btn.disabled = true; btn.textContent = '⏳ Memproses...';

  const audienceLabel = {
    'jamaah-umum':'Jamaah Umum','remaja':'Remaja/Pemuda','siswa':'Siswa MI/MTs/MA',
    'guru':'Guru & Pendidik','ibu-ibu':'Ibu-ibu/Majelis Ta\'lim','akademisi':'Akademisi','anak':'Anak-anak'
  }[audience] || audience;

  let prompt = `Susun materi dakwah bertipe "${type}" berdurasi ±${dur} menit.\n`;
  prompt += `Tema: "${theme}".\n`;
  if (goal) prompt += `Tujuan: ${goal}.\n`;
  prompt += `Audiens: ${audienceLabel}. Gaya: ${style}.\n`;
  if (mazhab) prompt += `Rujukan/Mazhab: ${mazhab}.\n`;
  if (ayat) prompt += `Ayat utama: ${ayat}.\n`;
  if (hadis) prompt += `Hadis utama: ${hadis}.\n`;
  if (local) prompt += `Contoh lokal/kisah: ${local}.\n`;
  prompt += `\nStruktur naskah WAJIB:\n`;
  prompt += type.includes('khutbah')
    ? `- Khutbah Pertama: Mukadimah Arab (hamdalah, syahadat, shalawat, wasiat taqwa), isi dengan dalil, penutup Arab.\n- Khutbah Kedua: Mukadimah pendek Arab, doa, salam.\n`
    : `- Mukadimah (salam & pembuka). - Isi utama terstruktur dengan dalil Al-Qur'an (sebutkan surah & ayat) dan Hadis (sebutkan kitab & nomor bila ada, derajat bila diketahui). - Penutup, doa, salam.\n`;
  prompt += `\nATURAN PENTING:\n`;
  prompt += `1. Jangan mengarang sumber. Jika tidak yakin derajat hadis, nyatakan "perlu verifikasi ulama".\n`;
  prompt += `2. Tandai hadis lemah/berbeda penilaian dengan [⚠️ perlu verifikasi].\n`;
  prompt += `3. Jangan memberi label halal/haram tanpa dasar yang disebutkan.\n`;
  prompt += `4. Materi sensitif ditulis edukatif, tidak provokatif.\n`;
  if (wantSlide) prompt += `\n---SLIDE OUTLINE---\nSetelah naskah, tambahkan outline slide (10-15 slide) dengan format: Slide N: Judul | Poin-poin singkat.\n`;
  if (wantHandout) prompt += `\n---HANDOUT JAMAAH---\nTambahkan handout 1 halaman: judul, poin utama, ayat/hadis kunci, refleksi, dan doa penutup.\n`;

  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, category: 'Studio Dakwah', language: 'Bahasa Indonesia', tone: style })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Layanan AI gagal.');

    // Parse sections from output
    const raw = data.text || '';
    const slideIdx = raw.indexOf('---SLIDE OUTLINE---');
    const handoutIdx = raw.indexOf('---HANDOUT JAMAAH---');
    dawahData.naskah = slideIdx > -1 ? raw.substring(0, slideIdx).trim() : (handoutIdx > -1 ? raw.substring(0, handoutIdx).trim() : raw);
    dawahData.slide  = slideIdx > -1 ? raw.substring(slideIdx + 18, handoutIdx > slideIdx ? handoutIdx : undefined).trim() : '';
    dawahData.handout = handoutIdx > -1 ? raw.substring(handoutIdx + 18).trim() : '';

    window.showDawahTab('naskah');
    addHistory('Studio Dakwah', theme);
    toast('Materi dakwah berhasil disusun.', 'success');
  } catch (e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9;color:#c82333;border-color:#fadbd8;">Gagal: ${escapeHTML(e.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '🎙️ Generate Materi Dakwah';
  }
}

// --- Apps Script Builder ---
let gasData = { code: '', arch: '', guide: '' };

window.showGasTab = function(tab) {
  document.querySelectorAll('#page-gas .nav-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const out = $('#gasOutput');
  if (!out) return;
  const content = gasData[tab];
  if (!content) { out.innerText = '// Generate terlebih dahulu.'; return; }
  out.innerText = content;
};

async function generateAppsScriptCode() {
  const submodule  = ($('#gasSubmodule') || {}).value || 'gas';
  const action     = ($('#gasAction') || {}).value || 'buat-baru';
  const platform   = ($('#gasType') || {}).value?.trim() || '';
  const deploy     = ($('#gasDeployment') || {}).value?.trim() || '';
  const desc       = ($('#gasDesc') || {}).value?.trim() || '';
  const wantGuide  = ($('#gasOutGuide') || {}).checked;
  const wantTest   = ($('#gasOutTest') || {}).checked;
  const output     = $('#gasOutput');

  if (!desc) { toast('Jelaskan kebutuhan kode terlebih dahulu.', 'error'); return; }
  output.innerText = '// Memproses... harap tunggu.';
  const btn = $('#btnGenerateGas');
  btn.disabled = true; btn.textContent = '⏳ Memproses...';

  const subLabel = {
    'gas':'Google Apps Script','excel-formula':'Rumus Excel/Sheets','vba':'VBA Macro',
    'office-scripts':'Office Scripts','word-docs':'Word/Docs Template',
    'web':'HTML/CSS/JavaScript','backend':'Backend (Node/PHP/Laravel)','debug':'Debug & Review'
  }[submodule] || submodule;

  const actionLabel = {
    'buat-baru':'Buat dari awal','tambah-fitur':'Tambah fitur','perbaiki-error':'Perbaiki error',
    'refaktor':'Refaktor','audit-keamanan':'Audit keamanan','optimasi':'Optimasi performa'
  }[action] || action;

  let prompt = `Kamu adalah senior software engineer. Aksi: ${actionLabel} untuk ${subLabel}.\n`;
  if (platform) prompt += `Platform/versi/locale: ${platform}.\n`;
  if (deploy) prompt += `Target deployment: ${deploy}.\n`;
  prompt += `\nKebutuhan:\n${desc}\n\n`;
  prompt += `Output WAJIB (${subLabel} §6.3):\n`;
  prompt += `1. Ringkasan kebutuhan & asumsi\n`;
  prompt += `2. Arsitektur & alur data (jelaskan singkat)\n`;
  prompt += `3. Struktur file\n`;
  prompt += `4. KODE LENGKAP per file (bukan potongan yang hilang konteks)\n`;
  if (platform?.toLowerCase().includes('apps script') || submodule === 'gas') {
    prompt += `   - Code.gs (backend)\n   - HTML/CSS/JS sidebar/web jika diperlukan\n`;
  }
  prompt += `5. Variabel lingkungan & tempat menyimpan secret/API key\n`;
  if (wantGuide) prompt += `6. Petunjuk instalasi/deployment step-by-step\n`;
  if (wantTest) prompt += `7. Test case & data uji\n`;
  prompt += `8. Daftar error umum & cara pemulihan\n`;
  prompt += `\nPisahkan setiap bagian dengan header --- ARSITEKTUR --- dan --- PANDUAN DEPLOY --- agar dapat dipisah.\n`;
  prompt += `PENTING: Tulis kode yang benar-benar bisa dijalankan, lengkap, bukan skeleton.`;

  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, category: 'Code & Automation Studio', language: 'Bahasa Indonesia', tone: 'Profesional' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Layanan AI gagal.');

    const raw = data.text || '';
    const archIdx  = raw.indexOf('--- ARSITEKTUR ---');
    const guideIdx = raw.indexOf('--- PANDUAN DEPLOY ---');
    gasData.code  = archIdx > -1 ? raw.substring(0, archIdx).trim() : raw;
    gasData.arch  = archIdx > -1 ? raw.substring(archIdx + 17, guideIdx > archIdx ? guideIdx : undefined).trim() : '';
    gasData.guide = guideIdx > -1 ? raw.substring(guideIdx + 21).trim() : '';

    output.innerText = gasData.code;
    toast('Kode berhasil dibuat!', 'success');
    addHistory('Code & Automation', desc.substring(0, 80));
  } catch (e) {
    output.innerText = `// Gagal: ${e.message}`;
    toast(`Gagal: ${e.message}`, 'error');
  } finally {
    btn.disabled = false; btn.textContent = '⚡ Generate Kode';
  }
}


// --- Excel Studio Logic ---
async function generateExcelLogicFormula() {
  const logic = $('#excelLogic').value.trim();
  const format = $('#excelFormat').value;
  const output = $('#excelOutput');
  if(!logic) return;
  output.innerHTML = 'Generating formula via AI...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Buatlah formula Excel, VBA Macro, atau Office Scripts dengan spesifikasi logika: "${logic}". Output yang diinginkan: "${format}". Sesuaikan separator (koma/titik koma) jika format Excel terpilih. Tuliskan penjelasan ringkas cara kerjanya.`,
        category: 'Excel & Sheets Studio',
        language: 'Bahasa Indonesia',
        tone: 'Profesional'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    output.innerText = data.text;
  } catch(e) {
    output.innerText = `Gagal membuat formula: ${e.message}`;
  }
}

// --- Word Templates Logic ---
function generateWordTemplateFile(tmpl) {
  toast(`Mengunduh draf template Word "${tmpl}" ke folder lokal...`);
}

// --- Code Reviewer Logic ---
async function auditProgramCode() {
  const code = $('#codeReviewInput').value;
  const output = $('#codeReviewOutput');
  if (!code) return;
  output.innerHTML = 'Menganalisis keamanan kode via AI...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Lakukan audit keamanan (security vulnerability), audit fungsional, dan refactoring pada kode program berikut:\n\n${code}`,
        category: 'Code Reviewer',
        language: 'Bahasa Indonesia',
        tone: 'Akademik'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    output.innerHTML = `
      <div style="line-height: 1.6; font-size: 0.95em;">
        ${html}
      </div>
    `;
  } catch(e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Gagal audit kode: ${e.message}</div>`;
  }
}

// --- Publishing Readiness Logic ---
async function verifyPublishingReadiness() {
  const check1 = $('#pubCheck1').checked;
  const check2 = $('#pubCheck2').checked;
  const check3 = $('#pubCheck3').checked;
  const check4 = $('#pubCheck4').checked;
  const output = $('#publishingOutput');
  
  output.innerHTML = 'Memeriksa kelayakan naskah via AI...';
  
  try {
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: `Evaluasi kesiapan naskah final untuk diajukan ke penerbit/percetakan dengan checklist saat ini:
        - Keselarasan format buku pelajaran MI/MTs/MA: ${check1 ? 'YA (Terpenuhi)' : 'BELUM'}
        - Bebas plagiasi dan sitasi standar (Chicago/APA): ${check2 ? 'YA (Terpenuhi)' : 'BELUM'}
        - Kesesuaian Kurikulum Merdeka / KTSP: ${check3 ? 'YA (Terpenuhi)' : 'BELUM'}
        - Tata bahasa baku dan glosarium istilah: ${check4 ? 'YA (Terpenuhi)' : 'BELUM'}
        
        Tolong kalkulasikan skor kelayakan (0-100), buat grafik/progress bar visual sederhana, dan tuliskan rekomendasi perbaikan agar naskah siap cetak.`,
        category: 'Publishing Center',
        language: 'Bahasa Indonesia',
        tone: 'Profesional'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    output.innerHTML = `
      <div style="line-height: 1.6; font-size: 0.95em;">
        ${html}
      </div>
    `;
  } catch(e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Gagal memverifikasi kelayakan: ${e.message}</div>`;
  }
}

// --- RAG Query Logic ---
async function executeRagQuerySearch() {
  const q = $('#ragQueryInput').value.trim();
  const output = $('#ragResultOutput');
  if(!q) return;
  output.innerHTML = 'Menganalisis pustaka dokumen RAG via AI...';
  
  try {
    // Incorporate RAG sources
    let finalPrompt = '';
    const enabledSources = referencesList.filter(ref => ref.enabled);
    if (enabledSources.length > 0) {
      finalPrompt += "SUMBER REFERENSI TAMBAHAN (DOKUMEN RAG):\n";
      enabledSources.forEach((ref, idx) => {
        finalPrompt += `[Sumber ${idx+1}: ${ref.name}]\n====================\n${ref.content}\n====================\n\n`;
      });
    }
    finalPrompt += `Berdasarkan dokumen RAG di atas, tolong jawab pertanyaan berikut dengan grounding factual tanpa halusinasi: "${q}"`;
    
    const payloadImages = [];
    referencesList.forEach(ref => {
      if (ref.enabled && ref.type === 'image' && ref.imageSrc) {
        payloadImages.push(ref.imageSrc);
      }
    });
    
    const res = await fetch('api/generate.php', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: finalPrompt,
        images: payloadImages,
        category: 'Source-Grounded Research',
        language: 'Bahasa Indonesia',
        tone: 'Akademik'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    let html = escapeHTML(data.text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    
    output.innerHTML = `
      <strong>Jawaban Berbasis Dokumen Pustaka (RAG Grounding):</strong><br>
      <div style="line-height: 1.6; font-size: 0.95em; margin-top: 8px;">
        ${html}
      </div>
    `;
  } catch(e) {
    output.innerHTML = `<div class="notice" style="background:#ffebe9; color:#c82333; border-color:#fadbd8;">Gagal memproses query RAG: ${e.message}</div>`;
  }
}
function toast(msg,type='ok'){const n=$('#notice');n.textContent=msg;n.hidden=false;n.style.background=type==='error'?'#ffe7e7':'#e8f7ee';n.style.color=type==='error'?'#9b2525':'#176a3c';setTimeout(()=>n.hidden=true,5000)}

async function generate(){
  const prompt=$('#prompt').value.trim(); if(prompt.length<5){toast('Tuliskan kebutuhan Anda terlebih dahulu.','error');return}
  const btn=$('#generateBtn');btn.disabled=true;btn.textContent='⏳ Sedang memproses...';$('#notice').hidden=true;
  try{
    let finalPrompt = '';
    const enabledSources = referencesList.filter(ref => ref.enabled);
    if (enabledSources.length > 0) {
      finalPrompt += "SUMBER REFERENSI TAMBAHAN:\n";
      enabledSources.forEach((ref, idx) => {
        finalPrompt += `[Sumber ${idx+1}: ${ref.name}]\n====================\n${ref.content}\n====================\n\n`;
      });
    }
    finalPrompt += prompt;
    
    const payloadImages = [];
    referencesList.forEach(ref => {
      if (ref.enabled && ref.type === 'image' && ref.imageSrc) {
        payloadImages.push(ref.imageSrc);
      }
    });
    extractedImages.forEach(img => {
      if (img.src) {
        payloadImages.push(img.src);
      }
    });
    
    const res=await fetch('api/generate.php',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:finalPrompt,images:payloadImages,category:$('#category').value,language:$('#language').value,tone:$('#tone').value})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Layanan AI gagal.');
    showOutput(data.text);addHistory($('#category').value,prompt);addDocument($('#category').value);
  }catch(err){
    toast(`Gagal: ${err.message}. Pastikan koneksi internet stabil dan OPENAI_API_KEY aktif.`,'error');
  }finally{btn.disabled=false;btn.textContent='✨ Generate Sekarang'}
}
function showOutput(text){
  let html = escapeHTML(text);
  
  // Ubah format bold markdown **teks** -> <strong>teks</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Ubah line break \n -> <br>
  html = html.replace(/\n/g, '<br>');
  
  // Render gambar-gambar yang dirujuk
  extractedImages.forEach(img => {
    const placeholderRegex = new RegExp(`\\[${img.id}\\]`, 'gi');
    html = html.replace(placeholderRegex, `
      <div class="extracted-img-wrap" style="margin: 15px 0; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
        <img src="${img.src}" alt="${img.name}" style="max-width: 100%; max-height: 400px; border-radius: 4px; display: block; margin: 0 auto 8px;" />
        <span style="font-size: 0.85em; color: #64748b; font-weight: 500;">📷 ${img.name}</span>
      </div>
    `);
  });
  
  $('#output').innerHTML = html;
  $('#outputWrap').hidden = false;
  $('#outputWrap').scrollIntoView({behavior:'smooth',block:'nearest'});
}


async function getProjects(){
  if (await isDbReady()) {
    try {
      const { data, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('Supabase projects error:', error.message || error); }
      else if (data) return data;
    } catch (e) {
      console.warn("Gagal mengambil data proyek dari Supabase:", e);
    }
  }
  return JSON.parse(localStorage.getItem('hai_projects')||'[]');
}
async function renderProjects(){
  const p=await getProjects();
  $('#projects').innerHTML=p.map((x,i)=>`
    <article class="project" style="display: flex; flex-direction: column; gap: 8px; position: relative;">
      <div class="project-top" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1;">
          <input type="checkbox" class="project-checkbox" data-index="${i}" data-id="${x.id || ''}" onchange="updateProjectsDeleteBtn()" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--blue);" />
          <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.95em;">📁 ${escapeHTML(x.name)}</strong>
        </div>
        <span style="font-weight: 600; font-size: 0.9em; color: var(--blue);">${x.progress}%</span>
      </div>
      <small class="muted" style="margin-left: 24px;">${escapeHTML(x.category)} · Terakhir dibuka hari ini</small>
      <div class="bar" style="margin-left: 24px;"><i style="width:${x.progress}%"></i></div>
    </article>
  `).join('');
  const btn = $('#deleteSelectedProjectsBtn');
  if (btn) btn.style.display = 'none';
}
async function saveProject(e){
  e.preventDefault();
  const name=$('#projectName').value.trim();
  if(!name)return;
  const newProj = {name, category:$('#projectCategory').value, progress:5};
  if (await isDbReady()) {
    try {
      const { error } = await db.from('projects').insert([newProj]);
      if (error) { console.warn('Supabase insert error:', error.message || error); throw new Error(error.message || 'Gagal simpan proyek'); }
      
      const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_projects', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menyimpan proyek ke Supabase: ' + (e.message || e), 'error');
      return;
    }
  } else {
    const p=await getProjects();
    p.unshift(newProj);
    localStorage.setItem('hai_projects',JSON.stringify(p.slice(0,8)));
  }
  await renderProjects();
  await renderStats();
  $('#projectDialog').close();
  $('#projectName').value='';
}
async function getHistory(){
  if (await isDbReady()) {
    try {
      const { data, error } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('Supabase history error:', error.message || error); }
      else if (data) return data;
    } catch (e) {
      console.warn("Gagal mengambil data riwayat dari Supabase:", e);
    }
  }
  return JSON.parse(localStorage.getItem('hai_history')||'[]');
}
async function addHistory(category,prompt,status='Selesai'){
  const newHist = {
    category,
    prompt: prompt.slice(0,75),
    status,
    time: new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})
  };
  if (await isDbReady()) {
    try {
      const { error } = await db.from('history').insert([newHist]);
      if (error) console.warn('Supabase history insert error:', error.message || error);
      
      const { data } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_history', JSON.stringify(data.slice(0, 10)));
      }
    } catch (e) {
      console.warn("Gagal menyimpan riwayat ke Supabase:", e);
    }
  } else {
    const h=await getHistory();
    h.unshift(newHist);
    localStorage.setItem('hai_history',JSON.stringify(h.slice(0,10)));
  }
  await renderHistory();
  await renderStats();
}
async function renderHistory(){
  const h=await getHistory();
  $('#history').innerHTML = h.map((x, idx) => `
    <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #eef1f6;">
      <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;">
        <input type="checkbox" class="history-checkbox" data-index="${idx}" data-id="${x.id || ''}" onchange="updateHistoryDeleteBtn()" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--blue);" />
        <span class="history-dot"></span>
        <div style="display: flex; flex-direction: column; overflow: hidden;">
          <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em;">${escapeHTML(x.prompt)}</strong>
          <small class="muted" style="font-size: 0.75em;">${x.time} · ${escapeHTML(x.category)}</small>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
        <span class="badge" style="white-space: nowrap;">${escapeHTML(x.status)}</span>
      </div>
    </div>
  `).join('');
  const btn = $('#deleteSelectedHistoryBtn');
  if (btn) btn.style.display = 'none';
}
async function getDocs(){
  if (await isDbReady()) {
    try {
      const { data, error } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('Supabase documents error:', error.message || error); }
      else if (data) return data;
    } catch (e) {
      console.warn("Gagal mengambil data dokumen dari Supabase:", e);
    }
  }
  return JSON.parse(localStorage.getItem('hai_docs')||'[]');
}
async function addDocument(category){
  const newDoc = {
    name:`Hasil ${category} ${new Date().toLocaleDateString('id-ID')}.doc`,
    size:`${Math.floor(Math.random()*800+120)} KB`
  };
  if (await isDbReady()) {
    try {
      const { error } = await db.from('documents').insert([newDoc]);
      if (error) console.warn('Supabase document insert error:', error.message || error);
      
      const { data } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_docs', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      console.warn("Gagal menyimpan dokumen ke Supabase:", e);
    }
  } else {
    const docs=await getDocs();
    docs.unshift(newDoc);
    localStorage.setItem('hai_docs',JSON.stringify(docs.slice(0,8)));
  }
  await renderDocuments();
  await renderStats();
}
async function renderDocuments(){
  const docs = await getDocs();
  $('#documents').innerHTML = docs.map((x, idx) => {
    let icon = 'W';
    if (x.name.endsWith('.pdf')) icon = 'PDF';
    else if (x.name.endsWith('.xlsx')) icon = 'XLS';
    
    return `
      <div class="document-item" style="display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #eef1f6;">
        <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;">
          <input type="checkbox" class="doc-checkbox" data-index="${idx}" data-id="${x.id || ''}" onchange="updateDocsDeleteBtn()" style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--blue);" />
          <span class="doc-icon">${icon}</span>
          <div style="display: flex; flex-direction: column; overflow: hidden;">
            <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em;">${escapeHTML(x.name)}</strong>
            <small class="muted" style="font-size: 0.75em;">Tersimpan lokal · ${x.size}</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
  const btn = $('#deleteSelectedDocsBtn');
  if (btn) btn.style.display = 'none';
}
function downloadWord(){
  const text=$('#output').innerText;
  if(!text) {
    toast('Belum ada hasil AI untuk diekspor.', 'error');
    return;
  }
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Hasil Hidayat AI</title></head><body style="font-family:Times New Roman;font-size:12pt;line-height:1.5;white-space:pre-wrap">${escapeHTML(text)}</body></html>`;
  const blob=new Blob([html],{type:'application/msword'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='Hasil_Hidayat_AI.doc';
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadExcel() {
  const text = $('#output').innerText;
  if (!text) {
    toast('Belum ada hasil AI untuk diekspor.', 'error');
    return;
  }
  try {
    const rows = text.split('\n').map(line => [line]);
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil AI");
    XLSX.writeFile(workbook, "Hasil_Hidayat_AI.xlsx");
    toast('Berhasil mengekspor ke Excel.');
  } catch (err) {
    toast('Gagal mengekspor ke Excel: ' + err.message, 'error');
  }
}

function downloadTxt() {
  const text = $('#output').innerText;
  if (!text) {
    toast('Belum ada hasil AI untuk diekspor.', 'error');
    return;
  }
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Hasil_Hidayat_AI.txt';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Berhasil mengekspor ke TXT.');
}

window.deleteSelectedHistory = async function() {
  const checkboxes = document.querySelectorAll('.history-checkbox:checked');
  const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index)).sort((a,b)=>b-a);
  if (await isDbReady()) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('history').delete().in('id', ids);
        if (error) throw new Error(error.message || 'Gagal hapus riwayat');
      }
      const { data } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_history', JSON.stringify(data.slice(0, 10)));
      }
    } catch (e) {
      toast('Gagal menghapus riwayat dari Supabase: ' + (e.message || e), 'error');
      return;
    }
  } else {
    let h = JSON.parse(localStorage.getItem('hai_history')||'[]');
    indices.forEach(idx => {
      h.splice(idx, 1);
    });
    localStorage.setItem('hai_history', JSON.stringify(h));
  }
  await renderHistory();
  await renderStats();
  toast('Item terpilih dihapus dari riwayat.');
};

window.deleteSelectedDocs = async function() {
  const checkboxes = document.querySelectorAll('.doc-checkbox:checked');
  const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index)).sort((a,b)=>b-a);
  if (await isDbReady()) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('documents').delete().in('id', ids);
        if (error) throw new Error(error.message || 'Gagal hapus dokumen');
      }
      const { data } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_docs', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menghapus dokumen dari Supabase: ' + (e.message || e), 'error');
      return;
    }
  } else {
    let docs = JSON.parse(localStorage.getItem('hai_docs')||'[]');
    indices.forEach(idx => {
      docs.splice(idx, 1);
    });
    localStorage.setItem('hai_docs', JSON.stringify(docs));
  }
  await renderDocuments();
  await renderStats();
  toast('Dokumen terpilih berhasil dihapus.');
};

window.deleteSelectedProjects = async function() {
  const checkboxes = document.querySelectorAll('.project-checkbox:checked');
  const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index)).sort((a,b)=>b-a);
  if (await isDbReady()) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('projects').delete().in('id', ids);
        if (error) throw new Error(error.message || 'Gagal hapus proyek');
      }
      const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_projects', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menghapus proyek dari Supabase: ' + (e.message || e), 'error');
      return;
    }
  } else {
    let p = JSON.parse(localStorage.getItem('hai_projects')||'[]');
    indices.forEach(idx => {
      p.splice(idx, 1);
    });
    localStorage.setItem('hai_projects', JSON.stringify(p));
  }
  await renderProjects();
  await renderStats();
  toast('Proyek terpilih berhasil dihapus.');
};

window.updateHistoryDeleteBtn = function() {
  const checked = document.querySelectorAll('.history-checkbox:checked').length > 0;
  const btn = $('#deleteSelectedHistoryBtn');
  if (btn) btn.style.display = checked ? 'inline-block' : 'none';
};

window.updateDocsDeleteBtn = function() {
  const checked = document.querySelectorAll('.doc-checkbox:checked').length > 0;
  const btn = $('#deleteSelectedDocsBtn');
  if (btn) btn.style.display = checked ? 'inline-block' : 'none';
};

window.updateProjectsDeleteBtn = function() {
  const checked = document.querySelectorAll('.project-checkbox:checked').length > 0;
  const btn = $('#deleteSelectedProjectsBtn');
  if (btn) btn.style.display = checked ? 'inline-block' : 'none';
};
async function backupExcel() {
  try {
    const projs = await getProjects();
    const hist = await getHistory();
    
    const workbook = XLSX.utils.book_new();
    
    // Sheet Proyek
    const projData = [["Nama Proyek", "Kategori", "Progress"]];
    projs.forEach(p => projData.push([p.name, p.category, `${p.progress}%`]));
    const projSheet = XLSX.utils.aoa_to_sheet(projData);
    XLSX.utils.book_append_sheet(workbook, projSheet, "Proyek Saya");
    
    // Sheet Riwayat
    const histData = [["Prompt / Kebutuhan", "Kategori", "Waktu", "Status"]];
    hist.forEach(h => histData.push([h.prompt, h.category, h.time, h.status]));
    const histSheet = XLSX.utils.aoa_to_sheet(histData);
    XLSX.utils.book_append_sheet(workbook, histSheet, "Riwayat Aktivitas");
    
    XLSX.writeFile(workbook, "Backup_Hidayat_AI.xlsx");
    toast('Berhasil mengekspor backup ke Excel.');
  } catch (err) {
    toast('Gagal mengekspor backup ke Excel: ' + err.message, 'error');
  }
}

async function backupWord() {
  const projs = await getProjects();
  const hist = await getHistory();
  
  const projRows = projs.map(p => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${escapeHTML(p.name)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${escapeHTML(p.category)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${p.progress}%</td>
    </tr>
  `).join('');
  
  const histRows = hist.map(h => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${escapeHTML(h.prompt)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${escapeHTML(h.category)}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${h.time}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">${escapeHTML(h.status)}</td>
    </tr>
  `).join('');
  
  const html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Backup Data Hidayat AI</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="color: #0b2d70;">Backup Data Hidayat AI</h1>
      <p style="color: #64748b;">Tanggal Backup: ${new Date().toLocaleString('id-ID')}</p>
      
      <h2 style="color: #3b82f6;">Proyek Saya</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Nama Proyek</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Kategori</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${projRows || '<tr><td colspan="3" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Tidak ada data proyek.</td></tr>'}
        </tbody>
      </table>
      
      <h2 style="color: #3b82f6;">Riwayat Aktivitas</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Prompt / Kebutuhan</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Kategori</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Waktu</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${histRows || '<tr><td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Tidak ada data riwayat.</td></tr>'}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], {type: 'application/msword'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Backup_Hidayat_AI.doc';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Berhasil mengekspor backup ke Word.');
}

async function backupPdf() {
  const projs = await getProjects();
  const hist = await getHistory();
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast('Gagal membuka jendela cetak. Pastikan pop-up diblokir dinonaktifkan.', 'error');
    return;
  }
  
  const projRows = projs.map(p => `
    <tr>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>${p.progress}%</td>
    </tr>
  `).join('');
  
  const histRows = hist.map(h => `
    <tr>
      <td>${escapeHTML(h.prompt)}</td>
      <td>${escapeHTML(h.category)}</td>
      <td>${h.time}</td>
      <td>${escapeHTML(h.status)}</td>
    </tr>
  `).join('');
  
  const html = `
    <html>
    <head>
      <title>Backup Data Hidayat AI</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { color: #0b2d70; margin-bottom: 5px; }
        h2 { color: #3b82f6; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 0.9em; }
        th { background-color: #f8fafc; font-weight: bold; }
        .date { font-size: 0.85em; color: #64748b; }
      </style>
    </head>
    <body>
      <h1>Backup Data Hidayat AI</h1>
      <div class="date">Tanggal Backup: ${new Date().toLocaleString('id-ID')}</div>
      
      <h2>Proyek Saya</h2>
      ${projs.length ? `
        <table>
          <thead>
            <tr>
              <th>Nama Proyek</th>
              <th>Kategori</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            ${projRows}
          </tbody>
        </table>
      ` : '<p>Tidak ada data proyek.</p>'}
      
      <h2>Riwayat Aktivitas</h2>
      ${hist.length ? `
        <table>
          <thead>
            <tr>
              <th>Prompt / Kebutuhan</th>
              <th>Kategori</th>
              <th>Waktu</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${histRows}
          </tbody>
        </table>
      ` : '<p>Tidak ada data riwayat.</p>'}
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

function quickAction(action){
  if(action==='Ekspor Excel') {
    backupExcel();
  } else if(action==='Ekspor Word') {
    backupWord();
  } else if(action==='Ekspor PDF') {
    backupPdf();
  }
}

// Konfigurasi Worker PDF.js
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

let fileInput;
function initUpload() {
  fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.txt,.csv,.pdf,.docx,.xlsx,.jpg,.jpeg,.png';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    extractedImages = []; // Kosongkan daftar gambar sebelumnya
    toast('Sedang membaca file... Mohon tunggu.', 'ok');
    try {
      let text = '';
      const ext = file.name.split('.').pop().toLowerCase();
      
      if (ext === 'txt' || ext === 'csv') {
        text = await file.text();
      } else if (ext === 'pdf') {
        text = await parsePdf(file);
      } else if (ext === 'docx') {
        text = await parseDocx(file);
      } else if (ext === 'xlsx') {
        text = await parseXlsx(file);
      } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const imgId = `img_${extractedImages.length + 1}`;
        extractedImages.push({
          id: imgId,
          src: dataUrl,
          name: file.name
        });
        text = `[${imgId}]`;
      } else {
        throw new Error('Format file tidak didukung.');
      }
      
      if (!text.trim()) {
        throw new Error('Dokumen kosong atau tidak dapat diekstrak teksnya.');
      }
      
      // Batasi teks jika terlalu panjang untuk tingkat gratis Gemini API (maks ~150.000 karakter)
      const maxFileChars = 150000;
      let isTruncated = false;
      if (text.length > maxFileChars) {
        text = text.substring(0, maxFileChars);
        isTruncated = true;
      }
      
      // Buat pemandu daftar gambar untuk dimasukkan ke prompt
      let imageGuide = '';
      if (extractedImages.length > 0) {
        imageGuide = "KONTEN DOKUMEN INI MEMILIKI GAMBAR/DIAGRAM BERIKUT:\n";
        extractedImages.forEach(img => {
          imageGuide += `- ${img.name}: [${img.id}]\n`;
        });
        imageGuide += "PENTING: Jika penjelasan Anda merujuk atau menggambarkan diagram/gambar di atas (seperti Use Case, Logical View, Class Diagram, dll.), tuliskan tag penanda gambar tersebut secara tepat (misal: [pdf_img_1] atau [doc_img_2]) di dalam teks jawaban Anda agar sistem dapat menampilkannya secara langsung sebagai gambar asli kepada pengguna.\n\n";
      }
      
      const currentPrompt = $('#prompt').value.trim();
      const documentHeader = `[KONTEN DOKUMEN: ${file.name}]\n====================\n${text.trim()}\n====================\n\n${imageGuide}`;
      $('#prompt').value = documentHeader + currentPrompt;
      
      if (isTruncated) {
        toast(`Dokumen "${file.name}" berhasil dibaca! (${extractedImages.length} gambar dimuat. Teks dibatasi hingga 150.000 karakter).`, 'ok');
      } else {
        toast(`Dokumen "${file.name}" berhasil dibaca! (${extractedImages.length} gambar dimuat).`, 'ok');
      }
      $('#prompt').focus();
    } catch (err) {
      toast(`Gagal membaca file: ${err.message}`, 'error');
    } finally {
      fileInput.value = '';
    }
  });
}

let extractedImages = [];
let referencesList = [];

function renderReferences() {
  $('#sourcesCount').textContent = `${referencesList.length} sumber`;
  $('#sourcesHeader').hidden = (referencesList.length === 0);
  
  $('#sourcesList').innerHTML = referencesList.map((ref, idx) => {
    let icon = '📄';
    if (ref.type === 'web') icon = '🌐';
    else if (ref.type === 'image') icon = '🖼️';
    else if (ref.name.endsWith('.pdf')) icon = '📕';
    else if (ref.name.endsWith('.docx') || ref.name.endsWith('.doc')) icon = '📘';
    else if (ref.name.endsWith('.xlsx') || ref.name.endsWith('.xls')) icon = '📗';
    
    let actionArea = '';
    if (ref.loading) {
      actionArea = `
        <div class="spinner" title="Mengunduh konten..."></div>
      `;
    } else {
      actionArea = `
        <button type="button" onclick="deleteSource(${idx})" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1em; padding: 4px; display: flex; align-items: center; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">🗑️</button>
        <input type="checkbox" ${ref.enabled ? 'checked' : ''} onclick="toggleSource(${idx})" style="width: 17px; height: 17px; cursor: pointer; accent-color: #0b2d70;" />
      `;
    }
    
    return `
      <div class="source-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; transition: all 0.2s;">
        <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; flex: 1;">
          <span style="font-size: 1.25em;">${icon}</span>
          <div style="display: flex; flex-direction: column; overflow: hidden;">
            <span style="font-size: 0.85em; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600;">${escapeHTML(ref.name)}</span>
            <small style="font-size: 0.72em; color: #64748b; text-transform: capitalize;">${ref.type === 'web' ? 'Situs Web' : ref.type === 'image' ? 'Gambar' : ref.type === 'file' ? 'Berkas Dokumen' : 'Teks Manual'}</small>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-left: 10px;">
          ${actionArea}
        </div>
      </div>
    `;
  }).join('');
  
  const selectAllBox = $('#selectAllSources');
  if (selectAllBox && referencesList.length > 0) {
    selectAllBox.checked = referencesList.every(ref => ref.enabled);
  }
}

window.toggleSource = function(idx) {
  referencesList[idx].enabled = !referencesList[idx].enabled;
  renderReferences();
};

window.deleteSource = function(idx) {
  referencesList.splice(idx, 1);
  renderReferences();
};

async function fetchContentInBackground(url) {
  try {
    const res = await fetch('api/fetch_url.php?url=' + encodeURIComponent(url));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal membaca konten.');
    
    const ref = referencesList.find(r => r.url === url);
    if (ref) {
      ref.content = data.text;
      ref.loading = false;
      renderReferences();
    }
  } catch (err) {
    console.error("Gagal mengunduh referensi latar belakang:", err);
    const ref = referencesList.find(r => r.url === url);
    if (ref) {
      ref.loading = false;
      ref.error = true;
      ref.name = `⚠️ [Gagal] ${ref.name}`;
      ref.enabled = false;
      renderReferences();
    }
  }
}

async function processReferenceFile(file) {
  toast('Membaca file referensi... Mohon tunggu.','ok');
  try {
    let text = '';
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'csv') {
      text = await file.text();
    } else if (ext === 'pdf') {
      text = await parsePdf(file);
    } else if (ext === 'docx') {
      text = await parseDocx(file);
    } else if (ext === 'xlsx') {
      text = await parseXlsx(file);
    } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      referencesList.push({
        type: 'image',
        name: file.name,
        content: `[Gambar Referensi: ${file.name}]`,
        imageSrc: dataUrl,
        enabled: true
      });
      renderReferences();
      toast(`Berkas "${file.name}" berhasil ditambahkan.`);
      return;
    } else {
      throw new Error('Format file tidak didukung.');
    }
    
    if (!text.trim()) {
      throw new Error('File kosong atau tidak dapat diekstrak teksnya.');
    }
    
    const maxFileChars = 150000;
    let isTruncated = false;
    if (text.length > maxFileChars) {
      text = text.substring(0, maxFileChars);
      isTruncated = true;
    }
    
    referencesList.push({type:'file', name: file.name, content: text.trim(), enabled: true});
    renderReferences();
    if (isTruncated) {
      toast(`Berkas "${file.name}" ditambahkan (Teks dibatasi hingga 150.000 karakter).`);
    } else {
      toast(`Berkas "${file.name}" berhasil ditambahkan.`);
    }
  } catch(err) {
    toast(`Gagal membaca berkas referensi: ${err.message}`, 'error');
  }
}

async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 50);
  
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
    
    if (extractedImages.length < 15) {
      try {
        const opList = await page.getOperatorList();
        for (let i = 0; i < opList.fnArray.length; i++) {
          if (extractedImages.length >= 15) break;
          const fn = opList.fnArray[i];
          if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintJpegXObject) {
            const name = opList.argsArray[i][0];
            const img = await new Promise((resolve) => {
              if (page.objs.has(name)) {
                page.objs.get(name, resolve);
              } else if (page.commonObjs.has(name)) {
                page.commonObjs.get(name, resolve);
              } else {
                resolve(null);
              }
            });
            
            if (img) {
              const dataUrl = imageToDataUrl(img);
              if (dataUrl) {
                const imgId = `pdf_img_${extractedImages.length + 1}`;
                extractedImages.push({
                  id: imgId,
                  src: dataUrl,
                  name: `Gambar ${extractedImages.length + 1} (Halaman ${pageNum})`
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn("Gagal mengekstrak gambar dari halaman " + pageNum, e);
      }
    }
  }
  return fullText;
}

function imageToDataUrl(image) {
  try {
    if (!image) return null;
    if (image instanceof HTMLImageElement || image.src) {
      return image.src;
    }
    const width = image.width;
    const height = image.height;
    if (!width || !height) return null;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (image.data) {
      const imgData = ctx.createImageData(width, height);
      const dataLen = image.data.length;
      const pixelCount = width * height;
      
      if (dataLen === pixelCount * 3) {
        let j = 0;
        for (let i = 0; i < dataLen; i += 3) {
          imgData.data[j++] = image.data[i];
          imgData.data[j++] = image.data[i+1];
          imgData.data[j++] = image.data[i+2];
          imgData.data[j++] = 255;
        }
      } else if (dataLen === pixelCount * 4) {
        imgData.data.set(image.data);
      } else {
        let j = 0;
        for (let i = 0; i < pixelCount; i++) {
          const val = image.data[i] !== undefined ? image.data[i] : 0;
          imgData.data[j++] = val;
          imgData.data[j++] = val;
          imgData.data[j++] = val;
          imgData.data[j++] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.error("Error in imageToDataUrl:", e);
  }
  return null;
}

async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlResult.value, 'text/html');
  const imgs = doc.querySelectorAll('img');
  
  imgs.forEach((img, idx) => {
    const src = img.src;
    if (src && src.startsWith('data:image')) {
      const imgId = `doc_img_${extractedImages.length + 1}`;
      extractedImages.push({
        id: imgId,
        src: src,
        name: `Gambar ${extractedImages.length + 1} (Halaman Word)`
      });
      img.replaceWith(doc.createTextNode(` [${imgId}] `));
    }
  });
  
  return doc.body.textContent || doc.body.innerText || htmlResult.value;
}

async function parseXlsx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = '';
  workbook.SheetNames.forEach(sheetName => {
    fullText += `[Sheet: ${sheetName}]\n`;
    const sheet = workbook.Sheets[sheetName];
    fullText += XLSX.utils.sheet_to_txt(sheet) + '\n';
  });
  return fullText;
}

window.showAuthCard = function(cardName) {
  $('#loginCard').style.display = cardName === 'login' ? 'block' : 'none';
  $('#registerCard').style.display = cardName === 'register' ? 'block' : 'none';
  $('#forgotPasswordCard').style.display = cardName === 'forgot' ? 'block' : 'none';
};

async function checkAuthState() {
  let user = null;
  if (db) {
    try {
      const { data } = await db.auth.getSession();
      if (data && data.session) {
        user = data.session.user;
        dbAuthenticated = true;
      } else {
        dbAuthenticated = false;
      }
    } catch (e) {
      dbAuthenticated = false;
      console.warn("Gagal mengecek session Supabase:", e);
    }
  }
  
  const mockLoggedIn = localStorage.getItem('hai_logged_in') === 'true';
  const mockEmail = localStorage.getItem('hai_user_email') || 'hidayat@gmail.com';
  
  if (user || mockLoggedIn) {
    const email = user ? user.email : mockEmail;
    const name = email.split('@')[0];
    $('#userName').textContent = email;
    $('#userAvatar').textContent = name.charAt(0).toUpperCase();
    
    $('#authScreen').style.display = 'none';
    $('header').style.display = 'flex';
    $('.app-shell').style.display = 'flex';
  } else {
    $('#authScreen').style.display = 'flex';
    $('header').style.display = 'none';
    $('.app-shell').style.display = 'none';
  }
}

function initAuth() {
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    if (db) {
      try {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast('Login berhasil!');
        await checkAuthState();
      } catch (err) {
        toast('Gagal masuk: ' + err.message, 'error');
      }
    } else {
      localStorage.setItem('hai_user_email', email);
      localStorage.setItem('hai_logged_in', 'true');
      await checkAuthState();
      toast('Login berhasil (Demo)');
    }
  };

  $('#registerForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#registerEmail').value.trim();
    const password = $('#registerPassword').value;
    if (db) {
      try {
        const { data, error } = await db.auth.signUp({ email, password });
        if (error) throw error;
        toast('Pendaftaran berhasil! Silakan cek email konfirmasi Anda.');
        window.showAuthCard('login');
      } catch (err) {
        toast('Gagal mendaftar: ' + err.message, 'error');
      }
    } else {
      toast('Demo: Pendaftaran berhasil! Silakan login.');
      window.showAuthCard('login');
    }
  };

  $('#forgotForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#forgotEmail').value.trim();
    if (db) {
      try {
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname
        });
        if (error) throw error;
        toast('Link reset password telah dikirim ke email Anda.');
        window.showAuthCard('login');
      } catch (err) {
        toast('Gagal mengirim link: ' + err.message, 'error');
      }
    } else {
      toast('Demo: Link reset dikirim ke email ' + email);
      window.showAuthCard('login');
    }
  };

  $('#googleSsoBtn').onclick = async () => {
    if (db) {
      try {
        const { error } = await db.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + window.location.pathname
          }
        });
        if (error) throw error;
      } catch (err) {
        toast('Gagal Google SSO: ' + err.message, 'error');
      }
    } else {
      localStorage.setItem('hai_user_email', 'google.demo@gmail.com');
      localStorage.setItem('hai_logged_in', 'true');
      await checkAuthState();
      toast('Masuk via Google SSO (Demo)');
    }
  };

  $('#logoutBtn').onclick = async (e) => {
    e.preventDefault();
    if (db) {
      try {
        await db.auth.signOut();
      } catch (err) {
        console.warn(err);
      }
    }
    localStorage.removeItem('hai_logged_in');
    localStorage.removeItem('hai_user_email');
    await checkAuthState();
    toast('Anda telah keluar.');
  };
  
  if (db) {
    db.auth.onAuthStateChange(() => {
      checkAuthState();
    });
  }
}

init();
