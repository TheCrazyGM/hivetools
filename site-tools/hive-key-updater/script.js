// Initialize variables
let currentAccount = null;
let generatedKeys = null;
let keysDownloaded = false; // Track whether keys have been downloaded

// DHive client initialization
const client = new dhive.Client([
  "https://api.hive.blog",
  "https://api.syncad.com",
]);

// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Set up event listeners
  setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
  // Step 1: Check Account button
  document
    .getElementById("checkAccountBtn")
    .addEventListener("click", checkAccount);

  // Step 2: Generate password button
  document
    .getElementById("generatePasswordBtn")
    .addEventListener("click", generateNewPassword);
  document
    .getElementById("copyPasswordBtn")
    .addEventListener("click", copyPasswordToClipboard);
  document
    .getElementById("continueToPreviewBtn")
    .addEventListener("click", previewKeys);

  // Step 3: Update Keys button
  document
    .getElementById("downloadKeysBtn")
    .addEventListener("click", downloadKeysAsJson);
  document
    .getElementById("updateKeysBtn")
    .addEventListener("click", updateKeys);
  document
    .getElementById("copyMasterPasswordBtn")
    .addEventListener("click", copyMasterPasswordToClipboard);

  // Add reveal/hide functionality for master password
  document
    .getElementById("revealMasterPasswordBtn")
    .addEventListener("click", toggleMasterPasswordVisibility);

  // Step 4: Start Over button
  document.getElementById("startOverBtn").addEventListener("click", startOver);

  // Generate a password on initial load of step 2
  generateNewPassword();
}

// Step 1: Check if the account exists
async function checkAccount() {
  const accountNameInput = document.getElementById("accountName");
  const accountName = accountNameInput.value.trim().toLowerCase();

  if (!accountName) {
    showError("Please enter a valid Hive account name.");
    return;
  }

  try {
    // Check if account exists on Hive
    const accounts = await client.database.getAccounts([accountName]);

    if (accounts.length === 0) {
      showError(`Account @${accountName} not found on the Hive blockchain.`);
      return;
    }

    // Store account information
    currentAccount = accounts[0];

    // Move to step 2
    showStep(2);
  } catch (error) {
    showError(`Error checking account: ${error.message}`);
  }
}

// Step 2: Generate a new BIP39 mnemonic password
function generateNewPassword() {
  const newPasswordInput = document.getElementById("newPassword");
  try {
    // Check if our BIP39 implementation is available
    if (typeof BIP39 !== "undefined") {
      console.log("Using custom BIP39 implementation");

      // Generate 128-bit mnemonic (12 words)
      const mnemonic = BIP39.generateMnemonic(128);
      console.log("Generated mnemonic successfully");
      newPasswordInput.value = mnemonic;
    } else {
      console.error("BIP39 implementation not available");
      newPasswordInput.value = "ERROR: BIP39 implementation not available";
    }
  } catch (error) {
    console.error("Error generating mnemonic:", error);
    newPasswordInput.value = `Error generating mnemonic: ${error.message}`;
  }
}

// Copy the generated password to clipboard
function copyPasswordToClipboard() {
  const newPasswordInput = document.getElementById("newPassword");
  newPasswordInput.select();
  document.execCommand("copy");

  // Show feedback
  const copyBtn = document.getElementById("copyPasswordBtn");
  const originalHTML = copyBtn.innerHTML;
  copyBtn.innerHTML = '<i class="fas fa-check"></i>';
  setTimeout(() => {
    copyBtn.innerHTML = originalHTML;
  }, 1500);
}

// Copy the master password from the preview display to clipboard
function copyMasterPasswordToClipboard() {
  const masterPasswordEl = document.getElementById("masterPasswordDisplay");
  const masterPassword =
    masterPasswordEl.dataset.actualPassword || masterPasswordEl.textContent;
  navigator.clipboard.writeText(masterPassword).then(() => {
    // Show feedback
    const copyBtn = document.getElementById("copyMasterPasswordBtn");
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
    }, 1500);
  });
}

