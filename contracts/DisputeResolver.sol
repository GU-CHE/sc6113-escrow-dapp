// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "./EscrowOrders.sol";

contract DisputeResolver {
    struct Dispute { address openedBy; bytes32 reasonHash; bool resolved; bool payProvider; }
    RoleRegistry public immutable registry;
    EscrowOrders public immutable orders;
    mapping(uint256 => Dispute) public disputes;
    event DisputeOpened(uint256 indexed orderId, address indexed actor, bytes32 reasonHash);
    event EvidenceAdded(uint256 indexed orderId, address indexed actor, bytes32 evidenceHash);
    event DisputeResolved(uint256 indexed orderId, address indexed admin, bool payProvider, bytes32 rulingHash);

    constructor(RoleRegistry roles, EscrowOrders escrow) {
        require(address(escrow.registry()) == address(roles), "Registry mismatch");
        registry = roles;
        orders = escrow;
    }
    function openDispute(uint256 id, bytes32 reasonHash) external {
        require(reasonHash != bytes32(0), "Reason required");
        require(disputes[id].openedBy == address(0), "Already disputed");
        orders.markDisputed(id, msg.sender);
        disputes[id] = Dispute(msg.sender, reasonHash, false, false);
        emit DisputeOpened(id, msg.sender, reasonHash);
    }
    function addEvidence(uint256 id, bytes32 evidenceHash) external {
        Dispute memory d = disputes[id];
        require(d.openedBy != address(0) && !d.resolved, "No active dispute");
        EscrowOrders.Order memory o = orders.getOrder(id);
        require(msg.sender == o.customer || msg.sender == o.provider, "Participant only");
        require(evidenceHash != bytes32(0), "Evidence required");
        emit EvidenceAdded(id, msg.sender, evidenceHash);
    }
    function resolve(uint256 id, bool payProvider, bytes32 rulingHash) external {
        require(msg.sender == registry.admin(), "Admin only");
        Dispute storage d = disputes[id];
        require(d.openedBy != address(0) && !d.resolved, "No active dispute");
        require(rulingHash != bytes32(0), "Ruling required");
        d.resolved = true;
        d.payProvider = payProvider;
        orders.resolveDispute(id, payProvider);
        emit DisputeResolved(id, msg.sender, payProvider, rulingHash);
    }
}
