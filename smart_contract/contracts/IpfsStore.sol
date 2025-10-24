// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract IpfsStore {
    address public owner;
    string[] public hashes;

    event HashStored(address indexed who, string ipfsHash, uint256 index);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function storeHash(string calldata ipfsHash) external {
        hashes.push(ipfsHash);
        emit HashStored(msg.sender, ipfsHash, hashes.length - 1);
    }

    function getHash(uint256 idx) external view returns (string memory) {
        require(idx < hashes.length, "Index OOB");
        return hashes[idx];
    }

    function total() external view returns (uint256) {
        return hashes.length;
    }
}
