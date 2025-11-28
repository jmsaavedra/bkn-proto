#!/usr/bin/env python3
"""
Scrape NBA Player Contracts from HoopsHype

Scrapes real contract data including:
- Actual salary amounts
- Contract years
- Player/Team options
- Two-way contracts
- Qualifying offers
"""

import os
import sys
import re
import time
from datetime import datetime
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

# HoopsHype team URLs
HOOPSHYPE_BASE = "https://hoopshype.com/salaries"

# Team slug mapping (HoopsHype URL format)
TEAM_SLUGS = {
    'ATL': 'atlanta_hawks',
    'BOS': 'boston_celtics',
    'BKN': 'brooklyn_nets',
    'CHA': 'charlotte_hornets',
    'CHI': 'chicago_bulls',
    'CLE': 'cleveland_cavaliers',
    'DAL': 'dallas_mavericks',
    'DEN': 'denver_nuggets',
    'DET': 'detroit_pistons',
    'GSW': 'golden_state_warriors',
    'HOU': 'houston_rockets',
    'IND': 'indiana_pacers',
    'LAC': 'los_angeles_clippers',
    'LAL': 'los_angeles_lakers',
    'MEM': 'memphis_grizzlies',
    'MIA': 'miami_heat',
    'MIL': 'milwaukee_bucks',
    'MIN': 'minnesota_timberwolves',
    'NOP': 'new_orleans_pelicans',
    'NYK': 'new_york_knicks',
    'OKC': 'oklahoma_city_thunder',
    'ORL': 'orlando_magic',
    'PHI': 'philadelphia_76ers',
    'PHX': 'phoenix_suns',
    'POR': 'portland_trail_blazers',
    'SAC': 'sacramento_kings',
    'SAS': 'san_antonio_spurs',
    'TOR': 'toronto_raptors',
    'UTA': 'utah_jazz',
    'WAS': 'washington_wizards',
}

# Request headers to mimic browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}


def parse_salary(salary_str):
    """Parse salary string to integer, handling options markers"""
    if not salary_str or salary_str.strip() == '-':
        return None, {}

    salary_str = salary_str.strip()
    options = {
        'teamOption': False,
        'playerOption': False,
        'qualifyingOffer': False,
        'twoWay': False,
    }

    # Check for option markers
    if salary_str.startswith('T$') or salary_str.startswith('T '):
        options['teamOption'] = True
        salary_str = salary_str[1:].strip()
    elif salary_str.startswith('P$') or salary_str.startswith('P '):
        options['playerOption'] = True
        salary_str = salary_str[1:].strip()
    elif salary_str.startswith('Q$') or salary_str.startswith('Q '):
        options['qualifyingOffer'] = True
        salary_str = salary_str[1:].strip()
    elif salary_str.startswith('TW') or 'Two-Way' in salary_str:
        options['twoWay'] = True
        salary_str = salary_str.replace('TW', '').strip()

    # Remove $ and commas, parse number
    salary_str = salary_str.replace('$', '').replace(',', '').strip()

    try:
        salary = int(float(salary_str))
        return salary, options
    except (ValueError, TypeError):
        return None, options


def normalize_player_name(name):
    """Normalize player name for matching"""
    # Remove Jr., Sr., III, II, etc.
    name = re.sub(r'\s+(Jr\.?|Sr\.?|III|II|IV)$', '', name, flags=re.IGNORECASE)
    # Remove periods and extra whitespace
    name = name.replace('.', '').strip()
    return name.lower()


def scrape_team_salaries(team_abbr, team_slug):
    """Scrape salary data for a single team"""
    url = f"{HOOPSHYPE_BASE}/{team_slug}/"

    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"    Error fetching {team_abbr}: {e}")
        return []

    soup = BeautifulSoup(response.text, 'lxml')

    # Find the salary table
    table = soup.find('table', class_='hh-salaries-ranking-table')
    if not table:
        # Try alternate selector
        table = soup.find('table')

    if not table:
        print(f"    Warning: Could not find salary table for {team_abbr}")
        return []

    players = []
    rows = table.find_all('tr')

    # Get header to determine season columns
    header_row = table.find('thead')
    seasons = []
    if header_row:
        headers = header_row.find_all('th')
        for th in headers:
            text = th.get_text(strip=True)
            # Match season pattern like "2024-25" or "2024/25"
            if re.match(r'20\d{2}[-/]\d{2}', text):
                seasons.append(text.replace('/', '-'))

    # If no seasons found, use default
    if not seasons:
        seasons = ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29']

    # Parse player rows
    tbody = table.find('tbody')
    if tbody:
        rows = tbody.find_all('tr')

    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 2:
            continue

        # First cell usually contains player name
        name_cell = cells[0]
        player_link = name_cell.find('a')

        if player_link:
            player_name = player_link.get_text(strip=True)
        else:
            player_name = name_cell.get_text(strip=True)

        if not player_name or player_name.lower() in ['player', 'total', 'totals', 'cap maximum']:
            continue

        # Parse salary cells
        season_salaries = []
        for i, cell in enumerate(cells[1:], 0):
            if i >= len(seasons):
                break

            salary_text = cell.get_text(strip=True)
            salary, options = parse_salary(salary_text)

            if salary is not None:
                season_salaries.append({
                    'season': seasons[i],
                    'salary': salary,
                    'capHit': salary,  # Simplified - actual cap hit may differ
                    'guaranteed': salary if not options.get('teamOption') else 0,
                    'options': options,
                })

        if season_salaries:
            players.append({
                'name': player_name,
                'normalizedName': normalize_player_name(player_name),
                'team': team_abbr,
                'seasons': season_salaries,
            })

    return players


