// ============================================================
//  UK VISA APPLICATION — app.js
// ============================================================

const SUPABASE_URL  = 'https://amjekzqtfsccshwwpibq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtamVrenF0ZnNjY3Nod3dwaWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYzODIsImV4cCI6MjA4NzQzMjM4Mn0.DfpBWyh0cWWHR5X5lovXLwynm5gbrFFfonteTZG5cl0';

// ============================================================
//  Supabase init
// ============================================================
const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY';
let supabase = null;

if (isConfigured) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
} else {
  const w = document.getElementById('configWarning');
  if (w) w.style.display = 'block';
}

// ============================================================
//  App ID
// ============================================================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let appId = localStorage.getItem('visa_app_id') || generateUUID();
localStorage.setItem('visa_app_id', appId);
document.getElementById('appIdDisplay').textContent = appId;

// ============================================================
//  Accordion sections — all visible, click header to collapse
// ============================================================
document.querySelectorAll('.section-header').forEach(header => {
  header.addEventListener('click', () => {
    const sec = header.closest('.form-section');
    const body = sec.querySelector('.section-body');
    const chevron = header.querySelector('.chevron');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    chevron.textContent = isOpen ? '▶' : '▼';
  });
});

// Quick-jump buttons scroll to section and open it
document.querySelectorAll('.tab-jump').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const body = target.querySelector('.section-body');
    const chevron = target.querySelector('.chevron');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      chevron.textContent = '▼';
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============================================================
//  Auto CAPS on input for .uppercase fields
// ============================================================
document.addEventListener('input', e => {
  if (e.target.classList.contains('uppercase')) {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(pos, pos);
  }
});

// ============================================================
//  Conditional toggles
// ============================================================
function setupToggle(radioName, targetId, showValue) {
  const radios = document.querySelectorAll(`input[name="${radioName}"]`);
  const target = document.getElementById(targetId);
  if (!target) return;
  function update() {
    const checked = document.querySelector(`input[name="${radioName}"]:checked`);
    target.style.display = (checked && checked.value === showValue) ? 'block' : 'none';
  }
  radios.forEach(r => r.addEventListener('change', update));
  update();
}

// Passport
setupToggle('other_passports_yn',      'otherPassportsDetails',       'Yes');
setupToggle('prev_country_passport_yn', 'prevCountryPassportDetails', 'Yes');
// Contact
setupToggle('prev_addresses_yn',   'prevAddressesBlock', 'Yes');
setupToggle('corr_address_yn',     'corrAddressBlock',   'Yes');
// Family
setupToggle('children_yn', 'childrenBlock', 'Yes');
// Finance
setupToggle('property_yn',    'propertyBlock',    'Yes');
setupToggle('other_income_yn','otherIncomeBlock',  'Yes');
// Travel
setupToggle('ticket_booked_yn',       'ticketBlock',             'Yes');
setupToggle('accommodation_booked_yn','accommodationBookedBlock', 'Yes');
// UK connections
setupToggle('uk_family_yn',  'ukFamilyBlock',   'Yes');
setupToggle('uk_friends_yn', 'ukFriendsBlock',  'Yes');
setupToggle('uk_sponsor_yn', 'ukSponsorBlock',  'Yes');
// Travel history
setupToggle('prev_uk_visit_yn','prevUkVisitBlock', 'Yes');
setupToggle('other_visas_yn', 'otherVisasBlock',  'Yes');

// Spouse block — depends on marital_status select
const maritalSel  = document.getElementById('marital_status');
const spouseBlock = document.getElementById('spouseBlock');
function updateSpouse() {
  const v = maritalSel ? maritalSel.value : '';
  spouseBlock.style.display = (v === 'Married' || v === 'Civil partnership') ? 'block' : 'none';
}
if (maritalSel) maritalSel.addEventListener('change', updateSpouse);

