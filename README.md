# UK Visa Application Form

Сайт для заполнения данных на UK Standard Visitor Visa.

---

## Шаг 1 — Настройка Supabase

1. Зайдите на [supabase.com](https://supabase.com) и создайте бесплатный аккаунт + проект.

2. В Supabase откройте **SQL Editor** и выполните этот запрос:

```sql
CREATE TABLE visa_applications (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Разрешить анонимный доступ (для простого личного использования)
ALTER TABLE visa_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON visa_applications
  FOR ALL USING (true) WITH CHECK (true);
```

3. Создайте Storage bucket:
   - Перейдите в **Storage → New bucket**
   - Название: `passport-photos`
   - Поставьте галочку **Public bucket**

4. Скопируйте ключи:
   - **Project URL** → `Settings → API → Project URL`
   - **Anon/Public key** → `Settings → API → anon public`

5. Откройте файл `app.js` и замените две строки вверху:

```js
const SUPABASE_URL  = 'https://ваш-проект.supabase.co';
const SUPABASE_ANON = 'ваш-anon-ключ';
```

---

## Шаг 2 — Публикация на Netlify

**Вариант A (быстрее всего):**
1. Зайдите на [netlify.com](https://netlify.com) → Sign up (бесплатно)
2. На главной странице найдите раздел **"Deploy manually"** / Sites → drag & drop
3. Перетащите папку `Rustam_visa` прямо в браузер
4. Netlify выдаст ссылку вида `https://random-name.netlify.app`
5. Поделитесь ссылкой с дядей

**Вариант B (через GitHub):**
1. Создайте приватный репозиторий на GitHub и загрузите файлы
2. В Netlify: **New site → Import from GitHub** → выберите репозиторий
3. Build command: оставьте пустым
4. Publish directory: оставьте `/` (корень)
5. Deploy

---

## Функциональность

- **7 разделов** с навигацией по вкладкам
- **Автосохранение** при каждом изменении поля (в Supabase + localStorage)
- **Кнопка "Сохранить черновик"** — сохраняет вручную
- **Кнопка "Подать заявку"** — помечает как submitted, но данные всё равно можно редактировать
- **Фото паспортов** — опциональные, загружаются в Supabase Storage
- **Drag & drop** для фотографий
- **Прогресс-бар** по обязательным полям
- **Условные поля**: супруг/а показывается при статусе "Женат", дети — динамически, разные блоки для работодателя/пенсионера/студента и т.д.
- **ID заявки** сохраняется в браузере — при повторном заходе данные загружаются автоматически

---

## Структура файлов

```
Rustam_visa/
├── index.html   — HTML форма (7 разделов)
├── style.css    — Стили
├── app.js       — Логика (Supabase, сохранение, фото, валидация)
└── README.md    — Эта инструкция
```
