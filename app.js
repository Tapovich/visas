// ============================================================
//  UK VISA APPLICATION — app.js
//  Configure the two lines below, then deploy to Netlify.
// ============================================================

const SUPABASE_URL  = 'https://amjekzqtfsccshwwpibq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtamVrenF0ZnNjY3Nod3dwaWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYzODIsImV4cCI6MjA4NzQzMjM4Mn0.DfpBWyh0cWWHR5X5lovXLwynm5gbrFFfonteTZG5cl0';

// ============================================================
//  Init Supabase (only when real keys are provided)
// ============================================================
let supabase = null;
const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY';

if (isConfigured) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
} else {
  document.getElementById('configWarning').style.display = 'block';
}

// ============================================================
//  Application ID — persisted in localStorage
// ============================================================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let appId = localStorage.getItem('visa_app_id');
if (!appId) {
  appId = generateUUID();
  localStorage.setItem('visa_app_id', appId);
}
document.getElementById('appIdDisplay').textContent = appId;

// ============================================================
//  Section navigation
// ============================================================
let currentSection = 0;
const tabs    = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.form-section');

function showSection(idx) {
  sections.forEach(s => s.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));
  sections[idx].classList.add('active');
  tabs[idx].classList.add('active');
  currentSection = idx;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateProgress();
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => showSection(+tab.dataset.section));
});

document.querySelectorAll('.next-btn').forEach(btn => {
  btn.addEventListener('click', () => showSection(+btn.dataset.next));
});
document.querySelectorAll('.prev-btn').forEach(btn => {
  btn.addEventListener('click', () => showSection(+btn.dataset.prev));
});

// ============================================================
//  Conditional field toggles
// ============================================================
function setupToggle(radioName, targetId, showValue) {
  const radios = document.querySelectorAll(`input[name="${radioName}"]`);
  const target = document.getElementById(targetId);
  if (!target) return;
  function update() {
    const val = document.querySelector(`input[name="${radioName}"]:checked`)?.value;
    target.style.display = val === showValue ? 'block' : 'none';
  }
  radios.forEach(r => r.addEventListener('change', update));
  update();
}

function setupSelectToggle(selectId, targetId, showValue) {
  const sel = document.getElementById(selectId);
  const target = document.getElementById(targetId);
  if (!sel || !target) return;
  function update() {
    target.style.display = showValue.includes(sel.value) ? 'block' : 'none';
  }
  sel.addEventListener('change', update);
  update();
}

// Passport section
setupToggle('other_passports_yn', 'otherPassportsDetails', 'Yes');
setupToggle('prev_country_passport_yn', 'prevCountryPassportDetails', 'Yes');

// Contact section
setupToggle('prev_addresses_yn', 'prevAddressesBlock', 'Yes');
setupToggle('corr_address_yn', 'corrAddressBlock', 'Yes');

// Family section — spouse shown when married/civil partnership
const maritalSel = document.getElementById('marital_status');
const spouseBlock = document.getElementById('spouseBlock');
maritalSel.addEventListener('change', () => {
  const v = maritalSel.value;
  spouseBlock.style.display = (v === 'Married' || v === 'Civil partnership') ? 'block' : 'none';
});

// Children
setupToggle('children_yn', 'childrenBlock', 'Yes');

// Employment conditional blocks
const empStatusSel = document.getElementById('employment_status');
const empBlocks = {
  'Employed':       'employedBlock',
  'Self-employed':  'selfEmployedBlock',
  'Retired':        'retiredBlock',
  'Student':        'studentBlock',
};
empStatusSel.addEventListener('change', () => {
  Object.values(empBlocks).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const blockId = empBlocks[empStatusSel.value];
  if (blockId) {
    const el = document.getElementById(blockId);
    if (el) el.style.display = 'block';
  }
});

// Financial
setupToggle('property_yn', 'propertyBlock', 'Yes');
setupToggle('other_income_yn', 'otherIncomeBlock', 'Yes');

// Travel
setupToggle('ticket_booked_yn', 'ticketBlock', 'Yes');
setupToggle('accommodation_booked_yn', 'accommodationBookedBlock', 'Yes');

// UK Connections
setupToggle('uk_family_yn', 'ukFamilyBlock', 'Yes');
setupToggle('uk_friends_yn', 'ukFriendsBlock', 'Yes');
setupToggle('uk_sponsor_yn', 'ukSponsorBlock', 'Yes');

// Travel history
setupToggle('prev_uk_visit_yn', 'prevUkVisitBlock', 'Yes');
setupToggle('other_visas_yn', 'otherVisasBlock', 'Yes');

