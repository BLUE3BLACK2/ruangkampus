# RuangKuliah – Team Development Workflow

## 1. Tujuan

Dokumen ini merupakan panduan kerja bersama bagi seluruh anggota tim dalam mengembangkan proyek RuangKuliah menggunakan Git dan GitHub.

Tujuan penerapan workflow ini adalah:
- Menjaga konsistensi kode dan struktur proyek.
- Menghindari konflik saat menggabungkan pekerjaan antaranggota.
- Memastikan setiap anggota bekerja pada branch masing-masing.
- Menjaga branch `main` tetap stabil.
- Memastikan seluruh perubahan terdokumentasi dan dikomunikasikan kepada tim.

## 2. Pembagian Branch

Setiap anggota wajib mengerjakan tugas pada branch masing-masing.

| Anggota | Branch |
|---|---|
| Rubby | `rubby` |
| Kenia | `kenia` |
| Prema | `feature/prema` |
| Acil | `acil` |
| Branch utama | `main` |

**Ketentuan:**
- Setiap anggota hanya mengerjakan tugas pada branch masing-masing.
- Dilarang mengerjakan atau melakukan push langsung ke `main`.
- Seluruh perubahan harus melalui Pull Request (PR).
- Branch `main` menjadi sumber kode utama yang telah disepakati dan digabungkan oleh tim.

## 3. Persiapan Repository

### 3.1 Clone Repository (Pertama Kali)

Jika belum memiliki repository di komputer, jalankan:

```powershell
cd "D:\Semester 5\TekWeb\UAS"
git clone https://github.com/BLUE3BLACK2/ruangkampus.git ruangkuliah
cd ruangkuliah
```

Jika repository sudah tersedia di komputer, tidak perlu melakukan clone ulang.

### 3.2 Periksa Status Repository

Sebelum mulai bekerja, pastikan kondisi repository:

```powershell
git status
```

Pastikan tidak ada perubahan lokal yang belum disimpan atau perubahan pekerjaan sebelumnya yang belum diselesaikan.

## 4. Masuk ke Branch Masing-Masing

Setiap anggota wajib berpindah ke branch yang menjadi tanggung jawabnya.

Contoh:

**Rubby**
```powershell
git switch rubby
```

**Kenia**
```powershell
git switch kenia
```

**Prema**
```powershell
git switch feature/prema
```

**Acil**
```powershell
git switch acil
```

Jika branch belum tersedia secara lokal, tetapi sudah tersedia di GitHub, gunakan:

```powershell
git fetch origin
git switch --track origin/nama-branch
```

Ganti `nama-branch` dengan branch masing-masing.

Periksa branch aktif:

```powershell
git branch --show-current
```

Pastikan nama branch sudah benar sebelum melanjutkan pekerjaan.

## 5. Sinkronisasi dengan Branch Main

Sebelum mulai mengerjakan tugas, setiap anggota wajib mengambil perubahan terbaru yang sudah digabungkan ke `main`.

Langkah-langkah:

**1. Ambil informasi terbaru dari GitHub.**

```powershell
git fetch origin
```

**2. Pastikan sedang berada di branch masing-masing.**

```powershell
git branch --show-current
```

**3. Gabungkan perubahan terbaru dari `main` ke branch masing-masing.**

```powershell
git merge origin/main
```

Jika proses berhasil, branch masing-masing sudah mendapatkan perubahan terbaru dari `main`.

**4. Push hasil sinkronisasi jika diperlukan.**

```powershell
git push origin nama-branch
```

Contoh untuk Rubby:

```powershell
git push origin rubby
```

Contoh untuk Prema:

```powershell
git push origin feature/prema
```

**Catatan penting:**
- Lakukan sinkronisasi sebelum memulai pekerjaan baru.
- Jangan melakukan merge `main` ketika masih ada perubahan lokal yang belum disimpan.
- Jika terjadi konflik, selesaikan konflik terlebih dahulu sebelum melanjutkan.
- Jangan menggunakan `git reset --hard` atau `git push --force` tanpa koordinasi tim.

## 6. Proses Pengerjaan Tugas

Setelah branch berhasil disinkronkan, anggota dapat mulai mengerjakan tugas masing-masing.

Ketentuan selama pengerjaan:

1. Kerjakan hanya bagian yang menjadi tanggung jawab masing-masing.
2. Ikuti struktur folder, standar penamaan, dan kontrak API proyek.
3. Jangan mengubah file milik anggota lain tanpa koordinasi.
4. Jangan mengubah konfigurasi bersama tanpa persetujuan tim.
5. Pastikan fitur yang dibuat tidak merusak fitur yang sudah tersedia.
6. Lakukan pengujian sebelum mengirimkan perubahan ke GitHub.

Periksa perubahan secara berkala:

```powershell
git status
git diff
```

## 7. Menyimpan Perubahan ke GitHub

Setelah pekerjaan selesai dan sudah diperiksa, lakukan proses commit dan push.

**1. Periksa perubahan.**

```powershell
git status
```

**2. Tambahkan file yang ingin disimpan.**

```powershell
git add .
```

Pastikan file `.env`, `.env.local`, `vendor`, dan `node_modules` tidak ikut dimasukkan.

