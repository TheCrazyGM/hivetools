// Toast function using SweetAlert
function showToast(message, type) {
  Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    icon: type,
    text: message,
  });
}

// Initialize dhive client
const client = new dhive.Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
  "https://api.deathwing.me",
]);

// Function to convert HP to VESTS
async function getVestFromHP(hp) {
  try {
    const globalProps = await client.database.getDynamicGlobalProperties();
    const totalVests = parseFloat(
      globalProps.total_vesting_shares.split(" ")[0],
    );
    const totalHP = parseFloat(
      globalProps.total_vesting_fund_hive.split(" ")[0],
    );

    // Convert HP to VESTS
    const vests = (hp * totalVests) / totalHP;
    return vests.toFixed(6);
  } catch (error) {
    console.error("Error converting HP to VESTS:", error);
    return null;
  }
}

// Convert VESTS to HP
async function getHPFromVests(vests) {
  try {
    const globalProps = await client.database.getDynamicGlobalProperties();
    const totalVests = parseFloat(
      globalProps.total_vesting_shares.split(" ")[0],
    );
    const totalHP = parseFloat(
      globalProps.total_vesting_fund_hive.split(" ")[0],
    );

    // Convert VESTS to HP
    const hp = (vests * totalHP) / totalVests;
    return hp.toFixed(3);
  } catch (error) {
    console.error("Error converting VESTS to HP:", error);
    return null;
  }
}

// Format HP value to 3 decimal places
function formatHP(value) {
  return parseFloat(value).toFixed(3);
}

// Format date to local string
function formatDate(date) {
  return new Date(date).toLocaleString();
}

// Load and display delegations for an account
async function loadDelegations(account) {
  try {
    // Ensure account is lowercase
    account = account.toLowerCase();

    const delegations = await client.database.call("get_vesting_delegations", [
      account,
      "",
      100,
    ]);
    const tbody = document.querySelector("#delegationsTable tbody");
    tbody.innerHTML = ""; // Clear existing rows

    if (delegations.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.className = "text-center";
      cell.textContent = "No active delegations found";
      return;
    }

    for (const delegation of delegations) {
      const hp = await getHPFromVests(
        parseFloat(delegation.vesting_shares.split(" ")[0]),
      );
      if (!hp) continue;

      const row = tbody.insertRow();
      row.innerHTML = `
            <td>@${delegation.delegatee}</td>
            <td>${hp} HP</td>
            <td>${formatDate(delegation.min_delegation_time)}</td>
            <td>
              <button class="btn btn-sm btn-warning modify-delegation" data-account="${delegation.delegatee}">
                <i class="bi bi-pencil"></i> Modify
              </button>
              <button class="btn btn-sm btn-danger remove-delegation" data-account="${delegation.delegatee}">
                <i class="bi bi-x-circle"></i> Remove
              </button>
            </td>
          `;
    }

    // Add event listeners to the new buttons
    document.querySelectorAll(".modify-delegation").forEach((button) => {
      button.addEventListener("click", (e) => {
        const account = e.target.closest("button").dataset.account;
        document.getElementById("toAccount").value = account;
        document.getElementById("hpAmount").focus();
      });
    });

    document.querySelectorAll(".remove-delegation").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const account = e.target.closest("button").dataset.account;
        document.getElementById("toAccount").value = account;
        document.getElementById("hpAmount").value = "0";
        document
          .getElementById("delegationForm")
          .dispatchEvent(new Event("submit"));
      });
    });
  } catch (error) {
    console.error("Error loading delegations:", error);
    const tbody = document.querySelector("#delegationsTable tbody");
    tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-danger">
              Error loading delegations. Please try again later.
            </td>
          </tr>
        `;
    showToast("Error loading delegations. Please try again later.", "error");
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Debounced version of loadDelegations
const debouncedLoadDelegations = debounce(async (account) => {
  // Trim whitespace and convert to lowercase
  account = account.trim().toLowerCase();
  if (account && account.length >= 3) {
    await loadDelegations(account);
  }
}, 1000); // Increased from 500ms to 1000ms to give more typing time

// Event listener for HP input to show VESTS equivalent
document.getElementById("hpAmount").addEventListener("input", async (e) => {
  const hp = parseFloat(e.target.value || 0);
  const vestResult = document.getElementById("vestResult");

  if (hp > 0) {
    const vests = await getVestFromHP(hp);
    vestResult.textContent = vests
      ? `Equivalent VESTS: ${vests}`
      : "Unable to convert";
    if (!vests) {
      showToast("Error calculating VESTS equivalent.", "error");
    }
  } else {
    vestResult.textContent = "";
  }
});

// Event listener for from account input
document.getElementById("fromAccount").addEventListener("input", (e) => {
  // Don't trim the input value yet to preserve cursor position
  const account = e.target.value.toLowerCase();
  debouncedLoadDelegations(account);
});

// Trim whitespace when the field loses focus
document.getElementById("fromAccount").addEventListener("blur", (e) => {
  e.target.value = e.target.value.trim().toLowerCase();
});

// Form submission handler
document
  .getElementById("delegationForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromAccount = document
      .getElementById("fromAccount")
      .value.trim()
      .toLowerCase();
    const toAccount = document
      .getElementById("toAccount")
      .value.trim()
      .toLowerCase();
    const hpAmount = parseFloat(document.getElementById("hpAmount").value);

    if (!window.hive_keychain) {
      showToast("Hive Keychain is not installed", "error");
      return;
    }

    if (isNaN(hpAmount) || hpAmount < 0) {
      showToast("Please enter a valid HP amount", "error");
      return;
    }

    try {
      const formattedHP = formatHP(hpAmount);
      const vests = await getVestFromHP(formattedHP);
      const effectiveFromAccount = fromAccount || null; // Use null if fromAccount is empty
      if (!vests) throw new Error("Failed to convert HP to VESTS");

      window.hive_keychain.requestDelegation(
        effectiveFromAccount,
        toAccount,
        formattedHP,
        "HP",
        async (response) => {
          if (response.success) {
            showToast("Delegation successful!", "success");
            document.getElementById("delegationForm").reset();
            document.getElementById("vestResult").textContent = "";
            // Reload delegations after successful delegation
            await loadDelegations(fromAccount);
          } else {
            showToast(`Error: ${response.message}`, "error");
          }
        },
      );
    } catch (error) {
      showToast(`Error: ${error.message}`, "error");
    }
  });
