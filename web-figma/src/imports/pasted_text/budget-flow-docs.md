Berikut saya pecah jadi 3 versi yang bisa langsung dipakai.

**1. Deskripsi Produk Formal**

`Budget Flow` adalah aplikasi pengelolaan keuangan pribadi berbasis mobile dan web yang dirancang untuk membantu pengguna mencatat pengeluaran harian, menyusun rencana bulanan, memantau realisasi budget, serta membangun kebiasaan finansial yang lebih sehat secara bertahap. Aplikasi ini tidak diposisikan sebagai dashboard keuangan yang kaku dan teknis, melainkan sebagai pendamping harian yang ramah, ringan, dan mudah dipahami.

Masalah utama yang ingin diselesaikan oleh Budget Flow adalah rendahnya visibilitas pengguna terhadap arus uang sehari-hari. Banyak orang sebenarnya ingin lebih disiplin mengatur keuangan, tetapi pencatatan terasa merepotkan, laporan sulit dibaca, dan budget sering hanya menjadi angka yang tidak benar-benar dipakai dalam pengambilan keputusan. Budget Flow menjawab masalah ini dengan menghubungkan aktivitas paling dasar, yaitu mencatat pengeluaran, dengan konteks yang lebih bermakna seperti sisa budget harian, perbandingan budget versus realisasi, status kesehatan finansial, dan langkah awal yang dipandu secara jelas.

Secara fungsional, Budget Flow menyediakan fitur autentikasi pengguna, onboarding awal, home dashboard, pencatatan expense, pengelolaan kategori budget, monthly planning, pelacakan income, budget comparison, expense history, recurring expenses, pengaturan akun, dan ekspor data. Semua fitur ini dirancang untuk bekerja sebagai satu alur yang saling mendukung, sehingga pengguna tidak hanya menginput data, tetapi juga dibantu memahami kondisi finansialnya dari hari ke hari.

Nilai utama Budget Flow terletak pada pendekatan pengalaman pengguna yang suportif. Aplikasi ini mendorong keteraturan finansial bukan lewat tekanan, melainkan lewat kejelasan, visual yang ramah, dan alur yang membumi. Dengan demikian, Budget Flow cocok diposisikan sebagai produk personal finance yang membantu pengguna membangun ritme, disiplin, dan kesadaran finansial secara konsisten.

**2. Product Requirements Per Fitur**

**Tujuan Produk**

Budget Flow harus membantu pengguna:
- mencatat pengeluaran harian dengan cepat
- memahami hubungan antara budget, pengeluaran, dan pemasukan
- melihat status finansial secara sederhana dan mudah dipahami
- membangun kebiasaan finansial melalui onboarding dan checklist ringan
- mengelola data keuangan pribadi secara terstruktur dalam satu aplikasi

**Target Pengguna**

Target utama:
- mahasiswa
- first-jobber
- pekerja muda
- pengguna umum yang ingin mulai budgeting tanpa aplikasi yang terasa rumit

Karakter target:
- ingin praktis
- tidak suka input yang terlalu panjang
- perlu visual yang mudah dibaca
- butuh bantuan untuk mulai, bukan hanya fitur mentah

**Fitur Inti**

**A. Authentication**
Kebutuhan:
- user bisa daftar akun
- user bisa login
- user session tersimpan
- autentikasi terhubung ke Supabase

Requirement:
- form login dan register sederhana
- validasi email dan password
- feedback error/sukses tampil inline
- akun baru diarahkan ke alur onboarding setelah berhasil masuk

**B. Onboarding**
Kebutuhan:
- user baru harus memahami value utama produk dalam waktu singkat
- onboarding tidak boleh terasa berat

Requirement:
- onboarding muncul setelah login pertama
- terdiri dari 3 slide
- menjelaskan pencatatan expense, pemantauan budget, dan pentingnya kategori/rencana
- bisa di-skip
- status selesai onboarding tersimpan per user
- tutorial bisa dibuka lagi dari Settings

**C. Home Dashboard**
Kebutuhan:
- user harus langsung tahu kondisi keuangan hari ini
- user baru harus tahu harus mulai dari mana

