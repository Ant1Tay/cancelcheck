const { x402Client } = require("@x402/core/client");
const { registerExactEvmScheme } = require("@x402/evm/exact/client");
const { wrapFetchWithPayment } = require("@x402/fetch");
const { privateKeyToAccount } = require("viem/accounts");

async function main() {
  const privateKey = process.env.TEST_PAYER_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("TEST_PAYER_PRIVATE_KEY is missing");
  }

  const account = privateKeyToAccount(privateKey);

  console.log("Test buyer:", account.address);
  console.log("Calling CancelCheck...");

  const client = new x402Client();

  registerExactEvmScheme(client, {
    signer: account,
    networks: ["eip155:84532"]
  });

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const response = await fetchWithPayment(
   "https://cancelcheck.onrender.com/parse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        policy_text:
          "Free cancellation until 6pm on 24 September."
      })
    }
  );

  console.log("Final status:", response.status);

  const body = await response.text();
  console.log("Response:");
  console.log(body);
}

main().catch((error) => {
  console.error("PAYMENT TEST FAILED");
  console.error(error);
  process.exit(1);
});