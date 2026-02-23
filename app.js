// ============================================================
//  UK VISA APPLICATION — app.js
//  Rewritten from scratch: simple, synchronous, reliable.
// ============================================================

// ── Optional cloud backup (Supabase) ─────────────────────────
// Core functionality works without it. It is only used to backup
// data silently in the background and never blocks the main UI.
const SB_URL = 'https://amjekzqtfsccshwwpibq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtamVrenF0ZnNjY3Nod3dwaWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYzODIsImV4cCI6MjA4NzQzMjM4Mn0.DfpBWyh0cWWHR5X5lovXLwynm5gbrFFfonteTZG5cl0';
let sb = null;
try {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    sb = window.supabase.createClient(SB_URL, SB_KEY);
  }
} catch (e) { console.warn('Supabase init failed:', e); }

// ── App ID ───────────────────────────────────────────────────
function makeUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
const appId = localStorage.getItem('visa_app_id') || makeUUID();
localStorage.setItem('visa_app_id', appId);
const appIdDisplay = document.getElementById('appIdDisplay');
if (appIdDisplay) appIdDisplay.textContent = appId;

// ── Accordion ────────────────────────────────────────────────
document.querySelectorAll('.section-header').forEach(hdr => {
  hdr.addEventListener('click', () => {
    const section = hdr.closest('.form-section');
    const body    = section && section.querySelector('.section-body');
    const chevron = hdr.querySelector('.chevron');
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';   // '' = fallback to CSS (display:block)
    if (chevron) chevron.textContent = isOpen ? '▶' : '▼';
  });
});

// ── Tab navigation ───────────────────────────────────────────
document.querySelectorAll('.tab-jump').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    // Expand the section if it was collapsed
    const body    = target.querySelector('.section-body');
    const chevron = target.querySelector('.chevron');
    if (body && body.style.display === 'none') {
      body.style.display = '';
      if (chevron) chevron.textContent = '▼';
    }
    // scroll-margin-top in CSS already accounts for the sticky header
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Auto-CAPS ────────────────────────────────────────────────
document.addEventListener('input', e => {
  if (e.target.classList.contains('uppercase')) {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(pos, pos);
  }
});

// ── Conditional radio-driven blocks ──────────────────────────
function setupToggle(radioName, blockId, showValue) {
  const block = document.getElementById(blockId);
  if (!block) return;
  function refresh() {
    const checked = document.querySelector(`input[name="${radioName}"]:checked`);
    block.style.display = (checked && checked.value === showValue) ? 'block' : 'none';
  }
  document.querySelectorAll(`input[name="${radioName}"]`).forEach(r => r.addEventListener('change', refresh));
  refresh();
}
setupToggle('other_passports_yn',       'otherPassportsDetails',      'Yes');
setupToggle('prev_country_passport_yn', 'prevCountryPassportDetails', 'Yes');
setupToggle('prev_addresses_yn',        'prevAddressesBlock',         'Yes');
setupToggle('corr_address_yn',          'corrAddressBlock',           'Yes');
setupToggle('children_yn',              'childrenBlock',              'Yes');
setupToggle('property_yn',              'propertyBlock',              'Yes');
setupToggle('other_income_yn',          'otherIncomeBlock',           'Yes');
setupToggle('ticket_booked_yn',         'ticketBlock',                'Yes');
setupToggle('accommodation_booked_yn',  'accommodationBookedBlock',   'Yes');
setupToggle('uk_family_yn',             'ukFamilyBlock',              'Yes');
setupToggle('uk_friends_yn',            'ukFriendsBlock',             'Yes');
setupToggle('uk_sponsor_yn',            'ukSponsorBlock',             'Yes');
setupToggle('prev_uk_visit_yn',         'prevUkVisitBlock',           'Yes');
setupToggle('other_visas_yn',           'otherVisasBlock',            'Yes');

