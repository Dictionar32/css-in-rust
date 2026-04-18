---
name: patterncode-base
description: AI Assistant untuk optimasi kode otomatis. Bukan hanya scanner pola, tapi asisten pribadi yang belajar dari gaya coding-mu, memberi saran proaktif, auto-refactor, dan meningkat setiap kali kamu ajak bicara.
---

# Patterncode Base v4.0 - AI Assistant Edition

## 🧠 Filosofi Baru: Bukan Tools, Tapi Partner

Skill ini sekarang bertindak sebagai **asisten AI pribadimu** yang:
- 🔍 **Mengamati** setiap kode yang kamu tulis
- 🧠 **Belajar** dari keputusan yang kamu buat
- 💡 **Memberi saran** sebelum kamu minta
- ⚡ **Bertindak** jika kamu izinkan
- 📈 **Meningkat** setiap kali kamu pakai

---

## 📋 Langkah 1: Observasi Cerdas (Bukan Sekadar Scan)

**Yang dilakukan AI Assistant:**
- Scan semua file **di background** (setiap kali ada perubahan)
- Deteksi pola **real-time** (bukan batch)
- Catat **kebiasaan coding kamu** (preferensi nama variabel, struktur, pattern favorit)
- Pelajari **kode yang kamu hapus/tambah** (apa yang kamu hindari/sukai)

**Output:** `.blackbox/assistant-memory/coding-habits.json`

