# CancelCheck

### Cancellation & refund policy intelligence for AI agents

Turn messy cancellation, refund, booking and no-show policies into structured, machine-readable decision data.

**Pay per request with x402. No API keys. No subscriptions. No accounts.**

[![API](https://img.shields.io/badge/API-Live-success)](https://cancelcheck.onrender.com)
[![x402](https://img.shields.io/badge/x402-Pay--per--request-blue)](https://x402.org)
[![Base](https://img.shields.io/badge/Base-Sepolia-0052FF)](https://www.base.org)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-green)](https://cancelcheck.onrender.com/openapi.json)
[![License](https://img.shields.io/badge/license-ISC-lightgrey)](LICENSE)

---

## What is CancelCheck?

AI agents increasingly make decisions on behalf of users:

- Should I cancel this hotel?
- Will I get my money back?
- When does free cancellation end?
- How much will I be charged if I cancel now?
- What happens if I don't show up?
- Is this booking still refundable?

The problem is that these answers are often buried inside inconsistent, human-written policies.

**CancelCheck turns those policies into structured data that an agent can reason with.**

```text
Raw cancellation policy
          │
          ▼
     CancelCheck
          │
          ▼
Structured policy data
          │
          ▼
   AI agent decision
```

## Why CancelCheck?

Cancellation policies are written for humans.

AI agents need something different:

- Predictable fields
- Machine-readable output
- Explicit deadlines
- Structured penalties
- Confidence information
- The original policy retained for reference

CancelCheck provides that layer between the raw policy and the agent's decision-making process.

---

## Example

### Input

```json
{
  "policy_text": "Free cancellation until 6pm on 24 September. After this time, the first night will be charged."
}
```

### Output

```json
{
  "service": "CancelCheck",
  "version": "0.4.1",
  "refundable": true,
  "free_cancellation": true,
  "deadline": {
    "date": "24 September",
    "time": "18:00",
    "hours_before": null
  },
  "late_cancellation": {
    "type": "first_night",
    "amount": null,
    "currency": null,
    "percentage": null,
    "basis": null
  },
  "no_show": {
    "type": null
  },
  "confidence": 0.8,
  "original_policy": "Free cancellation until 6pm on 24 September."
}
```

Instead of an agent having to interpret the entire policy itself, it receives structured fields it can use in its own workflow.

---

# Built for AI Agents

CancelCheck is designed as a small, specialised service that an autonomous agent can call when it encounters a cancellation or refund policy.

### Typical workflow

```text
Agent encounters booking policy
              │
              ▼
        Call CancelCheck
              │
              ▼
      Structured policy data
              │
              ▼
       Agent evaluates options
              │
              ▼
        User-facing decision
```

The agent remains responsible for the final decision.

CancelCheck provides the policy interpretation layer.

---

# x402: Pay Per Request

CancelCheck uses the **x402 HTTP payment protocol**.

There is no traditional API-key billing flow.

Instead:

```text
Agent
  │
  │ POST /parse
  ▼
CancelCheck
  │
  │ 402 Payment Required
  ▼
Agent
  │
  │ Pay automatically
  ▼
x402 Facilitator
  │
  │ Verify & settle
  ▼
CancelCheck
  │
  │ 200 OK
  ▼
Agent receives result
```

This enables a simple machine-to-machine model:

**Discover → Pay → Use**

## Current Payment Configuration

| Setting | Value |
|---|---|
| Protocol | x402 v2 |
| Network | Base Sepolia |
| Asset | USDC |
| Price | 0.001 USDC |
| Endpoint | `POST /parse` |
| Payment model | Per request |

> **Current deployment uses Base Sepolia testnet funds. These payments have no real monetary value.**

---

# Quick Start

## Endpoint

```text
POST https://cancelcheck.onrender.com/parse
```

Send a cancellation policy as JSON:

```bash
curl -X POST https://cancelcheck.onrender.com/parse \
  -H "Content-Type: application/json" \
  -d '{
    "policy_text": "Free cancellation until 6pm on 24 September."
  }'
```

Without payment, the endpoint returns:

```text
402 Payment Required
```

An x402-compatible client can use the payment requirements to complete the payment and retry the request.

---

# API Reference

## POST /parse

Analyse a cancellation, refund, booking or no-show policy.

### Request

```json
{
  "policy_text": "Free cancellation until 6pm on 24 September."
}
```

### Response

```json
{
  "service": "CancelCheck",
  "version": "0.4.1",
  "refundable": true,
  "free_cancellation": true,
  "deadline": {
    "date": "24 September",
    "time": "18:00",
    "hours_before": null
  },
  "late_cancellation": {
    "type": null,
    "amount": null,
    "currency": null,
    "percentage": null,
    "basis": null
  },
  "no_show": {
    "type": null
  },
  "confidence": 0.8,
  "original_policy": "Free cancellation until 6pm on 24 September."
}
```

### Response fields

| Field | Description |
|---|---|
| `refundable` | Whether the policy indicates that the booking is refundable |
| `free_cancellation` | Whether free cancellation is available |
| `deadline` | Extracted cancellation deadline |
| `late_cancellation` | Penalty applied after the deadline |
| `no_show` | No-show penalty information |
| `confidence` | Parser confidence from 0 to 1 |
| `original_policy` | Original policy supplied to CancelCheck |

---

## GET /health

Check service availability.

```bash
curl https://cancelcheck.onrender.com/health
```

Response:

```json
{
  "status": "ok",
  "service": "CancelCheck",
  "version": "0.4.1"
}
```

---

## GET /openapi.json

Machine-readable OpenAPI 3.1 specification:

```text
https://cancelcheck.onrender.com/openapi.json
```

The specification describes the request schema, response schema and payment requirement.

---

# Agent Discovery

CancelCheck exposes **x402 Bazaar discovery metadata** as part of its payment requirements.

The metadata describes:

- What the service does
- When an agent should use it
- The HTTP method
- Required input
- Input schema
- Output structure
- Payment requirements
- Supported network
- Payment asset
- Request price

For example, the public `402` response advertises:

```text
POST
JSON
policy_text
Base Sepolia
USDC
0.001 USDC
```

along with the structured output schema.

This allows compatible agent infrastructure to understand the service without relying solely on human-written documentation.

---

# Use Cases

CancelCheck can be used anywhere an agent needs to interpret cancellation or refund terms.

## Travel

- Hotels
- Flights
- Car rentals
- Holiday rentals
- Tours
- Activities

## Hospitality

- Restaurant reservations
- Private dining
- Venue bookings
- Events

## Events

- Tickets
- Conferences
- Workshops
- Classes

## Appointments

- Consultations
- Salons
- Professional services
- Scheduled appointments

## Commerce

- Reservations
- Deposits
- Service bookings
- Cancellation requests

---

# Example Agent Workflow

Imagine an AI travel agent receives:

```text
Hotel booking

Price: £420

Cancellation policy:

Free cancellation until 6pm on 24 September.
After this time, the first night will be charged.
```

The agent can send the policy to CancelCheck:

```text
┌─────────────────────┐
│      AI Agent       │
│                     │
│  Booking + Policy   │
└──────────┬──────────┘
           │
           │ x402 request
           ▼
┌─────────────────────┐
│    CancelCheck      │
│                     │
│  Policy extraction  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Structured result  │
│                     │
│  refundable: true   │
│  free: true         │
│  deadline: 18:00    │
│  penalty: 1 night   │
└──────────┬──────────┘
           │
           ▼
      Agent workflow
```

CancelCheck handles the policy extraction.

The agent handles the final decision.

---

# Why x402?

Traditional APIs commonly require:

```text
Sign up
   ↓
Create account
   ↓
Get API key
   ↓
Choose subscription
   ↓
Add payment method
   ↓
Make request
```

x402 enables a different model:

```text
Discover service
   ↓
Make request
   ↓
Receive payment requirement
   ↓
Pay automatically
   ↓
Receive result
```

For autonomous software, this makes specialised services easier to consume programmatically.

---

# Local Development

Clone the repository:

```bash
git clone https://github.com/Ant1Tay/cancelcheck.git
cd cancelcheck
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The API will be available at:

```text
http://localhost:3000
```

Check the service:

```bash
curl http://localhost:3000/health
```

---

# Testing

The repository includes a paid-request test client.

The test flow demonstrates:

```text
POST /parse
      │
      ▼
     402
      │
      ▼
x402 payment
      │
      ▼
 retry request
      │
      ▼
     200
```

The current test environment uses:

- Base Sepolia
- Testnet ETH
- Testnet USDC
- x402 automatic payment handling

Private test credentials should remain in local environment files and must never be committed to Git.

---

# Architecture

```text
                    AI Agent
                       │
                       │ HTTP
                       ▼
              ┌─────────────────┐
              │   CancelCheck   │
              │                 │
              │   POST /parse   │
              │   GET /health   │
              │   GET /openapi  │
              └───────┬─────────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
      ┌─────────────┐   ┌──────────────┐
      │   Parser    │   │ x402 Payment │
      │             │   │  Middleware  │
      └─────────────┘   └──────┬───────┘
                               │
                               ▼
                       ┌──────────────┐
                       │ Facilitator  │
                       └──────────────┘
```

---

# Current Status

## v0.4.1

- [x] Cancellation policy parser
- [x] Structured JSON output
- [x] Refundability detection
- [x] Cancellation deadline extraction
- [x] Late-cancellation information
- [x] No-show information
- [x] Confidence score
- [x] REST API
- [x] OpenAPI 3.1
- [x] x402 v2 payment protection
- [x] Base Sepolia support
- [x] USDC payments
- [x] Automatic paid-request testing
- [x] Bazaar discovery metadata
- [x] HTTPS production deployment
- [x] Public 402 payment flow verified
- [x] Public paid request verified

---

# Roadmap

## Policy intelligence

- [ ] More cancellation-policy patterns
- [ ] Improved date and time normalisation
- [ ] Currency-aware penalties
- [ ] Multi-stage cancellation policies
- [ ] More sophisticated no-show rules
- [ ] Improved confidence handling

## Agent integrations

- [ ] MCP interface
- [ ] Agent framework examples
- [ ] SDKs
- [ ] Additional integration examples

## Discovery

- [ ] Expanded agent discovery integrations
- [ ] Additional machine-readable metadata
- [ ] Wider ecosystem integrations

## Payments

- [ ] Production payment configuration
- [ ] Mainnet deployment
- [ ] Additional networks/assets

---

# Important

CancelCheck extracts structured information from policy text.

It is intended as **decision-support infrastructure**, not as a legal determination or guarantee that a merchant will honour a particular interpretation.

Agents should retain the original policy text and consider the structured result alongside the source policy.

The `confidence` field represents parser confidence and is not a guarantee of correctness.

---

# Contributing

Issues, improvements and policy examples are welcome.

If you find a cancellation-policy pattern that CancelCheck handles incorrectly, please open an issue including:

1. The relevant policy text
2. The current CancelCheck output
3. The expected output

Please remove personal information, booking references and other sensitive information before submitting examples.

---

# License

ISC

---

## CancelCheck

**Make cancellation policies machine-readable.**

Built as a specialised policy-intelligence service for autonomous AI agents.

```text
Understand the policy.
Structure the decision.
Pay per request.
```
