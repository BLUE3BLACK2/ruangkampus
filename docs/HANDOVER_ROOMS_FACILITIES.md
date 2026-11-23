# Serah Terima API: Ruangan dan Fasilitas

Dari: Prema (Backend Ruangan dan Fasilitas)  
Untuk: Kenia (Authentication dan Reservation), Acil (Frontend), Rubby (Integrasi)  
Tanggal pembaruan: 23 November 2026  
Status: Controller, Resource, dan route sudah selesai didaftarkan serta masuk ke `main`. Pengujian backend telah lulus.

---

## 1. Status Implementasi

Implementasi Room API dan Facility API telah selesai dan di-merge ke branch `main`.

Status terkini:

| Komponen                                        | Status                  |
| ----------------------------------------------- | ----------------------- |
| RoomController                                  | Selesai                 |
| FacilityController                              | Selesai                 |
| RoomResource                                    | Selesai                 |
| FacilityResource                                | Selesai                 |
| Middleware admin                                | Selesai                 |
| Route Room API                                  | Sudah terdaftar         |
| Route Facility API                              | Sudah terdaftar         |
| Feature Test Room API                           | Lulus                   |
| Feature Test Facility API                       | Lulus                   |
| Pengujian HTTP langsung menggunakan MySQL lokal | Belum dikonfirmasi      |
| Upload gambar ruangan                           | Belum diimplementasikan |

Seluruh pengujian backend terakhir menunjukkan 61 test lulus dengan 175 assertions. Pengujian tersebut mencakup Room API dan Facility API, selain modul backend lainnya.

## 2. Route yang Sudah Terdaftar

Route berikut sudah didaftarkan di `backend/routes/api.php`.

### Route publik

| Method | Endpoint            | Fungsi                       |
| ------ | ------------------- | ---------------------------- |
| GET    | `/api/rooms`        | Menampilkan daftar ruangan   |
| GET    | `/api/rooms/{room}` | Menampilkan detail ruangan   |
| GET    | `/api/facilities`   | Menampilkan daftar fasilitas |

### Route khusus Admin

Semua endpoint berikut menggunakan middleware `auth:sanctum` dan `admin`.

| Method    | Endpoint                           | Fungsi                                |
| --------- | ---------------------------------- | ------------------------------------- |
| GET       | `/api/admin/rooms`                 | Daftar ruangan untuk admin            |
| POST      | `/api/rooms`                       | Membuat ruangan                       |
| PUT/PATCH | `/api/rooms/{room}`                | Memperbarui ruangan                   |
| DELETE    | `/api/rooms/{room}`                | Menghapus ruangan                     |
| POST      | `/api/facilities`                  | Membuat fasilitas                     |
| GET       | `/api/facilities/{facility}`       | Detail fasilitas                      |
| PUT/PATCH | `/api/facilities/{facility}`       | Memperbarui fasilitas                 |
| DELETE    | `/api/facilities/{facility}`       | Menghapus fasilitas                   |
| PUT       | `/api/facilities/{facility}/rooms` | Mengatur relasi fasilitas dan ruangan |

Catatan:

- `{room}` menggunakan ID ruangan, bukan slug.
- GET `/api/facilities` sengaja bersifat publik agar halaman katalog dapat mengambil daftar fasilitas.
- Middleware `admin` sudah terdaftar di `bootstrap/app.php`.
- Route publik tidak memerlukan token.
- Route Admin memerlukan token Sanctum dan role `admin`.

## 3. Struktur Data dan Penamaan Field

Kontrak API mengikuti migration dan model yang sudah ada di repository.

Field ruangan yang digunakan:

| Field         | Keterangan               |
| ------------- | ------------------------ |
| `id`          | ID ruangan               |
| `room_code`   | Kode ruangan             |
| `room_name`   | Nama ruangan             |
| `building`    | Gedung                   |
| `floor`       | Lantai                   |
| `capacity`    | Kapasitas                |
| `description` | Deskripsi                |
| `image`       | Path gambar              |
| `status`      | Status ruangan           |
| `facilities`  | Daftar fasilitas ruangan |
| `created_at`  | Waktu pembuatan          |

