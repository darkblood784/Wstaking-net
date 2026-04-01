export type WhitepaperLocaleKey = "en" | "zhTW" | "id" | "hi";

export type WhitepaperTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type WhitepaperRiskCategory = {
  label: string;
  items: string[];
};

export type WhitepaperSection = {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: WhitepaperTable;
  secondaryTable?: WhitepaperTable;
  flowSteps?: string[];
  flowFooter?: string;
  flowNote?: string;
  riskCategories?: WhitepaperRiskCategory[];
};

export type WhitepaperLocaleContent = {
  heroProtocolLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  heroVersionLine: string;
  tocLabel: string;
  showSectionsLabel: string;
  backToTopLabel: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  sections: WhitepaperSection[];
};

export type WhitepaperVersionKey = "v1.0" | "v1.1";

export const whitepaperContent: Record<WhitepaperLocaleKey, WhitepaperLocaleContent> = {
  en: {
    heroProtocolLabel: "WSTAKING PROTOCOL",
    heroTitle: "Whitepaper",
    heroSubtitle: "Institutional-Grade Hybrid Yield Infrastructure",
    heroVersionLine: "Version 1.0 — Last Updated: 2026-02-12",
    tocLabel: "Table of Contents",
    showSectionsLabel: "Show Sections",
    backToTopLabel: "Back to top",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "This document is informational and does not constitute investment advice. Participation involves risk, including loss of principal.",
    sections: [
      {
        id: "executive-overview",
        number: "01",
        title: "Executive Overview",
        paragraphs: [
          "WStaking is a hybrid on-chain/off-chain yield protocol designed to generate structured returns through exchange-based trading rebate optimization.",
          "The protocol enables users to stake supported stablecoins (USDT, USDC, XLayer_USDT) into an audited smart contract vault.",
          "Capital is allocated to managed exchange sub-accounts where automated high-volume trading strategies generate exchange fee rebates and structured yield.",
        ],
        bullets: [
          "On-chain accounting",
          "Controlled off-chain execution",
          "Automated rebate aggregation",
          "Structured reward distribution",
        ],
      },
      {
        id: "architectural-model",
        number: "02",
        title: "Architectural Model",
        subtitle: "On-Chain Layer / Off-Chain Execution Layer",
        bullets: [
          "On-Chain Layer: Upgradeable smart contract (V1 -> V4), multi-token staking vault, time-based APR logic, claim and unstake functions, and access-control governance.",
          "Off-Chain Execution Layer: Managed exchange master accounts, segregated strategy sub-accounts, automated trading engines, and volume-based execution systems.",
        ],
      },
      {
        id: "revenue-generation-model",
        number: "03",
        title: "Revenue Generation Model",
        paragraphs: [
          "WStaking does not rely on token inflation or user inflow mechanics.",
          "Yield distribution is backed by trading rebate inflows and operational performance.",
        ],
        bullets: [
          "Exchange trading fee rebates",
          "Volume-based liquidity strategies",
          "Strategy execution optimization",
        ],
      },
      {
        id: "smart-contract-evolution-security",
        number: "04",
        title: "Smart Contract Evolution & Security",
        paragraphs: [
          "The protocol evolved through V1-V4 upgrades with enhanced accounting and security.",
        ],
        bullets: [
          "Transparent proxy upgrade pattern",
          "Role-based access control",
          "Pausable mechanism",
          "ReentrancyGuard protection",
          "Stablecoin-only support",
        ],
      },
      {
        id: "staking-mechanics",
        number: "05",
        title: "Staking Mechanics",
        paragraphs: [
          "Supported Assets: BSC_USDT, BSC_USDC, XLayer_USDT.",
          "Gas fees are paid in native chain tokens and do not reduce principal.",
          "Additional staking is supported for positions under the same duration; lock period and APR are recalculated based on the updated total amount.",
          "Withdrawals are processed according to plan rules and may enter a review/settlement period depending on liquidity and operational constraints.",
        ],
        table: {
          title: "Staking Plans",
          headers: ["Duration", "APR Range", "Minimum Stake"],
          rows: [
            ["1 Month", "10% (fixed)", "10"],
            ["3 Months", "12% - 15%", "10"],
            ["6 Months", "15% - 24%", "10"],
            ["12 Months", "24% - 36%", "10"],
          ],
        },
        secondaryTable: {
          title: "Early Unstake Penalty",
          headers: ["Plan", "Penalty Rule"],
          rows: [
            ["1 Month", "10% (fixed)"],
            ["3 Months", "15% down to 10% (time-based)"],
            ["6 Months", "24% down to 10% (time-based)"],
            ["12 Months", "36% down to 10% (time-based)"],
          ],
        },
      },
      {
        id: "fund-flow-architecture",
        number: "06",
        title: "Fund Flow Architecture",
        flowSteps: [
          "User Wallet",
          "WStaking Smart Contract Vault",
          "Fund Allocation Module",
          "Managed Exchange Master Account",
          "Strategy Sub-Accounts / Proxy Accounts",
          "Automated Trading Engine",
          "Trading Volume Execution",
          "Exchange Fee Rebates Generated",
          "Rebate Returned to Proxy Account",
          "Profit Aggregation System",
          "Yield Settlement Engine",
          "Smart Contract Reward Pool",
          "User Claim / Withdrawal Interface",
        ],
        flowFooter: "Complete automated workflow from deposit to withdrawal",
        flowNote: "Diagram is conceptual; exact execution path may vary by exchange/chain.",
      },
      {
        id: "risk-disclosure",
        number: "07",
        title: "Risk Disclosure",
        paragraphs: ["Participation involves risks, and returns are not guaranteed."],
        riskCategories: [
          {
            label: "Smart Contract & Technical Risk",
            items: ["Smart contract risk", "Infrastructure or execution failures"],
          },
          {
            label: "Counterparty & Custody Risk",
            items: ["Exchange counterparty risk", "Custodial execution risk"],
          },
          {
            label: "Liquidity & Market Risk",
            items: ["Liquidity timing risk", "Market volatility impact"],
          },
          {
            label: "Regulatory Risk",
            items: ["Jurisdictional and regulatory changes"],
          },
        ],
      },
      {
        id: "governance-controls",
        number: "08",
        title: "Governance & Controls",
        bullets: [
          "Admin-managed token registry",
          "Proxy upgrade controls",
          "Emergency pause capability",
          "Transparent upgrade history",
        ],
      },
      {
        id: "legal-positioning",
        number: "09",
        title: "Legal Positioning",
        bullets: [
          "WStaking is a hybrid yield infrastructure and not a guaranteed investment instrument.",
          "Users voluntarily participate and acknowledge exposure to blockchain and exchange infrastructure risks.",
          "Nothing in this document constitutes an offer of securities or financial advice.",
        ],
      },
    ],
  },
  zhTW: {
    heroProtocolLabel: "WSTAKING 協議",
    heroTitle: "白皮書",
    heroSubtitle: "機構級混合收益基礎設施",
    heroVersionLine: "Version 1.0 — Last Updated: 2026-02-12",
    tocLabel: "目錄",
    showSectionsLabel: "展開章節",
    backToTopLabel: "返回頂部",
    disclaimerTitle: "免責聲明",
    disclaimerBody:
      "本文件僅供資訊參考，不構成投資建議。參與本協議涉及風險，包含本金損失之可能。",
    sections: [
      {
        id: "executive-overview",
        number: "01",
        title: "執行摘要",
        paragraphs: [
          "WStaking 為混合式鏈上與鏈下收益協議，透過交易所手續費返傭優化機制產生結構化收益。",
          "使用者可將支援之穩定幣（USDT、USDC、XLayer_USDT）質押至經審計的智能合約金庫。",
          "資金將配置至受管理之交易所子帳戶，透過自動化高頻交易策略產生手續費返傭與收益。",
        ],
        bullets: ["鏈上帳務管理", "受控鏈下執行", "自動化返傭彙整", "結構化收益分配"],
      },
      {
        id: "architectural-model",
        number: "02",
        title: "架構模型",
        subtitle: "鏈上層 / 鏈下執行層",
        bullets: [
          "鏈上層：可升級智能合約（V1 -> V4）、多代幣質押金庫、基於時間之 APR 計算邏輯、領取與解除質押功能、權限與治理控制。",
          "鏈下執行層：受管理之交易所主帳戶、策略子帳戶分離、自動化交易引擎、基於交易量之執行系統。",
        ],
      },
      {
        id: "revenue-generation-model",
        number: "03",
        title: "收益生成模型",
        paragraphs: [
          "WStaking 不依賴代幣通膨或新用戶資金流入模式。",
          "收益分配基於實際返傭收入與營運績效。",
        ],
        bullets: ["交易所手續費返傭", "基於交易量之流動性策略", "策略執行優化"],
      },
      {
        id: "smart-contract-evolution-security",
        number: "04",
        title: "智能合約演進與安全",
        paragraphs: ["協議自 V1 至 V4 持續升級，強化帳務與安全機制。"],
        bullets: [
          "透明代理升級模式",
          "角色權限控制",
          "緊急暫停機制",
          "ReentrancyGuard 防護",
          "僅支援穩定幣",
        ],
      },
      {
        id: "staking-mechanics",
        number: "05",
        title: "質押機制",
        paragraphs: [
          "支援資產：BSC_USDT、BSC_USDC、XLayer_USDT。",
          "Gas 費用由鏈上原生代幣支付，不影響質押本金。",
          "同期限方案可追加質押，追加後將依新總額重新計算鎖定期限與 APR。",
          "解除質押結算由智能合約帳務邏輯執行，依方案規則返還本金與可領取收益。",
        ],
        table: {
          title: "質押方案",
          headers: ["期限", "APR 區間", "最低質押"],
          rows: [
            ["1 個月", "10%（固定）", "10"],
            ["3 個月", "12% - 15%", "10"],
            ["6 個月", "15% - 24%", "10"],
            ["12 個月", "24% - 36%", "10"],
          ],
        },
        secondaryTable: {
          title: "提前解除質押罰則",
          headers: ["方案", "罰則規則"],
          rows: [
            ["1 個月", "10%（固定）"],
            ["3 個月", "15% 遞減至 10%（依時間）"],
            ["6 個月", "24% 遞減至 10%（依時間）"],
            ["12 個月", "36% 遞減至 10%（依時間）"],
          ],
        },
      },
      {
        id: "fund-flow-architecture",
        number: "06",
        title: "資金流架構",
        flowSteps: [
          "用戶錢包",
          "WStaking 智能合約金庫",
          "資金分配模組",
          "受管理交易所主帳戶",
          "策略子帳戶／代理帳戶",
          "自動化交易引擎",
          "交易量執行",
          "交易所手續費返傭產生",
          "返傭回流至代理帳戶",
          "收益彙整系統",
          "收益結算引擎",
          "智能合約獎勵池",
          "用戶領取／提領介面",
        ],
        flowFooter: "從存入到提領的完整自動化流程",
      },
      {
        id: "risk-disclosure",
        number: "07",
        title: "風險揭露",
        paragraphs: ["參與本協議涉及風險，且收益不保證。"],
        riskCategories: [
          {
            label: "智能合約與技術風險",
            items: ["智能合約風險", "基礎設施或執行故障風險"],
          },
          {
            label: "對手方與託管風險",
            items: ["交易所對手方風險", "託管與執行風險"],
          },
          {
            label: "流動性與市場風險",
            items: ["流動性時間風險", "市場波動影響"],
          },
          {
            label: "法規風險",
            items: ["司法轄區與法規變動風險"],
          },
        ],
      },
      {
        id: "governance-controls",
        number: "08",
        title: "治理與控制",
        bullets: ["管理員代幣登記控制", "代理升級管理", "緊急暫停機制", "升級歷史透明公開"],
      },
      {
        id: "legal-positioning",
        number: "09",
        title: "法律定位",
        bullets: [
          "WStaking 為混合型收益基礎設施，並非保證收益之投資工具。",
          "用戶自願參與並理解區塊鏈與交易所基礎設施相關風險。",
          "本文件內容不構成任何證券要約或金融建議。",
        ],
      },
    ],
  },
  id: {
    heroProtocolLabel: "PROTOKOL WSTAKING",
    heroTitle: "Kertas Putih",
    heroSubtitle: "Infrastruktur Imbal Hasil Hibrida Kelas Institusional",
    heroVersionLine: "Versi 1.0 — Terakhir diperbarui: 2026-02-12",
    tocLabel: "Daftar Isi",
    showSectionsLabel: "Tampilkan Bagian",
    backToTopLabel: "Kembali ke atas",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "Dokumen ini bersifat informatif dan bukan merupakan nasihat investasi. Partisipasi memiliki risiko, termasuk potensi kehilangan pokok.",
    sections: [
      {
        id: "executive-overview",
        number: "01",
        title: "Ringkasan Eksekutif",
        paragraphs: [
          "WStaking adalah protokol imbal hasil hibrida on-chain/off-chain yang dirancang untuk menghasilkan imbal hasil terstruktur melalui optimasi rebate biaya trading di exchange.",
          "Protokol ini memungkinkan pengguna melakukan staking stablecoin yang didukung (USDT, USDC, XLayer_USDT) ke vault smart contract yang telah diaudit.",
          "Modal dialokasikan ke sub-akun exchange terkelola, di mana strategi trading otomatis ber-volume tinggi menghasilkan rebate biaya exchange dan imbal hasil terstruktur.",
        ],
        bullets: [
          "Akuntansi on-chain",
          "Eksekusi off-chain terkontrol",
          "Agregasi rebate otomatis",
          "Distribusi reward terstruktur",
        ],
      },
      {
        id: "architectural-model",
        number: "02",
        title: "Model Arsitektur",
        subtitle: "Lapisan On-Chain / Lapisan Eksekusi Off-Chain",
        bullets: [
          "Lapisan On-Chain: Smart contract yang dapat di-upgrade (V1 -> V4), vault staking multi-token, logika APR berbasis waktu, fungsi claim/unstake, dan tata kelola kontrol akses.",
          "Lapisan Eksekusi Off-Chain: Akun master exchange terkelola, pemisahan sub-akun strategi, mesin trading otomatis, dan sistem eksekusi berbasis volume.",
        ],
      },
      {
        id: "revenue-generation-model",
        number: "03",
        title: "Model Generasi Pendapatan",
        paragraphs: [
          "WStaking tidak bergantung pada inflasi token atau mekanisme arus masuk pengguna baru.",
          "Distribusi imbal hasil didukung oleh arus masuk rebate trading dan kinerja operasional.",
        ],
        bullets: [
          "Rebate biaya trading exchange",
          "Strategi likuiditas berbasis volume",
          "Optimasi eksekusi strategi",
        ],
      },
      {
        id: "smart-contract-evolution-security",
        number: "04",
        title: "Evolusi Smart Contract & Keamanan",
        paragraphs: [
          "Protokol berkembang melalui upgrade V1-V4 dengan peningkatan akuntansi dan keamanan.",
        ],
        bullets: [
          "Pola upgrade proxy transparan",
          "Kontrol akses berbasis peran",
          "Mekanisme pausability",
          "Perlindungan ReentrancyGuard",
          "Dukungan khusus stablecoin",
        ],
      },
      {
        id: "staking-mechanics",
        number: "05",
        title: "Mekanisme Staking",
        paragraphs: [
          "Aset yang didukung: BSC_USDT, BSC_USDC, XLayer_USDT.",
          "Biaya gas dibayar menggunakan token native chain dan tidak mengurangi pokok.",
          "Penambahan staking didukung untuk posisi dengan durasi yang sama; periode lock dan APR dihitung ulang berdasarkan total jumlah terbaru.",
          "Penarikan diproses sesuai aturan plan dan dapat masuk ke periode review/settlement tergantung likuiditas dan batasan operasional.",
        ],
        table: {
          title: "Plan Staking",
          headers: ["Durasi", "Rentang APR", "Minimum Stake"],
          rows: [
            ["1 Bulan", "10% (tetap)", "10"],
            ["3 Bulan", "12% - 15%", "10"],
            ["6 Bulan", "15% - 24%", "10"],
            ["12 Bulan", "24% - 36%", "10"],
          ],
        },
        secondaryTable: {
          title: "Penalti Early Unstake",
          headers: ["Plan", "Aturan Penalti"],
          rows: [
            ["1 Bulan", "10% (tetap)"],
            ["3 Bulan", "15% turun ke 10% (berbasis waktu)"],
            ["6 Bulan", "24% turun ke 10% (berbasis waktu)"],
            ["12 Bulan", "36% turun ke 10% (berbasis waktu)"],
          ],
        },
      },
      {
        id: "fund-flow-architecture",
        number: "06",
        title: "Arsitektur Aliran Dana",
        flowSteps: [
          "Dompet Pengguna",
          "Vault Smart Contract WStaking",
          "Modul Alokasi Dana",
          "Akun Master Exchange Terkelola",
          "Sub-Akun Strategi / Akun Proxy",
          "Mesin Trading Otomatis",
          "Eksekusi Volume Trading",
          "Rebate Biaya Exchange Dihasilkan",
          "Rebate Dikembalikan ke Akun Proxy",
          "Sistem Agregasi Profit",
          "Mesin Settlement Yield",
          "Pool Reward Smart Contract",
          "Antarmuka Claim / Withdraw Pengguna",
        ],
        flowFooter: "Alur kerja otomatis lengkap dari deposit hingga withdrawal",
        flowNote: "Diagram bersifat konseptual; jalur eksekusi dapat berbeda tergantung exchange/chain.",
      },
      {
        id: "risk-disclosure",
        number: "07",
        title: "Pengungkapan Risiko",
        paragraphs: ["Partisipasi memiliki risiko, dan imbal hasil tidak dijamin."],
        riskCategories: [
          {
            label: "Risiko Smart Contract & Teknis",
            items: ["Risiko smart contract", "Kegagalan infrastruktur atau eksekusi"],
          },
          {
            label: "Risiko Counterparty & Kustodian",
            items: ["Risiko counterparty exchange", "Risiko kustodian dan eksekusi"],
          },
          {
            label: "Risiko Likuiditas & Pasar",
            items: ["Risiko timing likuiditas", "Dampak volatilitas pasar"],
          },
          {
            label: "Risiko Regulasi",
            items: ["Perubahan yurisdiksi dan regulasi"],
          },
        ],
      },
      {
        id: "governance-controls",
        number: "08",
        title: "Tata Kelola & Kontrol",
        bullets: [
          "Registry token dikelola admin",
          "Kontrol upgrade proxy",
          "Kemampuan emergency pause",
          "Riwayat upgrade yang transparan",
        ],
      },
      {
        id: "legal-positioning",
        number: "09",
        title: "Posisi Hukum",
        bullets: [
          "WStaking adalah infrastruktur imbal hasil hibrida dan bukan instrumen investasi dengan hasil yang dijamin.",
          "Pengguna berpartisipasi secara sukarela dan memahami eksposur terhadap risiko infrastruktur blockchain dan exchange.",
          "Tidak ada bagian dari dokumen ini yang merupakan penawaran efek atau nasihat keuangan.",
        ],
      },
    ],
  },
  hi: {
    heroProtocolLabel: "WSTAKING प्रोटोकॉल",
    heroTitle: "श्वेतपत्र",
    heroSubtitle: "संस्थागत-स्तरीय हाइब्रिड यील्ड इंफ्रास्ट्रक्चर",
    heroVersionLine: "संस्करण 1.0 — अंतिम अपडेट: 2026-02-12",
    tocLabel: "विषय सूची",
    showSectionsLabel: "सेक्शन दिखाएं",
    backToTopLabel: "ऊपर जाएँ",
    disclaimerTitle: "अस्वीकरण",
    disclaimerBody:
      "यह दस्तावेज़ केवल जानकारी के लिए है और निवेश सलाह नहीं है। भागीदारी में जोखिम शामिल है, जिसमें मूलधन की हानि भी शामिल है।",
    sections: [
      {
        id: "executive-overview",
        number: "01",
        title: "कार्यकारी अवलोकन",
        paragraphs: [
          "WStaking एक हाइब्रिड on-chain/off-chain यील्ड प्रोटोकॉल है, जिसे एक्सचेंज-आधारित ट्रेडिंग फी रिबेट ऑप्टिमाइज़ेशन के माध्यम से संरचित रिटर्न उत्पन्न करने के लिए डिज़ाइन किया गया है।",
          "यह प्रोटोकॉल उपयोगकर्ताओं को समर्थित स्टेबलकॉइन्स (USDT, USDC, XLayer_USDT) को ऑडिटेड स्मार्ट कॉन्ट्रैक्ट वॉल्ट में स्टेक करने की अनुमति देता है।",
          "पूंजी प्रबंधित एक्सचेंज सब-अकाउंट्स में आवंटित की जाती है, जहाँ ऑटोमेटेड हाई-वॉल्यूम ट्रेडिंग रणनीतियाँ एक्सचेंज फी रिबेट और संरचित यील्ड उत्पन्न करती हैं।",
        ],
        bullets: [
          "On-chain अकाउंटिंग",
          "नियंत्रित off-chain निष्पादन",
          "स्वचालित रिबेट एग्रीगेशन",
          "संरचित रिवॉर्ड वितरण",
        ],
      },
      {
        id: "architectural-model",
        number: "02",
        title: "आर्किटेक्चरल मॉडल",
        subtitle: "On-Chain Layer / Off-Chain Execution Layer",
        bullets: [
          "On-Chain Layer: अपग्रेडेबल स्मार्ट कॉन्ट्रैक्ट (V1 -> V4), मल्टी-टोकन स्टेकिंग वॉल्ट, समय-आधारित APR लॉजिक, claim/unstake फ़ंक्शन्स, और access-control गवर्नेंस।",
          "Off-Chain Execution Layer: प्रबंधित एक्सचेंज मास्टर अकाउंट्स, अलग किए गए स्ट्रेटेजी सब-अकाउंट्स, ऑटोमेटेड ट्रेडिंग इंजन, और वॉल्यूम-आधारित निष्पादन सिस्टम।",
        ],
      },
      {
        id: "revenue-generation-model",
        number: "03",
        title: "राजस्व उत्पन्न मॉडल",
        paragraphs: [
          "WStaking टोकन इन्फ्लेशन या नए उपयोगकर्ता इनफ्लो मैकेनिज़्म पर निर्भर नहीं करता।",
          "यील्ड वितरण ट्रेडिंग रिबेट इनफ्लो और ऑपरेशनल प्रदर्शन पर आधारित है।",
        ],
        bullets: [
          "एक्सचेंज ट्रेडिंग फी रिबेट",
          "वॉल्यूम-आधारित लिक्विडिटी रणनीतियाँ",
          "रणनीति निष्पादन अनुकूलन",
        ],
      },
      {
        id: "smart-contract-evolution-security",
        number: "04",
        title: "स्मार्ट कॉन्ट्रैक्ट विकास और सुरक्षा",
        paragraphs: [
          "प्रोटोकॉल V1-V4 अपग्रेड्स के साथ विकसित हुआ है, जिससे अकाउंटिंग और सुरक्षा मजबूत हुई है।",
        ],
        bullets: [
          "पारदर्शी प्रॉक्सी अपग्रेड पैटर्न",
          "रोल-आधारित एक्सेस कंट्रोल",
          "Pausable मैकेनिज़्म",
          "ReentrancyGuard सुरक्षा",
          "केवल स्टेबलकॉइन सपोर्ट",
        ],
      },
      {
        id: "staking-mechanics",
        number: "05",
        title: "स्टेकिंग मैकेनिक्स",
        paragraphs: [
          "समर्थित एसेट्स: BSC_USDT, BSC_USDC, XLayer_USDT।",
          "गैस फीस native chain tokens में दी जाती है और यह principal को कम नहीं करती।",
          "उसी अवधि के अंतर्गत अतिरिक्त स्टेकिंग समर्थित है; अपडेटेड कुल राशि के आधार पर lock period और APR पुनर्गणना होती है।",
          "निकासी योजना नियमों के अनुसार प्रोसेस होती है और लिक्विडिटी व ऑपरेशनल सीमाओं के आधार पर review/settlement अवधि में जा सकती है।",
        ],
        table: {
          title: "स्टेकिंग योजनाएँ",
          headers: ["अवधि", "APR रेंज", "न्यूनतम स्टेक"],
          rows: [
            ["1 महीना", "10% (स्थिर)", "10"],
            ["3 महीने", "12% - 15%", "10"],
            ["6 महीने", "15% - 24%", "10"],
            ["12 महीने", "24% - 36%", "10"],
          ],
        },
        secondaryTable: {
          title: "अर्ली अनस्टेक पेनल्टी",
          headers: ["योजना", "पेनल्टी नियम"],
          rows: [
            ["1 महीना", "10% (स्थिर)"],
            ["3 महीने", "15% से 10% तक (समय-आधारित)"],
            ["6 महीने", "24% से 10% तक (समय-आधारित)"],
            ["12 महीने", "36% से 10% तक (समय-आधारित)"],
          ],
        },
      },
      {
        id: "fund-flow-architecture",
        number: "06",
        title: "फंड फ्लो आर्किटेक्चर",
        flowSteps: [
          "यूज़र वॉलेट",
          "WStaking स्मार्ट कॉन्ट्रैक्ट वॉल्ट",
          "फंड अलोकेशन मॉड्यूल",
          "प्रबंधित एक्सचेंज मास्टर अकाउंट",
          "स्ट्रेटेजी सब-अकाउंट्स / प्रॉक्सी अकाउंट्स",
          "ऑटोमेटेड ट्रेडिंग इंजन",
          "ट्रेडिंग वॉल्यूम निष्पादन",
          "एक्सचेंज फी रिबेट उत्पन्न",
          "रिबेट प्रॉक्सी अकाउंट में वापस",
          "प्रॉफिट एग्रीगेशन सिस्टम",
          "यील्ड सेटलमेंट इंजन",
          "स्मार्ट कॉन्ट्रैक्ट रिवॉर्ड पूल",
          "यूज़र क्लेम / विदड्रॉल इंटरफ़ेस",
        ],
        flowFooter: "डिपॉज़िट से विदड्रॉल तक पूर्ण स्वचालित वर्कफ़्लो",
        flowNote: "डायग्राम कॉन्सेप्चुअल है; वास्तविक निष्पादन पथ एक्सचेंज/चेन के अनुसार भिन्न हो सकता है।",
      },
      {
        id: "risk-disclosure",
        number: "07",
        title: "जोखिम प्रकटीकरण",
        paragraphs: ["भागीदारी में जोखिम शामिल है, और रिटर्न की गारंटी नहीं है।"],
        riskCategories: [
          {
            label: "स्मार्ट कॉन्ट्रैक्ट और तकनीकी जोखिम",
            items: ["स्मार्ट कॉन्ट्रैक्ट जोखिम", "इन्फ्रास्ट्रक्चर या निष्पादन विफलताएँ"],
          },
          {
            label: "काउंटरपार्टी और कस्टडी जोखिम",
            items: ["एक्सचेंज काउंटरपार्टी जोखिम", "कस्टोडियल निष्पादन जोखिम"],
          },
          {
            label: "लिक्विडिटी और मार्केट जोखिम",
            items: ["लिक्विडिटी टाइमिंग जोखिम", "मार्केट वोलैटिलिटी प्रभाव"],
          },
          {
            label: "नियामकीय जोखिम",
            items: ["क्षेत्राधिकार और नियामकीय परिवर्तन"],
          },
        ],
      },
      {
        id: "governance-controls",
        number: "08",
        title: "गवर्नेंस और कंट्रोल्स",
        bullets: [
          "एडमिन-प्रबंधित टोकन रजिस्ट्री",
          "प्रॉक्सी अपग्रेड कंट्रोल्स",
          "इमरजेंसी पॉज़ क्षमता",
          "पारदर्शी अपग्रेड इतिहास",
        ],
      },
      {
        id: "legal-positioning",
        number: "09",
        title: "कानूनी स्थिति",
        bullets: [
          "WStaking एक हाइब्रिड यील्ड इंफ्रास्ट्रक्चर है, न कि गारंटीड रिटर्न वाला निवेश साधन।",
          "उपयोगकर्ता स्वेच्छा से भाग लेते हैं और ब्लॉकचेन व एक्सचेंज इंफ्रास्ट्रक्चर जोखिम को स्वीकार करते हैं।",
          "इस दस्तावेज़ की कोई भी सामग्री प्रतिभूतियों का प्रस्ताव या वित्तीय सलाह नहीं है।",
        ],
      },
    ],
  },
};

