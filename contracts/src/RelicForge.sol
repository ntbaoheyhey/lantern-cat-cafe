// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RelicNFT} from "./RelicNFT.sol";
import {YarnToken} from "./YarnToken.sol";

/// @notice Fuji-only, finite cosmetic forge. Two existing Epic units + 3 YARN.
/// @dev No owner, upgrade, withdrawal, approval, arbitrary call or token mint.
/// NFT units remain in this vault forever; this is custody, NOT an ERC1155 burn.
/// Each design is wallet-bound, permanent and has no combat/reward entitlement.
contract RelicForge is ERC1155Holder, ReentrancyGuard {
    RelicNFT public immutable relicNFT;
    YarnToken public immutable yarn;
    uint256 public constant COST = 3 ether;
    uint8 public constant DESIGNS = 3;
    uint256 public totalCrafted;
    mapping(address => mapping(uint8 => bool)) public hasDesign;
    mapping(uint256 => uint256) public consumedOf;

    event Forged(address indexed player, uint8 indexed design, uint256 firstId, uint256 secondId, uint256 burned);
    error InvalidConfig();
    error InvalidDesign();
    error AlreadyForged();
    error InvalidInput();
    error UnsolicitedTransfer();

    constructor(address nft, address token) {
        if (block.chainid != 43113 || nft.code.length == 0 || token.code.length == 0 || nft == token) {
            revert InvalidConfig();
        }
        relicNFT = RelicNFT(nft);
        yarn = YarnToken(token);
    }

    /// @notice The 32 canonical Epic templates, frozen to the audited catalog.
    /// Legendary items, judge Relics, rare material and unknown IDs never qualify.
    function validInputId(uint256 id) public pure returns (bool) {
        if (id < 20020 || id > 20723) return false;
        uint256 slot = id % 100;
        return slot >= 20 && slot <= 23;
    }

    function forge(uint8 design, uint256 firstId, uint256 secondId) external nonReentrant {
        if (design >= DESIGNS) revert InvalidDesign();
        if (hasDesign[msg.sender][design]) revert AlreadyForged();
        if (!validInputId(firstId) || !validInputId(secondId)) revert InvalidInput();
        if (
            !relicNFT.relicExists(firstId) || !relicNFT.relicExists(secondId) || relicNFT.rarityOf(firstId) != 2
                || relicNFT.rarityOf(secondId) != 2
        ) revert InvalidInput();

        hasDesign[msg.sender][design] = true;
        totalCrafted++;
        consumedOf[firstId]++;
        consumedOf[secondId]++;
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        ids[0] = firstId;
        ids[1] = secondId;
        amounts[0] = 1;
        amounts[1] = 1;
        // Same ID requires two owned units. Any transfer/payment failure rolls
        // back BOTH inputs, the YARN burn and the unlock in the same transaction.
        relicNFT.safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");
        yarn.burnFrom(msg.sender, COST);
        emit Forged(msg.sender, design, firstId, secondId, COST);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public pure override returns (bytes4) {
        revert UnsolicitedTransfer();
    }

    function onERC1155BatchReceived(address operator, address, uint256[] memory, uint256[] memory, bytes memory)
        public
        view
        override
        returns (bytes4)
    {
        if (msg.sender != address(relicNFT) || operator != address(this) || !_reentrancyGuardEntered()) {
            revert UnsolicitedTransfer();
        }
        return this.onERC1155BatchReceived.selector;
    }
}
