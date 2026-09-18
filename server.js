const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERSION = "0.3.0";

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CancelCheck",
    version: VERSION
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

  let deadlineDate = null;
  let deadlineTime = null;
  let deadlineHoursBefore = null;

  let cancellationType = null;
  let cancellationAmount = null;
  let cancellationCurrency = null;
  let cancellationPercentage = null;
  let cancellationBasis = null;

  let noShowType = null;

  // --------------------------------
  // REFUNDABILITY
  // --------------------------------

  const nonRefundable =
    text.includes("non-refundable") ||
    text.includes("non refundable");

  const freeCancellationLanguage =
    text.includes("free cancellation") ||
    text.includes("cancel free of charge") ||
    text.includes("cancelled free of charge") ||
    text.includes("canceled free of charge") ||
    text.includes("cancel without charge") ||
    text.includes("cancel without penalty");

  if (nonRefundable) {
    refundable = false;
    freeCancellation = false;
  } else if (freeCancellationLanguage) {
    refundable = true;
    freeCancellation = true;
  }

  // --------------------------------
  // RELATIVE DEADLINE
  // --------------------------------

  const hoursMatch = text.match(
    /(\d+)\s*hours?\s+(?:prior to|before)/
  );

  if (hoursMatch) {
    deadlineHoursBefore = Number(hoursMatch[1]);
  }

  const daysMatch = text.match(
    /(\d+)\s*days?\s+(?:prior to|before)/
  );

  if (daysMatch && deadlineHoursBefore === null) {
    deadlineHoursBefore = Number(daysMatch[1]) * 24;
  }

  // --------------------------------
  // DATE
  // --------------------------------

  const dateMatch = policy_text.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i
  );

  if (dateMatch) {
    deadlineDate = `${dateMatch[1]} ${dateMatch[2]}`;
  }

  // --------------------------------
  // TIME
  // --------------------------------

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

  // --------------------------------
  // LATE CANCELLATION CHARGE
  // --------------------------------

  if (
    text.includes("first night") ||
    text.includes("first night's")
  ) {
    cancellationType = "first_night";
  }

  const percentageMatch = text.match(
    /(\d+(?:\.\d+)?)\s*%/
  );

  if (percentageMatch) {
    cancellationType = "percentage";
    cancellationPercentage = Number(percentageMatch[1]);
  }

  const moneyMatch = policy_text.match(
    /(£|\$|€)\s?(\d+(?:\.\d{1,2})?)/
  );

  if (moneyMatch) {
    cancellationType = "fixed_amount";
    cancellationAmount = Number(moneyMatch[2]);

    const symbol = moneyMatch[1];

    if (symbol === "£") cancellationCurrency = "GBP";
    if (symbol === "$") cancellationCurrency = "USD";
    if (symbol === "€") cancellationCurrency = "EUR";
  }

  if (
    text.includes("per guest") ||
    text.includes("per person")
  ) {
    cancellationBasis = "per_guest";
  } else if (
    text.includes("per room")
  ) {
    cancellationBasis = "per_room";
  } else if (
    text.includes("per booking") ||
    text.includes("per reservation")
  ) {
    cancellationBasis = "per_booking";
  }

  // --------------------------------
  // NO SHOW
  // --------------------------------

  const mentionsNoShow =
    text.includes("no-show") ||
    text.includes("no show") ||
    text.includes("no-shows") ||
    text.includes("no shows");

  if (mentionsNoShow) {
    if (
      text.includes("full booking") ||
      text.includes("full reservation") ||
      text.includes("full amount") ||
      text.includes("100%")
    ) {
      noShowType = "full_booking";
    } else {
      noShowType = "mentioned";
    }
  }

  // --------------------------------
  // CONFIDENCE
  // --------------------------------

  let confidence = 0.5;

  if (refundable !== null) confidence += 0.1;
  if (deadlineDate) confidence += 0.1;
  if (deadlineTime) confidence += 0.1;
  if (deadlineHoursBefore !== null) confidence += 0.1;
  if (cancellationType) confidence += 0.1;

  confidence = Math.min(confidence, 0.95);
  confidence = Math.round(confidence * 100) / 100;

  // --------------------------------
  // RESPONSE
  // --------------------------------

  res.json({
    service: "CancelCheck",
    version: VERSION,

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
      currency: cancellationCurrency,
      percentage: cancellationPercentage,
      basis: cancellationBasis
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
    `CancelCheck v${VERSION} is running at http://localhost:${PORT}`
  );
});