Status ruangan yang valid:

- `available`
- `maintenance`
- `inactive`

Jangan menggunakan nama field lama seperti `name`, `slug`, atau `location` untuk data ruangan.

### Relasi fasilitas

Fasilitas menggunakan tabel tersendiri dan relasi pivot `room_facility`.

Field fasilitas:

| Field         | Keterangan                                |
| ------------- | ----------------------------------------- |
| `id`          | ID fasilitas                              |
| `name`        | Nama fasilitas                            |
| `description` | Deskripsi                                 |
| `rooms_count` | Jumlah ruangan yang menggunakan fasilitas |
| `created_at`  | Waktu pembuatan                           |

`facilities` pada RoomResource selalu berupa array. Jika ruangan belum memiliki fasilitas, nilainya berupa array kosong.

`rooms_count` hanya muncul pada response fasilitas.

## 4. Bentuk Response

### RoomResource

Contoh:

```json
{
  "id": 3,
  "room_code": "LAB-KOM",
  "room_name": "Laboratorium Komputer",
  "building": "Gedung B",
  "floor": 2,
  "capacity": 30,
  "description": "Lab komputer 30 PC",
  "image": null,
  "status": "available",
  "facilities": [
    {
      "id": 3,
      "name": "AC",
      "description": "Pendingin ruangan",
      "created_at": "..."
    }
  ],
  "created_at": "2026-11-21T10:00:00+08:00"
}
```

### FacilityResource

Contoh:

```json
{
  "id": 3,
  "name": "AC",
  "description": "Pendingin ruangan",
  "rooms_count": 4,
  "created_at": "2026-11-21T10:00:00+08:00"
}
```

List response menggunakan pagination Laravel dan menyediakan `links` serta `meta`.

## 5. Query yang Didukung

### GET `/api/rooms` dan GET `/api/admin/rooms`

| Parameter      | Aturan                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------- |
| `search`       | Opsional, maksimal 100 karakter, mencari berdasarkan `room_code`, `room_name`, dan `building` |
| `status`       | Opsional: `available`, `maintenance`, atau `inactive`                                         |
| `min_capacity` | Opsional, integer 1 sampai 1000                                                               |
| `per_page`     | Opsional, 1 sampai 100, default 10                                                            |
| `page`         | Pagination Laravel                                                                            |

### GET `/api/facilities`

Parameter:

- `search`: mencari nama dan deskripsi fasilitas.
- `per_page`: jumlah data per halaman, default 50.

## 6. Request Body

### POST `/api/rooms`

```json
{
  "room_code": "GD-301",
  "room_name": "Ruang Kuliah 301",
  "building": "Gedung D",
  "floor": 3,
  "capacity": 45,
  "description": "Ruang kelas.",
  "image": null,
  "status": "available",
  "facilities": [1, 3]
}
```

Aturan validasi:

| Field         | Aturan                                                          |
| ------------- | --------------------------------------------------------------- |
| `room_code`   | Wajib saat create, string, maksimal 20 karakter, unik           |
| `room_name`   | Wajib saat create, string, maksimal 255 karakter                |
| `building`    | Wajib saat create, string, maksimal 255 karakter                |
| `floor`       | Opsional, integer 0 sampai 255                                  |
| `capacity`    | Wajib saat create, integer 1 sampai 1000                        |
| `description` | Opsional, string, maksimal 5000 karakter                        |
| `image`       | Opsional, string, maksimal 255 karakter                         |
| `status`      | Opsional, salah satu dari tiga status ruangan                   |
| `facilities`  | Opsional, array ID fasilitas, maksimal 50, tidak boleh duplikat |

Untuk PUT/PATCH, field dapat dikirim sebagian. Jika key `facilities` tidak dikirim, relasi fasilitas tidak berubah. Kirim `"facilities": []` untuk mengosongkan relasi.

