# Dokumentasi Testing AI Booking Assistant RuangKuliah

Dokumen ini menjelaskan cara menguji fitur **AI Booking Assistant** pada
backend Laravel RuangKuliah menggunakan **Laravel Artisan Tinker** dan
**Postman**.

> **Catatan:** Sesuaikan URL, token, dan data pengujian dengan
> lingkungan lokal. Contoh di bawah menggunakan `http://127.0.0.1:8000`.
> Data analitik yang memiliki `data_source: "demo"` berasal dari data
> simulasi, bukan statistik operasional kampus.

------------------------------------------------------------------------

## 1. Persiapan

### 1.1 Jalankan backend

Buka terminal pada folder backend:

``` powershell
cd D:\Kampus\tekweb\ruangin\ruangkampus\backend
```

Pastikan dependensi dan konfigurasi Laravel siap:

``` bash
composer install
php artisan optimize:clear
php artisan route:list --path=api
```

Jalankan server:

``` bash
php artisan serve
```

Secara default, server tersedia di:

``` text
http://127.0.0.1:8000
```

### 1.2 Periksa konfigurasi AI

Pastikan `.env` backend memiliki konfigurasi berikut. Jangan menuliskan
atau membagikan nilai API key di dokumentasi, screenshot, Git, atau
chat.

``` dotenv
DATIO_BASE_URL=https://bandelbanget.xyz/v1
DATIO_API_KEY=ISI_API_KEY_DI_ENV_LOKAL
DATIO_MODEL_ID=deepseek-v4-flash
```

Nama variabel harus sesuai dengan yang dibaca oleh
`backend/config/services.php`. Pada konfigurasi proyek ini, service
menggunakan:

``` php
'datio' => [
    'base_url' => env('DATIO_BASE_URL'),
    'api_key' => env('DATIO_API_KEY'),
    'model_id' => env('DATIO_MODEL_ID'),
],
```

Setelah mengubah `.env`, jalankan:

``` bash
php artisan optimize:clear
```

### 1.3 Pastikan route AI terdaftar

``` bash
php artisan route:list --path=room-assistant
```

Route yang diharapkan:

  ---------------------------------------------------------------------------------------
  Method                  Endpoint                                Kegunaan
  ----------------------- --------------------------------------- -----------------------
  POST                    `/api/room-assistant/ask`               Mengirim permintaan
                                                                  natural language ke AI

  POST                    `/api/room-assistant/recommendations`   Meminta rekomendasi
                                                                  berdasarkan kriteria
                                                                  terstruktur
  ---------------------------------------------------------------------------------------

Jika route tidak muncul, periksa `backend/routes/api.php` dan import
controller:

``` php
use App\Http\Controllers\RoomAssistantController;
```

Pastikan controller berada di:

``` text
backend/app/Http/Controllers/RoomAssistantController.php
```

dan service berada di:

``` text
backend/app/Services/RoomBookingAssistantService.php
```

Service harus menggunakan namespace:

``` php
namespace App\Services;
```

------------------------------------------------------------------------

## 2. Pengujian menggunakan Artisan Tinker

Tinker digunakan untuk menguji service Laravel secara langsung tanpa
Postman atau frontend.

### 2.1 Buka Tinker

Dari folder `backend`, jalankan:

``` bash
php artisan tinker
```

### 2.2 Pastikan konfigurasi AI terbaca

``` php
config('services.datio.base_url');
config('services.datio.model_id');
filled(config('services.datio.api_key'));
```

Hasil yang diharapkan: - Base URL menunjukkan alamat gateway AI yang
dikonfigurasi. - Model ID menunjukkan `deepseek-v4-flash`. - Pemeriksaan
API key menghasilkan `true`.

Jangan menjalankan perintah yang mencetak nilai API key secara langsung.

### 2.3 Periksa service dapat dibuat oleh Laravel

``` php
$assistant = app(\App\Services\RoomBookingAssistantService::class);
```

Jika tidak muncul exception, Laravel berhasil membuat instance service
beserta dependency-nya.

### 2.4 Uji permintaan bahasa alami

Contoh pengujian:

