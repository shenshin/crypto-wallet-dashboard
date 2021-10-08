import blockchains from './blockchains.js';
import quoteCurrencies from './quoteCurrencies.js';

// Fix 3: Set your API key here
const APIKEY = 'ckey_2adc0169d97446d18d38e5d87d2';
const endpoint = 'balances_v2';

function showError(message = '') {
  const errorAlert = document.getElementById('error');
  errorAlert.style.display = message ? 'block' : 'none';
  errorAlert.innerHTML = message;
}
function showLoading(isVisible = true) {
  document.getElementById('loading').style.display = isVisible
    ? 'block'
    : 'none';
}
function showTokenData(isVisible = true) {
  document.getElementById('info').style.display = isVisible ? 'block' : 'none';
}
function populateSelect(name, options) {
  const select = document.getElementById(name);
  options.forEach((obj, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.text = obj.name;
    select.appendChild(option);
  });
  return select;
}

async function getTokenData() {
  try {
    showError(''); // hide error message
    showLoading(true); // show loading
    showTokenData(false); // hide metadata and balances

    // Fix 5: Use the RSK Testnet chainID as the default
    const chainIndex = Number(document.getElementById('chain').value) || 0;
    const chainId = blockchains[chainIndex].id;
    // Fix 4: Use your RSK wallet address for the default input value
    const address =
      document.getElementById('address').value ||
      blockchains[chainIndex].wallet;
    const quoteCurrIndex = Number(document.getElementById('quote').value || 0);
    const quoteCurr = quoteCurrencies[quoteCurrIndex].name;

    // Fix 6: Use the Covalent API Reference Docs to figure out what
    // endpoint is to be used in place of #code

    const url = new URL(
      `https://api.covalenthq.com/v1/${chainId}/address/${address}/${endpoint}/?key=${APIKEY}&quote-currency=${quoteCurr}`,
    );

    // Use Fetch API to get Covalent data
    const resp = await fetch(url);
    const data = await resp.json();
    const tokens = data?.data?.items;
    if (!tokens) throw new Error("The wallet doesn't exist");

    // Update wallet metadata
    document.getElementById('metadata').innerHTML = `
      <li> Wallet address: ${data.data.address} </li>
      <li> Last update: ${data.data.updated_at} </li>
      <li> Fiat currency: ${data.data.quote_currency} </li>
    `;
    // draw table with token balances
    const table = document.getElementById('tokenTable');
    const tokenTableBody = table.getElementsByTagName('tbody')[0];
    tokenTableBody.innerHTML = '';
    const quoteCurrSymbol = quoteCurrencies[quoteCurrIndex].symbol;
    // Map through the results and for each run the code below
    tokens.map(async (token) => {
      const balance =
        token.contract_decimals > 0
          ? parseInt(token.balance, 10) / 10 ** token.contract_decimals
          : parseInt(token.balance, 10);

      tokenTableBody.insertRow().innerHTML = `
        <td><img src=${token.logo_url} class="token-icon" /></td>
        <td> ${token.contract_address} </td>
        <td> ${token.contract_ticker_symbol} </td>
        <td> ${balance.toFixed(4)} </td>
        <td> ${quoteCurrSymbol}${parseFloat(token.quote).toFixed(2)} </td>
        <td> ${token.type} </td>
      `;
    });
    const totalFiat = tokens
      .reduce((p, c) => p + parseFloat(c.quote), 0.0)
      .toFixed(2);
    table.getElementsByTagName('tfoot')[0].innerHTML = `
      <td></td>
      <td colspan="3"><strong>Total fiat balance, ${quoteCurr}:</strong></td>
      <td colspan="2"><strong>${quoteCurrSymbol}${totalFiat}</strong></td>
    `;
    showTokenData(true);
  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const addressInput = document.getElementById('address');
  addressInput.value = blockchains[0].wallet;
  // add click listener to the 'get wallet balance' button
  document
    .getElementById('get-balance')
    .addEventListener('click', getTokenData);

  // add options to  selectors
  populateSelect('chain', blockchains).addEventListener('change', (e) => {
    addressInput.value = blockchains[Number(e.target.value)].wallet;
    getTokenData();
  });

  populateSelect('quote', quoteCurrencies).addEventListener(
    'change',
    getTokenData,
  );
});
