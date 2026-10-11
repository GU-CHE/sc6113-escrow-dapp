// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Fixed administrator and one-time self-registration for business roles.
contract RoleRegistry {
    enum Role { None, Customer, Provider, Admin }
    address public immutable admin;
    mapping(address => Role) public roles;
    event RoleRegistered(address indexed account, Role role);

    constructor(address administrator) {
        require(administrator != address(0), "Zero admin");
        admin = administrator;
        roles[administrator] = Role.Admin;
        emit RoleRegistered(administrator, Role.Admin);
    }
    function register(Role role) external {
        require(roles[msg.sender] == Role.None, "Already registered");
        require(role == Role.Customer || role == Role.Provider, "Invalid role");
        roles[msg.sender] = role;
        emit RoleRegistered(msg.sender, role);
    }
}
