#!/usr/bin/env python3
"""
Scratch Oracle ML Prediction Generation Script
Loads trained model and generates predictions for all active games.
Writes results to Supabase predictions table.
"""

import os
import sys
import pickle
from datetime import datetime, date
import numpy as np
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =====================================================
# Configuration
# =====================================================

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
MODEL_PATH = 'models/lottery_predictor.pkl'

print("=" * 70)
print("[SLOT] SCRATCH ORACLE PREDICTION GENERATOR")
print("=" * 70)
print(f"Model: {MODEL_PATH}")
print(f"Supabase URL: {SUPABASE_URL}")
print()

# Validate configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] ERROR: Missing Supabase credentials in .env file")
    sys.exit(1)

if not os.path.exists(MODEL_PATH):
    print(f"[ERROR] ERROR: Model file not found at {MODEL_PATH}")
    print("   Please run: npm run train-model")
    sys.exit(1)

# Create Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[OK] Connected to Supabase")
except Exception as e:
    print(f"[ERROR] Failed to connect to Supabase: {e}")
    sys.exit(1)

# =====================================================
# Model Loading
# =====================================================

def load_model():
    """Load trained model from disk."""
    print(f"\n[LOAD] Loading model from {MODEL_PATH}...")
    try:
        with open(MODEL_PATH, 'rb') as f:
            model_package = pickle.load(f)

        print(f"[OK] Model loaded successfully")
        print(f"   Version: {model_package.get('version', 'unknown')}")
        print(f"   Trained: {model_package.get('trained_at', 'unknown')}")
        print(f"   Test R²: {model_package.get('metrics', {}).get('test_r2', 'N/A'):.4f}")
        print(f"   Features: {len(model_package.get('feature_cols', []))}")

        return model_package
    except Exception as e:
        print(f"[ERROR] Error loading model: {e}")
        raise

# =====================================================
# Data Fetching
# =====================================================

def fetch_games():
    """Fetch all active games from Supabase."""
    print("\n[FETCH] Fetching games from Supabase...")
    try:
        response = supabase.table('games').select('*').eq('is_active', True).execute()
        games = pd.DataFrame(response.data)
        print(f"[OK] Fetched {len(games)} active games")
        return games
    except Exception as e:
        print(f"[ERROR] Error fetching games: {e}")
        raise

# =====================================================
# Feature Engineering (must match training)
# =====================================================

def parse_odds(odds_string):
    """Parse '1 in 3.5' to float 0.286."""
    if not odds_string or pd.isna(odds_string):
        return 0
    try:
        if 'in' in str(odds_string).lower():
            parts = str(odds_string).split('in')
            denominator = float(parts[1].strip())
            return 1.0 / denominator if denominator > 0 else 0
        return float(odds_string)
    except:
        return 0

def calculate_days_since(date_str):
    """Calculate days since a date string."""
    if not date_str or pd.isna(date_str):
        return 999
    try:
        if isinstance(date_str, str):
            date_obj = pd.to_datetime(date_str)
        else:
            date_obj = date_str
        return (datetime.now(date_obj.tzinfo if date_obj.tzinfo else None) - date_obj).days
    except:
        return 999

def engineer_features(game):
    """
    Create feature vector for a single game.
    MUST MATCH THE TRAINING FEATURE ENGINEERING!
    """
    # Basic game info
    ticket_price = game.get('ticket_price', 0)
    top_prize = game.get('top_prize_amount', 0)
    remaining_prizes = game.get('remaining_top_prizes', 0)
    total_prizes = game.get('total_top_prizes', 1)

    # Feature calculations (same as training)
    prize_concentration = remaining_prizes / total_prizes if total_prizes > 0 else 0
    ev = (top_prize / ticket_price) * prize_concentration if ticket_price > 0 else 0
    depletion_rate = 1.0 - prize_concentration

    game_start = game.get('game_start_date')
    days_since_launch = calculate_days_since(game_start)

    last_scraped = game.get('last_scraped_at')
    recency = calculate_days_since(last_scraped)

    odds = parse_odds(game.get('overall_odds'))
    velocity = depletion_rate
    prize_to_price = top_prize / ticket_price if ticket_price > 0 else 0

    return {
        'ticket_price': ticket_price,
        'ev': ev,
        'prize_concentration': prize_concentration,
        'depletion_rate': depletion_rate,
        'days_since_launch': days_since_launch,
        'recency': recency,
        'odds': odds,
        'velocity': velocity,
        'prize_to_price': prize_to_price,
        'remaining_prizes': remaining_prizes,
        'total_prizes': total_prizes
    }