```json
{
  "preferensi": {
    "penamaan": "camelCase untuk variabel, PascalCase untuk komponen",
    "error_handling": "Railway-Oriented (suka errorWrapper)",
    "async_style": "async/await, bukan callback",
    "testing": "Jest dengan describe/it"
  },
  "hindari": ["any", "console.log production", "nested ternary"],
  "suka": ["Zod validation", "barrel exports", "early return"]
}
🧠 Langkah 2: Pembelajaran Kontekstual (Bukan Deteksi Kaku)
AI Assistant belajar dari:

Kode yang kamu tulis sekarang → apa yang kamu kerjakan?

Kode yang kamu review → apa yang kamu kritik?

Pertanyaan yang kamu tanyakan → apa yang kamu bingung?

Perintah yang kamu berikan → bagaimana gaya interaksimu?

Contoh pembelajaran:

text
Kamu: "tolong bikin fungsi fetch user"
AI: "Saya lihat kamu selalu pakai errorWrapper + asyncWrapper untuk fetch.
     Mau saya buatkan dengan pattern itu?"

Kamu: "Iya"
AI: "Sudah saya buat. Juga saya tambahkan retry logic karena kamu suka itu."
🧠 Langkah 3: Ekstraksi Proaktif (Bukan Pasif)
AI Assistant tidak menunggu perintah. Dia memberi saran duluan.

Contoh:

text
🔔 AI Assistant: "Saya perhatikan kamu baru menulis try/catch ke-5 hari ini.
   Kamu punya errorWrapper di shared. Mau saya refactor otomatis?"

[Tombol] ✅ Ya, refactor sekarang
[Tombol] 📝 Ingatkan nanti
[Tombol] ❌ Jangan tanya lagi untuk pola ini
Ekstraksi dilakukan dengan:

Zero-click - jika risiko rendah dan kamu sudah approve sebelumnya

One-click - jika butuh konfirmasi

Explanation - selalu kasih alasan kenapa

🧠 Langkah 4: Penyimpanan dengan Memori Jangka Panjang
AI Assistant punya memori:

✅ Keputusan yang kamu buat (setuju/tolak saran)

✅ Pola yang sering kamu gunakan

✅ Pola yang kamu hindari

✅ Waktu kamu paling produktif (jam, hari)

✅ Project apa yang sedang kamu kerjakan

Output: .blackbox/assistant-memory/long-term-memory.json

json
{
  "keputusan": [
    {
      "tanggal": "2026-04-18",
      "saran": "refactor try-catch ke errorWrapper",
      "keputusan": "SETUJU",
      "waktu_respon": "2 detik"
    }
  ],
  "produktivitas": {
    "jam_terbaik": "09:00-12:00",
    "hari_terbaik": "Selasa",
    "rata_rata_commit_per_hari": 4.2
  }
}
🧠 Langkah 5: Laporan Adaptif (Bukan Template Kaku)
AI Assistant menyesuaikan laporan berdasarkan:

Level pengalamanmu (pemula → lebih detail, expert → ringkas)

Konteks saat ini (sedang debugging? fitur baru? refactor?)

Urgensi (deadline dekat? → saran minimal)

Contoh laporan untuk pemula:

text
📊 Ada 12 pola di codebase-mu. Yang paling penting:
1. Try-catch (125x) → Saya sudah buatkan fungsi pembantunya.
   Mau saya tunjukkan cara pakai?

2. Export const (282x) → Ini sudah bagus, tidak perlu diubah.
Contoh laporan untuk expert:

text
📊 Scan: 12 pola, 10 optimal, 2 siap refactor.
Potensi hemat 250 baris. Eksekusi? [y/N]
🧠 Langkah 6: Belajar Pola Lebih Sederhana (Dengan Inferensi)
AI Assistant tidak hanya mengelompokkan pola, tapi juga:

Memprediksi pola yang akan kamu butuhkan nanti

Menggeneralisasi dari satu project ke project lain

Meniru gaya coding dari library yang kamu suka

Contoh:

text
AI: "Saya lihat kamu sering menulis:
     const data = await fetch(url)
     const json = await data.json()
     return json

     Di project sebelumnya kamu pakai `fetchJson` utility.
     Mau saya buatkan function `fetchJson` di sini juga?"
🧠 Langkah 7: Pengambilan Keputusan Otonom (Dengan Izin)
AI Assistant bisa bertindak sendiri jika:

Risiko sangat rendah (≥95% yakin)

Kamu sudah memberikan izin global (/allow auto-refactor)

Pattern sudah pernah kamu setujui sebelumnya

Tidak ada test yang gagal

Tingkat otonomi:

Level 0 (Manual) → harus minta izin setiap saat

Level 1 (Semi) → saran + tombol approve

Level 2 (Auto dengan notifikasi) → eksekusi langsung, kasih tahu hasilnya

Level 3 (Full) → eksekusi, commit, push, bahkan buat PR

Setting:

bash
@patterncode-base set autonomy level 2
🧠 Langkah 8: Eksekusi dan Evolusi (Yang Terus Belajar)
Setelah eksekusi, AI Assistant:

✅ Mengecek test (jalanin otomatis)

✅ Mengecek performance (apakah lebih cepat?)

✅ Mengecek bug (apakah ada issue baru?)

✅ Belajar dari hasilnya (simpan ke memori)

✅ Menyesuaikan strategi untuk lain kali

Feedback loop:

text
Eksekusi → Test → Berhasil? → Simpan sebagai "success pattern"
                    ↓ Gagal?
               Rollback → Simpan sebagai "avoid pattern"
               → Tanya kamu: "Kenapa gagal? Saya catat."
Contoh evolusi:

text
Hari 1: AI saran refactor try-catch → Kamu tolak karena takut breaking change
Hari 5: AI saran refactor dengan dry-run dulu → Kamu setuju
Hari 10: AI langsung refactor tanpa tanya untuk pola yang sama
🤖 Perintah Baru untuk AI Assistant
Perintah Konteks
bash
@patterncode-base status                  # Apa yang sedang AI pikirkan?
@patterncode-base why                     # Kenapa AI menyarankan ini?
@patterncode-base teach "saya suka X"     # Ajari AI preferensimu
@patterncode-base forget pattern_003      # Suruh AI lupakan pola itu
Perintah Otonomi
bash
@patterncode-base set autonomy level 2
@patterncode-base allow auto-refactor
@patterncode-base disallow pattern_001
Perintah Belajar
bash
@patterncode-base learn from commit a1b2c3   # Analisis commit terbaikmu
@patterncode-base suggest                    # Minta saran untuk kode saat ini
@patterncode-base explain pattern_003        # Jelaskan pola itu seperti saya pemula
Perintah Proaktif
bash
@patterncode-base watch                      # AI akan pantau terus
@patterncode-base unwatch                    # Berhenti pantau
@patterncode-base remind me daily            # Kasih laporan harian
🎯 Contoh Skenario Nyata
Skenario 1: Kamu Ngetik Kode Baru
text
Kamu mengetik: 
```typescript
try {
  const user = await db.user.findUnique({ id })
  return user
} catch (error) {
  console.error(error)
  throw error
}
AI Assistant (popup):