Requirement:
- tampilkan pengeluaran hari ini
- tampilkan sisa budget harian
- tampilkan jumlah transaksi hari ini
- tampilkan starter checklist
- tampilkan ringkasan income bulan berjalan
- tampilkan monthly plan
- tampilkan status penggunaan budget
- tampilkan alert bila ada kondisi yang perlu diperhatikan
- tampilkan daftar transaksi hari ini
- sediakan FAB untuk tambah expense cepat

**D. Expense Tracking**
Kebutuhan:
- user bisa mencatat pengeluaran harian dengan cepat

Requirement:
- tambah expense
- edit expense
- hapus expense
- pilih kategori
- isi nominal
- isi note opsional
- pilih tanggal
- transaksi langsung memengaruhi dashboard dan ringkasan

**E. Category Management**
Kebutuhan:
- user bisa mengelompokkan pengeluaran agar insight lebih bermakna

Requirement:
- tambah kategori
- edit kategori
- atur warna kategori
- atur budget per kategori
- atur prioritas kategori
- kategori tampil konsisten di seluruh modul

**F. Monthly Plan / Budget Plan**
Kebutuhan:
- user punya target acuan untuk membandingkan pengeluaran

Requirement:
- user bisa input income / plan bulanan
- sistem menghitung budget harian dasar
- plan bisa diubah tiap bulan
- plan dipakai untuk alert dan comparison

**G. Income Tracking**
Kebutuhan:
- user bisa melihat sumber uang masuk dan sisa tabungan

Requirement:
- tambah income source
- edit income source
- tambah income transaction
- edit/hapus income transaction
- tampilkan total income
- tampilkan total expense
- tampilkan savings
- tampilkan savings rate
- tampilkan breakdown per sumber income

**H. Budget vs Actual**
Kebutuhan:
- user bisa membandingkan rencana dan realisasi per kategori

Requirement:
- tampilkan total budget
- tampilkan total actual spending
- tampilkan utilization
- tampilkan status on-track / under / over
- tampilkan variance per kategori
- tampilkan rekomendasi sederhana
- bisa pindah bulan

**I. Expense History**
Kebutuhan:
- user bisa menelusuri transaksi lama dan membaca pola pengeluaran

Requirement:
- tampilkan histori per tanggal
- filter kategori
- filter tanggal
- pencarian berdasarkan note
- edit dari list history
- hapus dari list history
- tampilkan total hasil filter dan total nominal

**J. Recurring Expenses**
Kebutuhan:
- user bisa mengelola pengeluaran rutin tanpa input manual berulang

Requirement:
- tambah recurring expense
- edit recurring expense
- archive recurring expense
- dukung frekuensi harian, mingguan, bulanan
- sinkronisasi recurring expense ke bulan aktif
- tampilkan estimasi total recurring bulanan

**K. Settings**
Kebutuhan:
- user bisa mengelola akun, preferensi, kategori, dan data

Requirement:
- tampilkan info akun
- ubah password
- logout
- buka ulang tutorial
- kelola kategori
- export expense ke CSV
- tampilkan versi aplikasi

**L. Navigation**
Kebutuhan:
- pengalaman navigasi harus sesuai platform

Requirement mobile:
- gunakan bottom navigation
- akses tab inti dengan cepat

Requirement web:
- gunakan sidebar kiri
- sediakan blok profil di bagian bawah
- profile block membuka floating menu
- settings diakses dari profile menu, bukan tab utama

**Non-Functional Requirements**
- responsif untuk mobile dan web
- readable di layar sempit
- touch target nyaman
- feedback error/sukses jelas
- empty state tetap informatif
- visual konsisten antar screen
- performa cukup ringan untuk penggunaan harian

**3. Narasi UI/UX Per Screen**

**A. Auth Screen**
Layar auth harus terasa seperti pintu masuk yang ramah. Begitu pengguna membuka aplikasi, mereka langsung melihat identitas visual Budget Flow dengan logo, headline yang menenangkan, dan microcopy yang memberi rasa aman. Ini penting karena pengalaman pertama tidak boleh terasa seperti form administratif biasa.

