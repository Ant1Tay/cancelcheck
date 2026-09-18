const VERSION = "0.4.1";

function parsePolicy(policyText) {
  if (!policyText || typeof policyText !== "string") {
    throw new Error("policy_text is required");
  }

  const text = policyText.toLowerCase();

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

  const nonRefundableLanguage =
    text.includes("non-refundable") ||
    text.includes("non refundable") ||
    text.includes("no refunds") ||
    text.includes("no refund");

  const freeCancellationLanguage =
    text.includes("free cancellation") ||
    text.includes("cancel free of charge") ||
    text.includes("cancelled free of charge") ||
    text.includes("canceled free of charge") ||
    text.includes("cancel without charge") ||
    text.includes("cancel without penalty") ||
    text.includes("full refund");

  if (nonRefundableLanguage) {
    refundable = false;
    freeCancellation = false;
  } else if (freeCancellationLanguage) {
    refundable = true;
    freeCancellation = true;
  }

  // --------------------------------
  // RELATIVE DEADLINES
  // --------------------------------

  const hoursMatch = text.match(
    /(\d+)\s*hours?\s+(?:prior to|before)/
  );

  const withinHoursMatch = text.match(
    /within\s+(\d+)\s*hours?/
  );

  if (hoursMatch) {
    deadlineHoursBefore = Number(hoursMatch[1]);
  } else if (withinHoursMatch) {
    deadlineHoursBefore = Number(withinHoursMatch[1]);
  }

  const daysMatch = text.match(
    /(\d+)\s*days?\s+(?:prior to|before)/
  );

  const withinDaysMatch = text.match(
    /within\s+(\d+)\s*days?/
  );

  if (deadlineHoursBefore === null) {
    if (daysMatch) {
      deadlineHoursBefore = Number(daysMatch[1]) * 24;
    } else if (withinDaysMatch) {
      deadlineHoursBefore = Number(withinDaysMatch[1]) * 24;
    }
  }

  // --------------------------------
  // DATE
  // --------------------------------

  const dateMatch = policyText.match(
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
  // CHARGES
  // --------------------------------

  const firstNightLanguage =
    text.includes("first night") ||
    text.includes("first night's");

  const percentageMatch = text.match(
    /(\d+(?:\.\d+)?)\s*%/
  );

  if (percentageMatch) {
    cancellationPercentage = Number(percentageMatch[1]);
  }

  /*
    First-night wording is more specific than a generic
    percentage. Example: "100% of the first night".
  */
  if (firstNightLanguage) {
    cancellationType = "first_night";
  } else if (percentageMatch) {
    cancellationType = "percentage";
  }

  const moneyMatch = policyText.match(
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

  // --------------------------------
  // CHARGE BASIS
  // --------------------------------

  if (
    text.includes("per guest") ||
    text.includes("per person")
  ) {
    cancellationBasis = "per_guest";
  } else if (text.includes("per room")) {
    cancellationBasis = "per_room";
  } else if (
    text.includes("per booking") ||
    text.includes("per reservation")
  ) {
    cancellationBasis = "per_booking";
  }

  // --------------------------------
  // NO-SHOW
  // --------------------------------

  const mentionsNoShow =
    text.includes("no-show") ||
    text.includes("no show") ||
    text.includes("no-shows") ||
    text.includes("no shows");

  const failureToArrive =
    text.includes("failure to arrive") ||
    text.includes("fail to arrive") ||
    text.includes("fails to arrive");

  if (mentionsNoShow || failureToArrive) {
    if (
      text.includes("full booking") ||
      text.includes("full reservation") ||
      text.includes("full amount") ||
      text.includes("total reservation") ||
      text.includes("total booking") ||
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

  return {
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
    original_policy: policyText
  };
}

module.exports = {
  parsePolicy,
  VERSION
};