// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "EscrowOrders.sol";
/// @dev Test fixture only. It is not deployed by application setup.
contract ReentrantRecipient {
    EscrowOrders public escrow;
    bool public blockPayment;
    bool public reentrySucceeded;
    uint256 public received;
    constructor(RoleRegistry roles, EscrowOrders orders) { escrow=orders; roles.register(RoleRegistry.Role.Provider); }
    function accept(uint256 id) external { escrow.acceptOrder(id); }
    function deliver(uint256 id) external { escrow.submitDelivery(id,keccak256("Delivered")); }
    function rejectPayments(bool enabled) external { blockPayment=enabled; }
    function claim() external { escrow.withdraw(); }
    receive() external payable {
        require(!blockPayment,"Reject payment");
        received+=msg.value;
        (bool ok,)=address(escrow).call(abi.encodeWithSignature("withdraw()"));
        reentrySucceeded=ok;
    }
}
