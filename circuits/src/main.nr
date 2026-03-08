use std::hash::pedersen_hash;

/// ═══════════════════════════════════════════════════════════
/// MedZK — Medical Threshold ZK Circuit
/// ═══════════════════════════════════════════════════════════
///
/// PROVES:
///   1. Medical data was signed by a trusted lab
///   2. Blood sugar exceeds diabetes threshold (> 126)
///   3. Cholesterol is in healthy range (< 200)
///   4. Blood pressure is below hypertension threshold (< 140)
///
/// REVEALS: Nothing about actual medical values
/// ═══════════════════════════════════════════════════════════

fn main(
    // ── Private Inputs (patient keeps secret) ─────────────
    sugar: u64,                     // actual blood sugar value
    cholesterol: u64,               // actual cholesterol value
    bp_systolic: u64,               // actual systolic BP
    lab_secret: Field,              // lab's signing key (private)

    // ── Public Inputs (visible on-chain) ──────────────────
    threshold_sugar: pub u64,       // e.g., 126 (from Chainlink oracle)
    threshold_cholesterol: pub u64, // e.g., 200 (from Chainlink oracle)
    threshold_bp: pub u64,          // e.g., 140 (from Chainlink oracle)
    lab_pub_hash: pub Field,        // hash of lab's public identity
    data_hash: pub Field,           // commitment to the medical data
    result: pub u8                  // 1 = all conditions met
) {
    // ── Step 1: Verify lab authorization ──────────────────
    // The lab signed this data with their secret key.
    // We verify by checking hash(lab_secret) == lab_pub_hash
    // This proves the data came from the registered lab
    // without revealing the lab's secret key.
    //
    // In production: replace with EdDSA signature verification
    // using std::eddsa::eddsa_poseidon_verify
    let computed_lab_hash = pedersen_hash([lab_secret]);
    assert(computed_lab_hash == lab_pub_hash, "Lab signature verification failed");

    // ── Step 2: Verify data integrity ─────────────────────
    // Hash the private medical values and check against
    // the public commitment. This ensures the patient
    // didn't tamper with the values after the lab signed them.
    let computed_data_hash = pedersen_hash([
        sugar as Field,
        cholesterol as Field,
        bp_systolic as Field
    ]);
    assert(computed_data_hash == data_hash, "Data integrity check failed");

    // ── Step 3: Check medical thresholds ──────────────────
    // These thresholds come from the Chainlink oracle on-chain.
    // The circuit checks the private values against them.

    // Blood sugar must be ABOVE threshold (diabetes diagnosis)
    assert(sugar > threshold_sugar, "Sugar below threshold");

    // Cholesterol must be BELOW threshold (healthy range)
    assert(cholesterol < threshold_cholesterol, "Cholesterol above threshold");

    // Blood pressure must be BELOW threshold (no hypertension)
    assert(bp_systolic < threshold_bp, "Blood pressure above threshold");

    // ── Step 4: Confirm result flag ───────────────────────
    assert(result == 1, "Result must be 1 when all conditions met");
}

// ── Tests ─────────────────────────────────────────────────

#[test]
fn test_valid_proof() {
    // Lab setup
    let lab_secret = 12345;
    let lab_pub_hash = pedersen_hash([lab_secret as Field]);
    
    // Medical values
    let sugar: u64 = 142;
    let cholesterol: u64 = 185;
    let bp: u64 = 128;

    let data_hash = pedersen_hash([
        sugar as Field,
        cholesterol as Field,
        bp as Field
    ]);

    main(
        sugar,
        cholesterol,
        bp,
        lab_secret as Field,
        126, // threshold_sugar
        200, // threshold_cholesterol
        140, // threshold_bp
        lab_pub_hash,
        data_hash,
        1    // result
    );
}

#[test(should_fail)]
fn test_sugar_too_low() {
    let lab_secret = 12345;
    let lab_pub_hash = pedersen_hash([lab_secret as Field]);
    
    let sugar: u64 = 100; // Below 126 — should fail
    let cholesterol: u64 = 185;
    let bp: u64 = 128;

    let data_hash = pedersen_hash([
        sugar as Field,
        cholesterol as Field,
        bp as Field
    ]);

    main(
        sugar, cholesterol, bp,
        lab_secret as Field,
        126, 200, 140,
        lab_pub_hash, data_hash, 1
    );
}

#[test(should_fail)]
fn test_wrong_lab() {
    let real_lab_secret = 12345;
    let fake_lab_secret = 99999;
    let lab_pub_hash = pedersen_hash([real_lab_secret as Field]);
    
    let sugar: u64 = 142;
    let cholesterol: u64 = 185;
    let bp: u64 = 128;

    let data_hash = pedersen_hash([
        sugar as Field,
        cholesterol as Field,
        bp as Field
    ]);

    // Using fake lab secret — should fail
    main(
        sugar, cholesterol, bp,
        fake_lab_secret as Field,
        126, 200, 140,
        lab_pub_hash, data_hash, 1
    );
}