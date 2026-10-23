// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title RelicMarket
/// @notice Escrow marketplace for Taskbar Hero Relics (ERC-1155 from {RelicNFT}). A seller lists
///         `amount` copies of one relicId for a fixed price in AVAX (wei); the Relics move into this
///         contract until someone buys them or the seller cancels. No fees, no token, no admin.
/// @dev Payment is pushed to the seller inside `buy` with a low-level call; if the seller cannot
///      receive AVAX the whole purchase reverts (only the seller's own listing is affected, and the
///      seller can always cancel). All state-changing functions are `nonReentrant` and update storage
///      before any external call.
contract RelicMarket is ERC1155Holder, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    /// @notice One active listing. `price` is the total price in wei for all `amount` copies.
    struct Listing {
        address seller;
        uint256 relicId;
        uint256 amount;
        uint256 price;
    }

    /// @notice The only ERC-1155 contract whose tokens this market accepts.
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    IERC1155 public immutable relicNFT;

    /// @notice Id the next listing will get. Ids start at 1 and are never reused.
    uint256 public nextListingId = 1;

    mapping(uint256 listingId => Listing) private _listings;
    EnumerableSet.UintSet private _activeIds;

    event Listed(
        uint256 indexed listingId, address indexed seller, uint256 indexed relicId, uint256 amount, uint256 price
    );
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 relicId,
        uint256 amount,
        uint256 price
    );
    event Cancelled(uint256 indexed listingId, address indexed seller);

    error ZeroAddress();
    error ZeroAmount();
    error ZeroPrice();
    error ListingNotActive();
    error WrongPayment();
    error NotSeller();
    error PaymentFailed();
    error UnsolicitedTransfer();

    /// @param relicNftAddress Address of the deployed RelicNFT contract.
    constructor(address relicNftAddress) {
        if (relicNftAddress == address(0)) revert ZeroAddress();
        relicNFT = IERC1155(relicNftAddress);
    }

    // ---------------------------------------------------------------- writes

    /// @notice Escrow `amount` copies of `relicId` and list them for `price` wei in total.
    /// @dev Caller must first call `relicNFT.setApprovalForAll(market, true)`. Reverts if the caller
    ///      does not own enough copies or has not approved the market (ERC-1155 errors bubble up).
    /// @return listingId The new listing's id.
    function list(uint256 relicId, uint256 amount, uint256 price) external nonReentrant returns (uint256 listingId) {
        if (amount == 0) revert ZeroAmount();
        if (price == 0) revert ZeroPrice();

        listingId = nextListingId++;
        _listings[listingId] = Listing({seller: msg.sender, relicId: relicId, amount: amount, price: price});
        _activeIds.add(listingId);
        emit Listed(listingId, msg.sender, relicId, amount, price);

        // Only external call; the token contract is the trusted, configured RelicNFT.
        relicNFT.safeTransferFrom(msg.sender, address(this), relicId, amount, "");
    }

    /// @notice Buy listing `listingId`. `msg.value` must equal the listing price exactly.
    /// @dev The listing is deleted before the Relic is sent to the buyer and the seller is paid.
    function buy(uint256 listingId) external payable nonReentrant {
        Listing memory l = _listings[listingId];
        if (l.seller == address(0)) revert ListingNotActive();
        if (msg.value != l.price) revert WrongPayment();

        delete _listings[listingId];
        _activeIds.remove(listingId);
        emit Bought(listingId, msg.sender, l.seller, l.relicId, l.amount, l.price);

        relicNFT.safeTransferFrom(address(this), msg.sender, l.relicId, l.amount, "");
        (bool ok,) = payable(l.seller).call{value: l.price}("");
        if (!ok) revert PaymentFailed();
    }

    /// @notice Cancel your own listing and get the escrowed Relics back.
    function cancel(uint256 listingId) external nonReentrant {
        Listing memory l = _listings[listingId];
        if (l.seller == address(0)) revert ListingNotActive();
        if (msg.sender != l.seller) revert NotSeller();

        delete _listings[listingId];
        _activeIds.remove(listingId);
        emit Cancelled(listingId, l.seller);

        relicNFT.safeTransferFrom(address(this), l.seller, l.relicId, l.amount, "");
    }

    // ---------------------------------------------------------------- reads

    /// @notice A listing by id. Returns an all-zero struct if it was never created, bought or cancelled.
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }

    /// @notice True if `listingId` can currently be bought.
    function isActive(uint256 listingId) external view returns (bool) {
        return _activeIds.contains(listingId);
    }

    /// @notice Number of active listings (the length `getListings` pages over).
    function activeListingCount() external view returns (uint256) {
        return _activeIds.length();
    }

    /// @notice Page through active listings without an indexer.
    /// @dev Pages over the set of active ids. Order is NOT stable: removing a listing moves the last
    ///      active id into its slot. Returns empty arrays when `offset >= activeListingCount()`.
    /// @param offset Index into the active set to start at.
    /// @param limit Maximum number of listings to return.
    /// @return ids The listing ids, same order as `items`.
    /// @return items The listings.
    function getListings(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory ids, Listing[] memory items)
    {
        uint256 total = _activeIds.length();
        uint256 n = offset >= total ? 0 : total - offset;
        if (n > limit) n = limit;

        ids = new uint256[](n);
        items = new Listing[](n);
        for (uint256 i; i < n; ++i) {
            uint256 id = _activeIds.at(offset + i);
            ids[i] = id;
            items[i] = _listings[id];
        }
    }

    // ---------------------------------------------------------------- ERC-1155 receiver

    /// @dev Accept a single transfer only from the configured RelicNFT, only when this market itself
    ///      initiated it (operator == this), which happens only inside `list`. Everything else reverts,
    ///      so Relics cannot be sent here by mistake and stranded.
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

    /// @dev Batch transfers are never solicited by this market.
    function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory)
        public
        pure
        override
        returns (bytes4)
    {
        revert UnsolicitedTransfer();
    }
}