// Spouse block
const maritalSel  = document.getElementById('marital_status');
const spouseBlock = document.getElementById('spouseBlock');
function refreshSpouse() {
  if (!maritalSel || !spouseBlock) return;
  const v = maritalSel.value;
  spouseBlock.style.display = (v === 'Married' || v === 'Civil partnership') ? 'block' : 'none';
}
if (maritalSel) maritalSel.addEventListener('change', refreshSpouse);

// Employment detail blocks
const empSel = document.getElementById('employment_status');
const empMap = { Employed: 'employedBlock', 'Self-employed': 'selfEmployedBlock', Retired: 'retiredBlock', Student: 'studentBlock' };
function refreshEmp() {
  Object.values(empMap).forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  if (empSel && empMap[empSel.value]) {
    const el = document.getElementById(empMap[empSel.value]);
    if (el) el.style.display = 'block';
  }
}
if (empSel) empSel.addEventListener('change', refreshEmp);

// ── Photo upload helpers ──────────────────────────────────────
const photoUrls = {};  // fieldName → data URL (in-memory only, not persisted)

// ALL photo labels: programmatically click the hidden file input.
// This is the most reliable cross-browser approach.
document.querySelectorAll('.photo-label[for]').forEach(label => {
  label.addEventListener('click', e => {
    e.preventDefault();
    const input = document.getElementById(label.getAttribute('for'));
    if (input) input.click();
  });
});

// Drag-and-drop
document.querySelectorAll('.photo-upload-area').forEach(area => {
  area.addEventListener('dragover',  e => { e.preventDefault(); area.classList.add('dragover'); });
  area.addEventListener('dragleave', ()  => area.classList.remove('dragover'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    const input = area.querySelector('.file-input');
    if (!input || !e.dataTransfer.files[0]) return;
    const dt = new DataTransfer();
    dt.items.add(e.dataTransfer.files[0]);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
});

function handlePhotoFile(input, preview, fieldName) {
  const file = input.files[0];
  if (!file || !preview) return;

  // Immediate visual feedback
  preview.innerHTML = '';
  const loading = document.createElement('span');
  loading.className = 'pdf-icon';
  loading.textContent = '⏳ ' + file.name;
  preview.appendChild(loading);

  const reader = new FileReader();
  reader.onload = ev => {
    const url = ev.target.result;
    if (fieldName) photoUrls[fieldName] = url;

    preview.innerHTML = '';

    if (file.type.startsWith('image/') && !file.type.includes('heic') && !file.type.includes('heif')) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      img.onerror = () => {
        preview.innerHTML = '';
        addFileIcon(preview, file.name);
        addRemoveBtn(preview, input, fieldName);
      };
      preview.appendChild(img);
    } else {
      addFileIcon(preview, file.name);
    }
    addRemoveBtn(preview, input, fieldName);
  };
  reader.onerror = () => {
    preview.innerHTML = '<span class="pdf-icon">❌ Ошибка чтения файла</span>';
  };
  reader.readAsDataURL(file);
}

function addFileIcon(preview, name) {
  const span = document.createElement('span');
  span.className = 'pdf-icon';
  span.textContent = '📄 ' + name;
  preview.appendChild(span);
}

function addRemoveBtn(preview, input, fieldName) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'remove-photo';
  btn.textContent = '✕ Удалить / Remove';
  btn.addEventListener('click', () => {
    input.value = '';
    preview.innerHTML = '';
    if (fieldName) delete photoUrls[fieldName];
  });
  preview.appendChild(btn);
}