// ============================================================
//  Dynamic children
// ============================================================
let childCount = 0;
const childrenList = document.getElementById('childrenList');
const addChildBtn  = document.getElementById('addChildBtn');
const childTemplate = document.getElementById('childTemplate');

addChildBtn.addEventListener('click', addChild);

function addChild(data = {}) {
  childCount++;
  const clone = childTemplate.content.cloneNode(true);
  const entry = clone.querySelector('.child-entry');
  entry.dataset.childIdx = childCount;

  clone.querySelector('.child-num').textContent = childCount;

  // Set unique IDs / names for photo input
  const photoInput = clone.querySelector('.child-photo-input');
  const photoLabel = clone.querySelector('.photo-label');
  const photoId = `photo_child_${childCount}_passport`;
  photoInput.id = photoId;
  photoInput.name = photoId;
  photoLabel.setAttribute('for', photoId);

  // Restore data if provided
  if (data.name)        clone.querySelector('[name="child_name"]').value        = data.name;
  if (data.dob)         clone.querySelector('[name="child_dob"]').value          = data.dob;
  if (data.nationality) clone.querySelector('[name="child_nationality"]').value  = data.nationality;
  if (data.location)    clone.querySelector('[name="child_location"]').value     = data.location;

  // Remove button
  clone.querySelector('.remove-child-btn').addEventListener('click', function () {
    this.closest('.child-entry').remove();
    renumberChildren();
  });

  // Photo preview for child
  photoInput.addEventListener('change', function () {
    const preview = this.closest('.photo-upload-area').querySelector('.child-photo-preview');
    handlePhotoPreview(this, preview, `child_${entry.dataset.childIdx}_passport`);
  });

  childrenList.appendChild(clone);
}

function renumberChildren() {
  const entries = childrenList.querySelectorAll('.child-entry');
  entries.forEach((e, i) => {
    e.querySelector('.child-num').textContent = i + 1;
    e.dataset.childIdx = i + 1;
  });
  childCount = entries.length;
}

// ============================================================
//  Photo upload handling
// ============================================================
// Map: field name -> uploaded Supabase URL (or local data URL for offline)
const photoUrls = {};

function setupPhotoInput(inputId, previewId, fieldName) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input) return;
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
      const removeBtn = createRemoveBtn(input, preview, fieldName);
      preview.appendChild(img);
      preview.appendChild(removeBtn);
    };
    reader.readAsDataURL(file);
  } else {
    // PDF
    const span = document.createElement('span');
    span.className = 'pdf-icon';
    span.textContent = '📄 ' + file.name;
    const removeBtn = createRemoveBtn(input, preview, fieldName);
    preview.appendChild(span);
    preview.appendChild(removeBtn);
  }

  // Upload to Supabase if configured
  if (isConfigured) {
    uploadPhoto(file, fieldName);
  } else {
    // Store locally as data URL for offline
    const reader = new FileReader();
    reader.onload = e => { photoUrls[fieldName] = e.target.result; };
    reader.readAsDataURL(file);
  }
}

