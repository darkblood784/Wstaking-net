// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Custom errors (optional, save gas if used properly)
error InvalidAddress();                   // address == 0
error UnauthorizedAccess(string details);                     // system disabled or not owner/admin
error UnsupportedToken();                 // token not in supportedTokens
error ZeroDuration();                     // daysDuration == 0
error Nolockedstakesfound();                   // pagination size == 0
error Nounlockedstakesfound();                 // unlockedCount == 0
error OutOfBounds(uint256 index, uint256 total);  // start >= size
error InsufficientAllowance();            // allowance < amount
error TransferFailed();                   // ERC20.transfer or transferFrom returned false
error onlybyOwnerOrAdmin();
error onlybySuperAdmin();
error onlybyAdmin();
error Promotionnotactive();
error Invalidtimerange();
error Alreadyadmin();
error Notadmin();
error AdminsDisabled();
error indexoutofrange();
error InvalidOwner();
error InvalidSecondOwner();
error InvalidToken();
error InvalidHotWallet();
error InvalidAPRCalculation();
error EmptyName();
error InsufficientHotWalletLiquidity();
error PendingOwnerOnly();
error RenounceOwnershipDisabled();


/**
 * @title BASESecureStakingV3
 * @notice A staking contract specifically designed for a 18-decimal USDT token on Base Network mainnet.
 *         This includes “round up” logic so that final rewards never end in an off‐by‐1 scenario.
 */
contract BASESecureStakingV3 is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    //using SafeMath for uint256;

    // -----------------------------------------------------------------
    // Constants & Basic State
    // -----------------------------------------------------------------

    // For 6-decimal USDT, threshold = 10,000 USDT => 10,000 * 10^18 = 1e22
    uint256 private constant DECIMAL_FACTOR    = 10 ** 6;
    uint256 private constant MINIMUM_STAKE = 10 * DECIMAL_FACTOR;      // 10 tokens
    uint256 private constant THRESHOLD_AMOUNT     = 10000 * DECIMAL_FACTOR;   // 10,000 tokens

    //function MINIMUM_STAKE() public view returns (uint256) { return MINIMUM_STAKE_USDT * _unit; }
    //function THRESHOLD_AMOUNT() public view returns (uint256) { return THRESHOLD_USDT * _unit; }
    //uint256 public constant ONE_WEEK_MINUTES = 10080;
    uint256 public constant ONE_YEAR_MINUTES = 525600;
    uint256 public constant ONE_MONTH_MINUTES = ONE_YEAR_MINUTES / 12; 
    uint256 public constant SIX_MONTHS_MINUTES = ONE_YEAR_MINUTES / 2;
    uint256 public constant THREE_MONTHS_MINUTES = ONE_MONTH_MINUTES * 3;

    // Promotion Durations (use an offset so they don’t conflict)
    uint256 public constant PROMO_ONE_MONTH = 43801;          // 30 days + 1 minute
    uint256 public constant PROMO_THREE_MONTHS = 131401;
    uint256 public constant PROMO_SIX_MONTHS = 262801;        
    uint256 public constant PROMO_ONE_YEAR = 525601;      


    // Master references
    //IERC20Upgradeable public USDT;

    // Base-compatible dynamic decimals (6 or 18)
    //uint8    private _tokenDecimals;
    //uint256  private _unit; // 10 ** _tokenDecimals

    //function tokenDecimals() public view returns (uint8) { return _tokenDecimals; }
    //function unit() public view returns (uint256) { return _unit; }
    //address public hotWallet;
    bool public systemEnabled;

    uint256 public totalStaking;
    uint256 public totalActiveStaking;
    uint256 public totalStakingUsers;
    uint256 public totalRewardsGranted;
    uint256 public totalUngrantedRewards;

    // Track user addresses
    address[] private stakingUsersKeys;
    mapping(address => bool) private stakingUsers;


    // Promotion Phase Variables:
    // (In V4 these were named "ignoreMaxStakingThreshold" etc. We keep the same names.)
    bool public ignoreMaxStakingThreshold; // If true, full APR is applied during promotion
    uint256 public promoEndTime;           
    // Legacy promo-limit storage retained for upgrade safety.
    // Current business behavior intentionally allows multiple promo stakes per user.
    mapping(address => bool) public usedPromoOnce;
    mapping(address => uint256) public userPromoUsed;

    // Mapping for quick lookup by stake transaction hash
    mapping(address => mapping(bytes32 => uint256)) private stakeIndexByHash;

    // For tracking promo status and promo IDs per stake (V4 legacy variables)
    mapping(address => mapping(bytes32 => bool)) private stakePromoStatus;
    mapping(address => mapping(bytes32 => uint256)) private stakePromoId;

    // New mapping for V9 stakes – this is where new stakes will be stored and where migrated stakes will reside.
    mapping(address => mapping(address => StakeInfoV1[])) private multiTokenUserStakesV1;

    // Track review start time per user per txn
    mapping(address => mapping(bytes32 => uint256)) public unstakeReviewStartTime;
    mapping(address => mapping(bytes32 => uint256)) public claimReviewStartTime;

    // Must be re-added to maintain storage layout (even if unused)
    mapping(address => mapping(bytes32 => uint256)) private totalClaimedAcrossCycles;

    // -----------------------------------------------------------------
    // Admin Roles
    // -----------------------------------------------------------------
    address public superAdmin; 
    mapping(address => bool) public admins;
    address public secondOwner;  // Second owner to allow both owners to have admin roles

    

    // -----------------------------------------------------------------
    // Final Stake Structure (V1)
    // -----------------------------------------------------------------
    struct StakeInfoV1 {
        uint256 stakedAmount;        
        uint256 originalStakedAmount;
        uint256 stakedAt;            
        uint256 stakeEnd;            
        uint256 rewards;             
        uint256 originalRewards;     
        uint256 unlockedAt;          
        uint256 APR;                 
        uint256 adjustedAPR;         
        bool claimed;
        bool unstaked;
        uint256 stakingType;         // locked (1)
        bytes32 txnHash;             
        bytes32[] claimedTxnHashes;  
        uint256 currentRewards;      
        uint256 expectedTotalRewards;
        bytes32 unstakeTxnHash;      
        uint256 claimedRewards;
        uint256 version;       // Use 10 for V1.0 (migrated stakes), 11 for V1.1 (new stakes)
        uint256 promoId;       // 0 = normal stake, >0 indicates promo event
        bool isPromo;          // True if stake was made during promo
        bool addFundAllowed;   // Determines if additional funds can be added
    }

    // We use “V1” as the final storage
    mapping(address => bool) public supportedTokens;
    mapping(address => string) public tokenNames;
    mapping(address => address) public tokenHotWallets;
    address[] public allTokenAddresses;

    // Because we support partial claims, store how much was claimed by a claimHash
    mapping(bytes32 => uint256) public claimedRewardsByHash;
    uint256 public currentPromoId;

    // --- NEW: minimal per-token aggregates (append-only) ---
    struct TokenAgg {
        uint256 totalStaking;           // lifetime staked for this token
        uint256 totalActiveStaking;     // current active principal
        uint256 totalRewardsGranted;    // rewards actually paid
        uint256 totalUngrantedRewards;  // accrued but not yet paid
        uint256 userCount;              // unique wallets that ever staked this token
    }

    mapping(address => TokenAgg) private _tokenAgg;
    mapping(address => mapping(address => bool)) private _seenTokenUser; // token => wallet => seen

    // V3 append-only additions placed after all V2 storage fields
    // so existing user/stake data remains slot-compatible with V2.
    mapping(address => mapping(bytes32 => bool)) private stakeExistsByHash;
    mapping(address => uint256) private stakeNonce;
    // Cumulative principal withdrawn via partial unstakes (user => token => total principal).
    mapping(address => mapping(address => uint256)) public partialUnstakedPrincipalTotal;
    address private _pendingOwner;

    // Consume 4 slots from V2 gap for the V3 additions above.
    uint256[46] private __gap;


    // -----------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------
    event Staked(
        address indexed staker,
        address indexed token,
        uint256 amount,
        uint256 APR,
        uint256 adjustedAPR,
        uint256 stakeEnd,
        uint256 stakingType,
        bytes32 txnHash,
        string details
    );
    event Unstaked(
        address indexed staker,
        address token,
        uint256 penalty,
        uint256 amount,
        uint256 rewards,
        uint256 unlockedAt,
        bytes32 unstakeTxnHash,
        string details
    );
    event PartialUnstaked(
        address indexed user,
        address token,
        uint256 amountUnstaked,
        uint256 penalty,
        uint256 remainingStake,
        uint256 time,
        bytes32 unstakeTxnHash,
        string details
    );
    event RewardsClaimed(
        address indexed staker,
        address token,
        uint256 rewards,
        bytes32 txnHash,
        bytes32 claimedTxnHash,
        string details
    );
    event Notification(address indexed user, string details);
    event SystemStateToggled(bool enabled, string details);
    event HotWalletInsufficientFunds(uint256 available, uint256 required, string details);
    event TokenHotWalletUpdated(address indexed token, address indexed oldHotWallet, address indexed newHotWallet);
    event UpcomingTransactions(address indexed owner, uint256[] amounts, uint256[] dueDates, string details);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    //event TokenAdded(address indexed token, string name, address hotWallet);
    //event TokenRemoved(address indexed token, string name, address hotWallet);
    event Fundadded(
        address indexed user,
        address indexed token,
        uint256 oldAmount,
        uint256 additionalAmount,
        uint256 newTotal,
        uint256 newRewards,
        uint256 newAPR,
        uint256 newDuration,
        string details
    );
    event StakeRenewed(
        address indexed user,
        address indexed token,
        bytes32 txnHash,
        uint256 stakingType,
        uint256 newStakedAt,
        uint256 newStakeEnd,
        string details
    );
    event ClaimInsufficientHotWalletBalance(
        address indexed user,
        address indexed token,
        bytes32 indexed txnHash,
        uint256 requiredAmount,
        uint256 availableAmount,
        uint256 allowanceAmount,
        uint256 timestamp
    );


    // ----------------------------------------------------------------
    // Upgradeable pattern: no constructor, use initialize()
    // ----------------------------------------------------------------
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract for X-Layer Mainnet.  
     *  - `_usdtAddress` => your 6-decimal USDT on X-layer mainnet  
     *  - `_hotWallet` => address that holds tokens for distribution  
     *  - `_owner` => contract owner
     */
    /// Minimal stub just to satisfy OZ Upgrades validator
    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        __Pausable_init();
    }

