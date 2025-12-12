export const EIP712_DOMAIN = {
  name: "Story DApp",
  version: "1",
  chainId: 11155111 // Sepolia
};

export const EIP712_TYPES = {
  Reaction: [
    { name: "storyHash", type: "string" },
    { name: "reactionType", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" }
  ]
};