**3. Buat commit dengan pesan yang jelas.**

```powershell
git commit -m "feat: deskripsi pekerjaan"
```

Contoh:

```powershell
git commit -m "feat: add room management API"
```

**4. Push ke branch masing-masing.**

```powershell
git push origin nama-branch
```

Contoh:

```powershell
git push origin kenia
```

## 8. Membuat Pull Request (PR)

Setelah perubahan berhasil di-push:

1. Buka repository GitHub RuangKuliah.
2. Pilih menu **Pull Requests**.
3. Klik **New Pull Request**.
4. Tentukan branch tujuan dan branch sumber.

Pengaturan:

| Pengaturan | Pilihan |
|---|---|
| Base | `main` |
| Compare | Branch masing-masing |

5. Isi judul PR sesuai pekerjaan.
6. Jelaskan perubahan yang dilakukan.
7. Sertakan hasil pengujian jika tersedia.
8. Klik **Create Pull Request**.

Contoh judul:

```text
feat: implement room management API
```

**Ketentuan PR:**
- Semua anggota wajib membuat PR sebelum perubahan masuk ke `main`.
- Anggota lain melakukan pemeriksaan terhadap perubahan yang diajukan.
- Jika terdapat revisi, lakukan perbaikan pada branch sumber PR.
- PR hanya boleh di-merge setelah mendapatkan persetujuan dan dinyatakan aman untuk digabungkan.

## 9. Sinkronisasi Setelah PR Di-merge

Setelah PR berhasil digabungkan ke `main`, seluruh anggota perlu mengambil perubahan terbaru tersebut.

Lakukan langkah berikut pada branch masing-masing:

```powershell
git fetch origin
git merge origin/main
```

Jika ingin memperbarui branch di GitHub:

```powershell
git push origin nama-branch
```

Dengan demikian, seluruh anggota memiliki kode terbaru yang sudah masuk ke `main`.

## 10. Penanganan Merge Conflict

Jika terjadi konflik saat melakukan merge:

1. Jangan panik atau langsung menghapus perubahan.
2. Periksa file yang mengalami konflik.

```powershell
git status
```

3. Buka file yang mengalami konflik di VS Code.
4. Bandingkan perubahan dari kedua sisi.
5. Diskusikan dengan anggota terkait jika terdapat perubahan pada fitur yang sama.
6. Rapikan dan simpan hasil penyelesaian konflik.
7. Tambahkan file yang sudah diperbaiki.

```powershell
git add .
```

8. Selesaikan proses merge jika diperlukan.

```powershell
git commit
```

9. Pastikan repository kembali dalam kondisi normal.

```powershell
git status
```

Jangan menyelesaikan konflik dengan memilih seluruh perubahan dari satu sisi secara sembarangan karena dapat menghilangkan pekerjaan anggota lain.

## 11. Pelaporan Pekerjaan ke Grup WhatsApp

Setiap anggota wajib melaporkan pekerjaan yang telah dilakukan ke grup WhatsApp RuangKuliah.

Laporan disampaikan setelah menyelesaikan satu bagian pekerjaan, melakukan push, membuat PR, atau menyelesaikan integrasi.

Format laporan:

**LAPORAN PROGRES RUANGKULIAH**

Nama:
Branch:

**Pekerjaan yang diselesaikan:**
- ...

**File atau fitur yang diubah:**
- ...

**Pengujian:**
- ...

**GitHub:**
- Commit:
- Pull Request:

**Kendala atau catatan:**
- ...

Jika pekerjaan belum selesai, anggota tetap wajib menyampaikan progres dan bagian yang masih dikerjakan.

Tujuan pelaporan:
- Memudahkan seluruh anggota mengetahui perkembangan proyek.
- Menghindari pengerjaan fitur yang sama secara bersamaan.
- Mempermudah koordinasi dan integrasi.
- Menjadi dokumentasi perkembangan proyek.

## 12. Aturan Umum Tim

Seluruh anggota wajib mengikuti ketentuan berikut:

1. Selalu bekerja pada branch masing-masing.
2. Selalu melakukan sinkronisasi dengan `origin/main` sebelum memulai pekerjaan baru.
3. Tidak melakukan push langsung ke `main`.
4. Tidak melakukan force push tanpa persetujuan tim.
5. Tidak mengunggah file rahasia seperti `.env` dan API Secret Key.
6. Tidak mengubah struktur database atau kontrak API tanpa koordinasi.
7. Melakukan pengujian sebelum membuat Pull Request.
8. Melakukan pemeriksaan sebelum menerima dan menggabungkan PR.
9. Mengomunikasikan perubahan yang berpengaruh terhadap pekerjaan anggota lain.
10. **Selalu memberikan laporan pekerjaan dan perkembangan terbaru di grup WhatsApp setelah menyelesaikan pekerjaan.**

---

**Dokumen ini menjadi pedoman workflow Git dan koordinasi pengembangan bagi seluruh anggota tim RuangKuliah. Seluruh anggota diharapkan mengikuti prosedur yang telah ditetapkan agar proses pengembangan berjalan terstruktur, konsisten, dan terkoordinasi.**