# RuangKuliah — AI Analytics API

Dokumentasi kontrak API untuk fitur **Room Usage Analytics** pada dashboard administrator RuangKuliah.

> **Status:** kontrak implementasi berdasarkan controller dan service AI Analytics yang telah diuji secara lokal. Cocokkan kembali contoh respons dengan output API terbaru sebelum menganggap dokumen ini sebagai spesifikasi final untuk production.

## 1. Ringkasan

Fitur ini menyediakan statistik reservasi historis, prediksi permintaan reservasi untuk tujuh hari berikutnya, dan analisis berbantuan DeepSeek.

Arsitektur:

- **Next.js:** menampilkan dashboard Admin dan mengirim request ke API.
- **Laravel:** autentikasi, otorisasi, pengambilan data MySQL, perhitungan prediksi, dan orkestrasi AI.
- **MySQL:** sumber data reservasi dan ruangan.
- **Dattio / DeepSeek:** menghasilkan penjelasan dan rekomendasi dari data agregat yang disediakan Laravel.

Prediksi dihitung oleh `RoomUsagePredictionService` menggunakan metode `same_weekday_moving_average`. DeepSeek tidak menghitung ulang angka prediksi; DeepSeek menjelaskan hasil perhitungan Laravel dan menghasilkan insight.

## 2. Base URL

Local development:

```text
http://127.0.0.1:8000/api
```

Sesuaikan host dan port dengan konfigurasi backend yang sedang berjalan.

## 3. Autentikasi dan otorisasi

Semua endpoint pada dokumen ini berada di belakang middleware:

```text
auth:sanctum
admin
```

Kirim token Sanctum milik pengguna dengan role `admin` pada header:

```http
Authorization: Bearer <SANCTUM_TOKEN>
Accept: application/json
```

Contoh menggunakan `fetch`:

```javascript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/analytics/overview`,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }
);

const result = await response.json();

