# 🚀 FinAI

> AI-powered financial operating system focused on natural-language expense ingestion, hybrid AI parsing, and behavioral financial insights.

---

# 📖 Overview

<img width="1774" height="887" alt="introducing" src="https://github.com/user-attachments/assets/7ce2e60d-6cc6-4ec3-be3e-6902485b4531" />


FinAI is an AI-first expense intelligence platform designed around one core principle:

**financial tracking should feel like conversation, not accounting software.**

Instead of forcing users through rigid forms and dropdowns, FinAI allows free-text expense input such as:

```txt
"uber airport 45"
"coffee 5"
"team lunch 24 dollars"
```

The platform combines:

* Deterministic regex parsing
* AI enrichment
* Human-in-the-loop validation
* Analytics pipelines
* Async processing
* Behavioral insight generation


The result is a financial system optimized for:

* Speed
* Low friction
* Explainability
* Auditability
* AI-assisted intelligence

---

# 🧠 Core Product Principles

## Human-in-the-Loop AI

AI never directly mutates financial data.

Flow:

<img width="1536" height="1024" alt="human-in-the-loop" src="https://github.com/user-attachments/assets/9a454d4c-f111-414c-ac40-e79acddb870b" />



Every transaction requires explicit confirmation before saving.

---

## Hybrid Parsing Architecture

FinAI avoids pure-LLM parsing.

Pipeline:

<img width="1774" height="887" alt="hyberidAIparsing" src="https://github.com/user-attachments/assets/e28dfd83-ee40-4988-80bb-2959c9b14ad1" />


This reduces:

* Latency
* AI costs
* Hallucination risks
* Unpredictable parsing behavior

---

## Auditability First

The system always stores:

* Raw user input
* Parsed output
* Confidence scores
* User corrections

Nothing is hidden.

---

# 🛠️ Tech Stack

## 🎨 Frontend

* React
* TypeScript
* Tailwind CSS
* Vite
* React Query / TanStack Query
* Charting libraries for analytics dashboards

---

## ⚙️ Backend

* Node.js
* Express.js
* TypeScript
* Zod validation
* JWT Authentication
* Refresh token rotation
* Modular service architecture

---

## 🗄️ Database

* PostgreSQL
* Prisma ORM

---

## 🔄 Queue & Async Processing

* Redis
* BullMQ

Used for:

* Analytics recomputation
* Monthly reports
* Recurring expense detection
* AI insight generation

---

## 🤖 AI Layer

### Deterministic Layer

* Regex extraction
* Merchant dictionary matching
* Confidence scoring
* Rule-based categorization

### AI Layer

* OpenAI integration
* AI enrichment
* Smart insights
* Follow-up question generation
* Behavioral analysis

---

## 🐳 Infrastructure

* Docker
* Docker Compose
* Structured logging
* Async worker architecture

---

# 🗺️ MVP Roadmap

## 🧱 Phase 1 — Backend Foundation

### Goals

* JWT authentication
* Refresh token rotation
* PostgreSQL setup
* Prisma integration
* Redis integration
* Docker environment
* Zod validation
* Error handling middleware

### Success Criteria

* Protected routes reject invalid JWTs
* Refresh tokens rotate correctly
* Full environment boots via Docker Compose
* Prisma migrations run from scratch

---

## 💬 Phase 2 — Transaction Ingestion

### Goals

* Natural-language transaction endpoint
* Regex parser pipeline
* Merchant recognition
* Category inference
* Confidence scoring
* Missing field detection

### Performance Targets

| Metric                      | Target               |
| --------------------------- | -------------------- |
| Deterministic parse latency | < 100ms              |
| Known merchant accuracy     | 95%+                 |
| Parser test coverage        | 30+ input variations |
| AI cost reduction           | ~80% fewer AI calls  |

### Example Inputs

```txt
"coffee 5"
→ amount: $5
→ category: Food & Drink
→ confidence: 68%
```

```txt
"uber airport 45"
→ amount: $45
→ merchant: Uber
→ category: Transportation
→ confidence: 94%
```

```txt
"walmart groceries 120"
→ amount: $120
→ merchant: Walmart
→ category: Groceries
→ confidence: 97%
```

---

## 👤 Phase 3 — Human-in-the-Loop AI

### Goals

* Structured preview UI
* Inline correction editing
* Confidence visualization
* Correction feedback loop
* Confirmation endpoint
* Clarifying AI questions

### Confidence Thresholds

| Confidence | Behavior                    |
| ---------- | --------------------------- |
| 90–100%    | One-click confirm           |
| 70–89%     | Highlight uncertain fields  |
| 50–69%     | Require review              |
| <50%       | Generate follow-up question |

### Success Criteria

* No transaction persists without confirmation
* Every field remains editable before save
* Low-confidence parsing triggers follow-up flow

---

## 📊 Phase 4 — Analytics & Insights

### Features

* Monthly analytics
* Category breakdowns
* Spending trends
* Merchant analytics
* Heatmaps
* Recurring expense detection
* AI-generated summaries

### Performance Targets

| Metric                      | Target                        |
| --------------------------- | ----------------------------- |
| Dashboard response time     | < 200ms (cached)              |
| Analytics recomputation     | < 5 seconds                   |
| Recurring expense detection | After 3 matching transactions |

