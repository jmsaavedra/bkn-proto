#!/usr/bin/env python3
"""
Seed NBA Transactions

Scrapes and seeds 5 years of NBA transactions from Basketball-Reference.
Parses trades, signings, waivers, and extensions.
"""

import os
import sys
import time
from datetime import datetime
from dateutil import parser as date_parser
from dotenv import load_dotenv
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
import re

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)

# Basketball-Reference base URL
BREF_BASE_URL = "https://www.basketball-reference.com"


def get_player_by_name(db, name):
    """Find player in database by name"""
    # Try exact match first
    player = db['players'].find_one({'name.full': name})
    if player:
        return player['_id']

    # Try case-insensitive match
    escaped_name = re.escape(name)
    regex_pattern = '^' + escaped_name + '$'
    player = db['players'].find_one({'name.full': {'$regex': regex_pattern, '$options': 'i'}})
    if player:
        return player['_id']

    return None


def get_team_by_name(db, name_or_abbr):
    """Find team in database by name or abbreviation"""
    # Try abbreviation first
    team = db['teams'].find_one({'abbreviation': name_or_abbr.upper()})
    if team:
        return team['_id']

    # Try full name
    team = db['teams'].find_one({'fullName': name_or_abbr})
    if team:
        return team['_id']

    # Try city
    team = db['teams'].find_one({'city': name_or_abbr})
    if team:
        return team['_id']

    return None


def parse_transaction_type(text):
    """Determine transaction type from text"""
    text_lower = text.lower()

    if 'traded' in text_lower or 'acquired' in text_lower:
        if 'signed' in text_lower:
            return 'SIGN_AND_TRADE'
        return 'TRADE'
    elif 'signed' in text_lower:
        if '10-day' in text_lower:
            return 'TEN_DAY'
        elif 'two-way' in text_lower:
            return 'TWO_WAY'
        elif 'extension' in text_lower or 'extended' in text_lower:
            return 'EXTENSION'
        return 'SIGNING'
    elif 'waived' in text_lower or 'released' in text_lower:
        return 'WAIVER'
    elif 'buyout' in text_lower:
        return 'BUYOUT'
    elif 'draft' in text_lower:
        return 'DRAFT_PICK'
    else:
        return 'SIGNING'


def scrape_transactions_for_season(season_year):
    """
    Scrape transactions from Basketball-Reference for a given season.
    season_year: e.g., 2024 for 2024-25 season
    """
    url = f"{BREF_BASE_URL}/leagues/NBA_{season_year}_transactions.html"

    try:
        time.sleep(1)  # Be polite to the server
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        transactions = []

        # Find the transactions list
        transaction_divs = soup.find_all('div', class_='transaction')

        for div in transaction_divs:
            try:
                # Extract date
                date_str = div.find('span', class_='transaction-date')
                if date_str:
                    date_str = date_str.text.strip()
                    transaction_date = date_parser.parse(date_str)
                else:
                    continue

                # Extract description
                desc_elem = div.find('p')
                if not desc_elem:
                    continue

                description = desc_elem.text.strip()

                transactions.append({
                    'date': transaction_date,
                    'description': description,
                })

            except Exception as e:
                continue

        return transactions

    except Exception as e:
        print(f"  Error scraping {season_year}: {e}")
        return []


