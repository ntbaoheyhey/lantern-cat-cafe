// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @notice Fuji demonstration only. Fixed genesis supply; no owner or mint entry point.
contract YarnToken is ERC20, ERC20Burnable, ERC20Permit {
    uint256 public constant GENESIS_SUPPLY = 1_000_000_000 ether;
    mapping(address => mapping(bytes32 => uint256)) public sealPayments;
    /// @notice Actual ERC-20 supply destroyed in each UTC Monday week, including seal and sale burns.
    mapping(uint256 => uint256) public burnedInWeek;
    event SealPaid(address indexed player, bytes32 indexed intent, uint256 amount);
    error FujiOnly();
    error InvalidSeal();

    constructor(address distributor) ERC20("YARN (Fuji Testnet)", "YARN") ERC20Permit("YARN (Fuji Testnet)") {
        if (block.chainid != 43113) revert FujiOnly();
        _mint(distributor, GENESIS_SUPPLY);
    }

    /// @notice Burn against a server-reserved intent. This is a payment receipt, not mint authority.
    /// @dev The server verifies the expected amount and consumes its source inventory exactly once.
    function seal(bytes32 intent, uint256 amount) external {
        if (intent == bytes32(0) || amount == 0 || sealPayments[msg.sender][intent] != 0) revert InvalidSeal();
        sealPayments[msg.sender][intent] = amount;
        _burn(msg.sender, amount);
        emit SealPaid(msg.sender, intent, amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        if (to == address(0) && value != 0) {
            burnedInWeek[(block.timestamp - 4 days) / 1 weeks] += value;
        }
    }
}
