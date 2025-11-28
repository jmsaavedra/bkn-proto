#!/usr/bin/env python3
"""
Scrape NBA Transactions from Basketball-Reference

Scrapes real NBA transactions (trades, signings, waivers, extensions, etc.)
from Basketball-Reference for the last 5 seasons.
"""

import os
import sys
import re
import time
from datetime import datetime, timezone
from dateutil import parser as date_parser
from dotenv import load_dotenv
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)

# Basketball-Reference base URL
BREF_BASE_URL = "https://www.basketball-reference.com"

# Rate limiting
REQUEST_DELAY = 3.0  # Be respectful to Basketball-Reference

# Team abbreviation mapping (BREF uses some different abbrevs)
TEAM_ABBREV_MAP = {
    'CHO': 'CHA',  # Charlotte
    'BRK': 'BKN',  # Brooklyn
    'PHO': 'PHX',  # Phoenix
    'NOP': 'NOP',  # New Orleans (sometimes NOH)
    'NOH': 'NOP',
    'NOK': 'NOP',
    'NJN': 'BKN',  # Old Nets
    'SEA': 'OKC',  # Seattle -> OKC
    'VAN': 'MEM',  # Vancouver -> Memphis
    'WSB': 'WAS',  # Washington
    'CHH': 'CHA',  # Old Hornets
}


def normalize_team_abbrev(abbrev):
    """Normalize team abbreviation to match our database"""
    return TEAM_ABBREV_MAP.get(abbrev, abbrev)


def extract_team_abbrev(href):
    """Extract team abbreviation from Basketball-Reference URL"""
    # Format: /teams/BOS/2025.html
    match = re.search(r'/teams/([A-Z]{3})/', href)
    if match:
        return normalize_team_abbrev(match.group(1))
    return None


def extract_player_id(href):
    """Extract player ID from Basketball-Reference URL"""
    # Format: /players/t/tatumja01.html
    match = re.search(r'/players/\w/(\w+)\.html', href)
    if match:
        return match.group(1)
    return None


def parse_transaction_type(text):
    """Determine transaction type from description text"""
    text_lower = text.lower()

    if 'traded' in text_lower:
        if 'sign-and-trade' in text_lower or 'signed-and-traded' in text_lower:
            return 'SIGN_AND_TRADE'
        return 'TRADE'
    elif 'signed' in text_lower:
        if 'two-way' in text_lower or '2-way' in text_lower:
            return 'TWO_WAY'
        elif '10-day' in text_lower or 'ten-day' in text_lower:
            return 'TEN_DAY'
        elif 'extension' in text_lower or 'extended' in text_lower:
            return 'EXTENSION'
        elif 'exhibit 10' in text_lower:
            return 'EXHIBIT_10'
        return 'SIGNING'
    elif 'waived' in text_lower or 'released' in text_lower:
        return 'WAIVER'
    elif 'claimed' in text_lower:
        return 'WAIVER_CLAIM'
    elif 'buyout' in text_lower:
        return 'BUYOUT'
    elif 'retired' in text_lower or 'retirement' in text_lower:
        return 'RETIREMENT'
    elif 'exercised' in text_lower and 'option' in text_lower:
        return 'OPTION_EXERCISED'
    elif 'declined' in text_lower and 'option' in text_lower:
        return 'OPTION_DECLINED'
    elif 'converted' in text_lower:
        return 'CONTRACT_CONVERSION'
    elif 'draft' in text_lower:
        return 'DRAFT_PICK'
    else:
        return 'OTHER'


def get_season_string(year):
    """Convert year to season string (e.g., 2025 -> '2024-25')"""
    return f"{year - 1}-{str(year)[2:]}"