# =====================================================
# Prediction Generation
# =====================================================

def generate_prediction(game, model_package):
    """Generate prediction for a single game."""
    model = model_package['model']
    feature_cols = model_package['feature_cols']

    try:
        # Engineer features
        features = engineer_features(game)

        # Create feature vector in correct order
        X = np.array([[features[col] for col in feature_cols]])

        # Predict AI score
        ai_score = float(model.predict(X)[0])
        ai_score = max(0, min(100, ai_score))  # Clamp to 0-100

        # Calculate confidence based on data quality
        # High confidence if recent data and good prize info
        data_quality_factors = []

        # Factor 1: Data recency (higher = better)
        if features['recency'] <= 1:
            data_quality_factors.append(100)
        elif features['recency'] <= 7:
            data_quality_factors.append(80)
        elif features['recency'] <= 30:
            data_quality_factors.append(50)
        else:
            data_quality_factors.append(20)

        # Factor 2: Prize data completeness
        if features['remaining_prizes'] > 0 and features['total_prizes'] > 0:
            data_quality_factors.append(100)
        else:
            data_quality_factors.append(30)

        # Factor 3: Model confidence (based on test R²)
        model_r2 = model_package.get('metrics', {}).get('test_r2', 0)
        data_quality_factors.append(min(model_r2 * 100, 100))

        confidence = np.mean(data_quality_factors)

        # Calculate win probability (derived from EV and prize concentration)
        # This is a simplified probability estimate
        win_probability = min(features['ev'] * features['prize_concentration'] / 10, 1.0)

        # Generate recommendation based on AI score and confidence
        recommendation = get_recommendation(ai_score, confidence)

        # Generate reasoning
        reasoning = generate_reasoning(game, features, ai_score, confidence)

        return {
            'game_id': game['id'],
            'prediction_date': date.today().isoformat(),
            'ai_score': round(ai_score, 2),
            'win_probability': round(win_probability, 6),
            'expected_value': round(features['ev'], 4),
            'confidence_level': round(confidence, 2),
            'model_version': model_package.get('version', 'v1.0'),
            'features_used': feature_cols,
            'recommendation': recommendation,
            'reasoning': reasoning
        }

    except Exception as e:
        print(f"[WARNING]  Warning: Error generating prediction for {game.get('game_name', 'unknown')}: {e}")
        return None

def get_recommendation(ai_score, confidence):
    """
    Generate recommendation based on AI score and confidence.

    Recommendation levels:
    - strong_buy: Score >= 75 and confidence >= 70
    - buy: Score >= 60 and confidence >= 60
    - neutral: Score 40-60 or low confidence
    - avoid: Score < 40 and confidence >= 60
    - strong_avoid: Score < 25 and confidence >= 70
    """
    if confidence < 50:
        return 'neutral'  # Low confidence = neutral recommendation

    if ai_score >= 75 and confidence >= 70:
        return 'strong_buy'
    elif ai_score >= 60 and confidence >= 60:
        return 'buy'
    elif ai_score >= 40:
        return 'neutral'
    elif ai_score >= 25 and confidence >= 60:
        return 'avoid'
    elif ai_score < 25 and confidence >= 70:
        return 'strong_avoid'
    else:
        return 'neutral'

