# RuangKuliah API Contract

## 1. Informasi Umum

Dokumentasi ini menjadi acuan komunikasi antara frontend Next.js dan backend Laravel pada proyek RuangKuliah.

- **Project:** RuangKuliah
- **Frontend:** Next.js
- **Backend:** Laravel
- **Database:** MySQL
- **Base URL Development:** `http://127.0.0.1:8000/api`

## 2. Standar API

| Bagian                  | Standar                       |
| ----------------------- | ----------------------------- |
| Format komunikasi       | JSON                          |
| Content-Type            | application/json              |
| Penamaan endpoint       | lowercase dan plural          |
| Penamaan field database | snake_case                    |
| HTTP method             | GET, POST, PUT, PATCH, DELETE |
| Autentikasi             | Laravel Sanctum               |
| Format response         | Konsisten menggunakan JSON    |

## 3. Standar Penamaan

- Database table dan column: `snake_case`
- Laravel Model: `PascalCase`
- Laravel Controller: `PascalCase`
- Laravel method dan variable: `camelCase`
- React Component: `PascalCase`
- TypeScript interface/type: `PascalCase`
- Frontend variable dan function: `camelCase`
- JSON property: mengikuti nama field backend (`snake_case`).

## 4. Standar Response

### Success Response

Contoh format yang disepakati:

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {}
}
```

### Error Response

Contoh format yang disepakati:

```json
{
  "success": false,
  "message": "Terjadi kesalahan",
  "errors": {}
}
```

Catatan: Format di atas merupakan standar target integrasi. Implementasi aktual perlu disesuaikan jika backend menggunakan format berbeda.

## 5. Modul API

### 5.1 Authentication

Status: Implementasi backend selesai dan sudah di-merge ke main. Teruji oleh `AuthApiTest` dan `TurnstileAuthTest`.

| Method | Endpoint        | Akses                                               | Keterangan                         |
| ------ | --------------- | --------------------------------------------------- | ---------------------------------- |
| POST   | `/api/register` | Publik + Turnstile                                  | Registrasi mahasiswa atau dosen    |
| POST   | `/api/login`    | Publik + Turnstile, maksimal 10 percobaan per menit | Login dengan email dan password    |
| POST   | `/api/logout`   | Bearer token                                        | Mencabut token yang sedang dipakai |
| GET    | `/api/me`       | Bearer token                                        | Data pengguna yang sedang login    |

**Token.** Setelah register atau login, simpan `data.token` dan kirim pada setiap request yang butuh login:

```
Authorization: Bearer <token>
```

Token Turnstile (`turnstile_token`) dan token Sanctum adalah dua hal berbeda. Turnstile hanya dikirim saat register dan login, sedangkan token Sanctum dikirim pada request berikutnya.

#### POST /api/register

Request body (JSON):

| Field                   | Aturan                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `name`                  | wajib, teks, maksimal 255 karakter                          |
| `email`                 | wajib, format email, unik                                   |
| `password`              | wajib, minimal 8 karakter                                   |
| `password_confirmation` | wajib, sama dengan `password`                               |
| `role`                  | wajib, `mahasiswa` atau `dosen` (`admin` ditolak)           |
| `nim`                   | wajib jika `role` = `mahasiswa`, maksimal 20 karakter, unik |
| `nip`                   | wajib jika `role` = `dosen`, maksimal 20 karakter, unik     |
| `turnstile_token`       | wajib, token dari widget Turnstile                          |

Response `201`:

```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "user": {
      "id": 4,
      "name": "Budi Mahasiswa",
      "email": "budi@example.test",
      "role": "mahasiswa",
      "nim": "2415101001",
      "nip": null
    },
    "token": "1|contoh-token",
    "token_type": "Bearer"
  }
}
```

Kolom NIM atau NIP yang tidak sesuai dengan role disimpan `null`. Akun admin tidak bisa dibuat lewat endpoint ini.

#### POST /api/login

Request body: `email`, `password`, `turnstile_token` (semuanya wajib).

Response `200`: bentuknya sama dengan register, dengan `message` "Login berhasil.".

Response `401` jika email atau password salah:

```json
{
  "success": false,
  "message": "Email atau password salah.",
  "errors": { "email": ["Email atau password salah."] }
}
```

#### POST /api/logout

Tanpa body. Response `200`:

```json
{ "success": true, "message": "Logout berhasil.", "data": null }
```

Hanya token yang sedang dipakai yang dicabut, perangkat lain tetap login.

#### GET /api/me

Response `200`:

```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil.",
  "data": {
    "user": {
      "id": 4,
      "name": "Budi Mahasiswa",
      "email": "budi@example.test",
      "role": "mahasiswa",
      "nim": "2415101001",
      "nip": null
    }
  }
}
```

#### Kode error umum (Authentication)

| Status | Kapan                                                   | Bentuk body                                                               |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| 401    | Token tidak ada atau tidak valid; login salah           | `message` (login salah juga memuat `success` dan `errors`)                |
| 422    | Validasi input gagal                                    | `message` dan `errors` per field (format bawaan Laravel, tanpa `success`) |
| 422    | `turnstile_token` kosong, tidak valid, atau kedaluwarsa | `success: false`, `message`, `errors.turnstile_token`                     |
| 429    | Terlalu banyak percobaan login                          | bawaan Laravel                                                            |
| 503    | Layanan Cloudflare tidak dapat dihubungi                | `success: false`, `message`, `errors`                                     |

Catatan untuk frontend: token Turnstile hanya sekali pakai. Jika request gagal (misalnya password salah), widget harus di-reset supaya menghasilkan token baru.

### 5.2 Rooms

Status: Implementasi backend selesai dan sudah di-merge ke main.

Room API sudah tersedia untuk:

- Menampilkan daftar ruangan.
- Menampilkan detail ruangan.
- Menampilkan daftar ruangan untuk admin.
- Menambahkan ruangan.
- Memperbarui ruangan.
- Menghapus ruangan.

Endpoint dan format response mengikuti implementasi RoomController dan RoomResource.

Dokumentasi teknis lebih lanjut:
`HANDOVER_ROOMS_FACILITIES.md`

### 5.3 Facilities

Status: Implementasi backend selesai dan sudah di-merge ke main.

Facility API sudah tersedia untuk:

- Menampilkan daftar fasilitas.
- Menampilkan detail fasilitas.
- Menambahkan fasilitas.
- Memperbarui fasilitas.
- Menghapus fasilitas.
- Mengatur relasi fasilitas dengan ruangan.

Endpoint dan format response mengikuti implementasi FacilityController dan FacilityResource.

Dokumentasi teknis lebih lanjut:
`HANDOVER_ROOMS_FACILITIES.md`

### 5.4 Reservations

Status: Implementasi backend selesai dan teruji (`ReservationApiTest`, `AdminReservationApiTest`) di branch `kenia-reservasi`. Menunggu review dan merge ke main.

Semua endpoint di bagian ini memerlukan Bearer token.

| Method | Endpoint                               | Akses              | Keterangan                               |
| ------ | -------------------------------------- | ------------------ | ---------------------------------------- |
| POST   | `/api/reservations`                    | mahasiswa, dosen   | Ajukan reservasi (status awal `pending`) |
| GET    | `/api/reservations`                    | pengguna login     | Daftar reservasi milik sendiri           |
| GET    | `/api/reservations/{id}`               | pemilik atau admin | Detail reservasi                         |
| PATCH  | `/api/reservations/{id}/cancel`        | pemilik            | Batalkan reservasi                       |
| GET    | `/api/admin/reservations`              | admin              | Seluruh reservasi dengan filter          |
| PATCH  | `/api/admin/reservations/{id}/approve` | admin              | Setujui reservasi                        |
| PATCH  | `/api/admin/reservations/{id}/reject`  | admin              | Tolak reservasi                          |

#### Objek reservasi

| Field                                       | Keterangan                                                                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`, `reservation_code`                    | `reservation_code` dibuat otomatis, contoh `RSV-20261204-A1B2C3`                                                           |
| `user_id`, `room_id`                        |                                                                                                                            |
| `reservation_date`                          | format `YYYY-MM-DD`                                                                                                        |
| `start_time`, `end_time`                    | format `HH:MM` (24 jam)                                                                                                    |
| `purpose`, `participant_count`              |                                                                                                                            |
| `status`                                    | `pending`, `approved`, `rejected`, `cancelled`                                                                             |
| `admin_notes`, `reviewed_by`, `reviewed_at` | `null` sampai diproses admin; `reviewed_at` format ISO 8601                                                                |
| `room`                                      | objek ruangan, tanpa daftar fasilitas (ada pada semua endpoint di bawah)                                                   |
| `user`                                      | `id`, `name`, `email`, `role`, `nim`, `nip` (hanya pada detail, daftar admin, setujui, dan tolak)                          |
| `logs`                                      | riwayat status: `previous_status`, `new_status`, `notes`, `admin_id`, `created_at` (hanya pada detail, setujui, dan tolak) |
| `created_at`                                | ISO 8601                                                                                                                   |

