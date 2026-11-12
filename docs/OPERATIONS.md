# Stockly — Panduan Keamanan, Operasional, & Deployment Produksi

Dokumen ini merangkum konfigurasi keamanan, kontrol operasional, panduan deployment produksi (Vercel + Neon PostgreSQL), data demo beta, serta batasan MVP yang diketahui untuk Stockly.

## 1. Environment Variables

Seluruh variabel wajib dan opsional didokumentasikan pada `.env.example` dan divalidasi oleh modul server-only [`src/lib/env.ts`](../src/lib/env.ts):

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string Neon PostgreSQL **pooled** (`-pooler`) dengan `sslmode=verify-full`. |
| `DATABASE_URL_UNPOOLED` | Disarankan | Connection string Neon **direct/unpooled** untuk migrasi skema dan operasi admin database. |
| `BETTER_AUTH_SECRET` | Ya | Secret acak kriptografis minimal 32 karakter (`openssl rand -base64 32`). Jangan gunakan nilai placeholder di produksi. |
| `BETTER_AUTH_URL` | Disarankan | URL kanonik aplikasi produksi (mis. `https://app.stockly.id`). Di Vercel, `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` juga didukung otomatis. |
| `NEXT_PUBLIC_APP_URL` | Opsional | URL publik aplikasi untuk tautan eksternal dan `trustedOrigins`. |
| `DEMO_SEED_PASSWORD` | Opsional | Password awal akun demo saat menjalankan `pnpm db:seed` (default lokal/staging: `StocklyDemo2026!`). Jangan jalankan seed akun demo publik di database produksi pelanggan tanpa mengubah password. |

## 2. Konfigurasi Cookie, Sesi, & Batas Server-Only

- **Cookie & Sesi ([`src/lib/auth.ts`](../src/lib/auth.ts))**:
  - Masa berlaku sesi 7 hari dengan refresh tiap 24 jam (`expiresIn: 60 * 60 * 24 * 7`, `updateAge: 60 * 60 * 24`).
  - Seluruh cookie memakai `httpOnly: true`.
  - Di produksi dengan HTTPS (`resolvedBaseUrl` diawali `https://`), cookie memakai `useSecureCookies: true` dan `sameSite: 'lax'`.
  - Di development iframe v0 (`V0_RUNTIME_URL` / `V0_DEV_APP_URL` / `V0_SANDBOX_URL`), atribut otomatis menyesuaikan `sameSite: 'none'` dan `secure: true`.
  - `trustedOrigins` membatasi origin yang diizinkan ke URL aplikasi terkonfigurasi (`BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`).
- **Akses Database Server-Only**:
  - `src/db/index.ts`, `src/lib/auth.ts`, `src/lib/auth-session.ts`, `src/lib/env.ts`, `src/lib/logger.ts`, seluruh `src/services/*.service.ts`, dan `src/lib/workspaces/*` mendeklarasikan `import 'server-only'`.
  - Diuji otomatis melalui `src/lib/security/server-only-boundary.test.ts` agar Client Component (`'use client'`) tidak pernah mengimpor modul server/database.

## 3. Rate Limiting & Logging Aman

