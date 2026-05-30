# Environment Setup: Development vs Production

Dokumen ini menjelaskan cara mengonfigurasi dan beralih antara lingkungan **Development** dan **Production** di Budget Flow.

---

## 1. Strategi Branch Git

Alur kerja branch git memisahkan pengembangan aktif dengan versi stabil:

* **`main` (Production)**: Berisi kode stabil rilis yang terhubung ke database **Supabase Production**.
* **`develop` (Development)**: Berisi kode pengembangan yang sedang aktif diuji terhadap database **Supabase Development**.

### Cara Sinkronisasi Branch Lokal Anda:
Untuk menyinkronkan branch `develop` lokal Anda dengan update terbaru dari `main`:
```powershell
# Commit perubahan terbaru Anda di branch main
git add .
git commit -m "feat: complete dashboard localization for ID/EN parity"

# Pindah ke branch develop
git checkout develop

# Merge update dari main
git merge main

# Kirim ke remote repository
git push origin develop
```

---

## 2. Pemisahan Proyek Supabase

1. Buat dua proyek terpisah di konsol dashboard Supabase Anda:
   - Proyek A: `budget-flow-dev` (Development)
   - Proyek B: `budget-flow-prod` (Production)
2. Jalankan skrip SQL migrasi (`supabase_migrations.sql`) terlebih dahulu ke proyek Development untuk verifikasi, lalu terapkan skrip yang sama ke proyek Production saat rilis.

---

## 3. Konfigurasi Variabel Lingkungan (.env) di Web/Vite

Vite memuat variabel lingkungan secara otomatis dari file `.env.*` di folder `web-figma/` berdasarkan perintah yang dijalankan:

* **Development (`npm run dev`)**: Otomatis memuat berkas `.env.development`
* **Production Build (`npm run build`)**: Otomatis memuat berkas `.env.production`

### Berkas Konfigurasi:

#### `web-figma/.env.development`
```env
VITE_SUPABASE_URL=https://hywzalvgxzbfzjhszhuj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_TIMEOUT=10000
```

#### `web-figma/.env.production`
```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key-here
VITE_API_TIMEOUT=10000
```

*Semua berkas `.env`, `.env.development`, dan `.env.production` diabaikan oleh Git secara default melalui `.gitignore` untuk mencegah kebocoran kunci akses.*

---

## 4. Sinkronisasi Build Android / Capacitor

Capacitor menyalin berkas web terkompilasi dari folder `dist/` ke aset native Android:

* **Build Production (Rilis)**:
  ```bash
  npm run android:sync
  ```
  *(Menjalankan `npm run build` yang memuat `.env.production`)*

* **Build Development (Testing)**:
  Jalankan perintah berikut untuk mengompilasi mode development:
  ```bash
  npx vite build --mode development && npx cap sync android
  ```
  *(Membuat build web yang terhubung ke `.env.development` dan menyinkronkannya ke folder Android)*
