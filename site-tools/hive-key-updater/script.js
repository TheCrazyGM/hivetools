// Initialize variables
let currentAccount = null;
let generatedKeys = null;
let keysDownloaded = false; // Track whether keys have been downloaded
let currentNodeUrl = "https://api.hive.blog"; // Default node

// Secure storage for private keys (in-memory only)
let privateKeyStorage = {};
let keyExpirationTimer = null;

// List of Hive nodes to choose from
const hiveNodes = [
  { url: "https://api.hive.blog", name: "api.hive.blog" },
  { url: "https://api.deathwing.me", name: "api.deathwing.me" },
  { url: "https://hive-api.arcange.eu", name: "hive-api.arcange.eu" },
  { url: "https://api.openhive.network", name: "api.openhive.network" },
  { url: "https://techcoderx.com", name: "techcoderx.com" },
  { url: "https://api.c0ff33a.uk", name: "api.c0ff33a.uk" },
  { url: "https://hive-api.3speak.tv", name: "hive-api.3speak.tv" },
  { url: "https://hiveapi.actifit.io", name: "hiveapi.actifit.io" },
  { url: "https://rpc.mahdiyari.info", name: "rpc.mahdiyari.info" },
  { url: "https://hive-api.dlux.io", name: "hive-api.dlux.io" },
  { url: "https://api.syncad.com", name: "api.syncad.com" },
  { url: "https://hive.roelandp.nl", name: "hive.roelandp.nl" },
  { url: "https://anyx.io", name: "anyx.io" },
  { url: "https://hived.emre.sh", name: "hived.emre.sh" },
  { url: "https://api.hive.blue", name: "api.hive.blue" },
  { url: "https://rpc.ausbit.dev", name: "rpc.ausbit.dev" },
];

// DHive client initialization with default node
let client = new dhive.Client([currentNodeUrl, "https://api.syncad.com"]);


// Initialize the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Set up event listeners
  setupEventListeners();
  
  // Initialize node selector
  initializeNodeSelector();
  
  // Check current node status on load
  checkNodeStatus(currentNodeUrl);
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

  // Node selector dropdown event listener
  document.getElementById("nodeSelector").addEventListener("click", function(e) {
    // Prevent immediate closing of dropdown when clicking the button
    if (e.target.id === "nodeSelector" || e.target.closest("#nodeSelector")) {
      e.stopPropagation();
    }
  });

  // Generate a password on initial load of step 2
  generateNewPassword();
}