def find_player_in_db(db, player_name, team_abbr):
    """Find player in database by name matching"""
    normalized = normalize_player_name(player_name)

    # Try exact match first
    player = db['players'].find_one({
        '$or': [
            {'name.full': {'$regex': f'^{re.escape(player_name)}$', '$options': 'i'}},
            {'name.full': {'$regex': f'^{re.escape(normalized)}$', '$options': 'i'}},
        ]
    })

    if player:
        return player

    # Try partial match on last name
    name_parts = player_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[-1]
        first_initial = name_parts[0][0] if name_parts[0] else ''

        player = db['players'].find_one({
            'name.last': {'$regex': f'^{re.escape(last_name)}$', '$options': 'i'},
            'name.first': {'$regex': f'^{re.escape(first_initial)}', '$options': 'i'},
        })

        if player:
            return player

    return None


def get_team_id(db, team_abbr):
    """Get team ObjectId from abbreviation"""
    team = db['teams'].find_one({'abbreviation': team_abbr})
    return team['_id'] if team else None


def determine_contract_type(seasons_data):
    """Determine contract type based on salary data"""
    if not seasons_data:
        return 'standard'

    first_salary = seasons_data[0].get('salary', 0)
    years = len(seasons_data)

    # Check for two-way
    if any(s.get('options', {}).get('twoWay') for s in seasons_data):
        return 'two-way'

    # Estimate based on AAV
    if first_salary < 2500000:
        return 'veteran-min'
    elif first_salary >= 35000000:
        return 'max'
    elif first_salary >= 25000000:
        return 'max'
    elif 10000000 <= first_salary < 15000000:
        return 'mid-level'
    else:
        return 'standard'


def scrape_all_contracts():
    """Main function to scrape all team contracts"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    contracts_collection = db['contracts']

    print("Scraping contracts from HoopsHype...")
    print("=" * 60)

    all_contracts = []

    for team_abbr, team_slug in tqdm(TEAM_SLUGS.items(), desc="Scraping teams"):
        players = scrape_team_salaries(team_abbr, team_slug)

        for player_data in players:
            all_contracts.append(player_data)

        # Rate limiting - be respectful
        time.sleep(1.5)

    print(f"\nScraped {len(all_contracts)} player contracts")
    print("=" * 60)

    # Now match and insert into database
    print("\nMatching players and inserting contracts...")

    inserted = 0
    updated = 0
    unmatched = []

    for contract_data in tqdm(all_contracts, desc="Processing contracts"):
        player_name = contract_data['name']
        team_abbr = contract_data['team']
        seasons_data = contract_data['seasons']

        # Find player in database
        player = find_player_in_db(db, player_name, team_abbr)

        if not player:
            unmatched.append((player_name, team_abbr))
            continue

        # Get team ID
        team_id = get_team_id(db, team_abbr)

        if not team_id:
            continue

        # Build contract document
        total_value = sum(s.get('salary', 0) for s in seasons_data)
        years = len(seasons_data)

        # Determine options
        options = {}
        for season_info in seasons_data:
            opts = season_info.get('options', {})
            if opts.get('playerOption'):
                options['playerOption'] = {
                    'season': season_info['season'],
                    'value': season_info['salary']
                }
            if opts.get('teamOption'):
                options['teamOption'] = {
                    'season': season_info['season'],
                    'value': season_info['salary']
                }

        # Format seasons for storage
        formatted_seasons = []
        for s in seasons_data:
            formatted_seasons.append({
                'season': s['season'],
                'salary': s['salary'],
                'capHit': s['capHit'],
                'deadCap': 0,
                'guaranteed': s['guaranteed'],
                'bonuses': 0,
            })

        contract_doc = {
            'playerId': player['_id'],
            'teamId': team_id,
            'type': determine_contract_type(seasons_data),
            'startSeason': seasons_data[0]['season'] if seasons_data else '2024-25',
            'endSeason': seasons_data[-1]['season'] if seasons_data else '2024-25',
            'years': years,
            'totalValue': total_value,
            'seasons': formatted_seasons,
            'options': options,
            'tradeKicker': 0,  # Would need more detailed scraping
            'noTradeClause': False,  # Would need more detailed scraping
            'signingType': 'free-agent',
            'signedDate': None,
            'status': 'active',
            'source': 'hoopshype',
            'scrapedAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }

        # Upsert contract
        result = contracts_collection.update_one(
            {'playerId': player['_id'], 'status': 'active'},
            {
                '$set': contract_doc,
                '$setOnInsert': {'createdAt': datetime.utcnow()}
            },
            upsert=True
        )

        if result.upserted_id:
            inserted += 1
        else:
            updated += 1

    print(f"\n✅ Contract scraping complete!")
    print(f"   Inserted: {inserted}")
    print(f"   Updated: {updated}")
    print(f"   Unmatched: {len(unmatched)}")

    if unmatched and len(unmatched) <= 20:
        print("\n   Unmatched players (may need manual review):")
        for name, team in unmatched[:20]:
            print(f"     - {name} ({team})")
    elif unmatched:
        print(f"\n   First 20 unmatched players:")
        for name, team in unmatched[:20]:
            print(f"     - {name} ({team})")
        print(f"     ... and {len(unmatched) - 20} more")

    client.close()


if __name__ == '__main__':
    try:
        scrape_all_contracts()
    except KeyboardInterrupt:
        print("\n\nScraping interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
