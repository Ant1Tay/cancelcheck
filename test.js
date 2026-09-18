const tests = [
  {
    name: "Hotel - first night",
    policy_text:
      "Free cancellation until 6pm on 24 September. After this time, the first night will be charged.",
    expected: {
      refundable: true,
      free_cancellation: true,
      "deadline.date": "24 September",
      "deadline.time": "18:00",
      "late_cancellation.type": "first_night"
    }
  },
  {
    name: "Non-refundable booking",
    policy_text:
      "This reservation is non-refundable and cannot be cancelled or modified.",
    expected: {
      refundable: false,
      free_cancellation: false
    }
  },
  {
    name: "48-hour cancellation",
    policy_text:
      "Guests may cancel free of charge up to 48 hours before arrival.",
    expected: {
      refundable: true,
      free_cancellation: true,
      "deadline.hours_before": 48
    }
  },
  {
    name: "Percentage charge",
    policy_text:
      "Free cancellation until 12 October. Cancellations after this date will incur a charge of 50% of the total booking.",
    expected: {
      refundable: true,
      "deadline.date": "12 October",
      "late_cancellation.type": "percentage",
      "late_cancellation.percentage": 50
    }
  },
  {
    name: "Restaurant £25 per guest",
    policy_text:
      "Cancellations made less than 24 hours before the reservation will incur a £25 charge per guest.",
    expected: {
      "deadline.hours_before": 24,
      "late_cancellation.type": "fixed_amount",
      "late_cancellation.amount": 25,
      "late_cancellation.currency": "GBP",
      "late_cancellation.basis": "per_guest"
    }
  },
  {
    name: "No-show",
    policy_text:
      "Free cancellation until 8pm on 15 November. No-shows will be charged the full reservation amount.",
    expected: {
      refundable: true,
      "deadline.date": "15 November",
      "deadline.time": "20:00",
      "no_show.type": "full_booking"
    }
  }
];

function getValue(object, path) {
  return path.split(".").reduce((value, key) => {
    return value?.[key];
  }, object);
}

async function runTests() {
  console.log("\nCancelCheck v0.3 Tests\n");

  let passed = 0;

  for (const test of tests) {
    try {
      const response = await fetch("http://localhost:3000/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          policy_text: test.policy_text
        })
      });

      const result = await response.json();

      const failures = [];

      for (const [path, expectedValue] of Object.entries(test.expected)) {
        const actualValue = getValue(result, path);

        if (actualValue !== expectedValue) {
          failures.push(
            `${path}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`
          );
        }
      }

      if (failures.length === 0) {
        console.log(`PASS  ${test.name}`);
        passed++;
      } else {
        console.log(`FAIL  ${test.name}`);

        for (const failure of failures) {
          console.log(`      ${failure}`);
        }
      }
    } catch (error) {
      console.log(`FAIL  ${test.name}`);
      console.log(`      ${error.message}`);
    }
  }

  console.log("\n----------------------------");
  console.log(`${passed}/${tests.length} tests passed`);
  console.log("----------------------------\n");

  if (passed !== tests.length) {
    process.exitCode = 1;
  }
}

runTests();