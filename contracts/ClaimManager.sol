// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationCompatibleInterface} from
  "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface IVerifier {
  function verify(bytes calldata proof, bytes32[] calldata publicInputs)
    external
    view
    returns (bool);
}

contract ClaimManager is AutomationCompatibleInterface {
  enum Status {
    Submitted,
    Approved,
    Rejected
  }

  struct Claim {
    bytes32 claimId;
    address submitter;
    bytes proof;
    bytes32[] publicInputs;
    bytes32 labPubHash;     // lab identity
    Status status;
    uint256 submittedAt;
    uint256 decidedAt;
    string rejectionReason;
    bool exists;
  }

  address public owner;
  IVerifier public verifier;

  // simple on-chain trusted lab registry
  mapping(bytes32 => bool) public trustedLabs;

  mapping(bytes32 => Claim) public claims;
  bytes32[] public pending;

  uint256 public autoProcessDelay = 30; // seconds (hackathon demo)

  event LabRegistered(bytes32 indexed labPubHash);
  event ClaimSubmitted(bytes32 indexed claimId, address indexed submitter, bytes32 labPubHash);
  event ClaimApproved(bytes32 indexed claimId);
  event ClaimRejected(bytes32 indexed claimId, string reason);

  modifier onlyOwner() {
    require(msg.sender == owner, "not owner");
    _;
  }

  constructor(address verifierAddress) {
    owner = msg.sender;
    verifier = IVerifier(verifierAddress);
  }

  function registerLab(bytes32 labPubHash) external onlyOwner {
    trustedLabs[labPubHash] = true;
    emit LabRegistered(labPubHash);
  }

  function submitClaim(
    bytes calldata proof,
    bytes32[] calldata publicInputs,
    bytes32 labPubHash
  ) external returns (bytes32 claimId) {
    claimId = keccak256(abi.encodePacked(msg.sender, block.timestamp, labPubHash, publicInputs.length));
    require(!claims[claimId].exists, "exists");

    claims[claimId] = Claim({
      claimId: claimId,
      submitter: msg.sender,
      proof: proof,
      publicInputs: publicInputs,
      labPubHash: labPubHash,
      status: Status.Submitted,
      submittedAt: block.timestamp,
      decidedAt: 0,
      rejectionReason: "",
      exists: true
    });

    pending.push(claimId);
    emit ClaimSubmitted(claimId, msg.sender, labPubHash);
  }

  // ---- Chainlink Automation ----

  function checkUpkeep(bytes calldata)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory performData)
  {
    for (uint256 i = 0; i < pending.length; i++) {
      bytes32 id = pending[i];
      Claim storage c = claims[id];
      if (c.exists && c.status == Status.Submitted && block.timestamp >= c.submittedAt + autoProcessDelay) {
        return (true, abi.encode(id));
      }
    }
    return (false, "");
  }

  function performUpkeep(bytes calldata performData) external override {
    bytes32 id = abi.decode(performData, (bytes32));
    _process(id);
  }

  // manual fallback (for demo if upkeep isn’t funded)
  function processManually(bytes32 id) external {
    _process(id);
  }

  function _process(bytes32 id) internal {
    Claim storage c = claims[id];
    require(c.exists, "not found");
    require(c.status == Status.Submitted, "already processed");

    // (1) Lab authorization (on-chain issuer registry)
    if (!trustedLabs[c.labPubHash]) {
      _reject(id, "Untrusted lab");
      return;
    }

    // (2) ZK proof verification (mock now, real later)
    bool ok = verifier.verify(c.proof, c.publicInputs);
    if (!ok) {
      _reject(id, "Invalid proof");
      return;
    }

    // approve
    c.status = Status.Approved;
    c.decidedAt = block.timestamp;
    _removePending(id);
    emit ClaimApproved(id);
  }

  function _reject(bytes32 id, string memory reason) internal {
    Claim storage c = claims[id];
    c.status = Status.Rejected;
    c.decidedAt = block.timestamp;
    c.rejectionReason = reason;
    _removePending(id);
    emit ClaimRejected(id, reason);
  }

  function _removePending(bytes32 id) internal {
    for (uint256 i = 0; i < pending.length; i++) {
      if (pending[i] == id) {
        pending[i] = pending[pending.length - 1];
        pending.pop();
        return;
      }
    }
  }

  function getPendingCount() external view returns (uint256) {
    return pending.length;
  }
}