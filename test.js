const tests = [
  {
    name: "Hotel - first night",
    policy_text:
      "Free cancellation until 6pm on 24 September. After this time, the first night will be charged."
  },
  {
    name: "Non-refundable booking",
    policy_text:
      "This reservation is non-refundable and cannot be cancelled or modified."
  },
  {
    name: "48 hour cancellation",
    policy_text:
      "Guests may cancel free of charge up to 48 hours before arrival."
  },
  {
    name: "Percentage charge",
    policy_text:
      "Free cancellation until 12 October. Cancellations after this date will incur a charge of 50% of the total booking."
  },
  {
    name: "Restaurant cancellation",
    policy_text:
      "Cancellations made less than 24 hours before the reservation will incur a £25 charge per guest."
  },
  {
    name: "No-show",
    policy_text:
      "Free cancellation until 8pm on 15 November. No-shows will be charged the full reservation amount."
  }
];

async function runTests() {
  console.log("\nCancelCheck Test Suite\n");

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

      console.log("================================");
      console.log(test.name);
      console.log("--------------------------------");
      console.log(JSON.stringify(result, null, 2));
      console.log();
    } catch (error) {
      console.error(`${test.name} FAILED`);
      console.error(error.message);
    }
  }
}

runTests();