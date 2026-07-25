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
 ['Generator Disertasi','🎓','Susun ide, gap, POAC, teori, metode, dan novelty.','#7044f5'],
 ['Artikel Jurnal','📝','Buat struktur IMRAD dan naskah siap disempurnakan.','#12a95b'],
 ['Review Dokumen','🔎','Analisis kelemahan, kelebihan, dan revisi prioritas.','#7e45e7'],
 ['Administrasi Madrasah','🏛️','Surat, SK, LPJ, PROTA, PROMES, dan laporan.','#0aa99b'],
 ['Presentasi Otomatis','📊','Ubah ide menjadi outline slide dan catatan pembicara.','#ff8318'],
 ['Prompt Gambar & Video','🎬','Prompt visual, flyer, bumper, dan materi kreatif.','#ee4d8b']
];
const $ = s => document.querySelector(s);
const escapeHTML = text => text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

let db = null;
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
  if (!db) return;
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

async function renderStats() {
  const projs = await getProjects();
  const docs = await getDocs();
  const hist = await getHistory();
  
  const statsData = [
    ['📝', 'Draft Dokumen', docs.length.toString(), 'Lokal/Cloud', '#eff6ff'],
    ['🔍', 'Riset Web', hist.length.toString(), 'Operasional', '#f0fdf4'],
    ['📂', 'Proyek Aktif', projs.length.toString(), 'Aktif', '#fff7ed'],
    ['⚡', 'Kuota AI', '92%', 'Lancar', '#faf5ff']
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
  $('#features').innerHTML = features.map(([t,i,d,c])=>`<article class="feature" data-category="${t.includes('Disertasi')?'Disertasi':t.includes('Jurnal')?'Jurnal':t.includes('Review')?'Review Dokumen':t.includes('Administrasi')?'Administrasi':t.includes('Presentasi')?'Presentasi':'Prompt Gambar & Video'}"><span class="feature-icon" style="background:${c}">${i}</span><div><strong>${t}</strong><p>${d}</p></div></article>`).join('');
  $('#quickActions').innerHTML = [['📊','Ekspor Excel'],['W','Ekspor Word'],['PDF','Ekspor PDF']].map(([i,t])=>`<button class="quick-action" data-action="${t}"><span>${i}</span><small>${t}</small></button>`).join('');
  
  await syncLocalStorageToSupabase();
  
  await renderProjects(); await renderHistory(); await renderDocuments(); await renderStats(); bind(); initUpload();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}

function bind(){
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.onclick = () => switchToPage(tab.dataset.page);
  });
  document.querySelectorAll('.feature').forEach(c=>c.onclick=()=>selectCategory(c.dataset.category, true));
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
    if(db){
      try {
        const { error } = await db.from('history').delete().neq('id', 0);
        if(error) throw error;
      } catch(e) {
        toast('Gagal mengosongkan riwayat di Supabase: ' + e.message, 'error');
        return;
      }
    }
    localStorage.removeItem('hai_history');
    await renderHistory();
    await renderStats();
    toast('Semua riwayat berhasil dikosongkan.');
  };
  $('#clearDocsBtn').onclick=async()=>{
    if(db){
      try {
        const { error } = await db.from('documents').delete().neq('id', 0);
        if(error) throw error;
      } catch(e) {
        toast('Gagal mengosongkan dokumen di Supabase: ' + e.message, 'error');
        return;
      }
    }
    localStorage.removeItem('hai_docs');
    await renderDocuments();
    await renderStats();
    toast('Semua dokumen berhasil dikosongkan.');
  };
  $('#clearProjectsBtn').onclick=async()=>{
    if(db){
      try {
        const { error } = await db.from('projects').delete().neq('id', 0);
        if(error) throw error;
      } catch(e) {
        toast('Gagal mengosongkan proyek di Supabase: ' + e.message, 'error');
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
}

function selectCategory(name, autoGenerate = false){
  switchToPage('generator');
  $('#category').value=name;
  $('#prompt').value=examples[name]||'';
  if(autoGenerate)generate();
}

window.switchToPage = function(pageId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.dataset.page === pageId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.app-page').forEach(page => {
    page.style.display = page.id === `page-${pageId}` ? 'block' : 'none';
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
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
    
    const res=await fetch('api/generate.php',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:finalPrompt,category:$('#category').value,language:$('#language').value,tone:$('#tone').value})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'Layanan AI gagal.');
    showOutput(data.text);addHistory($('#category').value,prompt);addDocument($('#category').value);
  }catch(err){
    const demo=localDemo(prompt,$('#category').value);showOutput(demo);addHistory($('#category').value,prompt,'Demo');toast(`${err.message} Hasil contoh lokal ditampilkan. Pasang OPENAI_API_KEY agar AI aktif.`,'error');
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
function localDemo(prompt,category){return `MODE DEMO LOKAL — ${category}\n\nKebutuhan:\n${prompt}\n\nRancangan hasil:\n1. Tujuan dan konteks pekerjaan\n2. Struktur utama yang sistematis\n3. Data atau informasi yang perlu dilengkapi: [ISI DATA]\n4. Langkah pelaksanaan\n5. Indikator kualitas dan evaluasi\n6. Rekomendasi tindak lanjut\n\nCatatan: Ini adalah hasil demo agar aplikasi tetap dapat diuji tanpa API. Setelah OPENAI_API_KEY dipasang di hosting, tombol Generate akan menghasilkan jawaban AI sebenarnya.`}

async function getProjects(){
  if (db) {
    try {
      const { data, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {
      console.error("Gagal mengambil data proyek dari Supabase:", e);
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
  if (db) {
    try {
      const { error } = await db.from('projects').insert([newProj]);
      if (error) throw error;
      
      const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_projects', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menyimpan proyek ke Supabase: ' + e.message, 'error');
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
  if (db) {
    try {
      const { data, error } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {
      console.error("Gagal mengambil data riwayat dari Supabase:", e);
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
  if (db) {
    try {
      const { error } = await db.from('history').insert([newHist]);
      if (error) throw error;
      
      const { data } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_history', JSON.stringify(data.slice(0, 10)));
      }
    } catch (e) {
      console.error("Gagal menyimpan riwayat ke Supabase:", e);
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
  if (db) {
    try {
      const { data, error } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch (e) {
      console.error("Gagal mengambil data dokumen dari Supabase:", e);
    }
  }
  return JSON.parse(localStorage.getItem('hai_docs')||'[]');
}
async function addDocument(category){
  const newDoc = {
    name:`Hasil ${category} ${new Date().toLocaleDateString('id-ID')}.doc`,
    size:`${Math.floor(Math.random()*800+120)} KB`
  };
  if (db) {
    try {
      const { error } = await db.from('documents').insert([newDoc]);
      if (error) throw error;
      
      const { data } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_docs', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      console.error("Gagal menyimpan dokumen ke Supabase:", e);
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
  if (db) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('history').delete().in('id', ids);
        if (error) throw error;
      }
      const { data } = await db.from('history').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_history', JSON.stringify(data.slice(0, 10)));
      }
    } catch (e) {
      toast('Gagal menghapus riwayat dari Supabase: ' + e.message, 'error');
      return;
    }
  } else {
    let h = JSON.parse(localStorage.getItem('hai_history')||'[]');
    if (h.length === 0) {
      h = [
        {category:'Disertasi',prompt:'Analisis Bab I Disertasi',status:'Selesai',time:'10:32'},
        {category:'Jurnal',prompt:'Review Artikel Scopus',status:'Selesai',time:'09:15'},
        {category:'Administrasi',prompt:'Buat PROTA PROMES',status:'Selesai',time:'08:47'}
      ];
    }
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
  if (db) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('documents').delete().in('id', ids);
        if (error) throw error;
      }
      const { data } = await db.from('documents').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_docs', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menghapus dokumen dari Supabase: ' + e.message, 'error');
      return;
    }
  } else {
    let docs = JSON.parse(localStorage.getItem('hai_docs')||'[]');
    if (docs.length === 0) {
      docs = [
        {name:'Disertasi Bab I - Revisi.docx',size:'2.4 MB'},
        {name:'Artikel IMAD - Final.pdf',size:'1.8 MB'},
        {name:'PROTA PROMES 2025.xlsx',size:'980 KB'}
      ];
    }
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
  if (db) {
    try {
      const ids = Array.from(checkboxes).map(cb => cb.dataset.id).filter(id => id);
      if (ids.length > 0) {
        const { error } = await db.from('projects').delete().in('id', ids);
        if (error) throw error;
      }
      const { data } = await db.from('projects').select('*').order('created_at', { ascending: false });
      if (data) {
        localStorage.setItem('hai_projects', JSON.stringify(data.slice(0, 8)));
      }
    } catch (e) {
      toast('Gagal menghapus proyek dari Supabase: ' + e.message, 'error');
      return;
    }
  } else {
    let p = JSON.parse(localStorage.getItem('hai_projects')||'null') || [
      {name:'Disertasi MPI',category:'Disertasi',progress:65},
      {name:'Artikel IMAD',category:'Jurnal',progress:80},
      {name:'Administrasi FKDT',category:'Administrasi',progress:55},
      {name:'Materi Workshop',category:'Presentasi',progress:40}
    ];
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
  fileInput.accept = '.txt,.csv,.pdf,.docx,.xlsx';
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
            <small style="font-size: 0.72em; color: #64748b; text-transform: capitalize;">${ref.type === 'web' ? 'Situs Web' : ref.type === 'file' ? 'Berkas Dokumen' : 'Teks Manual'}</small>
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
      }
    } catch (e) {
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
