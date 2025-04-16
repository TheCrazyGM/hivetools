const statusDiv = document.getElementById("status");

function setStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = isError ? "error" : message ? "success" : ""; // Add 'success' class only if there's a success message
}

function stakeIt() {
  setStatus(""); // Clear previous status
  const username = document
    .getElementById("username")
    .value.trim()
    .toLowerCase(); // Usernames are lowercase
  const amount = parseFloat(document.getElementById("amount").value); // Keep as number for validation
  const asset = document.getElementById("asset").value.trim();
  const netId = document.getElementById("netId").value.trim();
  // --- Input Validation ---
  if (!username) {
    setStatus("Please enter your Hive username.", true);
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    setStatus("Please enter a valid positive amount.", true);
    return;
  }
  if (!asset) {
    setStatus("Please enter the asset symbol (e.g., hive).", true);
    return;
  }
  if (!netId) {
    setStatus("Please enter the Network ID.", true);
    return;
  }
  // --- Check for Hive Keychain ---
  if (!window.hive_keychain) {
    setStatus("Hive Keychain extension is not installed or enabled.", true);
    alert(
      "Hive Keychain extension is required for this action. Please install or enable it.",
    );
    return;
  }
  // --- Prepare the Custom JSON Payload ---
  // Format amount to 3 decimal places as string for JSON
  const amountString = amount.toFixed(3);
  const jsonPayload = JSON.stringify({
    // Convention often uses hive: prefix, adjust if VSC expects plain username
    from: `hive:${username}`,
    to: `hive:${username}`, // Staking to self
    amount: amountString,
    asset: asset,
    net_id: netId,
  });
  const customJsonId = "vsc.consensus_stake"; // The ID for the custom JSON operation
  console.log("Requesting Custom JSON via Keychain:");
  console.log("ID:", customJsonId);
  console.log("Username:", username);
  console.log("JSON Payload:", jsonPayload);
  // --- Request Signature via Hive Keychain ---
  setStatus("Requesting signature via Keychain...");
  window.hive_keychain.requestCustomJson(
    username, // User performing the action
    customJsonId, // ID of the custom_json operation
    "Active", // Required key type (Staking usually needs Active)
    jsonPayload, // The JSON string payload
    "Stake VSC Tokens", // Display message in Keychain prompt
    function (response) {
      console.log("Keychain response:", response);
      if (response.success) {
        setStatus(
          `Successfully staked ${amountString} ${asset}! (Tx: ${response.result.id.substring(0, 8)}...)`,
          false,
        );
        alert(
          `Successfully staked ${amountString} ${asset}!\nTransaction ID: ${response.result.id}`,
        );
        // Optionally clear form fields or update UI further
      } else {
        setStatus(`Keychain Error: ${response.message}`, true);
        alert(`Error staking: ${response.message}`);
      }
    },
  );
}