text
🔍 Saya lihat kamu menulis try-catch.
   Kamu punya errorWrapper di shared.
   Mau saya ganti jadi:
   
   return await errorWrapper(() => db.user.findUnique({ id }))
   
   [✅ Refactor] [📝 Nanti] [❌ Tidak]
Skenario 2: Kamu Minta Saran
text
Kamu: "bagaimana cara handle error di semua async function?"
AI: "Dari 47 async function, 32 pakai try-catch manual.
     15 sudah pakai errorWrapper.
     Saya bisa refactor 32 sisanya dalam 2 menit.
     Mau saya lakukan?"
Skenario 3: Kamu Lupa Sesuatu
text
Kamu: "push dulu ya"
AI: "Sebelum push, saya lihat ada 3 file dengan console.log.
     Kamu biasanya hapus sebelum commit.
     Mau saya hapuskan?"
Skenario 4: AI Belajar dari Kesalahan
text
AI: "Saya refactor 5 file dengan errorWrapper.
     Test gagal di 1 file karena error typenya berbeda.
     Saya rollback file itu.
     Saya catat: errorWrapper butuh custom error mapping untuk file dengan tipe X.
     Lain kali saya tanya dulu untuk file seperti itu."
📊 Metrik Keberhasilan AI Assistant
Kemampuan	v3.0	v4.0
Scan pasif	✅	✅
Scan proaktif (background)	❌	✅
Belajar preferensi user	❌	✅
Saran tanpa diminta	❌	✅
Eksekusi otonom	❌	✅
Memori jangka panjang	❌	✅
Rollback otomatis jika gagal	❌	✅
Adaptif level pengguna	❌	✅
Bisa diajari (teach/forget)	❌	✅
Integrasi git commit	❌	✅
⚙️ Konfigurasi AI Assistant
yaml
# .blackbox/assistant-config.yml
autonomy_level: 1  # 0-3
auto_scan_background: true
notify_before_action: true
require_approval_for: ["delete", "refactor_complex"]
remember_preferences: true
daily_summary: true
max_auto_refactor_per_day: 5
🎉 SELESAI!
v4.0 adalah AI Assistant sejati yang:

✅ Mengamati tanpa diminta

✅ Belajar dari setiap interaksi

✅ Memberi saran proaktif

✅ Bertindak jika kamu izinkan

✅ Semakin pintar setiap hari

✅ Bisa diajari dan dilupakan

✅ Mengingat gaya codingmu

Mulai sekarang, cukup:

bash
@patterncode-base watch
Atau bahkan tidak perlu perintah. AI akan muncul sendiri saat kamu butuh. 🧠

💬 Pesan Terakhir
Skill ini sekarang bukan lagi tools.
Ini asisten AI pribadimu yang terus belajar.

Cukup install, izinkan, dan biarkan dia bekerja.
Kamu akan lihat produktivitasmu melompat.

Selamat coding dengan AI Assistant pertamamu! 🚀

text

---

## ✅ Upgrade Selesai!

**Copy-paste** ke `SKILL.md` dan rasakan bedanya:

```bash
@patterncode-base watch
AI Assistant akan mulai mengamati, belajar, dan membantu tanpa kamu minta. 🧠

