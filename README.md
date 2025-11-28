# Nets Front Office - Transaction Evaluator

A web application for the Brooklyn Nets front office to research and evaluate NBA transactions (trades, signings, waivers, extensions) from across the league over the past 5 years.

**Purpose:** Enable data-driven evaluation of league-wide transactions to inform future trades, signings, and roster moves with the ultimate goal of winning a championship.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | MongoDB (Mongoose ODM) |
| Deployment | Vercel |
| Data Pipeline | Python scripts (initial seeding) |

---

## Data Sources

| Source | Data Type | Access Method | Cost |
|--------|-----------|---------------|------|
| [nba_api](https://github.com/swar/nba_api) | Player stats, game logs, team rosters | Python package | Free (MIT) |
| [BallDontLie API](https://docs.balldontlie.io/) | Player contracts (cap_hit, salary, years) | REST API | Free tier |
| [Basketball-Reference](https://www.basketball-reference.com/leagues/NBA_2025_transactions.html) | Transaction history (5 years) | Web scrape | Free |
| [Spotrac](https://www.spotrac.com/nba/cba) | Cap history, CBA rules, contract details | Web scrape | Free |
| [NBA.com](https://www.nba.com/players/transactions) | Official transaction feed | Web scrape | Free |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                           (Next.js App)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│   │  Dashboard   │    │ Transactions │    │  Transaction Detail      │  │
│   │    View      │    │   Browser    │    │      Deep-Dive           │  │
│   │   (home)     │    │   (list)     │    │      (single)            │  │
│   └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│          │                   │                        │                  │
│          └───────────────────┴────────────────────────┘                  │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │   React Query     │                                │
│                    │   (data layer)    │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────┐
│                              │         API LAYER                         │
│                    ┌─────────▼─────────┐                                │
│                    │  Next.js API      │                                │
│                    │    Routes         │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│   ┌──────────────────────────┼──────────────────────────────────────┐   │
│   │                          │                                       │   │
│   │  /api/transactions  /api/players  /api/teams  /api/evaluation   │   │
│   │  /api/salary-cap    /api/contracts                               │   │
│   │                                                                  │   │
│   └──────────────────────────┬──────────────────────────────────────┘   │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────┐
│                              │         DATA LAYER                        │
│                    ┌─────────▼─────────┐                                │
│                    │     Mongoose      │                                │
│                    │       ODM         │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │     MongoDB       │                                │
│                    │    (Atlas)        │                                │
│                    └───────────────────┘                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Collections

#### `transactions`
Primary collection storing all NBA transactions.

```typescript
{
  _id: ObjectId,
  type: enum ['TRADE', 'SIGNING', 'WAIVER', 'EXTENSION', 'TWO_WAY',
              'TEN_DAY', 'DRAFT_PICK', 'BUYOUT', 'SIGN_AND_TRADE'],
  date: Date,
  season: string,                    // "2024-25"

  // Parties involved
  teams: [{
    teamId: ObjectId,                // ref: teams
    role: enum ['acquired', 'traded', 'signed', 'waived'],
    assetsIn: [{
      type: enum ['player', 'pick', 'cash'],
      playerId?: ObjectId,
      pickDetails?: {
        year: number,
        round: number,
        originalTeam: string,
        protections?: string
      },
      cashAmount?: number
    }],
    assetsOut: [{ /* same structure */ }],
    salaryIn: number,
    salaryOut: number,
    netCapImpact: number
  }],

  players: [ObjectId],               // ref: players (all involved)
  contracts: [ObjectId],             // ref: contracts (new/modified)

  // Raw transaction details
  details: {
    headline: string,                // "Lakers trade Russell to Nets"
    description: string,             // Full transaction description
    source: string,                  // "Basketball-Reference"
    sourceUrl?: string
  },

  // Computed evaluation scores
  evaluation: {
    surplusValue: number,            // $ difference: player value vs contract
    winNowScore: number,             // 0-100
    rebuildScore: number,            // 0-100
    capFlexibilityImpact: number,    // +/- cap space created
    riskScore: number,               // 0-100 (injury, age, fit)
    historicalComparisons: [{
      transactionId: ObjectId,
      similarityScore: number,       // 0-1
      outcome?: string               // retrospective grade if available
    }],
    compositeScore: number           // weighted aggregate (0-100)
  },

  createdAt: Date,
  updatedAt: Date
}
```

#### `players`
All NBA players (current and recent).

```typescript
{
  _id: ObjectId,
  nbaId: number,                     // NBA.com player ID
  name: {
    full: string,
    first: string,
    last: string
  },

  // Bio
  position: string,                  // "PG", "SG-SF", etc.
  height: number,                    // inches
  weight: number,                    // lbs
  birthDate: Date,
  age: number,                       // computed
  country: string,

  // Draft info
  draft: {
    year: number,
    round: number,
    pick: number,
    team: string
  },

  // Current status
  currentTeamId: ObjectId,           // ref: teams
  status: enum ['active', 'inactive', 'retired', 'gleague'],

  // Career trajectory data (for valuation)
  trajectory: {
    peakAge: number,                 // estimated peak
    careerArc: enum ['ascending', 'peak', 'declining', 'unknown'],
    injuryHistory: [{
      season: string,
      type: string,
      gamesOut: number
    }],
    seasonStats: [{                  // last 5 seasons
      season: string,
      team: string,
      gamesPlayed: number,
      mpg: number,
      ppg: number,
      rpg: number,
      apg: number,
      per: number,                   // Player Efficiency Rating
      ws: number,                    // Win Shares
      vorp: number,                  // Value Over Replacement
      bpm: number                    // Box Plus/Minus
    }]
  },

  imageUrl: string,

  createdAt: Date,
  updatedAt: Date
}
```

#### `contracts`
Player contract details.

```typescript
{
  _id: ObjectId,
  playerId: ObjectId,                // ref: players
  teamId: ObjectId,                  // ref: teams

  // Contract terms
  type: enum ['standard', 'two-way', 'ten-day', 'max', 'supermax',
              'rookie', 'veteran-min', 'mid-level', 'bi-annual'],
  startSeason: string,               // "2024-25"
  endSeason: string,                 // "2027-28"
  years: number,
  totalValue: number,

  // Season-by-season breakdown
  seasons: [{
    season: string,
    salary: number,
    capHit: number,
    deadCap: number,                 // if waived
    guaranteed: number,
    bonuses?: number
  }],

  // Contract options & clauses
  options: {
    playerOption?: { season: string, value: number },
    teamOption?: { season: string, value: number },
    earlyTermination?: { season: string }
  },
  tradeKicker: number,               // percentage
  noTradeClause: boolean,
  tradeRestriction?: string,         // "can veto trades to X teams"

  // Signing context
  signingType: enum ['free-agent', 'extension', 'rookie', 'trade'],
  signedDate: Date,

  status: enum ['active', 'completed', 'waived', 'traded'],

  createdAt: Date,
  updatedAt: Date
}
```

#### `teams`
NBA teams reference data.

```typescript
{
  _id: ObjectId,
  nbaId: number,
  name: string,                      // "Nets"
  city: string,                      // "Brooklyn"
  fullName: string,                  // "Brooklyn Nets"
  abbreviation: string,              // "BKN"
  conference: enum ['East', 'West'],
  division: string,                  // "Atlantic"

  // Current cap situation (updated seasonally)
  capSheet: {
    season: string,
    totalSalary: number,
    capSpace: number,
    luxuryTaxSpace: number,
    apronRoom: number,
    projectedTax: number,
    draftPicks: [{
      year: number,
      round: number,
      originalTeam: string,
      status: enum ['owned', 'owed', 'conditional'],
      protections?: string
    }]
  },

  logoUrl: string,
  primaryColor: string,
  secondaryColor: string,

  createdAt: Date,
  updatedAt: Date
}
```

#### `salaryCapHistory`
Historical salary cap data for calculations.

```typescript
{
  _id: ObjectId,
  season: string,                    // "2024-25"

  // Cap thresholds
  salaryCap: number,
  luxuryTax: number,
  firstApron: number,                // null before 2023-24
  secondApron: number,               // null before 2023-24

  // BRI data
  bri: number,                       // Basketball Related Income
  playerShare: number,               // percentage

  // Salary scales
  minimumSalary: {
    years0: number,                  // 0 years experience
    years1: number,
    years2: number,
    // ... up to years10Plus
  },

  maxSalary: {
    years0to6: { percentage: number, value: number },   // 25% of cap
    years7to9: { percentage: number, value: number },   // 30% of cap
    years10Plus: { percentage: number, value: number }  // 35% of cap
  },

  // Exception values
  exceptions: {
    midLevel: number,
    midLevelTaxpayer: number,
    biAnnual: number,
    minimumRoster: number
  },

  createdAt: Date
}
```

#### `evaluationWeights`
User-configurable weights for composite scoring.

```typescript
{
  _id: ObjectId,
  name: string,                      // "Default", "Win-Now Focus", etc.
  isDefault: boolean,

  weights: {
    surplusValue: number,            // 0-1, default 0.25
    winNow: number,                  // 0-1, default 0.25
    rebuild: number,                 // 0-1, default 0.15
    capFlexibility: number,          // 0-1, default 0.20
    risk: number,                    // 0-1, default 0.15
    // must sum to 1.0
  },

  createdAt: Date,
  updatedAt: Date
}
```

---

## API Routes

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List all transactions (paginated, filterable) |
| GET | `/api/transactions/[id]` | Get single transaction with full details |
| GET | `/api/transactions/search` | Full-text search transactions |

**Query Parameters for `/api/transactions`:**
- `type` - Filter by transaction type (comma-separated)
- `team` - Filter by team ID or abbreviation
- `player` - Filter by player ID
- `season` - Filter by season (e.g., "2024-25")
- `dateFrom` / `dateTo` - Date range
- `minSalary` / `maxSalary` - Salary range
- `minScore` / `maxScore` - Composite score range
- `sort` - Sort field (date, score, salary)
- `order` - asc/desc
- `page` / `limit` - Pagination

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | List players (paginated) |
| GET | `/api/players/[id]` | Get player with contracts & trajectory |
| GET | `/api/players/[id]/transactions` | Get player's transaction history |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/[id]` | Get team with cap sheet |
| GET | `/api/teams/[id]/transactions` | Get team's transaction history |

### Salary Cap

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salary-cap` | Get all historical cap data |
| GET | `/api/salary-cap/[season]` | Get specific season's cap data |
| GET | `/api/salary-cap/current` | Get current season cap data |

### Evaluation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/evaluation/weights` | Get current weight configuration |
| PUT | `/api/evaluation/weights` | Update weight configuration |
| POST | `/api/evaluation/calculate` | Recalculate scores with new weights |

---

## Frontend Structure

```
/app
├── layout.tsx                       # Root layout with providers
├── page.tsx                         # Dashboard (home)
├── globals.css                      # Tailwind + custom styles
│
├── /transactions
│   ├── page.tsx                     # Transaction browser (list view)
│   ├── loading.tsx                  # Loading skeleton
│   └── /[id]
│       ├── page.tsx                 # Transaction deep-dive
│       └── loading.tsx
│
├── /players
│   └── /[id]
│       └── page.tsx                 # Player profile (future)
│
├── /teams
│   └── /[id]
│       └── page.tsx                 # Team profile (future)
│
└── /api
    ├── /transactions/...
    ├── /players/...
    ├── /teams/...
    ├── /salary-cap/...
    └── /evaluation/...

/components
├── /ui                              # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── badge.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── dialog.tsx
│   └── ...
│
├── /layout
│   ├── Header.tsx                   # App header with nav
│   ├── Sidebar.tsx                  # Filter sidebar (future)
│   └── Footer.tsx
│
├── /transactions
│   ├── TransactionCard.tsx          # Card view for single transaction
│   ├── TransactionTable.tsx         # Table view for transaction list
│   ├── TransactionFilters.tsx       # Filter controls
│   ├── TransactionDetail.tsx        # Full transaction detail view
│   ├── TransactionTimeline.tsx      # Visual timeline of transaction
│   └── AssetFlow.tsx                # Visual asset exchange diagram
│
├── /players
│   ├── PlayerCard.tsx               # Compact player info card
│   ├── PlayerAvatar.tsx             # Player image with fallback
│   ├── PlayerTrajectory.tsx         # Career arc visualization
│   └── PlayerStats.tsx              # Stats table/chart
│
├── /contracts
│   ├── ContractSummary.tsx          # Contract overview
│   ├── ContractBreakdown.tsx        # Year-by-year salary table
│   └── ContractPill.tsx             # Compact contract badge
│
├── /evaluation
│   ├── CompositeScore.tsx           # Large score display
│   ├── ScoreBreakdown.tsx           # Individual metric scores
│   ├── WeightSliders.tsx            # Adjustable weight controls
│   ├── SimilarDeals.tsx             # Historical comparisons
│   └── EvaluationBadge.tsx          # Small score indicator
│
├── /teams
│   ├── TeamLogo.tsx                 # Team logo with fallback
│   ├── TeamBadge.tsx                # Team name + logo compact
│   └── CapSheet.tsx                 # Team salary cap visualization
│
├── /charts
│   ├── TrajectoryChart.tsx          # Player career arc line chart
│   ├── SalaryChart.tsx              # Contract value over time
│   └── ScoreRadar.tsx               # Evaluation metrics radar chart
│
└── /common
    ├── DraftPickBadge.tsx           # Draft pick display
    ├── MoneyDisplay.tsx             # Formatted currency
    ├── DateDisplay.tsx              # Formatted dates
    ├── LoadingSkeleton.tsx          # Loading states
    └── EmptyState.tsx               # No results display

/lib
├── mongodb.ts                       # MongoDB connection singleton
├── /models
│   ├── Transaction.ts               # Mongoose schema
│   ├── Player.ts
│   ├── Contract.ts
│   ├── Team.ts
│   ├── SalaryCap.ts
│   └── EvaluationWeights.ts
│
├── /evaluation
│   ├── calculate.ts                 # Main scoring orchestrator
│   ├── surplus-value.ts             # Player value vs contract calc
│   ├── win-now.ts                   # Immediate impact scoring
│   ├── rebuild.ts                   # Future value scoring
│   ├── cap-flexibility.ts           # Cap impact calculations
│   ├── risk.ts                      # Risk assessment
│   └── historical-match.ts          # Similar transaction finder
│
├── /utils
│   ├── salary-cap.ts                # CBA calculation helpers
│   ├── formatting.ts                # Display formatters
│   ├── filters.ts                   # Query building helpers
│   └── constants.ts                 # Enums, static values
│
└── /hooks
    ├── useTransactions.ts           # Transaction data fetching
    ├── usePlayers.ts
    ├── useTeams.ts
    ├── useEvaluation.ts
    └── useFilters.ts                # Filter state management
```

---

## Page Designs

### Dashboard (`/`) - HOME PAGE

The dashboard provides a high-level overview of recent league activity and key metrics.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏀 NETS TRANSACTION EVALUATOR                        [Weight Settings] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    LEAGUE ACTIVITY SUMMARY                          ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │  Trades  │ │ Signings │ │ Waivers  │ │Extensions│ │  Total   │  ││
│  │  │    47    │ │   156    │ │    89    │ │    34    │ │   326    │  ││
│  │  │ (12 mo)  │ │ (12 mo)  │ │ (12 mo)  │ │ (12 mo)  │ │ (12 mo)  │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │     HIGHEST RATED DEALS       │ │      RECENT TRANSACTIONS       │  │
│  │         (Last 12 mo)          │ │          (Last 7 days)         │  │
│  │  ┌──────────────────────────┐ │ │  ┌──────────────────────────┐  │  │
│  │  │ 1. OKC acquires Caruso   │ │ │  │ • BKN signs J. Smith     │  │  │
│  │  │    Score: 94             │ │ │  │   2 hours ago            │  │  │
│  │  ├──────────────────────────┤ │ │  ├──────────────────────────┤  │  │
│  │  │ 2. CLE extends Mitchell  │ │ │  │ • LAL trades for C. Wood │  │  │
│  │  │    Score: 91             │ │ │  │   5 hours ago            │  │  │
│  │  ├──────────────────────────┤ │ │  ├──────────────────────────┤  │  │
│  │  │ 3. MIN acquires Randle   │ │ │  │ • MIA waives T. Tucker   │  │  │
│  │  │    Score: 88             │ │ │  │   1 day ago              │  │  │
│  │  └──────────────────────────┘ │ │  └──────────────────────────┘  │  │
│  │            [View All →]       │ │           [View All →]         │  │
│  └────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │     BIGGEST CONTRACTS         │ │      SALARY CAP SNAPSHOT       │  │
│  │        (This Season)          │ │         (2024-25)              │  │
│  │  ┌──────────────────────────┐ │ │  ┌──────────────────────────┐  │  │
│  │  │ Jaylen Brown    $61.0M   │ │ │  │ Salary Cap    $140.6M    │  │  │
│  │  │ Stephen Curry   $55.8M   │ │ │  │ Luxury Tax    $170.8M    │  │  │
│  │  │ Kevin Durant    $51.2M   │ │ │  │ First Apron   $178.1M    │  │  │
│  │  │ LeBron James    $48.7M   │ │ │  │ Second Apron  $188.9M    │  │  │
│  │  │ Joel Embiid     $51.4M   │ │ │  │                          │  │  │
│  │  └──────────────────────────┘ │ │  │ Rookie Max    $12.2M     │  │  │
│  └────────────────────────────────┘ │  │ Vet Min       $3.3M      │  │  │
│                                      │  └──────────────────────────┘  │  │
│  ┌────────────────────────────────┐ └────────────────────────────────┘  │
│  │      NETS RECENT MOVES        │                                      │
│  │  ┌──────────────────────────┐ │ ┌────────────────────────────────┐  │
│  │  │ Nov 15 - Trade           │ │ │    TRANSACTION TYPE BREAKDOWN  │  │
│  │  │ Acquired: D. Russell     │ │ │         (Last 12 Months)       │  │
│  │  │ Sent: D. Finney-Smith    │ │ │                                │  │
│  │  │ Score: 72                │ │ │    [PIE CHART VISUALIZATION]   │  │
│  │  ├──────────────────────────┤ │ │                                │  │
│  │  │ Oct 28 - Extension       │ │ │  Trades: 14%                   │  │
│  │  │ Cam Thomas - 4yr/$80M    │ │ │  Signings: 48%                 │  │
│  │  │ Score: 85                │ │ │  Waivers: 27%                  │  │
│  │  └──────────────────────────┘ │ │  Extensions: 11%               │  │
│  │        [View All Nets →]      │ │                                │  │
│  └────────────────────────────────┘ └────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dashboard Components:**
- `StatsOverview` - Transaction counts by type
- `TopRatedDeals` - Highest scored transactions
- `RecentActivity` - Latest transactions feed
- `BiggestContracts` - Highest paid players
- `CapSnapshot` - Current salary cap thresholds
- `TeamFocus` - Nets-specific transaction feed
- `TypeBreakdown` - Transaction type distribution chart

---

### Transaction Browser (`/transactions`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏀 NETS TRANSACTION EVALUATOR              [Dashboard] [Transactions]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ [🔍 Search transactions...]                                         ││
│  │                                                                      ││
│  │ Type: [All ▼] Team: [All ▼] Season: [2024-25 ▼] Score: [Any ▼]     ││
│  │                                                                      ││
│  │ Salary Range: [$0] ────────●──────── [$50M+]     [Clear Filters]    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Showing 326 transactions                    Sort: [Date (Newest) ▼]    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ TRADE                                                    Nov 15 '24 ││
│  │ ───────────────────────────────────────────────────────────────────-││
│  │  LAL  ←→  BKN                                          Score: 72    ││
│  │                                                                      ││
│  │  Lakers receive:              Nets receive:                         ││
│  │  • D. Finney-Smith           • D'Angelo Russell                     ││
│  │  • Shake Milton              • Maxwell Lewis                        ││
│  │                              • 2025 2nd (PHX)                        ││
│  │                              • 2027 2nd (LAL)                        ││
│  │                                                                      ││
│  │  Net salary: +$15.8M         Net salary: -$15.8M                    ││
│  │                                                                      ││
│  │  [Win-Now: 65] [Surplus: +$8M] [Cap Flex: +$4.2M]     [View →]      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ SIGNING                                                  Jul 6 '24  ││
│  │ ────────────────────────────────────────────────────────────────────││
│  │  PHI  ←  Paul George                                   Score: 81    ││
│  │                                                                      ││
│  │  4 years / $212,000,000 (max)                                       ││
│  │  $53M AAV | Player option 2027-28                                   ││
│  │                                                                      ││
│  │  [Win-Now: 89] [Surplus: -$12M] [Cap Flex: -$28M]     [View →]      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ EXTENSION                                               Jun 30 '24  ││
│  │ ────────────────────────────────────────────────────────────────────││
│  │  OKC  ←  Chet Holmgren                                 Score: 95    ││
│  │                                                                      ││
│  │  5 years / $238,000,000 (max rookie extension)                      ││
│  │  Starting 2025-26                                                   ││
│  │                                                                      ││
│  │  [Win-Now: 92] [Surplus: +$45M] [Cap Flex: -$35M]     [View →]      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ──────────────────────────────────────────────────────────────────────  │
│                      [← Previous]  Page 1 of 33  [Next →]               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Transaction Deep-Dive (`/transactions/[id]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Transactions                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRADE                                                    November 15, 2024
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         ASSET EXCHANGE                             │ │
│  │                                                                     │ │
│  │    ┌─────────────────┐                ┌─────────────────┐          │ │
│  │    │                 │                │                 │          │ │
│  │    │   [LAL LOGO]    │      ←→        │   [BKN LOGO]    │          │ │
│  │    │    LAKERS       │                │      NETS       │          │ │
│  │    │                 │                │                 │          │ │
│  │    ├─────────────────┤                ├─────────────────┤          │ │
│  │    │   RECEIVES:     │                │   RECEIVES:     │          │ │
│  │    │                 │                │                 │          │ │
│  │    │ D. Finney-Smith │                │ D'Angelo Russell│          │ │
│  │    │   $14.9M        │                │   $18.7M        │          │ │
│  │    │   SF | Age 31   │                │   PG | Age 28   │          │ │
│  │    │                 │                │                 │          │ │
│  │    │ Shake Milton    │                │ Maxwell Lewis   │          │ │
│  │    │   $2.2M         │                │   $2.1M         │          │ │
│  │    │   PG | Age 28   │                │   SF | Age 21   │          │ │
│  │    │                 │                │                 │          │ │
│  │    │                 │                │ 2025 2nd (PHX)  │          │ │
│  │    │                 │                │ 2027 2nd (LAL)  │          │ │
│  │    │                 │                │                 │          │ │
│  │    ├─────────────────┤                ├─────────────────┤          │ │
│  │    │ Total In: $17.1M│                │ Total In: $20.8M│          │ │
│  │    │ Total Out:$20.8M│                │ Total Out:$17.1M│          │ │
│  │    │ Net: -$3.7M     │                │ Net: +$3.7M     │          │ │
│  │    └─────────────────┘                └─────────────────┘          │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│                            EVALUATION                                    │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │   COMPOSITE SCORE                                                  │ │
│  │   ┌──────────────────────────────────────────────────────────────┐ │ │
│  │   │                           72                                  │ │ │
│  │   │   ████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░  │ │ │
│  │   │   0              25              50              75       100 │ │ │
│  │   └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  │   BREAKDOWN                                                        │ │
│  │   ┌─────────────┬─────────────┬─────────────┬─────────────┬──────┐│ │
│  │   │ Surplus Val │  Win-Now    │   Rebuild   │  Cap Flex   │ Risk ││ │
│  │   │   +$8.2M    │     65      │     58      │   +$4.2M    │  32  ││ │
│  │   │   ██████    │   ██████    │   █████     │   ██████    │ ███  ││ │
│  │   └─────────────┴─────────────┴─────────────┴─────────────┴──────┘│ │
│  │                                                                     │ │
│  │   [⚙️ Adjust Weights]                                              │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│                         PLAYERS INVOLVED                                 │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  ┌───────────────────────────────────┐ ┌───────────────────────────────┐│
│  │ D'ANGELO RUSSELL                  │ │ DORIAN FINNEY-SMITH           ││
│  │ ┌─────────┐                       │ │ ┌─────────┐                   ││
│  │ │  [IMG]  │ PG | 28 yrs | 6'4"   │ │ │  [IMG]  │ SF | 31 yrs | 6'7"││
│  │ └─────────┘                       │ │ └─────────┘                   ││
│  │                                   │ │                               ││
│  │ Contract: 1yr / $18.7M            │ │ Contract: 2yr / $29.8M        ││
│  │ Status: Expiring                  │ │ Status: Under contract        ││
│  │                                   │ │                               ││
│  │ 2023-24 Stats:                    │ │ 2023-24 Stats:                ││
│  │ 18.0 PPG | 6.3 APG | 3.1 RPG      │ │ 8.5 PPG | 4.3 RPG | 1.5 APG  ││
│  │ PER: 15.2 | WS: 3.8               │ │ PER: 10.1 | WS: 2.9           ││
│  │                                   │ │                               ││
│  │ Trajectory: ↘ Declining           │ │ Trajectory: → Stable          ││
│  │ ┌─────────────────────────────┐   │ │ ┌─────────────────────────┐   ││
│  │ │ [CAREER ARC MINI CHART]    │   │ │ │ [CAREER ARC MINI CHART] │   ││
│  │ └─────────────────────────────┘   │ │ └─────────────────────────┘   ││
│  │                      [Full Profile→]│ │                [Full Profile→]││
│  └───────────────────────────────────┘ └───────────────────────────────┘│
│                                                                          │
│  [+ View Maxwell Lewis] [+ View Shake Milton]                           │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════│
│                      SIMILAR HISTORICAL DEALS                            │
│  ═══════════════════════════════════════════════════════════════════════│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  93% Similar: Russell Westbrook trade (LAL → WAS, 2023)             ││
│  │  Expiring star PG traded for role players + picks                   ││
│  │  Outcome: Mixed - cap flexibility gained, lost veteran presence     ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │  87% Similar: Kemba Walker trade (NYK → DET, 2022)                  ││
│  │  Declining PG salary dump with draft compensation                   ││
│  │  Outcome: Positive - cleared cap space for future moves             ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │  81% Similar: John Wall buyout (HOU, 2023)                          ││
│  │  Former star PG parting ways via different mechanism                ││
│  │  Outcome: Positive - allowed rebuild to accelerate                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Evaluation Framework

### Scoring Components

| Metric | Description | Range | Weight (default) |
|--------|-------------|-------|------------------|
| **Surplus Value** | Player market value minus contract value | -$50M to +$50M | 25% |
| **Win-Now Score** | Immediate championship impact | 0-100 | 25% |
| **Rebuild Score** | Future asset/development value | 0-100 | 15% |
| **Cap Flexibility** | Space created/consumed relative to cap | -$50M to +$50M | 20% |
| **Risk Score** | Injury, age, fit concerns (inverted) | 0-100 | 15% |

### Composite Score Formula

```
compositeScore = (
  normalize(surplusValue) * weights.surplusValue +
  winNowScore * weights.winNow +
  rebuildScore * weights.rebuild +
  normalize(capFlexibility) * weights.capFlexibility +
  (100 - riskScore) * weights.risk
) * 100
```

### User-Adjustable Weights

Users can adjust weights via the UI to shift evaluation priorities:
- **"Win-Now Mode"**: winNow=0.40, rebuild=0.05
- **"Rebuild Mode"**: rebuild=0.40, winNow=0.10
- **"Cap Conscious"**: capFlexibility=0.35
- **"Custom"**: Any combination summing to 1.0

---

## Salary Cap Reference (2023 CBA)

| Season | Salary Cap | Luxury Tax | First Apron | Second Apron |
|--------|------------|------------|-------------|--------------|
| 2019-20 | $109.1M | $132.6M | - | - |
| 2020-21 | $109.1M | $132.6M | - | - |
| 2021-22 | $112.4M | $136.6M | - | - |
| 2022-23 | $123.7M | $150.3M | - | - |
| 2023-24 | $136.0M | $165.3M | $172.3M | $182.8M |
| 2024-25 | $140.6M | $170.8M | $178.1M | $188.9M |
| 2025-26 | $154.6M | $188.0M | ~$196M | ~$208M |

**Key CBA Rules:**
- Max 10% year-over-year cap increase
- Second apron teams cannot aggregate salaries in trades
- BRI formula: `Cap = (BRI × 44.74%) ÷ 30`

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Python 3.10+ (for data seeding scripts)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd nets-transaction-evaluator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI

# Run development server
npm run dev
```

### Environment Variables

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nets-evaluator
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Data Pipeline

### Initial Seeding (Python)

```bash
cd scripts/
pip install -r requirements.txt
python seed_teams.py          # Seed 30 NBA teams
python seed_players.py        # Seed players from nba_api
python seed_contracts.py      # Seed contracts from BallDontLie
python seed_transactions.py   # Seed 5 years of transactions
python seed_salary_cap.py     # Seed historical cap data
python calculate_evaluations.py  # Compute initial scores
```

### Future: Live Updates
- Webhook integration for real-time transaction alerts
- Scheduled jobs to refresh data from sources
- Manual import UI for breaking news

---

## Phase Roadmap

### Phase 1 (Current)
- [x] Architecture design
- [ ] Project scaffolding (Next.js + shadcn/ui)
- [ ] MongoDB schema implementation
- [ ] Data seeding scripts
- [ ] Transaction browser page
- [ ] Transaction detail page
- [ ] Basic evaluation scoring

### Phase 2
- [ ] Dashboard home page
- [ ] Advanced filtering
- [ ] Player profiles
- [ ] Team profiles

### Phase 3
- [ ] Side-by-side transaction comparison
- [ ] "What-if" scenario modeling
- [ ] Nets-specific recommendations
- [ ] Export/reporting features

### Phase 4
- [ ] Live data integration
- [ ] Mobile responsive design
- [ ] User authentication (optional)
- [ ] Saved searches & alerts

---

## License

Internal use only - Brooklyn Nets Front Office
