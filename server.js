const express = require("express");
const { parsePolicy, VERSION } = require("./parser");

const { paymentMiddleware } = require("@x402/express");
const { x402ResourceServer } = require("@x402/core/server");
const { ExactEvmScheme } = require("@x402/evm/exact/server");

const {
  createCdpFacilitatorClient
} = require("@coinbase/cdp-sdk/x402");

const {
  bazaarResourceServerExtension,
  declareDiscoveryExtension
} = require("@x402/extensions/bazaar");

const app = express();

app.set("trust proxy", 1);
app.use(express.json());

const X402_NETWORK =
  process.env.X402_NETWORK || "eip155:8453";

const X402_PRICE =
  process.env.X402_PRICE || "$0.001";

const X402_PAY_TO =
  process.env.X402_PAY_TO ||
  "0xe9C913235AD4d81699A715Cf3e4cae4Dbb0F2D79";

// CDP authenticated facilitator.
// Reads CDP_API_KEY_ID and CDP_API_KEY_SECRET
// automatically from environment variables.
const facilitatorClient = createCdpFacilitatorClient();

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(
    X402_NETWORK,
    new ExactEvmScheme()
  )
  .registerExtension(
    bazaarResourceServerExtension
  );

app.use(
  paymentMiddleware(
    {
      "POST /parse": {
        accepts: [
          {
            scheme: "exact",
            price: X402_PRICE,
            network: X402_NETWORK,
            payTo: X402_PAY_TO
          }
        ],

        description:
          "Turn cancellation, refund, booking and no-show policies into structured decision data for AI agents.",

        extensions: {
          ...declareDiscoveryExtension({
            bodyType: "json",

            input: {
              policy_text:
                "Free cancellation until 6pm on 24 September. After this time, the first night will be charged."
            },

            inputSchema: {
              type: "object",
              properties: {
                policy_text: {
                  type: "string",
                  description:
                    "Cancellation, refund, booking, or no-show policy text to analyse."
                }
              },
              required: ["policy_text"]
            },

            output: {
              example: {
                service: "CancelCheck",
                version: VERSION,
                refundable: true,
                free_cancellation: true,

                deadline: {
                  date: "24 September",
                  time: "18:00",
                  hours_before: null
                },

                late_cancellation: {
                  type: "first_night",
                  amount: null,
                  currency: null,
                  percentage: null,
                  basis: null
                },

                no_show: {
                  type: null
                },

                confidence: 0.9,

                original_policy:
                  "Free cancellation until 6pm on 24 September. After this time, the first night will be charged."
              }
            }
          })
        }
      }
    },
    resourceServer
  )
);

app.get("/", (req, res) => {
  res.json({
    service: "CancelCheck",
    version: VERSION,
    description:
      "Cancellation and refund policy intelligence for AI agents.",
    endpoints: {
      health: "GET /health",
      parse: "POST /parse",
      openapi: "GET /openapi.json"
    }
  });
});

app.get("/openapi.json", (req, res) => {
  res.sendFile("openapi.json", {
    root: __dirname
  });
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