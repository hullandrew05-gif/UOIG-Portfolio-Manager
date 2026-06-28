# Prediction Markets — Kalshi mapping

Curated map of up to **5 Kalshi prediction markets per holding**, surfaced in the
terminal's **Predictions** tab. Fill this in as we go; once the add-holding flow
exists, adding a position will prompt for its five markets.

## How it's used
- The Predictions tab pulls each listed market **live** from Kalshi's public API on
  stock open, cached ~15 min. No API key is needed for market reads (the key is only
  for trading).
- A **series ticker** (e.g. `KXAAPLA`) is resolved to its currently-open market(s);
  paste a full **market ticker** if you want one specific contract/strike.

## How to find a ticker
- On kalshi.com, open the market — the ticker is in the URL / "Market details".
- Or via API: `GET https://api.elections.kalshi.com/trade-api/v2/series?category=Companies`
  (also try `Financials`, `Economics`, `Science and Technology`). Paste the `ticker` field.

## Columns
- **Market** — the label we show on the card.
- **Kalshi ticker** — series ticker (preferred, durable) or a specific market ticker.
- **Type** — `KPI` · `Event` · `Macro` · `Sector` · `Other`.
- **Notes** — optional (strike, what "yes" means, resolution cadence).

Leave rows blank until you have five — the tab renders whatever is filled, and shows a
clean "no markets mapped yet" state for holdings with none.


---

## TMT

### GOOGL — Alphabet Inc Class A
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |Best AI at the end of 2026?  |kxllm1  |  |  |
| 2 |Google headcount this year  |kxgooga  |  |  |
| 3 |How low will the Google Gemini 3.5 Flash output token price (paid tier) get this year?  |kxgemini35oy  |  |  |
| 4 |Where will Waymo operate this year?  |kxwaymocity  |  |  |
| 5 |When will Waymo officially announce an IPO?  |kxwaymo  |  |  |

### AVGO — Broadcom Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |Which bills will become law this year?  |kxbills  |  |  |
| 2 |US semiconductor production growth this year?  |kxsemiprodh  |  |  |
| 3 |Top Coding AI this month  |kxcodeai  |  |  |
| 4 |Best AI at the end of 2026?  |kxllm1  |  |  |
| 5 |Number of US data centers at the end of 2026?  |kxusadatacenters  |  |  |

### TWLO — Twilio Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### AAPL — Apple Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Apple KPI (revenue / units) | `KXAAPLA` | KPI | worked example — confirm strike & cadence on Kalshi |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CSCO — Cisco Systems Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### MSFT — Microsoft Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CACI — CACI INTERNATIONAL INC Common Stock
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### ACIW — ACI Worldwide Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### PRGS — Progress Software Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### WK — Workiva Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### OMC — Omnicom Group Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### NCNO — nCino Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### BILL — BILL Holdings Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |


---

## IME

### AGX — Argan Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### BLBD — Blue Bird Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### DAL — Delta Air Lines Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### NEE — NextEra Energy Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CTVA — Corteva Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### KEX — Kirby Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### LEU — Centrus Energy Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CVX — Chevron Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### GD — General Dynamics Corporation
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |


---

## Healthcare

### CPRX — Catalyst Pharmaceuticals Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CVS — CVS Health Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### OMCL — Omnicell, Inc.
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### MCK — McKesson Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### UHS — Universal Health Services Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### IQV — Iqvia Holdings Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### PFE — Pfizer Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### REGN — Regeneron Pharmaceuticals Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CON — Concentra Group Holdings Parent Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### SEM — Select Medical Holdings Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |


---

## Financial

### C — Citigroup Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### CTRE — Caretrust REIT Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### AX — Axos Financial Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### EVR — Evercore Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### UMBF — UMB Financial Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### UMBF — UMB Financial Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### BRK.B — Berkshire Hathaway Inc Class B
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### SPGI — S&P Global Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### FOR — Forestar Group Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |


---

## Consumer

### AMZN — Amazon.com Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### BG — Bunge Global SA
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### DG — Dollar General Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### SJM — J.M. Smucker Co
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

### SW — Smurfit WestRock PLC
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |
