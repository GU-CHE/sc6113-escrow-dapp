// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "./RoleRegistry.sol";

interface IResolverBinding {
    function orders() external view returns (address);
    function registry() external view returns (address);
}

/// @notice Testnet single-delivery escrow. Metadata and evidence are public hashes.
contract EscrowOrders {
    enum State { Created, Accepted, Funded, Submitted, Disputed, Released, Refunded, Cancelled }
    struct Order {
        address customer;
        address provider;
        uint256 amount;
        uint64 deadline;
        State state;
        bytes32 termsHash;
        bytes32 deliveryHash;
    }
    RoleRegistry public immutable registry;
    address public resolver;
    uint256 public orderCount;
    uint256 public lockedTotal;
    uint256 public claimableTotal;
    mapping(uint256 => Order) private entries;
    mapping(address => uint256) public credits;
    bool private withdrawing;
    event ResolverConfigured(address indexed resolver);
    event OrderCreated(uint256 indexed orderId, address indexed customer, address indexed provider, uint256 amount, uint64 deadline, bytes32 termsHash);
    event OrderAction(uint256 indexed orderId, address indexed actor, State state, bytes32 referenceHash);
    event Withdrawal(address indexed account, uint256 amount);

    constructor(RoleRegistry roles) {
        require(address(roles) != address(0), "Zero registry");
        registry = roles;
    }
    function setResolver(address value) external {
        require(msg.sender == registry.admin(), "Admin only");
        require(resolver == address(0) && value.code.length > 0, "Resolver already set or invalid");
        require(IResolverBinding(value).orders() == address(this), "Wrong orders binding");
        require(IResolverBinding(value).registry() == address(registry), "Wrong role binding");
        resolver = value;
        emit ResolverConfigured(value);
    }
    function getOrder(uint256 id) public view returns (Order memory) {
        require(id > 0 && id <= orderCount, "Unknown order");
        return entries[id];
    }
    function createOrder(address provider, uint256 amount, uint64 deadline, bytes32 termsHash) external returns (uint256 id) {
        require(resolver != address(0), "Not configured");
        require(registry.roles(msg.sender) == RoleRegistry.Role.Customer, "Customer only");
        require(registry.roles(provider) == RoleRegistry.Role.Provider, "Registered provider required");
        require(provider != msg.sender && amount > 0, "Invalid parties or amount");
        require(deadline > block.timestamp && deadline <= block.timestamp + 90 days, "Deadline out of range");
        require(termsHash != bytes32(0), "Terms required");
        id = ++orderCount;
        entries[id] = Order(msg.sender, provider, amount, deadline, State.Created, termsHash, bytes32(0));
        emit OrderCreated(id, msg.sender, provider, amount, deadline, termsHash);
    }
    function acceptOrder(uint256 id) external {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.provider, "Provider only");
        require(o.state == State.Created && block.timestamp < o.deadline, "Cannot accept");
        o.state = State.Accepted;
        emit OrderAction(id, msg.sender, o.state, bytes32(0));
    }
    function fundOrder(uint256 id) external payable {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.customer, "Customer only");
        require(o.state == State.Accepted && block.timestamp < o.deadline, "Cannot fund");
        require(msg.value == o.amount, "Exact amount required");
        o.state = State.Funded;
        lockedTotal += msg.value;
        emit OrderAction(id, msg.sender, o.state, bytes32(0));
    }
    function submitDelivery(uint256 id, bytes32 deliveryHash) external {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.provider, "Provider only");
        require(o.state == State.Funded && block.timestamp <= o.deadline, "Cannot deliver");
        require(deliveryHash != bytes32(0), "Delivery required");
        o.deliveryHash = deliveryHash;
        o.state = State.Submitted;
        emit OrderAction(id, msg.sender, o.state, deliveryHash);
    }
    function approveDelivery(uint256 id) external {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.customer, "Customer only");
        require(o.state == State.Submitted, "Delivery not submitted");
        settle(id, true, msg.sender);
    }
    function cancelOrder(uint256 id) external {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.customer, "Customer only");
        require(o.state == State.Created || o.state == State.Accepted, "Cannot cancel funded order");
        o.state = State.Cancelled;
        emit OrderAction(id, msg.sender, o.state, bytes32(0));
    }
    function refundExpired(uint256 id) external {
        getOrder(id);
        Order storage o = entries[id];
        require(msg.sender == o.customer, "Customer only");
        require(o.state == State.Funded && block.timestamp > o.deadline, "Not expired or delivered");
        settle(id, false, msg.sender);
    }
    function markDisputed(uint256 id, address actor) external {
        require(msg.sender == resolver, "Resolver only");
        getOrder(id);
        Order storage o = entries[id];
        require(actor == o.customer || actor == o.provider, "Participant only");
        require(o.state == State.Funded || o.state == State.Submitted, "Cannot dispute");
        o.state = State.Disputed;
        emit OrderAction(id, actor, o.state, bytes32(0));
    }
    function resolveDispute(uint256 id, bool payProvider) external {
        require(msg.sender == resolver, "Resolver only");
        getOrder(id);
        require(entries[id].state == State.Disputed, "Not disputed");
        settle(id, payProvider, registry.admin());
    }
    function settle(uint256 id, bool payProvider, address actor) private {
        Order storage o = entries[id];
        o.state = payProvider ? State.Released : State.Refunded;
        lockedTotal -= o.amount;
        claimableTotal += o.amount;
        credits[payProvider ? o.provider : o.customer] += o.amount;
        emit OrderAction(id, actor, o.state, bytes32(0));
    }
    function withdraw() external {
        require(!withdrawing, "Reentrant withdrawal");
        uint256 amount = credits[msg.sender];
        require(amount > 0, "No credit");
        withdrawing = true;
        credits[msg.sender] = 0;
        claimableTotal -= amount;
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdrawal failed");
        withdrawing = false;
        emit Withdrawal(msg.sender, amount);
    }
}
