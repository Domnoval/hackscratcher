# Machine Learning Architecture for Scratch Oracle

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: Research & Planning Phase

---

## Executive Summary

This document outlines the machine learning architecture for predicting which Minnesota scratch-off lottery games are most likely to have winning tickets remaining. Given the constraints of limited historical data in the initial phase, we recommend a **hybrid ensemble approach** that combines:

1. **Rule-based heuristics** (immediate deployment)
2. **Traditional ML models** (shallow learning with feature engineering)
3. **Deep learning** (future enhancement after 6-12 months of data collection)

**Key Recommendation**: Start with PyTorch for flexibility, scalability, and mobile deployment readiness (TorchScript/ONNX support).

**Expected Performance**:
- Phase 1 (Heuristics): 65-70% accuracy
- Phase 2 (Traditional ML): 75-80% accuracy
- Phase 3 (Deep Learning): 82-88% accuracy

---

## Table of Contents

1. [Problem Definition](#1-problem-definition)
2. [Data Analysis & Feature Engineering](#2-data-analysis--feature-engineering)
3. [Model Architecture Strategy](#3-model-architecture-strategy)
4. [Phase 1: Rule-Based System (Current)](#4-phase-1-rule-based-system-current)
5. [Phase 2: Traditional ML (3-6 months)](#5-phase-2-traditional-ml-3-6-months)
6. [Phase 3: Deep Learning (6-12 months)](#6-phase-3-deep-learning-6-12-months)
7. [Training Strategy](#7-training-strategy)
8. [Evaluation Metrics](#8-evaluation-metrics)
9. [Production Architecture](#9-production-architecture)
10. [Code Examples](#10-code-examples)
11. [Data Collection Requirements](#11-data-collection-requirements)
12. [Risk Mitigation](#12-risk-mitigation)

---

## 1. Problem Definition

### 1.1 Core Prediction Task

**Primary Objective**: Predict the probability that a scratch-off game will yield winning tickets within the next 24-48 hours.

**Classification Problem**: Multi-class classification
- Class 0: Low probability (0-40% hotness)
- Class 1: Medium probability (40-70% hotness)
- Class 2: High probability (70-100% hotness)

**Regression Problem**: Predict continuous hotness score (0-100)

### 1.2 Business Constraints

- **Cold Start Problem**: Limited historical data at launch
- **Data Frequency**: Weekly updates from MN Lottery (not real-time)
- **Sample Size**: 41 active games (small dataset)
- **Regulatory**: Must not claim to "guarantee" wins
- **Performance**: Mobile-friendly inference (<100ms)
- **Cost**: Free tier on cloud platforms initially

### 1.3 Success Metrics

- **Accuracy**: 75%+ for 24h predictions (Phase 2 target)
- **Precision**: Minimize false positives (avoid recommending bad tickets)
- **Recall**: Maximize true positives (catch hot tickets)
- **User Retention**: D7 retention 40%+ (indirect ML metric)
- **ROI Impact**: Users report 10%+ better outcomes vs random selection

---

## 2. Data Analysis & Feature Engineering

### 2.1 Available Data Sources

Based on `DATABASE_SCHEMA.md`, we have access to:

#### Primary Tables
1. **games**: Static game info (41 games)
2. **prize_tiers**: Prize structure (multiple tiers per game)
3. **historical_snapshots**: Time-series data (daily/weekly)
4. **wins**: Reported winning tickets (store + prize info)
5. **stores**: Geographic data (heat map)
6. **user_scans**: User-generated feedback loop

#### Derived Data
- MN Lottery API scrapes (weekly)
- Moon phases (from Lucky Mode)
- Day of week, seasonality
- User behavior patterns

### 2.2 Feature Categories

#### A. Game-Level Features (Static/Semi-Static)

```python
GAME_FEATURES = {
    # Price & Economics
    'ticket_price': [1, 2, 3, 5, 10, 20, 30],  # Categorical
    'top_prize_amount': float,                   # Normalize by price
    'overall_odds': float,                       # Parse "1 in X"
    'price_to_prize_ratio': float,               # top_prize / ticket_price

    # Prize Structure
    'total_prize_tiers': int,                    # Count of different prize levels
    'prize_distribution_entropy': float,         # Shannon entropy of prize distribution
    'prize_concentration': float,                # Gini coefficient

    # Game Lifecycle
    'days_since_launch': int,
    'game_age_percentile': float,                # Relative to other active games
    'is_new_game': bool,                         # <30 days old
    'is_end_of_life': bool,                      # game_end_date within 60 days

    # Ticket Supply
    'total_tickets_printed': int,
    'estimated_tickets_remaining': int,
    'ticket_depletion_rate': float,              # % of original supply remaining
}
```

#### B. Time-Series Features (Dynamic)

```python
TIME_SERIES_FEATURES = {
    # Prize Dynamics (from historical_snapshots)
    'top_prizes_remaining': int,
    'top_prize_depletion_velocity': float,       # Prizes claimed per day (7-day window)
    'prize_claim_acceleration': float,           # Change in velocity (2nd derivative)
    'days_since_last_top_prize': int,

    # Expected Value Trends
    'current_ev': float,
    'ev_7day_moving_avg': float,
    'ev_trend_slope': float,                     # Linear regression slope
    'ev_volatility': float,                      # Std dev over 30 days

    # Hotness History
    'current_hotness': float,
    'hotness_momentum': float,                   # Rate of change
    'hotness_7day_max': float,
    'hotness_7day_min': float,
    'hotness_crosses_above_70': int,             # Count in last 30 days

    # Lagged Features
    'hotness_lag_1d': float,
    'hotness_lag_3d': float,
    'hotness_lag_7d': float,
}
```

#### C. Aggregate Prize Tier Features

```python
PRIZE_TIER_FEATURES = {
    # Multi-tier analysis (join with prize_tiers table)
    'high_value_prizes_remaining': int,          # Prizes > $1000
    'mid_value_prizes_remaining': int,           # Prizes $100-$1000
    'low_value_prizes_remaining': int,           # Prizes < $100

    'high_value_depletion_rate': float,
    'prize_tier_correlation': float,             # Correlation between tier depletion rates

    # Expected value by tier
    'ev_high_tier': float,
    'ev_mid_tier': float,
    'ev_low_tier': float,
}
```

#### D. Temporal/Seasonal Features

```python
TEMPORAL_FEATURES = {
    # Calendar
    'day_of_week': int,                          # 0-6 (one-hot encode)
    'day_of_month': int,
    'is_weekend': bool,
    'is_payday_week': bool,                      # 1st and 15th proximity
    'days_until_weekend': int,

    # Seasonal (for future multi-year data)
    'month': int,                                # 1-12 (one-hot encode)
    'quarter': int,                              # 1-4
    'is_holiday_week': bool,                     # Major holidays

    # Lucky Mode Integration (optional)
    'moon_phase': str,                           # 8 phases (one-hot encode)
    'moon_phase_energy': float,                  # 0-1 score
}
```

#### E. Geospatial Features (from wins + stores tables)

```python
GEOSPATIAL_FEATURES = {
    # Win clustering
    'total_wins_last_30d': int,
    'top_prize_wins_last_30d': int,
    'win_geographic_spread': float,              # Std dev of lat/long of wins
    'hot_store_count': int,                      # Stores with heat_score > 70

    # Store-level aggregation
    'avg_store_heat_score': float,
    'max_store_heat_score': float,
    'stores_with_recent_wins': int,              # Last 7 days
}
```

#### F. User Behavior Features (from user_scans)

```python
USER_FEATURES = {
    # Aggregated scan data
    'scan_count_last_7d': int,
    'win_rate_last_30d': float,                  # Wins / total scans
    'avg_prize_amount': float,

    # Wisdom of the crowd
    'user_interest_score': float,                # Scan volume as proxy for popularity
    'scan_velocity_change': float,               # Change in scan rate
}
```

### 2.3 Feature Engineering Pipeline

```python
# Example feature engineering process
def engineer_features(game_row, historical_data, prize_data, win_data):
    """
    Transform raw database records into ML-ready feature vector
    """
    features = {}

    # 1. Basic game features
    features['ticket_price'] = game_row['ticket_price']
    features['days_since_launch'] = (datetime.now() - game_row['game_start_date']).days

    # 2. Time-series aggregations (window functions)
    hist_7d = historical_data[-7:]  # Last 7 snapshots
    features['ev_7day_avg'] = np.mean([h['expected_value'] for h in hist_7d])
    features['ev_trend_slope'] = calculate_slope(hist_7d, 'expected_value')

    # 3. Prize tier aggregations
    features['high_value_remaining'] = sum(
        p['remaining_prizes'] for p in prize_data
        if p['prize_amount'] >= 1000
    )

    # 4. Interaction features
    features['ev_x_momentum'] = features['current_ev'] * features['hotness_momentum']
    features['price_tier_interaction'] = features['ticket_price'] * features['high_value_remaining']

    # 5. Normalization
    features = normalize_features(features)

    return features
```

### 2.4 Feature Importance (Expected)

Based on domain knowledge and similar lottery prediction systems:

**High Importance** (>10% feature weight):
1. Current EV (15-20%)
2. Top prizes remaining (12-18%)
3. Days since last top prize (10-15%)
4. Ticket depletion rate (8-12%)
5. Prize claim velocity (8-10%)

**Medium Importance** (5-10%):
6. Day of week (5-8%)
7. Hotness momentum (5-7%)
8. Game age (4-6%)
9. Win clustering (4-6%)

**Low Importance** (<5%):
10. Moon phase (2-4%) - Fun factor, minimal predictive power
11. Store heat score (2-3%)
12. User scan velocity (1-3%)

---

## 3. Model Architecture Strategy

### 3.1 Why NOT Pure Deep Learning (Initially)

**Reasons to avoid deep neural networks in Phase 1-2:**

1. **Insufficient Data**: 41 games × weekly updates = ~2,000 data points/year (too small)
2. **Overfitting Risk**: DNNs need 10,000+ samples; we'd memorize noise
3. **Interpretability**: Regulatory concerns require explainable predictions
4. **Cold Start**: Can't train DNNs from scratch with zero history
5. **Computational Cost**: Overkill for tabular data with <100 features

**When to use deep learning**: After 12+ months of data (>10,000 snapshots)

### 3.2 Recommended Approach: Hybrid Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    ENSEMBLE PREDICTION                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Rule-Based │  │  Gradient    │  │   Neural Net │     │
│  │   Heuristics │  │   Boosting   │  │   (Future)   │     │
│  │              │  │   (XGBoost)  │  │              │     │
│  │   Weight:40% │  │   Weight:50% │  │   Weight:10% │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            ▼                                 │
│                   Weighted Average                           │
│                            ▼                                 │
│                   Final Hotness Score                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Framework Choice: PyTorch vs TensorFlow

**Recommendation: PyTorch**

| Criteria | PyTorch | TensorFlow | Winner |
|----------|---------|------------|--------|
| Ease of Learning | Pythonic, intuitive | Verbose, complex | PyTorch |
| Mobile Deployment | TorchScript, ONNX | TFLite | Tie |
| Community Support | Strong, research-focused | Strong, production-focused | Tie |
| Tabular Data | Good with libraries | Good with Keras | Tie |
| Flexibility | Highly flexible | More rigid | PyTorch |
| Production Stability | Improving | Mature | TensorFlow |
| React Native Integration | Via ONNX Runtime | Via TFLite | Tie |

**Verdict**: PyTorch wins on developer experience and flexibility. Use ONNX for mobile deployment.

**Alternative**: For Phase 2 (traditional ML), consider **scikit-learn + XGBoost** (no PyTorch needed yet).

---

## 4. Phase 1: Rule-Based System (Current)

**Status**: Implemented in `services/ai/aiPredictionEngine.ts`
**Accuracy**: 65-70% (estimated)
**Timeline**: Already deployed (MVP)

### 4.1 Current Logic

The existing system uses:
- EV calculations
- Trend analysis (30-day windows)
- Pattern detection (prize claim spikes, weekend patterns)
- Signal generation (prize velocity, moon phase)
- Confidence scoring

### 4.2 Strengths

✅ No training data required
✅ Fully explainable
✅ Fast inference (<10ms)
✅ Works on day 1
✅ Integrates Lucky Mode for engagement

### 4.3 Limitations

❌ No learning from outcomes
❌ Brittle to market changes
❌ Manual tuning required
❌ Cannot discover complex patterns
❌ Limited accuracy ceiling (~70%)

### 4.4 Recommended Enhancements

```typescript
// Add to existing aiPredictionEngine.ts

/**
 * Enhanced signal: Multi-tier prize correlation
 */
private static detectPrizeTierCascade(
  prizeTiers: PrizeTier[],
  historicalPrizeTiers: PrizeTier[][]
): PredictionSignal | null {
  // If multiple high-tier prizes claimed recently,
  // predict increased attention and sales velocity

  const recentHighClaims = countRecentClaims(historicalPrizeTiers, threshold=1000);

  if (recentHighClaims >= 2) {
    return {
      type: 'prize_tier_cascade',
      strength: Math.min(recentHighClaims / 3, 1.0),
      direction: 'positive',
      description: `${recentHighClaims} high-value prizes claimed. Media attention likely.`
    };
  }

  return null;
}

/**
 * Enhanced signal: Store clustering
 */
private static detectStoreClusteringSignal(
  gameId: string,
  wins: Win[],
  stores: Store[]
): PredictionSignal | null {
  // If wins concentrated in geographic area, predict hot spot

  const recentWins = wins.filter(w =>
    w.gameId === gameId &&
    withinDays(w.win_date, 7)
  );

  if (recentWins.length < 3) return null;

  const geoSpread = calculateGeographicSpread(recentWins, stores);

  if (geoSpread < 50) { // Within 50km radius
    return {
      type: 'store_clustering',
      strength: 0.7,
      direction: 'positive',
      description: `${recentWins.length} wins clustered in ${geoSpread.toFixed(0)}km area`
    };
  }

  return null;
}
```

---

## 5. Phase 2: Traditional ML (3-6 months)

**Timeline**: After collecting 12-24 weeks of historical_snapshots
**Expected Accuracy**: 75-80%
**Model**: Gradient Boosting (XGBoost or LightGBM)

### 5.1 Why Gradient Boosting?

**Advantages for lottery prediction:**
- ✅ Excellent for tabular data
- ✅ Handles missing values gracefully
- ✅ Built-in feature importance
- ✅ Resistant to overfitting (with tuning)
- ✅ Fast training (<1 minute on CPU)
- ✅ Small model size (<10MB)
- ✅ No need for massive datasets

**XGBoost vs LightGBM:**
- XGBoost: More mature, better documentation
- LightGBM: Faster, better with categorical features
- **Recommendation**: Start with XGBoost, evaluate LightGBM later

### 5.2 Architecture

```python
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, f1_score

class LotteryXGBoostModel:
    def __init__(self):
        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',  # Regression for hotness score
            n_estimators=200,               # Number of trees
            max_depth=6,                    # Prevent overfitting
            learning_rate=0.05,             # Conservative learning
            subsample=0.8,                  # Use 80% of data per tree
            colsample_bytree=0.8,           # Use 80% of features per tree
            reg_alpha=0.5,                  # L1 regularization
            reg_lambda=1.0,                 # L2 regularization
            random_state=42
        )

    def train(self, X_train, y_train, X_val, y_val):
        """
        Train with early stopping
        """
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            early_stopping_rounds=20,
            verbose=False
        )

        return self.model

    def predict(self, X):
        """
        Predict hotness scores
        """
        predictions = self.model.predict(X)
        # Clamp to 0-100
        return np.clip(predictions, 0, 100)

    def get_feature_importance(self):
        """
        Explain predictions
        """
        importance = self.model.get_booster().get_score(
            importance_type='gain'
        )
        return sorted(
            importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
```

### 5.3 Data Pipeline

```python
class HistoricalDataPipeline:
    """
    ETL pipeline: Supabase → Feature Matrix → XGBoost
    """

    def __init__(self, supabase_client):
        self.db = supabase_client

    def load_training_data(self, start_date, end_date):
        """
        Load historical snapshots with joins
        """
        # Query historical_snapshots with game info
        snapshots = self.db.table('historical_snapshots') \
            .select('*, games(*), prize_tiers(*)') \
            .gte('snapshot_date', start_date) \
            .lte('snapshot_date', end_date) \
            .execute()

        return snapshots.data

    def create_feature_matrix(self, snapshots):
        """
        Convert raw data to feature vectors
        """
        X = []
        y = []

        for snapshot in snapshots:
            features = self.engineer_features(snapshot)
            X.append(features)

            # Target: hotness score 7 days later
            future_hotness = self.get_future_hotness(
                snapshot['game_id'],
                snapshot['snapshot_date'],
                days_ahead=7
            )
            y.append(future_hotness)

        return np.array(X), np.array(y)

    def engineer_features(self, snapshot):
        """
        Apply feature engineering from section 2.2
        """
        game = snapshot['games']
        prize_tiers = snapshot['prize_tiers']

        features = [
            # Game features
            game['ticket_price'],
            game['top_prize_amount'] / game['ticket_price'],
            self.parse_odds(game['overall_odds']),

            # Snapshot features
            snapshot['remaining_top_prizes'],
            snapshot['top_prize_depletion_rate'],
            snapshot['expected_value'],

            # Derived features
            self.days_since_launch(game['game_start_date']),
            self.prize_concentration(prize_tiers),

            # ... (40-60 total features)
        ]

        return features
```

### 5.4 Training Strategy

```python
def train_xgboost_model():
    """
    Full training pipeline with time-series cross-validation
    """
    # 1. Load data
    pipeline = HistoricalDataPipeline(supabase_client)
    snapshots = pipeline.load_training_data('2025-01-01', '2025-12-31')

    # 2. Create features
    X, y = pipeline.create_feature_matrix(snapshots)

    # 3. Time-series split (no data leakage)
    tscv = TimeSeriesSplit(n_splits=5)

    scores = []
    for train_idx, val_idx in tscv.split(X):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # 4. Train model
        model = LotteryXGBoostModel()
        model.train(X_train, y_train, X_val, y_val)

        # 5. Evaluate
        y_pred = model.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        scores.append(mae)

        print(f"Fold MAE: {mae:.2f}")

    print(f"Average MAE: {np.mean(scores):.2f}")

    # 6. Train on full dataset
    final_model = LotteryXGBoostModel()
    final_model.train(X, y, X[-100:], y[-100:])  # Use last 100 as validation

    # 7. Save model
    final_model.model.save_model('lottery_xgboost_v1.json')

    return final_model
```

---

## 6. Phase 3: Deep Learning (6-12 months)

**Timeline**: After 6-12 months of data collection (>10,000 snapshots)
**Expected Accuracy**: 82-88%
**Model**: Temporal Fusion Transformer or LSTM Ensemble

### 6.1 Why Deep Learning (Eventually)?

Once we have sufficient data:
- Automatically learn complex temporal patterns
- Model non-linear interactions
- Handle multi-game dependencies
- Incorporate unstructured data (news, social media)
- Transfer learning from other lottery markets

### 6.2 Recommended Architecture: Temporal Fusion Transformer (TFT)

**Why TFT over LSTM?**
- State-of-the-art for time-series forecasting
- Built-in attention mechanism (interpretability)
- Handles mixed static/dynamic features natively
- Proven on similar tabular time-series tasks

**Architecture Diagram:**

```
Input Features
├── Static (game-level): [41 games × 15 features]
├── Dynamic (time-series): [T timesteps × 30 features]
└── Known Future (calendar): [T timesteps × 8 features]
      │
      ▼
┌─────────────────────────────────────────┐
│         VARIABLE SELECTION              │
│  (Learned feature importance via LSTM)  │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│         STATIC ENRICHMENT               │
│  (Context vector from static features)  │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      TEMPORAL PROCESSING (LSTM)         │
│  - Past observations (encoder)          │
│  - Future known inputs (decoder)        │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│    MULTI-HEAD ATTENTION                 │
│  (Learn temporal dependencies)          │
└─────────────┬───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│    POSITION-WISE FEED-FORWARD           │
│  (Final prediction layers)              │
└─────────────┬───────────────────────────┘
              ▼
        Output: Hotness Score (0-100)
```

### 6.3 PyTorch Implementation

```python
import torch
import torch.nn as nn
from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet

class LotteryTFT:
    """
    Temporal Fusion Transformer for lottery prediction
    """

    def __init__(self, config):
        self.config = config
        self.model = None

    def prepare_dataset(self, df):
        """
        Convert DataFrame to TimeSeriesDataSet

        df columns:
        - game_id: Unique game identifier
        - snapshot_date: Date of observation
        - Static features: ticket_price, overall_odds, etc.
        - Dynamic features: ev, hotness, prizes_remaining, etc.
        - Target: hotness_7d_ahead
        """

        # Define dataset
        training = TimeSeriesDataSet(
            df[lambda x: x.snapshot_date < '2025-10-01'],
            time_idx='time_idx',           # Sequential index
            target='hotness_7d_ahead',     # What to predict
            group_ids=['game_id'],         # Group by game
            max_encoder_length=30,         # Use 30 days of history
            max_prediction_length=7,       # Predict 7 days ahead

            # Static features (don't change over time)
            static_categoricals=['game_id'],
            static_reals=[
                'ticket_price',
                'top_prize_amount',
                'overall_odds'
            ],

            # Dynamic features (change over time)
            time_varying_known_categoricals=[
                'day_of_week',
                'month',
                'moon_phase'
            ],
            time_varying_known_reals=[
                'days_since_launch',
                'is_weekend'
            ],
            time_varying_unknown_reals=[
                'current_ev',
                'hotness',
                'top_prizes_remaining',
                'prize_claim_velocity'
            ],

            # Normalization
            target_normalizer=nn.GroupNormalizer(
                groups=['game_id'],
                transformation='softplus'
            ),

            # Allow missing values
            allow_missing_timesteps=True
        )

        return training

    def build_model(self, training_dataset):
        """
        Build TFT model
        """
        self.model = TemporalFusionTransformer.from_dataset(
            training_dataset,

            # Architecture
            hidden_size=64,                 # Embedding dimension
            lstm_layers=2,                  # Number of LSTM layers
            attention_head_size=4,          # Multi-head attention
            dropout=0.1,                    # Regularization

            # Training
            learning_rate=0.001,
            reduce_on_plateau_patience=4,

            # Loss function
            loss=nn.QuantileLoss(),         # Robust to outliers

            # Logging
            log_interval=10
        )

        return self.model

    def train(self, train_dataloader, val_dataloader, epochs=50):
        """
        Train TFT model
        """
        from pytorch_lightning import Trainer
        from pytorch_lightning.callbacks import EarlyStopping

        early_stop = EarlyStopping(
            monitor='val_loss',
            patience=10,
            mode='min'
        )

        trainer = Trainer(
            max_epochs=epochs,
            gpus=1 if torch.cuda.is_available() else 0,
            gradient_clip_val=0.1,
            callbacks=[early_stop]
        )

        trainer.fit(
            self.model,
            train_dataloaders=train_dataloader,
            val_dataloaders=val_dataloader
        )

        return self.model

    def predict(self, game_id, current_date):
        """
        Predict hotness 7 days ahead
        """
        # Load recent history for game
        history = self.load_history(game_id, days=30)

        # Make prediction
        prediction = self.model.predict(
            history,
            mode='prediction',
            return_x=False
        )

        return prediction[0].item()  # Return scalar hotness

    def explain_prediction(self, game_id):
        """
        Use attention weights to explain predictions
        """
        raw_predictions, x = self.model.predict(
            self.load_history(game_id, days=30),
            mode='raw',
            return_x=True
        )

        # Extract attention weights
        attention = raw_predictions['attention']

        # Get top features
        feature_importance = attention.mean(dim=(0, 1))

        top_features = torch.topk(feature_importance, k=5)

        return {
            'top_features': top_features.indices.tolist(),
            'importance_scores': top_features.values.tolist()
        }
```

### 6.4 Alternative: LSTM Ensemble

For a simpler approach than TFT:

```python
class LotteryLSTM(nn.Module):
    """
    Bidirectional LSTM for lottery prediction
    """

    def __init__(self, input_size=50, hidden_size=128, num_layers=3, dropout=0.2):
        super().__init__()

        # Embedding for static features
        self.static_embedding = nn.Linear(15, 32)

        # LSTM for temporal features
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            bidirectional=True,
            batch_first=True
        )

        # Attention layer
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size * 2,  # Bidirectional
            num_heads=8
        )

        # Output layers
        self.fc1 = nn.Linear(hidden_size * 2 + 32, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 1)  # Output: hotness score

        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)

    def forward(self, x_temporal, x_static):
        """
        Forward pass

        x_temporal: [batch, seq_len, features] - Time-series data
        x_static: [batch, static_features] - Game-level features
        """
        # Process static features
        static_emb = self.relu(self.static_embedding(x_static))

        # Process temporal features
        lstm_out, (hidden, cell) = self.lstm(x_temporal)

        # Apply attention
        attn_out, attn_weights = self.attention(
            lstm_out, lstm_out, lstm_out
        )

        # Take last timestep
        last_hidden = attn_out[:, -1, :]

        # Concatenate static and temporal
        combined = torch.cat([last_hidden, static_emb], dim=1)

        # Feed-forward layers
        x = self.relu(self.fc1(combined))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.fc3(x)

        # Output: hotness score (0-100)
        return torch.sigmoid(x) * 100
```

### 6.5 Training Deep Learning Model

```python
def train_deep_learning_model():
    """
    Full DL training pipeline
    """
    # 1. Load data (need 6-12 months)
    df = load_from_supabase(start_date='2025-01-01', end_date='2025-12-31')

    # Verify sufficient data
    if len(df) < 10000:
        print("Insufficient data for DL. Use XGBoost instead.")
        return None

    # 2. Prepare dataset
    tft = LotteryTFT(config={})
    training_dataset = tft.prepare_dataset(df)

    # 3. Create dataloaders
    train_dataloader = training_dataset.to_dataloader(
        train=True, batch_size=64, num_workers=4
    )

    val_dataset = TimeSeriesDataSet.from_dataset(
        training_dataset,
        df[lambda x: x.snapshot_date >= '2025-10-01']
    )
    val_dataloader = val_dataset.to_dataloader(
        train=False, batch_size=64, num_workers=4
    )

    # 4. Build and train
    model = tft.build_model(training_dataset)
    trained_model = tft.train(train_dataloader, val_dataloader, epochs=50)

    # 5. Evaluate
    actuals = []
    predictions = []

    for x, y in val_dataloader:
        pred = model(x)
        predictions.extend(pred.tolist())
        actuals.extend(y.tolist())

    mae = mean_absolute_error(actuals, predictions)
    print(f"Validation MAE: {mae:.2f}")

    # 6. Save model
    torch.save(model.state_dict(), 'lottery_tft_v1.pth')

    # 7. Export to ONNX for mobile
    export_to_onnx(model, 'lottery_tft_v1.onnx')

    return model
```

---

## 7. Training Strategy

### 7.1 Data Splitting (Time-Series Safe)

**Critical**: Never use random train/test split for time-series data (causes data leakage).

```python
def create_time_series_splits(df, val_weeks=4, test_weeks=4):
    """
    Create chronological splits

    Train: All data up to -8 weeks
    Validation: -8 to -4 weeks
    Test: Last 4 weeks
    """
    df = df.sort_values('snapshot_date')

    total_weeks = (df['snapshot_date'].max() - df['snapshot_date'].min()).days // 7

    train_end_week = total_weeks - val_weeks - test_weeks
    val_end_week = total_weeks - test_weeks

    train = df[df['week_index'] <= train_end_week]
    val = df[(df['week_index'] > train_end_week) & (df['week_index'] <= val_end_week)]
    test = df[df['week_index'] > val_end_week]

    return train, val, test
```

### 7.2 Cross-Validation

Use **TimeSeriesSplit** instead of KFold:

```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)

for train_idx, val_idx in tscv.split(X):
    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]

    # Train and evaluate
    model.fit(X_train, y_train)
    score = model.score(X_val, y_val)
    print(f"Fold score: {score}")
```

### 7.3 Handling Limited Data

**Techniques for small datasets:**

1. **Data Augmentation** (Synthetic minority over-sampling)
   ```python
   from imblearn.over_sampling import SMOTE

   # Balance classes if using classification
   smote = SMOTE(random_state=42)
   X_resampled, y_resampled = smote.fit_resample(X, y)
   ```

2. **Transfer Learning** (Phase 3)
   - Pre-train on other state lotteries (Wisconsin, Iowa)
   - Fine-tune on Minnesota data

   ```python
   # Load pre-trained model from multi-state dataset
   base_model = torch.load('multi_state_model.pth')

   # Freeze early layers
   for param in base_model.lstm.parameters():
       param.requires_grad = False

   # Fine-tune output layers on MN data
   optimizer = torch.optim.Adam(
       filter(lambda p: p.requires_grad, base_model.parameters()),
       lr=0.0001
   )
   ```

3. **Ensemble Methods**
   - Combine multiple weak models
   - Bootstrap aggregating (bagging)

   ```python
   from sklearn.ensemble import BaggingRegressor

   ensemble = BaggingRegressor(
       base_estimator=LotteryXGBoostModel(),
       n_estimators=10,
       max_samples=0.8,
       random_state=42
   )
   ```

4. **Regularization**
   - L1/L2 penalties
   - Dropout (neural nets)
   - Early stopping

   ```python
   # XGBoost regularization
   model = xgb.XGBRegressor(
       reg_alpha=0.5,   # L1
       reg_lambda=1.0,  # L2
       max_depth=4      # Limit tree depth
   )
   ```

### 7.4 Training Schedule

**Phase 1 (Months 0-3)**: Rule-based only
- No training required
- Manual tuning of heuristics
- Collect baseline accuracy metrics

**Phase 2 (Months 3-6)**: Introduce XGBoost
- Weekly re-training on new data
- Gradual increase in model weight (0% → 50%)
- A/B test against rule-based

**Phase 3 (Months 6-12)**: Add deep learning
- Monthly re-training (computationally expensive)
- Ensemble: 40% rules + 40% XGBoost + 20% DL
- Continuous monitoring

**Phase 4 (Year 2+)**: Full ML pipeline
- Ensemble: 20% rules + 30% XGBoost + 50% DL
- Automated retraining (CI/CD)
- Multi-state transfer learning

---

## 8. Evaluation Metrics

### 8.1 Primary Metrics

**For Regression (Hotness Score 0-100):**

1. **Mean Absolute Error (MAE)**
   ```python
   from sklearn.metrics import mean_absolute_error

   mae = mean_absolute_error(y_true, y_pred)
   # Target: MAE < 10 (within 10 points)
   ```

2. **Root Mean Squared Error (RMSE)**
   ```python
   from sklearn.metrics import mean_squared_error

   rmse = np.sqrt(mean_squared_error(y_true, y_pred))
   # Target: RMSE < 12
   ```

3. **R-squared (R²)**
   ```python
   from sklearn.metrics import r2_score

   r2 = r2_score(y_true, y_pred)
   # Target: R² > 0.70 (explains 70% of variance)
   ```

**For Classification (Buy/Wait/Avoid):**

4. **Accuracy**
   ```python
   from sklearn.metrics import accuracy_score

   # Convert hotness to classes
   y_true_class = categorize_hotness(y_true)
   y_pred_class = categorize_hotness(y_pred)

   accuracy = accuracy_score(y_true_class, y_pred_class)
   # Target: Accuracy > 75%
   ```

5. **Precision (Avoid false positives)**
   ```python
   from sklearn.metrics import precision_score

   precision = precision_score(y_true_class, y_pred_class, average='weighted')
   # Target: Precision > 0.80 (don't recommend bad tickets)
   ```

6. **Recall (Catch hot tickets)**
   ```python
   from sklearn.metrics import recall_score

   recall = recall_score(y_true_class, y_pred_class, average='weighted')
   # Target: Recall > 0.75 (find most hot tickets)
   ```

7. **F1 Score (Balanced)**
   ```python
   from sklearn.metrics import f1_score

   f1 = f1_score(y_true_class, y_pred_class, average='weighted')
   # Target: F1 > 0.78
   ```

### 8.2 Business Metrics

**User-Facing:**

1. **Recommendation Win Rate**
   - % of "Buy Now" recommendations that had hotness increase
   - Target: >70% correct directional predictions

2. **User ROI**
   - Track user_scans table for win rate
   - Compare users who follow AI vs those who don't
   - Target: 10-15% higher win rate for AI followers

3. **Confidence Calibration**
   - Do 80% confidence predictions succeed 80% of the time?
   - Use calibration curves

   ```python
   from sklearn.calibration import calibration_curve

   prob_true, prob_pred = calibration_curve(
       y_true_binary,
       confidence_scores / 100,
       n_bins=10
   )

   # Plot: ideal is diagonal line
   ```

### 8.3 Model Performance Tracking

Store in `model_performance` table:

```sql
INSERT INTO model_performance (
  model_version,
  evaluation_date,
  accuracy,
  precision_score,
  recall_score,
  f1_score,
  mean_absolute_error,
  test_set_size,
  training_set_size,
  notes
) VALUES (
  'xgboost_v1.2',
  '2025-06-15',
  0.78,
  0.81,
  0.76,
  0.785,
  9.3,
  500,
  2000,
  'Added prize tier cascade feature'
);
```

### 8.4 A/B Testing Framework

```python
class ModelABTest:
    """
    A/B test new model vs baseline
    """

    def __init__(self, model_a, model_b, split_ratio=0.5):
        self.model_a = model_a  # Baseline
        self.model_b = model_b  # Challenger
        self.split_ratio = split_ratio
        self.results = {'a': [], 'b': []}

    def predict(self, user_id, features):
        """
        Route user to model A or B based on hash
        """
        if hash(user_id) % 100 < self.split_ratio * 100:
            group = 'a'
            prediction = self.model_a.predict(features)
        else:
            group = 'b'
            prediction = self.model_b.predict(features)

        # Log for analysis
        self.log_prediction(user_id, group, prediction)

        return prediction

    def evaluate(self):
        """
        Compare performance
        """
        accuracy_a = np.mean(self.results['a'])
        accuracy_b = np.mean(self.results['b'])

        # Statistical significance test
        from scipy.stats import ttest_ind
        t_stat, p_value = ttest_ind(
            self.results['a'],
            self.results['b']
        )

        print(f"Model A accuracy: {accuracy_a:.3f}")
        print(f"Model B accuracy: {accuracy_b:.3f}")
        print(f"Difference: {accuracy_b - accuracy_a:.3f}")
        print(f"p-value: {p_value:.4f}")

        if p_value < 0.05 and accuracy_b > accuracy_a:
            print("Model B is significantly better. Deploy!")
        else:
            print("Keep Model A.")
```

---

## 9. Production Architecture

### 9.1 Deployment Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                        │
│                                                           │
│  MN Lottery API → Scraper → Supabase (historical_snapshots)
│  User Scans → Mobile App → Supabase (user_scans)         │
│  Store Wins → Scraper → Supabase (wins)                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                 FEATURE ENGINEERING                       │
│                                                           │
│  Python Script (daily cron job)                          │
│  - Join tables (games, prize_tiers, snapshots, wins)    │
│  - Calculate features (60+ features)                     │
│  - Store in feature_store table                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                   MODEL TRAINING                          │
│                                                           │
│  Cloud Function (weekly trigger)                         │
│  - Load features from Supabase                           │
│  - Train XGBoost / DL model                              │
│  - Validate on test set                                  │
│  - If accuracy > threshold, deploy to production         │
│  - Store model in Cloud Storage (GCS/S3)                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                 MODEL SERVING                             │
│                                                           │
│  Option A: Cloud Function (serverless)                   │
│  - REST API: /predict?game_id=123                        │
│  - Load model from storage                               │
│  - Return hotness prediction + confidence                │
│                                                           │
│  Option B: Mobile (ONNX Runtime)                         │
│  - Download .onnx model on app start                     │
│  - Run inference locally (offline mode)                  │
│  - Sync predictions daily                                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│                  MOBILE APP                               │
│                                                           │
│  React Native + Expo                                     │
│  - Call Cloud Function API                               │
│  - OR use local ONNX model                               │
│  - Display predictions to user                           │
│  - Log user interactions for feedback loop               │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Cloud Function for Inference

```python
# Google Cloud Function (or Vercel Serverless Function)
from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load model on cold start
model = joblib.load('gs://scratch-oracle-models/xgboost_v1.pkl')
feature_pipeline = joblib.load('gs://scratch-oracle-models/feature_pipeline_v1.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict hotness for a game

    Request body:
    {
      "game_id": "abc123",
      "current_date": "2025-06-15"
    }

    Response:
    {
      "game_id": "abc123",
      "predicted_hotness": 78.3,
      "confidence": 82,
      "recommendation": "buy_now",
      "model_version": "xgboost_v1",
      "features_used": ["ev", "prize_velocity", ...]
    }
    """
    data = request.get_json()
    game_id = data['game_id']

    # Fetch features from Supabase
    features = fetch_features(game_id)

    # Engineer features
    X = feature_pipeline.transform([features])

    # Predict
    hotness = model.predict(X)[0]
    confidence = calculate_confidence(model, X)
    recommendation = generate_recommendation(hotness, confidence)

    return jsonify({
        'game_id': game_id,
        'predicted_hotness': round(hotness, 1),
        'confidence': round(confidence, 0),
        'recommendation': recommendation,
        'model_version': 'xgboost_v1',
        'timestamp': datetime.now().isoformat()
    })

def fetch_features(game_id):
    """
    Load pre-computed features from Supabase
    """
    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    result = supabase.table('feature_store') \
        .select('*') \
        .eq('game_id', game_id) \
        .order('created_at', desc=True) \
        .limit(1) \
        .execute()

    return result.data[0]

if __name__ == '__main__':
    app.run()
```

### 9.3 Mobile Inference (ONNX Runtime)

For offline mode and faster inference:

```python
# Convert PyTorch/XGBoost to ONNX
import onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# For XGBoost
initial_type = [('float_input', FloatTensorType([None, 60]))]
onnx_model = convert_sklearn(xgboost_model, initial_types=initial_type)

with open('lottery_model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())
```

```typescript
// React Native integration with ONNX Runtime
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

class ONNXModelService {
  private session: InferenceSession | null = null;

  async loadModel() {
    // Download model from cloud storage
    const modelPath = await this.downloadModel(
      'https://storage.googleapis.com/scratch-oracle/lottery_model.onnx'
    );

    // Load into ONNX Runtime
    this.session = await InferenceSession.create(modelPath);
  }

  async predict(features: number[]): Promise<number> {
    if (!this.session) throw new Error('Model not loaded');

    // Create input tensor
    const inputTensor = new Tensor(
      'float32',
      new Float32Array(features),
      [1, features.length]
    );

    // Run inference
    const results = await this.session.run({
      float_input: inputTensor
    });

    // Extract hotness prediction
    const hotness = results.output.data[0] as number;

    return Math.round(hotness);
  }
}

// Usage in component
const modelService = new ONNXModelService();
await modelService.loadModel();

const hotness = await modelService.predict([
  /* 60 feature values */
]);

console.log(`Predicted hotness: ${hotness}`);
```

### 9.4 Model Versioning & Rollback

```python
class ModelRegistry:
    """
    Manage multiple model versions
    """

    def __init__(self, storage_bucket='scratch-oracle-models'):
        self.bucket = storage_bucket
        self.versions = {}

    def register_model(self, model, version, metrics):
        """
        Save model with version and metadata
        """
        # Save model file
        model_path = f'{self.bucket}/{version}/model.pkl'
        joblib.dump(model, model_path)

        # Save metadata
        metadata = {
            'version': version,
            'accuracy': metrics['accuracy'],
            'mae': metrics['mae'],
            'trained_at': datetime.now().isoformat(),
            'training_data_size': metrics['data_size']
        }

        metadata_path = f'{self.bucket}/{version}/metadata.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)

        self.versions[version] = metadata

    def get_production_model(self):
        """
        Load currently deployed model
        """
        # Read from config table
        version = self.get_production_version()
        model_path = f'{self.bucket}/{version}/model.pkl'
        return joblib.load(model_path)

    def rollback(self, to_version):
        """
        Rollback to previous version
        """
        # Update config table
        self.set_production_version(to_version)
        print(f"Rolled back to version {to_version}")
```

### 9.5 Monitoring & Alerts

```python
class ModelMonitor:
    """
    Monitor model performance in production
    """

    def log_prediction(self, game_id, prediction, actual=None):
        """
        Log every prediction for monitoring
        """
        log_entry = {
            'timestamp': datetime.now(),
            'game_id': game_id,
            'prediction': prediction,
            'actual': actual,
            'model_version': 'xgboost_v1'
        }

        # Store in monitoring table
        self.db.insert('prediction_logs', log_entry)

    def check_drift(self):
        """
        Detect model drift (degrading accuracy)
        """
        recent_logs = self.db.query("""
            SELECT prediction, actual
            FROM prediction_logs
            WHERE actual IS NOT NULL
            AND timestamp > NOW() - INTERVAL '7 days'
        """)

        predictions = [log['prediction'] for log in recent_logs]
        actuals = [log['actual'] for log in recent_logs]

        current_mae = mean_absolute_error(actuals, predictions)
        baseline_mae = 9.3  # From model_performance table

        if current_mae > baseline_mae * 1.3:
            self.send_alert(
                f"Model drift detected! MAE: {current_mae:.2f} (baseline: {baseline_mae:.2f})"
            )

    def send_alert(self, message):
        """
        Send alert to Slack/email
        """
        # Integration with Slack webhook or email service
        print(f"ALERT: {message}")
```

---

## 10. Code Examples

### 10.1 Complete End-to-End Pipeline

```python
# main_ml_pipeline.py
import pandas as pd
import numpy as np
from supabase import create_client
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, accuracy_score

class LotteryMLPipeline:
    """
    Complete ML pipeline for Scratch Oracle
    """

    def __init__(self, supabase_url, supabase_key):
        self.db = create_client(supabase_url, supabase_key)
        self.model = None
        self.feature_names = []

    def run_full_pipeline(self):
        """
        Execute complete ML workflow
        """
        print("Step 1: Loading data...")
        df = self.load_data()

        print("Step 2: Engineering features...")
        X, y = self.engineer_features(df)

        print("Step 3: Training model...")
        self.model = self.train_model(X, y)

        print("Step 4: Evaluating...")
        metrics = self.evaluate_model(X, y)

        print("Step 5: Saving model...")
        self.save_model(metrics)

        print("Step 6: Generating predictions...")
        self.generate_predictions()

        print("Pipeline complete!")
        return metrics

    def load_data(self):
        """
        Load historical snapshots with joins
        """
        query = """
            SELECT
                hs.*,
                g.game_number,
                g.game_name,
                g.ticket_price,
                g.top_prize_amount,
                g.total_top_prizes,
                g.overall_odds,
                g.game_start_date,
                COUNT(DISTINCT w.id) as recent_wins
            FROM historical_snapshots hs
            JOIN games g ON hs.game_id = g.id
            LEFT JOIN wins w ON w.game_id = g.id
                AND w.win_date BETWEEN hs.snapshot_date - INTERVAL '7 days'
                AND hs.snapshot_date
            WHERE hs.snapshot_date >= '2025-01-01'
            GROUP BY hs.id, g.id
            ORDER BY hs.snapshot_date ASC
        """

        result = self.db.rpc('execute_sql', {'query': query}).execute()
        df = pd.DataFrame(result.data)

        return df

    def engineer_features(self, df):
        """
        Create feature matrix
        """
        features = []
        targets = []

        # Group by game
        for game_id, group in df.groupby('game_id'):
            group = group.sort_values('snapshot_date')

            for i in range(len(group) - 7):  # Need 7 days ahead for target
                row = group.iloc[i]
                future_row = group.iloc[i + 7]

                # Extract features
                feature_vector = self.create_feature_vector(row, group.iloc[:i+1])
                features.append(feature_vector)

                # Target: hotness 7 days ahead
                target = self.calculate_hotness(future_row)
                targets.append(target)

        X = np.array(features)
        y = np.array(targets)

        return X, y

    def create_feature_vector(self, row, history):
        """
        Create single feature vector
        """
        feature_dict = {}

        # Static features
        feature_dict['ticket_price'] = row['ticket_price']
        feature_dict['top_prize_amount'] = row['top_prize_amount']
        feature_dict['overall_odds'] = self.parse_odds(row['overall_odds'])
        feature_dict['days_since_launch'] = (
            row['snapshot_date'] - row['game_start_date']
        ).days

        # Current snapshot features
        feature_dict['current_ev'] = row['expected_value']
        feature_dict['remaining_top_prizes'] = row['remaining_top_prizes']
        feature_dict['depletion_rate'] = row['top_prize_depletion_rate']

        # Time-series features (from history)
        if len(history) >= 7:
            recent = history[-7:]
            feature_dict['ev_7day_avg'] = recent['expected_value'].mean()
            feature_dict['ev_trend'] = self.calculate_trend(recent['expected_value'])
            feature_dict['prize_velocity'] = (
                recent.iloc[0]['remaining_top_prizes'] -
                recent.iloc[-1]['remaining_top_prizes']
            ) / 7
        else:
            feature_dict['ev_7day_avg'] = row['expected_value']
            feature_dict['ev_trend'] = 0
            feature_dict['prize_velocity'] = 0

        # Temporal features
        feature_dict['day_of_week'] = row['snapshot_date'].dayofweek
        feature_dict['is_weekend'] = int(row['snapshot_date'].dayofweek >= 5)

        # Win features
        feature_dict['recent_wins'] = row['recent_wins']

        # Store as ordered list
        vector = [feature_dict[name] for name in sorted(feature_dict.keys())]

        # Save feature names (first iteration only)
        if not self.feature_names:
            self.feature_names = sorted(feature_dict.keys())

        return vector

    def train_model(self, X, y):
        """
        Train XGBoost model with cross-validation
        """
        # Time-series split
        tscv = TimeSeriesSplit(n_splits=5)

        best_model = None
        best_score = float('inf')

        for train_idx, val_idx in tscv.split(X):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]

            model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.5,
                reg_lambda=1.0,
                random_state=42
            )

            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                early_stopping_rounds=20,
                verbose=False
            )

            y_pred = model.predict(X_val)
            mae = mean_absolute_error(y_val, y_pred)

            print(f"Fold MAE: {mae:.2f}")

            if mae < best_score:
                best_score = mae
                best_model = model

        # Retrain on full dataset
        final_model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.5,
            reg_lambda=1.0,
            random_state=42
        )
        final_model.fit(X, y)

        return final_model

    def evaluate_model(self, X, y):
        """
        Evaluate on test set
        """
        # Use last 20% as test set
        split_idx = int(len(X) * 0.8)
        X_test = X[split_idx:]
        y_test = y[split_idx:]

        y_pred = self.model.predict(X_test)

        # Regression metrics
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        # Classification metrics (categorize hotness)
        y_test_class = self.categorize_hotness(y_test)
        y_pred_class = self.categorize_hotness(y_pred)

        accuracy = accuracy_score(y_test_class, y_pred_class)

        metrics = {
            'mae': mae,
            'rmse': rmse,
            'r2': r2,
            'accuracy': accuracy,
            'test_size': len(X_test),
            'train_size': split_idx
        }

        print(f"\nTest Metrics:")
        print(f"  MAE: {mae:.2f}")
        print(f"  RMSE: {rmse:.2f}")
        print(f"  R²: {r2:.3f}")
        print(f"  Accuracy: {accuracy:.3f}")

        return metrics

    def save_model(self, metrics):
        """
        Save model and update database
        """
        import joblib
        from datetime import datetime

        version = f"xgboost_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Save model file
        joblib.dump(self.model, f'models/{version}.pkl')
        joblib.dump(self.feature_names, f'models/{version}_features.pkl')

        # Update model_performance table
        self.db.table('model_performance').insert({
            'model_version': version,
            'evaluation_date': datetime.now().isoformat(),
            'accuracy': metrics['accuracy'],
            'mean_absolute_error': metrics['mae'],
            'test_set_size': metrics['test_size'],
            'training_set_size': metrics['train_size'],
            'notes': 'Automated training pipeline'
        }).execute()

        print(f"Model saved: {version}")

    def generate_predictions(self):
        """
        Generate predictions for all active games
        """
        # Load current game data
        games = self.db.table('games') \
            .select('*, prize_tiers(*)') \
            .eq('is_active', True) \
            .execute()

        predictions = []

        for game in games.data:
            # Engineer features
            features = self.create_feature_vector_from_game(game)

            # Predict
            hotness = self.model.predict([features])[0]
            confidence = self.calculate_confidence(hotness)

            predictions.append({
                'game_id': game['id'],
                'prediction_date': datetime.now().date().isoformat(),
                'ai_score': round(hotness, 2),
                'confidence_level': round(confidence, 2),
                'model_version': 'xgboost_v1',
                'recommendation': self.get_recommendation(hotness, confidence)
            })

        # Bulk insert
        self.db.table('predictions').insert(predictions).execute()

        print(f"Generated {len(predictions)} predictions")

    @staticmethod
    def categorize_hotness(hotness_array):
        """
        Convert hotness scores to classes
        """
        return np.digitize(hotness_array, bins=[40, 70])

    @staticmethod
    def calculate_hotness(row):
        """
        Calculate hotness score from snapshot
        """
        # Implement EV-based hotness calculation
        # (same as existing EVCalculator)
        ev = row['expected_value']
        depletion = row['top_prize_depletion_rate']

        base_score = min(ev * 10, 60)
        momentum = depletion * 5

        return min(base_score + momentum, 100)

    @staticmethod
    def parse_odds(odds_string):
        """
        Parse "1 in 3.5" to 0.286
        """
        if not odds_string:
            return 0
        try:
            parts = odds_string.split('in')
            return 1.0 / float(parts[1].strip())
        except:
            return 0

# Run pipeline
if __name__ == '__main__':
    pipeline = LotteryMLPipeline(
        supabase_url='YOUR_SUPABASE_URL',
        supabase_key='YOUR_SUPABASE_KEY'
    )

    metrics = pipeline.run_full_pipeline()
```

### 10.2 Feature Store Implementation

```python
# feature_store.py
class FeatureStore:
    """
    Pre-compute and cache features for fast inference
    """

    def __init__(self, db):
        self.db = db

    def compute_all_features(self):
        """
        Compute features for all active games (run daily)
        """
        games = self.db.table('games') \
            .select('*') \
            .eq('is_active', True) \
            .execute()

        for game in games.data:
            features = self.compute_game_features(game['id'])

            # Store in feature_store table
            self.db.table('feature_store').upsert({
                'game_id': game['id'],
                'features': features,
                'computed_at': datetime.now().isoformat()
            }).execute()

    def compute_game_features(self, game_id):
        """
        Compute all features for a single game
        """
        # Load game data
        game = self.db.table('games').select('*').eq('id', game_id).single().execute()

        # Load historical snapshots (last 30 days)
        history = self.db.table('historical_snapshots') \
            .select('*') \
            .eq('game_id', game_id) \
            .order('snapshot_date', desc=True) \
            .limit(30) \
            .execute()

        # Load prize tiers
        prizes = self.db.table('prize_tiers') \
            .select('*') \
            .eq('game_id', game_id) \
            .execute()

        # Load recent wins
        wins = self.db.table('wins') \
            .select('*') \
            .eq('game_id', game_id) \
            .gte('win_date', (datetime.now() - timedelta(days=30)).isoformat()) \
            .execute()

        # Compute features
        features = {
            # Static
            'ticket_price': game.data['ticket_price'],
            'overall_odds': self.parse_odds(game.data['overall_odds']),

            # Dynamic
            'current_ev': history.data[0]['expected_value'] if history.data else 0,
            'remaining_prizes': history.data[0]['remaining_top_prizes'] if history.data else 0,

            # Aggregated
            'win_count_30d': len(wins.data),
            'high_value_prizes': sum(1 for p in prizes.data if p['prize_amount'] >= 1000),

            # Time-series
            'ev_trend': self.calculate_ev_trend(history.data),
            'prize_velocity': self.calculate_prize_velocity(history.data)
        }

        return features
```

---

## 11. Data Collection Requirements

### 11.1 Minimum Data for Each Phase

**Phase 1 (Rule-Based): Immediate**
- Current game data (41 games)
- Prize structures
- No historical data required

**Phase 2 (XGBoost): 12-24 weeks**
- 1,500-3,000 snapshots minimum
- Weekly snapshots × 41 games × 12 weeks = 492 snapshots (bare minimum)
- Recommended: 24 weeks for robust training

**Phase 3 (Deep Learning): 6-12 months**
- 10,000+ snapshots
- Daily snapshots × 41 games × 180 days = 7,380 snapshots
- Recommended: 12 months for best results

### 11.2 Data Quality Checklist

- [ ] **Completeness**: No missing snapshot_dates
- [ ] **Accuracy**: Validate against MN Lottery website
- [ ] **Consistency**: Same schema across all snapshots
- [ ] **Timeliness**: Updates within 24 hours of MN Lottery publish
- [ ] **Coverage**: All 41 active games tracked
- [ ] **Validation**: Cross-check totals (prizes should decrease, not increase)

### 11.3 Augmentation with External Data

Consider adding:
1. **News articles**: Scrape lottery news (big wins, game launches)
2. **Social media**: Twitter mentions of specific games
3. **Weather data**: Correlation with ticket sales
4. **Economic data**: Payday patterns, unemployment rates
5. **Multi-state data**: Transfer learning from other lotteries

---

## 12. Risk Mitigation

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient training data | High | High | Use rule-based + ensemble approach |
| Model overfitting | Medium | High | Regularization, cross-validation, early stopping |
| Data quality issues | Medium | Medium | Automated validation, manual spot checks |
| Model drift | Medium | High | Continuous monitoring, automated retraining |
| Inference latency | Low | Medium | Model compression, caching, ONNX |
| Cloud costs | Medium | Low | Free tier limits, optimize training schedule |

### 12.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low accuracy harms reputation | Medium | High | Set expectations (70-80% accuracy), disclaimers |
| Regulatory issues | Low | Very High | "Informational only" disclaimers, age verification |
| Users misinterpret predictions | Medium | Medium | Clear UI/UX, education, responsible gambling |
| Competitors copy approach | High | Low | Fast iteration, community moat |

### 12.3 Fallback Strategy

If ML performance is poor:
1. **Fallback to rule-based**: Always have heuristics as backup
2. **Hybrid weighting**: Dynamically adjust ensemble weights based on accuracy
3. **User feedback loop**: Let users vote on predictions (wisdom of crowd)
4. **Manual curation**: Human-in-the-loop for top recommendations

---

## Conclusion & Recommendations

### Recommended Implementation Path

**Months 0-3: Rule-Based (Deployed)**
- ✅ Already implemented in `aiPredictionEngine.ts`
- Focus on data collection and user feedback
- Baseline accuracy: 65-70%

**Months 3-6: XGBoost Integration**
- Train XGBoost on 12-24 weeks of historical data
- A/B test vs rule-based
- Target accuracy: 75-80%
- Ensemble: 40% rules + 60% XGBoost

**Months 6-12: Deep Learning**
- Implement Temporal Fusion Transformer
- Transfer learning from other states
- Target accuracy: 82-88%
- Ensemble: 20% rules + 40% XGBoost + 40% DL

**Year 2+: Production ML System**
- Automated retraining pipeline
- Multi-state expansion
- Advanced features (NLP, social media)
- Target accuracy: 88-92%

### Technology Stack Summary

- **Phase 1**: TypeScript (current)
- **Phase 2**: Python + XGBoost + scikit-learn
- **Phase 3**: PyTorch + Temporal Fusion Transformer
- **Deployment**: ONNX Runtime (mobile) + Cloud Functions (API)
- **Infrastructure**: Supabase (data) + Google Cloud Storage (models)

### Key Success Factors

1. **Data Quality**: Garbage in, garbage out. Invest in robust scraping.
2. **User Feedback**: Track actual outcomes to close the loop.
3. **Explainability**: Show users WHY a prediction was made.
4. **Continuous Improvement**: Weekly retraining in Phase 2+.
5. **Conservative Claims**: Underpromise, overdeliver on accuracy.

### Next Steps

1. **Immediate**: Continue collecting historical_snapshots data
2. **Week 12**: Evaluate XGBoost feasibility (data volume check)
3. **Week 24**: Implement XGBoost pipeline if data sufficient
4. **Month 6**: Begin DL research and prototyping
5. **Month 12**: Deploy full ensemble system

---

**Document Prepared By**: Claude Code (Anthropic)
**For**: Scratch Oracle MVP
**Status**: Ready for Implementation
**Last Updated**: January 2025

---

*This architecture is designed to evolve with your data. Start simple, validate with users, then scale complexity as justified by data volume and performance gains.*