if (!response.ok) {
  throw new Error(result.message ?? "Request analytics gagal");
}
```

`token` harus berasal dari mekanisme autentikasi aplikasi yang sudah ada. Jangan menaruh token tetap (hard-coded) di source code.

### Matriks akses yang diharapkan

| Kondisi | Hasil |
|---|---:|
| Tidak mengirim token / token tidak valid | `401 Unauthorized` |
| Pengguna terautentikasi dengan role `mahasiswa` atau `dosen` | `403 Forbidden` |
| Pengguna terautentikasi dengan role `admin` | Request diteruskan ke endpoint |

Cloudflare Turnstile digunakan pada proses login sesuai konfigurasi autentikasi. Token Turnstile bukan pengganti token Sanctum dan tidak dikirim pada setiap request Analytics.

## 4. Daftar endpoint

| Method | Endpoint | Kegunaan | Memanggil AI? |
|---|---|---|---|
| `GET` | `/admin/analytics/overview` | Statistik reservasi historis dan ruangan teratas | Tidak |
| `GET` | `/admin/analytics/predictions` | Prediksi reservasi tujuh hari ke depan | Tidak |
| `POST` | `/admin/analytics/insights` | Membuat analisis dan rekomendasi DeepSeek | Ya, jika data historis tersedia |

Semua endpoint di atas menggunakan prefix `/api` pada URL lengkap.

---

## 5. GET `/admin/analytics/overview`

Mengambil ringkasan reservasi yang berstatus `approved` pada periode historis yang digunakan analytics.

### Request

```http
GET /api/admin/analytics/overview
Authorization: Bearer <SANCTUM_TOKEN>
Accept: application/json
```

Tidak memerlukan request body.

### Contoh response

```json
{
  "success": true,
  "data": {
    "historical_period": {
      "start_date": "2026-10-27",
      "end_date": "2026-11-22"
    },
    "data_source": "demo",
    "data_basis": "approved_reservations",
    "total_approved_reservations": 54,
    "total_participants": 972,
    "busiest_day": {
      "date": "2026-11-18",
      "day_name": "Rabu",
      "total_reservations": 3
    },
    "daily_reservations": [
      {
        "date": "2026-10-27",
        "total_reservations": 2
      }
    ],
    "most_reserved_rooms": [
      {
        "room_id": 1,
        "room_code": "R-101",
        "room_name": "Ruang Kelas 101",
        "total_reservations": 12
      }
    ]
  }
}
```

> Angka pada contoh adalah ilustrasi bentuk response; nilai aktual berasal dari database pada saat request dilakukan.

### Keterangan field

| Field | Tipe | Keterangan |
|---|---|---|
| `historical_period` | object | Rentang tanggal historis yang dianalisis. |
| `data_source` | string | `demo`, `mixed`, `operational`, atau `no_data`, sesuai kode deteksi sumber data. |
| `data_basis` | string | Saat ini bernilai `approved_reservations`. |
| `total_approved_reservations` | integer | Jumlah reservasi approved dalam periode. |
| `total_participants` | integer | Jumlah `participant_count` dari reservasi approved. Bukan jumlah kehadiran aktual. |
| `busiest_day` | object atau `null` | Tanggal dengan jumlah reservasi tertinggi pada data harian yang tersedia. |
| `daily_reservations` | array | Jumlah reservasi per tanggal yang memiliki catatan. Tanggal tanpa reservasi tidak otomatis ditambahkan pada array ini. |
| `most_reserved_rooms` | array | Maksimal lima ruangan dengan jumlah reservasi approved tertinggi. |

Nilai `data_source`:

- `demo`: semua reservasi approved dalam periode memiliki kode `DEMO-ANALYTICS-`.
- `mixed`: terdapat reservasi demo dan non-demo.
- `operational`: terdapat reservasi approved dan tidak ada yang memakai prefix kode demo.
- `no_data`: tidak ada reservasi approved dalam periode.

Label `operational` hanya menunjukkan bahwa data bukan data demo berdasarkan pola kode tersebut. Label ini **tidak membuktikan** bahwa reservasi benar-benar digunakan atau peserta benar-benar hadir.

---

## 6. GET `/admin/analytics/predictions`

Mengambil prediksi jumlah reservasi approved untuk tujuh hari kalender berikutnya.

### Request

```http
GET /api/admin/analytics/predictions
Authorization: Bearer <SANCTUM_TOKEN>
Accept: application/json
```

Tidak memerlukan request body.

### Metode perhitungan

Service menggunakan `same_weekday_moving_average`:

1. Untuk setiap tanggal prakiraan, sistem mengambil tanggal dengan hari yang sama pada minggu-minggu sebelumnya.
2. Sistem menghitung rata-rata jumlah reservasi approved dari sampel historis tersebut.
3. Angka prakiraan integer dibulatkan dari rata-rata menggunakan `round()`.
4. Minimal tiga observasi diperlukan agar suatu tanggal diberi status `sufficient`.

Metode ini adalah **peramalan statistik sederhana**, bukan model Machine Learning yang dilatih.

### Contoh response saat data tersedia

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-11-23T06:34:05+00:00",
    "forecast_period": {
      "start_date": "2026-11-24",
      "end_date": "2026-11-30"
    },
    "method": "same_weekday_moving_average",
    "history_weeks": 4,
    "minimum_history_samples": 3,
    "data_basis": "approved_reservations",
    "history_available": true,
    "predictions": [
      {
        "date": "2026-11-24",
        "day_name": "Selasa",
        "predicted_reservations": 2,
        "historical_average": 2.0,
        "history_sample_count": 4,
        "history_samples": [
          { "date": "2026-11-17", "reservations": 2 },
          { "date": "2026-11-10", "reservations": 1 },
          { "date": "2026-11-03", "reservations": 3 },
          { "date": "2026-10-27", "reservations": 2 }
        ],
        "status": "sufficient"
      }
    ]
  }
}
```

Contoh hanya menampilkan satu item prediksi agar ringkas. Response aktual berisi tujuh item.

### Kondisi ketika tidak ada data historis

Jika query tidak menemukan reservasi approved pada periode historis, response berisi:

```json
{
  "success": true,
  "data": {
    "history_available": false,
    "message": "Belum ada reservasi approved dalam periode historis. Prediksi belum dapat dihitung.",
    "predictions": [
      {
        "date": "2026-11-24",
        "day_name": "Selasa",
        "predicted_reservations": null,
        "historical_average": null,
        "history_sample_count": 0,
        "history_samples": [],
        "status": "insufficient_data",
        "reason": "no_approved_reservations"
      }
    ]
  }
}
```

Pada kondisi tersebut, tujuh tanggal akan tetap dikembalikan dan masing-masing memiliki status `insufficient_data`.

### Keterangan field prediksi

