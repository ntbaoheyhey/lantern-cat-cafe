// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RelicNFT
/// @notice ERC-1155 Relics for Taskbar Hero. A Relic can only be minted by the player named in a
///         voucher that the game server signed (EIP-712). No payments, no token.
/// @dev EIP-712 domain: name "TaskbarHeroRelic", version "1", chainId = block.chainid,
///      verifyingContract = this contract. See docs/contracts.md for the exact typed data.
contract RelicNFT is ERC1155, EIP712, Ownable {
    /// @notice A server-issued permission to mint one copy of `relicId` to `player`.
    struct Voucher {
        address player;
        uint256 relicId;
        uint8 rarity;
        uint256 nonce;
        uint256 expiry;
    }

    /// @notice EIP-712 typehash of {Voucher}.
    bytes32 public constant VOUCHER_TYPEHASH =
        keccak256("Voucher(address player,uint256 relicId,uint8 rarity,uint256 nonce,uint256 expiry)");

    /// @notice Address whose signatures authorise mints.
    address public signer;

    /// @notice True once a voucher nonce has been redeemed. Each nonce works exactly once.
    mapping(uint256 nonce => bool used) public usedNonces;

    /// @notice Rarity recorded for a relicId on its first mint.
    mapping(uint256 relicId => uint8 rarity) public rarityOf;

    /// @notice True once a relicId has been minted at least once (so `rarityOf` is meaningful).
    mapping(uint256 relicId => bool exists) public relicExists;

    event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);
    event NonceCancelled(uint256 indexed nonce);

    error ZeroAddress();
    error NotVoucherPlayer();
    error VoucherExpired();
    error NonceAlreadyUsed();
    error InvalidSignature();
    error RarityMismatch();
    error RenounceDisabled();

    /// @param initialOwner Admin who can rotate the signer and set the metadata URI.
    /// @param initialSigner Server key that signs vouchers.
    /// @param baseURI ERC-1155 metadata URI, e.g. "https://example.com/relics/{id}.json".
    constructor(address initialOwner, address initialSigner, string memory baseURI)
        ERC1155(baseURI)
        EIP712("TaskbarHeroRelic", "1")
        Ownable(initialOwner)
    {
        _setSigner(initialSigner);
    }

    /// @notice Mint one Relic to the caller using a server-signed voucher.
    /// @dev Reverts if the caller is not `v.player`, the voucher expired (block.timestamp > expiry),
    ///      the nonce was already used, the signature is not from `signer`, or the relicId already
    ///      exists with a different rarity. State is updated before `_mint` so the ERC-1155 receiver
    ///      hook cannot replay the voucher.
    /// @param v The voucher fields, exactly as signed.
    /// @param signature 65-byte (r, s, v) signature of `hashVoucher(v)` by `signer`.
    function mint(Voucher calldata v, bytes calldata signature) external {
        if (msg.sender != v.player) revert NotVoucherPlayer();
        if (block.timestamp > v.expiry) revert VoucherExpired();
        if (usedNonces[v.nonce]) revert NonceAlreadyUsed();

        (address recovered, ECDSA.RecoverError err,) = ECDSA.tryRecover(hashVoucher(v), signature);
        if (err != ECDSA.RecoverError.NoError || recovered != signer) revert InvalidSignature();

        usedNonces[v.nonce] = true;
        if (relicExists[v.relicId]) {
            if (rarityOf[v.relicId] != v.rarity) revert RarityMismatch();
        } else {
            relicExists[v.relicId] = true;
            rarityOf[v.relicId] = v.rarity;
        }

        emit RelicForged(v.player, v.relicId, v.rarity, v.nonce);
        _mint(v.player, v.relicId, 1, "");
    }

    /// @notice The EIP-712 digest a signer must sign for `v` (domain separator included).
    /// @dev Lets the backend check that its typed-data encoding matches the contract exactly.
    function hashVoucher(Voucher calldata v) public view returns (bytes32) {
        return
            _hashTypedDataV4(keccak256(abi.encode(VOUCHER_TYPEHASH, v.player, v.relicId, v.rarity, v.nonce, v.expiry)));
    }

    /// @notice Rotate the voucher signer. Vouchers signed by the old signer stop working.
    /// @param newSigner The new server signing address (not zero).
    function setSigner(address newSigner) external onlyOwner {
        _setSigner(newSigner);
    }

    /// @notice Set the ERC-1155 metadata URI for all relics (supports the `{id}` placeholder).
    /// @param newURI The new base URI.
    function setURI(string calldata newURI) external onlyOwner {
        _setURI(newURI);
    }

    /// @notice Invalidate a single voucher by burning its nonce.
    /// @dev Reverts with {NonceAlreadyUsed} if the nonce was already redeemed or cancelled.
    /// @param nonce The voucher nonce to cancel.
    function cancelNonce(uint256 nonce) external onlyOwner {
        if (usedNonces[nonce]) revert NonceAlreadyUsed();
        usedNonces[nonce] = true;
        emit NonceCancelled(nonce);
    }

    /// @notice Disabled: the owner must always exist so the signer can be rotated.
    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }

    function _setSigner(address newSigner) private {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerUpdated(signer, newSigner);
        signer = newSigner;
    }
}
