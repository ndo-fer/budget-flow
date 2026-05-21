# Budget Flow Android Wrapper

Project ini sekarang sudah punya wrapper Android berbasis Capacitor di folder `android/`.

## Yang sudah disiapkan

- Package Capacitor sudah terpasang
- Config ada di `capacitor.config.json`
- Native Android project sudah dibuat di `android/`
- Asset web terbaru bisa disalin ke Android lewat script npm

## Script yang tersedia

- `npm run android:copy`
  Menyalin asset web yang sudah dibuild ke project Android

- `npm run android:sync`
  Build web lalu sync ke Android

- `npm run android:open`
  Membuka project Android di Android Studio

## Kondisi mesin saat terakhir dicek

- `gradle` tersedia
- Android Studio terdeteksi di `C:\Program Files\Android\Android Studio`
- JDK 20 tersedia di `C:\Program Files\Java\jdk-20`
- Build APK belum berhasil karena proses download dependency Android/Gradle mentok `There is not enough space on the disk`
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` belum terset
- `adb` belum ada di `PATH`

## Supaya APK bisa dibuild

1. Pastikan ruang disk kosong cukup besar, aman kalau sediakan beberapa GB
2. Pasang atau aktifkan Android SDK
3. Set environment variable:
   - `ANDROID_SDK_ROOT`
   - `ANDROID_HOME`
4. Tambahkan `platform-tools` ke `PATH` supaya `adb` terbaca
5. Gunakan JDK modern, minimal Java 17; di mesin ini JDK 20 sudah ada
6. Jalankan:

```bash
npm run android:sync
```

7. Lalu build dari Android Studio atau dari folder `android/`

```bash
gradlew.bat assembleDebug
```

## Catatan

Karena basis app ini tetap web-responsive yang dibungkus native shell, UI mobile yang sekarang jauh lebih dekat ke kebutuhan Android dibanding versi desktop. Kalau nanti mau benar-benar terasa native, tahap berikutnya biasanya fokus ke:

- splash screen dan app icon
- status bar / safe area
- gesture dan modal behavior mobile
- push notifications native
- share/export flow yang lebih cocok untuk Android
