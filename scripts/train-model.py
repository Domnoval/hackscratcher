#!/usr/bin/env python3
"""
Scratch Oracle ML Training Script
Trains an XGBoost model to predict optimal lottery tickets.
Phase 1 & 2 Implementation from ML_ARCHITECTURE.md
"""

import os
import sys
import pickle
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =====================================================
# Configuration
# =====================================================

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
MODEL_OUTPUT_DIR = 'models'
MODEL_OUTPUT_PATH = os.path.join(MODEL_OUTPUT_DIR, 'lottery_predictor.pkl')

print("=" * 70)
print("[SLOT] SCRATCH ORACLE ML TRAINING PIPELINE")
print("=" * 70)
print(f"Supabase URL: {SUPABASE_URL}")
print(f"Model output: {MODEL_OUTPUT_PATH}")
print()

# Validate configuration
if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] ERROR: Missing Supabase credentials in .env file")
    sys.exit(1)

# Create Supabase client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[OK] Connected to Supabase")
except Exception as e:
    print(f"[ERROR] Failed to connect to Supabase: {e}")
    sys.exit(1)

# =====================================================
# Data Fetching
# =====================================================

def fetch_games():
    """Fetch all games from Supabase."""
    print("\n[FETCH] Fetching games from Supabase...")
    try:
        response = supabase.table('games').select('*').execute()
        games = pd.DataFrame(response.data)
        print(f"[OK] Fetched {len(games)} games")
        return games
    except Exception as e:
        print(f"[ERROR] Error fetching games: {e}")
        raise

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

# =====================================================
# Feature Engineering
# =====================================================

def engineer_features(games):
    """
    Create ML features from raw game data.
    Using SIMPLE features as recommended for limited data (41 games).
    """
    print("\n[BUILD] Engineering features...")

    features_list = []

    for idx, game in games.iterrows():
        try:
            # Basic game info
            game_id = game['id']
            ticket_price = game.get('ticket_price', 0)
            top_prize = game.get('top_prize_amount', 0)
            remaining_prizes = game.get('remaining_top_prizes', 0)
            total_prizes = game.get('total_top_prizes', 1)  # Avoid division by zero

            # Skip if essential data is missing
            if ticket_price == 0 or total_prizes == 0:
                continue

            # Feature 1: Expected Value (EV)
            # EV = (remaining_prizes * top_prize) / (total_tickets_value)
            # Simplified: (remaining/total) * (prize/price)
            prize_concentration = remaining_prizes / total_prizes if total_prizes > 0 else 0
            ev = (top_prize / ticket_price) * prize_concentration if ticket_price > 0 else 0

            # Feature 2: Prize Concentration (% of prizes remaining)
            # Higher = more prizes left = potentially better

            # Feature 3: Depletion Rate
            # How fast are prizes being claimed
            depletion_rate = 1.0 - prize_concentration

            # Feature 4: Game Age (days since launch)
            game_start = game.get('game_start_date')
            days_since_launch = calculate_days_since(game_start)

            # Feature 5: Recency (days since last update)
            last_scraped = game.get('last_scraped_at')
            recency = calculate_days_since(last_scraped)

            # Feature 6: Overall Odds
            odds = parse_odds(game.get('overall_odds'))

            # Feature 7: Velocity (approximate from available data)
            # If we had historical snapshots, we'd calculate rate of change
            # For now, use depletion rate as proxy
            velocity = depletion_rate

            # Feature 8: Prize to Price Ratio
            prize_to_price = top_prize / ticket_price if ticket_price > 0 else 0

            # Calculate TARGET (AI Score 0-100)
            # This is what we're training to predict
            target_score = calculate_target_score(
                ev, prize_concentration, depletion_rate,
                days_since_launch, recency
            )

            features_list.append({
                'game_id': game_id,
                'game_number': game.get('game_number'),
                'game_name': game.get('game_name'),
                # Features
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
                'total_prizes': total_prizes,
                # Target
                'target_score': target_score
            })

        except Exception as e:
            print(f"[WARNING]  Warning: Error processing game {game.get('game_name', 'unknown')}: {e}")
            continue

    df = pd.DataFrame(features_list)
    print(f"[OK] Engineered {len(df)} feature rows from {len(games)} games")

    if len(df) == 0:
        print("[ERROR] ERROR: No valid feature rows created!")
        sys.exit(1)

    return df

def calculate_target_score(ev, prize_concentration, depletion_rate, days_since_launch, recency):
    """
    Calculate target AI score for supervised learning.

    Components:
    - EV score (40%): Higher EV = better value
    - Concentration score (30%): More prizes remaining = better
    - Activity score (15%): Active depletion = hot game
    - Freshness score (10%): Recent data = more reliable
    - Age penalty (5%): Newer games often have more prizes
    """

    # Normalize EV to 0-100 scale (EV > 1.0 is great, > 2.0 is excellent)
    ev_score = min(ev * 50, 100)

    # Concentration: high % remaining = good
    concentration_score = prize_concentration * 100

    # Activity: some depletion is good (shows people are playing)
    # Sweet spot is 20-60% depleted
    if depletion_rate < 0.2:
        activity_score = depletion_rate * 200  # 0-40
    elif depletion_rate < 0.6:
        activity_score = 80 + (depletion_rate - 0.2) * 50  # 80-100
    else:
        activity_score = max(100 - (depletion_rate - 0.6) * 200, 0)  # 100-0

    # Freshness: recent data is more reliable
    freshness_score = max(100 - recency * 10, 0)  # Decays 10 points per day

    # Age penalty: games older than 6 months might be getting stale
    age_penalty = 0
    if days_since_launch > 180:
        age_penalty = min((days_since_launch - 180) / 10, 50)

    # Weighted average
    score = (
        ev_score * 0.40 +
        concentration_score * 0.30 +
        activity_score * 0.15 +
        freshness_score * 0.10
    ) - age_penalty * 0.05

    return max(0, min(score, 100))