function createRemoveBtn(input, preview, fieldName) {
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
    const ext = file.name.split('.').pop();
    const path = `${appId}/${fieldName}_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('passport-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('passport-photos').getPublicUrl(path);
    photoUrls[fieldName] = urlData.publicUrl;
    setSaveStatus('Фото загружено ✓', 'saved');
  } catch (err) {
    console.error('Photo upload error:', err);
    setSaveStatus('Ошибка загрузки фото / Photo upload error', 'error');
  }
}

// Setup photo inputs for fixed fields
setupPhotoInput('photo_own_passport',     'preview_own_passport',    'own_passport');
setupPhotoInput('photo_father_passport',  'preview_father_passport', 'father_passport');
setupPhotoInput('photo_mother_passport',  'preview_mother_passport', 'mother_passport');
setupPhotoInput('photo_spouse_passport',  'preview_spouse_passport', 'spouse_passport');

// ============================================================
//  Collect form data into one flat object
// ============================================================
function collectFormData() {
  const data = {};

  // All named inputs/selects/textareas (skip file inputs and radio — handle separately)
  document.querySelectorAll('#visaForm input:not([type="file"]):not([type="radio"]), #visaForm select, #visaForm textarea').forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  // Radios — take checked value
  const radioNames = new Set();
  document.querySelectorAll('#visaForm input[type="radio"]').forEach(r => radioNames.add(r.name));
  radioNames.forEach(name => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    data[name] = checked ? checked.value : '';
  });

  // Children dynamic list
  const children = [];
  document.querySelectorAll('#childrenList .child-entry').forEach((entry, idx) => {
    children.push({
      name:        entry.querySelector('[name="child_name"]').value,
      dob:         entry.querySelector('[name="child_dob"]').value,
      nationality: entry.querySelector('[name="child_nationality"]').value,
      location:    entry.querySelector('[name="child_location"]').value,
      photo_url:   photoUrls[`child_${idx + 1}_passport`] || '',
    });
  });
  data.children = children;

  // Photo URLs
  Object.assign(data, {
    photo_own_passport_url:    photoUrls['own_passport']    || '',
    photo_father_passport_url: photoUrls['father_passport'] || '',
    photo_mother_passport_url: photoUrls['mother_passport'] || '',
    photo_spouse_passport_url: photoUrls['spouse_passport'] || '',
  });

  return data;
}

// ============================================================
//  Populate form from saved data
// ============================================================
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
    if (data[name]) {
      const radio = document.querySelector(`input[name="${name}"][value="${data[name]}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  // Trigger select changes to show/hide conditional blocks
  ['employment_status', 'marital_status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('change'));
  });

  // Children
  if (Array.isArray(data.children)) {
    childrenList.innerHTML = '';
    childCount = 0;
    data.children.forEach(child => addChild(child));
    if (data.children.length > 0) {
      // Ensure children block visible
      const yn = document.querySelector('input[name="children_yn"][value="Yes"]');
      if (yn) {
        yn.checked = true;
        document.getElementById('childrenBlock').style.display = 'block';
      }
    }
  }

  // Restore photo URLs (show placeholder text if URL exists)
  const photoFields = [
    { urlKey: 'photo_own_passport_url',    previewId: 'preview_own_passport',    fieldName: 'own_passport' },
    { urlKey: 'photo_father_passport_url', previewId: 'preview_father_passport', fieldName: 'father_passport' },
    { urlKey: 'photo_mother_passport_url', previewId: 'preview_mother_passport', fieldName: 'mother_passport' },
    { urlKey: 'photo_spouse_passport_url', previewId: 'preview_spouse_passport', fieldName: 'spouse_passport' },
  ];
  photoFields.forEach(({ urlKey, previewId, fieldName }) => {
    const url = data[urlKey];
    if (url) {
      photoUrls[fieldName] = url;
      const preview = document.getElementById(previewId);
      if (preview) showExistingPhoto(preview, url, fieldName);
    }
  });
}

