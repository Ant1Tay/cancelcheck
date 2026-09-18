const { parsePolicy } = require("./parser");

const tests = [
  {
    name: "7 days prior",
    policy:
      "Cancellation is permitted up to 7 days prior to arrival.",
    expected: {
      hours_before: 168
    }
  },
  {
    name: "Full refund deadline",
    policy:
      "Cancel before 11:59pm on 30 September for a full refund.",
    expected: {
      refundable: true,
      date: "30 September",
      time: "23:59"
    }
  },
  {
    name: "£100 within 72 hours",
    policy:
      "Cancellations within 72 hours of check-in will be charged £100.",
    expected: {
      hours_before: 72,
      type: "fixed_amount",
      amount: 100,
      currency: "GBP"
    }
  },
  {
    name: "€35 per room",
    policy:
      "A cancellation fee of €35 per room applies after 2pm.",
    expected: {
      type: "fixed_amount",
      amount: 35,
      currency: "EUR",
      basis: "per_room"
    }
  },
  {
    name: "100% first night",
    policy:
      "Reservations cancelled less than 2 days before arrival will be charged 100% of the first night.",
    expected: {
      hours_before: 48,
      type: "first_night",
      percentage: 100
    }
  },
  {
    name: "No refunds",
    policy:
      "No refunds will be provided after booking.",
    expected: {
      refundable: false
    }
  },
  {
    name: "Without penalty",
    policy:
      "You may cancel without penalty until 4:30 PM on 21 December.",
    expected: {
      refundable: true,
      date: "21 December",
      time: "16:30"
    }
  },
  {
    name: "Failure to arrive",
    policy:
      "Failure to arrive will result in the total reservation value being charged.",
    expected: {
      no_show: "full_booking"
    }
  }
];

function check(result, expected) {
  const actual = {
    refundable: result.refundable,
    hours_before: result.deadline.hours_before,
    date: result.deadline.date,
    time: result.deadline.time,
    type: result.late_cancellation.type,
    amount: result.late_cancellation.amount,
    currency: result.late_cancellation.currency,
    percentage: result.late_cancellation.percentage,
    basis: result.late_cancellation.basis,
    no_show: result.no_show.type
  };

  const failures = [];

  for (const [key, expectedValue] of Object.entries(expected)) {
    if (actual[key] !== expectedValue) {
      failures.push(
        `${key}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actual[key])}`
      );
    }
  }

  return failures;
}

console.log("\nCancelCheck v0.4 Hard Tests\n");

let passed = 0;

for (const test of tests) {
  const result = parsePolicy(test.policy);
  const failures = check(result, test.expected);

  if (failures.length === 0) {
    console.log(`PASS  ${test.name}`);
    passed++;
  } else {
    console.log(`FAIL  ${test.name}`);

    for (const failure of failures) {
      console.log(`      ${failure}`);
    }
  }
}

console.log("\n----------------------------");
console.log(`${passed}/${tests.length} hard tests passed`);
console.log("----------------------------\n");