``` php
$result = $assistant->ask(
    'Saya ingin meminjam ruangan untuk 20 orang pada hari Selasa, 24 November 2026, pukul 13:00 sampai 17:00. Saya membutuhkan AC dan proyektor.'
);
```

Periksa status dan pesan:

``` php
$result['status'];
$result['assistant_message'];
```

Periksa hasil interpretasi AI:

``` php
$result['interpreted_request'];
```

Data yang diharapkan dari interpretasi:

``` php
[
    'reservation_date' => '2026-11-24',
    'start_time' => '13:00',
    'end_time' => '17:00',
    'participant_count' => 20,
    'facilities' => ['AC', 'Proyektor'],
]
```

Periksa analisis tren:

``` php
$result['demand_analysis'];
```

Periksa rekomendasi ruangan:

``` php
$result['recommendations'];
$result['total_recommendations'];
```

Periksa alternatif waktu:

``` php
$result['alternative_times'];
$result['total_alternative_times'];
```

Untuk melihat hasil lengkap:

``` php
$result;
```

### 2.5 Contoh pengujian permintaan lain

``` php
$result2 = $assistant->ask(
    'Saya membutuhkan ruang untuk 35 peserta pada hari Rabu, 2 Desember 2026, pukul 10:00 sampai 12:00. Harus tersedia AC dan proyektor.'
);

$result2['interpreted_request'];
$result2['assistant_message'];
$result2['alternative_times'];
```

Gunakan tanggal pengujian yang sesuai dengan tanggal saat ini dan aturan
validasi proyek. Tanggal lampau mungkin ditolak oleh validasi.

### 2.6 Cara keluar dari Tinker

``` php
exit
```

------------------------------------------------------------------------

## 3. Pengujian menggunakan Postman

Pengujian Postman memastikan endpoint HTTP dapat menerima request dan
mengembalikan response JSON.

### 3.1 Siapkan token autentikasi

Endpoint AI pada proyek ini menggunakan autentikasi Sanctum. Gunakan
token milik akun yang diizinkan oleh middleware route.

Jika route mensyaratkan pengguna login, lakukan login melalui endpoint
login proyek terlebih dahulu dan salin token dari response. Jangan
menyimpan token produksi di dokumentasi atau membagikannya.

### 3.2 Buat request AI Booking Assistant

Buat request baru di Postman dengan konfigurasi:

  Pengaturan      Nilai
  --------------- ------------------------------------------------
  Method          `POST`
  URL             `http://127.0.0.1:8000/api/room-assistant/ask`
  Authorization   Bearer Token
  Token           Token Sanctum akun penguji

Pada tab **Headers**, tambahkan:

  Key              Value
  ---------------- --------------------
  `Accept`         `application/json`
  `Content-Type`   `application/json`

Pada tab **Body**: 1. Pilih `raw`. 2. Pilih format `JSON`. 3. Masukkan
request berikut:

``` json
{
  "message": "Saya ingin meminjam ruangan untuk 20 orang pada hari Selasa, 24 November 2026, pukul 13:00 sampai 17:00. Saya membutuhkan AC dan proyektor."
}
```

Klik **Send**.

### 3.3 Periksa response

Response sukses memiliki struktur umum seperti berikut. Nilai
rekomendasi, angka analisis, dan alternatif dapat berbeda sesuai isi
database dan riwayat reservasi.

``` json
{
  "success": true,
  "data": {
    "status": "success",
    "message": "Ditemukan ruangan yang sesuai dengan kebutuhan Anda.",
    "assistant_message": "Ringkasan hasil analisis dan rekomendasi.",
    "interpreted_request": {
      "reservation_date": "2026-11-24",
      "start_time": "13:00",
      "end_time": "17:00",
      "participant_count": 20,
      "facilities": [
        "AC",
        "Proyektor"
      ]
    },
    "demand_analysis": {},
    "recommendations": [],
    "total_recommendations": 0,
    "alternative_times": [],
    "total_alternative_times": 0
  }
}
```