- **Rate Limiting ([`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts))**:
  - `POST /api/register`: maks. 5 permintaan per 10 menit per IP.
  - `POST /api/auth/[...all]`: maks. 15 mutasi autentikasi per 5 menit per IP.
  - `GET /api/reports/export`: maks. 20 ekspor CSV per menit per kombinasi `workspaceId:userId`.
  - Respons terblokir mengembalikan HTTP `429` dengan header `Retry-After`, `X-RateLimit-*`, dan `Cache-Control: no-store`.
  - **Catatan skala**: Implementasi saat ini menggunakan store in-memory per instance Node/serverless (dengan batas 10.000 key untuk mencegah kebocoran memori). Sebelum skala trafik multi-region tinggi, tingkatkan ke store terdistribusi seperti Upstash Redis.
- **Error Handling & Logging ([`src/lib/logger.ts`](../src/lib/logger.ts))**:
  - Error tak terduga pada Server Actions dan API route menghasilkan log JSON terstruktur dengan `correlationId`, kode error, serta redaksi otomatis kredensial (`password`, `token`, `secret`, `authorization`, `cookie`, string `postgresql://...`).
  - Pesan error yang dikirim ke browser hanya berupa pesan DomainError berbahasa Indonesia atau pesan generik aman (tanpa stack trace maupun detail SQL).

## 4. Database Backup, Neon Quota, & Ketentuan Paket Vercel

### Pendekatan Backup & Pemulihan Neon PostgreSQL
1. Aktifkan dan verifikasi **Point-in-Time Restore (PITR) / history retention** di konsol Neon sesuai paket proyek (Free: 24 jam/6 jam tergantung tier; Launch/Scale: retensi lebih panjang).
2. Sebelum menerapkan migrasi DDL besar di produksi, buat **Neon Branch snapshot** atau ekspor `pg_dump` melalui `DATABASE_URL_UNPOOLED`.
3. Uji prosedur restore ke branch terpisah minimal sebelum onboarding bisnis pilot.

### Pengawasan Koneksi & Kuota Neon
- Pool runtime (`src/db/index.ts`) dibatasi `max: 10` di produksi (`idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 10_000`) dan menggunakan URL `-pooler` Neon (PgBouncer transaction pooling) untuk menekan jumlah koneksi aktif dari serverless functions Vercel.
- Pantau secara berkala di Neon Console:
  - Active connections vs batas pooler.
  - Compute-hours (CU-hrs) dan ukuran penyimpanan database.
  - Pastikan tidak ada polling periodik di UI (sesuai aturan arsitektur MVP).

### Ketentuan Paket Hosting Vercel
- **Penting sebelum komersialisasi**: Paket **Vercel Hobby** hanya diperuntukkan bagi penggunaan non-komersial/personal. Sebelum menerima pelanggan berbayar atau menjalankan operasional komersial bisnis pilot secara resmi, pastikan proyek berada pada paket **Vercel Pro** (atau paket komersial yang sesuai ketentuan layanan Vercel terbaru).

## 5. Instruksi Deployment Produksi (Vercel + Neon)

1. **Siapkan Database Neon Produksi**:
   - Buat project/branch produksi di Neon.
   - Terapkan seluruh file SQL pada `src/db/migrations/` secara berurutan (`0000_foundation.sql`, `0001_categories_and_products.sql`, `0002_suppliers_and_inventory.sql`) atau melalui integrasi Neon migration di environment Anda.
   - Verifikasi konsistensi skema dengan `pnpm db:check`.
2. **Konfigurasi Environment Variables di Vercel**:
   - Tambahkan `DATABASE_URL` (pooled, `?sslmode=verify-full`), `DATABASE_URL_UNPOOLED` (opsional), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL` (`https://<domain-anda>`), dan `NEXT_PUBLIC_APP_URL`.
3. **Verifikasi Build & Pengujian Sebelum Rilis**:
   - Jalankan `pnpm typecheck && pnpm lint && pnpm test`.
   - Jalankan build produksi (`pnpm build` di Vercel / `pnpm exec next build --webpack`).
4. **Smoke Check Pasca-Deploy**:
   - Daftarkan akun uji di `/sign-up`, pastikan langsung diarahkan ke `/dashboard` dengan workspace baru dan gudang default `Gudang Utama`.
   - Uji pembuatan kategori, produk, supplier, stok masuk, stok keluar (termasuk penolakan stok minus), penyesuaian stok, laporan, dan ekspor CSV.
   - Pastikan cookie sesi di browser memiliki flag `HttpOnly` dan `Secure`.

## 6. Menyiapkan Data Demo Beta

Jalankan skrip seed idempoten berikut terhadap database development/staging:

```bash
pnpm db:seed
```

Skrip [`src/db/seed.ts`](../src/db/seed.ts) akan membuat workspace **`Toko Berkah Jaya (Demo)`** beserta gudang utama, 3 kategori, 2 supplier, 5 produk (mencakup stok normal, menipis, dan habis), riwayat mutasi `IN`/`OUT`/`ADJUSTMENT` yang terekonsiliasi dengan saldo stok, serta 2 akun demo:
- `owner@demo.stockly.id` (peran `OWNER`)
- `staff@demo.stockly.id` (peran `STAFF`)

Password default berasal dari `DEMO_SEED_PASSWORD` (atau `StocklyDemo2026!` jika tidak disetel).

## 7. Onboarding Bisnis Pilot & Pengumpulan Masukan Beta

### Onboarding 3–5 Bisnis Pilot
1. Siapkan 3 bisnis pilot bawaan (atau buat file JSON kustom berisi 1–10 bisnis) lalu jalankan:
   ```bash
   pnpm pilot:onboard -- --sample
   # atau dengan file JSON kustom:
   pnpm pilot:onboard -- --file ./pilot-businesses.json
   ```
2. Skrip [`src/db/onboard-pilot.ts`](../src/db/onboard-pilot.ts) memvalidasi keunikan email dengan Zod (`pilotBatchSchema`), lalu membuat workspace, akun `OWNER` (dan opsional `STAFF`), gudang default `Gudang Utama`, serta kategori awal secara idempoten.
3. Bisnis baru yang masuk ke `/dashboard` otomatis melihat **Panduan Memulai Usaha Baru** (4 langkah sampai laporan CSV pertama).

### Mengumpulkan Masukan Kegunaan & Menangani Bug Penghambat
- Setiap pengguna pilot dapat menekan tombol **Masukan Beta** di header aplikasi untuk mengirim masukan UX, skor kemudahan (`1–5`), atau laporan bug penghambat (`BUG`) dari halaman mana pun.
- Endpoint `POST /api/feedback` memvalidasi payload, menerapkan rate limit, dan mencatat log JSON terstruktur dengan `scope: "beta-feedback"` di server/Vercel Logs lengkap dengan `workspaceId`, `role`, `pagePath`, `rating`, dan `viewportWidth`.
- Triage harian beta: filter log server berdasarkan `"type":"BUG"` untuk memprioritaskan perbaikan bug penghambat sebelum menambah fitur baru.

## 8. Known Limitations (Batasan MVP yang Diketahui)

1. **Satu gudang default per workspace pada UI MVP**: Skema mendukung banyak gudang (`warehouses`), namun antarmuka operasional saat ini hanya mengekspos gudang default (`Gudang Utama`).
2. **Belum ada UI manajemen tim / undangan staf**: Penambahan akun `STAFF` ke workspace yang sudah ada belum memiliki halaman undangan mandiri; saat ini baru tersedia melalui seed database atau manajemen manual database.
3. **Belum ada alur verifikasi email & reset password mandiri**: Autentikasi menggunakan email dan password via Better Auth tanpa pengiriman email transaksional (SMTP/Resend belum diintegrasikan pada MVP).
4. **Rate limiter in-memory per instance**: Melindungi setiap instance serverless Vercel, tetapi penghitung limit belum dibagikan lintas instance/region hingga backend Redis ditambahkan.
5. **Pengujian E2E & responsif visual browser penuh**: Pengujian layanan, isolasi tenant, otorisasi peran, konkurensi row-locking, API route, dan layout CSS dijalankan melalui Vitest; verifikasi browser nyata lintas viewport (`375px`, `768px`, `1024px`, `1440px`) perlu dijalankan pada environment dengan Chromium/Playwright terpasang sebelum rilis produksi penuh.