def generate_reasoning(game, features, ai_score, confidence):
    """Generate human-readable reasoning for prediction."""
    reasons = []

    # EV analysis
    if features['ev'] > 1.0:
        reasons.append(f"Strong expected value ({features['ev']:.2f}x)")
    elif features['ev'] > 0.7:
        reasons.append(f"Decent expected value ({features['ev']:.2f}x)")
    elif features['ev'] < 0.3:
        reasons.append(f"Low expected value ({features['ev']:.2f}x)")

    # Prize concentration
    if features['prize_concentration'] > 0.8:
        reasons.append(f"High prize availability ({features['prize_concentration']*100:.0f}%)")
    elif features['prize_concentration'] > 0.5:
        reasons.append(f"Moderate prize availability ({features['prize_concentration']*100:.0f}%)")
    elif features['prize_concentration'] < 0.2:
        reasons.append(f"Low prize availability ({features['prize_concentration']*100:.0f}%)")

    # Activity
    if 0.2 < features['depletion_rate'] < 0.6:
        reasons.append("Active game with good turnover")
    elif features['depletion_rate'] < 0.1:
        reasons.append("New or slow-moving game")
    elif features['depletion_rate'] > 0.8:
        reasons.append("Game nearing end of life")

    # Data quality
    if features['recency'] <= 1:
        reasons.append("Fresh data (updated today)")
    elif features['recency'] > 7:
        reasons.append(f"Data is {features['recency']} days old")

    # Confidence note
    if confidence < 60:
        reasons.append(f"Low confidence ({confidence:.0f}%) - limited data")

    if not reasons:
        reasons.append("Based on mathematical analysis")

    return " | ".join(reasons)

# =====================================================
# Database Write
# =====================================================

def save_predictions(predictions):
    """Save predictions to Supabase predictions table."""
    print(f"\n[SAVE] Saving {len(predictions)} predictions to Supabase...")

    # Filter out None values (failed predictions)
    valid_predictions = [p for p in predictions if p is not None]

    if len(valid_predictions) == 0:
        print("[ERROR] No valid predictions to save!")
        return

    try:
        # Try to upsert (insert or update if exists)
        # Note: This requires appropriate RLS policies
        response = supabase.table('predictions').upsert(
            valid_predictions,
            on_conflict='game_id,prediction_date,model_version'
        ).execute()

        print(f"[OK] Successfully saved {len(valid_predictions)} predictions")

        # Show summary statistics
        scores = [p['ai_score'] for p in valid_predictions]
        print(f"\nPrediction Summary:")
        print(f"  Average AI Score: {np.mean(scores):.2f}")
        print(f"  Min/Max Scores: {np.min(scores):.2f} / {np.max(scores):.2f}")

        # Recommendation breakdown
        recommendations = [p['recommendation'] for p in valid_predictions]
        for rec_type in ['strong_buy', 'buy', 'neutral', 'avoid', 'strong_avoid']:
            count = recommendations.count(rec_type)
            if count > 0:
                print(f"  {rec_type}: {count}")

    except Exception as e:
        print(f"[ERROR] Error saving predictions: {e}")
        print("\nNote: If you see RLS policy errors, you may need to:")
        print("  1. Use the service role key (not anon key)")
        print("  2. Or disable RLS on the predictions table temporarily")
        print("  3. Or add an RLS policy that allows anon inserts")
        raise

# =====================================================
# Main Execution
# =====================================================

def main():
    """Main prediction generation pipeline."""
    try:
        # Step 1: Load model
        model_package = load_model()

        # Step 2: Fetch games
        games = fetch_games()

        if len(games) == 0:
            print("[ERROR] ERROR: No active games found!")
            sys.exit(1)

        # Step 3: Generate predictions
        print(f"\n[PREDICT] Generating predictions for {len(games)} games...")
        predictions = []

        for idx, game in games.iterrows():
            game_name = game.get('game_name', 'Unknown')
            prediction = generate_prediction(game, model_package)

            if prediction:
                predictions.append(prediction)
                score = prediction['ai_score']
                rec = prediction['recommendation']
                print(f"  [OK] {game_name[:40]:40s} -> Score: {score:5.1f} | {rec}")
            else:
                print(f"  [ERROR] {game_name[:40]:40s} -> Failed")

        # Step 4: Save to database
        save_predictions(predictions)

        # Success!
        print("\n" + "=" * 70)
        print("[OK] PREDICTION GENERATION COMPLETE!")
        print("=" * 70)
        print(f"Generated predictions for {len(predictions)} games")
        print(f"Saved to predictions table with date: {date.today().isoformat()}")
        print()
        print("Next steps:")
        print("  1. Check Supabase predictions table")
        print("  2. Verify predictions in your app")
        print("  3. Monitor prediction accuracy over time")
        print("=" * 70)

    except Exception as e:
        print(f"\n[ERROR] FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
