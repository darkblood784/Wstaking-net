export interface EnvConfig {
    // 通用配置
    // btcAddress: string;                // 公共配置
    // ethAddress: string;                // 公共配置
    showCarouselSection: boolean;      // 公共配置
    showComingSoon: boolean;           // 公共配置
    referralVersion: string;           // 公共配置
    firebaseApiKey: string;            // 公共配置
    executionEnv: string;              // 公共配置
    bscTestnetContractAddress: string; // 公共配置
    bscTestnetPrecision: string;       // 公共配置
    bscContractAddress: string;        // 公共配置
    bscPrecision: string;              // 公共配置
    xLayerContractAddress: string;     // 公共配置
    xLayerPrecision: string;           // 公共配置
    baseSepoliaContractAddress: string;// 公共配置
    baseSepoliaPrecision: string;      // 公共配置
    baseContractAddress: string;       // 公共配置
    basePrecision: string;             // 公共配置
    
    // 国家/地区配置
    serviceName: string;               // 国家特定
    appName: string;                   // 国家特定
    projectId: string;                 // 国家特定
    supportedChains: string;
    mainnetChains: string;
    supportedWallets: string;          // 支持的錢包
    contractAddress: string;           // 国家特定

    // 质押金额限制
    minStakeAmount: string;            // 最小质押金额
    maxStakeAmount: string;            // 最大质押金额（0 表示无上限）

    // 新增社交媒體鏈接
    socialInstagram: string;
    socialFacebook: string;
    socialWhatsApp: string;
    socialGithubStrategies: string;
    socialGithubTeam: string;
}

// 全局配置變量
let cachedConfig: EnvConfig | null = null;

export const loadEnvConfig = (): EnvConfig => {
    if (cachedConfig) return cachedConfig; // cached
    const mode = String(import.meta.env.MODE || "").trim().toLowerCase();
    const executionEnv = String(import.meta.env.VITE_EXECUTION_ENV || "").trim().toLowerCase();
    const hasExplicitExecutionEnv = executionEnv.length > 0;
    const useMainnetChains = hasExplicitExecutionEnv
        ? executionEnv === "prod" || executionEnv === "production"
        : mode === "prod" || mode === "production";

    // 加載環境變數
    cachedConfig = {
        // 通用配置
        // btcAddress: import.meta.env.VITE_BTC_ADDRESS || 'DefaultBtcAddress',
        // ethAddress: import.meta.env.VITE_ETH_ADDRESS || 'DefaultEthAddress',
        showCarouselSection: import.meta.env.VITE_SHOW_CAROUSEL_SECTION === 'true',
        showComingSoon: import.meta.env.VITE_SHOW_COMING_SOON === 'true',
        referralVersion: import.meta.env.VITE_REFERRAL_VERSION || '0',
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        executionEnv: import.meta.env.VITE_EXECUTION_ENV || '',
        bscTestnetContractAddress: import.meta.env.VITE_BSC_TESTNET_CONTRACT_ADDRESS || '',
        bscTestnetPrecision: import.meta.env.VITE_BSC_TESTNET_PRECISION || '18',
        bscContractAddress: import.meta.env.VITE_BSC_CONTRACT_ADDRESS || '',
        bscPrecision: import.meta.env.VITE_BSC_PRECISION || '18',
        xLayerContractAddress: import.meta.env.VITE_XLAYER_CONTRACT_ADDRESS || '',
        xLayerPrecision: import.meta.env.VITE_XLAYER_PRECISION || '6',
        baseSepoliaContractAddress: import.meta.env.VITE_BASE_SEPOLIA_CONTRACT_ADDRESS || '',
        baseSepoliaPrecision: import.meta.env.VITE_BASE_SEPOLIA_PRECISION || '18',
        baseContractAddress: import.meta.env.VITE_BASE_CONTRACT_ADDRESS || '',
        basePrecision: import.meta.env.VITE_BASE_PRECISION || '18',

        // 国家/地区配置
        serviceName: import.meta.env.VITE_SERVICE_ENV || 'DefaultServiceName',
        appName: import.meta.env.VITE_APP_NAME || 'DefaultAppName',
        projectId: import.meta.env.VITE_PROJECT_ID || 'DefaultProjectId',
        supportedChains:
            useMainnetChains
                ? (import.meta.env.VITE_MAINNET_CHAINS || "bsc, xLayer")
                : (import.meta.env.VITE_SUPPORTED_CHAINS || "bscTestnet"),
        mainnetChains: import.meta.env.VITE_MAINNET_CHAINS || "bsc, xLayer",
        supportedWallets: import.meta.env.VITE_SUPPORTED_WALLETS || 'metaMaskWallet',
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',

        // 质押金额限制
        minStakeAmount: import.meta.env.VITE_MIN_STAKE_AMOUNT || '10', // 默认 10
        maxStakeAmount: import.meta.env.VITE_MAX_STAKE_AMOUNT || '0',  // 0 表示無上限

        // 新增社交媒體鏈接
        socialInstagram: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL || '',
        socialFacebook: import.meta.env.VITE_SOCIAL_FACEBOOK_URL || '',
        socialWhatsApp: import.meta.env.VITE_SOCIAL_WHATSAPP_URL || '',
        socialGithubStrategies: import.meta.env.VITE_SOCIAL_GITHUB_STRATEGIES_URL || '',
        socialGithubTeam: import.meta.env.VITE_SOCIAL_GITHUB_TEAM_URL || '',
    };

  return cachedConfig;
};