Bagian atas layar berfungsi sebagai hero section. Di area ini ada logo, nama produk, headline utama, subtitle, dan beberapa pill label seperti `Quick daily tracking` dan `Friendly budget alerts`. Elemen-elemen ini membantu membangun positioning bahwa aplikasi ini simpel dan suportif.

Bagian bawah adalah kartu form utama. Form dibungkus dalam card putih dengan sudut membulat besar, jarak yang lega, dan toggle `Login` / `Daftar` yang dibuat seperti segmented control. Saat user login atau register, feedback tampil inline dalam bentuk banner error atau success, bukan popup yang mengganggu.

Kesan UX yang diinginkan:
- cepat dipahami
- tidak mengintimidasi
- tidak terasa terlalu teknis
- terasa seperti aplikasi yang akan membantu, bukan menilai

**B. Onboarding Screen**
Onboarding dirancang singkat, visual, dan optimistis. Layar ini bukan tutorial teknis panjang, tetapi pengantar yang menjelaskan bagaimana aplikasi ini akan masuk ke rutinitas pengguna.

Setiap slide memiliki:
- badge langkah
- ilustrasi besar
- headline kuat
- deskripsi singkat
- dua mini info card
- indikator progress
- tombol `Kembali`, `Lanjut`, atau `Mulai Pakai App`

Isi narasinya bergerak dari aksi ke pemahaman:
1. catat pengeluaran dengan cepat
2. pahami budget dengan bahasa yang lebih sederhana
3. rapikan kategori dan rencana agar sistem jadi lebih relevan

UX yang dituju:
- user merasa dibimbing
- proses terasa ringan
- ada rasa transisi dari “baru masuk” ke “siap memakai”

**C. Home Screen**
Home adalah layar terpenting dalam produk. Peran utamanya adalah memberi jawaban instan atas pertanyaan: “hari ini kondisi uangku bagaimana?”

Struktur visualnya dimulai dari hero card besar di atas. Di sini pengguna melihat tanggal, headline motivasional, total pengeluaran hari ini, jumlah transaksi, sisa budget harian, dan pintasan ke monthly plan. Card ini harus terasa sebagai pusat orientasi harian.

Di bawahnya, jika pengguna masih baru, muncul kartu checklist `Mulai di sini`. Checklist ini memandu tiga langkah pertama:
- set monthly plan
- rapikan kategori
- tambah expense pertama

Checklist ini penting karena mencegah user merasa kosong setelah onboarding. Produk tidak berhenti di edukasi, tapi langsung mengarahkan tindakan awal.

Setelah itu home menampilkan:
- ringkasan income bulan ini
- monthly plan card
- progress pemakaian budget harian
- mood budget
- alert bulanan/harian
- category alerts
- daftar transaksi hari ini atau empty state

Di pojok bawah ada FAB `+ Add Expense`, yang menjadi aksi tercepat dan paling penting.

UX yang diinginkan:
- halaman mudah discan
- informasi utama langsung terlihat
- empty state tetap terasa hidup
- user tahu apa yang harus dilakukan berikutnya

**D. Budget vs Actual Screen**
Layar ini fokus pada disiplin dan evaluasi. Pengguna datang ke sini bukan untuk input, tapi untuk membandingkan rencana dan realisasi.

Di bagian atas ada hero card yang menjelaskan konteks layar. Di bawahnya ada navigasi bulan. Setelah itu, pengguna melihat dua summary card: total budget dan total spent. Ini dilanjutkan dengan card utilization yang menunjukkan persentase penggunaan budget dan jumlah kategori yang under, on track, atau over.

Bagian rekomendasi berfungsi seperti insight ringan, bukan analisis keuangan berat. Setelah itu baru masuk ke breakdown kategori satu per satu, lengkap dengan variance, status, usage bar, dan angka actual vs budget.

UX yang diinginkan:
- pengguna cepat tahu kondisi bulan ini
- per kategori mudah dibaca
- warning terasa jelas tapi tidak agresif

