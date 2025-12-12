// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ========== ENUMS ==========

enum MediaType {
    TEXT,
    IMAGE,
    VIDEO,
    MIXED
}

enum GroupType {
    PUBLIC,
    PRIVATE
}

enum RequestStatus {
    PENDING,
    APPROVED,
    REJECTED
}

// ========== STRUCTS ==========

struct Post {
    uint256 id;
    address author;
    string contentHash;
    string[] mediaHashes;
    MediaType mediaType;
    uint256 timestamp;
    uint256 likes;
    bool isDeleted;
}

struct Comment {
    address author;
    string contentHash;
    string mediaHash;
    uint256 timestamp;
    bool isDeleted;
}

struct Group {
    uint256 id;
    string name;
    string description;
    GroupType groupType;
    bool autoApprove;
    address owner;
    uint256 createdAt;
    uint256 memberCount;
    string coverImage;
    bool exists;
}

struct JoinRequest {
    uint256 id;
    uint256 groupId;
    address user;
    RequestStatus status;
    uint256 createdAt;
}

struct Invitation {
    uint256 id;
    uint256 groupId;
    address inviter;
    address invitee;
    RequestStatus status;
    uint256 createdAt;
}