// Employment blocks
const empStatusSel = document.getElementById('employment_status');
const empMap = {
  'Employed':      'employedBlock',
  'Self-employed': 'selfEmployedBlock',
  'Retired':       'retiredBlock',
  'Student':       'studentBlock',
};
function updateEmpBlocks() {
  Object.values(empMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const blockId = empMap[empStatusSel ? empStatusSel.value : ''];
  if (blockId) {
    const el = document.getElementById(blockId);
    if (el) el.style.display = 'block';
  }
}
if (empStatusSel) empStatusSel.addEventListener('change', updateEmpBlocks);

// ============================================================
//  Dynamic children
// ============================================================
let childCount = 0;
const childrenList  = document.getElementById('childrenList');
const addChildBtn   = document.getElementById('addChildBtn');
const childTemplate = document.getElementById('childTemplate');

if (addChildBtn) addChildBtn.addEventListener('click', () => addChild());

function addChild(data = {}) {
  childCount++;
  const clone = childTemplate.content.cloneNode(true);
  const entry = clone.querySelector('.child-entry');
  entry.dataset.childIdx = childCount;
  clone.querySelector('.child-num').textContent = childCount;

  const photoInput = clone.querySelector('.child-photo-input');
  const photoLabel = clone.querySelector('.photo-label');
  const photoId = `photo_child_${childCount}_passport`;
  photoInput.id   = photoId;
  photoInput.name = photoId;
  if (photoLabel) photoLabel.setAttribute('for', photoId);

  if (data.name)        clone.querySelector('[name="child_name"]').value        = data.name;
  if (data.dob)         clone.querySelector('[name="child_dob"]').value          = data.dob;
  if (data.nationality) clone.querySelector('[name="child_nationality"]').value  = data.nationality;
  if (data.location)    clone.querySelector('[name="child_location"]').value     = data.location;

  clone.querySelector('.remove-child-btn').addEventListener('click', function () {
    this.closest('.child-entry').remove();
    renumberChildren();
  });

  photoInput.addEventListener('change', function () {
    const preview = this.closest('.photo-upload-area').querySelector('.child-photo-preview');
    handlePhotoPreview(this, preview, `child_${entry.dataset.childIdx}_passport`);
  });

  childrenList.appendChild(clone);
}

function renumberChildren() {
  childrenList.querySelectorAll('.child-entry').forEach((e, i) => {
    e.querySelector('.child-num').textContent = i + 1;
    e.dataset.childIdx = i + 1;
  });
  childCount = childrenList.querySelectorAll('.child-entry').length;
}

// ============================================================
//  Photo uploads
// ============================================================
const photoUrls = {};

function setupPhotoInput(inputId, previewId, fieldName) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  input.addEventListener('change', () => handlePhotoPreview(input, preview, fieldName));
}

function handlePhotoPreview(input, preview, fieldName) {
  const file = input.files[0];
  if (!file) return;
  preview.innerHTML = '';

  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = fieldName;
      preview.appendChild(img);
      preview.appendChild(makeRemoveBtn(input, preview, fieldName));
    };
    reader.readAsDataURL(file);
  } else {
    const span = document.createElement('span');
    span.className = 'pdf-icon';
    span.textContent = '📄 ' + file.name;
    preview.appendChild(span);
    preview.appendChild(makeRemoveBtn(input, preview, fieldName));
  }

  if (isConfigured) {
    uploadPhoto(file, fieldName);
  } else {
    const reader = new FileReader();
    reader.onload = e => { photoUrls[fieldName] = e.target.result; };
    reader.readAsDataURL(file);
  }
}

function makeRemoveBtn(input, preview, fieldName) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'remove-photo';
  btn.textContent = '✕ Удалить / Remove';
  btn.addEventListener('click', () => {
    input.value = '';
    preview.innerHTML = '';
    delete photoUrls[fieldName];
  });
  return btn;
}