// Step 1: Check if the account exists and validate owner key
async function checkAccount() {
  const accountNameInput = document.getElementById("accountName");
  const accountName = accountNameInput.value.trim().toLowerCase();
  const ownerWif = document.getElementById("ownerWif").value.trim();

  if (!accountName) {
    showError("Please enter a valid Hive account name.");
    return;
  }

  if (!ownerWif) {
    showError("Please enter your owner private key (WIF).");
    return;
  }

  try {
    // First check if the WIF format is valid
    let ownerKey;
    try {
      ownerKey = dhive.PrivateKey.fromString(ownerWif);
    } catch (e) {
      showError("Invalid owner private key format. Please check your key and try again.");
      return;
    }
    
    // Get the derived public key from the private key
    const derivedPublicKey = ownerKey.createPublic().toString();
    
    // Check if account exists on Hive
    const accounts = await client.database.getAccounts([accountName]);

    if (accounts.length === 0) {
      showError(`Account @${accountName} not found on the Hive blockchain.`);
      return;
    }

    const account = accounts[0];
    
    // Check if the provided owner key matches any of the account's owner keys
    let keyMatchesAccount = false;
    if (account.owner && account.owner.key_auths) {
      for (const [publicKey, weight] of account.owner.key_auths) {
        if (publicKey === derivedPublicKey) {
          keyMatchesAccount = true;
          break;
        }
      }
    }
    
    if (!keyMatchesAccount) {
      showError("The provided owner key does not match this account's owner authority. Please verify your key and try again.");
      return;
    }
    
    // Store account information for later use
    currentAccount = account;
    
    // Store the validated owner key in memory for security
    privateKeyStorage['owner_wif'] = ownerWif;
    
    // Set up expiration timer for the key - using a much longer timeout for the full process
    if (keyExpirationTimer) {
      clearTimeout(keyExpirationTimer);
    }
    keyExpirationTimer = setTimeout(() => {
      privateKeyStorage = {};
      console.log("Private keys cleared from memory due to timeout");
      // Show notification if user is still on the page
      showError("For security reasons, your private keys have been cleared from memory due to inactivity.");
    }, 30 * 60 * 1000); // 30 minutes - enough time to complete the full process

    console.log("Owner key validation successful");
    
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
      
      // Disable the button while generating
      const generateBtn = document.getElementById("generatePasswordBtn");
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Generating...';
      }

      // Generate the mnemonic using the simplified implementation
      const mnemonic = BIP39.generateMnemonic(128);
      console.log("Generated mnemonic successfully");
      newPasswordInput.value = mnemonic;
      
      // Re-enable the button
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Generate New Suggestion';
      }
    } else {
      console.error("BIP39 implementation not available");
      newPasswordInput.value = "ERROR: BIP39 implementation not available";
    }
  } catch (error) {
    console.error("Error generating mnemonic:", error);
    newPasswordInput.value = `Error generating mnemonic: ${error.message}`;
    
    // Make sure to re-enable the button if there was an error
    const generateBtn = document.getElementById("generatePasswordBtn");
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>Generate New Suggestion';
    }
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
  // Get master password from memory storage instead of DOM
  const masterPassword = privateKeyStorage['master'];
  
  if (masterPassword) {
    navigator.clipboard.writeText(masterPassword).then(() => {
      // Show feedback
      const copyBtn = document.getElementById("copyMasterPasswordBtn");
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 1500);
      
      // Reset the key expiration timer when copying master password
      if (keyExpirationTimer) {
        clearTimeout(keyExpirationTimer);
        keyExpirationTimer = setTimeout(() => {
          privateKeyStorage = {};
          console.log("Private keys cleared from memory due to timeout");
        }, 30 * 60 * 1000); // Reset to 30 minutes
      }
    });
  } else {
    // Master password has expired
    alert("For security, the master password has expired. Please regenerate keys.");
  }
}