def scrape_transactions_page(season_year):
    """
    Scrape transactions from Basketball-Reference for a given season.
    season_year: e.g., 2025 for 2024-25 season
    """
    url = f"{BREF_BASE_URL}/leagues/NBA_{season_year}_transactions.html"

    print(f"  Fetching {url}...")

    try:
        time.sleep(REQUEST_DELAY)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        transactions = []
        current_date = None

        # Find the main content area - transactions are in <ul> lists
        # The page structure has dates as standalone text followed by transaction <li> items
        content = soup.find('div', {'id': 'content'})
        if not content:
            print(f"    Could not find content div for {season_year}")
            return []

        # Find all list items that contain transactions
        all_lis = content.find_all('li')

        for li in all_lis:
            text = li.get_text(separator=' ', strip=True)
            # Collapse multiple spaces into single space
            text = re.sub(r'\s+', ' ', text).strip()
            if not text:
                continue

            # Check if this is a date header (some pages structure differently)
            # Look for patterns like "June 26, 2024"
            date_match = re.match(r'^([A-Z][a-z]+ \d{1,2}, \d{4})', text)
            if date_match:
                try:
                    current_date = date_parser.parse(date_match.group(1))
                except:
                    pass

            # Skip if no meaningful transaction content
            if len(text) < 20:
                continue

            # Check if this looks like a transaction
            transaction_keywords = ['traded', 'signed', 'waived', 'released', 'claimed',
                                   'retired', 'exercised', 'declined', 'converted', 'acquired']
            if not any(kw in text.lower() for kw in transaction_keywords):
                continue

            # Extract teams and players from links
            teams_involved = []
            players_involved = []

            for link in li.find_all('a'):
                href = link.get('href', '')
                link_text = link.get_text(strip=True)

                if '/teams/' in href:
                    abbrev = extract_team_abbrev(href)
                    if abbrev:
                        teams_involved.append({
                            'abbrev': abbrev,
                            'name': link_text
                        })
                elif '/players/' in href:
                    player_id = extract_player_id(href)
                    if player_id:
                        players_involved.append({
                            'bref_id': player_id,
                            'name': link_text
                        })

            # Only add if we found at least one team
            if teams_involved:
                trans_type = parse_transaction_type(text)

                # Try to extract date from text if not set
                if not current_date:
                    # Look for date pattern in the text
                    date_search = re.search(r'([A-Z][a-z]+ \d{1,2}, \d{4})', text)
                    if date_search:
                        try:
                            current_date = date_parser.parse(date_search.group(1))
                        except:
                            current_date = datetime(season_year - 1, 10, 1)  # Default to season start

                transactions.append({
                    'date': current_date or datetime(season_year - 1, 10, 1),
                    'season': get_season_string(season_year),
                    'type': trans_type,
                    'description': text,
                    'teams': teams_involved,
                    'players': players_involved,
                })

        print(f"    Found {len(transactions)} transactions for {season_year}")
        return transactions

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"    Page not found for {season_year}")
        else:
            print(f"    HTTP error for {season_year}: {e}")
        return []
    except Exception as e:
        print(f"    Error scraping {season_year}: {e}")
        return []


def find_player_in_db(db, player_name, bref_id=None):
    """Find player in database by name"""
    # Try exact match first
    player = db['players'].find_one({'name.full': player_name})
    if player:
        return player['_id']

    # Try case-insensitive match
    escaped_name = re.escape(player_name)
    regex_pattern = '^' + escaped_name + '$'
    player = db['players'].find_one({
        'name.full': {'$regex': regex_pattern, '$options': 'i'}
    })
    if player:
        return player['_id']

    # Try last name match (for players with different first name formats)
    name_parts = player_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[-1]
        player = db['players'].find_one({
            'name.last': {'$regex': '^' + re.escape(last_name) + '$', '$options': 'i'}
        })
        if player:
            return player['_id']

    return None


def find_team_in_db(db, abbrev):
    """Find team in database by abbreviation"""
    team = db['teams'].find_one({'abbreviation': abbrev})
    if team:
        return team['_id']
    return None


