# RuangKuliah API Contract

## 1. Informasi Umum

Dokumentasi ini menjadi acuan komunikasi antara frontend Next.js dan backend Laravel pada proyek RuangKuliah.

- **Project:** RuangKuliah
- **Frontend:** Next.js
- **Backend:** Laravel
- **Database:** MySQL
- **Base URL Development:** `http://127.0.0.1:8000/api`

## 2. Standar API

| Bagian | Standar |
|---|---|
| Format komunikasi | JSON |
| Content-Type | application/json |
| Penamaan endpoint | lowercase dan plural |
| Penamaan field database | snake_case |
| HTTP method | GET, POST, PUT, PATCH, DELETE |
| Autentikasi | Laravel Sanctum |
| Format response | Konsisten menggunakan JSON |

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

Modul untuk login, registrasi, logout, dan pengelolaan akun pengguna.

Status: Menunggu konfirmasi implementasi backend.

### 5.2 Rooms

Modul untuk menampilkan dan mengelola data ruangan.

Field utama:
- `id`
- `room_code`
- `room_name`
- `building`
- `floor`
- `capacity`
- `description`
- `image`
- `status`
- `facilities`

Status: Implementasi backend sedang dikembangkan.

### 5.3 Facilities

Modul untuk menampilkan dan mengelola fasilitas ruangan.

Field utama:
- `id`
- `name`
- `description`

Status: Implementasi backend sedang dikembangkan.

### 5.4 Reservations

Modul untuk mengelola pemesanan ruangan.

Field utama:
- `id`
- `reservation_code`
- `user_id`
- `room_id`
- `reservation_date`
- `start_time`
- `end_time`
- `purpose`
- `participant_count`
- `status`
- `admin_notes`
- `reviewed_by`
- `reviewed_at`

Status: Menunggu konfirmasi implementasi backend.

## 6. Role dan Hak Akses

| Role | Hak akses |
|---|---|
| admin | Mengelola data dan persetujuan reservasi |
| mahasiswa | Melihat ruangan dan membuat reservasi |
| dosen | Melihat ruangan dan membuat reservasi |

Detail authorization mengikuti implementasi middleware dan backend.

## 7. Autentikasi dan Keamanan

- Autentikasi menggunakan Laravel Sanctum.
- CAPTCHA/browser verification menggunakan token terpisah dari Sanctum.
- Secret key CAPTCHA hanya disimpan di backend.
- Endpoint yang memerlukan autentikasi harus mengirim token Sanctum.
- Hak akses harus divalidasi di backend.

## 8. Integrasi Frontend

Frontend menggunakan Axios untuk mengakses backend.

Ketentuan:
- Base URL diambil dari environment variable.
- Request dan response mengikuti kontrak API.
- Nama field frontend harus sesuai dengan JSON backend.
- Penanganan loading dan error dilakukan pada frontend.

## 9. Catatan Integrasi

- Endpoint dan response aktual akan diperbarui setelah implementasi backend dikonfirmasi.
- Jangan membuat endpoint atau field baru tanpa koordinasi.
- Perubahan kontrak API harus dikomunikasikan kepada seluruh anggota tim.
- Dokumentasi ini akan diperbarui selama proses pengembangan.