// Toggle visibility of the master password
function toggleMasterPasswordVisibility() {
  const masterPasswordEl = document.getElementById("masterPasswordDisplay");
  const revealBtn = document.getElementById("revealMasterPasswordBtn");

  if (masterPasswordEl.classList.contains("key-masked")) {
    // Get master password from memory storage
    const masterPassword = privateKeyStorage['master'];
    
    if (masterPassword) {
      // Reveal the password from memory
      masterPasswordEl.textContent = masterPassword;
      masterPasswordEl.classList.remove("key-masked");
      revealBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';

      // Reset the key expiration timer when viewing master password
      if (keyExpirationTimer) {
        clearTimeout(keyExpirationTimer);
        keyExpirationTimer = setTimeout(() => {
          privateKeyStorage = {};
          console.log("Private keys cleared from memory due to timeout");
        }, 30 * 60 * 1000); // Reset to 30 minutes
      }

      // Auto-hide after 10 seconds for security
      setTimeout(() => {
        if (!masterPasswordEl.classList.contains("key-masked")) {
          masterPasswordEl.textContent = "••••••••••••••••••••••••";
          masterPasswordEl.classList.add("key-masked");
          revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
      }, 10000);
    } else {
      // Master password has expired
      masterPasswordEl.textContent = "[Password expired for security]";
      setTimeout(() => {
        masterPasswordEl.textContent = "••••••••••••••••••••••••";
        masterPasswordEl.classList.add("key-masked");
      }, 3000);
    }
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
    
    // Reset the expiration timer when previewing keys
    if (keyExpirationTimer) {
      clearTimeout(keyExpirationTimer);
    }
    keyExpirationTimer = setTimeout(() => {
      privateKeyStorage = {};
      console.log("Private keys cleared from memory due to timeout");
    }, 30 * 60 * 1000); // 30 minutes

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
  
  // Get the master password
  const masterPassword = document.getElementById("newPassword").value.trim();
  
  // Store master password in memory - without clearing other keys
  privateKeyStorage['master'] = masterPassword;
  
  // Store the private keys for each role in memory
  
  // Set up expiration timer for security
  if (keyExpirationTimer) {
    clearTimeout(keyExpirationTimer);
  }
  
  keyExpirationTimer = setTimeout(() => {
    // Clear private keys after timeout for security
    privateKeyStorage = {};
    console.log("Private keys cleared from memory due to timeout");
    
    // Notify user that keys have been cleared
    const notification = document.createElement("div");
    notification.className = "alert alert-warning alert-dismissible fade show mt-3";
    notification.innerHTML = `
      <i class="fas fa-clock me-2"></i>
      For security, private keys have been cleared from memory after inactivity.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const keysTable = document.querySelector("#keysTable");
    if (keysTable && keysTable.parentNode) {
      keysTable.parentNode.insertBefore(notification, keysTable);
    }
  }, 30 * 60 * 1000); // 30 minutes

  // Display the master password in the separate display area (hidden by default)
  const masterPasswordDisplay = document.getElementById(
    "masterPasswordDisplay",
  );
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
    privateKeySpan.dataset.keyId = role; // Store only the role ID, not the actual key
    
    // Store the actual private key in memory, not in DOM
    privateKeyStorage[role] = keys[role].private;

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
        // Get the key ID and retrieve the actual key from memory
        const keyId = privateKeySpan.dataset.keyId;
        const actualKey = privateKeyStorage[keyId];
        
        if (actualKey) {
          // Reveal the key from memory
          privateKeySpan.textContent = actualKey;
          privateKeySpan.classList.remove("key-masked");
          revealBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';

          // Reset the key expiration timer when viewing keys
          if (keyExpirationTimer) {
            clearTimeout(keyExpirationTimer);
            keyExpirationTimer = setTimeout(() => {
              privateKeyStorage = {};
              console.log("Private keys cleared from memory due to timeout");
            }, 5 * 60 * 1000); // Reset to 5 minutes
          }

          // Auto-hide after 10 seconds for security
          setTimeout(() => {
            if (!privateKeySpan.classList.contains("key-masked")) {
              privateKeySpan.textContent = "••••••••••••••••••••••••••••••••••••••••••••";
              privateKeySpan.classList.add("key-masked");
              revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
          }, 10000);
        } else {
          // Key has expired or is not available
          privateKeySpan.textContent = "[Key expired for security]";
          setTimeout(() => {
            privateKeySpan.textContent = "••••••••••••••••••••••••••••••••••••••••••••";
            privateKeySpan.classList.add("key-masked");
          }, 3000);
        }
      } else {
        // Hide the key again
        privateKeySpan.textContent = "••••••••••••••••••••••••••••••••••••••••••••";
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
    copyPrivateBtn.onclick = () => {
      // Get the private key from memory storage instead of DOM
      const privateKey = privateKeyStorage[role];
      if (privateKey) {
        copyToClipboard(privateKey, copyPrivateBtn);
        
        // Reset the key expiration timer when copying keys
        if (keyExpirationTimer) {
          clearTimeout(keyExpirationTimer);
          keyExpirationTimer = setTimeout(() => {
            privateKeyStorage = {};
            console.log("Private keys cleared from memory due to timeout");
          }, 5 * 60 * 1000); // Reset to 5 minutes
        }
      } else {
        // Key has expired
        alert("For security, the private key has expired. Please regenerate keys.");
      }
    };

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
  
  // For immediate troubleshooting, read the owner key from the input field again
  // This is a fallback mechanism in case memory storage failed
  const ownerWifInput = document.getElementById("ownerWif").value.trim();
  const ownerWifFromMemory = privateKeyStorage['owner_wif'];
  
  // Use either the stored key or the input key
  const ownerWif = ownerWifFromMemory || ownerWifInput;
  
  if (!ownerWif) {
    showError("Please enter your owner private key (WIF).");
    return;
  }
  
  // Log for debugging purposes
  console.log("Owner key available: ", Boolean(ownerWif));
  console.log("From memory: ", Boolean(ownerWifFromMemory));
  console.log("From input: ", Boolean(ownerWifInput));
  
  // Reset the expiration timer when proceeding with key update
  if (keyExpirationTimer) {
    clearTimeout(keyExpirationTimer);
  }
  keyExpirationTimer = setTimeout(() => {
    privateKeyStorage = {};
    console.log("Private keys cleared from memory due to timeout");
  }, 30 * 60 * 1000); // 30 minutes
  
  // Start countdown timer for safety
  let countdown = 10;
  const updateBtn = document.getElementById("updateKeysBtn");
  const originalText = updateBtn.innerHTML;
  let countdownTimer;
  
  // Create a confirmation dialog
  const confirmationAlert = document.createElement("div");
  confirmationAlert.className = "alert alert-danger mt-3";
  confirmationAlert.innerHTML = `
    <strong><i class="fas fa-exclamation-triangle me-2"></i>WARNING:</strong>
    This action is irreversible! Your account keys will be permanently changed.
    <div class="mt-2">Please ensure you have saved your new keys before proceeding.</div>
  `;
  
  // Insert the confirmation alert before the update button
  const buttonsContainer = updateBtn.parentNode;
  buttonsContainer.insertBefore(confirmationAlert, updateBtn);
  
  // Make the button clickable but change its style to indicate caution
  updateBtn.classList.remove("btn-primary");
  updateBtn.classList.add("btn-danger");
  
  // Start the countdown
  countdownTimer = setInterval(() => {
    updateBtn.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i>Updating in ${countdown}... Click to cancel`;
    countdown--;
    
    if (countdown < 0) {
      clearInterval(countdownTimer);
      // Proceed with the update
      performKeyUpdate();
    }
  }, 1000);
  
  // Allow cancellation
  updateBtn.addEventListener("click", () => {
    clearInterval(countdownTimer);
    updateBtn.innerHTML = originalText;
    // Restore original button style
    updateBtn.classList.remove("btn-danger");
    updateBtn.classList.add("btn-primary");
    // Remove the confirmation alert
    if (confirmationAlert.parentNode) {
      confirmationAlert.parentNode.removeChild(confirmationAlert);
    }
  }, { once: true });
  
  // Function to perform the actual key update after countdown
  async function performKeyUpdate() {
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
      // Validate the owner key (redundant validation for safety)
      const ownerKey = dhive.PrivateKey.fromString(ownerWif);
      
      // If we got here, we have a valid key - for troubleshooting, try to derive public key
      const publicKey = ownerKey.createPublic().toString();
      console.log("Successfully created public key: ", publicKey.substring(0, 8) + '...');
      
      // Store the key again in memory for redundant safety
      privateKeyStorage['owner_wif'] = ownerWif;

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

        // Show success message
        if (successMessage) {
          successMessage.classList.remove("d-none");
        }

        // Clear private keys from memory for security
        privateKeyStorage = {};
        if (keyExpirationTimer) {
          clearTimeout(keyExpirationTimer);
        }
      }
    } catch (error) {
      console.error("Error updating keys:", error);

      // Remove loading indicator
      const loadingIndicator = document.getElementById("loadingIndicator");
      if (loadingIndicator) {
        loadingIndicator.remove();
      }

      // Show error message
      if (errorMessage) {
        errorMessage.classList.remove("d-none");
      }

      // Display detailed error message
      const errorDetails = document.getElementById("errorDetails");
      if (errorDetails) {
        errorDetails.textContent = error.message || "Unknown error";
      }
    }
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
  
  // Clear private key storage for security
  privateKeyStorage = {};
  if (keyExpirationTimer) {
    clearTimeout(keyExpirationTimer);
    keyExpirationTimer = null;
  }
  
  document.getElementById("accountName").value = "";
  document.getElementById("ownerWif").value = "";
  generateNewPassword(); // Generate a fresh password
  showStep(1);
}

// Initialize the node selector dropdown
function initializeNodeSelector() {
  const nodeList = document.getElementById("nodeList");
  const currentNodeText = document.getElementById("currentNodeText");
  
  // Clear existing items
  nodeList.innerHTML = "";
  
  // Add nodes to dropdown
  hiveNodes.forEach(node => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = "#";
    a.dataset.nodeUrl = node.url;
    
    // Create status indicator and node name
    a.innerHTML = `<span class="node-name">${node.name}</span> <span class="node-status ms-1"><i class="fas fa-circle"></i></span>`;
    
    // Add click event to change node
    a.addEventListener("click", function(e) {
      e.preventDefault();
      changeNode(node.url, node.name);
    });
    
    li.appendChild(a);
    nodeList.appendChild(li);
    
    // Check status of this node
    checkNodeItemStatus(node.url, a.querySelector(".node-status"));
  });
  
  // Set initial node text
  const defaultNode = hiveNodes.find(node => node.url === currentNodeUrl);
  if (defaultNode) {
    currentNodeText.textContent = defaultNode.name;
  }
}

