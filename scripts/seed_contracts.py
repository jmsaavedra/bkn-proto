#!/usr/bin/env python3
"""
Seed NBA Player Contracts

Seeds player contract data using BallDontLie API.
Note: BallDontLie free tier has limitations on contract data availability.
This script will seed what's available and log limitations.
"""

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
import requests
from tqdm import tqdm

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)

# BallDontLie API (free tier)
BALLDONTLIE_BASE_URL = "https://www.balldontlie.io/api/v1"


def get_player_id_mapping(db):
    """Create mapping of NBA API IDs to MongoDB ObjectIds"""
    players = db['players'].find({}, {'nbaId': 1, '_id': 1})
    return {p['nbaId']: p['_id'] for p in players}


def get_team_id_mapping(db):
    """Create mapping of team abbreviations to MongoDB ObjectIds"""
    teams = db['teams'].find({}, {'abbreviation': 1, '_id': 1})
    return {t['abbreviation']: t['_id'] for t in teams}


def estimate_contract_type(total_value, years):
    """Estimate contract type based on value and length"""
    aav = total_value / years if years > 0 else 0

    if aav < 2000000:
        return 'veteran-min'
    elif aav < 5000000:
        return 'two-way'
    elif aav < 10000000:
        return 'standard'
    elif aav < 15000000:
        return 'mid-level'
    elif aav >= 30000000:
        return 'max'
    else:
        return 'standard'


def generate_season_breakdown(total_value, years, start_season):
    """Generate year-by-year contract breakdown"""
    seasons = []
    base_salary = total_value / years if years > 0 else 0

    for i in range(years):
        # Parse start season (e.g., "2024-25")
        season_parts = start_season.split('-')
        start_year = int('20' + season_parts[0]) if len(season_parts[0]) == 2 else int(season_parts[0])

        year1 = start_year + i
        year2 = year1 + 1
        season_str = f"{year1}-{str(year2)[-2:]}"

        # Simple escalation (3% per year)
        salary = base_salary * (1.03 ** i)

        seasons.append({
            'season': season_str,
            'salary': round(salary),
            'capHit': round(salary),
            'deadCap': 0,
            'guaranteed': round(salary),
            'bonuses': 0,
        })

    return seasons


def seed_contracts_from_balldontlie(db, player_mapping, team_mapping):
    """
    Attempt to seed contracts from BallDontLie API.
    Note: The free tier may have limited contract data.
    """
    print("\n⚠️  NOTE: BallDontLie API free tier has limited contract data.")
    print("    This script will create sample contracts for demonstration purposes.\n")

    contracts_collection = db['contracts']
    players_collection = db['players']

    # Get all players
    players = list(players_collection.find({'status': 'active'}))
    print(f"Found {len(players)} active players")

    inserted_count = 0
    updated_count = 0
    skipped_count = 0

    # For now, create sample contracts for demonstration
    # In production, you would scrape from Spotrac or HoopsHype
    current_season = "2024-25"

    for player in tqdm(players, desc="Creating sample contracts"):
        try:
            player_id = player['_id']
            team_id = player.get('currentTeamId')

            if not team_id:
                skipped_count += 1
                continue

            # Generate a sample contract based on player age and stats
            age = player.get('age', 25)
            season_stats = player.get('trajectory', {}).get('seasonStats', [])

            # Estimate contract value based on recent performance
            if season_stats:
                recent_ppg = season_stats[-1].get('ppg', 10)
                recent_mpg = season_stats[-1].get('mpg', 20)

                # Simple valuation formula
                if recent_ppg > 25 and recent_mpg > 32:
                    total_value = 180000000
                    years = 4
                elif recent_ppg > 20:
                    total_value = 120000000
                    years = 4
                elif recent_ppg > 15:
                    total_value = 60000000
                    years = 3
                elif recent_ppg > 10:
                    total_value = 30000000
                    years = 3
                else:
                    total_value = 10000000
                    years = 2
            else:
                # Default contract
                total_value = 15000000
                years = 2

            # Rookies and young players get different contracts
            if age < 23:
                total_value = min(total_value, 20000000)
                years = min(years, 4)

            contract_type = estimate_contract_type(total_value, years)
            season_breakdown = generate_season_breakdown(total_value, years, current_season)

            # Determine end season
            start_year = 2024
            end_year = start_year + years
            end_season = f"{end_year}-{str(end_year + 1)[-2:]}"

            contract_doc = {
                'playerId': player_id,
                'teamId': team_id,
                'type': contract_type,
                'startSeason': current_season,
                'endSeason': end_season,
                'years': years,
                'totalValue': total_value,
                'seasons': season_breakdown,
                'options': {},
                'tradeKicker': 0,
                'noTradeClause': False,
                'signingType': 'free-agent',
                'signedDate': datetime(2024, 7, 1),
                'status': 'active',
                'updatedAt': datetime.utcnow(),
            }

            # Upsert contract
            result = contracts_collection.update_one(
                {'playerId': player_id, 'status': 'active'},
                {
                    '$set': contract_doc,
                    '$setOnInsert': {'createdAt': datetime.utcnow()}
                },
                upsert=True
            )

            if result.upserted_id:
                inserted_count += 1
            else:
                updated_count += 1

        except Exception as e:
            print(f"\n  Error processing contract for {player.get('name', {}).get('full', 'Unknown')}: {e}")
            skipped_count += 1
            continue

    return inserted_count, updated_count, skipped_count


def seed_contracts():
    """Main function to seed contracts"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()

    print("Building player and team mappings...")
    player_mapping = get_player_id_mapping(db)
    team_mapping = get_team_id_mapping(db)

    print(f"Found {len(player_mapping)} players and {len(team_mapping)} teams")

    # Seed contracts
    inserted, updated, skipped = seed_contracts_from_balldontlie(db, player_mapping, team_mapping)

    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted}")
    print(f"   Updated: {updated}")
    print(f"   Skipped: {skipped}")
    print(f"   Total: {inserted + updated}")

    print("\n📝 DATA SOURCE LIMITATIONS:")
    print("   - BallDontLie API free tier has limited contract data")
    print("   - Sample contracts generated for demonstration purposes")
    print("   - For production, consider scraping from:")
    print("     • Spotrac (https://www.spotrac.com/nba/)")
    print("     • HoopsHype (https://hoopshype.com/salaries/)")
    print("     • Basketball-Reference contract data")

    client.close()


if __name__ == '__main__':
    try:
        seed_contracts()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
