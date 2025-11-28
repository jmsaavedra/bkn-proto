#!/usr/bin/env python3
"""
Seed NBA Players Data

Seeds active NBA players with biographical data and career statistics.
Uses nba_api to fetch player rosters and statistics.
"""

import os
import sys
from datetime import datetime
from dateutil import parser as date_parser
from dotenv import load_dotenv
from pymongo import MongoClient
from nba_api.stats.static import players as nba_players
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats
from tqdm import tqdm
import time

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)


def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return 0
    today = datetime.now()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def determine_career_arc(seasons_stats, current_age):
    """Determine player's career arc based on stats trajectory"""
    if not seasons_stats or len(seasons_stats) < 2:
        return 'unknown'

    # Get recent performance trend (last 3 seasons)
    recent_seasons = seasons_stats[-3:] if len(seasons_stats) >= 3 else seasons_stats
    ppg_values = [s['ppg'] for s in recent_seasons]

    if current_age < 25:
        return 'ascending'
    elif current_age >= 32:
        return 'declining'
    elif 25 <= current_age < 32:
        # Check if performance is still improving
        if len(ppg_values) >= 2 and ppg_values[-1] > ppg_values[0]:
            return 'peak'
        else:
            return 'peak'
    return 'unknown'


def get_player_info(player_id):
    """Fetch detailed player information from NBA API"""
    try:
        time.sleep(0.6)  # Rate limiting
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        player_data = info.get_normalized_dict()['CommonPlayerInfo'][0]
        return player_data
    except Exception as e:
        print(f"    Warning: Could not fetch info for player {player_id}: {e}")
        return None


def get_player_stats(player_id):
    """Fetch player career statistics from NBA API"""
    try:
        time.sleep(0.6)  # Rate limiting
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        stats_data = career.get_normalized_dict()['SeasonTotalsRegularSeason']
        return stats_data
    except Exception as e:
        print(f"    Warning: Could not fetch stats for player {player_id}: {e}")
        return []


def process_season_stats(stats_data):
    """Process raw stats data into structured format"""
    if not stats_data:
        return []

    # Get last 5 seasons
    recent_stats = stats_data[-5:] if len(stats_data) >= 5 else stats_data

    processed_stats = []
    for season in recent_stats:
        gp = season.get('GP', 0)
        if gp == 0:
            continue

        processed_stats.append({
            'season': season.get('SEASON_ID', ''),
            'team': season.get('TEAM_ABBREVIATION', ''),
            'gamesPlayed': gp,
            'mpg': round(season.get('MIN', 0) / gp, 1),
            'ppg': round(season.get('PTS', 0) / gp, 1),
            'rpg': round(season.get('REB', 0) / gp, 1),
            'apg': round(season.get('AST', 0) / gp, 1),
            'per': 15.0,  # Default PER (would need advanced stats endpoint)
            'ws': round(season.get('PTS', 0) / 2000, 1),  # Simplified WS estimation
            'vorp': 0.0,  # Would need advanced stats
            'bpm': 0.0,   # Would need advanced stats
        })

    return processed_stats


def get_team_id(db, team_abbreviation):
    """Get MongoDB team ObjectId from abbreviation"""
    if not team_abbreviation:
        return None
    team = db['teams'].find_one({'abbreviation': team_abbreviation})
    return team['_id'] if team else None