// Change the current Hive node
function changeNode(nodeUrl, nodeName) {
  // Update UI first for immediate feedback
  const currentNodeText = document.getElementById("currentNodeText");
  currentNodeText.textContent = nodeName;
  
  // Update status indicator to "checking"
  const nodeStatus = document.getElementById("nodeStatus");
  nodeStatus.className = "node-status ms-1 checking";
  
  // Clear version info while checking
  document.getElementById("nodeVersionInfo").textContent = "Checking node status...";
  
  // Update the current node URL
  currentNodeUrl = nodeUrl;
  
  // Create a new client with the selected node
  client = new dhive.Client([nodeUrl, "https://api.syncad.com"]);
  
  // Check the status of the new node
  checkNodeStatus(nodeUrl);
}

// Check the status of a specific node in the dropdown list
async function checkNodeItemStatus(nodeUrl, statusElement) {
  try {
    // Create a temporary client for this specific node
    const tempClient = new dhive.Client([nodeUrl]);
    
    // Set status to checking
    statusElement.className = "node-status ms-1 checking";
    
    // Try to get dynamic global properties with a timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    
    await Promise.race([
      tempClient.database.getDynamicGlobalProperties(),
      timeout
    ]);
    
    // If we get here, the node is online
    statusElement.className = "node-status ms-1 online";
  } catch (error) {
    // Node is offline or timed out
    statusElement.className = "node-status ms-1 offline";
  }
}

