# AgroAssist Pro Backend

Production-ready Node.js + JavaScript + Express REST API backend for AgroAssist Pro, an AI-powered agricultural assistant for smallholder farmers.

---

## 🏗️ Architecture Overview & Dual-Database Responsibility

AgroAssist Pro is built on a modular Node.js + Express architecture utilizing a dual-database design:
- **MySQL**: Primary transactional database for operational application data (Users, Farms, Crops, Scans, Recommendations, Media metadata, Risk scores).
- **Snowflake**: Analytical data warehouse for historical disease tracking, weather/disease correlations, and aggregate reporting.

```
+-----------------------------------------------------------------------------------+
|                                 Express REST API                                  |
+-----------------------------------------------------------------------------------+
                                         |
                        +----------------+----------------+
                        |                                 |
                        v                                 v (Async Background Event)
           +--------------------------+        +--------------------------+
           | MySQL Operational DB     |        | Snowflake Warehouse      |
           | (Primary Transactions)   |        | (Analytical Engine)      |
           +--------------------------+        +--------------------------+
           | - Users & Auth Credentials|        | RAW / CORE / ANALYTICS   |
           | - Farms & Crop Inventory |        | - Disease Analysis History|
           | - Active Scans & Assets  |        | - Multi-Year Weather Logs|
           | - Immediate Recommendations|       | - Risk Evolution Views   |
           +--------------------------+        | - Disease Trends         |
                                               +--------------------------+
```

### MySQL → Snowflake Asynchronous Data Flow

1. **Transactional Guarantee**: The backend executes all transactional CRUD operations directly against **MySQL**. The client response is finalized immediately after MySQL commits.
2. **Decoupled Asynchronous Sync**: Upon successful MySQL write, an asynchronous event worker (`snowflakeService.syncOperationalDataToSnowflake`) triggers a background load into Snowflake `CORE` tables (`CORE.HISTORICAL_DISEASE_ANALYSIS`, `CORE.HISTORICAL_WEATHER_DATA`, `CORE.CROP_RISK_METRICS`).
3. **Fault Isolation**: If Snowflake is temporarily offline or unreachable due to network latency, the error is logged internally and **does NOT corrupt or roll back** the primary MySQL transaction.
4. **Idempotency & Duplicate Prevention**: Uses primary keys (`analysis_id`, `weather_id`, `risk_id`) in parameterized queries to ensure zero data duplication.
5. **Analytical Query Fallback**: REST analytics endpoints (`/api/analytics/...`) query Snowflake `ANALYTICS` views (`DISEASE_TRENDS`, `RISK_EVOLUTION`, `WEATHER_DISEASE_CORRELATION`, `FARM_ANALYTICS`). If Snowflake is offline, queries fall back seamlessly to MySQL operational data.

---

## 🧮 Deterministic Agricultural Risk Scoring Model

The risk calculation engine (`src/services/risk/riskEngine.service.js`) combines AI disease diagnosis, weather observations, and crop context into a deterministic score bounded between **0 and 100**.

### Scoring Matrix Breakdown

#### 1. Disease Pathogen Component (Max 50 Points)
- **Base Severity**:
  - `high`: 35 points
  - `medium`: 22 points
  - `low`: 10 points
- **Confidence Adjustment**: $\text{SeverityPoints} \times (\text{ConfidenceScore} / 100)$
- **Environmental Risk Vulnerability**:
  - `high`: +15 points
  - `medium`: +8 points
  - `low`: +2 points

#### 2. Weather Micro-Climate Component (Max 50 Points)
- **Humidity Risk**:
  - Relative Humidity $\ge 85\%$: +18 points (Rapid fungal spore propagation)
  - Relative Humidity $70\% - 84\%$: +10 points (Elevated humidity)
- **Rainfall & Rain Probability**:
  - Rain Probability $\ge 70\%$ or Rain $\ge 10\text{mm}$: +17 points (High leaf wetness & soil splashback)
  - Rain Probability $40\% - 69\%$ or Rain $\ge 2\text{mm}$: +9 points (Moderate rain moisture risk)
- **Temperature Extremes**:
  - Temp $> 35^\circ\text{C}$ or Temp $< 10^\circ\text{C}$: +15 points (Heat/cold immune stress)
  - Warm & Humid ($25^\circ\text{C} - 35^\circ\text{C}$ with Humidity $\ge 70\%$): +8 points

### Risk Level Categorization
| Score Range | Risk Level | Meaning |
| :--- | :--- | :--- |
| **0 – 34** | `low` | Optimal growth conditions; minimal threat |
| **35 – 64** | `medium` | Moderate threat; monitoring advised |
| **65 – 84** | `high` | High threat; preventative action recommended |
| **85 – 100** | `critical` | Critical threat; immediate intervention required |

---

## 🛠️ Installation & Execution

```bash
# Install dependencies
npm install

# Run development mode
npm run dev

# Run automated test suite
npm test
```
