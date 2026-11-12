// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {YarnToken} from "./YarnToken.sol";

/// @notice Fuji-only escrow. Zero means AVAX, one means YARN. Fee immutable at deployment.
contract RelicMarketV2 is ERC1155Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    struct Listing {
        address seller;
        uint256 relicId;
        uint256 amount;
        uint256 price;
        uint8 currency;
    }
    IERC1155 public immutable relicNFT;
    YarnToken public immutable yarn;
    address public immutable treasury;
    uint256 public immutable feeBps;
    uint256 public constant BURN_SHARE_BPS = 4000;
    uint256 public constant RELIST_DELAY = 10 minutes;
    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) private listings;
    EnumerableSet.UintSet private active;
    mapping(address => mapping(uint8 => uint256)) public proceeds;
    mapping(address => mapping(uint256 => uint256)) public relistAfter;
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed relicId,
        uint256 amount,
        uint256 price,
        uint8 currency
    );
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 relicId,
        uint256 amount,
        uint256 price,
        uint8 currency,
        uint256 fee,
        uint256 burned
    );
    event Cancelled(uint256 indexed listingId, address indexed seller);
    event Withdrawn(address indexed owner, address indexed recipient, uint8 currency, uint256 amount);
    error InvalidConfig();
    error InvalidListing();
    error WrongPayment();
    error NotSeller();
    error Cooldown();
    error UnsolicitedTransfer();
    error TransferFailed();
    error InvalidWithdrawal();

    constructor(address nft, address token, address treasury_, uint256 bps) {
        if (
            block.chainid != 43113 || nft.code.length == 0 || token.code.length == 0 || treasury_ == address(0)
                || bps > 1000
        ) {
            revert InvalidConfig();
        }
        relicNFT = IERC1155(nft);
        yarn = YarnToken(token);
        treasury = treasury_;
        feeBps = bps;
    }

    function list(uint256 relicId, uint256 amount, uint256 price, uint8 currency)
        external
        nonReentrant
        returns (uint256 id)
    {
        if (amount == 0 || currency > 1) revert InvalidListing();
        if (block.timestamp < relistAfter[msg.sender][relicId]) revert Cooldown();
        // No minimum, maximum or reference-price enforcement, including zero-price gifts.
        id = nextListingId++;
        listings[id] = Listing(msg.sender, relicId, amount, price, currency);
        active.add(id);
        emit Listed(id, msg.sender, relicId, amount, price, currency);
        relicNFT.safeTransferFrom(msg.sender, address(this), relicId, amount, "");
    }

    function quote(uint256 price)
        public
        view
        returns (uint256 fee, uint256 burned, uint256 toTreasury, uint256 toSeller)
    {
        fee = Math.mulDiv(price, feeBps, 10000);
        burned = Math.mulDiv(fee, BURN_SHARE_BPS, 10000);
        toTreasury = fee - burned;
        toSeller = price - fee;
    }

    function buy(uint256 id) external payable nonReentrant {
        Listing memory l = listings[id];
        if (l.seller == address(0)) revert InvalidListing();
        if (msg.value != (l.currency == 0 ? l.price : 0)) revert WrongPayment();
        delete listings[id];
        active.remove(id);
        relistAfter[msg.sender][l.relicId] = block.timestamp + RELIST_DELAY;
        (uint256 fee, uint256 burned, uint256 toTreasury, uint256 toSeller) = quote(l.price);
        proceeds[l.seller][l.currency] += toSeller;
        proceeds[treasury][l.currency] += toTreasury;
        if (l.currency == 1) {
            IERC20(address(yarn)).safeTransferFrom(msg.sender, address(this), l.price);
            if (burned > 0) yarn.burn(burned);
        } else if (burned > 0) {
            // Native sink only. This is not a YARN burn and is not counted as such by the model.
            (bool ok,) = payable(address(0)).call{value: burned}("");
            if (!ok) revert TransferFailed();
        }
        emit Bought(id, msg.sender, l.seller, l.relicId, l.amount, l.price, l.currency, fee, burned);
        relicNFT.safeTransferFrom(address(this), msg.sender, l.relicId, l.amount, "");
    }

    function cancel(uint256 id) external nonReentrant {
        Listing memory l = listings[id];
        if (l.seller == address(0)) revert InvalidListing();
        if (msg.sender != l.seller) revert NotSeller();
        delete listings[id];
        active.remove(id);
        emit Cancelled(id, l.seller);
        relicNFT.safeTransferFrom(address(this), l.seller, l.relicId, l.amount, "");
    }

    function withdraw(uint8 currency, address recipient) external nonReentrant {
        uint256 amount = proceeds[msg.sender][currency];
        if (currency > 1 || recipient == address(0) || amount == 0) revert InvalidWithdrawal();
        proceeds[msg.sender][currency] = 0;
        emit Withdrawn(msg.sender, recipient, currency, amount);
        if (currency == 1) {
            IERC20(address(yarn)).safeTransfer(recipient, amount);
        } else {
            (bool ok,) = payable(recipient).call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }

    function getListing(uint256 id) external view returns (Listing memory) {
        return listings[id];
    }

    function activeListingCount() external view returns (uint256) {
        return active.length();
    }

    function getListings(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory ids, Listing[] memory items)
    {
        uint256 n = offset >= active.length() ? 0 : active.length() - offset;
        if (n > limit) n = limit;
        ids = new uint256[](n);
        items = new Listing[](n);
        for (uint256 i; i < n; i++) {
            uint256 id = active.at(offset + i);
            ids[i] = id;
            items[i] = listings[id];
        }
    }

    function onERC1155Received(address operator, address, uint256, uint256, bytes memory)
        public
        view
        override
        returns (bytes4)
    {
        if (msg.sender != address(relicNFT) || operator != address(this) || !_reentrancyGuardEntered()) {
            revert UnsolicitedTransfer();
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory)
        public
        pure
        override
        returns (bytes4)
    {
        revert UnsolicitedTransfer();
    }
}