#### POST /api/reservations

| Field               | Aturan                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `room_id`           | wajib, ruangan harus ada dan berstatus `available`                      |
| `reservation_date`  | wajib, `YYYY-MM-DD`, tidak boleh di masa lalu                           |
| `start_time`        | wajib, `HH:MM`, tidak boleh sudah lewat pada hari ini                   |
| `end_time`          | wajib, `HH:MM`, harus setelah `start_time`                              |
| `purpose`           | wajib, maksimal 1000 karakter                                           |
| `participant_count` | wajib, bilangan bulat minimal 1, tidak boleh melebihi kapasitas ruangan |

Aturan jadwal:

- Reservasi `pending` dan `approved` memblokir jadwal. `rejected` dan `cancelled` tidak.
- Jadwal yang bersebelahan diperbolehkan (09:00–10:00 dan 10:00–11:00).
- Admin tidak dapat mengajukan reservasi (`403`).

Response `201`:

```json
{
  "success": true,
  "message": "Reservasi berhasil diajukan dan menunggu persetujuan admin.",
  "data": {
    "id": 1,
    "reservation_code": "RSV-20261204-A1B2C3",
    "user_id": 4,
    "room_id": 1,
    "reservation_date": "2026-12-04",
    "start_time": "09:00",
    "end_time": "10:00",
    "purpose": "Kuliah tambahan",
    "participant_count": 20,
    "status": "pending",
    "admin_notes": null,
    "reviewed_by": null,
    "reviewed_at": null,
    "room": {
      "id": 1,
      "room_code": "R-101",
      "room_name": "Ruang Kelas 101",
      "capacity": 40,
      "status": "available"
    },
    "created_at": "2026-11-24T08:00:00+00:00"
  }
}
```