### POST `/api/facilities`

- `name`: wajib, unik, maksimal 100 karakter.
- `description`: opsional, maksimal 1000 karakter.

### PUT `/api/facilities/{facility}/rooms`

Contoh request:

```json
{
  "rooms": [1, 2]
}
```

Request ini mengganti seluruh daftar ruangan yang menggunakan fasilitas tersebut.

## 7. Status Code dan Error

| Kondisi                                         | Status HTTP |
| ----------------------------------------------- | ----------- |
| Berhasil membaca data                           | 200         |
| Berhasil membuat data                           | 201         |
| Validasi gagal                                  | 422         |
| Belum login                                     | 401         |
| Login tetapi bukan Admin                        | 403         |
| ID tidak ditemukan                              | 404         |
| Menghapus ruangan yang masih memiliki reservasi | 422         |
| Penghapusan berhasil                            | 200         |

Format validasi Laravel saat ini menggunakan `message` dan `errors`.

Contoh:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "room_name": ["The room name field is required."]
  }
}
```

## 8. Aturan Penghapusan

| Aksi                              | Perilaku                                                       |
| --------------------------------- | -------------------------------------------------------------- |
| Menghapus ruangan                 | Ditolak dengan status 422 jika masih memiliki data reservasi   |
| Menghapus ruangan tanpa reservasi | Relasi pivot dilepas lalu ruangan dihapus                      |
| Menghapus fasilitas               | Relasi pivot dilepas, data ruangan dan reservasi tidak dihapus |

Riwayat reservasi harus tetap dipertahankan.

## 9. Catatan Integrasi untuk Acil

- `GET /api/rooms` dan `GET /api/admin/rooms` memiliki bentuk data yang sama.
- Field nama ruangan adalah `room_name`, bukan `name`.
- Field lokasi menggunakan `building` dan `floor`, bukan `location`.
- Status ruangan: `available`, `maintenance`, `inactive`.
- `facilities` sudah berupa array objek di dalam response ruangan.
- `image` saat ini masih berupa string path, belum berupa proses upload file.
- Gunakan token Sanctum untuk endpoint khusus Admin.
- Halaman katalog dapat mengambil daftar fasilitas tanpa login.

## 10. Hal yang Belum Diimplementasikan

1. Upload file gambar ruangan. Saat ini `image` masih berupa string path.
2. Pengujian HTTP langsung melalui server Laravel menggunakan database MySQL lokal belum dikonfirmasi.
3. Integrasi frontend secara menyeluruh masih perlu diuji oleh Acil.

Catatan: Route dan feature test sudah selesai. Jangan lagi menganggap pendaftaran route sebagai pekerjaan yang menunggu Kenia.

## 11. Catatan untuk Integrasi Tim

- Prema bertanggung jawab atas database, Room API, dan Facility API.
- Kenia bertanggung jawab atas Authentication dan Reservation API.
- Acil bertanggung jawab atas frontend Next.js.
- Rubby membantu integrasi, dokumentasi, dan pengujian bersama.

Perubahan pada `routes/api.php`, controller, middleware, atau komponen milik anggota lain harus dikoordinasikan terlebih dahulu.

## 12. Hasil Pengujian Terakhir

Pengujian backend terakhir:

```text
Tests: 61 passed (175 assertions)
Duration: 2.24s
```

Pengujian mencakup:

- Authentication API
- Turnstile Authentication
- Turnstile Service
- Room API
- Facility API
- Reservation overlap dan relasi model

Hasil ini menunjukkan seluruh pengujian backend yang dijalankan berhasil. Namun, hasil feature test tidak otomatis membuktikan semua endpoint sudah diuji melalui browser atau Postman dengan database MySQL lokal.

---

Dokumen ini mengikuti implementasi backend yang sudah masuk ke branch `main`. Jika terdapat perubahan implementasi, dokumentasi perlu disesuaikan kembali dengan source code terbaru.
