# NBA Transaction Evaluator - Data Seeding Scripts

This directory contains Python scripts to seed the MongoDB database with NBA data for the Nets Transaction Evaluator application.

## Overview

The seeding pipeline populates the database with:
- 30 NBA teams with logos and colors
- Active NBA players with biographical data and career statistics
- Player contracts (sample data for demonstration)
- Salary cap history (2019-20 through 2025-26)
- NBA transactions (sample data for demonstration)
- Evaluation scores for all transactions

## Prerequisites

- Python 3.10 or higher
- MongoDB Atlas account or local MongoDB instance
- MongoDB connection URI configured in `.env.local`

## Setup

### 1. Create Python Virtual Environment

```bash
cd scripts/
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Ensure your `.env.local` file in the project root contains:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nets-evaluator
```

The Python scripts will automatically read from this file.

## Running the Scripts

### Recommended Order

Run the scripts in this order to properly populate the database:

```bash
# 1. Seed NBA teams (30 teams)
python seed_teams.py

# 2. Seed salary cap history (7 seasons: 2019-20 through 2025-26)
python seed_salary_cap.py

# 3. Seed NBA players (400+ active players)
# Note: This takes ~10-15 minutes due to API rate limits
python seed_players.py

# 4. Seed player contracts (sample data)
python seed_contracts.py

# 5. Seed transactions (sample data)
python seed_transactions.py

# 6. Calculate evaluation scores for all transactions
python calculate_evaluations.py
```

### All-in-One Script (Optional)

For convenience, you can run all scripts sequentially:

```bash
./run_all_seeds.sh
```

Or manually:

```bash
python seed_teams.py && \
python seed_salary_cap.py && \
python seed_players.py && \
python seed_contracts.py && \
python seed_transactions.py && \
python calculate_evaluations.py
```

## Script Details

### seed_teams.py

**Purpose:** Seeds all 30 NBA teams with official data from nba_api.

**Data Source:** `nba_api.stats.static.teams`

**Output:**
- 30 teams inserted/updated
- Team logos, colors, divisions, conferences

**Runtime:** ~5 seconds

**Notes:**
- Team colors are manually curated (not available in nba_api)
- Logo URLs point to official NBA CDN
- Idempotent: safe to run multiple times

---

### seed_salary_cap.py

**Purpose:** Seeds historical salary cap data for 7 seasons (2019-20 through 2025-26).

**Data Source:** NBA CBA documentation, Spotrac.com

**Output:**
- 7 seasons of cap data
- Salary cap, luxury tax, aprons
- Min/max salary scales
- Exception values

**Runtime:** ~2 seconds

**Notes:**
- 2025-26 data is projected
- First and second aprons introduced in 2023-24
- Idempotent: safe to run multiple times

---

### seed_players.py

**Purpose:** Seeds active NBA players with biographical data and career statistics.

**Data Source:** `nba_api` (CommonPlayerInfo, PlayerCareerStats)

**Output:**
- 400+ active players
- Bio: name, age, position, height, weight
- Draft info
- Last 5 seasons of statistics
- Career trajectory data

**Runtime:** 10-15 minutes (due to API rate limiting)

**Rate Limiting:** 600ms delay between API calls to respect NBA.com servers

**Notes:**
- Advanced stats (PER, VORP, BPM) use simplified estimations
- For production, consider using basketball-reference.com for advanced stats
- Set `LIMIT = 50` in the script for faster testing
- Idempotent: safe to run multiple times

**Testing:**
To test with a smaller dataset, edit line 257:
```python
LIMIT = 50  # Only seed 50 players for testing
```

---

### seed_contracts.py

**Purpose:** Seeds player contract data.

**Data Source:** BallDontLie API (free tier has limitations)

**Output:**
- Sample contracts for all active players
- Contract type, years, total value
- Season-by-season breakdown
- Options and clauses

**Runtime:** ~30 seconds

**Limitations:**
- BallDontLie free tier has limited contract data
- Sample contracts are algorithmically generated for demonstration
- Contract values estimated based on player performance