(Objek `room` pada contoh dipersingkat.) Contoh response `422`, format bawaan Laravel:

```json
{
  "message": "Jumlah peserta melebihi kapasitas ruangan (40).",
  "errors": {
    "participant_count": ["Jumlah peserta melebihi kapasitas ruangan (40)."]
  }
}
```

Field penyebab error validasi:

| Kasus                                        | Field di `errors`   |
| -------------------------------------------- | ------------------- |
| Ruangan tidak ada atau tidak `available`     | `room_id`           |
| Peserta melebihi kapasitas                   | `participant_count` |
| Jam selesai tidak setelah jam mulai          | `end_time`          |
| Tanggal di masa lalu                         | `reservation_date`  |
| Waktu mulai sudah lewat, atau jadwal bentrok | `start_time`        |

#### GET /api/reservations

Hanya reservasi milik pengguna yang login, diurutkan dari yang terbaru.

Query opsional: `status` (salah satu status di atas), `per_page` (1–100, default 10), `page`.

Response `200` memakai paginasi bawaan Laravel, sama seperti endpoint ruangan. Respons daftar tidak memuat `success` dan `message`:

```json
{
  "data": [ { "...objek reservasi dengan room..." } ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "from": 1, "last_page": 1, "per_page": 10, "to": 1, "total": 1 }
}
```

#### GET /api/reservations/{id}

Response `200` berisi satu objek reservasi lengkap (`room`, `user`, `logs`) di `data`. Response `403` jika bukan pemilik dan bukan admin.

#### PATCH /api/reservations/{id}/cancel

Tanpa body. Aturan:

- Hanya pemilik reservasi (`403` untuk yang lain, termasuk admin).
- Hanya status `pending` atau `approved`.
- Hanya sebelum jam mulai.

Response `200`: objek reservasi dengan `status` `cancelled`, dan jadwal kembali tersedia. Response `422` dengan error pada field `status` jika aturan di atas tidak terpenuhi.

#### GET /api/admin/reservations

Khusus admin. Query opsional:

| Query              | Keterangan                                        |
| ------------------ | ------------------------------------------------- |
| `status`           | filter status                                     |
| `room_id`          | filter ruangan                                    |
| `date`             | filter tanggal, `YYYY-MM-DD`                      |
| `search`           | cari berdasarkan kode reservasi atau nama pemohon |
| `per_page`, `page` | paginasi, sama seperti daftar pengguna            |

Bentuk response sama dengan daftar pengguna (`data`, `links`, `meta`), tetapi setiap item memuat `room` dan `user`.

#### PATCH /api/admin/reservations/{id}/approve

Body opsional: `admin_notes` (maksimal 1000 karakter).

#### PATCH /api/admin/reservations/{id}/reject

Body: `admin_notes` **wajib** (maksimal 1000 karakter), supaya pemohon mengetahui alasannya.

Aturan approve dan reject:

- Hanya untuk reservasi berstatus `pending`. Status lain menghasilkan `422` dengan error pada field `status`.
- `reviewed_by`, `reviewed_at`, dan `admin_notes` terisi, dan perubahan status dicatat di `logs`.
- Response `200` berisi objek reservasi lengkap.

#### Kode error umum (Reservations)

| Status | Kapan                                                                             |
| ------ | --------------------------------------------------------------------------------- |
| 401    | Token tidak ada atau tidak valid                                                  |
| 403    | Bukan pemilik, bukan admin, atau admin mencoba mengajukan reservasi               |
| 404    | Reservasi tidak ditemukan                                                         |
| 422    | Validasi atau aturan bisnis gagal (format bawaan Laravel: `message` dan `errors`) |

## 6. Role dan Hak Akses

| Role      | Hak akses                                |
| --------- | ---------------------------------------- |
| admin     | Mengelola data dan persetujuan reservasi |
| mahasiswa | Melihat ruangan dan membuat reservasi    |
| dosen     | Melihat ruangan dan membuat reservasi    |

Detail authorization mengikuti implementasi middleware dan backend.

## 7. Security

### Authentication

- Menggunakan Laravel Sanctum.
- Token dikirim melalui header `Authorization: Bearer {token}`.
- Endpoint yang membutuhkan autentikasi menggunakan middleware `auth:sanctum`.

### Role Authorization

Sistem menggunakan tiga role:

- `admin`
- `mahasiswa`
- `dosen`

Endpoint khusus admin menggunakan middleware otorisasi admin.

### Cloudflare Turnstile

- Register dan login menggunakan verifikasi Cloudflare Turnstile.
- Frontend mengirim token melalui field `turnstile_token`.
- Backend memverifikasi token menggunakan TurnstileService.
- Secret Key hanya disimpan di environment backend.

### Token Expiration

Kebijakan masa berlaku token Sanctum masih menunggu keputusan tim.

## 8. Integrasi Frontend

Frontend menggunakan Axios untuk mengakses backend.

Ketentuan:

- Base URL diambil dari environment variable.
- Request dan response mengikuti kontrak API.
- Nama field frontend harus sesuai dengan JSON backend.
- Penanganan loading dan error dilakukan pada frontend.

## 9. Integration Notes

Status integrasi backend:

| Modul          | Status                                                         |
| -------------- | -------------------------------------------------------------- |
| Authentication | Selesai dan merged                                             |
| Rooms          | Selesai dan merged                                             |
| Facilities     | Selesai dan merged                                             |
| Reservations   | Selesai di branch `kenia-reservasi`, menunggu review dan merge |
| Turnstile      | Fondasi backend dan frontend tersedia                          |

Catatan integrasi:

1. Frontend menggunakan API dari backend Laravel.
2. Base URL API menggunakan konfigurasi environment `NEXT_PUBLIC_API_URL`.
3. Authentication menggunakan token Sanctum.
4. Register dan login harus mengirim `turnstile_token`.
5. Role pengguna harus mengikuti `admin`, `mahasiswa`, dan `dosen`.
6. Nama field request dan response harus mengikuti implementasi backend.
7. Dokumentasi Authentication dan Reservations ada di bagian 5.1 dan 5.4.

Pengujian backend terakhir (branch `kenia-reservasi`, setelah sinkron dengan main):

- 99 tests passed.
- 349 assertions.
- Tidak ada test yang gagal.

Hasil pengujian tersebut mencakup seluruh feature dan unit test yang dijalankan, bukan berarti seluruh integrasi frontend-backend sudah selesai.