// ----------------------------------------------------------------
    // Promotion Phase
    // ----------------------------------------------------------------
    // In V4 the promotion was checked via ignoreMaxStakingThreshold; here we keep the same functions.
    function isPromotionActive() public view returns (bool) {
        return (ignoreMaxStakingThreshold && block.timestamp < promoEndTime);
    }

    // currentPromoId is already declared as state variable (see below)

    function startPromotion(uint256 daysDuration) external onlyOwner {
        if (daysDuration == 0) revert ZeroDuration();
        if (isPromotionActive()) revert Promotionnotactive();
        ignoreMaxStakingThreshold = true;
        promoEndTime = block.timestamp + (daysDuration * 1 days);
        currentPromoId++; // Increment the promoID for the new promotion period
        emit Notification(
            msg.sender,  
            string(abi.encodePacked("Promo ends at ", _uintToString(promoEndTime), "; Promo ID: ", _uintToString(currentPromoId)))
        );
    }

    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; ++i) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function _uintToString(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k--;
            uint8 temp = uint8(48 + _i % 10);
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }


    function getStakePromoStatus(address user, bytes32 txnHash) external view returns (bool) {
        return stakePromoStatus[user][txnHash];
    }

    function stopPromotion() external onlyOwner {
        // 1) End the promo
        ignoreMaxStakingThreshold = false;

        // 3) Set the promoEndTime to 0
        promoEndTime = 0;

        // 4) Emit event
        emit Notification(msg.sender, "4::PromoEnd");
    }

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    function pendingOwner() external view returns (address) {
        return _pendingOwner;
    }

    function transferOwnership(address newOwner) public override onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner(), newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != _pendingOwner) revert PendingOwnerOnly();
        _transferOwnership(msg.sender);
    }

    function renounceOwnership() public view override onlyOwner {
        revert RenounceOwnershipDisabled();
    }

    function _transferOwnership(address newOwner) internal override {
        _pendingOwner = address(0);
        super._transferOwnership(newOwner);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

/*
    // -------------------------------------
    // Admin / SuperAdmin
    // -------------------------------------
    function setSuperAdmin(address _superAdmin) external {
        require(superAdmin == address(0), "Super admin already set");
        require(_superAdmin != address(0), "Invalid super admin address");
        superAdmin = _superAdmin;
        admins[_superAdmin] = true;
    }

    function getSuperAdmin() external view returns (address) {
        return superAdmin;
    }
*/

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert onlybyAdmin();
        _;
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    // -------------------------------------
    // System toggle
    // -------------------------------------
    function toggleSystemState() external onlyOwner {
        systemEnabled = !systemEnabled;
        emit SystemStateToggled(systemEnabled, systemEnabled ? "SysOn" : "SysOff");
    }

    modifier systemNotDisabled() {
        if (!systemEnabled && msg.sender != owner()) {
            revert UnauthorizedAccess("System is Under Maintenance");
        }
        _;
    }

    // -------------------------------------
    // Supported tokens
    // -------------------------------------
    modifier onlySupportedToken(address token) {
        if (!supportedTokens[token]) revert UnsupportedToken(); 
        _;
    }
    /*
    // -------------------------------------
    // Token registry (compact version)
    // -------------------------------------

    event TokenSupported(address indexed tokenAddr, string name, address hotWallet);

    function upsertOrRenameToken(
        address tokenAddr,
        string memory name,
        address hotWallet
    ) external onlyOwner {
        if (tokenAddr == address(0)) revert InvalidToken();
        if (hotWallet == address(0)) revert InvalidHotWallet();
        if (bytes(name).length == 0) revert EmptyName();

        // Hard-lock to 6 decimals
        uint8 d = IERC20MetadataUpgradeable(tokenAddr).decimals();
        require(d == 6, "Only 6-decimal tokens supported");

        if (!supportedTokens[tokenAddr]) {
            supportedTokens[tokenAddr] = true;
            allTokenAddresses.push(tokenAddr);
        }

        tokenNames[tokenAddr] = name;
        tokenHotWallets[tokenAddr] = hotWallet;

        emit TokenSupported(tokenAddr, name, hotWallet);
    }
    */

    function getAllSupportedTokens()
        external
        view
        returns (address[] memory tokens, string[] memory names)
    {
        uint256 length = allTokenAddresses.length;
        tokens = new address[](length);
        names = new string[](length);

        for (uint256 i = 0; i < length; ++i) {
            address token = allTokenAddresses[i];
            if (supportedTokens[token]) {
                tokens[i] = token;
                names[i] = tokenNames[token];
            }
        }
    }

    function USDT() external view returns (address) {
        if (allTokenAddresses.length == 0) return address(0);
        return allTokenAddresses[0];
    }

    function hotWallet() external view returns (address) {
        if (allTokenAddresses.length == 0) return address(0);
        return tokenHotWallets[allTokenAddresses[0]];
    }

    function updateTokenHotWallet(address token, address newHotWallet) external onlyOwner onlySupportedToken(token) {
        if (newHotWallet == address(0)) revert InvalidHotWallet();

        address oldHotWallet = tokenHotWallets[token];
        tokenHotWallets[token] = newHotWallet;

        emit TokenHotWalletUpdated(token, oldHotWallet, newHotWallet);
    }

    /*
    // --- One-time migration helpers (admin only) ---

    // (A) Reset the per-token aggregate and clear "seen" flags for a batch of users.
    // Call this across ALL staking users (in batches) BEFORE you rebuild.
    function resetTokenAggSeenBatch(address token, address[] calldata users) external onlyOwner {
        // First call this once with an empty users[] to zero the struct
        if (users.length == 0) {
            delete _tokenAgg[token];
            return;
        }
        for (uint256 i = 0; i < users.length; ++i) {
            _seenTokenUser[token][users[i]] = false;
        }
    }

    // (B) Rebuild the per-token aggregate for a batch of users.
    // Call this across ALL staking users (in batches) AFTER you finished resets.
    function rebuildTokenAggBatch(address token, address[] calldata users) external onlyOwner {
        TokenAgg storage a = _tokenAgg[token];

        for (uint256 u = 0; u < users.length; u++) {
            address user = users[u];
            StakeInfoV1[] storage arr = multiTokenUserStakesV1[token][user];
            if (arr.length == 0) continue;

            // count unique user once
            if (!_seenTokenUser[token][user]) {
                _seenTokenUser[token][user] = true;
                a.userCount += 1;
            }

            for (uint256 i = 0; i < arr.length; ++i) {
                StakeInfoV1 storage s = arr[i];

                // lifetime deposited (we treat originalStakedAmount as the per-position "principal basis")
                a.totalStaking += s.originalStakedAmount;

                // current active principal
                if (!s.unstaked) {
                    a.totalActiveStaking += s.stakedAmount;
                }

                // rewards paid (what user already got)
                uint256 paid = s.claimedRewards + totalClaimedAcrossCycles[user][s.txnHash];
                a.totalRewardsGranted += paid;

                // still ungranted (what remains to be paid this cycle)
                a.totalUngrantedRewards += s.rewards;
            }
        }
    }
    

   // add this near your other admin funcs
    function adminSetTokenAgg(
        address token,
        uint256 totalStaked,
        uint256 totalActive,
        uint256 rewardsGranted,
        uint256 ungrantedRewards,
        uint256 userCount
    ) external onlyOwner {
        TokenAgg storage a = _tokenAgg[token];
        a.totalStaking = totalStaked;
        a.totalActiveStaking = totalActive;
        a.totalRewardsGranted = rewardsGranted;
        a.totalUngrantedRewards = ungrantedRewards;
        a.userCount = userCount;
    }

    // Admin: realign global aggregates to the sum of per-token aggregates.
    // Pass ALL token addresses that have (or ever had) staking in this contract.
    function adminSyncGlobalsFromTokens(address[] calldata tokens) external onlyOwner {
        uint256 ts;
        uint256 ta;
        uint256 ur;
        uint256 rg;

        for (uint256 i = 0; i < tokens.length; ++i) {
            TokenAgg storage a = _tokenAgg[tokens[i]];
            ts += a.totalStaking;
            ta += a.totalActiveStaking;
            ur += a.totalUngrantedRewards;
            rg += a.totalRewardsGranted;
        }

        // overwrite the global counters so they exactly match the sum of tokens
        totalStaking = ts;
        totalActiveStaking = ta;
        totalUngrantedRewards = ur;
        totalRewardsGranted = rg; // keeps global == sum of per-token (it already matches, but this is symmetric)
    }
    */

    // ----------------------------------------------------------------
    // Staking Logic Helpers
    // ----------------------------------------------------------------
    function _isDevTester(address account) internal view returns (bool) {
        return account == owner() || admins[account];
    }

    // Check allowed durations
    function isNormalDuration(uint256 dur) internal pure returns (bool) {
        return (dur == ONE_MONTH_MINUTES || dur == THREE_MONTHS_MINUTES || dur == SIX_MONTHS_MINUTES || dur == ONE_YEAR_MINUTES);
    }

    function isPromoDuration(uint256 dur) internal pure returns (bool) {
        return (dur == PROMO_ONE_MONTH || dur == PROMO_THREE_MONTHS || dur == PROMO_SIX_MONTHS || dur == PROMO_ONE_YEAR);
    }
    /*
    function _getBaseAPR(uint256 durationInMinutes) internal pure returns (uint256) {
        if (durationInMinutes == ONE_MONTH_MINUTES) {
            return 15; 
        } else if (durationInMinutes == SIX_MONTHS_MINUTES) {
            return 24;
        } else if (durationInMinutes == ONE_YEAR_MINUTES) {
            return 36; 
        } else if (isDev && durationInMinutes == 5) {
            return 10000; // dev shortcut
        }
        revert("APR not calculated");
    }
    */

    function _getAPRRange(
        uint256 durationInMinutes,
        bool isDev
    )
        internal
        view
        returns (uint256 minAPR, uint256 maxAPR)
    {
        // 1) For dev test durations: 5 for normal test, 6 for promo test.
        if (isDev && durationInMinutes == 5) {
            return (5000, 10000);
        } else if (isDev && durationInMinutes == 6) {
            return (10000, 10000);
        }

        // 2) Official Promo durations (must have active promotion)
        if (durationInMinutes == PROMO_ONE_MONTH) {
            if (!isPromotionActive()) revert Promotionnotactive();
            return (10, 10);
        } else if (durationInMinutes == PROMO_THREE_MONTHS) {
            if (!isPromotionActive()) revert Promotionnotactive();
            return (15, 15);
        }else if (durationInMinutes == PROMO_SIX_MONTHS) {
            if (!isPromotionActive()) revert Promotionnotactive();
            return (24, 24);
        } else if (durationInMinutes == PROMO_ONE_YEAR) {
            if (!isPromotionActive()) revert Promotionnotactive();
            return (36, 36);
        } else if (isDev && durationInMinutes == 6 ) {
            if (!isPromotionActive()) revert Promotionnotactive();
            return (10000, 10000);
        }

        // 3) Normal durations
        if (durationInMinutes == ONE_MONTH_MINUTES) {
            return (10, 10);
        }else if (durationInMinutes == THREE_MONTHS_MINUTES) {
            return (12, 15);
        }else if (durationInMinutes == SIX_MONTHS_MINUTES) {
            return (15, 24);
        } else if (durationInMinutes == ONE_YEAR_MINUTES) {
            return (24, 36);
        } else if (durationInMinutes == 5) {
            return (5000, 10000);
        }

        revert Invalidtimerange();
    }

    // ----------------------------------------------------------------
    // Helper: Calculate rewards (using effectiveAPR in fixed-point)
    // ----------------------------------------------------------------
    function _calculateRewards(
        uint256 effectiveAPR,
        uint256 amount,
        uint256 durationInMinutes
    )
        internal
        pure
        returns (uint256 rewards, uint256 adjustedAPR)
    {
        uint256 SHIFT = 1e18;
        uint256 numerator = amount * effectiveAPR * durationInMinutes;
        uint256 denominator = 100 * 1000 * ONE_YEAR_MINUTES;
        rewards = numerator / denominator;
        if (numerator % denominator != 0) {
            rewards += 1;
        }
        adjustedAPR = (effectiveAPR * SHIFT) / (100 * 1000);
    }

    function getAdjustedAPR(
        uint256 amount,
        uint256 durationInMinutes
    )
        external
        view
        returns (
            uint256 adjustedAPR,    // scaled by 1e18
            uint256 effectiveAPR,   // raw APR in 1e3
            uint256 minAPR,
            uint256 maxAPR
        )
    {
        bool isDev = _isDevTester(msg.sender);
        (minAPR, maxAPR) = _getAPRRange(durationInMinutes, isDev);

        uint256 SHIFT = 1e18;
        if (minAPR == maxAPR || amount >= THRESHOLD_AMOUNT) {
            effectiveAPR = maxAPR * 1000;
        } else {
            uint256 stakeRange = THRESHOLD_AMOUNT - MINIMUM_STAKE;
            uint256 userStake = amount > MINIMUM_STAKE ? amount - MINIMUM_STAKE : 0;
            effectiveAPR = (minAPR * 1000) + (userStake * (maxAPR - minAPR) * 1000) / stakeRange;
        }

        adjustedAPR = (effectiveAPR * SHIFT) / 100_000; // same as / (100 * 1e3)
    }


    // Get total claimed rewards across cycles
    function _getTotalClaimedAcrossCycles(address user, bytes32 txnHash) internal view returns (uint256) {
        return totalClaimedAcrossCycles[user][txnHash];
    }

    // Update total claimed rewards across cycles
    function _addToTotalClaimedAcrossCycles(address user, bytes32 txnHash, uint256 amount) internal {
        totalClaimedAcrossCycles[user][txnHash] += amount;
    }

    // Mapping-first resolver with fallback scan for legacy/collision cases.
    function _resolveStakeIndex(
        StakeInfoV1[] storage stakes,
        address user,
        bytes32 txnHash
    ) internal returns (bool found, uint256 idx) {
        if (stakeExistsByHash[user][txnHash]) {
            idx = stakeIndexByHash[user][txnHash];
            if (idx < stakes.length && stakes[idx].txnHash == txnHash) {
                return (true, idx);
            }
            stakeExistsByHash[user][txnHash] = false;
        }

        idx = stakeIndexByHash[user][txnHash];
        if (idx < stakes.length && stakes[idx].txnHash == txnHash) {
            stakeExistsByHash[user][txnHash] = true;
            return (true, idx);
        }
        for (uint256 i = 0; i < stakes.length; ++i) {
            if (stakes[i].txnHash == txnHash) {
                stakeIndexByHash[user][txnHash] = i;
                stakeExistsByHash[user][txnHash] = true;
                return (true, i);
            }
        }
        return (false, 0);
    }

    function _logReviewDetails(
        address admin,
        address user,
        address token,
        uint256 required,
        uint256 available
    ) internal {
        emit Notification(admin, string(
            abi.encodePacked(
                "User: ", _addressToString(user),
                ", Token: ", _addressToString(token),
                ", Required: ", _uintToString(required),
                ", Available: ", _uintToString(available)
            )
        ));
    }

    function _refreshStakeAfterUpdate(
        StakeInfoV1 storage st,
        address user,
        uint256 updatedAmount,
        uint256 originalDuration,
        bool isDev
    ) internal returns (uint256 effectiveAPR, uint256 adjustedAPR, uint256 newRewards) {
        (uint256 minAPR, uint256 maxAPR) = _getAPRRange(originalDuration, isDev);

        if (st.isPromo || updatedAmount >= THRESHOLD_AMOUNT) {
            effectiveAPR = maxAPR * 1000;
        } else {
            effectiveAPR =
                (minAPR * 1000) +
                (((updatedAmount - MINIMUM_STAKE) * (maxAPR - minAPR) * 1000) /
                (THRESHOLD_AMOUNT - MINIMUM_STAKE));
        }

        if (effectiveAPR == 0) revert InvalidAPRCalculation();

        uint256 calcDuration = originalDuration;
        if (st.isPromo && isPromoDuration(originalDuration)) {
            calcDuration = originalDuration - 1;
        }
        if (isDev && originalDuration == 6) {
            calcDuration = 5;
        }

        (newRewards, adjustedAPR) = _calculateRewards(effectiveAPR, updatedAmount, calcDuration);

        st.APR = effectiveAPR;
        st.adjustedAPR = adjustedAPR;
        st.originalRewards = newRewards;
        st.rewards = newRewards;
        st.currentRewards = 0;
        st.claimedRewards = 0;
        st.expectedTotalRewards = newRewards;

        st.claimed = false;
        st.unlockedAt = 0;
        return (effectiveAPR, adjustedAPR, newRewards);
    }




    // ----------------------------------------------------------------
    // Main stake() Function (New Stakes use V1.5 logic)
    // ----------------------------------------------------------------
    function stake(
        address token,
        uint256 durationInMinutes,
        uint256 amount
    ) 
        external 
        whenNotPaused 
        nonReentrant
        onlySupportedToken(token)
    {
        // 1) If promotion has ended, disable promo mode.
        if (ignoreMaxStakingThreshold && block.timestamp >= promoEndTime) {
            ignoreMaxStakingThreshold = false;
            promoEndTime = 0;
            emit Notification(msg.sender, "4::Promo expired");
        }

        // 2) System check.
        if (!systemEnabled && msg.sender != owner()) {
            emit Notification(msg.sender, "4::System is Under Maintenance");
            return;
        }

        // 3) Enforce minimum stake (e.g., 10 USDT in 6 decimals).
        if (amount < MINIMUM_STAKE) {
            emit Notification(msg.sender, "3::Amt<10");
            return;
        }

        // 4) Determine allowed durations.
        bool isDev = _isDevTester(msg.sender);
        if (!(isNormalDuration(durationInMinutes) || isPromoDuration(durationInMinutes))) {
            emit Notification(msg.sender, "3::Invalid duration");
            return;
        }

        // If it is a promo duration, ensure promotion is active.
        if (isPromoDuration(durationInMinutes) && !isPromotionActive()) {
            emit Notification(msg.sender, "4::Promo End");
            return;
        }

        // 5) Calculate stake end time and set staking type.
        uint256 stakeEnd = block.timestamp + (durationInMinutes * 60);
        uint256 stakingType = 1;

        // 6) Determine APR range.
        (uint256 minAPR, uint256 maxAPR) = _getAPRRange(durationInMinutes, isDev);

        // 7) Compute effectiveAPR (scaled by 1e3).
        uint256 effectiveAPR;
        if (isPromoDuration(durationInMinutes)) {
            effectiveAPR = maxAPR * 1000;
        } else {
            if (amount >= THRESHOLD_AMOUNT) {
                effectiveAPR = maxAPR * 1000;
            } else {
                effectiveAPR = (minAPR * 1000) + (((amount - MINIMUM_STAKE) * (maxAPR - minAPR) * 1000) / (THRESHOLD_AMOUNT - MINIMUM_STAKE));
            }
        }

        if (effectiveAPR == 0) revert InvalidAPRCalculation();

        // 8) Adjust duration for promo durations (subtract 1 minute).
        uint256 calcDuration = isPromoDuration(durationInMinutes) ? durationInMinutes - 1 : durationInMinutes;
        if (isDev && durationInMinutes == 6) {
            calcDuration = 5;
        }

        // 9) Transfer tokens.
        if (IERC20Upgradeable(token).allowance(msg.sender, address(this)) < amount) {
            emit Notification(msg.sender, "3::Insufficient token allowance");
            return;
        }

        uint256 balanceBefore = IERC20Upgradeable(token).balanceOf(address(this));
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = IERC20Upgradeable(token).balanceOf(address(this)) - balanceBefore;
        if (received != amount) revert InvalidToken(); // fee-on-transfer tokens not supported
        IERC20Upgradeable(token).safeTransfer(tokenHotWallets[token], received);

        // 10) Compute final rewards.
        (uint256 rewards, uint256 adjustedAPR) = _calculateRewards(effectiveAPR, amount, calcDuration);

        // 11) Create unique stake hash.
        uint256 nonce = ++stakeNonce[msg.sender];
        bytes32 txnHash = keccak256(abi.encode(msg.sender, nonce, amount, token));
        bytes32[] memory emptyClaims = new bytes32[](0);

        // 12) Determine promo parameters.
        bool isPromoStake = isPromoDuration(durationInMinutes) && isPromotionActive();
        stakePromoId[msg.sender][txnHash] = isPromoStake ? currentPromoId : 0;
        stakePromoStatus[msg.sender][txnHash] = isPromoStake;

        // 13) Build new stake using V1.1 logic.
        StakeInfoV1 memory newStake = StakeInfoV1({
            stakedAmount: amount,
            originalStakedAmount: amount,
            stakedAt: block.timestamp,
            stakeEnd: stakeEnd,
            rewards: rewards,
            originalRewards: rewards,
            unlockedAt: 0,
            APR: effectiveAPR,
            adjustedAPR: adjustedAPR,
            claimed: false,
            unstaked: false,
            stakingType: stakingType,
            txnHash: txnHash,
            claimedTxnHashes: emptyClaims,
            currentRewards: 0,
            expectedTotalRewards: rewards,
            unstakeTxnHash: bytes32(0),
            claimedRewards: 0,
            version: 15, // New stakes: V1.5 (version = 15)
            promoId: isPromoStake ? currentPromoId : 0,
            isPromo: isPromoStake,
            addFundAllowed: true
        });

        // 14) Save new stake in V9 mapping and update index mapping.
        multiTokenUserStakesV1[token][msg.sender].push(newStake);
        stakeIndexByHash[msg.sender][txnHash] = multiTokenUserStakesV1[token][msg.sender].length - 1;
        stakeExistsByHash[msg.sender][txnHash] = true;

        totalStaking += amount;
        totalActiveStaking += amount;
        totalUngrantedRewards += rewards;

        _tokenAgg[token].totalStaking          += amount;
        _tokenAgg[token].totalActiveStaking    += amount;
        _tokenAgg[token].totalUngrantedRewards += rewards;
        if (!_seenTokenUser[token][msg.sender]) {
            _seenTokenUser[token][msg.sender] = true;
            _tokenAgg[token].userCount += 1;
        }


        if (!stakingUsers[msg.sender]) {
            stakingUsers[msg.sender] = true;
            stakingUsersKeys.push(msg.sender);
            totalStakingUsers++;
        }

        emit Staked(
            msg.sender,
            token,
            amount,
            effectiveAPR,
            adjustedAPR,
            stakeEnd,
            stakingType,
            txnHash,
            "1::Stake successful (V1.5)"
        );
    }

       // ----------------------------------------------------------------
    // addFund() Function – Allows additional funds to be added to a stake.
    // - Normal stakes (isPromo = false) can always add funds.
    // - For promo stakes, additional funds are allowed only if the promo is still active.
    // ----------------------------------------------------------------
    function addFund(
        address token,
        bytes32 txnHash,
        uint256 additionalAmount
    ) 
        external 
        systemNotDisabled
        whenNotPaused 
        nonReentrant 
        onlySupportedToken(token) 
    {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][msg.sender];
        (bool found, uint256 idx) = _resolveStakeIndex(stakes, msg.sender, txnHash);
        if (!found) {
            emit Notification(msg.sender, "3::Stake not found");
            return;
        }

        StakeInfoV1 storage stakeInfo = stakes[idx];

        if (stakeInfo.version < 12) {
            emit Notification(msg.sender, "3::Old Stakes");
            return;
        }

        if (stakeInfo.unstaked) {
            emit Notification(msg.sender, "3::Already unstaked");
            return;
        }

        if (!stakeInfo.addFundAllowed) {
            emit Notification(msg.sender, "3::Addfunds not allowed");
            return;
        }

        if (stakeInfo.isPromo) {
            if (!isPromotionActive() || block.timestamp >= promoEndTime) {
                emit Notification(msg.sender, "3::Promoended");
                return;
            }
            if (stakeInfo.promoId != currentPromoId) {
                emit Notification(msg.sender, "3::Promo ID mismatch");
                return;
            }
        }

        if (additionalAmount <= 0) {
            emit Notification(msg.sender, "3::Amt>0");
            return;
        }

        if (IERC20Upgradeable(token).allowance(msg.sender, address(this)) < additionalAmount) {
            emit Notification(msg.sender, "3::Insufficient token allowance");
            return;
        }

        // ✅ Calculate and pay unclaimed rewards before resetting the stake
        uint256 elapsedMinutes = (block.timestamp - stakeInfo.stakedAt) / 60;
        (uint256 accrued, ) = _calculateRewards(stakeInfo.APR, stakeInfo.originalStakedAmount, elapsedMinutes);

        if (accrued > stakeInfo.originalRewards) {
            accrued = stakeInfo.originalRewards;
        }

        uint256 unclaimed = 0;
        if (accrued > stakeInfo.claimedRewards) {
            unclaimed = accrued - stakeInfo.claimedRewards;
        }
        if (unclaimed > stakeInfo.rewards) {
            unclaimed = stakeInfo.rewards;
        }

        if (unclaimed != 0) {
            address hw = tokenHotWallets[token];
            uint256 hwBalance = IERC20Upgradeable(token).balanceOf(hw);
            uint256 hwAllowance = IERC20Upgradeable(token).allowance(hw, address(this));

            if (hwBalance >= unclaimed && hwAllowance >= unclaimed) {
                IERC20Upgradeable(token).safeTransferFrom(hw, msg.sender, unclaimed);
                stakeInfo.claimedRewards += unclaimed;
                _addToTotalClaimedAcrossCycles(msg.sender, txnHash, unclaimed);
                stakeInfo.rewards -= unclaimed;
                totalRewardsGranted += unclaimed;
                totalUngrantedRewards -= unclaimed;

                _tokenAgg[token].totalRewardsGranted   += unclaimed;
                _tokenAgg[token].totalUngrantedRewards -= unclaimed;

                bytes32 claimedTxnHash = keccak256(abi.encodePacked(msg.sender, txnHash, block.timestamp, unclaimed, token));
                stakeInfo.claimedTxnHashes.push(claimedTxnHash);
                claimedRewardsByHash[claimedTxnHash] = unclaimed;

                emit RewardsClaimed(msg.sender, token, unclaimed, txnHash, claimedTxnHash, "1::Rewards claimed");
            } else {
                revert InsufficientHotWalletLiquidity();
            }
        }

        // ✅ Proceed with fund addition
        uint256 balanceBefore = IERC20Upgradeable(token).balanceOf(address(this));
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), additionalAmount);
        uint256 received = IERC20Upgradeable(token).balanceOf(address(this)) - balanceBefore;
        if (received != additionalAmount) revert InvalidToken(); // fee-on-transfer tokens not supported
        IERC20Upgradeable(token).safeTransfer(tokenHotWallets[token], received);

        uint256 oldAmount = stakeInfo.stakedAmount;
        uint256 oldRemainingRewards = stakeInfo.rewards;

        // 1. Update stake amount
        stakeInfo.stakedAmount += additionalAmount;
        stakeInfo.originalStakedAmount = stakeInfo.stakedAmount;

        // 2. Reset duration
        uint256 originalDuration = (stakeInfo.stakeEnd - stakeInfo.stakedAt) / 60;
        stakeInfo.stakedAt = block.timestamp;
        stakeInfo.stakeEnd = block.timestamp + (originalDuration * 60);
        stakeInfo.stakingType = 1;

        // 3. Recalculate rewards using shared logic
        bool isDev = _isDevTester(msg.sender);

        (uint256 effectiveAPR, , uint256 newRewards) = _refreshStakeAfterUpdate(
            stakeInfo,
            msg.sender,
            stakeInfo.stakedAmount,
            originalDuration,
            isDev
        );

        // 4. Defensive check; _refreshStakeAfterUpdate already reverts on APR failure.
        if (effectiveAPR == 0) revert InvalidAPRCalculation();

        // 5. Global updates
        if (newRewards > oldRemainingRewards) {
            uint256 inc = newRewards - oldRemainingRewards;
            totalUngrantedRewards += inc;
            _tokenAgg[token].totalUngrantedRewards += inc;
        } else if (oldRemainingRewards > newRewards) {
            uint256 dec = oldRemainingRewards - newRewards;
            totalUngrantedRewards -= dec;
            _tokenAgg[token].totalUngrantedRewards -= dec;
        }
        totalStaking += additionalAmount;
        totalActiveStaking += additionalAmount;

        _tokenAgg[token].totalStaking          += additionalAmount;
        _tokenAgg[token].totalActiveStaking    += additionalAmount;

        // 6. Emit event
        emit Fundadded(
            msg.sender,
            token,
            oldAmount,
            additionalAmount,
            stakeInfo.stakedAmount,
            newRewards,
            effectiveAPR,
            originalDuration,
            "1::Fund added Successful"
        );

    }


    // ----------------------------------------------------------------
    // claimRewards() Function – Claim available rewards.
    // This implementation operates on V9 stakes.
    // ----------------------------------------------------------------
    function claimRewards(address token, bytes32 txnHash) 
        external 
        systemNotDisabled 
        whenNotPaused 
        nonReentrant 
        onlySupportedToken(token) 
    {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][msg.sender];
        (bool found, uint256 stakeIndex) = _resolveStakeIndex(stakes, msg.sender, txnHash);
        if (!found) {
            emit Notification(msg.sender, "3::Stake not found");
            return;
        }

        StakeInfoV1 storage stakeInfo = stakes[stakeIndex];

        if (stakeInfo.unstaked) {
            emit Notification(msg.sender, "3::Already unstaked");
            return;
        }

        uint256 currentTimestamp = block.timestamp;
        uint256 elapsedMinutes = (currentTimestamp - stakeInfo.stakedAt) / 60;

        (uint256 totalAccrued, ) = _calculateRewards(
            stakeInfo.APR,
            stakeInfo.originalStakedAmount,
            elapsedMinutes
        );

        if (totalAccrued > stakeInfo.originalRewards) {
            totalAccrued = stakeInfo.originalRewards;
        }

        uint256 newClaimable = 0;
        if (totalAccrued > stakeInfo.claimedRewards) {
            newClaimable = totalAccrued - stakeInfo.claimedRewards;
        }
        if (newClaimable > stakeInfo.rewards) {
            newClaimable = stakeInfo.rewards;
        }

        if (newClaimable == 0) {
            emit Notification(msg.sender, "3::No rewards available.");
            return;
        }

        address hw = tokenHotWallets[token];
        uint256 hwBalance = IERC20Upgradeable(token).balanceOf(hw);
        uint256 hwAllowance = IERC20Upgradeable(token).allowance(hw, address(this));

        // If hot wallet balance OR allowance is insufficient, tell user to retry later,
        // and emit an admin-facing event (your backend/bot can listen for it).
        if (hwBalance < newClaimable || hwAllowance < newClaimable) {
            revert InsufficientHotWalletLiquidity();
        }

        IERC20Upgradeable(token).safeTransferFrom(hw, msg.sender, newClaimable);

        stakeInfo.claimedRewards += newClaimable;
        _addToTotalClaimedAcrossCycles(msg.sender, txnHash, newClaimable);
        stakeInfo.rewards -= newClaimable;
        totalRewardsGranted += newClaimable;
        totalUngrantedRewards -= newClaimable;

        _tokenAgg[token].totalRewardsGranted   += newClaimable;
        _tokenAgg[token].totalUngrantedRewards -= newClaimable;

        uint256 stillAccrued = totalAccrued > stakeInfo.claimedRewards
            ? totalAccrued - stakeInfo.claimedRewards
            : 0;
        stakeInfo.currentRewards = stillAccrued;

        if (stakeInfo.rewards == 0) {
            stakeInfo.claimed = true;
        }

        bytes32 claimedTxnHash = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, newClaimable, token)
        );
        stakeInfo.claimedTxnHashes.push(claimedTxnHash);
        claimedRewardsByHash[claimedTxnHash] = newClaimable;

        emit RewardsClaimed(
            msg.sender,
            token,
            newClaimable,
            txnHash,
            claimedTxnHash,
            "1::Rewards Claimed Successful"
        );

        // Auto-renew only for normal (non-promo) stakes
        if (
            stakeInfo.version >= 12 &&
            !stakeInfo.isPromo &&
            block.timestamp >= stakeInfo.stakeEnd
        ) {
            uint256 cycleDurationSec = stakeInfo.stakeEnd - stakeInfo.stakedAt;
            uint256 cycleDurationMin = cycleDurationSec / 60;

            if (isPromoDuration(cycleDurationMin)) {
                emit Notification(msg.sender, "3::Cannot auto-renew promo stake");
                return;
            }

            stakeInfo.stakingType += 1;
            stakeInfo.stakedAt = block.timestamp;
            stakeInfo.stakeEnd = block.timestamp + cycleDurationSec;

            (uint256 newCycleRewards, uint256 newCycleAdjAPR) = _calculateRewards(
                stakeInfo.APR,
                stakeInfo.stakedAmount,
                cycleDurationMin
            );

            stakeInfo.originalRewards = newCycleRewards;
            stakeInfo.rewards = newCycleRewards;
            stakeInfo.claimedRewards = 0;
            stakeInfo.currentRewards = 0;
            stakeInfo.expectedTotalRewards = newCycleRewards;
            stakeInfo.originalStakedAmount = stakeInfo.stakedAmount;
            stakeInfo.adjustedAPR = newCycleAdjAPR;
            stakeInfo.claimed = false;

            totalUngrantedRewards += stakeInfo.rewards;
            totalStaking += stakeInfo.stakedAmount;
            //totalActiveStaking += stakeInfo.stakedAmount;

            _tokenAgg[token].totalUngrantedRewards += stakeInfo.rewards;
            _tokenAgg[token].totalStaking          += stakeInfo.stakedAmount;
            //_tokenAgg[token].totalActiveStaking    += stakeInfo.stakedAmount;

            emit StakeRenewed(
                msg.sender,
                token,
                txnHash,
                stakeInfo.stakingType,
                stakeInfo.stakedAt,
                stakeInfo.stakeEnd,
                "1::Stake renewed"
            );
        }
    }
    function _pad3(uint256 value) internal pure returns (string memory) {
        if (value >= 100) return _uintToString(value);
        if (value >= 10) return string(abi.encodePacked("0", _uintToString(value)));
        return string(abi.encodePacked("00", _uintToString(value)));
    }


    // ----------------------------------------------------------------
    // unstake() Function – Unstake and claim rewards.
    // This version operates on V9 stakes.
    // ----------------------------------------------------------------
    function unstake(address token, bytes32 txnHash, uint256 unstakeAmount)
        external
        systemNotDisabled
        whenNotPaused
        nonReentrant
        onlySupportedToken(token)
    {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][msg.sender];
        (bool found, uint256 foundIndex) = _resolveStakeIndex(stakes, msg.sender, txnHash);
        if (!found) {
            emit Notification(msg.sender, "3::Stake not found");
            return;
        }

        StakeInfoV1 storage st = stakes[foundIndex];
        if (st.unstaked) {
            emit Notification(msg.sender, "3::Already unstaked");
            return;
        }

        if (unstakeAmount == 0 || unstakeAmount > st.stakedAmount) {
            emit Notification(msg.sender, "3::Invalid unstake amount");
            return;
        }

        // Validate partial/full unstake path before any payout.
        if (unstakeAmount != st.stakedAmount) {
            if (st.isPromo) {
                emit Notification(msg.sender, "3::Partial unstake not allowed for promo stakes");
                return;
            }
            if (st.version < 13) {
                emit Notification(msg.sender, "3::Old Stake");
                return;
            }
            uint256 remainingPreview = st.stakedAmount - unstakeAmount;
            if (remainingPreview < 10 * DECIMAL_FACTOR) {
                emit Notification(msg.sender, "3::Remaining stake must be > 10 USDT");
                return;
            }
        }

        // ---- STEP 1: Calculate rewards ----
        uint256 elapsedMin = (block.timestamp - st.stakedAt) / 60;
        (uint256 totalAccrued, ) = _calculateRewards(st.APR, st.originalStakedAmount, elapsedMin);
        if (totalAccrued > st.originalRewards) {
            totalAccrued = st.originalRewards;
        }

        uint256 claimable = totalAccrued > st.claimedRewards ? totalAccrued - st.claimedRewards : 0;
        if (claimable > st.rewards) {
            claimable = st.rewards;
        }

        address hw = tokenHotWallets[token];
        uint256 hwBalance = IERC20Upgradeable(token).balanceOf(hw);
        uint256 hwAllowance = IERC20Upgradeable(token).allowance(hw, address(this));

        // ---- STEP 2: Try to pay out rewards first ----
        if (claimable != 0) {
            if (hwBalance >= claimable && hwAllowance >= claimable) {
                // Enough balance: pay out rewards
                IERC20Upgradeable(token).safeTransferFrom(hw, msg.sender, claimable);

                st.claimedRewards += claimable;
                st.rewards -= claimable;
                _addToTotalClaimedAcrossCycles(msg.sender, txnHash, claimable);
                totalRewardsGranted += claimable;
                totalUngrantedRewards -= claimable;

                _tokenAgg[token].totalRewardsGranted   += claimable;
                _tokenAgg[token].totalUngrantedRewards -= claimable;

                bytes32 claimedTxnHash = keccak256(abi.encodePacked(msg.sender, txnHash, block.timestamp, claimable, token));
                st.claimedTxnHashes.push(claimedTxnHash);
                claimedRewardsByHash[claimedTxnHash] = claimable;

                // Admin-only log, not for user
                emit Notification(owner(), "4::Rewards claimed.");
                hwBalance = hwBalance - claimable;
                hwAllowance = hwAllowance >= claimable ? hwAllowance - claimable : 0;
            } else {
                revert InsufficientHotWalletLiquidity();
            }
        }

        // ---- STEP 3: Calculate penalty ----
        uint256 penalty = 0;
        uint256 rawPenaltyPercent = 0;
        uint256 SCALE = 1000;
        uint256 totalMinutes = (st.stakeEnd - st.stakedAt) / 60;
        uint256 remainingSeconds = st.stakeEnd > block.timestamp ? (st.stakeEnd - block.timestamp) : 0;
        uint256 totalMinutesX1000 = totalMinutes * 1000;
        uint256 remainingMinutesX1000 = (remainingSeconds * 1000) / 60;

        if (block.timestamp < st.stakeEnd && st.stakingType < 2) {
            if (st.isPromo && st.version >= 13) {
                if (totalMinutes == 6) {
                    rawPenaltyPercent = 50000;
                } else if (totalMinutes <= 44640) {
                    rawPenaltyPercent = 10000;
                } else if (totalMinutes <= 133920) {
                    rawPenaltyPercent = 15000;
                } else if (totalMinutes <= 267840) {
                    rawPenaltyPercent = 24000;
                } else {
                    rawPenaltyPercent = 36000;
                }
            } else if (st.version >= 13 || totalMinutes == 5) {
                uint256 maxPenalty = totalMinutes <= 5 ? 36 :
                    totalMinutes <= 44640 ? 10 :
                    totalMinutes <= 133920 ? 15 :
                    totalMinutes <= 267840 ? 24 : 36;

                rawPenaltyPercent = ((maxPenalty - 10) * remainingMinutesX1000 * SCALE) / totalMinutesX1000 + (10 * SCALE);
            } else {
                rawPenaltyPercent = 10000;
            }

            penalty = (unstakeAmount * rawPenaltyPercent) / (100 * SCALE);

            uint256 intPart = rawPenaltyPercent / 1000;
            uint256 decimalPart = rawPenaltyPercent % 1000;
            string memory penaltyDetail = unstakeAmount < st.stakedAmount
                ? string(abi.encodePacked("4::Partial Unstake: Penalty ", _uintToString(intPart), ".", _pad3(decimalPart), "%"))
                : string(abi.encodePacked("4::Full Unstake: Penalty ", _uintToString(intPart), ".", _pad3(decimalPart), "%"));
            emit Notification(owner(), penaltyDetail); // admin only, not user
        }

        // ---- STEP 4: Try to pay unstake amount (after penalty) ----
        uint256 totalToReturn = unstakeAmount - penalty;

        if (hwBalance < totalToReturn || hwAllowance < totalToReturn) {
            revert InsufficientHotWalletLiquidity();
        }

        // ---- STEP 5: Pay unstake amount ----
        IERC20Upgradeable(token).safeTransferFrom(hw, msg.sender, totalToReturn);

        // ---- STEP 6: Partial or Full Unstake State Update ----
        bool wasMatured = (block.timestamp >= st.stakeEnd);

        if (unstakeAmount == st.stakedAmount) {
            // Full unstake
            uint256 residualRewards = st.rewards;
            if (residualRewards != 0) {
                totalUngrantedRewards -= residualRewards;
                _tokenAgg[token].totalUngrantedRewards -= residualRewards;
                st.rewards = 0;
            }
            st.unstaked = true;
            st.claimed = true;
            st.addFundAllowed = false;
            st.unlockedAt = block.timestamp;
            st.unstakeTxnHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalToReturn, token));
            totalActiveStaking -= unstakeAmount;
            _tokenAgg[token].totalActiveStaking    -= unstakeAmount;

            emit Unstaked(
                msg.sender,
                token,
                wasMatured ? 0 : penalty,
                totalToReturn,
                claimable,
                st.unlockedAt,
                st.unstakeTxnHash,
                "4::Unstake successful" // admin log only
            );
            emit Notification(msg.sender, "1::Unstake successful");
        } else {
            // Partial unstake allowed
            uint256 remaining = st.stakedAmount - unstakeAmount;
            partialUnstakedPrincipalTotal[msg.sender][token] += unstakeAmount;
            // Track old rewards to compute the delta after refresh
            uint256 oldRewards = st.rewards;

            totalActiveStaking -= unstakeAmount;
            _tokenAgg[token].totalActiveStaking    -= unstakeAmount;
            st.stakedAmount = remaining;
            st.originalStakedAmount = remaining;

            uint256 originalDuration = (st.stakeEnd - st.stakedAt) / 60;

            bool wasRenewed = (st.stakingType >= 2);

            if (wasRenewed) {
                st.stakingType = 1;
            }

            st.stakedAt = block.timestamp;
            st.stakeEnd = block.timestamp + (originalDuration * 60);

            st.unstakeTxnHash = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalToReturn, token));
            bool isDev = _isDevTester(msg.sender);
            (uint256 effectiveAPR, , ) = _refreshStakeAfterUpdate(
                st,
                msg.sender,
                remaining,
                originalDuration,
                isDev
            );

            require(effectiveAPR != 0);

            uint256 newRewards = st.rewards;
            if (newRewards > oldRewards) {
                uint256 inc = newRewards - oldRewards;
                totalUngrantedRewards += inc;
                _tokenAgg[token].totalUngrantedRewards += inc;
            } else if (oldRewards > newRewards) {
                uint256 dec = oldRewards - newRewards;
                totalUngrantedRewards -= dec;
                _tokenAgg[token].totalUngrantedRewards -= dec;
            }

            uint256 intPart = rawPenaltyPercent / 1000;
            uint256 decimalPart = rawPenaltyPercent % 1000;
            string memory msgText;
            string memory penaltyText = string(abi.encodePacked("Penalty ", _uintToString(intPart), ".", _pad3(decimalPart), "%"));
            if (wasRenewed) {
                msgText = "1::Partial Unstake on Renewed stake.";
            } else if (wasMatured) {
                msgText = "1::Partial Unstake (matured, refreshed)";
            } else {
                    msgText = string(abi.encodePacked("1::Partial Unstake (active): ", penaltyText));
            }

            emit PartialUnstaked(
                msg.sender,
                token,
                unstakeAmount,
                wasMatured ? 0 : penalty,
                remaining,
                block.timestamp,
                st.unstakeTxnHash,
                msgText
            );

        }

        // ---- STEP 7: Reset unstake review timer ----
        unstakeReviewStartTime[msg.sender][txnHash] = 0;
    }

    function getTokenAgg(address token)
        external
        view
        returns (
            uint256 totalStaked,
            uint256 totalActive,
            uint256 rewardsGranted,
            uint256 ungrantedRewards,
            uint256 stakingUsersCount
        )
    {
        TokenAgg storage a = _tokenAgg[token];
        return (
            a.totalStaking,
            a.totalActiveStaking,
            a.totalRewardsGranted,
            a.totalUngrantedRewards,
            a.userCount
        );
    }


    // ----------------------------------------------------------------
    // Pagination & Summaries (Legacy functions using V8 stakes)
    // For brevity these are kept unchanged; in a full migration you may update these to use V9.
    // ----------------------------------------------------------------
    /*
    function getUserLockedStakesPaginated(
        address user,
        address token,
        uint256 pageIndex,
        uint256 rowNumberPerPage
    )
        public
        view
        returns (
            uint256 page,
            uint256 limit,
            StakeInfoV1[] memory data,
            uint256 size
        )
    {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][user];
        uint256 totalStakes = stakes.length;
        uint256 filteredCount = 0;
        for (uint256 i = 0; i < totalStakes; ++i) {
            if (!stakes[i].unstaked) {
                filteredCount++;
            }
        }
        size = filteredCount;
        page = pageIndex;
        limit = rowNumberPerPage;
        if (size == 0) revert Nolockedstakesfound();
        uint256 start = (pageIndex - 1) * rowNumberPerPage;
        if (start >= size) revert indexoutofrange();
        uint256 end = start + rowNumberPerPage > size ? size : start + rowNumberPerPage;
        
        StakeInfoV1[] memory lockedStakes = new StakeInfoV1[](size);
        uint256 index = 0;
        for (uint256 i = 0; i < totalStakes; ++i) {
            if (!stakes[i].unstaked) {
                lockedStakes[index] = stakes[i];
                index++;
            }
        }
        for (uint256 i = 0; i < size - 1; ++i) {
            for (uint256 j = 0; j < size - i - 1; j++) {
                if (lockedStakes[j].stakedAt < lockedStakes[j + 1].stakedAt) {
                    StakeInfoV1 memory temp = lockedStakes[j];
                    lockedStakes[j] = lockedStakes[j + 1];
                    lockedStakes[j + 1] = temp;
                }
            }
        }
        StakeInfoV1[] memory stakesPage = new StakeInfoV1[](end - start);
        for (uint256 i = start; i < end; ++i) {
            StakeInfoV1 memory userStake = lockedStakes[i];
            uint256 durationMinutes = (userStake.stakeEnd - userStake.stakedAt) / 60;
            uint256 elapsedMinutes = block.timestamp > userStake.stakeEnd ? durationMinutes : (block.timestamp - userStake.stakedAt) / 60;
            (uint256 accruedRewards, uint256 adjAPR) = _calculateRewards(userStake.APR, userStake.originalStakedAmount, elapsedMinutes);
            if (accruedRewards > userStake.originalRewards) {
                accruedRewards = userStake.originalRewards;
            }
            uint256 unclaimedRewards = accruedRewards > userStake.claimedRewards ? accruedRewards - userStake.claimedRewards : 0;
            if (unclaimedRewards > userStake.rewards) {
                unclaimedRewards = userStake.rewards;
            }
            userStake.currentRewards = unclaimedRewards;
            userStake.adjustedAPR = adjAPR;
            stakesPage[i - start] = userStake;
        }
        return (page, limit, stakesPage, size);
    }

    function getUserUnlockedStakesPaginated(
        address user,
        address token,
        uint256 pageIndex,
        uint256 rowNumberPerPage
    )
        public
        view
        returns (
            uint256 page,
            uint256 limit,
            StakeInfoV1[] memory data,
            uint256 size
        )
    {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][user];
        uint256 total = stakes.length;
        uint256 unlockedCount = 0;
        for (uint256 i = 0; i < total; ++i) {
            if (stakes[i].unstaked && stakes[i].claimed) {
                unlockedCount++;
            }
        }
        if (unlockedCount == 0) revert Nounlockedstakesfound();
        page = pageIndex;
        limit = rowNumberPerPage;
        size = unlockedCount;
        uint256 start = (pageIndex - 1) * rowNumberPerPage;
        if (start >= unlockedCount) revert indexoutofrange();
        uint256 end = (start + rowNumberPerPage > unlockedCount) ? unlockedCount : (start + rowNumberPerPage);
        StakeInfoV1[] memory tmp = new StakeInfoV1[](unlockedCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; ++i) {
            if (stakes[i].unstaked && stakes[i].claimed) {
                tmp[idx] = stakes[i];
                idx++;
            }
        }
        for (uint256 i = 0; i < unlockedCount - 1; ++i) {
            for (uint256 j = 0; j < unlockedCount - i - 1; j++) {
                if (tmp[j].unlockedAt < tmp[j + 1].unlockedAt) {
                    (tmp[j], tmp[j + 1]) = (tmp[j + 1], tmp[j]);
                }
            }
        }
        StakeInfoV1[] memory pageData = new StakeInfoV1[](end - start);
        for (uint256 i = start; i < end; ++i) {
            StakeInfoV1 memory s = tmp[i];
            uint256 durationMinutes = s.stakeEnd > s.stakedAt ? (s.stakeEnd - s.stakedAt) / 60 : 0;
            uint256 elapsedMinutes = block.timestamp > s.stakeEnd ? durationMinutes : (block.timestamp - s.stakedAt) / 60;
            (s.currentRewards, s.adjustedAPR) = _calculateRewards(s.APR, s.originalStakedAmount, elapsedMinutes);
            if (s.currentRewards > s.expectedTotalRewards) {
                s.currentRewards = s.expectedTotalRewards;
            }
            pageData[i - start] = s;
        }
        return (page, limit, pageData, size);
    }
    */

    // Summaries
    function getUserLockedStakesSummary(address user, address token)
        public
        view
        returns (uint256 totalStaked, uint256 totalClaimedRewards)
    {
        StakeInfoV1[] storage arr = multiTokenUserStakesV1[token][user];
        for (uint256 i = 0; i < arr.length; ++i) {
            StakeInfoV1 storage s = arr[i];
            if (!s.unstaked) {
                totalStaked += s.stakedAmount;
                totalClaimedRewards += _getTotalClaimedAcrossCycles(user, s.txnHash);
            }
        }
    }


    function getUserUnlockedStakesSummary(address user, address token)
        public
        view
        returns (uint256 totalStaked, uint256 totalRewardsClaimed)
    {
        totalStaked = partialUnstakedPrincipalTotal[user][token];
        StakeInfoV1[] storage arr = multiTokenUserStakesV1[token][user];
        for (uint256 i = 0; i < arr.length; ++i) {
            StakeInfoV1 storage s = arr[i];
            if (s.unstaked) {
                totalStaked += s.stakedAmount;
                totalRewardsClaimed += _getTotalClaimedAcrossCycles(user, s.txnHash);
            }
        }
    }
   

    function getAllStakingUserAddresses() external view returns (address[] memory) {
        return stakingUsersKeys;
    }


    // OLD struct replaced with per-token variant
    struct WalletStakeSummary {
        address walletAddress;         // the wallet you asked for
        address token;                 // token on this chain
        uint256 totalHistoryStake;     // sum of stakedAmount in time window
        uint256 totalHistoryStakeCount;// number of entries in time window
    }

    // Same function name, returns rows per (wallet, token)
    function getWalletStakeSummaries(
        uint256 fromTime,
        uint256 endTime,
        address[] calldata walletAddresses
    )
        external
        view
        returns (WalletStakeSummary[] memory summaries)
    {
        if (fromTime > endTime) revert Invalidtimerange();

        uint256 T = allTokenAddresses.length;
        uint256 W = walletAddresses.length;

        // one row per (wallet, token) pair
        summaries = new WalletStakeSummary[](W * T);
        uint256 idx = 0;

        for (uint256 w = 0; w < W; w++) {
            address wallet = walletAddresses[w];

            for (uint256 t = 0; t < T; t++) {
                address token = allTokenAddresses[t];

                uint256 totalAmount = 0;
                uint256 count = 0;

                // sum this wallet’s stakes for this token in the time window
                StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][wallet];
                for (uint256 i = 0; i < stakes.length; ++i) {
                    StakeInfoV1 storage st = stakes[i];
                    if (st.stakedAt >= fromTime && st.stakedAt <= endTime) {
                        totalAmount += st.stakedAmount;
                        count += 1; // renewals count as separate entries
                    }
                }

                summaries[idx] = WalletStakeSummary({
                    walletAddress: wallet,
                    token: token,
                    totalHistoryStake: totalAmount,
                    totalHistoryStakeCount: count
                });
                idx++;
            }
        }

        return summaries;
    }


    function getAllUserStakes(
        address user,
        address token
    ) external view returns (StakeInfoV1[] memory) {
        StakeInfoV1[] storage stakes = multiTokenUserStakesV1[token][user];
        uint256 total = stakes.length;

        // Step 1: count all locked + unlocked stakes
        uint256 count = 0;
        for (uint256 i = 0; i < total; ++i) {
            if (!stakes[i].unstaked || (stakes[i].unstaked && stakes[i].claimed)) {
                count++;
            }
        }
        if (count == 0) revert Nolockedstakesfound();

        // Step 2: collect filtered stakes
        StakeInfoV1[] memory tmp = new StakeInfoV1[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; ++i) {
            if (!stakes[i].unstaked || (stakes[i].unstaked && stakes[i].claimed)) {
                tmp[idx] = stakes[i];
                idx++;
            }
        }

        // Step 3: sort (locked by stakedAt, unlocked by unlockedAt)
        for (uint256 i = 0; i < count - 1; ++i) {
            for (uint256 j = 0; j < count - i - 1; j++) {
                uint256 timeA = tmp[j].unstaked ? tmp[j].unlockedAt : tmp[j].stakedAt;
                uint256 timeB = tmp[j + 1].unstaked ? tmp[j + 1].unlockedAt : tmp[j + 1].stakedAt;
                if (timeA < timeB) {
                    (tmp[j], tmp[j + 1]) = (tmp[j + 1], tmp[j]);
                }
            }
        }

        // Step 4: recalc rewards (same logic as paginated funcs)
        for (uint256 i = 0; i < count; ++i) {
            StakeInfoV1 memory s = tmp[i];
            uint256 durationMinutes = s.stakeEnd > s.stakedAt ? (s.stakeEnd - s.stakedAt) / 60 : 0;
            uint256 elapsedMinutes = block.timestamp > s.stakeEnd
                ? durationMinutes
                : (block.timestamp - s.stakedAt) / 60;

            if (s.unstaked && s.claimed) {
                // 🔓 unlocked branch
                (s.currentRewards, s.adjustedAPR) = _calculateRewards(
                    s.APR,
                    s.originalStakedAmount,
                    elapsedMinutes
                );
                if (s.currentRewards > s.expectedTotalRewards) {
                    s.currentRewards = s.expectedTotalRewards;
                }
            } else {
                // 🔒 locked branch
                (uint256 accruedRewards, uint256 adjAPR) = _calculateRewards(
                    s.APR,
                    s.originalStakedAmount,
                    elapsedMinutes
                );
                if (accruedRewards > s.originalRewards) {
                    accruedRewards = s.originalRewards;
                }
                uint256 unclaimedRewards = accruedRewards > s.claimedRewards
                    ? accruedRewards - s.claimedRewards
                    : 0;
                if (unclaimedRewards > s.rewards) {
                    unclaimedRewards = s.rewards;
                }
                s.currentRewards = unclaimedRewards;
                s.adjustedAPR = adjAPR;
            }

            tmp[i] = s;
        }

        return tmp;
    }

    function debugCheckStakeIndex(address user, bytes32 txnHash) external view returns (uint256) {
        return stakeIndexByHash[user][txnHash];
    }


}



