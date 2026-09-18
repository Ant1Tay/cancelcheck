const express = require("express");

const app = express();
app.use(express.json());

const PORT = 3000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CancelCheck",
    version: "0.2.0"
  });
});

app.post("/parse", (req, res) => {
  const { policy_text } = req.body;

  if (!policy_text || typeof policy_text !== "string") {
    return res.status(400).json({
      error: "policy_text is required"
    });
  }

  const text = policy_text.toLowerCase();

  let refundable = null;
  let freeCancellation = null;
  let cancellationType = null;
  let cancellationAmount = null;
  let cancellationPercentage = null;
  let deadlineDate = null;
  let deadlineTime = null;
  let deadlineHoursBefore = null;
  let noShowType = null;

  // -------------------------
  // Refundability
  // -------------------------

  if (
    text.includes("non-refundable") ||
    text.includes("non refundable")
  ) {
    refundable = false;
    freeCancellation = false;
  }

  if (text.includes("free cancellation")) {
    refundable = true;
    freeCancellation = true;
  }

  // -------------------------
  // Deadline: hours before
  // -------------------------

  const hoursMatch = text.match(
    /(\d+)\s*hours?\s+before/
  );

  if (hoursMatch) {
    deadlineHoursBefore = Number(hoursMatch[1]);
  }

  // -------------------------
  // Deadline: date
  // -------------------------

  const dateMatch = policy_text.match(
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i
  );

  if (dateMatch) {
    deadlineDate = `${dateMatch[1]} ${dateMatch[2]}`;
  }

  // -------------------------
  // Deadline: time
  // -------------------------

  const timeMatch = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/
  );

  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minutes = timeMatch[2] || "00";
    const period = timeMatch[3];

    if (period === "pm" && hour !== 12) {
      hour += 12;
    }

    if (period === "am" && hour === 12) {
      hour = 0;
    }

    deadlineTime =
      `${String(hour).padStart(2, "0")}:${minutes}`;
  }

  // -------------------------
  // Cancellation charge
  // -------------------------

  if (
    text.includes("first night") ||
    text.includes("first night's")
  ) {
    cancellationType = "first_night";
  }

  const percentageMatch = text.match(/(\d+)\s*%/);

  if (percentageMatch) {
    cancellationType = "percentage";
    cancellationPercentage = Number(percentageMatch[1]);
  }

  const moneyMatch = policy_text.match(
    /[£$€]\s?(\d+(?:\.\d{1,2})?)/
  );

  if (moneyMatch) {
    cancellationType = "fixed_amount";
    cancellationAmount = Number(moneyMatch[1]);
  }

  // -------------------------
  // No-show
  // -------------------------

  if (
    text.includes("no-show") ||
    text.includes("no show") ||
    text.includes("no-shows")
  ) {
    if (
      text.includes("full booking") ||
      text.includes("full reservation") ||
      text.includes("full amount")
    ) {
      noShowType = "full_booking";
    } else {
      noShowType = "mentioned";
    }
  }

  // -------------------------
  // Confidence
  // -------------------------

  let confidence = 0.5;

  if (refundable !== null) confidence += 0.1;
  if (deadlineDate) confidence += 0.1;
  if (deadlineTime) confidence += 0.1;
  if (deadlineHoursBefore) confidence += 0.1;
  if (cancellationType) confidence += 0.1;

  confidence = Math.min(confidence, 0.95);

  res.json({
    service: "CancelCheck",
    version: "0.2.0",

    refundable,
    free_cancellation: freeCancellation,

    deadline: {
      date: deadlineDate,
      time: deadlineTime,
      hours_before: deadlineHoursBefore
    },

    late_cancellation: {
      type: cancellationType,
      amount: cancellationAmount,
      percentage: cancellationPercentage
    },

    no_show: {
      type: noShowType
    },

    confidence,

    original_policy: policy_text
  });
});

app.listen(PORT, () => {
  console.log(
    `CancelCheck v0.2 is running at http://localhost:${PORT}`
  );
});