**Production Alternatives:**
- Spotrac (https://www.spotrac.com/nba/) - requires scraping
- HoopsHype (https://hoopshype.com/salaries/) - requires scraping
- Basketball-Reference contract pages

**Notes:**
- Idempotent: safe to run multiple times
- For production, implement web scraping for accurate contract data

---

### seed_transactions.py

**Purpose:** Seeds NBA transactions (trades, signings, waivers, extensions).

**Data Source:** Basketball-Reference (requires scraping)

**Output:**
- Sample transactions for demonstration
- Trades, signings, extensions, waivers
- Asset flows between teams
- Player involvement

**Runtime:** ~10 seconds

**Limitations:**
- Basketball-Reference scraping requires careful HTML parsing
- Sample transactions created for demonstration
- Full scraper implementation needed for production

**Production Alternatives:**
- Basketball-Reference transaction pages (requires scraping)
- NBA.com official transactions feed
- ESPN transaction database
- RealGM transaction database

**Notes:**
- Sample transactions use real players/teams from database
- For production, implement full Basketball-Reference scraper
- Idempotent: NOT idempotent (inserts new transactions each run)

---

### calculate_evaluations.py

**Purpose:** Calculates evaluation scores for all transactions.

**Data Source:** Transactions, players, contracts from MongoDB

**Output:**
- Surplus value calculations
- Win-now scores (0-100)
- Rebuild scores (0-100)
- Cap flexibility impact
- Risk scores (0-100)
- Composite scores (0-100)

**Runtime:** ~5 seconds

**Evaluation Metrics:**

1. **Surplus Value:** Player market value vs. contract cost
2. **Win-Now Score:** Immediate championship impact
3. **Rebuild Score:** Long-term asset accumulation value
4. **Cap Flexibility:** Space created/consumed
5. **Risk Score:** Injury, age, and fit concerns

**Weights (Default):**
- Surplus Value: 25%
- Win-Now: 25%
- Rebuild: 15%
- Cap Flexibility: 20%
- Risk: 15%

**Notes:**
- Creates default evaluation weights if they don't exist
- Idempotent: safe to run multiple times
- For production, enhance valuation models with advanced analytics

---

## Data Counts (Estimated)

After running all scripts, you should have:

| Collection | Estimated Count |
|------------|----------------|
| teams | 30 |
| salarycaps | 7 |
| players | 400-500 |
| contracts | 400-500 |
| transactions | 4 (sample) |
| evaluationweights | 1 (default) |

## Data Source Limitations

### Current Limitations

1. **Player Contracts:**
   - BallDontLie API free tier has incomplete contract data
   - Sample contracts generated algorithmically
   - **Production solution:** Scrape Spotrac or HoopsHype

2. **Transactions:**
   - Basketball-Reference requires HTML parsing
   - Sample transactions for demonstration
   - **Production solution:** Implement full Basketball-Reference scraper

3. **Advanced Stats:**
   - PER, VORP, BPM use simplified estimations
   - **Production solution:** Use basketball-reference.com advanced stats

4. **Injury History:**
   - Not included in current implementation
   - **Production solution:** Scrape injury reports from Rotoworld or NBA.com

### Recommended Production Data Sources

| Data Type | Recommended Source | Access Method |
|-----------|-------------------|---------------|
| Teams | nba_api | Python package (free) |
| Players | nba_api | Python package (free) |
| Stats | basketball-reference.com | Web scraping |
| Contracts | Spotrac, HoopsHype | Web scraping |
| Transactions | Basketball-Reference | Web scraping |
| Salary Cap | NBA CBA, Spotrac | Manual data entry |
| Injury Data | Rotoworld, NBA.com | Web scraping |

## Troubleshooting

### MongoDB Connection Errors

```
Error: MONGODB_URI not found in .env.local
```

**Solution:** Ensure `.env.local` exists in project root with valid MongoDB URI.

---

### API Rate Limiting

```
HTTPError: 429 Too Many Requests
```

**Solution:** Increase delay in `seed_players.py`:
```python
time.sleep(1.0)  # Increase from 0.6 to 1.0 seconds
```

---

### Player Data Fetch Failures

```
Warning: Could not fetch info for player 12345
```

**Solution:** This is normal for some retired/inactive players. Script will continue with available data.

---

### Import Errors

```
ModuleNotFoundError: No module named 'nba_api'
```

**Solution:** Activate virtual environment and reinstall:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## Refreshing Data

### Update All Data

To refresh all data (e.g., new season):

```bash
python seed_salary_cap.py    # Add new season cap data
python seed_players.py        # Update player stats
python seed_contracts.py      # Update contracts
python seed_transactions.py   # Add new transactions
python calculate_evaluations.py  # Recalculate scores
```

### Update Specific Collections

To update only certain data:

```bash
# Update just player stats (takes ~10-15 min)
python seed_players.py

# Recalculate all evaluation scores
python calculate_evaluations.py
```

### Clear and Reseed

To completely clear and reseed the database:

```bash
# Option 1: Use MongoDB shell
mongo
> use nets-evaluator
> db.dropDatabase()

# Option 2: Use Python
python
>>> from pymongo import MongoClient
>>> client = MongoClient("your-mongodb-uri")
>>> client.drop_database("nets-evaluator")
>>> exit()

# Then run all seed scripts again
python seed_teams.py && \
python seed_salary_cap.py && \
python seed_players.py && \
python seed_contracts.py && \
python seed_transactions.py && \
python calculate_evaluations.py
```

## Development Tips

### Testing with Limited Data

For faster testing, limit the number of players:

In `seed_players.py`, line 257:
```python
LIMIT = 50  # Test with only 50 players
```

### Debugging

Add verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Dry Run Mode

Add a `--dry-run` flag to test without database writes:

```bash
python seed_players.py --dry-run
```

(Note: Scripts don't currently support this - enhancement opportunity)

## Future Enhancements

1. **Real Transaction Scraping:** Implement full Basketball-Reference parser
2. **Contract Data:** Add Spotrac/HoopsHype scraper for accurate contracts
3. **Injury Data:** Scrape injury history from Rotoworld
4. **Advanced Stats:** Integrate basketball-reference.com advanced metrics
5. **Incremental Updates:** Add date-based incremental seeding
6. **CLI Arguments:** Add flags for dry-run, limit, verbose, etc.
7. **Error Recovery:** Add checkpoint/resume for long-running scripts
8. **Data Validation:** Add schema validation before inserting to MongoDB

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review script comments and docstrings
3. Consult the main README.md for architecture details
4. Check data source documentation (nba_api, BallDontLie, etc.)

---

**Last Updated:** November 2024
