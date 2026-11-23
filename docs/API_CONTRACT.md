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

Status: Implementasi backend selesai dan sudah di-merge ke main.

Endpoint:

- POST `/api/register`
- POST `/api/login`
- POST `/api/logout`
- GET `/api/me`

Authentication menggunakan Laravel Sanctum untuk autentikasi token.
Register dan login menggunakan verifikasi Cloudflare Turnstile.

Dokumentasi request, response, dan validasi mengikuti implementasi AuthController dan middleware VerifyTurnstile.

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

Status: Dalam pengerjaan oleh Kenia.

Endpoint yang menjadi target:

- Membuat reservasi.
- Menampilkan daftar reservasi pengguna.
- Menampilkan detail reservasi.
- Membatalkan reservasi.
- Menampilkan seluruh reservasi untuk admin.
- Menyetujui reservasi.
- Menolak reservasi.

Detail endpoint, request, response, dan validasi akan diperbarui setelah implementasi backend selesai dan di-merge ke main.

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

| Modul          | Status                                |
| -------------- | ------------------------------------- |
| Authentication | Selesai dan merged                    |
| Rooms          | Selesai dan merged                    |
| Facilities     | Selesai dan merged                    |
| Reservations   | Dalam pengerjaan                      |
| Turnstile      | Fondasi backend dan frontend tersedia |

Catatan integrasi:

1. Frontend menggunakan API dari backend Laravel.
2. Base URL API menggunakan konfigurasi environment `NEXT_PUBLIC_API_URL`.
3. Authentication menggunakan token Sanctum.
4. Register dan login harus mengirim `turnstile_token`.
5. Role pengguna harus mengikuti `admin`, `mahasiswa`, dan `dosen`.
6. Nama field request dan response harus mengikuti implementasi backend.
7. Dokumentasi Reservation akan diperbarui setelah API selesai.

Pengujian backend terakhir:

- 61 tests passed.
- 175 assertions.
- Tidak ada test yang gagal.

Hasil pengujian tersebut mencakup seluruh feature dan unit test yang dijalankan, bukan berarti seluruh integrasi frontend-backend sudah selesai.
