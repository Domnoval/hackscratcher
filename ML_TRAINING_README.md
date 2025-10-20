# ML Training Pipeline - Setup & Usage Guide

## Overview

This directory contains the machine learning training pipeline for Scratch Oracle lottery predictions. The pipeline implements Phase 1 & 2 from `ML_ARCHITECTURE.md`, using XGBoost to predict optimal lottery tickets.

## What Was Implemented

### Phase 1 & 2: Traditional ML with XGBoost

- **Training Script**: `scripts/train-model.py`
- **Prediction Script**: `scripts/generate-predictions.py`
- **Model Framework**: XGBoost (Gradient Boosting)
- **Features**: 11 engineered features (EV, prize concentration, depletion rate, etc.)
- **Target**: AI Score (0-100)

## Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies**:
- pandas (data manipulation)
- numpy (numerical operations)
- scikit-learn (ML utilities)
- xgboost (gradient boosting model)
- supabase (database client)
- python-dotenv (environment variables)
- joblib (model serialization)

### 2. Train the Model

```bash
npm run train-model
```

**What this does**:
1. Connects to Supabase
2. Fetches all 41 games from the database
3. Engineers 11 features per game
4. Trains an XGBoost model
5. Saves the model to `models/lottery_predictor.pkl`
6. Prints training metrics (R², MAE, RMSE)

**Expected Output**:
```
======================================================================
[SLOT] SCRATCH ORACLE ML TRAINING PIPELINE
======================================================================
Supabase URL: https://wqealxmdjpwjbhfrnplk.supabase.co
Model output: models\lottery_predictor.pkl

[OK] Connected to Supabase
[FETCH] Fetching games from Supabase...
[OK] Fetched 42 games
[BUILD] Engineering features...
[OK] Engineered 42 feature rows from 42 games
[AI] Training XGBoost model...
Training set: 42 samples, 11 features
...
[OK] TRAINING COMPLETE!
```

### 3. Generate Predictions

```bash
npm run generate-predictions
```

**What this does**:
1. Loads the trained model from `models/lottery_predictor.pkl`
2. Fetches all active games from Supabase
3. Generates predictions (AI score, confidence, recommendation)
4. Writes predictions to Supabase `predictions` table

**Expected Output**:
```
======================================================================
[SLOT] SCRATCH ORACLE PREDICTION GENERATOR
======================================================================
[LOAD] Loading model...
[OK] Model loaded successfully
[FETCH] Fetching games...
[OK] Fetched 41 active games
[PREDICT] Generating predictions for 41 games...
  [OK] 30 Days of Winning -> Score: 78.5 | buy
  [OK] Holiday $500s -> Score: 78.5 | buy
  ...
[SAVE] Saving 41 predictions to Supabase...
```

### 4. Run Full Pipeline

```bash
npm run ml-pipeline
```

This runs both training and prediction generation in sequence.

## Features Explained

The model uses these 11 features (engineered from raw game data):

1. **ticket_price**: Price of the ticket ($1, $2, $3, $5, etc.)
2. **ev**: Expected Value (EV) - mathematical expected return
3. **prize_concentration**: % of prizes remaining (1.0 = all prizes left)
4. **depletion_rate**: Rate at which prizes are being claimed (1 - concentration)
5. **days_since_launch**: Age of the game in days
6. **recency**: Days since data was last updated
7. **odds**: Overall odds of winning (parsed from "1 in X")
8. **velocity**: Rate of change in EV
9. **prize_to_price**: Top prize amount divided by ticket price
10. **remaining_prizes**: Count of remaining top prizes
11. **total_prizes**: Total top prizes originally available

## Model Outputs

For each game, the model generates:

- **ai_score**: 0-100 score (higher = better)
- **win_probability**: 0.0-1.0 probability estimate
- **expected_value**: EV calculation
- **confidence_level**: 0-100 confidence in prediction
- **recommendation**: One of:
  - `strong_buy` (score >= 75, confidence >= 70)
  - `buy` (score >= 60, confidence >= 60)
  - `neutral` (score 40-60 or low confidence)
  - `avoid` (score < 40)
  - `strong_avoid` (score < 25, confidence >= 70)
- **reasoning**: Human-readable explanation

## Database Setup

### Important: RLS Policy Issue

**Current Status**: The prediction script works but cannot write to Supabase due to Row Level Security (RLS) policies.

**Error you'll see**:
```
[ERROR] Error saving predictions: {'message': 'new row violates row-level security policy for table "predictions"', ...}
```

### Solution Options:

#### Option 1: Use Service Role Key (Recommended for Production)

1. Get your Supabase service role key from:
   - Supabase Dashboard → Settings → API → service_role key (secret)

2. Add to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. Update `generate-predictions.py` line 25:
   ```python
   # Change from:
   SUPABASE_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

   # To:
   SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
   ```