def build_transaction_document(db, raw_trans):
    """Build a proper transaction document from scraped data"""

    # Find team IDs
    team_docs = []
    for team_info in raw_trans['teams']:
        team_id = find_team_in_db(db, team_info['abbrev'])
        if team_id:
            team_docs.append({
                'teamId': team_id,
                'role': 'involved',  # Could be refined based on transaction text
                'assetsIn': [],
                'assetsOut': [],
                'salaryIn': 0,
                'salaryOut': 0,
                'netCapImpact': 0,
            })

    # Find player IDs
    player_ids = []
    for player_info in raw_trans['players']:
        player_id = find_player_in_db(db, player_info['name'], player_info.get('bref_id'))
        if player_id:
            player_ids.append(player_id)

    # Build headline from description
    description = raw_trans['description']
    headline = description[:100] + '...' if len(description) > 100 else description

    return {
        'type': raw_trans['type'],
        'date': raw_trans['date'],
        'season': raw_trans['season'],
        'teams': team_docs,
        'players': player_ids,
        'contracts': [],
        'details': {
            'headline': headline,
            'description': description,
            'source': 'Basketball-Reference',
            'sourceUrl': f"{BREF_BASE_URL}/leagues/NBA_{int(raw_trans['season'][:4]) + 1}_transactions.html",
        },
        'createdAt': datetime.now(timezone.utc),
        'updatedAt': datetime.now(timezone.utc),
    }


def scrape_transactions(seasons=None, limit_per_season=None):
    """Main function to scrape and seed transactions"""

    if seasons is None:
        # Default: last 5 seasons (2021-2025)
        current_year = datetime.now().year
        # If before October, current season hasn't started
        if datetime.now().month < 10:
            seasons = list(range(current_year, current_year - 5, -1))
        else:
            seasons = list(range(current_year + 1, current_year - 4, -1))

    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    transactions_collection = db['transactions']

    # Clear existing transactions (optional - comment out to append)
    print("Clearing existing transactions...")
    transactions_collection.delete_many({})

    all_transactions = []

    print(f"\nScraping transactions for seasons: {[get_season_string(y) for y in seasons]}")
    print(f"Rate limit: {REQUEST_DELAY}s between requests\n")

    for season_year in seasons:
        print(f"\n📅 Season {get_season_string(season_year)}:")
        raw_transactions = scrape_transactions_page(season_year)

        if limit_per_season and len(raw_transactions) > limit_per_season:
            raw_transactions = raw_transactions[:limit_per_season]
            print(f"    Limited to {limit_per_season} transactions")

        all_transactions.extend(raw_transactions)

    print(f"\n\nTotal raw transactions scraped: {len(all_transactions)}")

    if not all_transactions:
        print("No transactions found. Exiting.")
        client.close()
        return

    # Process and insert transactions
    print("\nProcessing and inserting transactions...")

    inserted_count = 0
    skipped_count = 0

    for raw_trans in tqdm(all_transactions, desc="Inserting transactions"):
        try:
            # Build proper document
            doc = build_transaction_document(db, raw_trans)

            # Skip if no teams matched
            if not doc['teams']:
                skipped_count += 1
                continue

            # Insert transaction
            transactions_collection.insert_one(doc)
            inserted_count += 1

        except Exception as e:
            print(f"\n  Error processing transaction: {e}")
            skipped_count += 1
            continue

    print(f"\n✅ Scraping complete!")
    print(f"   Inserted: {inserted_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total: {inserted_count + skipped_count}")

    # Show breakdown by type
    print("\n📊 Transaction breakdown:")
    pipeline = [
        {'$group': {'_id': '$type', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    for doc in transactions_collection.aggregate(pipeline):
        print(f"   {doc['_id']}: {doc['count']}")

    client.close()


if __name__ == '__main__':
    # Scrape last 5 seasons by default
    # Adjust seasons list or limit_per_season for testing

    # For testing, you can limit:
    # scrape_transactions(seasons=[2025], limit_per_season=50)

    # For full scraping (takes ~15 seconds per season due to rate limiting):
    try:
        scrape_transactions(
            seasons=[2025, 2024, 2023, 2022, 2021],  # Last 5 seasons
            limit_per_season=None  # No limit
        )
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