function showStoredPhoto(preview, url, fieldName) {
  if (!preview || !url) return;
  photoUrls[fieldName] = url;
  preview.innerHTML = '';
  if (url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = fieldName;
    preview.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'pdf-icon';
    span.textContent = '📄 Файл загружен / File uploaded';
    preview.appendChild(span);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'remove-photo';
  btn.textContent = '✕ Удалить / Remove';
  btn.addEventListener('click', () => { preview.innerHTML = ''; delete photoUrls[fieldName]; });
  preview.appendChild(btn);
}

// Wire up static (non-child) photo inputs
[
  ['photo_own_passport',    'preview_own_passport',    'own_passport'],
  ['photo_father_passport', 'preview_father_passport', 'father_passport'],
  ['photo_mother_passport', 'preview_mother_passport', 'mother_passport'],
  ['photo_spouse_passport', 'preview_spouse_passport', 'spouse_passport'],
].forEach(([inputId, previewId, field]) => {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (input && preview) {
    input.addEventListener('change', () => handlePhotoFile(input, preview, field));
  }
});

// ── Dynamic children ─────────────────────────────────────────
let childCount = 0;
const childrenList  = document.getElementById('childrenList');
const childTemplate = document.getElementById('childTemplate');

const addChildBtn = document.getElementById('addChildBtn');
if (addChildBtn) addChildBtn.addEventListener('click', () => addChild());

function addChild(data) {
  if (!childTemplate || !childrenList) return;
  data = data || {};
  childCount++;
  const clone   = childTemplate.content.cloneNode(true);
  const entry   = clone.querySelector('.child-entry');
  const numSpan = clone.querySelector('.child-num');
  if (entry)   entry.dataset.childIdx = childCount;
  if (numSpan) numSpan.textContent    = childCount;

  // Give the photo input a unique id so its label works
  const fileInput  = clone.querySelector('.child-photo-input');
  const photoLabel = clone.querySelector('.photo-label');
  const photoId    = 'child_photo_' + childCount;
  if (fileInput) { fileInput.id = photoId; fileInput.name = photoId; }
  if (photoLabel) photoLabel.setAttribute('for', photoId);

  // Populate saved data
  ['child_name', 'child_dob', 'child_nationality', 'child_location'].forEach(n => {
    const key = n.replace('child_', '');
    const el  = clone.querySelector(`[name="${n}"]`);
    if (el && data[key]) el.value = data[key];
  });

  // Remove button
  const removeBtn = clone.querySelector('.remove-child-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', function () {
      this.closest('.child-entry').remove();
      renumberChildren();
    });
  }

  // Photo for this child
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const prev = this.closest('.photo-upload-area').querySelector('.child-photo-preview');
      handlePhotoFile(this, prev, null);
    });
  }
  if (photoLabel) {
    photoLabel.addEventListener('click', e => {
      e.preventDefault();
      const id = photoLabel.getAttribute('for');
      const inp = id ? document.getElementById(id) : null;
      if (inp) inp.click();
    });
  }

  childrenList.appendChild(clone);
}

function renumberChildren() {
  if (!childrenList) return;
  childrenList.querySelectorAll('.child-entry').forEach((el, i) => {
    const numSpan = el.querySelector('.child-num');
    if (numSpan) numSpan.textContent = i + 1;
    el.dataset.childIdx = i + 1;
  });
  childCount = childrenList.querySelectorAll('.child-entry').length;
}

// ── Collect form data ─────────────────────────────────────────
function collectFormData() {
  const d = {};

  // Text, date, email, tel, number, select, textarea
  document.querySelectorAll(
    '#visaForm input:not([type="file"]):not([type="radio"]), #visaForm select, #visaForm textarea'
  ).forEach(el => { if (el.name) d[el.name] = el.value; });

  // Radios — collect all names first, then get checked value
  const radioNames = new Set();
  document.querySelectorAll('#visaForm input[type="radio"]').forEach(r => radioNames.add(r.name));
  radioNames.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    d[name] = checked ? checked.value : '';
  });

  // Children
  d.children = [];
  if (childrenList) {
    childrenList.querySelectorAll('.child-entry').forEach(el => {
      d.children.push({
        name:        el.querySelector('[name="child_name"]')?.value        || '',
        dob:         el.querySelector('[name="child_dob"]')?.value          || '',
        nationality: el.querySelector('[name="child_nationality"]')?.value  || '',
        location:    el.querySelector('[name="child_location"]')?.value     || '',
      });
    });
  }

  return d;
}

// ── Populate form from saved data ─────────────────────────────
let isPopulating = false;

