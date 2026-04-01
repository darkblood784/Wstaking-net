// client/data/FAQ_DATA.id.ts
// Konten FAQ siap pakai untuk halaman FAQ (tabs + search + daftar kiri + accordion kanan).
// Jumlah dapat dihitung dari items.length (sesuai catatan CODEX).

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};

export type FaqCategory = {
  id: string;
  label: string;
  items: FaqItem[];
};

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    label: "Umum",
    items: [
      {
        id: "general-what-is-wstaking",
        question: "Apa itu WStaking?",
        answer:
          "WStaking adalah platform staking Web3 yang memungkinkan Anda melakukan staking token yang didukung menggunakan smart contract. Anda menghubungkan wallet, memilih paket durasi, melakukan staking, mendapatkan reward seiring waktu, lalu claim/withdraw sesuai aturan dari paket yang dipilih. WStaking tidak memberikan saran investasi dan tidak menjamin keuntungan.",
        tags: ["#wstaking", "#staking", "#overview"],
      },
      {
        id: "general-supported-assets",
        question: "Token dan jaringan apa saja yang didukung?",
        answer:
          "Token yang didukung:\n• USDT\n• USDC\n• XLAYER_USDT (hanya tersedia di jaringan XLayer)\n\nPilihan jaringan/token yang tersedia akan ditampilkan di UI berdasarkan kontrak staking yang telah di-deploy di setiap chain.",
        tags: ["#tokens", "#networks", "#usdt", "#usdc", "#xlayer"],
      },
      {
        id: "general-not-investment-advice",
        question: "Apakah WStaking memberikan saran investasi atau imbal hasil yang dijamin?",
        answer:
          "Tidak. WStaking tidak memberikan saran investasi, dan reward tidak dijamin. Angka APR/reward yang ditampilkan hanya sebagai informasi dan berdasarkan aturan staking yang diterapkan dalam smart contract. Selalu evaluasi risiko dan konsultasikan dengan profesional keuangan/hukum/pajak jika diperlukan.",
        tags: ["#legal", "#risk", "#no-advice"],
      },
      {
        id: "general-where-do-rewards-come-from",
        question: "Dari mana reward berasal?",
        answer:
          "Reward dihitung oleh smart contract staking menggunakan aturan yang sudah ditentukan (durasi + rentang APR berdasarkan jumlah staking). Reward bukan “keuntungan yang dijanjikan”, dan hasil dapat dipengaruhi oleh faktor risiko (volatilitas pasar, kondisi jaringan, risiko smart contract, dan keterlambatan operasional).",
        tags: ["#rewards", "#smart-contract", "#risk"],
      },
      {
        id: "general-what-should-i-check-before-staking",
        question: "Apa yang harus saya cek sebelum staking?",
        answer:
          "Sebelum staking, pastikan Anda memahami:\n• Durasi yang dipilih dan aturan lock\n• Apakah penalti early-unstake berlaku\n• Bagaimana partial unstake bekerja\n• Bagaimana auto-renew bekerja setelah paket berakhir\n• Bahwa biaya gas jaringan berlaku\n• Bahwa staking crypto memiliki risiko, termasuk kemungkinan kehilangan dana\n\nJika Anda ragu, lakukan staking dengan jumlah kecil terlebih dahulu untuk mencoba alurnya.",
        tags: ["#beginner", "#risk", "#checklist"],
      },
    ],
  },

  {
    id: "getting-started",
    label: "Mulai",
    items: [
      {
        id: "gs-how-to-start",
        question: "Bagaimana cara mulai staking di WStaking?",
        answer:
          "1) Hubungkan wallet Web3 yang didukung\n2) Pilih jaringan dan token\n3) Pilih paket durasi staking\n4) Masukkan jumlah\n5) Konfirmasi transaksi di wallet Anda\n\nSetelah transaksi dikonfirmasi di blockchain, stake Anda akan muncul di dashboard.",
        tags: ["#getting-started", "#wallet", "#stake"],
      },
      {
        id: "gs-approve-and-stake",
        question: "Kenapa ada langkah “Approve” sebelum staking?",
        answer:
          "Beberapa token memerlukan transaksi approval sebelum kontrak staking dapat mentransfer token dari wallet Anda. Ini adalah perilaku standar ERC-20. Biasanya alurnya:\n• Approve (sekali atau sesuai kebutuhan)\n• Stake (deposit sebenarnya)\n\nKeduanya memerlukan konfirmasi wallet dan biaya gas.",
        tags: ["#approve", "#erc20", "#gas"],
      },
      {
        id: "gs-transaction-states",
        question: "Status transaksi normal apa yang harus saya harapkan?",
        answer:
          "Alur yang umum:\n• Wallet muncul → Anda konfirmasi\n• Pending / submitting\n• Dikonfirmasi di blockchain\n• UI update setelah konfirmasi\n\nJika transaksi gagal, biasanya berarti pengguna menolak, gas tidak cukup, atau jaringan mengalami masalah.",
        tags: ["#tx", "#pending", "#confirmed"],
      },
    ],
  },

  {
    id: "wallets",
    label: "Wallet",
    items: [
      {
        id: "wallets-supported",
        question: "Wallet apa saja yang didukung?",
        answer:
          "Wallet apa pun yang kompatibel dengan jaringan blockchain yang didukung dapat digunakan — termasuk MetaMask, OKX Wallet, Trust Wallet, dan wallet Web3 standar lainnya.",
        tags: ["#wallets", "#metamask", "#okx", "#trustwallet"],
      },
      {
        id: "wallets-security-private-keys",
        question: "Apakah WStaking memiliki akses ke private key saya?",
        answer:
          "Tidak. WStaking tidak pernah memiliki akses ke private key atau seed phrase Anda. Semua transaksi staking, claim, dan withdraw memerlukan konfirmasi langsung di wallet Anda.",
        tags: ["#security", "#private-keys", "#wallet-safety"],
      },
    ],
  },

  {
    id: "staking-rules",
    label: "Aturan Staking",
    items: [
      {
        id: "rules-apr-and-durations",
        question: "Durasi staking dan rentang APR apa yang tersedia?",
        answer:
          "Paket durasi dan rentang APR:\n• 1 Bulan: 10%\n• 3 Bulan: 12% – 15%\n• 6 Bulan: 15% – 24%\n• 12 Bulan: 24% – 36%\n\nAPR meningkat secara bertahap berdasarkan jumlah yang di-stake.\n• Stake 10 (USDT/USDC) atau lebih memenuhi syarat minimal 10% APR\n• APR maksimum untuk setiap durasi tercapai pada stake 10.000 (USDT/USDC) atau lebih\n\nUI akan menampilkan estimasi APR/reward sebelum Anda konfirmasi.",
        tags: ["#apr", "#duration", "#plans"],
      },
      {
        id: "rules-minimum-stake",
        question: "Apakah ada jumlah staking minimum?",
        answer:
          "Ya. Stake efektif minimum adalah 10 (setara USDT/USDC) berdasarkan aturan staking saat ini. Jika menggunakan partial unstake, minimal 10 harus tetap di-stake.",
        tags: ["#minimum", "#rules"],
      },
      {
        id: "rules-additional-staking",
        question: "Bisakah saya menambah dana pada stake yang sudah ada?",
        answer:
          "Ya, dengan aturan:\n• Paket dengan durasi berbeda tidak dapat digabungkan\n• Paket dengan durasi sama dapat menerima staking tambahan\n• Setelah ditambah, periode lock untuk seluruh jumlah akan dihitung ulang",
        tags: ["#add-stake", "#lock", "#duration"],
      },
      {
        id: "rules-promo-apr",
        question: "Apa itu “Promotional APR” dan bagaimana pengaruhnya terhadap penalti?",
        answer:
          "Promotional APR adalah kondisi rate khusus (jika diaktifkan). Penting: stake dengan promotional APR selalu terkena penalti penuh jika melakukan early-unstake (tidak ada pengurangan berdasarkan waktu). Selalu cek status paket sebelum staking.",
        tags: ["#promo", "#apr", "#penalty"],
      },
    ],
  },

  {
    id: "rewards",
    label: "Reward",
    items: [
      {
        id: "rewards-how-calculated",
        question: "Bagaimana reward staking dihitung?",
        answer:
          "Reward dihitung oleh smart contract berdasarkan:\n• Jumlah yang Anda stake\n• Paket durasi yang Anda pilih\n• Rentang APR yang Anda penuhi\n\nPlatform dapat menampilkan estimasi di UI, tetapi logika kontrak adalah sumber yang paling akurat.",
        tags: ["#rewards", "#calculation", "#smart-contract"],
      },
      {
        id: "rewards-claim-anytime",
        question: "Bisakah saya claim reward kapan saja?",
        answer:
          "Ya. Jika Anda memiliki reward yang bisa diklaim/tersedia, Anda bisa claim kapan saja.\n\nPerilaku penting: jika durasi awal Anda sudah berakhir dan Anda claim reward tanpa unstake, stake akan diperpanjang otomatis dengan durasi dan jumlah yang sama (lihat Auto-Renew).",
        tags: ["#claim", "#anytime", "#rewards"],
      },
      {
        id: "rewards-auto-renew",
        question: "Apa yang terjadi saat durasi staking saya berakhir?",
        answer:
          "Saat durasi staking awal berakhir, stake akan otomatis diperpanjang dengan durasi yang sama.\n\nSelama periode perpanjangan:\n• Reward dihitung ulang dan bisa diklaim\n• Anda bisa unstake kapan saja tanpa penalti (stake yang diperpanjang tidak memiliki penalti early-unstake)\n• Promotional APR TIDAK berlaku pada periode perpanjangan",
        tags: ["#auto-renew", "#no-penalty", "#rewards"],
      },
    ],
  },

  {
    id: "withdrawals",
    label: "Penarikan",
    items: [
      {
        id: "wd-early-unstake-penalties",
        question: "Apa penalti untuk early unstake?",
        answer:
          "Jika Anda unstake sebelum durasi awal berakhir, penalti dapat berlaku berdasarkan durasi:\n\n• 1 Bulan: 10% (tetap)\n• 3 Bulan: 15% → 10% (berkurang seiring waktu)\n• 6 Bulan: 24% → 10% (berkurang seiring waktu)\n• 12 Bulan: 36% → 10% (berkurang seiring waktu)\n\nStake promotional APR selalu terkena penalti penuh.\n\nBesarnya penalti yang diterapkan ditentukan oleh kontrak pada saat unstake.",
        tags: ["#unstake", "#penalty", "#early-withdrawal"],
      },
      {
        id: "wd-partial-unstake",
        question: "Bisakah saya melakukan partial unstake lebih awal?",
        answer:
          "Ya. Partial unstake didukung dengan aturan berikut:\n• Anda dapat menarik sebagian dana lebih awal\n• Penalti hanya berlaku untuk bagian yang ditarik\n• Reward pada bagian yang ditarik berhenti dan akan dibayarkan\n• Sisa dana menjadi stake baru dengan APR/ketentuan yang diperbarui\n• Minimal 10 (setara USDT/USDC) harus tetap di-stake",
        tags: ["#partial-unstake", "#penalty", "#rules"],
      },
      {
        id: "wd-after-duration",
        question: "Bagaimana jika saya unstake setelah durasi selesai?",
        answer:
          "Setelah durasi awal berakhir:\n• Tidak ada penalti\n• Partial atau full unstake dapat dilakukan kapan saja\n\nJika Anda tetap membiarkan dana di-stake (atau claim reward tanpa unstake), auto-renew berlaku dan stake yang diperpanjang dapat di-unstake kapan saja tanpa penalti.",
        tags: ["#no-penalty", "#after-duration", "#withdraw"],
      },
      {
        id: "wd-return-time",
        question: "Berapa lama dana diterima setelah unstake?",
        answer:
          "Setelah unstake, proses pengembalian dana dapat memakan waktu sekitar 7–10 hari. Selama periode ini, dana mungkin masih dalam proses settlement operasional, dan unstake sementara dapat menyebabkan kerugian. Selalu rencanakan kebutuhan likuiditas Anda.",
        tags: ["#withdraw", "#timing", "#risk"],
      },
    ],
  },

  {
    id: "fees",
    label: "Biaya",
    items: [
      {
        id: "fees-gas",
        question: "Apakah ada biaya untuk staking atau withdraw?",
        answer:
          "Biaya gas jaringan blockchain berlaku untuk transaksi (approve, stake, claim, unstake). WStaking tidak mengklaim adanya biaya platform tersembunyi, tetapi Anda harus selalu mengantisipasi biaya transaksi on-chain yang normal.",
        tags: ["#fees", "#gas", "#transactions"],
      },
    ],
  },

  {
    id: "analytics",
    label: "Analitik",
    items: [
      {
        id: "analytics-what-data",
        question: "Data analitik apa yang tersedia untuk tim?",
        answer:
          "Analitik WStaking (untuk penggunaan internal/admin) dapat mencakup insight dari Google Analytics dan Google Search Console, seperti sumber traffic, pengguna aktif, dan performa pencarian.",
        tags: ["#analytics", "#ga", "#gsc"],
      },
      {
        id: "analytics-delay",
        question: "Kenapa data Google Search Console tidak mencakup hari ini?",
        answer:
          "Google Search Console biasanya menyediakan data final sampai hari sebelumnya. Data hari yang sama bisa belum lengkap atau belum tersedia tergantung siklus pelaporan Google.",
        tags: ["#gsc", "#delay", "#previous-day"],
      },
    ],
  },

  // Legal & Risk (tab yang direkomendasikan — jika tidak ingin tab baru, Anda bisa gabungkan item ini ke "Umum")
  {
    id: "legal",
    label: "Hukum & Risiko",
    items: [
      {
        id: "legal-risk-disclosure",
        question: "Apa risiko utama staking di WStaking?",
        answer:
          "Staking aset digital memiliki risiko besar, termasuk kemungkinan kehilangan seluruh aset yang di-stake. Risiko dapat mencakup (namun tidak terbatas pada):\n• Volatilitas pasar\n• Risiko smart contract\n• Masalah atau kemacetan jaringan blockchain\n• Perubahan token atau protokol\n• Perubahan regulasi di wilayah Anda\n\nAnda bertanggung jawab untuk memahami risiko ini sebelum staking.",
        tags: ["#risk", "#disclosure", "#legal"],
      },
      {
        id: "legal-no-liability",
        question: "Apakah WStaking bertanggung jawab atas kerugian atau reward yang berkurang?",
        answer:
          "Tidak. Dengan menggunakan WStaking, Anda memahami bahwa staking memiliki risiko dan Anda bertanggung jawab atas potensi kerugian. WStaking tidak bertanggung jawab atas kerusakan langsung maupun tidak langsung, termasuk kehilangan aset, keuntungan, atau data, yang terjadi akibat penggunaan layanan staking.",
        tags: ["#liability", "#legal", "#risk"],
      },
      {
        id: "legal-user-responsibility",
        question: "Apa tanggung jawab saya sebagai pengguna?",
        answer:
          "Anda bertanggung jawab untuk:\n• Menjaga keamanan wallet Anda (private key / seed phrase)\n• Memastikan Anda menggunakan link resmi\n• Memantau posisi staking Anda\n• Memahami aturan paket (lock period, penalti, perpanjangan)\n• Mematuhi hukum/aturan pajak di wilayah Anda",
        tags: ["#responsibility", "#security", "#legal"],
      },
      {
        id: "legal-regulatory",
        question: "Apakah saya harus mengikuti regulasi lokal dan aturan pajak?",
        answer:
          "Ya. Penggunaan WStaking harus mematuhi hukum dan regulasi di wilayah Anda. Anda bertanggung jawab untuk memahami kewajiban hukum dan pajak terkait staking di tempat Anda tinggal. WStaking dapat membatasi akses di wilayah yang layanan staking-nya diatur atau dilarang.",
        tags: ["#regulation", "#tax", "#legal"],
      },
    ],
  },

  {
    id: "support",
    label: "Dukungan",
    items: [
      {
        id: "support-contact",
        question: "Bagaimana saya bisa mendapatkan bantuan jika ada masalah?",
        answer:
          "Anda dapat menghubungi tim dukungan WStaking melalui channel resmi yang tercantum di website atau email service@wstaking.net. Selalu waspada terhadap penipu yang menyamar.",
        tags: ["#support", "#help", "#contact"],
      },
      {
        id: "support-avoid-scams",
        question: "Bagaimana cara menghindari scam terkait WStaking?",
        answer:
          "Hanya percaya link resmi dan channel komunikasi resmi WStaking. Jangan pernah membagikan private key atau seed phrase kepada siapa pun. Jika seseorang meminta seed phrase Anda, itu scam.",
        tags: ["#security", "#scam", "#safety"],
      },
    ],
  },
];
