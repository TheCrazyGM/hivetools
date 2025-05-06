const client = new dhive.Client([
  "https://api.hive.blog",
  "https://api.syncad.com",
  "https://anyx.io",
]);

function setStatus(msg, isError = false) {
  const status = document.getElementById("status");
  status.textContent = msg;
  status.className = isError ? "error" : "success";
}

document
  .getElementById("dashboardForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const userInput = document
      .getElementById("username")
      .value.trim()
      .toLowerCase();
    if (!userInput) {
      setStatus("Please enter a username", true);
      return;
    }
    setStatus("Loading...");
    document.getElementById("portfolio").innerHTML = "";

    try {
      const accounts = await client.database.getAccounts([userInput]);
      if (!accounts || accounts.length === 0) {
        setStatus("Account not found", true);
        return;
      }
      const acct = accounts[0];

      const [gprops, price] = await Promise.all([
        client.database.getDynamicGlobalProperties(),
        client.database.getCurrentMedianHistoryPrice(),
      ]);

      const hive_bal = parseFloat(acct.balance.split(" ")[0]);
      const hbd_bal = parseFloat(acct.hbd_balance.split(" ")[0]);

      const total_vests = parseFloat(gprops.total_vesting_shares.split(" ")[0]);
      const total_hive = parseFloat(
        gprops.total_vesting_fund_hive.split(" ")[0],
      );
      const vs = parseFloat(acct.vesting_shares.split(" ")[0]);
      const dvs = parseFloat(acct.delegated_vesting_shares.split(" ")[0]);
      const rvs = parseFloat(acct.received_vesting_shares.split(" ")[0]);
      const net_vests = vs - dvs - rvs;
      const hp = (net_vests * total_hive) / total_vests;

      // Parse price: price.base and price.quote may be Asset objects or strings
      const baseStr = price.base.toString();
      const quoteStr = price.quote.toString();
      const baseVal = parseFloat(baseStr.split(" ")[0]);
      const quoteVal = parseFloat(quoteStr.split(" ")[0]);
      const price_per_hive = baseVal / quoteVal;

      const hive_usd = hive_bal * price_per_hive;
      const hbd_usd = hbd_bal;
      const hp_usd = hp * price_per_hive;

      let html = `<table>
        <thead><tr><th>Asset</th><th>Balance</th><th>USD Equivalent</th></tr></thead>
        <tbody>
          <tr><td>HIVE</td><td>${hive_bal.toFixed(3)}</td><td>${hive_usd.toFixed(3)}</td></tr>
          <tr><td>HBD</td><td>${hbd_bal.toFixed(3)}</td><td>${hbd_usd.toFixed(3)}</td></tr>
          <tr><td>Hive Power</td><td>${hp.toFixed(3)}</td><td>${hp_usd.toFixed(3)}</td></tr>
        </tbody>
      </table>`;

      const vwr = parseFloat(acct.vesting_withdraw_rate.split(" ")[0]);
      if (vwr > 0) {
        const next = new Date(acct.next_vesting_withdrawal).toLocaleString();
        const weekly_hp = (vwr * total_hive) / total_vests;
        html += `<p>Powering down: ${weekly_hp.toFixed(
          3,
        )} HP/week, next on ${next}</p>`;
      } else {
        html += `<p>No powering down in progress</p>`;
      }

      document.getElementById("portfolio").innerHTML = html;
      setStatus("Loaded successfully");
    } catch (error) {
      console.error(error);
      setStatus("Error fetching portfolio", true);
    }
  });
