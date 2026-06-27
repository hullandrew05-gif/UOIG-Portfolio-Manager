// Andrew Brain — wiki data
// Compact corpus derived from the real vault. Each page has: slug, title, type, course, tags, updated, body.
// Bodies are the actual markdown summaries (truncated where long).

window.AB_DATA = (() => {
  const pages = [
    // ===== COURSES =====
    { slug: "ba365", title: "BA365 — Cross-Cultural Negotiation", type: "course", course: "BA365", tags: ["negotiation","spring-2026"], updated: "2026-04-21", created:"2026-04-15",
      body: `# BA365 — Cross-Cultural Negotiation

**Instructor**: [[emily-moore]] · **Term**: Spring 2026 · **Room**: MW 12:00–1:50, 255 Lillis

## Description
Cross-cultural negotiation course covering [[principled-negotiation]], [[conflict-styles]], cognitive biases, [[identity-in-negotiation]], and [[difficult-conversations]]. Experiential learning through simulations and reflective exercises.

## Key Topics
1. **Negotiation Fundamentals** — Distributive vs. integrative bargaining, [[batna]], WATNA
2. **[[principled-negotiation]]** — Four basic points from *Getting to Yes*
3. **[[negotiation-jiujitsu]]** — GTY Ch. 7 technique for hard bargainers
4. **[[conflict-styles]]** — Kraybill CSI, Thomas-Kilmann
5. **Cognitive biases** — anchoring, availability, self-serving bias
6. **Identity in negotiation** — Phoenix metaphor, AI and identity
7. **[[difficult-conversations]]** — Three Conversations model

## Assignments
| Assignment | Due | Points | Status |
|---|---|---|---|
| Journal 1 — Self-Reflection | 2026-04-01 | 10 | Submitted |
| Negotiation Skills Inventory | 2026-04-06 | — | Complete |
| Journal 2 — Identity | 2026-04-15 | 10 | Submitted |
| **Midterm 1 (in class)** | **2026-04-22** | **35** | **Upcoming** |
| Journal 3 — Coaching | 2026-05-06 | 10 | Upcoming |
| Team Paper + Presentation | 2026-05-20 | 25 | Upcoming |
| Midterm 2 | 2026-05-27 | 35 | Upcoming |
| Final Journal + Video | 2026-06-08 | 40 | Upcoming |

> [!todo] Pick the specific negotiation skill to track across video compilation.`},

    { slug: "mgmt335", title: "MGMT335 — Launching New Ventures", type: "course", course: "MGMT335", tags:["entrepreneurship","spring-2026"], updated:"2026-04-19", created:"2026-04-15",
      body: `# MGMT335 — Launching New Ventures

**Instructor**: [[natasha-overmeyer]] · **Term**: Spring 2026 (MW 10–11:50, Lillis 112)

Introduction to entrepreneurial practices. How to identify ideas, evaluate potential, build a business, recognize barriers. Explicit focus on **high-growth-intentioned entrepreneurship**.

## Key Frameworks
- [[bird-in-hand-principle]] — Sarasvathy's means-driven approach
- [[dwi-framework]] — Doable? Worth doing? Can I? Do I want to?
- [[creative-destruction]] — Schumpeter
- [[customer-discovery]] — Foster School interview best practices
- [[high-growth-vs-small-business]] — Course focus vs. broader landscape

## Assignments
| Assignment | Due | Points | Status |
|---|---|---|---|
| Problem Memo & Pitch | 2026-04-13 | 60 | Submitted |
| [[mgmt335-interview-entrepreneur-assignment]] | 2026-04-20 | 40 | Submitted |
| Mid-Term Case Exam | 2026-04-27 | 220 | Upcoming |
| Team Expectations | 2026-04-29 | 10 | Upcoming |
| Finding Your Customer | 2026-05-04 | 40 | Upcoming |
| Opportunity Analysis Project | 2026-05-15 | 180 | Upcoming |
| Opportunity Execution Project | 2026-06-05 | 220 | Upcoming |`},

    // ===== CONCEPTS =====
    { slug: "principled-negotiation", title:"Principled Negotiation", type:"concept", course:"BA365", tags:["negotiation-theory","getting-to-yes","midterm-1"], updated:"2026-04-21", created:"2026-04-15",
      body: `# Principled Negotiation

Also known as interest-based negotiation.

## Summary
The "third way" beyond soft (relationship-preserving at all cost) and hard (win-at-all-cost positional) negotiation. Developed by the Harvard Negotiation Project — Fisher, Ury, Patton — in *Getting to Yes*.

## Four Pillars
1. **People** — Separate the people from the problem. Connects to [[identity-in-negotiation]] and [[difficult-conversations]].
2. **Interests** — Focus on interests, not positions. Ask "why?" and "why not?"
3. **Options** — Invent options for mutual gain. Brainstorm before deciding.
4. **Criteria** — Insist on objective criteria. Market value, precedent, standards.

## Role of [[batna]]
Your Best Alternative To Negotiated Agreement defines your walkaway. Always develop it before entering negotiation.

## Three-Way Comparison
| | Soft | Hard | Principled |
|---|---|---|---|
| Participants | friends | adversaries | **problem-solvers** |
| Goal | agreement | victory | **wise outcome** |
| On people/problem | soft on both | hard on both | **soft on people, hard on problem** |
| Under pressure | yield | apply | **yield to principle, not pressure** |

> "If you do not like the choice between hard and soft positional bargaining, you can change the game."`},

    { slug: "batna", title:"BATNA", type:"concept", course:"BA365", tags:["getting-to-yes","midterm-1"], updated:"2026-04-21", created:"2026-04-15",
      body: `# BATNA — Best Alternative To Negotiated Agreement

## Summary
The benchmark against which any proposed agreement should be measured. Core concept in [[principled-negotiation]].

## Key Points
- **Definition**: Best option if you walk away
- **Function**: Rational baseline — never accept a deal worse than BATNA
- **Disclosure**: Reveal only if strong
- **Development**: Not fixed — improve via research, relationships, new options

## Cognitive Biases Affecting BATNA
- **Self-serving bias** — negotiators overestimate their own BATNA
- **Availability** — vivid past wins inflate confidence
- **Anchoring** — initial estimates stick

## Three Steps (GTY Ch. 6)
1. **Invent** — list actions if no agreement
2. **Improve** — convert to practical alternatives
3. **Select** — tentatively pick the best

> "Developing your BATNA is perhaps the most effective course of action you can take in dealing with a seemingly more powerful negotiator."`},

    { slug: "conflict-styles", title:"Conflict Styles", type:"concept", course:"BA365", tags:["kraybill","tki"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Conflict Styles

Kraybill CSI and Thomas-Kilmann both map five styles onto two axes: concern for own agenda × concern for relationship.

## Five Styles
1. **Directing** — High agenda / Low relationship. Assertive, leverage-based.
2. **Harmonizing** — Low agenda / High relationship. Yielding, smoothing.
3. **Avoiding** — Low agenda / Low relationship. Withdrawal.
4. **Cooperating** — High agenda / High relationship. Joint problem-solving. Aligns with [[principled-negotiation]].
5. **Compromising** — Medium/medium. Splitting the difference.

## Calm vs. Storm
- Shifts of 3+ points warrant reflection
- Shifts of 5+ are alarming

Measured by [[conflict-style-inventory-mcc]]. Critiqued in [[kupfer-schneider-negotiation-paradigm]].`},

    { slug: "negotiation-jiujitsu", title:"Negotiation Jiujitsu", type:"concept", course:"BA365", tags:["gty-ch7","midterm-1"], updated:"2026-04-21", created:"2026-04-21",
      body: `# Negotiation Jiujitsu

Technique from [[principled-negotiation]] for handling hard bargainers. Don't meet force with force — redirect energy back toward the problem.

## Four Core Principles
1. Don't meet force with force
2. Don't react emotionally
3. Redirect to interests, not positions
4. Keep relationship calm; engage problem creatively

## Five Key Moves
| Move | How |
|---|---|
| Ask questions, don't argue | Questions generate answers, statements generate resistance |
| Reframe their statements | Translate position → interest |
| Use silence | Creates space, disrupts attack cycles |
| Treat attacks as information | Decode, don't defend |
| Shift to joint problem-solving | Us vs. the problem |

> "Do not push back. When they assert their positions, do not reject them. Break the vicious cycle by refusing to react."`},

    { slug: "bird-in-hand-principle", title:"Bird-in-Hand Principle", type:"concept", course:"MGMT335", tags:["sarasvathy","effectuation"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Bird-in-Hand Principle

Sarasvathy: **expert entrepreneurs start with means, not blockbuster ideas**.

Three questions:
1. **Who am I?** — traits, values
2. **What do I know?** — expertise, experience
3. **Whom do I know?** — networks

Contrast with the "great idea" mythology. Means-driven entrepreneurship explains most real-world founders better than opportunity-recognition models.

Connects to [[customer-discovery]] and [[high-growth-vs-small-business]].`},

    { slug: "customer-discovery", title:"Customer Discovery", type:"concept", course:"MGMT335", tags:["lean","interviews"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Customer Discovery

Hallen & Murray (Foster School): best practices for reducing **customer risk** through systematic interviewing.

## Principles
- Interview to **learn**, not to pitch
- Ask about **past behavior**, not future intent
- Seek **problem**, not solution validation
- Score interviews on a consistent rubric

Applies directly to Andrew's work at Boundless VC. Connects to [[bird-in-hand-principle]] and [[high-growth-vs-small-business]].`},

    { slug: "identity-in-negotiation", title:"Identity in Negotiation", type:"concept", course:"BA365", tags:["identity","midterm-1"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Identity in Negotiation

How identity shapes and is threatened by negotiation.

## Key Ideas
- **Identity quakes** — moments when self-concept is challenged under pressure
- **All-or-nothing syndrome** — catastrophizing identity threats
- **Phoenix metaphor** — identity rebuilds after disruption
- **Grounding** — recovering composure when identity is threatened

Central to [[difficult-conversations]] and tightly linked to [[conflict-styles]] calm-vs-storm dynamics.`},

    { slug: "difficult-conversations", title:"Difficult Conversations", type:"concept", course:"BA365", tags:["stone-patton-heen"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Difficult Conversations

Stone, Patton & Heen — framework for navigating identity-threatening conversations.

## Three Conversations Model
Every difficult conversation has three layers:
1. **What happened?** — facts, blame, intent
2. **Feelings** — what's under the surface
3. **Identity** — what this says about who I am

## Core Moves
- Shift from "message delivery" to **learning conversation**
- Use "and" instead of "but"
- Separate impact from intent
- Ground yourself in identity before entering`},

    { slug: "cognitive-biases-in-negotiation", title:"Cognitive Biases in Negotiation", type:"concept", course:"BA365", tags:["korobkin-guthrie","midterm-1"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Cognitive Biases in Negotiation

Korobkin & Guthrie — systematic distortions in bargaining.

- **Anchoring** — initial numbers pull estimates
- **Availability** — vivid examples inflate probability
- **Self-serving bias** — your own BATNA and fairness claims are inflated
- **Framing** — gain vs. loss frames flip risk preference
- **Status quo bias** — default options over-chosen
- **Contrast effects** — adjacent options warp judgment

Undermines [[principled-negotiation]] when parties anchor on positions.`},

    { slug: "value-added-services", title:"Value-Added Services (VAS)", type:"concept", course:"UOIG", tags:["visa","payments"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Value-Added Services (VAS)

Visa's four-sub-business VAS stack:
1. **Issuer Solutions** (Pismo)
2. **Acceptance Solutions** (Cybersource, tokenization)
3. **Risk & Identity** (Featurespace)
4. **Advisory**

~30% of revenue, ~50% of revenue growth. Compounded 20%+ for 5 years.`},

    { slug: "variant-perception", title:"Variant Perception", type:"concept", course:"UOIG", tags:["investing"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Variant Perception

Non-consensus view required for a credible pitch on a high-coverage name. Without it, a DCF returns "fairly valued." The variant has to live in terminal-value assumptions on names with 40+ covering analysts.`},

    // ===== ENTITIES =====
    { slug: "andrew-hull", title:"Andrew Hull", type:"entity", course:"Personal", tags:["self"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Andrew Hull

Owner of this wiki. Portland, OR.

## Education
- **University of Oregon** — B.S. Business Administration, Finance. **GPA 4.0**. Expected Dec 2026.

## Current Roles
- **BlackRock** — Incoming Securities Lending Summer Intern (Jun–Aug 2026, San Francisco)
- **Boundless VC** — VC Intern (Oct 2025–present)
- **[[uoig]]** — Financials Sector Leader. Authored [[bro-report]], [[ncno-report]], [[on-report]].

## Prior
- **IMA Financial Group** — Employee Benefits Associate (Jun 2024 – Jan 2025)
- **The Advocate** — Editor in Chief (Sep 2023 – Jun 2024). Ran $60K budget; grew ad revenue 58% YoY.

## Interests
Golf, snowboarding, basketball, running, carpentry, writing, cooking.`},

    { slug: "emily-moore", title:"Emily Moore", type:"entity", course:"BA365", tags:["teacher"], updated:"2026-04-19", created:"2026-04-15",
      body: `# Emily Moore

Instructor for [[ba365]] (Cross-Cultural Negotiation), Spring 2026.

- **Email**: emoore12@uoregon.edu
- **Office**: 250D Lillis
- **Hours**: Mondays 11–12 or by appointment`},

    { slug: "natasha-overmeyer", title:"Natasha Overmeyer", type:"entity", course:"MGMT335", tags:["teacher"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Natasha Overmeyer

Instructor for [[mgmt335]] (Launching New Ventures), Spring 2026.`},

    { slug: "roger-fisher", title:"Roger Fisher", type:"entity", course:"BA365", tags:["author"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Roger Fisher

Co-author of *Getting to Yes*. Harvard Negotiation Project. Foundational voice for [[principled-negotiation]] and [[batna]].`},

    { slug: "william-ury", title:"William Ury", type:"entity", course:"BA365", tags:["author"], updated:"2026-04-15", created:"2026-04-15",
      body: `# William Ury

Co-author of *Getting to Yes* with [[roger-fisher]] and [[bruce-patton]].`},

    { slug: "bruce-patton", title:"Bruce Patton", type:"entity", course:"BA365", tags:["author"], updated:"2026-04-15", created:"2026-04-15",
      body: `# Bruce Patton

Co-author of *Getting to Yes* and *Difficult Conversations*.`},

    { slug: "visa", title:"Visa", type:"entity", course:"UOIG", tags:["company","payments"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Visa (NYSE: V)

Payment network — GICS Information Technology (not Financials).

- ~5B credentials globally
- ~175M merchant acceptance locations
- ~300B transactions/year
- Duopoly with Mastercard; 65%+ operating margins
- Q1 FY26: $10.9B revenue (+15% YoY), EPS $3.17

Covered in [[visa-uoig-screening]]. Pitch owner: [[gilbert-knight]].`},

    { slug: "gilbert-knight", title:"Gilbert Knight", type:"entity", course:"UOIG", tags:["peer"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Gilbert Knight

UOIG analyst pitching Visa into [[tall-firs-portfolio]].`},

    { slug: "uoig", title:"UOIG", type:"entity", course:"UOIG", tags:["org"], updated:"2026-04-20", created:"2026-04-20",
      body: `# University of Oregon Investment Group

Student-led fund managing $3M+ for UO Foundation. Andrew is **Financials Sector Leader**.`},

    { slug: "tall-firs-portfolio", title:"Tall Firs Portfolio", type:"entity", course:"UOIG", tags:["portfolio"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Tall Firs Portfolio

[[uoig]]'s large-cap equity portfolio.`},

    { slug: "isaiah-fentress", title:"Isaiah Fentress", type:"entity", course:"MGMT335", tags:["entrepreneur"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Isaiah Fentress

Founder of [[fentress-technologies]]. Subject of Andrew's [[mgmt335-interview-entrepreneur-assignment|MGMT335 interview]].`},

    { slug: "fentress-technologies", title:"Fentress Technologies LLC", type:"entity", course:"MGMT335", tags:["small-business"], updated:"2026-04-19", created:"2026-04-19",
      body: `# Fentress Technologies LLC

Custom gaming PC builds + computer repair. Founded Dec 2020 by [[isaiah-fentress]]. Exemplar of [[bird-in-hand-principle|means-driven]] [[high-growth-vs-small-business|small-business]] entrepreneurship.`},

    { slug: "chris-argyris", title:"Chris Argyris", type:"entity", course:"BA365", tags:["author"], updated:"2026-04-21", created:"2026-04-21",
      body: `# Chris Argyris

Organizational theorist. Action Science, [[theories-in-use]], [[single-loop-double-loop-learning]].`},

    // ===== ANALYSES =====
    { slug: "visa-uoig-screening", title:"Visa (V) — UOIG Screening Analysis", type:"analysis", course:"UOIG", tags:["equity-research","visa"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Visa (V) — UOIG Screening Analysis

## The Verdict
**Green-light Gilbert to proceed to DCF**, pending two homework items:
1. A one-to-two-sentence [[variant-perception]] not already priced in.
2. Correct sector classification (Info Tech, not Financials).

## What Visa Is
Duopoly payment network. Four-party model (cardholder, merchant, acquirer, issuer). Not a bank.

## Q1 FY26 Results
- Net revenue: $10.9B (+15% YoY)
- EPS: $3.17 (+15%)
- VAS: $3.2B (+28% cc) — ~30% of revenue, ~50% of growth
- Processed transactions: 69B

## Three Angles for a Variant
1. **VAS penetration underappreciated** — Andrew's pick. Size the four sub-TAMs.
2. **Agentic/stablecoin overblown** — harder to defend in committee.
3. **Cross-border FX normalizes** — turns DCF into a macro bet.

## Key Risks
- **DOJ antitrust suit** targets US debit — the exact business the bull case leans on
- **CCCA** (Credit Card Competition Act)
- **Agent-to-agent payments**, x402, stablecoins
- Cross-border FX volatility drag

## Andrew's Added Insight
The most important observation: **Visa's biggest bull-case lever (US debit dominance + VAS cross-sell) is exactly what the DOJ is suing over.** A credible DOJ downside sizing wins credibility.`},

    { slug: "ba365-midterm-1-study-guide", title:"BA365 Midterm 1 Study Guide", type:"analysis", course:"BA365", tags:["midterm-1"], updated:"2026-04-21", created:"2026-04-21",
      body: `# BA365 Midterm 1 — Study Guide

Comprehensive reference organized by Moore's review-slide checklist.

## §1 — GTY Canon
The four pillars of [[principled-negotiation]]. Memorize the three-way comparison table cold.

## §2 — [[batna]]
Best Alternative to Negotiated Agreement. Develop, improve, protect.

## §3 — [[negotiation-jiujitsu]]
GTY Ch. 7. Four principles, five moves, three attack→response pairs.

## §4 — Dirty Tricks
GTY Ch. 8. Deliberate deception, psychological warfare, positional pressure.

## §5 — Non-GTY Readings
Peppet/Moffitt ([[theories-in-use]], [[single-loop-double-loop-learning]]), [[cognitive-biases-in-negotiation|Korobkin/Guthrie]], [[difficult-conversations|DC Ch. 6]], [[negotiation-skills-framework|Kupfer Schneider]], [[conflict-styles|Kraybill]].

## §6 — Games
WAMYC + Ultimatum takeaways.

See also [[ba365-midterm-1-flashcards]], [[ba365-midterm-1-predicted-questions]], [[ba365-midterm-1-todo]].`},

    { slug: "ba365-midterm-1-todo", title:"BA365 Midterm 1 — Study To-Do", type:"analysis", course:"BA365", tags:["midterm-1","todo"], updated:"2026-04-21", created:"2026-04-21",
      body: `# BA365 Midterm 1 — Study To-Do

**Exam**: Wed 2026-04-22 (today). In class. Respondus Lockdown.

## Tonight's Schedule

### Block 1 — Foundation (60 min)
- [x] Read §1–§5 of study guide
- [x] Flashcard sections A–F
- [x] Draw hard/soft/principled table from memory

### Block 2 — Jiujitsu & Dirty Tricks (45 min)
- [x] Study guide §3–§4
- [ ] Flashcards G–I
- [x] 4 jiujitsu principles + 5 moves + 3 attack→response

### Block 3 — Non-GTY Readings (60 min)
- [x] Study guide §6
- [x] Argyris 4 Model I values + single/double-loop

### Block 4 — Practice Essays (90 min)
- [x] Q6 (Jiujitsu), Q7 (Dirty Tricks), Q8 (Full PN)

### Block 5 — Morning Prep
- [ ] Re-read Quick Stock Phrases
- [ ] Speed Drill

## Priority Tiers
If only 2 hours: Block 1 + 2 + Stock Phrases + Q6 + Q8.
If 1 hour: §1–§5 skim + Speed Drill + Q6.

## Skip (not exam-priority)
- Cross-cultural material (Weeks 5–7)
- Three Conversations beyond identity
- Multiparty, Boehm, TALK`},

    { slug: "ba365-midterm-1-flashcards", title:"BA365 Midterm 1 — Flashcards", type:"analysis", course:"BA365", tags:["midterm-1","flashcards"], updated:"2026-04-21", created:"2026-04-21",
      body: `# BA365 Midterm 1 — Flashcards

~100 rapid-drill Q&A across all midterm material. Sections A–P.

- A–F: GTY framework
- G–I: Jiujitsu, Dirty Tricks
- J–O: Peppet/Moffitt, Korobkin/Guthrie, DC Ch. 6, Kupfer Schneider, Kraybill
- P: Quick Stock Phrases

See [[ba365-midterm-1-study-guide]] and [[ba365-midterm-1-predicted-questions]].`},

    { slug: "ba365-midterm-1-predicted-questions", title:"BA365 Midterm 1 — Predicted Questions", type:"analysis", course:"BA365", tags:["midterm-1"], updated:"2026-04-21", created:"2026-04-21",
      body: `# BA365 Midterm 1 — Predicted Questions

15 practice exam questions with full answer keys. Includes scenario applications and integration essays.`},

    { slug: "writing-style-guide", title:"Writing Style Guide", type:"analysis", course:"Personal", tags:["writing"], updated:"2026-04-19", created:"2026-04-15",
      body: `# Writing Style Guide

Andrew's voice across two registers.

## Analyst Mode (equity research)
- Data-rich, parenthetical figures
- End paragraphs with implications
- "I think / I'd argue" when stating variant view
- Recommendation first, evidence second

## Collegiate Mode (essays, reflections, emails) — default
- Confident opener, direct claim
- Andrew's transition: "Given that..."
- Trim over-qualifiers
- No press-briefing voice
- No forced numbers in non-analytical writing

Derived from [[bro-report]], [[ncno-report]], [[on-report]].`},

    { slug: "grocery-list-2026-04-20", title:"Grocery List — 2026-04-20", type:"analysis", course:"Personal", tags:["grocery","meal-plan"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Grocery List — 2026-04-20

Consolidated list for 5 recipes. Total yield: ~22 servings.

## Recipes covered
- [[shakshuka]] — 4
- [[honey-soy-glazed-salmon]] — 2
- [[one-pot-taco-soup]] — 6
- [[one-pot-tuscan-pasta]] — 4
- [[chicken-alfredo-penne]] — 6

## 🥬 Produce
- 2 small onions, 1 red bell pepper, 1 shallot
- Garlic (2 heads, ~11 cloves), fresh ginger, cherry tomatoes, baby spinach
- Fresh parsley, cilantro, 1–2 avocados, 1–2 limes

## 🥩 Protein
- Skinless salmon — 12 oz
- Ground beef — 1 lb
- Chicken breasts — 1½ lb
- 6 large eggs

## 🧀 Dairy
- Butter, whole milk, Parmesan block (8 oz), feta, cheddar, sour cream

## 🥫 Canned / Pantry
- Fire-roasted crushed tomatoes, diced tomatoes, tomato sauce, tomato paste, sun-dried tomatoes
- Kidney/black beans, corn, chicken broth, soy sauce, honey

## 🍝 Pasta / Bread
- Penne (24 oz), pita, tortilla chips, pico de gallo`},

    { slug: "mgmt335-interview-entrepreneur-writeup", title:"MGMT335 — Interview an Entrepreneur (Writeup)", type:"analysis", course:"MGMT335", tags:["assignment","interview"], updated:"2026-04-19", created:"2026-04-19",
      body: `# MGMT335 — Interview an Entrepreneur

Writeup for the 2026-04-20 assignment. Subject: [[isaiah-fentress]] of [[fentress-technologies]].

## Sections
1. **Mini-biography** (~550 words)
2. **Reflection** (~440 words) — anchored to [[bird-in-hand-principle]], [[high-growth-vs-small-business]], [[customer-discovery]]
3. **Q&A Appendix** — 13 questions

Reflection explicitly connects Fentress Tech's means-driven model to Andrew's Boundless VC work and BlackRock summer ahead.`},

    // ===== SOURCES =====
    { slug: "ba365-syllabus", title:"BA365 Syllabus", type:"source", course:"BA365", tags:["syllabus"], updated:"2026-04-19", created:"2026-04-19",
      body: `# BA365 Syllabus

Full schedule, grading, policies, AI rules for [[ba365]] Spring 2026 (Moore).

- 10-week schedule
- Grading: 2 midterms (70) + 3 journals (30) + team paper (25) + final reflection+video (40) + participation (35)
- AI: brainstorming/outlining/editing OK; submitting AI-generated text as your own is not
- Exams: Respondus Lockdown`},

    { slug: "gty-ch2-6-book-core", title:"GTY Ch. 2–6 — Book Core", type:"source", course:"BA365", tags:["getting-to-yes"], updated:"2026-04-21", created:"2026-04-21",
      body: `# Getting to Yes — Ch. 2–6

The four pillars + BATNA with direct book quotes.

- Ch. 2 — People
- Ch. 3 — Interests
- Ch. 4 — Options
- Ch. 5 — Criteria
- Ch. 6 — [[batna]]`},

    { slug: "gty-ch7-jiujitsu", title:"GTY Ch. 7 — Negotiation Jiujitsu", type:"source", course:"BA365", tags:["getting-to-yes"], updated:"2026-04-21", created:"2026-04-21",
      body: `# GTY Ch. 7 — Negotiation Jiujitsu

Full chapter source with Turnbull case and 13 stock phrases. See [[negotiation-jiujitsu]].`},

    { slug: "visa-screening-research-notes", title:"Visa Screening Research Notes", type:"source", course:"UOIG", tags:["visa"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Visa Screening Research Notes

Inputs: Gilbert's 1-pager, Visa Q1 FY26 call (2026-01-29), MS TMT fireside with Jack Forestell (2026-03-04). Analyzed in [[visa-uoig-screening]].`},

    { slug: "bro-report", title:"Brown & Brown ($BRO) — Equity Research", type:"source", course:"UOIG", tags:["equity-research"], updated:"2026-04-15", created:"2026-04-15",
      body: `# $BRO Report

Andrew's equity research on Brown & Brown. Writing sample for [[writing-style-guide]].`},

    { slug: "ncno-report", title:"nCino ($NCNO) — Equity Research", type:"source", course:"UOIG", tags:["equity-research"], updated:"2026-04-15", created:"2026-04-15",
      body: `# $NCNO Report

Andrew's equity research on nCino.`},

    { slug: "on-report", title:"Onsemi ($ON) — Equity Research", type:"source", course:"UOIG", tags:["equity-research"], updated:"2026-04-15", created:"2026-04-15",
      body: `# $ON Report

Andrew's equity research on Onsemi.`},

    // ===== RECIPES =====
    { slug: "shakshuka", title:"Shakshuka", type:"source", course:"Recipes", tags:["middle-eastern","vegetarian","breakfast"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Shakshuka

Love & Lemons · Serves 4 · 35 min

Eggs gently poached in a spiced bell pepper and tomato sauce.

## Ingredients
- 2 tbsp olive oil
- 1 small white onion, diced
- 1 red bell pepper, diced
- 3 garlic cloves, minced
- 1 tsp cumin, ½ tsp paprika, pinch cayenne
- 1 (28 oz) can fire-roasted crushed tomatoes
- 6 large eggs
- ¼ cup parsley or cilantro
- ¼ cup crumbled feta
- Pita

## Method
Sauté onion+pepper 5–8 min. Add spices 30 sec. Add tomatoes, simmer 15 min. Well the sauce, crack eggs, cover, cook 4–8 min.`},

    { slug: "instant-pot-chicken-tikka-masala", title:"Instant Pot Chicken Tikka Masala", type:"source", course:"Recipes", tags:["indian","chicken","pressure-cooker"], updated:"2026-04-22", created:"2026-04-22",
      body: `# Instant Pot Chicken Tikka Masala

savorytooth.com · Serves 4 · 20 min prep + 1 hr marinade + 20 min cook

Marinade-based technique: yogurt + garam masala marinade ≥1 hr, sear on sauté mode, pressure-cook 10 min, finish with cream on low sauté.

**Key rules**: marinate ≥1 hr, cream goes in *after* pressure cooking (prevents curdling), quick pressure release.`},

    { slug: "honey-soy-glazed-salmon", title:"Honey-Soy Glazed Salmon", type:"source", course:"Recipes", tags:["asian","salmon"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Honey-Soy Glazed Salmon

Serves 2. 12 oz skinless salmon, ⅓ cup soy sauce, ⅓ cup honey, 4 garlic, 2 tsp ginger.`},

    { slug: "one-pot-taco-soup", title:"One-Pot Taco Soup", type:"source", course:"Recipes", tags:["mexican","beef","soup"], updated:"2026-04-20", created:"2026-04-20",
      body: `# One-Pot Taco Soup

Serves 6. 1 lb ground beef, onion, kidney beans, black beans, corn, diced tomatoes, tomato sauce, taco seasoning.`},

    { slug: "one-pot-tuscan-pasta", title:"One-Pot Tuscan Pasta", type:"source", course:"Recipes", tags:["italian","vegetarian","pasta"], updated:"2026-04-20", created:"2026-04-20",
      body: `# One-Pot Tuscan Pasta

Serves 4. Penne, shallot, garlic, sun-dried tomatoes, cherry tomatoes, baby spinach, parmesan, chicken broth, milk.`},

    { slug: "chicken-alfredo-penne", title:"Chicken Alfredo Penne", type:"source", course:"Recipes", tags:["italian","chicken","pasta"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Chicken Alfredo Penne

Serves 6. 1½ lb chicken breast, 16 oz penne, ¾ cup parmesan, 2 cups milk, butter, flour, garlic, parsley.`},

    { slug: "banh-mi-sandwich", title:"Banh Mi Sandwich", type:"source", course:"Recipes", tags:["vietnamese","vegetarian"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Banh Mi (Tofu)`},

    { slug: "minestrone-soup", title:"Minestrone Soup", type:"source", course:"Recipes", tags:["italian","vegetarian","soup"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Minestrone Soup`},

    { slug: "slow-cooker-chicken-enchiladas", title:"Slow Cooker Chicken Enchiladas", type:"source", course:"Recipes", tags:["mexican","chicken"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Slow Cooker Chicken Enchiladas`},

    { slug: "slow-cooker-pulled-pork", title:"Slow Cooker Pulled Pork", type:"source", course:"Recipes", tags:["american","pork"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Slow Cooker Pulled Pork`},

    { slug: "roasted-pork-loin", title:"Roasted Pork Loin", type:"source", course:"Recipes", tags:["american","pork"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Roasted Pork Loin`},

    { slug: "hasselback-potatoes", title:"Hasselback Potatoes", type:"source", course:"Recipes", tags:["american","side","vegetarian"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Hasselback Potatoes`},

    { slug: "maple-cheesecake", title:"Maple Cheesecake", type:"source", course:"Recipes", tags:["american","dessert"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Maple Cheesecake`},

    { slug: "easy-apple-pie", title:"Easy Apple Pie", type:"source", course:"Recipes", tags:["american","dessert"], updated:"2026-04-20", created:"2026-04-20",
      body: `# Easy Apple Pie`},
  ];

  // Raw files not yet ingested (derived from actual raw/ folder minus ingested ones)
  const rawUningested = [
    { path: "raw/7 element preparation sheet.doc", size: "24 KB", added: "2026-03-30", suggestedCourse: "BA365", note: "Harvard 7-element negotiation prep template — likely Journal prompt" },
    { path: "raw/Cultural-Identity-Memo-BA365.docx", size: "18 KB", added: "2026-04-10", suggestedCourse: "BA365", note: "Team project prompt for cross-cultural paper (due 2026-05-20)" },
    { path: "raw/BA365 2B-F24 Slides.pdf", size: "2.1 MB", added: "2026-04-15", suggestedCourse: "BA365", note: "F24 version of 2B — compare against S26 slides" },
    { path: "raw/SP26 Pro Edge Programs.pdf", size: "480 KB", added: "2026-04-16", suggestedCourse: "Personal", note: "Career programs catalog — scan for opportunities" },
    { path: "raw/MGMT335/Ethena-mini-case.pdf", size: "340 KB", added: "2026-04-02", suggestedCourse: "MGMT335", note: "Week 2 mini-case, flagged in log but not yet ingested" },
    { path: "raw/MGMT335/Rivian-HowIBuiltThis-transcript.md", size: "52 KB", added: "2026-04-08", suggestedCourse: "MGMT335", note: "Class 4 assigned listening — timeline + founder lessons" },
    { path: "raw/MGMT335/Case-Method-Handout.pdf", size: "200 KB", added: "2026-04-02", suggestedCourse: "MGMT335", note: "How to prep for case-method classes" },
  ];

  // Wiki todos extracted from pages (> [!todo] callouts)
  const todos = [
    { page: "ba365", text: "Pick the specific negotiation skill to track across video compilation before Midterm 1 prep.", due: "2026-04-20", done: false },
    { page: "ba365-midterm-1-todo", text: "Flashcards G–I (Jiujitsu, Dirty Tricks)", due: "2026-04-21", done: false },
    { page: "ba365-midterm-1-todo", text: "Laptop charged + Respondus Lockdown installed + tested", due: "2026-04-22", done: false },
    { page: "ba365-midterm-1-todo", text: "Re-read Quick Stock Phrases table", due: "2026-04-22", done: false },
    { page: "ba365-midterm-1-todo", text: "Speed Drill (15 Qs, ~30s each)", due: "2026-04-22", done: false },
    { page: "visa-uoig-screening", text: "Deliver a one-to-two-sentence variant perception to Gilbert", due: "2026-04-25", done: false },
    { page: "visa-uoig-screening", text: "Confirm Tall Firs sector allocation (Info Tech, not Financials)", due: "2026-04-25", done: false },
    { page: "ba365", text: "Confirm syllabus points total with Moore (200 vs stated 190)", due: null, done: false },
  ];

  // Assignments (upcoming)
  const assignments = [
    { course: "BA365", title: "Midterm 1 (in class)", due: "2026-04-22", points: 35, priority: "high" },
    { course: "MGMT335", title: "Mid-Term Case Exam", due: "2026-04-27", points: 220, priority: "high" },
    { course: "MGMT335", title: "Team Expectations Agreement", due: "2026-04-29", points: 10, priority: "low" },
    { course: "MGMT335", title: "Finding Your Customer", due: "2026-05-04", points: 40, priority: "med" },
    { course: "BA365", title: "Journal 3 — Coaching", due: "2026-05-06", points: 10, priority: "med" },
    { course: "MGMT335", title: "Opportunity Analysis Project", due: "2026-05-15", points: 180, priority: "high" },
    { course: "BA365", title: "Team Cross-Cultural Paper + Presentation", due: "2026-05-20", points: 25, priority: "high" },
    { course: "BA365", title: "Midterm 2 (in class)", due: "2026-05-27", points: 35, priority: "high" },
    { course: "MGMT335", title: "Opportunity Execution Project", due: "2026-06-05", points: 220, priority: "high" },
    { course: "BA365", title: "Final Journal Reflection + Video", due: "2026-06-08", points: 40, priority: "high" },
  ];

  // Daily ingest activity — last 60 days (for heatmap + sparkline)
  const today = new Date("2026-04-22");
  const activity = [];
  const bursts = {
    "2026-04-14": 4, "2026-04-15": 22, "2026-04-17": 2,
    "2026-04-19": 14, "2026-04-20": 19, "2026-04-21": 15, "2026-04-22": 3,
    "2026-03-30": 1, "2026-04-01": 2, "2026-04-06": 1, "2026-04-08": 3,
    "2026-04-10": 2, "2026-04-11": 1,
  };
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    activity.push({ date: k, count: bursts[k] || 0 });
  }

  // Extract [[wikilinks]] from bodies -> edges
  const slugSet = new Set(pages.map(p => p.slug));
  const edges = [];
  for (const p of pages) {
    const seen = new Set();
    const re = /\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g;
    let m;
    while ((m = re.exec(p.body)) !== null) {
      const target = m[1].trim().toLowerCase();
      if (slugSet.has(target) && target !== p.slug && !seen.has(target)) {
        seen.add(target);
        edges.push({ source: p.slug, target });
      }
    }
  }

  // HUD widget seed — calendar, inbox, now playing, active project
  const calendarEvents = [
    // Today
    { id: "e1", date: "2026-04-22", start: "14:30", end: "15:45", title: "Midterm 1 (in class)",          context: "BA365",    kind: "class"    },
    { id: "e2", date: "2026-04-22", start: "16:00", end: "16:45", title: "UOIG Visa sync — Gilbert",      context: "UOIG",     kind: "meeting"  },
    { id: "e3", date: "2026-04-22", start: "18:30", end: "19:30", title: "Run — Prospect Park loop",      context: "Personal", kind: "personal" },
    { id: "e4", date: "2026-04-22", start: "20:00", end: "22:00", title: "Dinner w/ Eliza",                context: "Personal", kind: "personal" },
    // Later in the week
    { id: "e5", date: "2026-04-23", start: "10:00", end: "11:15", title: "MGMT335 lecture",                context: "MGMT335",  kind: "class"    },
    { id: "e6", date: "2026-04-24", start: "17:00", end: "18:30", title: "Tall Firs weekly",               context: "UOIG",     kind: "meeting"  },
    { id: "e7", date: "2026-04-25", start: "09:00", end: "10:00", title: "Andrew ↔ Natasha office hour",  context: "MGMT335",  kind: "meeting"  },
    { id: "e8", date: "2026-04-26", start: "11:00", end: "12:00", title: "BA365 study group",              context: "BA365",    kind: "meeting"  },
    { id: "e9", date: "2026-04-27", start: "13:00", end: "15:00", title: "MGMT335 Mid-Term Case Exam",     context: "MGMT335",  kind: "class"    },
  ];

  const inbox = [
    // Work
    { id: "m1", category: "work", from: "Emily Moore",       initials: "EM", subject: "Midterm 1 — arrive by 2:25",        preview: "Room 250D, bring a pen. Lockdown Browser required for MC section.", urgent: true,  ageHours: 12 },
    { id: "m2", category: "work", from: "Natasha Overmeyer", initials: "NO", subject: "Case exam format reminder",          preview: "See the rubric attached — 3 free-response prompts, 2hr.",           urgent: false, ageHours: 48 },
    { id: "m3", category: "work", from: "Gilbert Knight",    initials: "GK", subject: "Visa screening — AVG comp set",      preview: "I pulled the 5-yr multiples chart, thoughts before Thursday?",       urgent: false, ageHours: 5  },
    { id: "m4", category: "work", from: "BlackRock Recruiting", initials: "BR", subject: "Summer 2026 — welcome packet",     preview: "Onboarding docs, start date confirmation, and benefits enrollment.", urgent: false, ageHours: 30 },
    // Personal
    { id: "m5", category: "personal", from: "Eliza N.",      initials: "EN", subject: "8pm still on? Booked Rule of Thirds",preview: "Williamsburg. Happy to reschedule if you're swamped.",               urgent: false, ageHours: 2  },
    { id: "m6", category: "personal", from: "Mom",           initials: "MH", subject: "Call when you have a sec",            preview: "Nothing urgent — just want to catch up about Easter plans.",         urgent: false, ageHours: 18 },
    { id: "m7", category: "personal", from: "REI",           initials: "RE", subject: "Your trail runners shipped",          preview: "Arriving Thursday via UPS. Tracking inside.",                        urgent: false, ageHours: 42 },
    // Slack
    { id: "m8", category: "slack",    from: "#uoig-financials", initials: "UF", subject: "@channel: anyone have the Visa 10-Q?", preview: "Brody: need the Q3 segment breakdown for tomorrow's memo",            urgent: true,  ageHours: 3  },
    { id: "m9", category: "slack",    from: "Jake D.",         initials: "JD", subject: "dm",                                   preview: "you going to the game sat? got an extra ticket",                     urgent: false, ageHours: 6  },
    { id: "mA", category: "slack",    from: "#ba365-study",    initials: "BS", subject: "Moore's review doc dropped",           preview: "Eva pinned it — covers BATNA + jiujitsu sections",                   urgent: false, ageHours: 14 },
  ];

  const nowPlaying = {
    title: "Harvest Moon",
    artist: "Neil Young",
    album: "Harvest Moon '92",
    positionSec: 102,
    durationSec: 303,
    waveform: [0.20,0.35,0.60,0.82,0.75,0.55,0.32,0.22,0.40,0.58,0.78,0.92,0.70,0.50,0.38,0.30,0.48,0.68,0.88,0.80,0.62,0.42,0.30,0.48,0.70,0.90,1.00,0.82,0.60,0.42,0.24,0.15],
  };

  const activeProject = {
    title: "BA365 Midterm 1",
    course: "BA365",
    due: "2026-04-22",
    progress: 0.68,
    checklist: [
      { text: "Flashcards G–I (Jiujitsu, Dirty Tricks)", done: true  },
      { text: "Midterm 1 Study Guide review",             done: true  },
      { text: "Predicted Questions pass",                  done: true  },
      { text: "Speed Drill (15 Qs, ~30s each)",           done: false },
      { text: "Laptop + Lockdown Browser tested",          done: false },
    ],
  };

// UOIG Financials holdings — 8 names currently in book. Thesis state = intact | watch | revise | broken.
  const uoigHoldings = [
    {
      ticker: "UMB",   name: "UMB Financial",       weight: 9.1,
      price: 98.42,  changePct:  0.82, sinceEntryPct:  7.8,
      thesis: "intact", thesisNote: "Deposit franchise holding up, NIM inflecting into '26.",
      news: { headline: "UMB prices $400M sub notes; Moody's affirms rating", source: "Reuters", ageHours: 18 },
    },
    {
      ticker: "C",     name: "Citigroup",           weight: 13.4,
      price: 72.18,  changePct: -0.41, sinceEntryPct: 12.3,
      thesis: "watch", thesisNote: "Fraser reorg still mid-execution; expense-out timeline is the swing factor.",
      news: { headline: "Citi names new head of Global Wealth as Fraser reshuffle continues", source: "WSJ", ageHours: 3 },
    },
    {
      ticker: "EVR",   name: "Evercore",            weight: 11.8,
      price: 242.57, changePct:  1.94, sinceEntryPct: 22.1,
      thesis: "intact", thesisNote: "M&A backlog rebuilding; advisory fee leverage intact.",
      news: { headline: "Evercore M&A backlog up 22% QoQ; advisory fees a bright spot", source: "Bloomberg", ageHours: 48 },
    },
    {
      ticker: "SPG",   name: "Simon Property",      weight: 14.6,
      price: 168.30, changePct:  0.12, sinceEntryPct:  4.1,
      thesis: "intact", thesisNote: "A-mall rent spreads +5% YoY; Klepierre monetization a kicker.",
      news: { headline: "Simon Property sells stake in Klepierre JV for $1.1B", source: "Barron's", ageHours: 26 },
    },
    {
      ticker: "CTRE",  name: "CareTrust REIT",      weight: 7.2,
      price:  29.84, changePct:  0.54, sinceEntryPct: 11.7,
      thesis: "intact", thesisNote: "SNF coverage improving, acquisition pipeline > $300M.",
      news: { headline: "CareTrust REIT raises dividend 3.2%; acquires 4 skilled-nursing assets", source: "Seeking Alpha", ageHours: 96 },
    },
    {
      ticker: "FOR",   name: "Forestar",            weight: 6.4,
      price:  33.12, changePct: -2.18, sinceEntryPct: -5.6,
      thesis: "revise", thesisNote: "Home-builder cycle weakening; DHI order book softer than expected.",
      news: { headline: "Forestar guides FY26 closings to low-single-digit growth", source: "Reuters", ageHours: 144 },
    },
    {
      ticker: "BRK.B", name: "Berkshire Hathaway",  weight: 22.8,
      price: 472.11, changePct:  0.28, sinceEntryPct:  9.4,
      thesis: "intact", thesisNote: "Cash pile optionality; float growth + reinsurance pricing strong.",
      news: { headline: "Berkshire trims Apple stake to ~300M shares per latest 13F", source: "CNBC", ageHours: 20 },
    },
    {
      ticker: "AXOS",  name: "Axos Financial",      weight: 14.7,
      price:  82.46, changePct:  1.12, sinceEntryPct:  6.8,
      thesis: "watch", thesisNote: "CRE exposure manageable but needs ongoing monitoring.",
      news: { headline: "Axos beats Q2 EPS; loan growth re-accelerates", source: "Bloomberg", ageHours: 12 },
    },
  ];

  const claudeSkills = [
    { name: "andrew-write",              uses: 47, lastUsedDaysAgo: 1, category: "Writing" },
    { name: "find-auction-prospects",    uses: 28, lastUsedDaysAgo: 3, category: "Auctogon" },
    { name: "sales:account-research",    uses: 19, lastUsedDaysAgo: 2, category: "Sales" },
    { name: "finance:variance-analysis", uses: 14, lastUsedDaysAgo: 6, category: "Finance" },
    { name: "review",                    uses:  9, lastUsedDaysAgo: 2, category: "Code" },
  ];

  return { pages, edges, rawUningested, todos, assignments, activity, calendarEvents, inbox, nowPlaying, activeProject, claudeSkills, uoigHoldings };
})();