// Check the status of the current node
async function checkNodeStatus(nodeUrl) {
  const nodeStatus = document.getElementById("nodeStatus");
  const nodeVersionInfo = document.getElementById("nodeVersionInfo");
  
  // Set status to checking
  nodeStatus.className = "node-status ms-1 checking";
  
  try {
    // Try to get dynamic global properties with a timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    
    const dgpo = await Promise.race([
      client.database.getDynamicGlobalProperties(),
      timeout
    ]);
    
    // If we get here, the node is online
    nodeStatus.className = "node-status ms-1 online";
    
    // Try to get version info
    try {
      const config = await client.database.getConfig();
      if (config && config.HIVE_BLOCKCHAIN_VERSION) {
        nodeVersionInfo.textContent = `Version: ${config.HIVE_BLOCKCHAIN_VERSION}`;
      } else {
        nodeVersionInfo.textContent = "Connected";
      }
    } catch (versionError) {
      // If we can't get version but node is online
      nodeVersionInfo.textContent = "Connected";
    }
    
    // Update all node statuses in the dropdown
    updateAllNodeStatuses();
    
    return true;
  } catch (error) {
    // Node is offline or timed out
    nodeStatus.className = "node-status ms-1 offline";
    nodeVersionInfo.textContent = "Offline or unavailable";
    
    // Try to switch to a backup node if current one is down
    if (nodeUrl === currentNodeUrl) {
      tryBackupNode();
    }
    
    return false;
  }
}

// Try to find a working backup node if current one is down
async function tryBackupNode() {
  // Skip if we're already checking a different node
  if (document.getElementById("nodeStatus").classList.contains("checking")) {
    return;
  }
  
  // Look for an alternative node
  for (const node of hiveNodes) {
    // Skip the current node that's already failing
    if (node.url === currentNodeUrl) continue;
    
    // Create a temporary client for this node
    const tempClient = new dhive.Client([node.url]);
    
    try {
      // Try to get dynamic global properties with a timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      
      await Promise.race([
        tempClient.database.getDynamicGlobalProperties(),
        timeout
      ]);
      
      // If we get here, we found a working node, switch to it
      console.log(`Switching to backup node: ${node.name}`);
      changeNode(node.url, node.name);
      return;
    } catch (error) {
      // This node didn't work, try the next one
      continue;
    }
  }
  
  // If we get here, all nodes failed
  console.error("All Hive nodes appear to be offline");
}

// Update status indicators for all nodes in the dropdown
function updateAllNodeStatuses() {
  const nodeItems = document.querySelectorAll("#nodeList .dropdown-item");
  
  nodeItems.forEach(item => {
    const nodeUrl = item.dataset.nodeUrl;
    const statusElement = item.querySelector(".node-status");
    
    // Check status of each node
    checkNodeItemStatus(nodeUrl, statusElement);
  });
}
