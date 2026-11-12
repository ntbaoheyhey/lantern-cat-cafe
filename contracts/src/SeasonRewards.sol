// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    IERC20 public immutable yarn;
    uint256 public immutable weeklyCap;
    uint256 public immutable seasonEpoch;
    uint256 public constant SEASON_LENGTH = 13 weeks;
    address public signer;
    mapping(uint256 => bool) public usedNonces;
    mapping(address => mapping(uint256 => uint256)) public claimedInWeek;
    event Claimed(address indexed player, uint256 indexed season, uint256 indexed nonce, uint256 amount, uint256 week);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);
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
            block.chainid != 43113 || token.code.length == 0 || cap == 0 || epoch > block.timestamp || epoch < 4 days
                || (epoch - 4 days) % 1 weeks != 0
        ) revert InvalidConfig();
        yarn = IERC20(token);
        weeklyCap = cap;
        seasonEpoch = epoch;
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

    function claim(Claim calldata c, bytes calldata signature) external nonReentrant {
        if (msg.sender != c.player || c.amount == 0 || block.timestamp > c.expiry || c.season != currentSeason()) {
            revert InvalidClaim();
        }
        if (usedNonces[c.nonce]) revert NonceUsed();
        (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecover(hashClaim(c), signature);
        if (err != ECDSA.RecoverError.NoError || recovered != signer) revert InvalidSignature();
        uint256 week = currentWeek();
        uint256 already = claimedInWeek[c.player][week];
        if (c.amount > weeklyCap - already) revert WeeklyCap();
        usedNonces[c.nonce] = true;
        claimedInWeek[c.player][week] = already + c.amount;
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