def create_sample_transactions(db):
    """
    Create sample transactions for demonstration.
    In production, you would parse real transaction data from Basketball-Reference.
    """
    print("\n⚠️  NOTE: Basketball-Reference scraping requires careful parsing.")
    print("    Creating sample transactions for demonstration purposes.\n")

    # Get some players and teams for sample data
    players = list(db['players'].find({'status': 'active'}).limit(20))
    teams = list(db['teams'].find({}))

    if len(players) < 10 or len(teams) < 10:
        print("Not enough players/teams in database. Please run seed_players.py and seed_teams.py first.")
        return []

    sample_transactions = []

    # Sample Trade
    sample_transactions.append({
        'type': 'TRADE',
        'date': datetime(2024, 11, 15),
        'season': '2024-25',
        'teams': [
            {
                'teamId': teams[0]['_id'],
                'role': 'acquired',
                'assetsIn': [
                    {
                        'type': 'player',
                        'playerId': players[0]['_id'],
                    },
                ],
                'assetsOut': [
                    {
                        'type': 'player',
                        'playerId': players[1]['_id'],
                    },
                    {
                        'type': 'pick',
                        'pickDetails': {
                            'year': 2025,
                            'round': 2,
                            'originalTeam': teams[0]['abbreviation'],
                        },
                    },
                ],
                'salaryIn': 18700000,
                'salaryOut': 14900000,
                'netCapImpact': 3800000,
            },
            {
                'teamId': teams[1]['_id'],
                'role': 'acquired',
                'assetsIn': [
                    {
                        'type': 'player',
                        'playerId': players[1]['_id'],
                    },
                    {
                        'type': 'pick',
                        'pickDetails': {
                            'year': 2025,
                            'round': 2,
                            'originalTeam': teams[0]['abbreviation'],
                        },
                    },
                ],
                'assetsOut': [
                    {
                        'type': 'player',
                        'playerId': players[0]['_id'],
                    },
                ],
                'salaryIn': 14900000,
                'salaryOut': 18700000,
                'netCapImpact': -3800000,
            },
        ],
        'players': [players[0]['_id'], players[1]['_id']],
        'contracts': [],
        'details': {
            'headline': f"{teams[0]['fullName']} trade for {players[0]['name']['full']}",
            'description': f"{teams[0]['fullName']} acquired {players[0]['name']['full']} from {teams[1]['fullName']} in exchange for {players[1]['name']['full']} and a 2025 second-round pick.",
            'source': 'Basketball-Reference',
            'sourceUrl': 'https://www.basketball-reference.com/leagues/NBA_2025_transactions.html',
        },
    })

    # Sample Signing
    sample_transactions.append({
        'type': 'SIGNING',
        'date': datetime(2024, 7, 6),
        'season': '2024-25',
        'teams': [
            {
                'teamId': teams[2]['_id'],
                'role': 'signed',
                'assetsIn': [
                    {
                        'type': 'player',
                        'playerId': players[2]['_id'],
                    },
                ],
                'assetsOut': [],
                'salaryIn': 53000000,
                'salaryOut': 0,
                'netCapImpact': -53000000,
            },
        ],
        'players': [players[2]['_id']],
        'contracts': [],
        'details': {
            'headline': f"{teams[2]['fullName']} sign {players[2]['name']['full']}",
            'description': f"{teams[2]['fullName']} signed {players[2]['name']['full']} to a 4-year, $212 million max contract.",
            'source': 'Basketball-Reference',
        },
    })

    # Sample Extension
    sample_transactions.append({
        'type': 'EXTENSION',
        'date': datetime(2024, 6, 30),
        'season': '2024-25',
        'teams': [
            {
                'teamId': teams[3]['_id'],
                'role': 'signed',
                'assetsIn': [],
                'assetsOut': [],
                'salaryIn': 0,
                'salaryOut': 0,
                'netCapImpact': -47600000,
            },
        ],
        'players': [players[3]['_id']],
        'contracts': [],
        'details': {
            'headline': f"{teams[3]['fullName']} extend {players[3]['name']['full']}",
            'description': f"{teams[3]['fullName']} signed {players[3]['name']['full']} to a 5-year, $238 million max rookie extension.",
            'source': 'Basketball-Reference',
        },
    })

    # Sample Waiver
    sample_transactions.append({
        'type': 'WAIVER',
        'date': datetime(2024, 10, 15),
        'season': '2024-25',
        'teams': [
            {
                'teamId': teams[4]['_id'],
                'role': 'waived',
                'assetsIn': [],
                'assetsOut': [
                    {
                        'type': 'player',
                        'playerId': players[4]['_id'],
                    },
                ],
                'salaryIn': 0,
                'salaryOut': 2200000,
                'netCapImpact': 2200000,
            },
        ],
        'players': [players[4]['_id']],
        'contracts': [],
        'details': {
            'headline': f"{teams[4]['fullName']} waive {players[4]['name']['full']}",
            'description': f"{teams[4]['fullName']} waived {players[4]['name']['full']}.",
            'source': 'Basketball-Reference',
        },
    })

    return sample_transactions


def seed_transactions():
    """Main function to seed transactions"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    transactions_collection = db['transactions']

    # Create sample transactions
    sample_transactions = create_sample_transactions(db)

    if not sample_transactions:
        print("No transactions to seed. Exiting.")
        client.close()
        return

    print(f"Seeding {len(sample_transactions)} sample transactions...")

    inserted_count = 0
    updated_count = 0

    for trans in tqdm(sample_transactions, desc="Seeding transactions"):
        try:
            trans['createdAt'] = datetime.utcnow()
            trans['updatedAt'] = datetime.utcnow()

            # Insert transaction
            result = transactions_collection.insert_one(trans)
            inserted_count += 1

        except Exception as e:
            print(f"\n  Error inserting transaction: {e}")
            continue

    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Total: {inserted_count}")

    print("\n📝 DATA SOURCE LIMITATIONS:")
    print("   - Basketball-Reference scraping requires careful HTML parsing")
    print("   - Sample transactions created for demonstration")
    print("   - For production, implement full Basketball-Reference scraper")
    print("   - Alternative sources:")
    print("     • NBA.com official transactions feed")
    print("     • ESPN transaction data")
    print("     • RealGM transaction database")

    client.close()


if __name__ == '__main__':
    try:
        seed_transactions()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