// Toggle visibility of the master password
function toggleMasterPasswordVisibility() {
  const masterPasswordEl = document.getElementById("masterPasswordDisplay");
  const revealBtn = document.getElementById("revealMasterPasswordBtn");

  if (masterPasswordEl.classList.contains("key-masked")) {
    // Reveal the password
    masterPasswordEl.textContent = masterPasswordEl.dataset.actualPassword;
    masterPasswordEl.classList.remove("key-masked");
    revealBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';

    // Auto-hide after 10 seconds for security
    setTimeout(() => {
      if (!masterPasswordEl.classList.contains("key-masked")) {
        masterPasswordEl.textContent = "••••••••••••••••••••••••";
        masterPasswordEl.classList.add("key-masked");
        revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    }, 10000);
  } else {
    // Hide the password again
    masterPasswordEl.textContent = "••••••••••••••••••••••••";
    masterPasswordEl.classList.add("key-masked");
    revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

// Step 3: Preview the new keys that will be generated
async function previewKeys() {
  const accountName = document
    .getElementById("accountName")
    .value.trim()
    .toLowerCase();
  const newPassword = document.getElementById("newPassword").value.trim();

  if (!newPassword) {
    showError("Please generate a new password first.");
    return;
  }

  try {
    // Generate keys for all roles
    generatedKeys = generateKeysFromPassword(accountName, newPassword);

    // Display the keys in the table
    displayKeysInTable(generatedKeys);

    // Move to step 3
    showStep(3);
  } catch (error) {
    showError(`Error generating keys: ${error.message}`);
  }
}

// Generate keys from a password for all roles
function generateKeysFromPassword(accountName, password) {
  const roles = ["owner", "active", "posting", "memo"];
  const keys = {};

  roles.forEach((role) => {
    // Use dhive's key derivation function
    const privateKey = dhive.PrivateKey.fromLogin(accountName, password, role);
    const publicKey = privateKey.createPublic();

    keys[role] = {
      public: publicKey.toString(),
      private: privateKey.toString(),
    };
  });

  return keys;
}

// Display the generated keys in the table
function displayKeysInTable(keys) {
  const tableBody = document.querySelector("#keysTable tbody");
  tableBody.innerHTML = "";

  // Display the master password in the separate display area (hidden by default)
  const masterPassword = document.getElementById("newPassword").value.trim();
  const masterPasswordDisplay = document.getElementById(
    "masterPasswordDisplay",
  );
  masterPasswordDisplay.dataset.actualPassword = masterPassword;
  masterPasswordDisplay.textContent = "••••••••••••••••••••••••";
  masterPasswordDisplay.classList.add("key-masked");

  // Add key rows to table
  for (const role in keys) {
    const row = document.createElement("tr");

    // Role column
    const roleCell = document.createElement("td");
    roleCell.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    roleCell.className = "align-middle";
    row.appendChild(roleCell);

    // Public key column
    const publicKeyCell = document.createElement("td");
    const publicKeySpan = document.createElement("span");
    publicKeySpan.textContent = keys[role].public;
    publicKeySpan.className = "key-value";
    publicKeyCell.appendChild(publicKeySpan);
    row.appendChild(publicKeyCell);

    // Private key column with hide/reveal functionality
    const privateKeyCell = document.createElement("td");

    // Create container for the hidden/revealed key
    const privateKeyContainer = document.createElement("div");
    privateKeyContainer.className = "position-relative";

    // Create the key value span (initially hidden with asterisks)
    const privateKeySpan = document.createElement("span");
    privateKeySpan.textContent = "••••••••••••••••••••••••••••••••••••••••••••";
    privateKeySpan.className = "key-value key-masked";
    privateKeySpan.dataset.actualKey = keys[role].private;

    // Create the reveal button
    const revealBtn = document.createElement("button");
    revealBtn.type = "button";
    revealBtn.className =
      "btn btn-sm btn-outline-secondary position-absolute end-0 top-0";
    revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
    revealBtn.title = "Show/hide private key";
    revealBtn.style.marginRight = "5px";

    // Add event listener for revealing/hiding the key
    revealBtn.addEventListener("click", function () {
      if (privateKeySpan.classList.contains("key-masked")) {
        // Reveal the key
        privateKeySpan.textContent = privateKeySpan.dataset.actualKey;
        privateKeySpan.classList.remove("key-masked");
        revealBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';

        // Auto-hide after 10 seconds for security
        setTimeout(() => {
          if (!privateKeySpan.classList.contains("key-masked")) {
            privateKeySpan.textContent =
              "••••••••••••••••••••••••••••••••••••••••••••";
            privateKeySpan.classList.add("key-masked");
            revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
          }
        }, 10000);
      } else {
        // Hide the key again
        privateKeySpan.textContent =
          "••••••••••••••••••••••••••••••••••••••••••••";
        privateKeySpan.classList.add("key-masked");
        revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });

    // Assemble the elements
    privateKeyContainer.appendChild(privateKeySpan);
    privateKeyContainer.appendChild(revealBtn);
    privateKeyCell.appendChild(privateKeyContainer);
    row.appendChild(privateKeyCell);

    // Actions column
    const actionsCell = document.createElement("td");
    actionsCell.className = "text-center";

    // Copy buttons
    const copyPublicBtn = document.createElement("button");
    copyPublicBtn.className = "btn btn-sm btn-outline-primary me-1";
    copyPublicBtn.innerHTML = '<i class="fas fa-copy"></i> Public';
    copyPublicBtn.onclick = () =>
      copyToClipboard(keys[role].public, copyPublicBtn);

    const copyPrivateBtn = document.createElement("button");
    copyPrivateBtn.className = "btn btn-sm btn-outline-success";
    copyPrivateBtn.innerHTML = '<i class="fas fa-copy"></i> Private';
    copyPrivateBtn.onclick = () =>
      copyToClipboard(keys[role].private, copyPrivateBtn);

    actionsCell.appendChild(copyPublicBtn);
    actionsCell.appendChild(copyPrivateBtn);
    row.appendChild(actionsCell);

    tableBody.appendChild(row);
  }

  // Reset keys downloaded status and update button state
  keysDownloaded = false;
  updateButtonState();
}

// Copy text to clipboard with feedback
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1500);
  });
}

