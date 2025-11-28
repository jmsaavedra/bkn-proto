#!/usr/bin/env python3
"""
Seed NBA Teams Data

Seeds all 30 NBA teams with basic information, logos, and colors.
Uses nba_api to get official team data.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from nba_api.stats.static import teams as nba_teams

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)

# Team colors (manually curated since nba_api doesn't provide them)
TEAM_COLORS = {
    'ATL': {'primary': '#E03A3E', 'secondary': '#C1D32F'},
    'BOS': {'primary': '#007A33', 'secondary': '#BA9653'},
    'BKN': {'primary': '#000000', 'secondary': '#FFFFFF'},
    'CHA': {'primary': '#1D1160', 'secondary': '#00788C'},
    'CHI': {'primary': '#CE1141', 'secondary': '#000000'},
    'CLE': {'primary': '#860038', 'secondary': '#041E42'},
    'DAL': {'primary': '#00538C', 'secondary': '#002B5E'},
    'DEN': {'primary': '#0E2240', 'secondary': '#FEC524'},
    'DET': {'primary': '#C8102E', 'secondary': '#1D42BA'},
    'GSW': {'primary': '#1D428A', 'secondary': '#FFC72C'},
    'HOU': {'primary': '#CE1141', 'secondary': '#000000'},
    'IND': {'primary': '#002D62', 'secondary': '#FDBB30'},
    'LAC': {'primary': '#C8102E', 'secondary': '#1D428A'},
    'LAL': {'primary': '#552583', 'secondary': '#FDB927'},
    'MEM': {'primary': '#5D76A9', 'secondary': '#12173F'},
    'MIA': {'primary': '#98002E', 'secondary': '#F9A01B'},
    'MIL': {'primary': '#00471B', 'secondary': '#EEE1C6'},
    'MIN': {'primary': '#0C2340', 'secondary': '#236192'},
    'NOP': {'primary': '#0C2340', 'secondary': '#C8102E'},
    'NYK': {'primary': '#006BB6', 'secondary': '#F58426'},
    'OKC': {'primary': '#007AC1', 'secondary': '#EF3B24'},
    'ORL': {'primary': '#0077C0', 'secondary': '#C4CED4'},
    'PHI': {'primary': '#006BB6', 'secondary': '#ED174C'},
    'PHX': {'primary': '#1D1160', 'secondary': '#E56020'},
    'POR': {'primary': '#E03A3E', 'secondary': '#000000'},
    'SAC': {'primary': '#5A2D81', 'secondary': '#63727A'},
    'SAS': {'primary': '#C4CED4', 'secondary': '#000000'},
    'TOR': {'primary': '#CE1141', 'secondary': '#000000'},
    'UTA': {'primary': '#002B5C', 'secondary': '#F9A01B'},
    'WAS': {'primary': '#002B5C', 'secondary': '#E31837'},
}

# Division mappings
DIVISIONS = {
    'ATL': 'Southeast', 'CHA': 'Southeast', 'MIA': 'Southeast', 'ORL': 'Southeast', 'WAS': 'Southeast',
    'BOS': 'Atlantic', 'BKN': 'Atlantic', 'NYK': 'Atlantic', 'PHI': 'Atlantic', 'TOR': 'Atlantic',
    'CHI': 'Central', 'CLE': 'Central', 'DET': 'Central', 'IND': 'Central', 'MIL': 'Central',
    'DAL': 'Southwest', 'HOU': 'Southwest', 'MEM': 'Southwest', 'NOP': 'Southwest', 'SAS': 'Southwest',
    'DEN': 'Northwest', 'MIN': 'Northwest', 'OKC': 'Northwest', 'POR': 'Northwest', 'UTA': 'Northwest',
    'GSW': 'Pacific', 'LAC': 'Pacific', 'LAL': 'Pacific', 'PHX': 'Pacific', 'SAC': 'Pacific',
}


def get_team_logo_url(abbreviation):
    """Generate NBA.com logo URL for a team"""
    # Map some abbreviations that differ
    abbrev_map = {
        'BKN': 'BKN',
        'CHA': 'CHA',
        'PHX': 'PHX',
    }
    abbrev = abbrev_map.get(abbreviation, abbreviation)
    return f"https://cdn.nba.com/logos/nba/{nba_teams.find_team_by_abbreviation(abbreviation)['id']}/primary/L/logo.svg"


def seed_teams():
    """Seed all NBA teams into MongoDB"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    teams_collection = db['teams']

    print("Fetching NBA teams from nba_api...")
    all_teams = nba_teams.get_teams()

    print(f"Found {len(all_teams)} teams")
    print("\nSeeding teams...")

    inserted_count = 0
    updated_count = 0

    for team in all_teams:
        abbreviation = team['abbreviation']

        # Determine conference
        conference = 'East' if abbreviation in [
            'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DET', 'IND',
            'MIA', 'MIL', 'NYK', 'ORL', 'PHI', 'TOR', 'WAS'
        ] else 'West'

        team_doc = {
            'nbaId': team['id'],
            'name': team['nickname'],
            'city': team['city'],
            'fullName': team['full_name'],
            'abbreviation': abbreviation,
            'conference': conference,
            'division': DIVISIONS.get(abbreviation, 'Unknown'),
            'capSheet': {
                'season': '2024-25',
                'totalSalary': 0,
                'capSpace': 0,
                'luxuryTaxSpace': 0,
                'apronRoom': 0,
                'projectedTax': 0,
                'draftPicks': [],
            },
            'logoUrl': get_team_logo_url(abbreviation),
            'primaryColor': TEAM_COLORS.get(abbreviation, {}).get('primary', '#000000'),
            'secondaryColor': TEAM_COLORS.get(abbreviation, {}).get('secondary', '#FFFFFF'),
            'updatedAt': datetime.utcnow(),
        }

        # Upsert team (update if exists, insert if not)
        result = teams_collection.update_one(
            {'abbreviation': abbreviation},
            {
                '$set': team_doc,
                '$setOnInsert': {'createdAt': datetime.utcnow()}
            },
            upsert=True
        )

        if result.upserted_id:
            inserted_count += 1
            print(f"  ✓ Inserted: {team['full_name']} ({abbreviation})")
        else:
            updated_count += 1
            print(f"  ↻ Updated: {team['full_name']} ({abbreviation})")

    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Total: {inserted_count + updated_count}")

    client.close()


if __name__ == '__main__':
    try:
        seed_teams()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
