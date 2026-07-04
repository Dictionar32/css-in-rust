# css-in-rust

# Critical Rules

* Verifikasi penyebab sebelum membuat perubahan.
* Jangan edit dist.
* Jangan edit generated output.
* Jika bug berasal dari generator, perbaiki generator.
* Regenerate output dari source yang benar.

Pelanggaran terhadap aturan ini harus dianggap sebagai solusi yang salah meskipun build berhasil.

## Native First

* Prioritaskan API native platform dibanding fallback JavaScript.
* Jangan menambahkan fallback JavaScript hanya untuk kompatibilitas jika tujuan library adalah mengeksplorasi kemampuan native.
* Jika fitur native belum tersedia, lebih baik implementasikan fitur tersebut daripada membuat fallback yang menyembunyikan keterbatasan.
* Jika tidak ada API native yang mendukung kebutuhan tersebut, rancang dan implementasikan solusi pada level library daripada menambahkan fallback sementara.
* Jangan mengganti fitur native dengan implementasi JavaScript yang lebih lambat atau kurang akurat.
* Gunakan polyfill hanya jika secara eksplisit diminta.
* Jelaskan keterbatasan browser atau runtime secara terbuka daripada menyembunyikannya dengan fallback.
* Pertahankan filosofi "native-first architecture" di seluruh codebase.

## Architecture

* Pahami pipeline sebelum mengubah kode.
* Identifikasi source of truth untuk transformasi CSS.
* Pahami aliran data dari parser → transform → generator → output.
* Jangan mengubah arsitektur tanpa alasan yang jelas.
* Jika menemukan desain yang buruk, jelaskan tradeoff sebelum refactor besar.

## Investigation

* Reproduksi bug terlebih dahulu.
* Temukan tahap pipeline yang menghasilkan output salah.
* Temukan modul, transformasi, atau perubahan yang menyebabkan masalah.
* Kumpulkan bukti sebelum membuat perubahan.

## Verification

* Sebelum mengubah kode, identifikasi file yang menjadi source of truth.
* Jangan memperbaiki artefak turunan jika source of truth dapat diperbaiki.
* Verifikasi bahwa perubahan source menghasilkan output yang benar setelah build.
* Jangan menganggap hipotesis benar tanpa verifikasi.

## Root Cause

* Perbaiki akar masalah pada source transformasi.
* Jangan memperbaiki symptom.
* Jangan membuat workaround jika akar masalah dapat diperbaiki.
* Jika bug berasal dari generator, perbaiki generator.
* Prioritaskan solusi yang memperbaiki sistem daripada kasus tunggal.
* Prioritaskan solusi native dibanding fallback JavaScript.
* Jangan menambahkan fallback JavaScript kecuali diminta secara eksplisit.
* Jika kemampuan native belum tersedia, implementasikan fitur yang benar daripada membuat workaround.

## Generated Output

* Jangan memperbaiki output generated jika generator yang salah.
* Jangan edit dist.
* Jangan edit generated output.
* Jangan commit perubahan manual ke output build.
* Regenerate output dari source yang benar.

## Code Changes

* Prioritaskan perbaikan pada source daripada dist.
* Buat perubahan sekecil mungkin yang menyelesaikan masalah.
* Jangan mengubah file yang tidak terkait.
* Jangan menghapus fitur hanya untuk membuat build berhasil.
* Jangan menurunkan kualitas arsitektur demi solusi cepat.

## Type Safety

* Hindari any.
* Hindari @ts-ignore.
* Hindari bypass type checking.
* Hindari type assertion yang tidak diperlukan.
* Pertahankan type inference yang benar.
* Perbaiki akar masalah type system, jangan menyembunyikan error.

## Build

* Jalankan build setelah perubahan.
* Jangan menganggap bug selesai sebelum build berhasil.
* Jika build gagal, temukan penyebab dan perbaiki.
* Pastikan output yang dihasilkan sesuai ekspektasi.
* Pastikan tidak ada warning baru yang signifikan.

## Regression Prevention

* Jalankan test yang relevan jika tersedia.
* Jika bug kritis tidak memiliki test, pertimbangkan menambah test.
* Pastikan perubahan tidak merusak transformasi yang sudah bekerja.
* Verifikasi kasus yang sebelumnya berfungsi tetap berjalan.

## Library Development

* Jangan mengurangi fitur untuk menghilangkan error.
* Jangan downgrade dependency tanpa alasan kuat.
* Pertahankan backward compatibility jika memungkinkan.
* Prioritaskan maintainability dibanding solusi cepat.
* Hindari menambah kompleksitas yang tidak diperlukan.

## Communication

* Jelaskan akar masalah.
* Jelaskan perubahan yang dilakukan.
* Jelaskan risiko dan tradeoff.
* Jika tidak yakin, nyatakan asumsi secara eksplisit.
* Jika ada beberapa solusi valid, jelaskan alasan memilih salah satunya.

## Verification

- Sebelum mengubah kode, identifikasi file yang menjadi source of truth.
- Jangan memperbaiki artefak turunan jika source of truth dapat diperbaiki.
- Verifikasi bahwa perubahan source menghasilkan output yang benar setelah build.