// Step 3: Download keys as JSON
async function downloadKeysAsJson() {
  if (!generatedKeys) {
    showError("No keys have been generated yet.");
    return;
  }

  const accountName = document.getElementById("accountName").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();

  const data = {
    account: accountName,
    master_password: newPassword,
    generated_at: new Date().toISOString(),
    keys: generatedKeys,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `hive_keys_${accountName}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  keysDownloaded = true;
  updateButtonState();

  // Provide visual feedback that keys were downloaded
  const downloadBtn = document.getElementById("downloadKeysBtn");
  const originalHTML = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-check"></i> Keys Downloaded';
  downloadBtn.classList.remove("btn-info");
  downloadBtn.classList.add("btn-success");

  setTimeout(() => {
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.classList.remove("btn-success");
    downloadBtn.classList.add("btn-info");
  }, 2000);
}

// Step 3: Update account keys
async function updateKeys() {
  if (!generatedKeys) {
    showError("No keys have been generated yet.");
    return;
  }

  const accountName = document.getElementById("accountName").value.trim();
  const newPassword = document.getElementById("newPassword").value.trim();
  const ownerWif = document.getElementById("ownerWif").value.trim();

  if (!ownerWif) {
    showError("Please enter your owner private key (WIF).");
    return;
  }

  // Prepare the authority update
  const ownerAuth = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[generatedKeys.owner.public, 1]],
  };

  const activeAuth = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[generatedKeys.active.public, 1]],
  };

  const postingAuth = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[generatedKeys.posting.public, 1]],
  };

  const memoKey = generatedKeys.memo.public;

  try {
    // Manual method using owner WIF
    let ownerKey;
    try {
      ownerKey = dhive.PrivateKey.fromString(ownerWif);
    } catch (e) {
      showError("Invalid owner private key format.");
      return;
    }

    // Create and broadcast the transaction
    const op = [
      "account_update",
      {
        account: accountName,
        owner: ownerAuth,
        active: activeAuth,
        posting: postingAuth,
        memo_key: memoKey,
        json_metadata: currentAccount.json_metadata,
      },
    ];

    // Show a loading indicator
    showStep(4);
    
    // Safely access DOM elements with null checks
    const successMessage = document.getElementById("successMessage");
    const errorMessage = document.getElementById("errorMessage");
    
    if (successMessage) successMessage.classList.add("d-none");
    if (errorMessage) errorMessage.classList.add("d-none");

    const loadingEl = document.createElement("div");
    loadingEl.id = "loadingIndicator";
    loadingEl.className = "alert alert-info";
    loadingEl.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Broadcasting transaction... please wait';
    
    const stepContainer = document.querySelector(".step-container:not(.d-none)");
    if (stepContainer) {
      stepContainer.prepend(loadingEl);
    } else {
      console.error("Could not find step container to add loading indicator");
    }

    // Send the transaction
    const result = await client.broadcast.sendOperations([op], ownerKey);
    console.log("Transaction successful:", result);

    // Remove loading indicator
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    // Display transaction details
    if (result && result.id) {
      // Set transaction ID
      const txIdDisplay = document.getElementById("txIdDisplay");
      if (txIdDisplay) {
        txIdDisplay.textContent = result.id;
      }

      // Setup explorer link
      const explorerUrl = `https://hivehub.dev/tx/${result.id}`;
      document.getElementById("viewTxLink").href = explorerUrl;

      // Setup copy transaction ID button
      document
        .getElementById("copyTxId")
        .addEventListener("click", function () {
          navigator.clipboard.writeText(result.id).then(() => {
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
              this.innerHTML = originalHTML;
            }, 1500);
          });
        });

      // Set timestamp - format current time as it would be when transaction is confirmed
      const timestamp = new Date().toISOString();
      document.getElementById("txTimestamp").textContent = new Date(
        timestamp,
      ).toLocaleString();

      // Set account name
      document.getElementById("txAccount").textContent = `@${accountName}`;

      // Set updated keys list
      const updatedKeys = [];
      if (generatedKeys.owner) updatedKeys.push("Owner");
      if (generatedKeys.active) updatedKeys.push("Active");
      if (generatedKeys.posting) updatedKeys.push("Posting");
      if (generatedKeys.memo) updatedKeys.push("Memo");

      document.getElementById("updatedKeysList").innerHTML = updatedKeys
        .map((key) => `<span class="badge bg-secondary me-1">${key}</span>`)
        .join("");

      // Set raw transaction data
      const rawTransactionData = JSON.stringify(
        {
          id: result.id,
          block_num: result.block_num || "Pending",
          transaction_num: result.transaction_num || 0,
          timestamp,
          operations: [
            [
              "account_update",
              {
                account: accountName,
                owner: ownerAuth,
                active: activeAuth,
                posting: postingAuth,
                memo_key: memoKey,
                json_metadata: currentAccount.json_metadata,
              },
            ],
          ],
        },
        null,
        2,
      );

      document.getElementById("rawTransactionData").textContent =
        rawTransactionData;

      // Setup toggle button for raw transaction
      document
        .getElementById("toggleRawTxBtn")
        .addEventListener("click", function () {
          const container = document.getElementById("rawTransactionContainer");
          if (container.classList.contains("show")) {
            container.classList.remove("show");
          } else {
            container.classList.add("show");
          }
        });
    }

    // Show success message
    const finalSuccessMessage = document.getElementById("successMessage");
    const finalErrorMessage = document.getElementById("errorMessage");
    
    if (finalSuccessMessage) finalSuccessMessage.classList.remove("d-none");
    if (finalErrorMessage) finalErrorMessage.classList.add("d-none");
  } catch (error) {
    showError(`Error updating keys: ${error.message}`);
  }
}

