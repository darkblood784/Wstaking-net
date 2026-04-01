// client/data/FAQ_DATA.zh.ts
// FAQ 頁面可直接使用的內容（tabs + search + 左側列表 + 右側摺疊面板）。
// 數量可由 items.length 計算（依 CODEX 註記）。

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
    label: "一般",
    items: [
      {
        id: "general-what-is-wstaking",
        question: "什麼是 WStaking？",
        answer:
          "WStaking 是一個 Web3 質押平台，讓您可以透過智能合約質押支援的代幣。您只需連接錢包、選擇期限方案、進行質押，便可隨時間獲得獎勵，並依所選方案規則進行領取/提領。WStaking 不提供投資建議，也不保證獲利。",
        tags: ["#wstaking", "#staking", "#overview"],
      },
      {
        id: "general-supported-assets",
        question: "支援哪些代幣與網路？",
        answer:
          "支援代幣：\n• USDT\n• USDC\n• XLAYER_USDT（僅在 XLayer 網路可用）\n\n可用的網路/代幣選項會依各鏈上部署的質押合約，在 UI 中顯示。",
        tags: ["#tokens", "#networks", "#usdt", "#usdc", "#xlayer"],
      },
      {
        id: "general-not-investment-advice",
        question: "WStaking 是否提供投資建議或保證報酬？",
        answer:
          "不會。WStaking 不提供投資建議，獎勵也不保證。任何顯示的 APR/獎勵數據僅供參考，並以智能合約中實作的質押規則為準。請務必評估風險，如有需要請諮詢專業的金融/法律/稅務顧問。",
        tags: ["#legal", "#risk", "#no-advice"],
      },
      {
        id: "general-where-do-rewards-come-from",
        question: "獎勵從哪裡來？",
        answer:
          "獎勵由質押智能合約依預設規則計算（期限 + 依金額變動的 APR 區間）。獎勵並非「保證獲利」，結果可能受到多種風險因素影響（市場波動、網路狀況、智能合約風險、以及營運延遲等）。",
        tags: ["#rewards", "#smart-contract", "#risk"],
      },
      {
        id: "general-what-should-i-check-before-staking",
        question: "質押前我應該確認哪些事項？",
        answer:
          "質押前請務必了解：\n• 所選期限與鎖倉規則\n• 是否適用提前解鎖罰則\n• 部分解鎖如何運作\n• 方案結束後自動續約如何運作\n• 交易需要支付網路 Gas 費\n• 加密資產質押有風險，包含可能損失資金\n\n若不確定，建議先用小額質押測試流程。",
        tags: ["#beginner", "#risk", "#checklist"],
      },
    ],
  },

  {
    id: "getting-started",
    label: "開始使用",
    items: [
      {
        id: "gs-how-to-start",
        question: "如何在 WStaking 開始質押？",
        answer:
          "1) 連接支援的 Web3 錢包\n2) 選擇網路與代幣\n3) 選擇質押期限方案\n4) 輸入金額\n5) 在錢包中確認交易\n\n交易在鏈上確認後，您的質押將會顯示在儀表板中。",
        tags: ["#getting-started", "#wallet", "#stake"],
      },
      {
        id: "gs-approve-and-stake",
        question: "為什麼質押前會出現「Approve」步驟？",
        answer:
          "某些代幣在質押前，需要先進行授權交易（Approve），讓質押合約可以從您的錢包轉移代幣。這是標準的 ERC-20 行為。通常流程為：\n• Approve（一次或依需求）\n• Stake（實際存入）\n\n兩個步驟都需要錢包確認並支付 Gas 費。",
        tags: ["#approve", "#erc20", "#gas"],
      },
      {
        id: "gs-transaction-states",
        question: "正常交易流程會出現哪些狀態？",
        answer:
          "一般流程為：\n• 錢包跳出 → 您確認交易\n• Pending / submitting\n• 鏈上確認完成\n• 確認後 UI 更新\n\n若交易失敗，通常原因是：使用者拒絕、Gas 不足，或網路出現問題。",
        tags: ["#tx", "#pending", "#confirmed"],
      },
    ],
  },

  {
    id: "wallets",
    label: "錢包",
    items: [
      {
        id: "wallets-supported",
        question: "支援哪些錢包？",
        answer:
          "任何與支援的區塊鏈網路相容的錢包都可使用 — 包含 MetaMask、OKX Wallet、Trust Wallet，以及其他標準 Web3 錢包。",
        tags: ["#wallets", "#metamask", "#okx", "#trustwallet"],
      },
      {
        id: "wallets-security-private-keys",
        question: "WStaking 會取得我的私鑰嗎？",
        answer:
          "不會。WStaking 永遠無法取得您的私鑰或助記詞。所有質押、領取獎勵與提領交易，都必須由您在錢包中明確確認。",
        tags: ["#security", "#private-keys", "#wallet-safety"],
      },
    ],
  },

  {
    id: "staking-rules",
    label: "質押規則",
    items: [
      {
        id: "rules-apr-and-durations",
        question: "有哪些質押期限與 APR 區間？",
        answer:
          "期限方案與 APR 區間：\n• 1 個月：10%\n• 3 個月：12% – 15%\n• 6 個月：15% – 24%\n• 12 個月：24% – 36%\n\nAPR 會依質押金額逐步提升。\n• 質押 10（USDT/USDC）或以上可至少獲得 10% APR\n• 每個期限的最高 APR，於質押 10,000（USDT/USDC）或以上達成\n\n在您確認交易前，UI 會顯示預估 APR/獎勵。",
        tags: ["#apr", "#duration", "#plans"],
      },
      {
        id: "rules-minimum-stake",
        question: "是否有最低質押金額？",
        answer:
          "有。依目前質押規則，最低有效質押金額為 10（USDT/USDC 等值）。若使用部分解鎖，至少需保留 10 仍在質押中。",
        tags: ["#minimum", "#rules"],
      },
      {
        id: "rules-additional-staking",
        question: "我可以在現有質押中追加資金嗎？",
        answer:
          "可以，但需符合以下規則：\n• 不同期限方案不可合併\n• 相同期限方案可追加質押\n• 追加後，整體金額的鎖倉期限將重新計算",
        tags: ["#add-stake", "#lock", "#duration"],
      },
      {
        id: "rules-promo-apr",
        question: "什麼是「Promotional APR」？它會如何影響罰則？",
        answer:
          "Promotional APR 是一種特殊利率條件（啟用時適用）。重要提醒：Promotional APR 質押若提前解鎖，將一律適用全額罰則（不會依時間降低）。請在質押前務必確認方案狀態。",
        tags: ["#promo", "#apr", "#penalty"],
      },
    ],
  },

  {
    id: "rewards",
    label: "獎勵",
    items: [
      {
        id: "rewards-how-calculated",
        question: "質押獎勵如何計算？",
        answer:
          "獎勵由智能合約依以下因素計算：\n• 您的質押金額\n• 您選擇的期限方案\n• 您符合的 APR 區間\n\n平台可能在 UI 顯示預估值，但智能合約邏輯才是最終依據。",
        tags: ["#rewards", "#calculation", "#smart-contract"],
      },
      {
        id: "rewards-claim-anytime",
        question: "我可以隨時領取獎勵嗎？",
        answer:
          "可以。如果您有可領取/可用的獎勵，隨時都能領取。\n\n重要行為：若原本期限已結束，您在未解鎖的情況下領取獎勵，質押將以相同期限與金額自動續約（請參考 Auto-Renew）。",
        tags: ["#claim", "#anytime", "#rewards"],
      },
      {
        id: "rewards-auto-renew",
        question: "我的質押期限結束後會發生什麼？",
        answer:
          "當原本的質押期限結束後，質押將自動以相同期限續約。\n\n在續約期間：\n• 獎勵會重新計算並可領取\n• 您可隨時解鎖且不會有罰則（續約質押不適用提前解鎖罰則）\n• Promotional APR 不適用於續約期間",
        tags: ["#auto-renew", "#no-penalty", "#rewards"],
      },
    ],
  },

  {
    id: "withdrawals",
    label: "提領",
    items: [
      {
        id: "wd-early-unstake-penalties",
        question: "提前解鎖會有哪些罰則？",
        answer:
          "若您在原本期限結束前解鎖，可能會依期限收取罰則：\n\n• 1 個月：10%（固定）\n• 3 個月：15% → 10%（隨時間降低）\n• 6 個月：24% → 10%（隨時間降低）\n• 12 個月：36% → 10%（隨時間降低）\n\nPromotional APR 質押一律適用全額罰則。\n\n實際罰則比例由您解鎖當下的智能合約決定。",
        tags: ["#unstake", "#penalty", "#early-withdrawal"],
      },
      {
        id: "wd-partial-unstake",
        question: "我可以提前部分解鎖嗎？",
        answer:
          "可以。部分解鎖支援以下規則：\n• 可提前提領部分資金\n• 罰則僅針對提領部分\n• 提領部分的獎勵將停止並結算發放\n• 剩餘金額將成為新的質押，並更新 APR/條款\n• 至少需保留 10（USDT/USDC 等值）仍在質押中",
        tags: ["#partial-unstake", "#penalty", "#rules"],
      },
      {
        id: "wd-after-duration",
        question: "若在期限結束後解鎖會怎樣？",
        answer:
          "在原本期限結束後：\n• 不會有罰則\n• 可隨時部分或全部解鎖\n\n若您持續讓資金維持質押（或在未解鎖情況下領取獎勵），會啟用自動續約，續約後的質押可隨時解鎖且無罰則。",
        tags: ["#no-penalty", "#after-duration", "#withdraw"],
      },
      {
        id: "wd-return-time",
        question: "解鎖後多久能收到資金？",
        answer:
          "解鎖後，返還資金可能需要約 7–10 天完成。在此期間，資金可能仍在營運結算流程中，短期解鎖可能導致損失。請妥善安排資金流動性。",
        tags: ["#withdraw", "#timing", "#risk"],
      },
    ],
  },

  {
    id: "fees",
    label: "費用",
    items: [
      {
        id: "fees-gas",
        question: "質押或提領會有費用嗎？",
        answer:
          "區塊鏈交易會產生網路 Gas 費（approve、stake、claim、unstake）。WStaking 不聲稱收取隱藏平台費用，但您應預期正常的鏈上交易手續費。",
        tags: ["#fees", "#gas", "#transactions"],
      },
    ],
  },

  {
    id: "analytics",
    label: "數據分析",
    items: [
      {
        id: "analytics-what-data",
        question: "團隊可以看到哪些分析數據？",
        answer:
          "WStaking 分析數據（內部/管理員用途）可能包含 Google Analytics 與 Google Search Console 的洞察，例如流量來源、活躍用戶、以及搜尋表現等。",
        tags: ["#analytics", "#ga", "#gsc"],
      },
      {
        id: "analytics-delay",
        question: "為什麼 Google Search Console 沒有今天的數據？",
        answer:
          "Google Search Console 通常只會提供到前一天的完整數據。依 Google 的報表週期，同一天的數據可能不完整或尚未提供。",
        tags: ["#gsc", "#delay", "#previous-day"],
      },
    ],
  },

  // Legal & Risk（建議分頁 — 若不想新增分頁，可將以下項目合併至「一般」）
  {
    id: "legal",
    label: "法律與風險",
    items: [
      {
        id: "legal-risk-disclosure",
        question: "在 WStaking 質押有哪些主要風險？",
        answer:
          "質押數位資產具有重大風險，包含可能完全損失所質押資產。風險可能包括（但不限於）：\n• 市場波動\n• 智能合約風險\n• 區塊鏈網路問題或擁塞\n• 代幣或協議變更\n• 您所在地的監管變動\n\n您有責任在質押前了解這些風險。",
        tags: ["#risk", "#disclosure", "#legal"],
      },
      {
        id: "legal-no-liability",
        question: "若發生損失或獎勵減少，WStaking 需要負責嗎？",
        answer:
          "不需要。使用 WStaking 代表您了解質押具有風險，並自行承擔可能的損失。WStaking 不對任何直接或間接損害負責，包括資產、利潤或數據的損失，這些損失可能因您使用質押服務而產生。",
        tags: ["#liability", "#legal", "#risk"],
      },
      {
        id: "legal-user-responsibility",
        question: "作為用戶，我需要負責什麼？",
        answer:
          "您需要負責：\n• 保護您的錢包安全（私鑰 / 助記詞）\n• 確認您使用的是官方連結\n• 監控您的質押狀態\n• 了解方案規則（鎖倉期、罰則、續約）\n• 遵守您所在地的法律/稅務規定",
        tags: ["#responsibility", "#security", "#legal"],
      },
      {
        id: "legal-regulatory",
        question: "我需要遵守當地法規與稅務規定嗎？",
        answer:
          "需要。您使用 WStaking 必須符合您所在地的法律與規範。您有責任了解所在地與質押相關的法律與稅務義務。WStaking 可能會在某些受監管或禁止提供質押服務的地區限制存取。",
        tags: ["#regulation", "#tax", "#legal"],
      },
    ],
  },

  {
    id: "support",
    label: "客服支援",
    items: [
      {
        id: "support-contact",
        question: "如果發生問題，我該如何尋求協助？",
        answer:
          "您可以透過網站列出的官方管道聯絡 WStaking 客服團隊，或寄信至 service@wstaking.net。請務必小心假冒人員。",
        tags: ["#support", "#help", "#contact"],
      },
      {
        id: "support-avoid-scams",
        question: "如何避免與 WStaking 相關的詐騙？",
        answer:
          "請只信任官方 WStaking 連結與官方溝通管道。切勿向任何人透露您的私鑰或助記詞。若有人向您索取助記詞，那就是詐騙。",
        tags: ["#security", "#scam", "#safety"],
      },
    ],
  },
];
