const express = require("express");
const { parsePolicy, VERSION } = require("./parser");

const app = express();

app.use(express.json());

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