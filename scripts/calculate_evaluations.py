#!/usr/bin/env python3
"""
Calculate Transaction Evaluation Scores

Calculates evaluation metrics for all transactions:
- Surplus value
- Win-now score
- Rebuild score
- Cap flexibility impact
- Risk score
- Composite score
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from tqdm import tqdm
import random

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)


def calculate_surplus_value(db, transaction):
    """
    Calculate surplus value: player market value vs contract cost.
    Returns value in dollars.
    """
    surplus = 0

    for team in transaction.get('teams', []):
        for asset in team.get('assetsIn', []):
            if asset['type'] == 'player':
                player_id = asset.get('playerId')
                if player_id:
                    player = db['players'].find_one({'_id': player_id})
                    if player:
                        # Get player's recent performance
                        stats = player.get('trajectory', {}).get('seasonStats', [])
                        if stats:
                            recent_stats = stats[-1]
                            ppg = recent_stats.get('ppg', 0)
                            mpg = recent_stats.get('mpg', 0)

                            # Simple market value estimation
                            # (In production, use more sophisticated models)
                            market_value = (ppg * 2000000) + (mpg * 500000)

                            # Get contract cost
                            contract = db['contracts'].find_one({'playerId': player_id, 'status': 'active'})
                            if contract:
                                contract_aav = contract['totalValue'] / contract['years']
                                surplus += (market_value - contract_aav)

    return surplus


def calculate_win_now_score(db, transaction):
    """
    Calculate win-now score (0-100).
    Higher score = better for immediate championship contention.
    """
    score = 50  # Base score

    for team in transaction.get('teams', []):
        for asset in team.get('assetsIn', []):
            if asset['type'] == 'player':
                player_id = asset.get('playerId')
                if player_id:
                    player = db['players'].find_one({'_id': player_id})
                    if player:
                        age = player.get('age', 25)
                        stats = player.get('trajectory', {}).get('seasonStats', [])

                        # Players in their prime (25-30) boost win-now
                        if 25 <= age <= 30:
                            score += 15
                        elif age > 30:
                            score += 10
                        elif age < 25:
                            score += 5

                        # High performers boost win-now
                        if stats:
                            recent_ppg = stats[-1].get('ppg', 0)
                            if recent_ppg > 20:
                                score += 20
                            elif recent_ppg > 15:
                                score += 10

        # Draft picks reduce win-now score
        for asset in team.get('assetsOut', []):
            if asset['type'] == 'pick':
                score -= 10

    return max(0, min(100, score))


def calculate_rebuild_score(db, transaction):
    """
    Calculate rebuild score (0-100).
    Higher score = better for long-term asset accumulation.
    """
    score = 50  # Base score

    for team in transaction.get('teams', []):
        # Young players boost rebuild score
        for asset in team.get('assetsIn', []):
            if asset['type'] == 'player':
                player_id = asset.get('playerId')
                if player_id:
                    player = db['players'].find_one({'_id': player_id})
                    if player:
                        age = player.get('age', 25)
                        career_arc = player.get('trajectory', {}).get('careerArc', 'unknown')

                        # Young players boost rebuild
                        if age < 25:
                            score += 20
                        elif age < 28:
                            score += 10

                        # Ascending players boost rebuild
                        if career_arc == 'ascending':
                            score += 15

            # Draft picks boost rebuild score
            elif asset['type'] == 'pick':
                pick_details = asset.get('pickDetails', {})
                if pick_details.get('round') == 1:
                    score += 25
                else:
                    score += 10

    return max(0, min(100, score))


def calculate_cap_flexibility_impact(db, transaction):
    """
    Calculate cap flexibility impact in dollars.
    Positive = space created, Negative = space consumed.
    """
    total_impact = 0

    for team in transaction.get('teams', []):
        total_impact += team.get('netCapImpact', 0)

    # Average across teams
    num_teams = len(transaction.get('teams', []))
    return total_impact / num_teams if num_teams > 0 else 0


def calculate_risk_score(db, transaction):
    """
    Calculate risk score (0-100).
    Higher score = higher risk (injury, age, fit concerns).
    """
    risk = 30  # Base risk

    for team in transaction.get('teams', []):
        for asset in team.get('assetsIn', []):
            if asset['type'] == 'player':
                player_id = asset.get('playerId')
                if player_id:
                    player = db['players'].find_one({'_id': player_id})
                    if player:
                        age = player.get('age', 25)
                        injury_history = player.get('trajectory', {}).get('injuryHistory', [])
                        career_arc = player.get('trajectory', {}).get('careerArc', 'unknown')

                        # Age-based risk
                        if age > 32:
                            risk += 20
                        elif age > 30:
                            risk += 10
                        elif age < 22:
                            risk += 5

                        # Injury history risk
                        if len(injury_history) > 2:
                            risk += 15
                        elif len(injury_history) > 0:
                            risk += 5

                        # Declining players are risky
                        if career_arc == 'declining':
                            risk += 10

    return max(0, min(100, risk))


def calculate_composite_score(evaluation, weights):
    """
    Calculate composite score using weighted formula.
    """
    # Normalize surplus value and cap flexibility to 0-100 scale
    surplus_normalized = max(0, min(100, 50 + (evaluation['surplusValue'] / 1000000)))
    cap_flex_normalized = max(0, min(100, 50 + (evaluation['capFlexibilityImpact'] / 1000000)))

    composite = (
        surplus_normalized * weights['surplusValue'] +
        evaluation['winNowScore'] * weights['winNow'] +
        evaluation['rebuildScore'] * weights['rebuild'] +
        cap_flex_normalized * weights['capFlexibility'] +
        (100 - evaluation['riskScore']) * weights['risk']
    )

    return round(composite, 1)


def get_default_weights(db):
    """Get default evaluation weights from database or use hardcoded defaults"""
    weights = db['evaluationweights'].find_one({'isDefault': True})

    if weights:
        return weights['weights']
    else:
        # Default weights
        return {
            'surplusValue': 0.25,
            'winNow': 0.25,
            'rebuild': 0.15,
            'capFlexibility': 0.20,
            'risk': 0.15,
        }


def seed_default_weights(db):
    """Seed default evaluation weights if they don't exist"""
    existing = db['evaluationweights'].find_one({'name': 'Default'})

    if not existing:
        default_weights = {
            'name': 'Default',
            'isDefault': True,
            'weights': {
                'surplusValue': 0.25,
                'winNow': 0.25,
                'rebuild': 0.15,
                'capFlexibility': 0.20,
                'risk': 0.15,
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
        }
        db['evaluationweights'].insert_one(default_weights)
        print("  ✓ Created default evaluation weights")


def calculate_evaluations():
    """Main function to calculate evaluations for all transactions"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()

    # Seed default weights
    seed_default_weights(db)

    # Get weights
    weights = get_default_weights(db)
    print(f"Using weights: {weights}")

    # Get all transactions
    transactions = list(db['transactions'].find({}))
    print(f"\nFound {len(transactions)} transactions to evaluate")

    if len(transactions) == 0:
        print("No transactions found. Please run seed_transactions.py first.")
        client.close()
        return

    updated_count = 0

    print("\nCalculating evaluations...")
    for transaction in tqdm(transactions, desc="Evaluating transactions"):
        try:
            # Calculate metrics
            surplus_value = calculate_surplus_value(db, transaction)
            win_now_score = calculate_win_now_score(db, transaction)
            rebuild_score = calculate_rebuild_score(db, transaction)
            cap_flexibility = calculate_cap_flexibility_impact(db, transaction)
            risk_score = calculate_risk_score(db, transaction)

            evaluation = {
                'surplusValue': round(surplus_value, 2),
                'winNowScore': round(win_now_score, 1),
                'rebuildScore': round(rebuild_score, 1),
                'capFlexibilityImpact': round(cap_flexibility, 2),
                'riskScore': round(risk_score, 1),
                'historicalComparisons': [],
            }

            # Calculate composite score
            evaluation['compositeScore'] = calculate_composite_score(evaluation, weights)

            # Update transaction
            db['transactions'].update_one(
                {'_id': transaction['_id']},
                {
                    '$set': {
                        'evaluation': evaluation,
                        'updatedAt': datetime.utcnow(),
                    }
                }
            )

            updated_count += 1

        except Exception as e:
            print(f"\n  Error evaluating transaction: {e}")
            continue

    print(f"\n✅ Evaluation complete!")
    print(f"   Updated: {updated_count} transactions")

    # Show sample evaluation
    sample = db['transactions'].find_one({})
    if sample and 'evaluation' in sample:
        print("\n📊 Sample Evaluation:")
        eval_data = sample['evaluation']
        print(f"   Surplus Value: ${eval_data.get('surplusValue', 0):,.0f}")
        print(f"   Win-Now Score: {eval_data.get('winNowScore', 0)}/100")
        print(f"   Rebuild Score: {eval_data.get('rebuildScore', 0)}/100")
        print(f"   Cap Flexibility: ${eval_data.get('capFlexibilityImpact', 0):,.0f}")
        print(f"   Risk Score: {eval_data.get('riskScore', 0)}/100")
        print(f"   Composite Score: {eval_data.get('compositeScore', 0)}/100")

    client.close()


if __name__ == '__main__':
    try:
        calculate_evaluations()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
