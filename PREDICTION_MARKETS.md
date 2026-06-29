# Prediction Markets — Kalshi mapping

Curated map of up to **4 Kalshi prediction markets per holding**, surfaced in the
terminal's **Predictions** tab. Fill this in as we go; once the add-holding flow
exists, adding a position will prompt for its four markets.

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

Leave rows blank until you have four — the tab renders whatever is filled, and shows a
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

### AVGO — Broadcom Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 |Which bills will become law this year?  |kxbills  |  |  |
| 2 |US semiconductor production growth this year?  |kxsemiprodh  |  |  |
| 3 |Top Coding AI this month  |kxcodeai  |  |  |
| 4 |Best AI at the end of 2026?  |kxllm1  |  |  |

### TWLO — Twilio Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Top Coding AI this month | KXCODEAI | Sector | AI displacement of comms/dev tooling |
| 2 | Best AI coding model at year-end | KXCODINGMODEL | Sector |  |
| 3 | Year-end top LLM | KXLLM1 | Sector |  |
| 4 | Which companies will conduct layoffs this year? | KXCOMPANYLAYOFF | Macro | software-sector headcount |

### AAPL — Apple Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Apple headcount in 2026 | KXAAPLA | KPI |  |
| 2 | Courts consider Apple a monopoly? | KXAPPLEUS | Event | DOJ antitrust |
| 3 | MacBook with cellular connectivity released | KXMACCELL | Event |  |
| 4 | Year-end top LLM (Apple Intelligence) | KXLLM1 | Sector |  |

### CSCO — Cisco Systems Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Number of US data centers at the end of 2026 | KXUSADATACENTERS | Macro | networking demand proxy |
| 2 | Americas data center capacity at the end of 2026 | KXUSDCCAPACITY | Macro |  |
| 3 | US starts a nuclear-powered data center | KXDATACENTER | Event |  |
| 4 | US semiconductor production growth in 2026 | KXSEMIPRODH | Macro |  |

### MSFT — Microsoft Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | When will OpenAI officially announce an IPO? | KXIPOOPENAI | Event | MSFT is OpenAI's largest backer |
| 2 | Will OpenAI or Anthropic IPO first? | KXOAIANTH | Event |  |
| 3 | Best AI coding model at year-end | KXCODINGMODEL | Sector | Copilot / Azure AI |
| 4 | Year-end top LLM | KXLLM1 | Sector |  |

### CACI — CACI INTERNATIONAL INC Common Stock
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Which bills will become law in 2026? | KXBILLS | Macro | federal IT/defense budget exposure |
| 2 | Number of US data centers at the end of 2026 | KXUSADATACENTERS | Macro | gov cloud/IT buildout |
| 3 | US semiconductor production growth in 2026 | KXSEMIPRODH | Macro |  |
| 4 | Year-end top LLM | KXLLM1 | Sector |  |

### ACIW — ACI Worldwide Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Will Ramp or Brex IPO first? | KXRAMPBREX | Event | fintech/payments sentiment |
| 2 | When will Stripe officially announce an IPO? | KXSTRIPEIPO | Event | payments-rail comps |
| 3 | Top Coding AI this month | KXCODEAI | Sector |  |
| 4 | Year-end top LLM | KXLLM1 | Sector |  |

### PRGS — Progress Software Corp
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Best AI coding model at year-end | KXCODINGMODEL | Sector | dev-tools displacement |
| 2 | Top Coding AI this month | KXCODEAI | Sector |  |
| 3 | Year-end top LLM | KXLLM1 | Sector |  |
| 4 | Will AI be the #1 reason for job cuts? | KXCHAICUTS | Macro |  |

### WK — Workiva Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Best AI coding model at year-end | KXCODINGMODEL | Sector | AI in compliance/reporting SaaS |
| 2 | Will AI be the #1 reason for job cuts? | KXCHAICUTS | Macro |  |
| 3 | Year-end top LLM | KXLLM1 | Sector |  |
| 4 | Which companies will conduct layoffs this year? | KXCOMPANYLAYOFF | Macro |  |

### OMC — Omnicom Group Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Which brands will advertise during the Big Game? | KXSUPERBOWLAD | Event | ad-spend bellwether |
| 2 | Which brands will advertise during the World Cup Final | KXWCADS | Event |  |
| 3 | Fully AI-generated streaming series released | KXAISTREAMSERIES | Event | AI in creative/media |
| 4 | Netflix headcount in 2026 | KXNFLXA | KPI | media-client health |

### NCNO — nCino Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Who will replace Jamie Dimon as JPMorgan CEO? | KXJPMCEONEW | Event | bank-customer leadership |
| 2 | Who will be the next CEO of Goldman Sachs? | KXNEWROLEGS | Event |  |
| 3 | Will JPMorgan acquire any company before 2028? | KXACQANNOUNCEJPM | Event | bank M&A / fintech demand |
| 4 | Best AI coding model at year-end | KXCODINGMODEL | Sector |  |

### BILL — BILL Holdings Inc
| # | Market (display label) | Kalshi ticker | Type | Notes |
|---|------------------------|---------------|------|-------|
| 1 | Will Ramp or Brex IPO first? | KXRAMPBREX | Event | SMB-fintech comps |
| 2 | When will Ramp officially announce an IPO? | KXIPORAMP | Event |  |
| 3 | When will Brex officially announce an IPO? | KXIPOBREX | Event |  |
| 4 | Robinhood gold subscribers (Q2 2026) | KXHOOD | KPI | retail-fintech demand |


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