| Field | Keterangan |
|---|---|
| `predicted_reservations` | Prediksi integer; `null` jika data tidak tersedia atau tidak memenuhi ketentuan. |
| `historical_average` | Rata-rata historis sebelum pembulatan. |
| `history_sample_count` | Jumlah tanggal historis yang dipakai sebagai observasi. |
| `history_samples` | Tanggal dan jumlah reservasi untuk setiap observasi. |
| `status` | `sufficient` atau `insufficient_data`. |
| `reason` | Alasan tambahan pada kondisi tanpa data historis. |

**Catatan interpretasi:** pada implementasi saat ini, jika terdapat setidaknya satu tanggal historis dengan data approved, tanggal pembanding lain yang tidak memiliki baris reservasi diperlakukan sebagai nol oleh algoritma. Hal ini mengasumsikan pencatatan reservasi telah berjalan pada seluruh tanggal pembanding. Untuk data operasional yang belum memiliki cakupan pencatatan lengkap, hasil perlu ditafsirkan dengan hati-hati.

---

## 7. POST `/admin/analytics/insights`

Meminta DeepSeek menghasilkan analisis dan rekomendasi berdasarkan statistik historis dan prediksi Laravel.

Endpoint ini dapat menggunakan token AI. Frontend sebaiknya hanya memanggilnya ketika Admin menekan tombol **Generate AI Insights** atau **Refresh Analysis**, bukan pada setiap render halaman.

### Request

```http
POST /api/admin/analytics/insights
Authorization: Bearer <SANCTUM_TOKEN>
Accept: application/json
Content-Type: application/json
```

Controller saat ini tidak membaca request body, sehingga body dapat dikosongkan:

```json
{}
```

### Contoh response ketika DeepSeek berhasil

```json
{
  "success": true,
  "data": {
    "status": "success",
    "message": "AI Insights berhasil dibuat.",
    "data_source": "demo",
    "overview": {
      "total_approved_reservations": 54,
      "data_basis": "approved_reservations"
    },
    "prediction": {
      "history_available": true,
      "method": "same_weekday_moving_average",
      "predictions": []
    },
    "insight": {
      "model": "deepseek-v4-flash",
      "content": "## Ringkasan\nAnalisis penggunaan ruangan...",
      "usage": {
        "prompt_tokens": 1820,
        "completion_tokens": 1604,
        "total_tokens": 3424
      }
    }
  }
}
```

Contoh di atas diringkas untuk dokumentasi; nilai aktual mengikuti service dan provider.

### Kondisi ketika data belum cukup

DeepSeek tidak dipanggil apabila `history_available` bernilai `false`. Bentuk data:

```json
{
  "success": true,
  "data": {
    "status": "insufficient_data",
    "message": "Belum tersedia data historis untuk menghasilkan AI Insights.",
    "prediction": {
      "history_available": false,
      "predictions": []
    },
    "insight": null
  }
}
```

### Kondisi ketika layanan AI tidak tersedia

Jika pemanggilan DeepSeek gagal, service mengembalikan status data `ai_unavailable`. Controller saat ini tetap membungkus response dengan `success: true`; frontend harus memeriksa `data.status`, bukan hanya HTTP status atau `success`.

```json
{
  "success": true,
  "data": {
    "status": "ai_unavailable",
    "message": "AI Insights sementara tidak tersedia. Statistik dan prediksi tetap dapat digunakan.",
    "overview": {},
    "prediction": {},
    "insight": null
  }
}
```

---

## 8. Contoh integrasi Next.js

Contoh helper sederhana untuk GET Overview. Berikan token dari mekanisme autentikasi RuangKuliah yang sudah ada.

```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getRoomAnalyticsOverview(token) {
  const response = await fetch(
    `${API_BASE_URL}/admin/analytics/overview`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Gagal mengambil analytics overview");
  }

  return result.data;
}
```

Contoh helper untuk prediksi:

```javascript
export async function getRoomAnalyticsPredictions(token) {
  const response = await fetch(
    `${API_BASE_URL}/admin/analytics/predictions`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Gagal mengambil prediksi");
  }

  return result.data;
}
```

Contoh helper untuk membuat AI Insights:

```javascript
export async function generateRoomAnalyticsInsights(token) {
  const response = await fetch(
    `${API_BASE_URL}/admin/analytics/insights`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Gagal membuat AI Insights");
  }

  return result.data;
}
```

### Rekomendasi perilaku UI

- Muat Overview dan Predictions secara terpisah dari AI Insights.
- Tampilkan status `insufficient_data` sebagai informasi bahwa histori belum mencukupi; jangan tampilkan `null` sebagai angka nol.
- Tampilkan label **Demo Data** apabila `data_source` adalah `demo` atau `mixed`.
- Tampilkan label **AI unavailable** jika `data.status` adalah `ai_unavailable`, tetapi jangan menyembunyikan statistik dan prediksi.
- Sediakan tombol untuk memanggil POST Insights secara eksplisit.
- Tampilkan indikator loading selama request AI berlangsung dan cegah klik berulang.
- Hindari memanggil POST Insights otomatis pada setiap render atau polling.

## 9. Error handling

| HTTP status | Arti umum | Tindakan frontend |
|---:|---|---|
| `200` | Request diproses; periksa `data.status` untuk hasil Insights. | Render data atau status terkait. |
| `401` | Token tidak ada, tidak valid, atau kedaluwarsa. | Arahkan pengguna melalui flow login aplikasi. |
| `403` | Pengguna bukan Admin. | Tampilkan pesan akses ditolak. |
| `422` | Validasi request gagal, jika berlaku. | Tampilkan pesan validasi. |
| `429` | Rate limit terlampaui, khususnya endpoint Insights. | Beri tahu pengguna untuk mencoba lagi setelah jeda. |
| `500` | Kesalahan internal backend. | Tampilkan pesan umum; jangan tampilkan stack trace. |

Endpoint Insights saat ini dapat mengembalikan HTTP `200` dengan `data.status` bernilai `insufficient_data` atau `ai_unavailable`. Frontend harus menangani nilai-nilai tersebut.

## 10. Keamanan dan konfigurasi

- Token Sanctum harus dikirim melalui header `Authorization`.
- Hanya role `admin` yang boleh mengakses endpoint Analytics.
- Secret Dattio/DeepSeek hanya disimpan di `backend/.env` dan dibaca oleh Laravel.
- Jangan pernah mengekspos `AI_API_KEY`, Turnstile secret, atau secret backend lain ke Next.js/browser.
- Jangan memasukkan token Sanctum ke source code atau dokumentasi.
- Turnstile melindungi proses login sesuai konfigurasi autentikasi; Turnstile bukan pengganti Sanctum.
- Endpoint POST Insights menggunakan rate limit sesuai route yang didaftarkan. Konfirmasi konfigurasi aktual dengan `php artisan route:list -v`.
- AI hanya menerima data agregat analytics yang disusun backend, bukan API Key atau kredensial pengguna.

## 11. Pembagian tanggung jawab dan integrasi tim

| Bagian | Tanggung jawab |
|---|---|
| Prediction, DeepSeek, Analytics Service dan Controller | Prema |
| Pendaftaran/integrasi route `routes/api.php` | Koordinasi dengan Kenia |
| Admin Analytics UI di Next.js | Koordinasi dengan Acil |
| Integrasi dan review bersama | Tim RuangKuliah |

Jangan mengganti atau menimpa route authentication dan reservation yang sudah ada ketika mendaftarkan route Analytics.

## 12. Checklist pengujian

- [ ] `GET /api/admin/analytics/overview` dengan token Admin menghasilkan HTTP 200.
- [ ] `GET /api/admin/analytics/predictions` dengan token Admin menghasilkan HTTP 200.
- [ ] `POST /api/admin/analytics/insights` dengan token Admin menghasilkan HTTP 200.
- [ ] Tanpa token menghasilkan HTTP 401.
- [ ] Token mahasiswa menghasilkan HTTP 403.
- [ ] Token dosen menghasilkan HTTP 403.
- [ ] Data kosong ditampilkan sebagai `insufficient_data`, bukan angka prediksi nol.
- [ ] Sumber data demo diberi label yang jelas pada UI.
- [ ] Kegagalan DeepSeek tidak menghilangkan statistik dan prediksi.
- [ ] POST Insights tidak dipanggil otomatis setiap render halaman.
- [ ] Tidak ada API Key, Turnstile secret, atau Bearer Token di frontend atau repository.

---

**Dokumen ini menjelaskan kontrak integrasi AI Analytics.** Jika nama field atau struktur response pada implementasi berubah, perbarui dokumen ini bersama perubahan controller/service agar frontend tetap kompatibel.