### 📈 Analytics Concepts

* GROUP BY aggregations
* Window functions
* DATE_TRUNC bucketing
* Indexed queries
* Materialized views

---

## ✨ Phase 5 — AI Enhancement Layer

### Features

* OpenAI-powered enrichment
* Smart recommendations
* Behavioral analysis
* Predictive insights
* Anomaly detection
* Financial summaries

### Planned Future Expansion

* OCR receipt scanning
* Voice transcription
* Multi-currency support
* Plaid bank integrations
* AI budgeting coach
* Predictive forecasting

---

# ⭐ Key Features

## Natural Language Expense Capture

Users type expenses naturally.

No forms.
No dropdowns.
No manual categorization.

---

## ⚡ Hybrid AI Parsing Engine

Deterministic parsing runs first.

AI only activates when confidence is low.

Benefits:

* Faster parsing
* Lower operational cost
* More predictable behavior
* Easier testing

---

## 🎯 Confidence Scoring System

Every parsed field receives a confidence score.

Example:

```json
{
  "merchant": "Uber",
  "category": "Transportation",
  "confidence": 0.94
}
```

---

## Human Confirmation Workflow

Before persistence:

* Users review parsed data
* Users correct errors inline
* Corrections improve future parsing

---

## 🔄 Async Analytics Pipeline

Analytics processing is fully asynchronous.

Architecture:

```txt
Transaction Confirmed
→ Queue Event
→ BullMQ Worker
→ Analytics Recompute
→ Cache Update
```

---

## 🔁 Recurring Expense Detection

Background workers identify:

* Subscriptions
* Utilities
* Monthly recurring merchants
* Payment cadence patterns

---

## 💡 Smart Financial Insights

Example outputs:

```txt
"Food spending increased 18% this month."
```

```txt
"Recurring subscriptions increased by 2 services."
```

```txt
"Transportation costs are 24% above monthly average."
```

---

# 🔌 API Endpoints

## 🔐 Authentication

### Register

```http
POST /auth/register
```

### Login

```http
POST /auth/login
```

### Refresh Token

```http
POST /auth/refresh
```

---

## 💸 Transactions

### Parse Natural Language Input

```http
POST /transactions/parse
```

#### Example Request

```json
{
  "input": "uber airport 45"
}
```

#### Example Response

```json
{
  "amount": 45,
  "merchant": "Uber",
  "category": "Transportation",
  "confidence": 0.94
}
```

---

### Confirm Transaction

```http
POST /transactions/confirm
```

Used after user review.

---

### Get Transactions

```http
GET /transactions
```

---

## Analytics

### Dashboard Analytics

```http
GET /analytics/dashboard
```

### Monthly Reports

```http
GET /analytics/monthly
```

### Spending Trends

```http
GET /analytics/trends
```

### Top Merchants

```http
GET /analytics/top-merchants
```

### Recurring Expenses

```http
GET /analytics/recurring
```

---

# 🏗️ Architecture Overview

## High-Level System Flow

```txt
Frontend (React)
    ↓
Express API
    ↓
Parser Pipeline
    ↓
Confidence Engine
    ↓
AI Enrichment (conditional)
    ↓
User Confirmation
    ↓
PostgreSQL Persistence
    ↓
BullMQ Events
    ↓
Analytics Workers
    ↓
Redis Cache
```

---

# 🧪 Testing Strategy

## Parser Testing

Parser reliability is critical.

Coverage includes:

* Merchant extraction
* Amount extraction
* Currency handling
* Missing fields
* Ambiguous phrasing
* Multilingual inputs

### Requirements

* 30+ parser test variations
* Deterministic parsing benchmarks
* Confidence score validation

---

# 📏 Engineering Rules

## Do

* Store raw input
* Surface confidence scores
* Keep AI explainable
* Use deterministic parsing first
* Require confirmation before persistence

---

## Avoid

* Blind AI persistence
* LLM-first parsing
* Hidden confidence logic
* Fat controllers
* Unvalidated request payloads

---

# 📦 Scaling Strategy

## Initial MVP

Single API service with:

* PostgreSQL
* Redis
* BullMQ workers
* Docker Compose

---

## Future Scaling

Potential scale-out architecture:

* Dedicated parser service
* Separate analytics workers
* Queue partitioning
* Read replicas
* Materialized analytics views
* AI microservice isolation

---

# 🎯 Why This Architecture

Most finance apps fail because they optimize for features instead of user friction.

FinAI optimizes for:

* Fast input
* High trust
* Explainability
* Auditability
* Async scalability
* Incremental AI adoption

The architecture intentionally avoids:

* AI overengineering too early
* Premature microservices
* Bank dependency lock-in
* Expensive full-LLM pipelines

---

# 🔮 Future Vision

FinAI evolves from:

```txt
Expense Tracker
→ Financial Intelligence Layer
→ Behavioral Financial Assistant
→ Autonomous Financial Operating System
```

Long-term capabilities:

* AI financial coaching
* Spending prediction
* Personalized recommendations
* Subscription optimization
* Financial anomaly detection
* Voice-first finance interaction
* Autonomous budgeting systems

