// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

interface IYarnBurnHistory {
    function burnedInWeek(uint256 week) external view returns (uint256);
}

/// @notice Pre-funded, Fuji-only claims. No issuance or discretionary withdrawal of the reward pool.
contract SeasonRewards is EIP712, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Claim {
        address player;
        uint256 amount;
        uint256 season;
        uint256 nonce;
        uint256 expiry;
    }
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("Claim(address player,uint256 amount,uint256 season,uint256 nonce,uint256 expiry)");
    bytes32 public constant TESTER_CLAIM_TYPEHASH =
        keccak256("TesterClaim(address player,uint256 amount,uint256 season,uint256 nonce,uint256 expiry)");
    uint256 public constant TESTER_GRANT = 20 ether;
    uint256 public constant BASE_ROUTINE_CAP = 12 ether;
    uint256 public constant POLICY_SCALE = 1 ether;
    uint256 public constant HEALTH_THRESHOLD = 0.8 ether;
    IERC20 public immutable yarn;
    uint256 public immutable weeklyCap;
    uint256 public immutable seasonEpoch;
    uint256 public constant SEASON_LENGTH = 13 weeks;
    address public signer;
    mapping(uint256 => bool) public usedNonces;
    mapping(address => mapping(uint256 => uint256)) public claimedInWeek;
    mapping(address => mapping(uint256 => uint256)) public routineClaimedInWeek;
    mapping(address => bool) public testerClaimed;
    mapping(uint256 => uint256) public emittedInSeason;
    mapping(uint256 => uint256) public policyMultiplier;
    uint256 public lastPolicySeason;
    event Claimed(address indexed player, uint256 indexed season, uint256 indexed nonce, uint256 amount, uint256 week);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);
    event SeasonPolicyApplied(uint256 indexed season, uint256 priorEmission, uint256 priorBurn, uint256 multiplier);
    error InvalidConfig();
    error InvalidClaim();
    error InvalidSignature();
    error NonceUsed();
    error WeeklyCap();
    error RenounceDisabled();

    constructor(address token, address owner_, address signer_, uint256 cap, uint256 epoch)
        EIP712("TaskbarHeroSeasonRewards", "1")
        Ownable(owner_)
    {
        if (
            block.chainid != 43113 || token.code.length == 0 || cap < TESTER_GRANT + BASE_ROUTINE_CAP
                || epoch > block.timestamp || epoch < 4 days || (epoch - 4 days) % 1 weeks != 0
        ) revert InvalidConfig();
        yarn = IERC20(token);
        weeklyCap = cap;
        seasonEpoch = epoch;
        policyMultiplier[0] = POLICY_SCALE;
        _signer(signer_);
    }

    function currentSeason() public view returns (uint256) {
        return (block.timestamp - seasonEpoch) / SEASON_LENGTH;
    }

    /// @notice UTC Monday weeks, independent of season or nonce namespaces.
    function currentWeek() public view returns (uint256) {
        return (block.timestamp - 4 days) / 1 weeks;
    }

    function hashClaim(Claim memory c) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, c.player, c.amount, c.season, c.nonce, c.expiry)));
    }

    function hashTesterClaim(Claim memory c) public view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(abi.encode(TESTER_CLAIM_TYPEHASH, c.player, c.amount, c.season, c.nonce, c.expiry))
            );
    }

    /// @notice Actual token burns only. Treasury receipts, native-coin sinks and transfers do not count.
    function burnedInSeason(uint256 season) public view returns (uint256 burned) {
        uint256 firstWeek = (seasonEpoch - 4 days) / 1 weeks + season * 13;
        for (uint256 week = firstWeek; week < firstWeek + 13; week++) {
            burned += IYarnBurnHistory(address(yarn)).burnedInWeek(week);
        }
    }

    function _nextMultiplier(uint256 previous, uint256 emission, uint256 burned) private pure returns (uint256) {
        if (emission == 0) return previous;
        uint256 ratio = Math.mulDiv(burned, POLICY_SCALE, emission);
        if (ratio >= HEALTH_THRESHOLD) return previous;
        uint256 reduction = Math.min(HEALTH_THRESHOLD, Math.mulDiv(ratio, POLICY_SCALE, HEALTH_THRESHOLD));
        return Math.mulDiv(previous, reduction, POLICY_SCALE);
    }

    /// @notice Reads the automatically reduced weekly routine budget, even before the next transaction.
    function currentRoutineBudget() public view returns (uint256) {
        uint256 multiplier = policyMultiplier[lastPolicySeason];
        uint256 season = currentSeason();
        for (uint256 prior = lastPolicySeason; prior < season; prior++) {
            multiplier = _nextMultiplier(multiplier, emittedInSeason[prior], burnedInSeason(prior));
        }
        return Math.mulDiv(BASE_ROUTINE_CAP, multiplier, POLICY_SCALE);
    }

    /// @notice Permissionless bookkeeping; every claim also rolls automatically. No keeper or oracle required.
    function rollSeasons() public {
        uint256 season = currentSeason();
        while (lastPolicySeason < season) {
            uint256 prior = lastPolicySeason;
            uint256 emission = emittedInSeason[prior];
            uint256 burned = burnedInSeason(prior);
            uint256 multiplier = _nextMultiplier(policyMultiplier[prior], emission, burned);
            lastPolicySeason = prior + 1;
            policyMultiplier[lastPolicySeason] = multiplier;
            emit SeasonPolicyApplied(lastPolicySeason, emission, burned, multiplier);
        }
    }

    function claim(Claim calldata c, bytes calldata signature) external nonReentrant {
        _validate(c, signature, hashClaim(c));
        rollSeasons();
        uint256 week = currentWeek();
        uint256 budget = Math.mulDiv(BASE_ROUTINE_CAP, policyMultiplier[c.season], POLICY_SCALE);
        if (c.amount > budget - routineClaimedInWeek[c.player][week]) revert WeeklyCap();
        routineClaimedInWeek[c.player][week] += c.amount;
        _pay(c, week);
    }

    /// @notice A separate signature type and lifetime guard prevent routine rewards posing as tester grants.
    function claimTester(Claim calldata c, bytes calldata signature) external nonReentrant {
        _validate(c, signature, hashTesterClaim(c));
        if (c.amount != TESTER_GRANT || testerClaimed[c.player]) revert InvalidClaim();
        rollSeasons();
        testerClaimed[c.player] = true;
        _pay(c, currentWeek());
    }

    function _validate(Claim calldata c, bytes calldata signature, bytes32 digest) private view {
        if (msg.sender != c.player || c.amount == 0 || block.timestamp > c.expiry || c.season != currentSeason()) {
            revert InvalidClaim();
        }
        if (usedNonces[c.nonce]) revert NonceUsed();
        (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, signature);
        if (err != ECDSA.RecoverError.NoError || recovered != signer) revert InvalidSignature();
    }

    function _pay(Claim calldata c, uint256 week) private {
        uint256 already = claimedInWeek[c.player][week];
        if (c.amount > weeklyCap - already) revert WeeklyCap();
        usedNonces[c.nonce] = true;
        claimedInWeek[c.player][week] = already + c.amount;
        emittedInSeason[c.season] += c.amount;
        emit Claimed(c.player, c.season, c.nonce, c.amount, week);
        yarn.safeTransfer(c.player, c.amount);
    }

    function setSigner(address next) external onlyOwner {
        _signer(next);
    }

    function _signer(address next) private {
        if (next == address(0)) revert InvalidConfig();
        emit SignerUpdated(signer, next);
        signer = next;
    }

    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }
}
