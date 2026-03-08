// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVerifier {
  function verify(bytes calldata proof, bytes32[] calldata publicInputs)
    external
    view
    returns (bool);
}

contract MockMedZKVerifier is IVerifier {
  function verify(bytes calldata proof, bytes32[] calldata publicInputs)
    external
    pure
    override
    returns (bool)
  {
    // minimal sanity: has proof + has public inputs
    if (proof.length == 0) return false;
    if (publicInputs.length == 0) return false;

    // optional: require last signal == 1 (your “meets criteria” flag)
    // if you don’t have this, delete these 2 lines:
    uint256 last = uint256(publicInputs[publicInputs.length - 1]);
    if (last != 1) return false;

    return true;
  }
}