# =====================================================
# Model Training
# =====================================================

def train_model(df):
    """
    Train XGBoost model with cross-validation.
    Using conservative parameters to avoid overfitting on small dataset.
    """
    print("\n[AI] Training XGBoost model...")

    # Define features for training (exclude metadata and target)
    feature_cols = [
        'ticket_price', 'ev', 'prize_concentration', 'depletion_rate',
        'days_since_launch', 'recency', 'odds', 'velocity',
        'prize_to_price', 'remaining_prizes', 'total_prizes'
    ]

    X = df[feature_cols]
    y = df['target_score']

    print(f"Training set: {len(X)} samples, {len(feature_cols)} features")
    print(f"Features: {', '.join(feature_cols)}")
    print(f"Target range: [{y.min():.2f}, {y.max():.2f}]")
    print()

    # Split data (80/20 train/test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

    # Create XGBoost model with conservative parameters
    # (to avoid overfitting on limited data)
    model = xgb.XGBRegressor(
        n_estimators=100,           # Fewer trees for small dataset
        max_depth=4,                # Shallow trees to prevent overfitting
        learning_rate=0.1,          # Moderate learning rate
        subsample=0.8,              # Use 80% of data per tree
        colsample_bytree=0.8,       # Use 80% of features per tree
        reg_alpha=1.0,              # L1 regularization
        reg_lambda=1.0,             # L2 regularization
        random_state=42,
        objective='reg:squarederror'
    )

    # Train model
    print("Training in progress...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    # Evaluate on test set
    print("\n[STATS] Model Performance:")
    print("-" * 70)

    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)

    # Training metrics
    train_mae = mean_absolute_error(y_train, y_pred_train)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    train_r2 = r2_score(y_train, y_pred_train)

    # Test metrics
    test_mae = mean_absolute_error(y_test, y_pred_test)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    test_r2 = r2_score(y_test, y_pred_test)

    print("Training Set:")
    print(f"  MAE:  {train_mae:.2f}")
    print(f"  RMSE: {train_rmse:.2f}")
    print(f"  R²:   {train_r2:.4f}")
    print()
    print("Test Set:")
    print(f"  MAE:  {test_mae:.2f}")
    print(f"  RMSE: {test_rmse:.2f}")
    print(f"  R²:   {test_r2:.4f}")
    print()

    # Check for overfitting
    if train_r2 - test_r2 > 0.3:
        print("[WARNING]  WARNING: Possible overfitting detected (train R² >> test R²)")
    else:
        print("[OK] Model generalization looks good!")

    print("-" * 70)

    # Feature importance
    print("\n[CHART] Feature Importance:")
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    for _, row in feature_importance.iterrows():
        print(f"  {row['feature']:25s}: {row['importance']:.4f}")

    return model, feature_cols, {
        'train_mae': train_mae,
        'train_rmse': train_rmse,
        'train_r2': train_r2,
        'test_mae': test_mae,
        'test_rmse': test_rmse,
        'test_r2': test_r2,
        'n_samples': len(df),
        'n_features': len(feature_cols)
    }

# =====================================================
# Model Persistence
# =====================================================

def save_model(model, feature_cols, metrics):
    """Save trained model and metadata to disk."""
    print(f"\n[SAVE] Saving model to {MODEL_OUTPUT_PATH}...")

    # Create models directory if it doesn't exist
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)

    # Package model with metadata
    model_package = {
        'model': model,
        'feature_cols': feature_cols,
        'metrics': metrics,
        'version': 'v1.0',
        'framework': 'xgboost',
        'trained_at': datetime.now().isoformat(),
        'training_config': {
            'n_estimators': 100,
            'max_depth': 4,
            'learning_rate': 0.1
        }
    }

    # Save using pickle
    with open(MODEL_OUTPUT_PATH, 'wb') as f:
        pickle.dump(model_package, f)

    file_size = os.path.getsize(MODEL_OUTPUT_PATH) / 1024  # KB
    print(f"[OK] Model saved successfully ({file_size:.1f} KB)")

# =====================================================
# Main Execution
# =====================================================

def main():
    """Main training pipeline."""
    try:
        # Step 1: Fetch data
        games = fetch_games()

        if len(games) == 0:
            print("[ERROR] ERROR: No games found in database!")
            sys.exit(1)

        # Step 2: Engineer features
        df = engineer_features(games)

        if len(df) < 10:
            print(f"[ERROR] ERROR: Insufficient data for training (only {len(df)} valid samples)")
            print("   Need at least 10 games with complete data")
            sys.exit(1)

        # Step 3: Train model
        model, feature_cols, metrics = train_model(df)

        # Step 4: Save model
        save_model(model, feature_cols, metrics)

        # Success!
        print("\n" + "=" * 70)
        print("[OK] TRAINING COMPLETE!")
        print("=" * 70)
        print(f"Model location: {MODEL_OUTPUT_PATH}")
        print(f"Test R²: {metrics['test_r2']:.4f}")
        print(f"Test MAE: {metrics['test_mae']:.2f}")
        print()
        print("Next steps:")
        print("  1. Run: npm run generate-predictions")
        print("  2. Check the predictions table in Supabase")
        print("=" * 70)

    except Exception as e:
        print(f"\n[ERROR] FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