const cloneContent = (
  source: Record<WhitepaperLocaleKey, WhitepaperLocaleContent>,
): Record<WhitepaperLocaleKey, WhitepaperLocaleContent> =>
  JSON.parse(JSON.stringify(source)) as Record<WhitepaperLocaleKey, WhitepaperLocaleContent>;

const createV11Content = (
  source: Record<WhitepaperLocaleKey, WhitepaperLocaleContent>,
): Record<WhitepaperLocaleKey, WhitepaperLocaleContent> => {
  const next = cloneContent(source);
  const upgradeTagPatterns = [
    /V1\s*->\s*V4/g,
    /V1\s*-\s*V4/g,
    /V1\s*至\s*V4/g,
    /V1\s*to\s*V4/gi,
  ];

  const replaceUpgradeTag = (value: string): string => {
    let out = value;
    for (const pattern of upgradeTagPatterns) {
      out = out.replace(pattern, "V1 -> V5");
    }
    return out.replace(/V1-V4/g, "V1-V5");
  };

  const v11SecurityBullets: Record<WhitepaperLocaleKey, string[]> = {
    en: [
      "Stake lookup hardening with hybrid resolver and legacy-safe fallback/backfill.",
      "Improved claim/unstake/add-fund checks for safer hot-wallet balance and allowance handling.",
      "Added ClaimInsufficientHotWalletBalance event for clearer monitoring and alerting.",
      "Improved partial-unstake accounting for more accurate unlocked summary reporting.",
      "Governance actions simplified toward owner-centric operational control.",
    ],
    zhTW: [
      "強化質押索引解析（混合解析與舊資料回填）。",
      "改進 claim/unstake/addFund 的熱錢包餘額與授權安全檢查。",
      "新增 ClaimInsufficientHotWalletBalance 事件，提升監控與告警能力。",
      "優化部分解除質押統計，提升已解鎖摘要一致性。",
      "治理權限路徑簡化，降低運營風險。",
    ],
    id: [
      "Penguatan resolusi indeks stake dengan fallback/backfill aman untuk data legacy.",
      "Pengecekan claim/unstake/addFund diperketat untuk saldo dan allowance hot wallet.",
      "Event ClaimInsufficientHotWalletBalance ditambahkan untuk monitoring yang lebih jelas.",
      "Akuntansi partial-unstake ditingkatkan agar ringkasan unlocked lebih akurat.",
      "Hak tata kelola disederhanakan ke kontrol owner yang lebih jelas.",
    ],
    hi: [
      "हाइब्रिड रिज़ॉल्वर के साथ stake index lookup मजबूत किया गया (legacy fallback/backfill सहित)।",
      "claim/unstake/addFund में hot wallet balance और allowance checks को मजबूत किया गया।",
      "बेहतर मॉनिटरिंग के लिए ClaimInsufficientHotWalletBalance इवेंट जोड़ा गया।",
      "partial unstake accounting सुधारी गई ताकि unlocked summary अधिक सटीक रहे।",
      "governance access paths सरल किए गए ताकि operational risk कम हो।",
    ],
  };

  (Object.keys(next) as WhitepaperLocaleKey[]).forEach((locale) => {
    const content = next[locale];
    content.heroVersionLine = content.heroVersionLine
      .replace(/1\.0/g, "1.1")
      .replace(/2026-02-12/g, "2026-02-26");

    const architectural = content.sections.find((s) => s.id === "architectural-model");
    if (architectural?.bullets) {
      architectural.bullets = architectural.bullets.map(replaceUpgradeTag);
    }

    const evolution = content.sections.find((s) => s.id === "smart-contract-evolution-security");
    if (evolution?.paragraphs) {
      evolution.paragraphs = evolution.paragraphs.map(replaceUpgradeTag);
    }
    if (evolution) {
      evolution.bullets = v11SecurityBullets[locale];
    }
  });

  return next;
};

export const whitepaperVersionContent: Record<
  WhitepaperVersionKey,
  Record<WhitepaperLocaleKey, WhitepaperLocaleContent>
> = {
  "v1.0": whitepaperContent,
  "v1.1": createV11Content(whitepaperContent),
};

export const whitepaperVersionLabels: Record<
  WhitepaperLocaleKey,
  Record<WhitepaperVersionKey, string>
> = {
  en: {
    "v1.0": "Whitepaper v1.0",
    "v1.1": "Whitepaper v1.1",
  },
  zhTW: {
    "v1.0": "白皮書 v1.0",
    "v1.1": "白皮書 v1.1",
  },
  id: {
    "v1.0": "Kertas Putih v1.0",
    "v1.1": "Kertas Putih v1.1",
  },
  hi: {
    "v1.0": "श्वेतपत्र v1.0",
    "v1.1": "श्वेतपत्र v1.1",
  },
};