Contoh di atas merupakan gambaran struktur, bukan nilai response yang
harus sama persis. Jika tidak ada ruangan yang memenuhi kriteria, sistem
dapat mengembalikan status atau pesan berbeda sesuai implementasi
service.

**Pemeriksaan penting pada `interpreted_request`:**

-   `reservation_date` harus `2026-11-24`.
-   `start_time` harus `13:00`.
-   `end_time` harus `17:00`.
-   `participant_count` harus `20`.
-   `facilities` harus memuat `AC` dan `Proyektor`.

Jangan hanya memeriksa HTTP `200 OK`. Pastikan isi `interpreted_request`
sama dengan pesan yang dikirim. Ini membantu mendeteksi kasus ketika
hasil lama atau hasil interpretasi yang keliru muncul kembali.

### 3.4 Memeriksa analisis tren dan alternatif waktu

Pada `demand_analysis`, periksa field berikut jika tersedia:

  -----------------------------------------------------------------------
  Field                               Keterangan
  ----------------------------------- -----------------------------------
  `data_source`                       Sumber data, misalnya `demo` atau
                                      data operasional

  `history_available`                 Apakah data historis mencukupi

  `observed_weeks`                    Jumlah minggu pengamatan

  `requested_period`                  Analisis periode yang diminta

  `busy_periods`                      Periode dengan permintaan relatif
                                      tinggi

  `relatively_quiet_periods`          Periode dengan permintaan relatif
                                      lebih rendah
  -----------------------------------------------------------------------

Pada setiap item `alternative_times`, periksa: - `start_time` dan
`end_time` adalah waktu alternatif. - `demand_comparison` menunjukkan
perbandingan permintaan historis. - `available_room_count` menunjukkan
jumlah ruangan yang lolos pemeriksaan. - `recommendations` berisi
ruangan yang memenuhi kapasitas, fasilitas, dan ketersediaan jadwal.

Alternatif yang ditawarkan harus mempertahankan durasi permintaan awal
dan tetap berada dalam jam operasional yang dikonfigurasi.

> Analisis menggunakan reservasi historis sebagai indikator permintaan.
> Data ini bukan bukti kehadiran peserta atau pengukuran okupansi
> aktual. Jika `data_source` bernilai `demo`, hasilnya masih berdasarkan
> data simulasi.

------------------------------------------------------------------------

## 4. Pengujian endpoint rekomendasi terstruktur

Route berikut tersedia jika ingin menguji rekomendasi tanpa interpretasi
bahasa alami:

``` text
POST /api/room-assistant/recommendations
```

Periksa terlebih dahulu validasi request di:

``` text
backend/app/Http/Controllers/RoomAssistantController.php
```

Gunakan nama field dan format JSON yang benar-benar didefinisikan oleh
method `recommendations()` pada controller. Jangan menebak struktur body
karena kontrak endpoint dapat berbeda dari endpoint `/ask`.

------------------------------------------------------------------------

## 5. Checklist pengujian

Gunakan checklist ini saat melakukan pengujian manual.

### Artisan Tinker

-   [ ] Konfigurasi base URL dan model AI terbaca.
-   [ ] API key terkonfigurasi tanpa mencetak nilainya.
-   [ ] Service `RoomBookingAssistantService` berhasil dibuat.
-   [ ] Pesan natural language berhasil diproses.
-   [ ] Tanggal dan jam hasil interpretasi sesuai input.
-   [ ] Jumlah peserta sesuai input.
-   [ ] Fasilitas yang diminta teridentifikasi.
-   [ ] Analisis tren dikembalikan.
-   [ ] Rekomendasi ruangan memenuhi kapasitas dan fasilitas.
-   [ ] Alternatif waktu memiliki durasi yang sesuai.

### Postman

-   [ ] Backend Laravel berjalan.
-   [ ] Route `/api/room-assistant/ask` terdaftar.
-   [ ] Bearer token valid.
-   [ ] Header `Accept: application/json` terpasang.
-   [ ] Header `Content-Type: application/json` terpasang.
-   [ ] Request menggunakan method `POST`.
-   [ ] HTTP response diterima.
-   [ ] `interpreted_request` sesuai dengan pesan terbaru.
-   [ ] Rekomendasi dan alternatif waktu diperiksa.
-   [ ] Data demo diberi label sebagai data simulasi.