// Update the state of the update button based on whether keys have been downloaded
function updateButtonState() {
  const updateBtn = document.getElementById("updateKeysBtn");

  if (keysDownloaded) {
    // Enable button if keys have been downloaded
    updateBtn.disabled = false;
    updateBtn.title = "";
  } else {
    // Disable button if keys haven't been downloaded
    updateBtn.disabled = true;
    updateBtn.title = "Please download your keys first";

    // Add message above the button
    let warningMsg = document.getElementById("downloadWarning");
    if (!warningMsg) {
      warningMsg = document.createElement("div");
      warningMsg.id = "downloadWarning";
      warningMsg.className = "alert alert-danger mb-3";
      warningMsg.innerHTML =
        '<i class="fas fa-exclamation-triangle me-2"></i>You must download your keys before updating your account!';

      // Insert before the buttons
      const buttonsContainer = document.querySelector("#step3 .d-grid");
      buttonsContainer.parentNode.insertBefore(warningMsg, buttonsContainer);
    }
  }
}



// Show only the specified step and hide others
function showStep(stepNumber) {
  const steps = document.querySelectorAll(".step-container");
  steps.forEach((step, index) => {
    if (index + 1 === stepNumber) {
      step.classList.remove("d-none");
    } else {
      step.classList.add("d-none");
    }
  });

  // Scroll to top of visible step
  window.scrollTo(0, 0);
}

// Show error message
function showError(message) {
  showStep(4);
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const errorDetails = document.getElementById("errorDetails");
  
  if (errorMessage) errorMessage.classList.remove("d-none");
  if (successMessage) successMessage.classList.add("d-none");
  if (errorDetails) errorDetails.textContent = message;
  
  console.error("Error:", message); // Log error to console as well
}

// Reset the app to initial state
function startOver() {
  currentAccount = null;
  generatedKeys = null;
  keysDownloaded = false;
  document.getElementById("accountName").value = "";
  document.getElementById("ownerWif").value = "";
  generateNewPassword(); // Generate a fresh password
  showStep(1);
}