function populateForm(d) {
  if (!d) return;
  isPopulating = true;
  try {
    // Text/select/textarea
    Object.entries(d).forEach(([name, value]) => {
      if (typeof value !== 'string') return;
      const el = document.querySelector(`#visaForm [name="${name}"]`);
      if (el && el.type !== 'radio' && el.type !== 'file') el.value = value;
    });

    // Radios
    const seen = new Set();
    document.querySelectorAll('#visaForm input[type="radio"]').forEach(r => {
      if (seen.has(r.name)) return;
      if (!d[r.name]) return;
      const match = document.querySelector(`input[name="${r.name}"][value="${d[r.name]}"]`);
      if (match) {
        match.checked = true;
        match.dispatchEvent(new Event('change', { bubbles: true }));
      }
      seen.add(r.name);
    });

    // Re-trigger selects so conditional blocks show correctly
    if (empSel) empSel.dispatchEvent(new Event('change'));
    refreshSpouse();

    // Children
    if (Array.isArray(d.children) && d.children.length > 0) {
      if (childrenList) childrenList.innerHTML = '';
      childCount = 0;
      d.children.forEach(c => addChild(c));
      const yn = document.querySelector('input[name="children_yn"][value="Yes"]');
      if (yn) { yn.checked = true; }
      const block = document.getElementById('childrenBlock');
      if (block) block.style.display = 'block';
    }
  } finally {
    isPopulating = false;
  }
}

// ── Progress bar ──────────────────────────────────────────────
const REQUIRED = [
  'full_name', 'dob', 'place_of_birth', 'nationality', 'gender', 'marital_status',
  'passport_number', 'passport_issue_date', 'passport_expiry_date', 'passport_place_of_issue',
  'home_address', 'address_duration', 'mobile_phone', 'email',
  'father_name', 'father_dob', 'mother_name', 'mother_dob',
  'occupation', 'employment_status', 'trip_payer', 'savings',
  'arrival_date', 'departure_date', 'stay_duration', 'visit_purpose', 'accommodation',
];

function refreshProgress() {
  const d      = collectFormData();
  const filled = REQUIRED.filter(k => d[k] && String(d[k]).trim()).length;
  const pct    = Math.round(filled / REQUIRED.length * 100);

  const bar   = document.getElementById('progressBar');
  const label = document.getElementById('progressLabel');
  if (bar)   bar.style.width      = pct + '%';
  if (label) label.textContent    = pct + '% заполнено / completed';

  // Colour completed nav tabs
  const sectionReqs = [
    ['full_name','dob','place_of_birth','nationality','gender','marital_status'],
    ['passport_number','passport_issue_date','passport_expiry_date','passport_place_of_issue'],
    ['home_address','address_duration','mobile_phone','email'],
    ['father_name','father_dob','mother_name','mother_dob'],
    ['occupation','employment_status','trip_payer','savings'],
    ['arrival_date','departure_date','stay_duration','visit_purpose','accommodation'],
    [],
  ];
  document.querySelectorAll('.tab-jump').forEach((btn, i) => {
    const reqs = sectionReqs[i] || [];
    btn.classList.toggle('done', reqs.length > 0 && reqs.every(k => d[k] && String(d[k]).trim()));
  });

  // Show submit button only when all required fields are filled
  const allDone = pct === 100;
  const btnTop = document.getElementById('btnSubmit');
  const btnBot = document.getElementById('finalSubmitWrap');
  if (btnTop) btnTop.style.display = allDone ? 'inline-flex' : 'none';
  if (btnBot) btnBot.style.display = allDone ? 'block'      : 'none';
}

// ── Save status ───────────────────────────────────────────────
function setStatus(msg, cls) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'save-status-inline' + (cls ? ' ' + cls : '');
}

// ── Persist to localStorage ───────────────────────────────────
// We never store base64 photo data — they can easily exceed the 5 MB
// localStorage quota and silently kill all saves.
function hasContent(d) {
  if (!d) return false;
  return Object.values(d).some(v =>
    Array.isArray(v) ? v.length > 0 : (typeof v === 'string' && v.trim().length > 0)
  );
}

