// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/// @title ChainlinkThresholdOracle
/// @notice Fetches medical thresholds from off-chain medical standards APIs
///         using Chainlink Functions, and maintains a lab registry.
/// @dev This contract serves as the source of truth for:
///   1. Medical thresholds (what values constitute a diagnosis)
///   2. Lab registration (which labs are trusted to sign reports)
///
/// CHAINLINK FUNCTIONS USAGE:
///   - fetchThresholds(): Calls an off-chain medical standards API
///     to get the latest diagnostic thresholds for diabetes,
///     cholesterol screening, and hypertension.
///   - verifyLabOffChain(): Checks a lab's registration against
///     an off-chain medical registry.
///
/// WHY USE AN ORACLE FOR THRESHOLDS?
///   Medical thresholds change over time. For example:
///   - ADA changed the diabetes threshold from 140 to 126 mg/dL in 1997
///   - AHA updated hypertension guidelines in 2017
///   Using Chainlink ensures the contract always has current standards
///   without requiring a contract upgrade.

contract ChainlinkThresholdOracle is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // ── Types ────────────────────────────────────────────

    struct MedicalThresholds {
        uint64 sugarThreshold;         // mg/dL (e.g., 126 for diabetes)
        uint64 cholesterolThreshold;   // mg/dL (e.g., 200 for healthy)
        uint64 bloodPressureThreshold; // mmHg systolic (e.g., 140)
        uint256 lastUpdated;           // timestamp of last oracle update
        bytes32 sourceHash;            // hash of the oracle response
        bool isSet;                    // whether thresholds have been set
    }

    struct LabInfo {
        string labName;
        string labId;
        bool isRegistered;
        uint256 registeredAt;
        uint256 lastVerifiedAt;        // last Chainlink verification
        bool chainlinkVerified;        // verified via Chainlink Functions
    }

    // ── State ────────────────────────────────────────────

    MedicalThresholds public currentThresholds;
    MedicalThresholds public previousThresholds; // keep history

    // Lab registry: labPubHash => LabInfo
    mapping(bytes32 => LabInfo) public labs;
    bytes32[] public registeredLabHashes;

    // Chainlink Functions config
    bytes32 public immutable donId;
    uint64 public subscriptionId;
    uint32 public callbackGasLimit;

    // Request tracking
    mapping(bytes32 => string) private requestTypes;     // requestId => type
    mapping(bytes32 => bytes32) private requestLabHash;  // requestId => labHash

    // Update frequency (minimum time between threshold updates)
    uint256 public updateCooldown = 1 hours;
    uint256 public lastUpdateRequest;

    // ── Events ───────────────────────────────────────────

    event ThresholdsUpdated(
        uint64 sugar,
        uint64 cholesterol,
        uint64 bloodPressure,
        uint256 timestamp,
        bytes32 sourceHash
    );

    event ThresholdsUpdateRequested(bytes32 indexed requestId, uint256 timestamp);

    event LabRegistered(
        bytes32 indexed labPubHash,
        string labName,
        string labId,
        uint256 timestamp
    );

    event LabDeregistered(bytes32 indexed labPubHash, uint256 timestamp);

    event LabVerificationRequested(
        bytes32 indexed requestId,
        bytes32 indexed labPubHash
    );

    event LabVerificationCompleted(
        bytes32 indexed labPubHash,
        bool isVerified,
        uint256 timestamp
    );

    event UpdateCooldownChanged(uint256 oldCooldown, uint256 newCooldown);

    // ── Errors ───────────────────────────────────────────

    error CooldownNotElapsed(uint256 timeRemaining);
    error LabAlreadyRegistered(bytes32 labPubHash);
    error LabNotFound(bytes32 labPubHash);
    error InvalidThresholds();

    // ── Constructor ──────────────────────────────────────

    constructor(
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) FunctionsClient(_functionsRouter) ConfirmedOwner(msg.sender) {
        donId = _donId;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;

        // Set default thresholds (WHO/ADA/AHA standard values)
        currentThresholds = MedicalThresholds({
            sugarThreshold: 126,         // ADA diabetes diagnostic threshold
            cholesterolThreshold: 200,   // AHA desirable cholesterol level
            bloodPressureThreshold: 140, // AHA Stage 2 hypertension
            lastUpdated: block.timestamp,
            sourceHash: keccak256("default"),
            isSet: true
        });

        emit ThresholdsUpdated(126, 200, 140, block.timestamp, keccak256("default"));
    }

    // ── Threshold Management ─────────────────────────────

    /// @notice Request fresh thresholds from the medical standards oracle
    /// @dev Calls Chainlink Functions to fetch from an off-chain API
    /// @return requestId The Chainlink Functions request ID
    function fetchThresholds() external onlyOwner returns (bytes32) {
        // Enforce cooldown to prevent spamming the oracle
        if (block.timestamp < lastUpdateRequest + updateCooldown) {
            revert CooldownNotElapsed(
                (lastUpdateRequest + updateCooldown) - block.timestamp
            );
        }

        lastUpdateRequest = block.timestamp;

        // ── Chainlink Functions JavaScript Source ──────────
        // This code runs on Chainlink's Decentralized Oracle Network (DON).
        // It fetches medical thresholds from an API and returns them
        // packed into a single uint256.
        //
        // For the hackathon demo, we use a mock API (jsonbin.io).
        // In production, this would query:
        //   - WHO International Classification of Diseases (ICD)
        //   - ADA Standards of Medical Care in Diabetes
        //   - AHA/ACC Hypertension Guidelines
        //   - ATP III Cholesterol Guidelines
        string memory source =
            "try {"
            "  const res = await Functions.makeHttpRequest({"
            "    url: 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID/latest',"
            "    headers: { 'X-Master-Key': secrets.apiKey || '' }"
            "  });"
            "  const d = res.data.record || res.data;"
            "  const s = Math.min(Math.max(d.sugar || 126, 50), 500);"
            "  const c = Math.min(Math.max(d.cholesterol || 200, 50), 500);"
            "  const b = Math.min(Math.max(d.bloodPressure || 140, 50), 300);"
            "  return Functions.encodeUint256("
            "    (BigInt(s) << 128n) | (BigInt(c) << 64n) | BigInt(b)"
            "  );"
            "} catch(e) {"
            "  return Functions.encodeUint256("
            "    (126n << 128n) | (200n << 64n) | 140n"
            "  );"
            "}";

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );

        requestTypes[requestId] = "thresholds";
        emit ThresholdsUpdateRequested(requestId, block.timestamp);
        return requestId;
    }

    /// @notice Manually set thresholds (owner only, for emergencies)
    /// @dev Use this if the oracle is down or returns bad data
    function setThresholdsManual(
        uint64 _sugar,
        uint64 _cholesterol,
        uint64 _bp
    ) external onlyOwner {
        if (_sugar < 50 || _sugar > 500) revert InvalidThresholds();
        if (_cholesterol < 50 || _cholesterol > 500) revert InvalidThresholds();
        if (_bp < 50 || _bp > 300) revert InvalidThresholds();

        previousThresholds = currentThresholds;
        currentThresholds = MedicalThresholds({
            sugarThreshold: _sugar,
            cholesterolThreshold: _cholesterol,
            bloodPressureThreshold: _bp,
            lastUpdated: block.timestamp,
            sourceHash: keccak256(abi.encodePacked("manual", _sugar, _cholesterol, _bp)),
            isSet: true
        });

        emit ThresholdsUpdated(_sugar, _cholesterol, _bp, block.timestamp, currentThresholds.sourceHash);
    }

    /// @notice Set the minimum time between oracle updates
    function setUpdateCooldown(uint256 _cooldown) external onlyOwner {
        uint256 old = updateCooldown;
        updateCooldown = _cooldown;
        emit UpdateCooldownChanged(old, _cooldown);
    }

    // ── Lab Registry ─────────────────────────────────────

    /// @notice Register a trusted medical lab
    /// @param _labPubHash Pedersen hash of the lab's signing secret
    /// @param _labName Human-readable lab name
    /// @param _labId Lab's unique identifier
    function registerLab(
        bytes32 _labPubHash,
        string calldata _labName,
        string calldata _labId
    ) external onlyOwner {
        if (labs[_labPubHash].isRegistered) {
            revert LabAlreadyRegistered(_labPubHash);
        }

        labs[_labPubHash] = LabInfo({
            labName: _labName,
            labId: _labId,
            isRegistered: true,
            registeredAt: block.timestamp,
            lastVerifiedAt: 0,
            chainlinkVerified: false
        });

        registeredLabHashes.push(_labPubHash);
        emit LabRegistered(_labPubHash, _labName, _labId, block.timestamp);
    }

    /// @notice Deregister a lab (revoke trust)
    function deregisterLab(bytes32 _labPubHash) external onlyOwner {
        if (!labs[_labPubHash].isRegistered) {
            revert LabNotFound(_labPubHash);
        }

        labs[_labPubHash].isRegistered = false;
        emit LabDeregistered(_labPubHash, block.timestamp);
    }

    /// @notice Verify a lab's registration via Chainlink Functions
    /// @dev Checks the lab against an off-chain medical registry API
    function verifyLabOffChain(bytes32 _labPubHash) external returns (bytes32) {
        string memory source =
            "const labId = args[0];"
            "try {"
            "  const res = await Functions.makeHttpRequest({"
            "    url: `https://api.medicalregistry.example/labs/${labId}`"
            "  });"
            "  return Functions.encodeUint256(res.data.registered ? 1 : 0);"
            "} catch(e) {"
            "  return Functions.encodeUint256(0);"
            "}";

        string[] memory args = new string[](1);
        args[0] = labs[_labPubHash].labId;

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );

        requestTypes[requestId] = "lab";
        requestLabHash[requestId] = _labPubHash;
        emit LabVerificationRequested(requestId, _labPubHash);
        return requestId;
    }

    // ── Chainlink Callback ───────────────────────────────

    /// @notice Called by Chainlink DON with the oracle response
    function fulfillRequest(
        bytes32 _requestId,
        bytes memory _response,
        bytes memory _err
    ) internal override {
        // Ignore errors — use existing values
        if (_err.length > 0) return;

        string memory reqType = requestTypes[_requestId];

        if (_strEq(reqType, "thresholds")) {
            _processThresholdResponse(_response);
        } else if (_strEq(reqType, "lab")) {
            _processLabResponse(_requestId, _response);
        }

        // Cleanup
        delete requestTypes[_requestId];
    }

    function _processThresholdResponse(bytes memory _response) internal {
        uint256 packed = abi.decode(_response, (uint256));

        uint64 sugar = uint64(packed >> 128);
        uint64 cholesterol = uint64(packed >> 64);
        uint64 bp = uint64(packed);

        // Sanity validation
        if (sugar >= 50 && sugar <= 500 &&
            cholesterol >= 50 && cholesterol <= 500 &&
            bp >= 50 && bp <= 300) {

            previousThresholds = currentThresholds;
            currentThresholds = MedicalThresholds({
                sugarThreshold: sugar,
                cholesterolThreshold: cholesterol,
                bloodPressureThreshold: bp,
                lastUpdated: block.timestamp,
                sourceHash: keccak256(_response),
                isSet: true
            });

            emit ThresholdsUpdated(
                sugar, cholesterol, bp,
                block.timestamp,
                currentThresholds.sourceHash
            );
        }
    }

    function _processLabResponse(
        bytes32 _requestId,
        bytes memory _response
    ) internal {
        bytes32 labHash = requestLabHash[_requestId];
        uint256 isVerified = abi.decode(_response, (uint256));

        if (labs[labHash].isRegistered) {
            labs[labHash].lastVerifiedAt = block.timestamp;
            labs[labHash].chainlinkVerified = (isVerified == 1);
        }

        emit LabVerificationCompleted(
            labHash,
            isVerified == 1,
            block.timestamp
        );

        delete requestLabHash[_requestId];
    }

    // ── View Functions ───────────────────────────────────

    /// @notice Get current medical thresholds
    function getThresholds()
        external
        view
        returns (
            uint64 sugar,
            uint64 cholesterol,
            uint64 bloodPressure,
            uint256 lastUpdated,
            bytes32 sourceHash
        )
    {
        MedicalThresholds memory t = currentThresholds;
        return (
            t.sugarThreshold,
            t.cholesterolThreshold,
            t.bloodPressureThreshold,
            t.lastUpdated,
            t.sourceHash
        );
    }

    /// @notice Get individual threshold values (for circuit public inputs)
    function getSugarThreshold() external view returns (uint64) {
        return currentThresholds.sugarThreshold;
    }

    function getCholesterolThreshold() external view returns (uint64) {
        return currentThresholds.cholesterolThreshold;
    }

    function getBloodPressureThreshold() external view returns (uint64) {
        return currentThresholds.bloodPressureThreshold;
    }

    /// @notice Check if a lab is registered AND trusted
    function isLabTrusted(bytes32 _labPubHash) external view returns (bool) {
        return labs[_labPubHash].isRegistered;
    }

    /// @notice Check if a lab has been verified by Chainlink
    function isLabChainlinkVerified(bytes32 _labPubHash) external view returns (bool) {
        LabInfo memory lab = labs[_labPubHash];
        return lab.isRegistered && lab.chainlinkVerified;
    }

    /// @notice Get full lab info
    function getLabInfo(bytes32 _labPubHash) external view returns (LabInfo memory) {
        return labs[_labPubHash];
    }

    /// @notice Get all registered lab hashes
    function getRegisteredLabs() external view returns (bytes32[] memory) {
        return registeredLabHashes;
    }

    /// @notice Get number of registered labs
    function getRegisteredLabCount() external view returns (uint256) {
        return registeredLabHashes.length;
    }

    /// @notice Check if thresholds are stale (not updated in 7 days)
    function areThresholdsStale() external view returns (bool) {
        return block.timestamp > currentThresholds.lastUpdated + 7 days;
    }

    // ── Helpers ──────────────────────────────────────────

    function _strEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /// @notice Update Chainlink subscription ID
    function setSubscriptionId(uint64 _subId) external onlyOwner {
        subscriptionId = _subId;
    }

    /// @notice Update callback gas limit
    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        callbackGasLimit = _gasLimit;
    }
}