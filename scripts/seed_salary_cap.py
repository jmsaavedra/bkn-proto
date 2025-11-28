#!/usr/bin/env python3
"""
Seed NBA Salary Cap History

Seeds historical salary cap data from 2019-20 through 2025-26 seasons.
Data sourced from official NBA CBA and Spotrac.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in .env.local")
    sys.exit(1)

# Historical salary cap data (sourced from NBA CBA and Spotrac)
SALARY_CAP_DATA = [
    {
        'season': '2019-20',
        'salaryCap': 109140000,
        'luxuryTax': 132627000,
        'firstApron': None,
        'secondApron': None,
        'bri': 8800000000,  # Basketball Related Income
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 898310,
            'years1': 1445697,
            'years2': 1620564,
            'years3': 1678854,
            'years4': 1737145,
            'years5': 1882867,
            'years6': 2028594,
            'years7': 2174318,
            'years8': 2320044,
            'years9': 2331593,
            'years10Plus': 2564753,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 27285000},
            'years7to9': {'percentage': 30, 'value': 32742000},
            'years10Plus': {'percentage': 35, 'value': 38199000},
        },
        'exceptions': {
            'midLevel': 9258000,
            'midLevelTaxpayer': 5718000,
            'biAnnual': 3623000,
            'minimumRoster': 897158,
        },
    },
    {
        'season': '2020-21',
        'salaryCap': 109140000,
        'luxuryTax': 132627000,
        'firstApron': None,
        'secondApron': None,
        'bri': 8300000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 898310,
            'years1': 1445697,
            'years2': 1620564,
            'years3': 1678854,
            'years4': 1737145,
            'years5': 1882867,
            'years6': 2028594,
            'years7': 2174318,
            'years8': 2320044,
            'years9': 2331593,
            'years10Plus': 2564753,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 27285000},
            'years7to9': {'percentage': 30, 'value': 32742000},
            'years10Plus': {'percentage': 35, 'value': 38199000},
        },
        'exceptions': {
            'midLevel': 9258000,
            'midLevelTaxpayer': 5718000,
            'biAnnual': 3623000,
            'minimumRoster': 897158,
        },
    },
    {
        'season': '2021-22',
        'salaryCap': 112414000,
        'luxuryTax': 136606000,
        'firstApron': None,
        'secondApron': None,
        'bri': 8900000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 925258,
            'years1': 1489065,
            'years2': 1669178,
            'years3': 1729217,
            'years4': 1789256,
            'years5': 1939350,
            'years6': 2089448,
            'years7': 2239544,
            'years8': 2389641,
            'years9': 2401537,
            'years10Plus': 2641691,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 28103500},
            'years7to9': {'percentage': 30, 'value': 33724200},
            'years10Plus': {'percentage': 35, 'value': 39344900},
        },
        'exceptions': {
            'midLevel': 9536000,
            'midLevelTaxpayer': 5890000,
            'biAnnual': 3732000,
            'minimumRoster': 925258,
        },
    },
    {
        'season': '2022-23',
        'salaryCap': 123655000,
        'luxuryTax': 150267000,
        'firstApron': None,
        'secondApron': None,
        'bri': 10000000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 1017781,
            'years1': 1637966,
            'years2': 1836090,
            'years3': 1902133,
            'years4': 1968175,
            'years5': 2133278,
            'years6': 2298385,
            'years7': 2463490,
            'years8': 2628597,
            'years9': 2641682,
            'years10Plus': 2905851,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 30913750},
            'years7to9': {'percentage': 30, 'value': 37096500},
            'years10Plus': {'percentage': 35, 'value': 43279250},
        },
        'exceptions': {
            'midLevel': 10490000,
            'midLevelTaxpayer': 6479000,
            'biAnnual': 4105000,
            'minimumRoster': 1017781,
        },
    },
    {
        'season': '2023-24',
        'salaryCap': 136021000,
        'luxuryTax': 165294000,
        'firstApron': 172346000,
        'secondApron': 182794000,
        'bri': 10900000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 1119563,
            'years1': 1801769,
            'years2': 2019706,
            'years3': 2093785,
            'years4': 2162606,
            'years5': 2346614,
            'years6': 2530624,
            'years7': 2714362,
            'years8': 2898096,
            'years9': 2911737,
            'years10Plus': 3196448,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 34005250},
            'years7to9': {'percentage': 30, 'value': 40806300},
            'years10Plus': {'percentage': 35, 'value': 47607350},
        },
        'exceptions': {
            'midLevel': 12405000,
            'midLevelTaxpayer': 5000000,
            'biAnnual': 4500000,
            'minimumRoster': 1119563,
        },
    },
    {
        'season': '2024-25',
        'salaryCap': 140588000,
        'luxuryTax': 170814000,
        'firstApron': 178132000,
        'secondApron': 188931000,
        'bri': 11300000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 1157153,
            'years1': 1862265,
            'years2': 2087519,
            'years3': 2162548,
            'years4': 2237581,
            'years5': 2425403,
            'years6': 2613223,
            'years7': 2801044,
            'years8': 2988845,
            'years9': 3003427,
            'years10Plus': 3303771,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 35147000},
            'years7to9': {'percentage': 30, 'value': 42176400},
            'years10Plus': {'percentage': 35, 'value': 49205800},
        },
        'exceptions': {
            'midLevel': 12822000,
            'midLevelTaxpayer': 5168000,
            'biAnnual': 4656000,
            'minimumRoster': 1157153,
        },
    },
    {
        'season': '2025-26',
        'salaryCap': 154600000,
        'luxuryTax': 188000000,
        'firstApron': 196000000,
        'secondApron': 208000000,
        'bri': 12400000000,
        'playerShare': 50.0,
        'minimumSalary': {
            'years0': 1272869,
            'years1': 2048491,
            'years2': 2296271,
            'years3': 2378803,
            'years4': 2461339,
            'years5': 2667943,
            'years6': 2874545,
            'years7': 3081148,
            'years8': 3287730,
            'years9': 3303769,
            'years10Plus': 3634148,
        },
        'maxSalary': {
            'years0to6': {'percentage': 25, 'value': 38650000},
            'years7to9': {'percentage': 30, 'value': 46380000},
            'years10Plus': {'percentage': 35, 'value': 54110000},
        },
        'exceptions': {
            'midLevel': 14100000,
            'midLevelTaxpayer': 5685000,
            'biAnnual': 5121600,
            'minimumRoster': 1272869,
        },
    },
]


def seed_salary_cap():
    """Seed salary cap history into MongoDB"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()
    salary_cap_collection = db['salarycaps']

    print("Seeding salary cap history...")

    inserted_count = 0
    updated_count = 0

    for cap_data in SALARY_CAP_DATA:
        cap_data['createdAt'] = datetime.utcnow()

        # Upsert salary cap data (update if exists, insert if not)
        result = salary_cap_collection.update_one(
            {'season': cap_data['season']},
            {'$set': cap_data},
            upsert=True
        )

        if result.upserted_id:
            inserted_count += 1
            print(f"  ✓ Inserted: {cap_data['season']} - Cap: ${cap_data['salaryCap']:,}")
        else:
            updated_count += 1
            print(f"  ↻ Updated: {cap_data['season']} - Cap: ${cap_data['salaryCap']:,}")

    print(f"\n✅ Seeding complete!")
    print(f"   Inserted: {inserted_count}")
    print(f"   Updated: {updated_count}")
    print(f"   Total: {inserted_count + updated_count}")

    client.close()


if __name__ == '__main__':
    try:
        seed_salary_cap()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
