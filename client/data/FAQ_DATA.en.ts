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
    label: "General",
    items: [
      {
        id: "general-what-is-wstaking",
        question: "What is WStaking?",
        answer:
          "WStaking is a Web3 staking platform that lets you stake supported tokens using smart contracts. You connect a wallet, choose a duration plan, stake, earn rewards over time, and claim/withdraw based on the rules of the selected plan. WStaking does not provide investment advice and does not guarantee profits.",
        tags: ["#wstaking", "#staking", "#overview"],
      },
      {
        id: "general-supported-assets",
        question: "Which tokens and networks are supported?",
        answer:
          "Supported tokens:\n• USDT\n• USDC\n• XLAYER_USDT (only available on the XLayer network)\n\nThe available network/token options are shown in the UI based on the staking contracts deployed on each chain.",
        tags: ["#tokens", "#networks", "#usdt", "#usdc", "#xlayer"],
      },
      {
        id: "general-not-investment-advice",
        question: "Is WStaking offering investment advice or guaranteed returns?",
        answer:
          "No. WStaking does not provide investment advice, and rewards are not guaranteed. Any APR/reward figures shown are informational and based on the staking rules implemented in the smart contracts. Always evaluate risk and consult qualified financial/legal/tax professionals if needed.",
        tags: ["#legal", "#risk", "#no-advice"],
      },
      {
        id: "general-where-do-rewards-come-from",
        question: "Where do rewards come from?",
        answer:
          "Rewards are calculated by the staking smart contract using predefined rules (duration + amount-based APR ranges). Rewards are not “promised profits”, and outcomes can be affected by risk factors (market volatility, network conditions, smart contract risk, and operational delays).",
        tags: ["#rewards", "#smart-contract", "#risk"],
      },
      {
        id: "general-what-should-i-check-before-staking",
        question: "What should I check before staking?",
        answer:
          "Before staking, make sure you understand:\n• The selected duration and the lock rules\n• Whether early-unstake penalties apply\n• How partial unstake works\n• How auto-renew works after the plan ends\n• That network gas fees apply\n• That crypto staking carries risk, including possible loss of funds\n\nIf you’re unsure, stake a small amount first to test the flow.",
        tags: ["#beginner", "#risk", "#checklist"],
      },
    ],
  },
  {
    id: "getting-started",
    label: "Getting Started",
    items: [
      {
        id: "gs-how-to-start",
        question: "How do I start staking on WStaking?",
        answer:
          "1) Connect a supported Web3 wallet\n2) Select a network and token\n3) Choose a staking duration plan\n4) Enter the amount\n5) Confirm the transaction in your wallet\n\nAfter the transaction is confirmed on-chain, your stake will appear in your dashboard.",
        tags: ["#getting-started", "#wallet", "#stake"],
      },
      {
        id: "gs-approve-and-stake",
        question: "Why do I see an “Approve” step before staking?",
        answer:
          "Some tokens require an approval transaction before the staking contract can transfer tokens from your wallet. This is a standard ERC-20 behavior. You’ll usually do:\n• Approve (one-time or as needed)\n• Stake (actual deposit)\n\nBoth require wallet confirmation and gas fees.",
        tags: ["#approve", "#erc20", "#gas"],
      },
      {
        id: "gs-transaction-states",
        question: "What are the normal transaction states I should expect?",
        answer:
          "A typical flow is:\n• Wallet pops up → you confirm\n• Pending / submitting\n• Confirmed on-chain\n• UI updates after confirmation\n\nIf a transaction fails, it usually means the user rejected it, gas was insufficient, or the network had an issue.",
        tags: ["#tx", "#pending", "#confirmed"],
      },
    ],
  },
  {
    id: "wallets",
    label: "Wallets",
    items: [
      {
        id: "wallets-supported",
        question: "Which wallets are supported?",
        answer:
          "Any wallet compatible with the supported blockchain network can be used — including MetaMask, OKX Wallet, Trust Wallet, and other standard Web3 wallets.",
        tags: ["#wallets", "#metamask", "#okx", "#trustwallet"],
      },
      {
        id: "wallets-security-private-keys",
        question: "Does WStaking have access to my private keys?",
        answer:
          "No. WStaking never has access to your private keys or seed phrase. All staking, claiming, and withdrawing transactions require explicit confirmation in your wallet.",
        tags: ["#security", "#private-keys", "#wallet-safety"],
      },
    ],
  },
  {
    id: "staking-rules",
    label: "Staking Rules",
    items: [
      {
        id: "rules-apr-and-durations",
        question: "What staking durations and APR ranges are available?",
        answer:
          "Duration plans and APR ranges:\n• 1 Month: 10%\n• 3 Months: 12% – 15%\n• 6 Months: 15% – 24%\n• 12 Months: 24% – 36%\n\nAPR increases progressively based on the staked amount.\n• Stakes of 10 (USDT/USDC) or more qualify for at least 10% APR\n• Maximum APR for each duration is reached at 10,000 (USDT/USDC) or more\n\nThe UI will show the estimated APR/rewards before you confirm.",
        tags: ["#apr", "#duration", "#plans"],
      },
      {
        id: "rules-minimum-stake",
        question: "Is there a minimum staking amount?",
        answer:
          "Yes. The minimum effective stake is 10 (USDT/USDC equivalent) based on the current staking rules. If partial unstake is used, at least 10 must remain staked.",
        tags: ["#minimum", "#rules"],
      },
      {
        id: "rules-additional-staking",
        question: "Can I add more funds to an existing stake?",
        answer:
          "Yes, with rules:\n• Different duration plans cannot be combined\n• Same duration plans can accept additional staking\n• After adding, the lock-in period for the entire amount is recalculated",
        tags: ["#add-stake", "#lock", "#duration"],
      },
      {
        id: "rules-promo-apr",
        question: "What is “Promotional APR” and how does it affect penalties?",
        answer:
          "Promotional APR is a special rate condition (when enabled). Important: promotional APR stakes always apply the full penalty if you early-unstake (no time-based reduction). Always review the plan status before staking.",
        tags: ["#promo", "#apr", "#penalty"],
      },
    ],
  },
  {
    id: "rewards",
    label: "Rewards",
    items: [
      {
        id: "rewards-how-calculated",
        question: "How are staking rewards calculated?",
        answer:
          "Rewards are calculated by the smart contract based on:\n• Your staked amount\n• Your selected duration plan\n• The APR range you qualify for\n\nThe platform may show estimated values in the UI, but the contract logic is the source of truth.",
        tags: ["#rewards", "#calculation", "#smart-contract"],
      },
      {
        id: "rewards-claim-anytime",
        question: "Can I claim rewards anytime?",
        answer:
          "Yes. If you have claimable/available rewards, you can claim them anytime.\n\nImportant behavior: if your original duration has ended and you claim rewards without unstaking, the stake renews for the same duration and amount (see Auto-Renew).",
        tags: ["#claim", "#anytime", "#rewards"],
      },
      {
        id: "rewards-auto-renew",
        question: "What happens when my staking duration ends?",
        answer:
          "When the original staking duration ends, the stake automatically renews for the same duration.\n\nDuring the renewed period:\n• Rewards are recalculated and become claimable\n• You can unstake anytime without penalty (renewed stake has no early-unstake penalty)\n• Promotional APR does NOT apply to the renewed period",
        tags: ["#auto-renew", "#no-penalty", "#rewards"],
      },
    ],
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    items: [
      {
        id: "wd-early-unstake-penalties",
        question: "What are the penalties for early unstake?",
        answer:
          "If you unstake before the original duration ends, penalties may apply based on duration:\n\n• 1 Month: 10% (fixed)\n• 3 Months: 15% → 10% (time-based decrease)\n• 6 Months: 24% → 10% (time-based decrease)\n• 12 Months: 36% → 10% (time-based decrease)\n\nPromotional APR stakes always apply the full penalty.\n\nThe exact penalty applied is determined by the contract at the time of unstake.",
        tags: ["#unstake", "#penalty", "#early-withdrawal"],
      },
      {
        id: "wd-partial-unstake",
        question: "Can I partially unstake early?",
        answer:
          "Yes. Partial unstake is supported with these rules:\n• You can withdraw part of your funds early\n• Penalty applies only to the withdrawn portion\n• Rewards on the withdrawn portion stop and are paid out\n• The remaining amount becomes a new stake with updated APR/terms\n• At least 10 (USDT/USDC equivalent) must remain staked",
        tags: ["#partial-unstake", "#penalty", "#rules"],
      },
      {
        id: "wd-after-duration",
        question: "What if I unstake after the duration is finished?",
        answer:
          "After the original duration ends:\n• No penalty applies\n• Partial or full unstake is allowed anytime\n\nIf you keep funds staked (or claim rewards without unstaking), auto-renew applies and the renewed stake can be unstaked anytime with no penalty.",
        tags: ["#no-penalty", "#after-duration", "#withdraw"],
      },
      {
        id: "wd-return-time",
        question: "How long does it take to receive funds after unstaking?",
        answer:
          "After unstaking, returns may take approximately 7–10 days to be completed. During this period, amounts may still be in an operational settlement process, and temporary unstaking can lead to losses. Always plan liquidity accordingly.",
        tags: ["#withdraw", "#timing", "#risk"],
      },
    ],
  },
  {
    id: "fees",
    label: "Fees",
    items: [
      {
        id: "fees-gas",
        question: "Are there any fees for staking or withdrawing?",
        answer:
          "Blockchain network gas fees apply for transactions (approve, stake, claim, unstake). WStaking does not claim to charge hidden platform fees, but you should always expect normal on-chain transaction fees.",
        tags: ["#fees", "#gas", "#transactions"],
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      {
        id: "analytics-what-data",
        question: "What analytics data is available for the team?",
        answer:
          "WStaking analytics (for internal/admin use) can include insights from Google Analytics and Google Search Console, such as traffic sources, active users, and search performance.",
        tags: ["#analytics", "#ga", "#gsc"],
      },
      {
        id: "analytics-delay",
        question: "Why does Google Search Console data not include today?",
        answer:
          "Google Search Console typically provides finalized data up to the previous day. Same-day data may be incomplete or unavailable depending on Google’s reporting cycle.",
        tags: ["#gsc", "#delay", "#previous-day"],
      },
    ],
  },
  {
    id: "legal",
    label: "Legal & Risk",
    items: [
      {
        id: "legal-risk-disclosure",
        question: "What are the main risks of staking on WStaking?",
        answer:
          "Staking digital assets involves significant risks, including the potential for complete loss of staked assets. Risks can include (but are not limited to):\n• Market volatility\n• Smart contract risk\n• Blockchain network issues or congestion\n• Token or protocol changes\n• Regulatory changes in your jurisdiction\n\nYou are responsible for understanding these risks before staking.",
        tags: ["#risk", "#disclosure", "#legal"],
      },
      {
        id: "legal-no-liability",
        question: "Is WStaking liable for losses or reduced rewards?",
        answer:
          "No. By using WStaking, you acknowledge that staking involves risk and you assume responsibility for potential losses. WStaking is not liable for direct or indirect damages, including loss of assets, profits, or data, resulting from your use of staking services.",
        tags: ["#liability", "#legal", "#risk"],
      },
      {
        id: "legal-user-responsibility",
        question: "What am I responsible for as a user?",
        answer:
          "You are responsible for:\n• Securing your wallet (private keys / seed phrase)\n• Verifying you are using official links\n• Monitoring your staking positions\n• Understanding the plan rules (lock period, penalties, renewal)\n• Complying with laws/tax rules in your jurisdiction",
        tags: ["#responsibility", "#security", "#legal"],
      },
      {
        id: "legal-regulatory",
        question: "Do I need to follow local regulations and tax rules?",
        answer:
          "Yes. Your use of WStaking must comply with laws and regulations in your jurisdiction. You are responsible for understanding legal and tax obligations related to staking where you live. WStaking may restrict access in regions where staking services are regulated or prohibited.",
        tags: ["#regulation", "#tax", "#legal"],
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    items: [
      {
        id: "support-contact",
        question: "How can I get help if something goes wrong?",
        answer:
          "You can contact the WStaking support team through official channels listed on the website or email service@wstaking.net. Always beware of impersonators.",
        tags: ["#support", "#help", "#contact"],
      },
      {
        id: "support-avoid-scams",
        question: "How can I avoid scams related to WStaking?",
        answer:
          "Only trust official WStaking links and communication channels. Never share your private keys or seed phrase with anyone. If someone asks for your seed phrase, it’s a scam.",
        tags: ["#security", "#scam", "#safety"],
      },
    ],
  },
];