async function uploadPhoto(file, fieldName) {
  if (!supabase) return;
  setSaveStatus('Загрузка фото...', 'saving');
  try {
    const ext  = file.name.split('.').pop();
    const path = `${appId}/${fieldName}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('passport-photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('passport-photos').getPublicUrl(path);
    photoUrls[fieldName] = urlData.publicUrl;
    setSaveStatus('Фото загружено ✓', 'saved');
  } catch (err) {
    console.error('Photo upload error:', err);
    setSaveStatus('Ошибка загрузки фото', 'error');
  }
}

setupPhotoInput('photo_own_passport',    'preview_own_passport',    'own_passport');
setupPhotoInput('photo_father_passport', 'preview_father_passport', 'father_passport');
setupPhotoInput('photo_mother_passport', 'preview_mother_passport', 'mother_passport');
setupPhotoInput('photo_spouse_passport', 'preview_spouse_passport', 'spouse_passport');

// Drag-and-drop
document.querySelectorAll('.photo-upload-area').forEach(area => {
  area.addEventListener('dragover',  e => { e.preventDefault(); area.classList.add('dragover'); });
  area.addEventListener('dragleave', ()  => area.classList.remove('dragover'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = area.querySelector('.file-input');
    if (!input) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
});

// ============================================================
//  Collect / populate form data
// ============================================================
function collectFormData() {
  const data = {};

  // Text / select / textarea (skip file + radio)
  document.querySelectorAll(
    '#visaForm input:not([type="file"]):not([type="radio"]), #visaForm select, #visaForm textarea'
  ).forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  // Radios
  const radioNames = new Set();
  document.querySelectorAll('#visaForm input[type="radio"]').forEach(r => radioNames.add(r.name));
  radioNames.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    data[name] = checked ? checked.value : '';
  });

  // Children
  const children = [];
  document.querySelectorAll('#childrenList .child-entry').forEach((entry, idx) => {
    children.push({
      name:        entry.querySelector('[name="child_name"]')?.value        || '',
      dob:         entry.querySelector('[name="child_dob"]')?.value          || '',
      nationality: entry.querySelector('[name="child_nationality"]')?.value  || '',
      location:    entry.querySelector('[name="child_location"]')?.value     || '',
      photo_url:   photoUrls[`child_${idx + 1}_passport`] || '',
    });
  });
  data.children = children;

  // Photo URLs
  data.photo_own_passport_url    = photoUrls['own_passport']    || '';
  data.photo_father_passport_url = photoUrls['father_passport'] || '';
  data.photo_mother_passport_url = photoUrls['mother_passport'] || '';
  data.photo_spouse_passport_url = photoUrls['spouse_passport'] || '';

  return data;
}

function populateForm(data) {
  if (!data) return;

  // Text / select / textarea
  Object.entries(data).forEach(([name, value]) => {
    if (typeof value !== 'string') return;
    const el = document.querySelector(`#visaForm [name="${name}"]`);
    if (el && el.type !== 'radio' && el.type !== 'file') {
      el.value = value;
    }
  });

  // Radios
  const radioNames = new Set();
  document.querySelectorAll('#visaForm input[type="radio"]').forEach(r => radioNames.add(r.name));
  radioNames.forEach(name => {
    if (!data[name]) return;
    const radio = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Re-trigger selects for conditional blocks
  if (empStatusSel) empStatusSel.dispatchEvent(new Event('change'));
  updateSpouse();

  // Children
  if (Array.isArray(data.children) && data.children.length > 0) {
    childrenList.innerHTML = '';
    childCount = 0;
    data.children.forEach(c => addChild(c));
    const yn = document.querySelector('input[name="children_yn"][value="Yes"]');
    if (yn) { yn.checked = true; document.getElementById('childrenBlock').style.display = 'block'; }
  }

  // Photos
  [
    { key: 'photo_own_passport_url',    previewId: 'preview_own_passport',    field: 'own_passport' },
    { key: 'photo_father_passport_url', previewId: 'preview_father_passport', field: 'father_passport' },
    { key: 'photo_mother_passport_url', previewId: 'preview_mother_passport', field: 'mother_passport' },
    { key: 'photo_spouse_passport_url', previewId: 'preview_spouse_passport', field: 'spouse_passport' },
  ].forEach(({ key, previewId, field }) => {
    const url = data[key];
    if (!url) return;
    photoUrls[field] = url;
    const preview = document.getElementById(previewId);
    if (preview) showSavedPhoto(preview, url, field);
  });
}

function showSavedPhoto(preview, url, fieldName) {
  preview.innerHTML = '';
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) || url.startsWith('data:image')) {
    const img = document.createElement('img');
    img.src = url; img.alt = fieldName;
    preview.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'pdf-icon';
    span.textContent = '📄 Файл загружен / File uploaded';
    preview.appendChild(span);
  }
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'remove-photo';
  btn.textContent = '✕ Удалить / Remove';
  btn.addEventListener('click', () => { preview.innerHTML = ''; delete photoUrls[fieldName]; });
  preview.appendChild(btn);
}

// ============================================================
//  Progress bar
// ============================================================
const REQUIRED = [
  'full_name','dob','place_of_birth','nationality','gender','marital_status',
  'passport_number','passport_issue_date','passport_expiry_date','passport_place_of_issue',
  'home_address','address_duration','mobile_phone','email',
  'father_name','father_dob','mother_name','mother_dob',
  'occupation','employment_status','trip_payer','savings',
  'arrival_date','departure_date','stay_duration','visit_purpose','accommodation',
];

function updateProgress() {
  const data = collectFormData();
  const filled = REQUIRED.filter(f => data[f] && String(data[f]).trim()).length;
  const pct = Math.round((filled / REQUIRED.length) * 100);
  document.getElementById('progressBar').style.width  = pct + '%';
  document.getElementById('progressLabel').textContent = `${pct}% заполнено / completed`;

  // Mark tab-jump buttons
  const sectionReqs = [
    ['full_name','dob','place_of_birth','nationality','gender','marital_status'],
    ['passport_number','passport_issue_date','passport_expiry_date','passport_place_of_issue'],
    ['home_address','address_duration','mobile_phone','email'],
    ['father_name','father_dob','mother_name','mother_dob'],
    ['occupation','employment_status','trip_payer','savings'],
    ['arrival_date','departure_date','stay_duration','visit_purpose','accommodation'],
    [],
  ];
  document.querySelectorAll('.tab-jump').forEach((btn, idx) => {
    const reqs = sectionReqs[idx] || [];
    const done = reqs.length > 0 && reqs.every(f => data[f] && String(data[f]).trim());
    btn.classList.toggle('done', done);
  });
}