------------------------------------------------------------------------

## 6. Troubleshooting

### A. `Target class [App\Http\Controllers\RoomBookingAssistantService] does not exist`

Penyebab umum: import service salah atau tidak ada.

Pastikan controller mengimpor:

``` php
use App\Services\RoomBookingAssistantService;
```

Bukan:

``` php
use App\Http\Controllers\RoomBookingAssistantService;
```

### B. `Route [login] not defined`

Pastikan request Postman menyertakan:

``` http
Accept: application/json
```

Kemudian pastikan endpoint yang memerlukan autentikasi menggunakan
Bearer token Sanctum yang valid.

### C. HTTP 401 Unauthorized

-   Periksa token.
-   Pastikan token belum kedaluwarsa atau dicabut.
-   Pastikan format Authorization adalah `Bearer <token>`.
-   Pastikan request menggunakan akun yang sudah login.

### D. HTTP 403 Forbidden

Akun yang digunakan tidak memiliki hak akses untuk endpoint tersebut.
Periksa middleware dan role pada route. Jangan mengubah role hanya untuk
menyembunyikan masalah otorisasi.

### E. HTTP 422 Unprocessable Entity

Periksa: - Format JSON. - Field wajib. - Tanggal dan jam. - Jumlah
peserta. - Nama fasilitas. - Aturan validasi di controller/service.

Baca response JSON untuk mengetahui field yang ditolak.

### F. HTTP 500 Internal Server Error

Periksa log Laravel:

``` text
backend/storage/logs/laravel.log
```

Atau jalankan:

``` bash
php artisan optimize:clear
```

Kemudian ulangi request dan baca pesan exception terbaru. Jangan
membagikan API key, token, atau secret saat mengirim screenshot log.

### G. Model AI tidak ditemukan atau gagal terhubung

Periksa konfigurasi:

``` php
config('services.datio.base_url');
config('services.datio.model_id');
filled(config('services.datio.api_key'));
```

Pastikan model ID sesuai model yang tersedia pada gateway. Pada
konfigurasi pengujian proyek ini, model yang berhasil digunakan adalah
`deepseek-v4-flash`.

### H. Hasil interpretasi tidak sesuai dengan pesan terbaru

Bandingkan request dengan `data.interpreted_request` pada response.
Pastikan: - Request yang dikirim memang request terbaru. - Body Postman
tidak memakai data lama. - Controller meneruskan `$request->message` ke
service. - Service memproses hasil respons AI yang baru, bukan nilai
hardcoded atau hasil pengujian sebelumnya.

------------------------------------------------------------------------

## 7. Catatan keamanan dan penggunaan data

1.  Jangan commit `.env` ke Git.
2.  Jangan memasukkan API key, Bearer token, atau secret ke dokumen,
    screenshot, atau laporan.
3.  Gunakan akun pengujian untuk Postman.
4.  Jangan menjalankan seeder data demo di production.
5.  Beri label data simulasi secara jelas.
6.  Jangan menyebut rata-rata reservasi sebagai okupansi atau kehadiran
    aktual.
7.  Jangan menganggap rekomendasi AI sebagai reservasi yang sudah
    dibuat. Pengguna tetap harus melalui proses pengajuan reservasi
    sesuai alur aplikasi.

------------------------------------------------------------------------

## 8. Ringkasan alur pengujian

``` text
Artisan Tinker
    |
    v
Buat instance RoomBookingAssistantService
    |
    v
Kirim pesan natural language
    |
    v
Periksa interpreted_request
    |
    v
Periksa analisis tren, rekomendasi, alternatif
    |
    v
Postman
    |
    v
POST /api/room-assistant/ask
    |
    v
Autentikasi Bearer + JSON body
    |
    v
Periksa HTTP response dan isi data
```

Dengan dua metode tersebut, service dapat diuji secara langsung melalui
Tinker dan diuji melalui jalur HTTP menggunakan Postman sebelum
diintegrasikan ke frontend Next.js.