function showExistingPhoto(preview, url, fieldName) {
  preview.innerHTML = '';
  if (url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) {
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
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-photo';
  removeBtn.textContent = '✕ Удалить / Remove';
  removeBtn.addEventListener('click', () => {
    preview.innerHTML = '';
    delete photoUrls[fieldName];
  });
  preview.appendChild(removeBtn);
}

// ============================================================
//  Progress bar
// ============================================================
const requiredFields = [
  'full_name','dob','place_of_birth','nationality','gender','marital_status',
  'passport_number','passport_issue_date','passport_expiry_date','passport_place_of_issue',
  'home_address','address_duration','mobile_phone','email',
  'father_name','father_dob','mother_name','mother_dob',
  'occupation','employment_status','trip_payer','savings',
  'arrival_date','departure_date','stay_duration','visit_purpose','accommodation',
];

function updateProgress() {
  const data = collectFormData();
  let filled = 0;
  requiredFields.forEach(f => { if (data[f] && data[f].trim()) filled++; });
  const pct = Math.round((filled / requiredFields.length) * 100);
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${pct}% заполнено / completed`;

  // Mark tab done if all required fields in its section are filled
  markTabsDone(data);
}

const sectionRequiredFields = [
  ['full_name','dob','place_of_birth','nationality','gender','marital_status'],
  ['passport_number','passport_issue_date','passport_expiry_date','passport_place_of_issue'],
  ['home_address','address_duration','mobile_phone','email'],
  ['father_name','father_dob','mother_name','mother_dob'],
  ['occupation','employment_status','trip_payer','savings'],
  ['arrival_date','departure_date','stay_duration','visit_purpose','accommodation'],
  [],
];

function markTabsDone(data) {
  tabs.forEach((tab, idx) => {
    const req = sectionRequiredFields[idx];
    if (req.length === 0) { tab.classList.remove('done'); return; }
    const done = req.every(f => data[f] && data[f].trim());
    tab.classList.toggle('done', done && !tab.classList.contains('active'));
  });
}

// Autosave on field blur
document.getElementById('visaForm').addEventListener('blur', () => {
  debouncedSave();
  updateProgress();
}, true);

// ============================================================
//  Save / Load
// ============================================================
let saveTimer = null;
function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 800);
}

function setSaveStatus(msg, state) {
  const el = document.getElementById('saveStatus');
  el.textContent = msg;
  el.className = 'save-status ' + (state || '');
}

async function saveDraft(submitFlag = false) {
  const formData = collectFormData();
  setSaveStatus('Сохранение... / Saving...', 'saving');

  // Always save to localStorage as backup
  localStorage.setItem('visa_draft_' + appId, JSON.stringify({ formData, submitted: submitFlag }));

  if (!isConfigured) {
    setSaveStatus('Сохранено локально / Saved locally ✓', 'saved');
    updateProgress();
    return;
  }

  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('visa_applications')
      .select('id')
      .eq('id', appId)
      .single();

    if (existing) {
      await supabase.from('visa_applications').update({
        data: formData,
        submitted: submitFlag,
        updated_at: new Date().toISOString(),
      }).eq('id', appId);
    } else {
      await supabase.from('visa_applications').insert({
        id: appId,
        data: formData,
        submitted: submitFlag,
      });
    }
    setSaveStatus('Сохранено в облаке / Saved to cloud ✓', 'saved');
    updateProgress();
  } catch (err) {
    console.error('Save error:', err);
    setSaveStatus('Ошибка сохранения / Save error', 'error');
  }
}

async function loadDraft() {
  // Try Supabase first, then localStorage
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('data, submitted')
        .eq('id', appId)
        .single();

      if (!error && data) {
        populateForm(data.data);
        updateSubmittedState(data.submitted);
        setSaveStatus('Данные загружены / Data loaded ✓', 'saved');
        updateProgress();
        return;
      }
    } catch (e) { /* fall through to localStorage */ }
  }

  // Fallback: localStorage
  const raw = localStorage.getItem('visa_draft_' + appId);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      populateForm(saved.formData);
      updateSubmittedState(saved.submitted);
      setSaveStatus('Данные загружены локально / Loaded from local storage ✓', 'saved');
      updateProgress();
    } catch (e) { console.error('Load error:', e); }
  }
}

function updateSubmittedState(submitted) {
  const badge = document.getElementById('statusBadge');
  if (submitted) {
    badge.textContent = '✅ Подано / Submitted';
    badge.classList.add('submitted');
  } else {
    badge.textContent = 'Черновик / Draft';
    badge.classList.remove('submitted');
  }
}

// ============================================================
//  Validation
// ============================================================
function validateRequiredFields() {
  let valid = true;
  // Clear previous highlights
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  requiredFields.forEach(name => {
    const el = document.querySelector(`#visaForm [name="${name}"]`);
    if (el && !el.value.trim()) {
      el.classList.add('invalid');
      valid = false;
    }
  });

  if (!valid) {
    // Find first invalid field and navigate to that section
    const firstInvalid = document.querySelector('#visaForm .invalid');
    if (firstInvalid) {
      const section = firstInvalid.closest('.form-section');
      if (section) showSection(+section.dataset.section);
      setTimeout(() => firstInvalid.focus(), 300);
      alert('Пожалуйста, заполните все обязательные поля (отмечены *).\nPlease fill in all required fields (marked with *).');
    }
  }
  return valid;
}

// ============================================================
//  Submit
// ============================================================
async function submitApplication() {
  if (!validateRequiredFields()) return;
  const confirmed = confirm(
    'Вы уверены, что хотите подать заявку?\n' +
    'Are you sure you want to submit?\n\n' +
    'После подачи вы всё равно сможете редактировать данные.\n' +
    'You can still edit after submission.'
  );
  if (!confirmed) return;
  await saveDraft(true);
  updateSubmittedState(true);
  alert(
    '✅ Заявка подана! / Application submitted!\n\n' +
    'Вы можете вернуться и отредактировать данные в любое время.\n' +
    'You can return and edit your data at any time.\n\n' +
    'ID заявки / Application ID: ' + appId
  );
}

// ============================================================
//  Event listeners for save/submit buttons
// ============================================================
document.getElementById('btnSaveDraft').addEventListener('click', () => saveDraft(false));
document.getElementById('btnSubmit').addEventListener('click', submitApplication);
document.getElementById('btnSubmitBottom').addEventListener('click', submitApplication);

// ============================================================
//  Drag-and-drop for photo upload areas
// ============================================================
document.querySelectorAll('.photo-upload-area').forEach(area => {
  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = area.querySelector('.file-input');
    if (!input) return;
    // Inject file into input
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
});

// ============================================================
//  Boot — load saved data
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  updateProgress();
});