// ============================================================
//  Save / Load
// ============================================================
let saveTimer = null;

function setSaveStatus(msg, state) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'save-status-inline ' + (state || '');
}

function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(false), 600);
}

async function saveDraft(submitFlag = false) {
  const formData = collectFormData();
  setSaveStatus('Сохранение... / Saving...', 'saving');

  // Always save to localStorage
  localStorage.setItem('visa_draft_' + appId, JSON.stringify({ formData, submitted: submitFlag }));

  if (!isConfigured) {
    setSaveStatus('Сохранено локально ✓', 'saved');
    updateProgress();
    return;
  }

  try {
    const { data: existing } = await supabase
      .from('visa_applications').select('id').eq('id', appId).maybeSingle();

    if (existing) {
      await supabase.from('visa_applications').update({
        data: formData, submitted: submitFlag, updated_at: new Date().toISOString(),
      }).eq('id', appId);
    } else {
      await supabase.from('visa_applications').insert({ id: appId, data: formData, submitted: submitFlag });
    }
    setSaveStatus('Сохранено в облаке ✓ / Saved', 'saved');
    updateProgress();
  } catch (err) {
    console.error('Save error:', err);
    setSaveStatus('Ошибка сохранения / Save error', 'error');
  }
}

async function loadDraft() {
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('visa_applications').select('data, submitted').eq('id', appId).maybeSingle();
      if (!error && data) {
        populateForm(data.data);
        setSubmittedBadge(data.submitted);
        setSaveStatus('Данные загружены ✓', 'saved');
        updateProgress();
        return;
      }
    } catch (e) { /* fall through */ }
  }

  const raw = localStorage.getItem('visa_draft_' + appId);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      populateForm(saved.formData);
      setSubmittedBadge(saved.submitted);
      setSaveStatus('Загружено локально ✓', 'saved');
      updateProgress();
    } catch (e) { console.error('Load error:', e); }
  }
}

function setSubmittedBadge(submitted) {
  const badge = document.getElementById('statusBadge');
  if (!badge) return;
  if (submitted) {
    badge.textContent = '✅ Подано / Submitted';
    badge.classList.add('submitted');
  } else {
    badge.textContent = 'Черновик / Draft';
    badge.classList.remove('submitted');
  }
}

// ============================================================
//  Validation & Submit
// ============================================================
function validateRequiredFields() {
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  let valid = true;

  REQUIRED.forEach(name => {
    const el = document.querySelector(`#visaForm [name="${name}"]`);
    if (el && !String(el.value).trim()) {
      el.classList.add('invalid');
      valid = false;
    }
  });

  if (!valid) {
    const first = document.querySelector('#visaForm .invalid');
    if (first) {
      // Open section and scroll to it
      const sec = first.closest('.form-section');
      if (sec) {
        const body = sec.querySelector('.section-body');
        const chevron = sec.querySelector('.chevron');
        if (body) { body.style.display = 'block'; chevron.textContent = '▼'; }
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setTimeout(() => first.focus(), 400);
    }
    alert('Пожалуйста, заполните все обязательные поля (*).\nPlease fill in all required fields (*).');
  }
  return valid;
}

async function submitApplication() {
  if (!validateRequiredFields()) return;
  const ok = confirm(
    'Подать заявку? / Submit application?\n\n' +
    'Вы сможете редактировать данные после подачи.\n' +
    'You can still edit data after submission.'
  );
  if (!ok) return;
  await saveDraft(true);
  setSubmittedBadge(true);
  alert(
    '✅ Заявка подана! / Application submitted!\n\n' +
    'ID: ' + appId + '\n\n' +
    'Вы можете вернуться и отредактировать данные в любое время.\n' +
    'You can return and edit your data at any time.'
  );
}

// ============================================================
//  Event listeners
// ============================================================
// Autosave on every keystroke / change
document.getElementById('visaForm').addEventListener('input',  () => { debouncedSave(); updateProgress(); });
document.getElementById('visaForm').addEventListener('change', () => { debouncedSave(); updateProgress(); });

document.getElementById('btnSaveDraft').addEventListener('click',    () => saveDraft(false));
document.getElementById('btnSubmit').addEventListener('click',       submitApplication);
document.getElementById('btnSubmitBottom').addEventListener('click', submitApplication);

// ============================================================
//  Active tab highlight on scroll (IntersectionObserver)
// ============================================================
const sectionEls = ['sec0','sec1','sec2','sec3','sec4','sec5','sec6']
  .map(id => document.getElementById(id)).filter(Boolean);

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.tab-jump').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === id);
      });
    }
  });
}, { threshold: 0.25 });

sectionEls.forEach(el => observer.observe(el));

// ============================================================
//  Boot
// ============================================================
updateProgress();
loadDraft();