**E. Income Tracking Screen**
Screen income membantu pengguna memahami sumber uang masuk, total pemasukan, serta sisa yang benar-benar tersimpan.

Bagian atas terdiri dari hero card dan dua tombol aksi utama:
- tambah income transaction
- tambah income source

Setelah memilih bulan, user melihat:
- total income
- total expenses
- savings
- savings rate
- quick card untuk mencatat income secara cepat
- list breakdown per sumber income
- list sumber income
- transaksi income terbaru

UX yang diinginkan:
- income tidak terasa terpisah dari budgeting
- pengguna merasa semua arus uang masih dalam satu ekosistem
- informasi cukup ringkas untuk dibaca cepat

**F. Expense History Screen**
History berfungsi sebagai area baca ulang dan perapihan data. Screen ini harus terasa lebih fungsional, tapi tetap tidak berat.

Bagian atas punya hero card sebagai penjelas layar. Lalu ada calendar picker, informasi tanggal yang sedang ditampilkan, tombol reset/show all, dan filter kategori serta pencarian note. Di bawahnya ada ringkasan jumlah hasil dan total nominal.

List expense ditampilkan per section tanggal. Setiap transaksi bisa ditap untuk edit dan long-press untuk delete. Ketika data kosong atau filter terlalu sempit, empty state harus tetap informatif.

UX yang diinginkan:
- pencarian transaksi terasa praktis
- struktur data mudah dipahami
- editing data lama tidak bikin takut

**G. Recurring Expenses Screen**
Recurring screen dibuat untuk membantu user yang punya pengeluaran rutin seperti langganan, cicilan, atau tagihan tetap.

Layar ini diawali hero card, lalu dua aksi utama:
- tambah recurring
- sync month

Jika ada data, user melihat total recurring bulanan sebagai ringkasan. Lalu di bawahnya ada daftar item aktif dengan informasi kategori, frekuensi, hari tertentu untuk monthly item, nominal, dan batas akhir jika ada.

UX yang diinginkan:
- recurring terasa seperti alat penghemat tenaga
- user paham bahwa pengeluaran rutin bisa lebih terkontrol
- sinkronisasi bulanan terasa mudah, bukan teknis

**H. Settings Screen**
Settings dirancang sebagai ruang pengaturan yang tetap terasa hangat, bukan halaman utilitas dingin.

Bagian atas memakai hero card dengan ringkasan kategori aktif dan total budget kategori. Ini membuat Settings tetap terasa terhubung dengan konteks keuangan, bukan sekadar menu sistem.

Isi screen dibagi menjadi beberapa section:
- Account
- Preferences
- Categories
- Data
- About

Area kategori menjadi salah satu bagian paling penting karena di sinilah user merapikan struktur budgeting-nya. Export CSV memberi rasa kontrol terhadap data pribadi. Tombol `Lihat Tutorial Lagi` juga menjaga agar pengguna bisa kembali belajar kapan saja.

UX yang diinginkan:
- pengaturan terasa rapi
- akun dan data terasa aman
- pengelolaan kategori mudah ditemukan

**I. Navigasi Mobile dan Web**
Pada mobile, pengalaman dibuat sederhana dengan bottom tab navigation. Ini menjaga kebiasaan penggunaan satu tangan dan cocok untuk penggunaan cepat sehari-hari.

Pada web, navigasi diubah menjadi sidebar kiri agar aplikasi tidak terasa seperti tampilan ponsel yang dilebarkan. Sidebar berisi menu utama seperti Home, Budget, Income, History, Repeat, dan Shop. Di bagian bawah ada blok profil yang membuka floating profile menu berisi:
- informasi akun
- status finansial
- edit profile
- settings
- logout

UX yang diinginkan:
- mobile terasa ringkas dan cepat
- web terasa lebih desktop-native
- account actions tidak bercampur dengan konten utama

Kalau kamu mau, saya bisa lanjutkan ini jadi dokumen siap pakai dalam format:
- `proposal produk`
- `BAB analisis/perancangan skripsi`
- `PRD profesional`
- `narasi presentasi per slide`