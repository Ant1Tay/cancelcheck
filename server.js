const express = require("express");
const { parsePolicy, VERSION } = require("./parser");

const { paymentMiddleware } = require("@x402/express");
const {
  HTTPFacilitatorClient,
  x402ResourceServer
} = require("@x402/core/server");
const { ExactEvmScheme } = require("@x402/evm/exact/server");

const app = express();

app.use(express.json());
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(
    "eip155:84532",
    new ExactEvmScheme()
  );

app.use(
  paymentMiddleware(
    {
      "POST /parse": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.001",
            network: "eip155:84532",
            payTo: "0xe9C913235AD4d81699A715Cf3e4cae4Dbb0F2D79"
          }
        ],
        description: "Parse a cancellation or refund policy into structured data."
      }
    },
    resourceServer
  )
);
app.get("/", (req, res) => {
  res.json({
    service: "CancelCheck",
    version: VERSION,
    description: "Cancellation and refund policy intelligence for AI agents.",
    endpoints: {
      health: "GET /health",
      parse: "POST /parse",
      openapi: "GET /openapi.json"
    }
  });
});

app.get("/openapi.json", (req, res) => {
  res.sendFile("openapi.json", { root: __dirname });
});

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CancelCheck",
    version: VERSION
  });
});

app.post("/parse", (req, res) => {
  try {
    const result = parsePolicy(req.body.policy_text);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `CancelCheck v${VERSION} is running at http://localhost:${PORT}`
  );
});