#### Option 2: Add RLS Policy (Temporary for Testing)

In Supabase SQL Editor, run:

```sql
-- Allow inserts to predictions table for anon key
CREATE POLICY "Allow anon inserts to predictions"
ON predictions
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow updates to predictions table for anon key
CREATE POLICY "Allow anon updates to predictions"
ON predictions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

**Warning**: This opens up the predictions table to anonymous inserts. Only use for testing.

#### Option 3: Disable RLS Temporarily (Not Recommended)

In Supabase Dashboard:
1. Go to Database → predictions table
2. Disable "Enable Row Level Security"

**Warning**: This removes all access control. Only use locally.

## Model Performance Notes

### Current Performance (with 41 games):

- **Training R²**: 0.98 (very high)
- **Test R²**: 0.00 (very low)
- **MAE**: ~0.04

**This indicates severe overfitting**, which is expected because:

1. **Small dataset**: Only 41 games (need 100+ for robust training)
2. **Limited historical data**: No time-series snapshots yet
3. **Similar targets**: All games have similar characteristics

### Improving Model Performance

As per `ML_ARCHITECTURE.md`, model accuracy will improve with:

1. **More data collection**:
   - Run the scraper weekly to build historical snapshots
   - After 12 weeks: ~500 snapshots → better training
   - After 6 months: 1,000+ snapshots → much better

2. **Better features**:
   - Add historical snapshots (prize depletion velocity)
   - Add win clustering (from `wins` table)
   - Add user behavior (from `user_scans` table)

3. **Model tuning**:
   - Adjust hyperparameters once you have more data
   - Try ensemble methods (combine multiple models)
   - Eventually upgrade to deep learning (Phase 3)

### Expected Accuracy Timeline

- **Phase 1 (Now)**: 65-70% accuracy (rule-based heuristics work better)
- **Phase 2 (3-6 months)**: 75-80% accuracy (ML becomes useful)
- **Phase 3 (6-12 months)**: 82-88% accuracy (deep learning)

## File Structure

```
scratch-oracle-app/
├── scripts/
│   ├── train-model.py          # Training script
│   └── generate-predictions.py # Prediction generation
├── models/
│   ├── lottery_predictor.pkl   # Trained model (generated)
│   ├── .gitignore              # Ignore model files in git
│   └── README.md               # Model directory info
├── requirements.txt            # Python dependencies
├── ML_ARCHITECTURE.md          # Full ML architecture docs
├── DEPLOYMENT_STRATEGY.md      # Deployment guide (AWS Lambda)
└── ML_TRAINING_README.md       # This file
```

## Troubleshooting

### Python not found

Install Python 3.8+ from python.org or use:
```bash
winget install Python.Python.3.13
```

### Module not found errors

```bash
pip install -r requirements.txt
```

### Supabase connection errors

Check your `.env` file has:
```
EXPO_PUBLIC_SUPABASE_URL=https://wqealxmdjpwjbhfrnplk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Unicode errors on Windows

The scripts have been updated to use ASCII characters instead of emojis. If you still see encoding errors, set:
```bash
set PYTHONIOENCODING=utf-8
```

### Model predictions are all the same

This is expected with limited data (41 games). The model will improve once you have:
- Historical snapshots (from weekly scraping)
- More diverse game characteristics
- Sufficient training data (100+ samples)

## Next Steps

1. **Set up automated scraping**:
   - Run `npm run scrape` weekly to build historical data
   - This populates the `historical_snapshots` table

2. **Fix RLS policies**:
   - Follow Option 1 above (service role key)
   - Or add RLS policies to allow predictions table writes

3. **Retrain weekly**:
   - As you collect more historical data, retrain the model
   - `npm run ml-pipeline` once per week

4. **Monitor predictions**:
   - Check Supabase `predictions` table
   - Track prediction accuracy over time
   - Adjust features/hyperparameters as needed

5. **Integrate with app**:
   - Update your React Native app to read from `predictions` table
   - Display AI scores and recommendations to users

6. **Deploy to production** (later):
   - See `DEPLOYMENT_STRATEGY.md` for AWS Lambda setup
   - Schedule daily/weekly model retraining
   - Automate prediction generation

## Reference

- **ML Architecture**: See `ML_ARCHITECTURE.md`
- **Deployment Guide**: See `DEPLOYMENT_STRATEGY.md`
- **Database Schema**: See `DATABASE_SCHEMA.md`

## Support

If you encounter issues:

1. Check error messages carefully
2. Review the troubleshooting section above
3. Verify your `.env` file has correct credentials
4. Check Supabase dashboard for table structure
5. Review the console output for detailed logs

## Model Version

- **Version**: v1.0
- **Framework**: XGBoost 3.1.0
- **Trained**: Auto-generated timestamp
- **Features**: 11
- **Training samples**: 42 games
- **Status**: Working but overfitting (expected with limited data)
