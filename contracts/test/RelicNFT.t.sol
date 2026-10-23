// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {RelicNFT} from "../src/RelicNFT.sol";

contract RelicNFTTest is Test {
    event RelicForged(address indexed player, uint256 indexed relicId, uint8 rarity, uint256 nonce);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);

    // secp256k1 curve order; private keys must be in [1, N-1].
    uint256 internal constant SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    RelicNFT internal relic;
    address internal owner = makeAddr("owner");
    address internal signer;
    uint256 internal signerKey;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        vm.chainId(43113);
        vm.warp(1_700_000_000);
        (signer, signerKey) = makeAddrAndKey("signer");
        relic = new RelicNFT(owner, signer, "https://relics.example/{id}.json");
    }

    // ---------- helpers ----------

    function _voucher(address player, uint256 nonce) internal view returns (RelicNFT.Voucher memory) {
        return
            RelicNFT.Voucher({player: player, relicId: 7, rarity: 3, nonce: nonce, expiry: block.timestamp + 1 hours});
    }

    function _sign(uint256 key, RelicNFT.Voucher memory v) internal view returns (bytes memory) {
        (uint8 sv, bytes32 r, bytes32 s) = vm.sign(key, relic.hashVoucher(v));
        return abi.encodePacked(r, s, sv);
    }

    // ---------- tests ----------

    function test_typehashMatchesDocumentedString() public view {
        assertEq(
            relic.VOUCHER_TYPEHASH(),
            keccak256("Voucher(address player,uint256 relicId,uint8 rarity,uint256 nonce,uint256 expiry)")
        );
    }

    function test_hashVoucherMatchesManualEip712() public view {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("TaskbarHeroRelic"),
                keccak256("1"),
                uint256(43113),
                address(relic)
            )
        );
        bytes32 structHash =
            keccak256(abi.encode(relic.VOUCHER_TYPEHASH(), v.player, v.relicId, v.rarity, v.nonce, v.expiry));
        assertEq(relic.hashVoucher(v), keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash)));
    }

    function test_validVoucherMints() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v);

        vm.expectEmit(address(relic));
        emit RelicForged(alice, 7, 3, 1);
        vm.prank(alice);
        relic.mint(v, sig);

        assertEq(relic.balanceOf(alice, 7), 1);
        assertTrue(relic.usedNonces(1));
        assertTrue(relic.relicExists(7));
        assertEq(relic.rarityOf(7), 3);
        assertEq(relic.uri(7), "https://relics.example/{id}.json");
    }

    function test_reusedNonceReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v);
        vm.startPrank(alice);
        relic.mint(v, sig);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(v, sig);
        vm.stopPrank();
    }

    function test_nonceIsGlobalAcrossPlayers() public {
        RelicNFT.Voucher memory va = _voucher(alice, 1);
        bytes memory sigA = _sign(signerKey, va);
        vm.prank(alice);
        relic.mint(va, sigA);

        RelicNFT.Voucher memory vb = _voucher(bob, 1);
        bytes memory sigB = _sign(signerKey, vb);
        vm.prank(bob);
        vm.expectRevert(RelicNFT.NonceAlreadyUsed.selector);
        relic.mint(vb, sigB);
    }

    function test_expiredVoucherReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v);

        vm.warp(v.expiry); // still valid at exactly expiry
        vm.prank(alice);
        relic.mint(v, sig);

        RelicNFT.Voucher memory v2 = _voucher(alice, 2);
        bytes memory sig2 = _sign(signerKey, v2);
        vm.warp(v2.expiry + 1);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.VoucherExpired.selector);
        relic.mint(v2, sig2);
    }

    function test_wrongSignerReverts() public {
        (, uint256 badKey) = makeAddrAndKey("mallory");
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(badKey, v);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, sig);
    }

    function test_tamperedVoucherReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v);
        v.rarity = 5; // player tries to upgrade rarity
        vm.prank(alice);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, sig);
    }

    function test_malformedSignatureReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        vm.prank(alice);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, hex"1234");
    }

    function test_voucherForXSentByYReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v);
        vm.prank(bob);
        vm.expectRevert(RelicNFT.NotVoucherPlayer.selector);
        relic.mint(v, sig);
    }

    function test_otherChainReplayReverts() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory sig = _sign(signerKey, v); // signed for chain 43113
        vm.chainId(43114); // same contract address on another chain
        vm.prank(alice);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, sig);
    }

    function test_rarityMismatchReverts() public {
        RelicNFT.Voucher memory v1 = _voucher(alice, 1);
        bytes memory sig1 = _sign(signerKey, v1);
        vm.prank(alice);
        relic.mint(v1, sig1);

        RelicNFT.Voucher memory v2 = _voucher(bob, 2);
        v2.rarity = 4; // same relicId 7, different rarity
        bytes memory sig2 = _sign(signerKey, v2);
        vm.prank(bob);
        vm.expectRevert(RelicNFT.RarityMismatch.selector);
        relic.mint(v2, sig2);
    }

    function test_nonOwnerCannotChangeSigner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        relic.setSigner(alice);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        relic.setURI("ipfs://evil/{id}");
    }

    function test_cannotSetZeroSigner() public {
        vm.prank(owner);
        vm.expectRevert(RelicNFT.ZeroAddress.selector);
        relic.setSigner(address(0));
    }

    function test_ownerRotatesSignerAndOldVouchersFail() public {
        RelicNFT.Voucher memory v = _voucher(alice, 1);
        bytes memory oldSig = _sign(signerKey, v);

        (address newSigner, uint256 newKey) = makeAddrAndKey("signer2");
        vm.expectEmit(address(relic));
        emit SignerUpdated(signer, newSigner);
        vm.prank(owner);
        relic.setSigner(newSigner);
        assertEq(relic.signer(), newSigner);

        vm.prank(alice);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, oldSig);

        bytes memory newSig = _sign(newKey, v);
        vm.prank(alice);
        relic.mint(v, newSig);
        assertEq(relic.balanceOf(alice, 7), 1);
    }

    function test_ownerCanSetURI() public {
        vm.prank(owner);
        relic.setURI("ipfs://relics/{id}.json");
        assertEq(relic.uri(1), "ipfs://relics/{id}.json");
    }

    function test_receiverHookCannotReplayVoucher() public {
        ReentrantReceiver attacker = new ReentrantReceiver(relic);
        RelicNFT.Voucher memory v = _voucher(address(attacker), 1);
        attacker.arm(v, _sign(signerKey, v));

        attacker.go();

        assertEq(relic.balanceOf(address(attacker), 7), 1);
        assertTrue(attacker.reentryReverted());
    }

    /// Random vouchers signed by any key other than the signer never mint.
    function testFuzz_nonSignerVoucherNeverMints(
        uint256 key,
        address player,
        uint256 relicId,
        uint8 rarity,
        uint256 nonce,
        uint256 expiry
    ) public {
        key = bound(key, 1, SECP256K1_N - 1);
        vm.assume(key != signerKey);
        vm.assume(player != address(0));
        expiry = bound(expiry, block.timestamp, type(uint256).max);

        RelicNFT.Voucher memory v =
            RelicNFT.Voucher({player: player, relicId: relicId, rarity: rarity, nonce: nonce, expiry: expiry});
        bytes memory sig = _sign(key, v);

        vm.prank(player);
        vm.expectRevert(RelicNFT.InvalidSignature.selector);
        relic.mint(v, sig);

        assertEq(relic.balanceOf(player, relicId), 0);
        assertFalse(relic.usedNonces(nonce));
    }
}

/// Contract wallet that tries to redeem the same voucher again from inside onERC1155Received.
contract ReentrantReceiver is IERC1155Receiver {
    RelicNFT internal immutable RELIC;
    RelicNFT.Voucher internal voucher;
    bytes internal sig;
    bool internal entered;
    bool public reentryReverted;

    constructor(RelicNFT relic_) {
        RELIC = relic_;
    }

    function arm(RelicNFT.Voucher memory v, bytes memory s) external {
        voucher = v;
        sig = s;
    }

    function go() external {
        RELIC.mint(voucher, sig);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external returns (bytes4) {
        if (!entered) {
            entered = true;
            try RELIC.mint(voucher, sig) {}
            catch (bytes memory reason) {
                reentryReverted =
                    keccak256(reason) == keccak256(abi.encodeWithSelector(RelicNFT.NonceAlreadyUsed.selector));
            }
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