function saveNow() {
  if (isPopulating) return;  // never save while populating from storage
  try {
    const d = collectFormData();
    // Don't create a new empty localStorage entry (e.g. beforeunload on a blank page)
    const existing = localStorage.getItem('visa_draft_' + appId);
    if (!hasContent(d) && !existing) return;
    localStorage.setItem('visa_draft_' + appId, JSON.stringify(d));
    setStatus('Сохранено ✓', 'saved');
    refreshProgress();
  } catch (e) {
    console.error('Save failed:', e);
    setStatus('Ошибка сохранения', 'error');
  }
}

// Debounced cloud backup (fire-and-forget, never blocks UI)
let cloudTimer = null;
function scheduleCloudSync() {
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(async () => {
    if (!sb) return;
    try {
      const d = collectFormData();
      await sb.from('visa_applications').upsert({
        id: appId, data: d, updated_at: new Date().toISOString(),
      });
    } catch (e) { console.warn('Cloud sync failed:', e); }
  }, 2000);
}

// ── Auto-save on any input/change ─────────────────────────────
document.getElementById('visaForm').addEventListener('input',  () => { saveNow(); scheduleCloudSync(); });
document.getElementById('visaForm').addEventListener('change', () => { saveNow(); scheduleCloudSync(); });
// Final save when page closes
window.addEventListener('beforeunload', () => { if (!isPopulating) saveNow(); });

// ── Load saved data ───────────────────────────────────────────
function loadDraft() {
  // 1. localStorage — synchronous, instant, always up-to-date on this device
  const raw = localStorage.getItem('visa_draft_' + appId);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      if (d && hasContent(d)) {
        populateForm(d);
        setStatus('Данные загружены ✓', 'saved');
        refreshProgress();
        return; // done — no need for Supabase
      }
    } catch (e) { console.error('Load from localStorage failed:', e); }
  }

  // 2. No local data? Try Supabase (e.g. first time on a new device)
  if (!sb) return;
  sb.from('visa_applications')
    .select('data')
    .eq('id', appId)
    .maybeSingle()
    .then(({ data, error }) => {
      if (error || !data || !data.data || !hasContent(data.data)) return;
      populateForm(data.data);
      setStatus('Данные загружены из облака ✓', 'saved');
      refreshProgress();
      // Cache locally so next load is instant
      try { localStorage.setItem('visa_draft_' + appId, JSON.stringify(data.data)); } catch(e) {}
    })
    .catch(e => console.warn('Supabase load failed:', e));
}

// ── Validation & submit ───────────────────────────────────────
function submitApplication() {
  // Clear previous highlights
  document.querySelectorAll('#visaForm .invalid').forEach(el => el.classList.remove('invalid'));

  let firstInvalid = null;
  REQUIRED.forEach(name => {
    const el = document.querySelector(`#visaForm [name="${name}"]`);
    if (el && !String(el.value).trim()) {
      el.classList.add('invalid');
      if (!firstInvalid) firstInvalid = el;
    }
  });

  if (firstInvalid) {
    // Open the section containing the first invalid field
    const section = firstInvalid.closest('.form-section');
    if (section) {
      const body = section.querySelector('.section-body');
      if (body && body.style.display === 'none') body.style.display = '';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => firstInvalid.focus(), 400);
    alert('Заполните все обязательные поля (*).\nFill in all required fields (*).');
    return;
  }

  if (!confirm('Подать заявку?\nSubmit application?')) return;

  saveNow();
  const badge = document.getElementById('statusBadge');
  if (badge) { badge.textContent = '✅ Подано / Submitted'; badge.classList.add('submitted'); }
  alert('✅ Заявка подана!\nApplication submitted!\n\nID: ' + appId);
}

const btnTop = document.getElementById('btnSubmit');
const btnBot = document.getElementById('btnSubmitBottom');
if (btnTop) btnTop.addEventListener('click', submitApplication);
if (btnBot) btnBot.addEventListener('click', submitApplication);

// ── Active tab highlight while scrolling ─────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.tab-jump').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === entry.target.id);
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.form-section[id]').forEach(el => observer.observe(el));

// ── Boot ──────────────────────────────────────────────────────
refreshProgress();
loadDraft();