def seed_players(limit=None):
    """Seed NBA players into MongoDB"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    players_collection = db['players']

    print("Fetching NBA players from nba_api...")
    all_players = nba_players.get_active_players()

    if limit:
        all_players = all_players[:limit]
        print(f"Limiting to {limit} players for testing")

    print(f"Found {len(all_players)} active players")
    print("\nSeeding players (this may take a while due to API rate limits)...")

    inserted_count = 0
    updated_count = 0
    skipped_count = 0

    for player in tqdm(all_players, desc="Processing players"):
        try:
            # Fetch detailed player info
            player_info = get_player_info(player['id'])
            if not player_info:
                skipped_count += 1
                continue

            # Fetch career stats
            stats_data = get_player_stats(player['id'])
            season_stats = process_season_stats(stats_data)

            # Parse birth date
            birth_date_str = player_info.get('BIRTHDATE')
            birth_date = None
            if birth_date_str:
                try:
                    birth_date = date_parser.parse(birth_date_str)
                except:
                    birth_date = None

            age = calculate_age(birth_date) if birth_date else 25

            # Parse draft info (handle 'Undrafted' players)
            draft_year = player_info.get('DRAFT_YEAR', '')
            draft_round = player_info.get('DRAFT_ROUND', '')
            draft_number = player_info.get('DRAFT_NUMBER', '')

            # Check if player is undrafted
            is_undrafted = (
                draft_year == 'Undrafted' or
                draft_round == 'Undrafted' or
                draft_number == 'Undrafted' or
                not draft_year or not draft_round or not draft_number
            )

            # Parse draft values safely
            def safe_int(val, default=None):
                """Convert to int, returning default for non-numeric values"""
                if val is None or val == '' or val == 'Undrafted':
                    return default
                try:
                    return int(val)
                except (ValueError, TypeError):
                    return default

            # Get current team
            current_team_abbr = player_info.get('TEAM_ABBREVIATION', '')
            current_team_id = get_team_id(db, current_team_abbr)

            # Parse name
            full_name = player_info.get('DISPLAY_FIRST_LAST', player['full_name'])
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            # Build draft info (None values for undrafted players)
            draft_info = {
                'year': safe_int(draft_year),
                'round': safe_int(draft_round),
                'pick': safe_int(draft_number),
                'team': player_info.get('DRAFT_TEAM', '') if not is_undrafted else None,
                'undrafted': is_undrafted,
            }

            # Parse weight safely
            weight_val = player_info.get('WEIGHT', '')
            try:
                weight = int(weight_val) if weight_val else 200
            except (ValueError, TypeError):
                weight = 200

            # Build player document
            player_doc = {
                'nbaId': player['id'],
                'name': {
                    'full': full_name,
                    'first': first_name,
                    'last': last_name,
                },
                'position': player_info.get('POSITION', 'G'),
                'height': player_info.get('HEIGHT', '').replace("'", '').replace('"', '').replace('-', ''),
                'weight': weight,
                'birthDate': birth_date,
                'age': age,
                'country': player_info.get('COUNTRY', 'USA'),
                'draft': draft_info,
                'currentTeamId': current_team_id,
                'status': 'active',
                'trajectory': {
                    'peakAge': 27,
                    'careerArc': determine_career_arc(season_stats, age),
                    'injuryHistory': [],
                    'seasonStats': season_stats,
                },
                'imageUrl': f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player['id']}.png",
                'updatedAt': datetime.utcnow(),
            }

            # Convert height from string like "6-6" to inches
            height_str = player_info.get('HEIGHT', '')
            if height_str and '-' in height_str:
                try:
                    feet, inches = height_str.split('-')
                    player_doc['height'] = int(feet) * 12 + int(inches)
                except:
                    player_doc['height'] = 78  # Default 6'6"
            else:
                player_doc['height'] = 78

            # Upsert player
            result = players_collection.update_one(
                {'nbaId': player['id']},
                {
                    '$set': player_doc,
                    '$setOnInsert': {'createdAt': datetime.utcnow()}
                },
                upsert=True
            )

            if result.upserted_id:
                inserted_count += 1
            else:
                updated_count += 1

        except Exception as e:
            print(f"\n  Error processing {player.get('full_name', 'Unknown')}: {e}")
            skipped_count += 1
            continue

    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Skipped: {skipped_count}")
    print(f"   Total: {inserted_count + updated_count}")

    client.close()


if __name__ == '__main__':
    # Optional: limit players for testing (comment out for full seeding)
    # LIMIT = 50
    LIMIT = None

    try:
        seed_players(limit=LIMIT)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
