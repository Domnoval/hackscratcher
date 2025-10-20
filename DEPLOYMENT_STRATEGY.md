# ML Model Deployment Strategy for Scratch Oracle

**Last Updated**: January 2025
**Status**: Research Complete - Ready for Implementation Decision
**Purpose**: Deploy daily ML prediction model for lottery ticket recommendations

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Requirements & Constraints](#requirements--constraints)
3. [Deployment Options Analysis](#deployment-options-analysis)
4. [Recommended Approach](#recommended-approach)
5. [Implementation Guide](#implementation-guide)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Cost Analysis](#cost-analysis)
8. [Future Scaling Considerations](#future-scaling-considerations)

---

## Executive Summary

### The Challenge

Deploy a machine learning model that:
- Runs daily via cron job to generate fresh predictions
- Analyzes Minnesota lottery scratch-off games
- Writes predictions to Supabase `predictions` table
- Must work within existing stack (React Native + Supabase + Vercel)

### Recommended Solution: **Hybrid Approach (Train Locally + AWS Lambda Inference)**

**Why this wins:**
- **Free tier sufficient**: AWS Lambda's 1M requests/month covers daily jobs for years
- **Model flexibility**: Train locally with full Python ecosystem (TensorFlow/PyTorch)
- **Lightweight inference**: Convert to ONNX or scikit-learn for fast serverless execution
- **Easy updates**: Upload new model weights to S3, no code redeployment needed
- **Best fit**: Aligns with existing Vercel + Supabase architecture

**Cost**: $0-3/month (within free tier initially)
**Complexity**: Medium (one-time setup, then simple)
**Maintenance**: Low (update model weights, not infrastructure)

---

## Requirements & Constraints

### Functional Requirements

1. **Daily Execution**: Must run automatically at scheduled time (e.g., 3 AM CST)
2. **Data Access**: Read from Supabase `games`, `historical_snapshots`, `prize_tiers` tables
3. **Output**: Write predictions to Supabase `predictions` table with:
   - `ai_score` (0-100)
   - `win_probability` (0.0-1.0)
   - `expected_value`
   - `confidence_level`
   - `recommendation` ('strong_buy', 'buy', 'neutral', 'avoid', 'strong_avoid')
   - `reasoning` (text explanation)
4. **ML Capabilities**: Must support TensorFlow, PyTorch, or equivalent frameworks
5. **Model Updates**: Easy to update model without full redeployment

### Non-Functional Requirements

1. **Cost**: Prefer free tier, max $10/month initially
2. **Latency**: Job can take 5-60 seconds (not user-facing)
3. **Reliability**: 99%+ uptime for daily jobs
4. **Maintainability**: Simple architecture, minimal DevOps
5. **Scalability**: Support multi-state expansion (10+ states by 2026)

### Constraints

1. **Existing Stack**: React Native (Expo), Supabase (PostgreSQL), Vercel
2. **Team Size**: Solo developer initially
3. **Data Volume**: ~20-50 games per state, ~30-day historical windows
4. **Model Size**: Lightweight models preferred (<100MB)

---

## Deployment Options Analysis

### Option 1: Vercel Serverless Functions (Python)

**Overview**: Deploy Python function to Vercel, schedule with Vercel Cron Jobs

#### Pros
- ✅ **Already using Vercel**: No new platform to learn
- ✅ **Python support**: Native Python runtime available
- ✅ **Cron jobs**: Built-in scheduling via `vercel.json`
- ✅ **Same repo**: Keep ML code with app code
- ✅ **Easy deployment**: `vercel deploy` command

#### Cons
- ❌ **Package size limits**: 50MB compressed, 250MB uncompressed (TensorFlow ~500MB)
- ❌ **Memory limits**: 1GB default, 3GB max (insufficient for large models)
- ❌ **Cold start penalty**: 20+ seconds for TensorFlow imports
- ❌ **Limited ML support**: TensorFlow/PyTorch possible but not optimized
- ❌ **Execution time**: 10s (Hobby), 60s (Pro) - tight for ML inference
- ❌ **Free tier cron**: Only 2 cron jobs, once per day (Hobby plan)

#### Verdict
**NOT RECOMMENDED** - Package size and memory constraints make this unsuitable for standard TensorFlow/PyTorch models. Only viable with ultra-lightweight models (scikit-learn with <10MB size).

---

### Option 2: Supabase Edge Functions (Deno)

**Overview**: Deploy ML inference to Supabase Edge Functions (Deno runtime)

#### Pros
- ✅ **Already using Supabase**: Direct database access, no CORS issues
- ✅ **Built-in AI API**: Native support for embeddings and text generation
- ✅ **Global edge network**: Low latency (50+ locations)
- ✅ **Deno runtime**: Modern, secure, supports WASM
- ✅ **Free tier**: 500K invocations/month, 400K GB-seconds
- ✅ **Direct DB access**: No need for API layer

#### Cons
- ❌ **Deno ecosystem**: Limited ML libraries (no native TensorFlow/PyTorch)
- ❌ **ONNX only**: Must use `onnxruntime` (Deno-compatible)
- ❌ **Model size limits**: Edge Functions have size constraints
- ❌ **No native cron**: Need external scheduler (GitHub Actions, cron-job.org)
- ❌ **WASM complexity**: Converting models to WASM adds complexity
- ❌ **Limited CPU**: Edge functions prioritize speed over heavy computation

#### Verdict
**POSSIBLE BUT LIMITED** - Good for lightweight ONNX models, but requires model conversion and external scheduling. Best as a secondary inference endpoint for user-facing real-time predictions, not batch jobs.

---

### Option 3: AWS Lambda (Python + Container Images)

**Overview**: Deploy containerized Python ML model to AWS Lambda, schedule with EventBridge

#### Pros
- ✅ **Full TensorFlow/PyTorch**: Native support via Lambda Layers or containers
- ✅ **Generous free tier**: 1M requests/month, 400K GB-seconds (PERMANENT)
- ✅ **Large packages**: Up to 10GB container image size
- ✅ **Flexible memory**: 128MB to 10GB (scale as needed)
- ✅ **Native scheduling**: EventBridge Scheduler (free tier: 14M invocations/month)
- ✅ **EFS support**: Store large models on Elastic File System (5GB free first year)
- ✅ **Battle-tested**: Industry standard for ML inference
- ✅ **S3 integration**: Store model weights, load at runtime

#### Cons
- ❌ **New platform**: Learning curve for AWS console/CLI
- ❌ **Cold starts**: 5-20 seconds for large models (mitigated with provisioned concurrency)
- ❌ **Complexity**: IAM roles, VPC setup (optional), multiple services
- ❌ **Monitoring costs**: CloudWatch logs (5GB free, then $0.50/GB)

#### Verdict
**HIGHLY RECOMMENDED** - Best balance of flexibility, cost, and ML support. Free tier covers needs for 1-2 years. Industry standard for serverless ML.

---

### Option 4: Google Cloud Functions / Cloud Run

**Overview**: Deploy Python ML model to Google Cloud Functions (Cloud Run-based), schedule with Cloud Scheduler

#### Pros
- ✅ **Full Python support**: TensorFlow, PyTorch, scikit-learn
- ✅ **Generous free tier**: 2M requests/month, 400K GB-seconds, 180K vCPU-seconds
- ✅ **Cloud Scheduler**: 3 free jobs/month
- ✅ **Up to 8GB memory**: Cloud Functions Gen 2 (Cloud Run)
- ✅ **Container support**: Deploy custom Docker images
- ✅ **Easy Python**: Better Python ecosystem than AWS (subjective)

#### Cons
- ❌ **Cold starts**: 20+ seconds for TensorFlow imports
- ❌ **Free tier expires**: Some free tier benefits only first year
- ❌ **Scheduler limit**: Only 3 free cron jobs (vs AWS EventBridge 14M)
- ❌ **Less established**: Fewer ML deployment resources than AWS

#### Verdict
**STRONG ALTERNATIVE** - Very similar to AWS Lambda, slightly better Python experience but fewer free scheduler invocations. Good fallback if AWS doesn't work out.

---

### Option 5: Railway (Python Service + Cron)

**Overview**: Deploy Python service to Railway, use native cron support

#### Pros
- ✅ **Native cron support**: Built-in scheduled tasks
- ✅ **Full Python environment**: No serverless constraints
- ✅ **Simple deployment**: Git push to deploy
- ✅ **PostgreSQL addon**: Can host Supabase alternative
- ✅ **$5 trial credit**: Test before committing
- ✅ **Always-on option**: No cold starts

#### Cons
- ❌ **No free tier**: Usage-based after $5 trial ($5/month minimum on Hobby)
- ❌ **Always-on cost**: Charged per minute, even if idle
- ❌ **Overkill for daily jobs**: Paying for 24/7 server for 1 daily task
- ❌ **Cost scales quickly**: ~$20-50/month for ML workloads

#### Verdict
**NOT RECOMMENDED** - Too expensive for infrequent (daily) batch jobs. Better suited for always-on APIs or web services.

---

### Option 6: Local Execution + GitHub Actions

**Overview**: Run ML training locally, use GitHub Actions to trigger daily inference

#### Pros
- ✅ **Completely free**: GitHub Actions free tier (2,000 minutes/month)
- ✅ **Full control**: Any ML framework, no size limits
- ✅ **Native scheduling**: Cron syntax in workflow YAML
- ✅ **Version control**: Model code in same repo
- ✅ **Easy debugging**: Run workflows locally with `act`

#### Cons
- ❌ **6-hour timeout**: GitHub Actions workflows limited to 6 hours
- ❌ **No persistent storage**: Must download/upload model weights each run
- ❌ **Limited compute**: 2-core CPU, 7GB RAM (slower than Lambda)
- ❌ **Public repos only**: Free tier requires public repository (security risk)
- ❌ **Not production-grade**: GitHub Actions designed for CI/CD, not production workloads

#### Verdict
**GOOD FOR PROTOTYPING** - Use for initial testing and development, then migrate to AWS Lambda or GCP for production. Not recommended for production due to reliability and security concerns.

---

## Recommended Approach

### Winner: **Hybrid - Train Locally + AWS Lambda Inference**

This approach separates model training from inference deployment, following industry best practices.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Train model (TensorFlow/PyTorch/scikit-learn)    │   │
│  │  2. Evaluate performance                              │   │
│  │  3. Convert to ONNX (optional, for optimization)     │   │
│  │  4. Export model weights → model.pkl / model.onnx    │   │
│  └───────────────────────┬──────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼ Upload (AWS CLI / S3 Console)
                    ┌────────────────────┐
                    │   AWS S3 Bucket    │
                    │  scratch-oracle-   │
                    │  ml-models/        │
                    │  - model_v1.pkl    │
                    │  - model_v2.onnx   │
                    └─────────┬──────────┘
                              │
                              ▼ Load at runtime
              ┌───────────────────────────────────┐
              │     AWS Lambda Function          │
              │  ┌────────────────────────────┐  │
              │  │ 1. Load model from S3      │  │
              │  │ 2. Fetch data from Supabase│  │
              │  │ 3. Run inference           │  │
              │  │ 4. Write to Supabase       │  │
              │  └────────────────────────────┘  │
              └─────────────┬─────────────────────┘
                            │
                  Triggered by ▼
            ┌──────────────────────────────┐
            │  AWS EventBridge Scheduler   │
            │  Rule: cron(0 8 * * ? *)     │
            │  (Daily at 3 AM CST)         │
            └──────────────────────────────┘
                            │
                    Writes to ▼
                ┌───────────────────────┐
                │  Supabase Database    │
                │  predictions table    │
                │  - game_id            │
                │  - ai_score           │
                │  - recommendation     │
                │  - prediction_date    │
                └───────────────────────┘
```

### Why This Architecture Wins

1. **Best of Both Worlds**
   - **Train locally**: Full Python ecosystem, no time/memory limits, use Jupyter notebooks
   - **Deploy lightweight**: Only inference code + model weights go to Lambda

2. **Cost-Effective**
   - AWS Lambda: 1M free requests/month (daily job = 30 requests/month)
   - S3: 5GB free storage, 20K GET requests/month
   - EventBridge: 14M free invocations/month
   - **Total cost: $0/month for 1-2 years**

3. **Easy Model Updates**
   - Upload new model weights to S3 (no code changes)
   - Lambda automatically loads latest model
   - No redeployment needed

4. **Flexible**
   - Use any ML framework locally (TensorFlow, PyTorch, scikit-learn)
   - Convert to lightweight format (ONNX, pickle) for Lambda
   - Can upgrade to Lambda Container Images (10GB) if needed

5. **Production-Ready**
   - AWS Lambda = industry standard for ML inference
   - Mature ecosystem, extensive documentation
   - Built-in logging (CloudWatch), monitoring (X-Ray)

### Alternative: **If AWS is Too Complex → Google Cloud Functions**

Same architecture, replace AWS Lambda with Cloud Functions + Cloud Scheduler. Nearly identical developer experience, slightly easier setup for Python developers.

---

## Implementation Guide

### Phase 1: Model Development (Local)

#### Step 1.1: Set Up Python Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install ML dependencies
pip install tensorflow  # or pytorch, scikit-learn
pip install numpy pandas
pip install supabase  # Python client
pip install python-dotenv
pip install onnx onnxruntime  # Optional: for model optimization

# Save dependencies
pip freeze > requirements-training.txt
```

#### Step 1.2: Create Training Script

**File**: `ml-training/train_model.py`

```python
"""
Scratch Oracle ML Model Training Script
Trains a model to predict optimal lottery tickets based on historical data.
"""

import os
import pickle
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# =====================================================
# Configuration
# =====================================================

SUPABASE_URL = os.getenv('EXPO_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
MODEL_OUTPUT_PATH = 'models/lottery_model_v1.pkl'

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# =====================================================
# Data Fetching
# =====================================================

def fetch_training_data():
    """Fetch games and historical snapshots from Supabase."""
    print("📡 Fetching training data from Supabase...")

    # Fetch active games
    games_response = supabase.table('games').select('*').eq('is_active', True).execute()
    games = pd.DataFrame(games_response.data)

    # Fetch historical snapshots (last 30 days)
    thirty_days_ago = (datetime.now() - timedelta(days=30)).date().isoformat()
    snapshots_response = supabase.table('historical_snapshots') \
        .select('*') \
        .gte('snapshot_date', thirty_days_ago) \
        .execute()
    snapshots = pd.DataFrame(snapshots_response.data)

    print(f"✅ Fetched {len(games)} games, {len(snapshots)} snapshots")
    return games, snapshots

# =====================================================
# Feature Engineering
# =====================================================

def engineer_features(games, snapshots):
    """Create ML features from raw data."""
    print("🔧 Engineering features...")

    features = []

    for _, game in games.iterrows():
        game_id = game['id']
        game_snapshots = snapshots[snapshots['game_id'] == game_id].sort_values('snapshot_date')

        if len(game_snapshots) < 7:
            continue  # Need at least 7 days of data

        # Calculate features
        recent_7d = game_snapshots.tail(7)
        recent_30d = game_snapshots.tail(30)

        # Prize depletion rate (prizes claimed per day)
        if len(recent_7d) >= 2:
            prizes_start = recent_7d.iloc[0]['remaining_top_prizes']
            prizes_end = recent_7d.iloc[-1]['remaining_top_prizes']
            depletion_rate_7d = (prizes_start - prizes_end) / 7
        else:
            depletion_rate_7d = 0

        # Expected Value (EV)
        remaining_prizes = game['remaining_top_prizes']
        total_prizes = game['total_top_prizes']
        ticket_price = game['ticket_price']
        top_prize = game['top_prize_amount']

        if total_prizes > 0 and ticket_price > 0:
            prize_concentration = remaining_prizes / total_prizes
            ev = (remaining_prizes * top_prize) / (total_prizes * ticket_price)
        else:
            prize_concentration = 0
            ev = 0

        # Recency (days since last scrape)
        if pd.notna(game['last_scraped_at']):
            last_scraped = pd.to_datetime(game['last_scraped_at'])
            recency = (datetime.now() - last_scraped).days
        else:
            recency = 999

        # Velocity (rate of EV change)
        if len(recent_7d) >= 2:
            ev_values = recent_7d['expected_value'].dropna()
            if len(ev_values) >= 2:
                velocity = ev_values.iloc[-1] - ev_values.iloc[0]
            else:
                velocity = 0
        else:
            velocity = 0

        features.append({
            'game_id': game_id,
            'game_number': game['game_number'],
            'game_name': game['game_name'],
            'ticket_price': ticket_price,
            'prize_concentration': prize_concentration,
            'ev': ev,
            'recency': recency,
            'depletion_rate_7d': depletion_rate_7d,
            'velocity': velocity,
            'remaining_prizes': remaining_prizes,
            'total_prizes': total_prizes,
            # Target: ai_score (0-100)
            # We'll calculate this as a composite score for training
            'target_score': calculate_target_score(ev, prize_concentration, depletion_rate_7d, recency)
        })

    df = pd.DataFrame(features)
    print(f"✅ Engineered {len(df)} feature rows")
    return df

def calculate_target_score(ev, prize_concentration, depletion_rate, recency):
    """Calculate target ai_score for supervised learning."""
    # Normalize components to 0-100 scale
    ev_score = min(ev * 10, 100)  # EV > 10 = max score
    concentration_score = prize_concentration * 100
    activity_score = min(depletion_rate * 20, 100)  # Active games score higher
    recency_score = max(100 - recency * 5, 0)  # Newer data = higher score

    # Weighted average
    score = (
        ev_score * 0.4 +
        concentration_score * 0.3 +
        activity_score * 0.2 +
        recency_score * 0.1
    )

    return min(score, 100)

# =====================================================
# Model Training
# =====================================================

def train_model(df):
    """Train RandomForest model."""
    print("🤖 Training model...")

    # Features for training
    feature_cols = [
        'ticket_price', 'prize_concentration', 'ev', 'recency',
        'depletion_rate_7d', 'velocity', 'remaining_prizes', 'total_prizes'
    ]

    X = df[feature_cols]
    y = df['target_score']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"✅ Model trained!")
    print(f"   MAE: {mae:.2f}")
    print(f"   R²: {r2:.2f}")

    return model, feature_cols

# =====================================================
# Model Export
# =====================================================

def save_model(model, feature_cols):
    """Save model to disk."""
    print(f"💾 Saving model to {MODEL_OUTPUT_PATH}...")

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)

    with open(MODEL_OUTPUT_PATH, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_cols': feature_cols,
            'version': 'v1',
            'trained_at': datetime.now().isoformat()
        }, f)

    print("✅ Model saved!")

# =====================================================
# Main Execution
# =====================================================

def main():
    print("=" * 70)
    print("🎰 SCRATCH ORACLE ML TRAINING")
    print("=" * 70)

    # Fetch data
    games, snapshots = fetch_training_data()

    # Engineer features
    df = engineer_features(games, snapshots)

    if len(df) < 10:
        print("❌ Insufficient data for training (need at least 10 games)")
        return

    # Train model
    model, feature_cols = train_model(df)

    # Save model
    save_model(model, feature_cols)

    print("\n" + "=" * 70)
    print("✅ TRAINING COMPLETE!")
    print("=" * 70)
    print(f"Model saved to: {MODEL_OUTPUT_PATH}")
    print(f"Next step: Upload to AWS S3 or include in Lambda deployment")

if __name__ == '__main__':
    main()
```

#### Step 1.3: Train the Model

```bash
cd ml-training
python train_model.py
```

**Expected output**:
```
📡 Fetching training data from Supabase...
✅ Fetched 20 games, 450 snapshots
🔧 Engineering features...
✅ Engineered 20 feature rows
🤖 Training model...
✅ Model trained!
   MAE: 5.23
   R²: 0.87
💾 Saving model to models/lottery_model_v1.pkl...
✅ Model saved!
```

---

### Phase 2: AWS Lambda Setup

#### Step 2.1: Install AWS CLI

```bash
# Windows (via installer)
# Download from: https://aws.amazon.com/cli/

# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

#### Step 2.2: Create AWS Account & Configure

1. **Create AWS Account**: https://aws.amazon.com/free/
2. **Create IAM User** with permissions:
   - `AWSLambda_FullAccess`
   - `AmazonS3FullAccess`
   - `AmazonEventBridgeFullAccess`
   - `CloudWatchLogsFullAccess`

3. **Configure AWS CLI**:
```bash
aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: us-east-1
# Default output format: json
```

#### Step 2.3: Create S3 Bucket for Models

```bash
# Create bucket
aws s3 mb s3://scratch-oracle-ml-models --region us-east-1

# Upload trained model
aws s3 cp ml-training/models/lottery_model_v1.pkl s3://scratch-oracle-ml-models/

# Verify upload
aws s3 ls s3://scratch-oracle-ml-models/
```

#### Step 2.4: Create Lambda Function Code

**File**: `lambda-inference/lambda_function.py`

```python
"""
AWS Lambda function for Scratch Oracle ML inference.
Loads model from S3, fetches data from Supabase, generates predictions.
"""

import os
import json
import pickle
import boto3
from datetime import datetime, date
from io import BytesIO

# Install at Lambda: pip install supabase numpy scikit-learn -t .
from supabase import create_client
import numpy as np

# =====================================================
# Configuration
# =====================================================

S3_BUCKET = 'scratch-oracle-ml-models'
MODEL_KEY = 'lottery_model_v1.pkl'

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']

s3 = boto3.client('s3')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global model cache (reused across warm invocations)
MODEL_CACHE = None

# =====================================================
# Model Loading
# =====================================================

def load_model_from_s3():
    """Load model from S3 (cached after first invocation)."""
    global MODEL_CACHE

    if MODEL_CACHE is not None:
        print("✅ Using cached model")
        return MODEL_CACHE

    print(f"📥 Loading model from s3://{S3_BUCKET}/{MODEL_KEY}")

    try:
        obj = s3.get_object(Bucket=S3_BUCKET, Key=MODEL_KEY)
        model_bytes = obj['Body'].read()
        MODEL_CACHE = pickle.loads(model_bytes)
        print("✅ Model loaded successfully")
        return MODEL_CACHE
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise

# =====================================================
# Data Fetching
# =====================================================

def fetch_games():
    """Fetch active games from Supabase."""
    response = supabase.table('games').select('*').eq('is_active', True).execute()
    return response.data

def fetch_snapshots(game_id):
    """Fetch recent snapshots for a game."""
    response = supabase.table('historical_snapshots') \
        .select('*') \
        .eq('game_id', game_id) \
        .order('snapshot_date', desc=True) \
        .limit(30) \
        .execute()
    return response.data

# =====================================================
# Feature Engineering
# =====================================================

def engineer_features(game, snapshots):
    """Create features for prediction (same as training)."""
    features = {}

    # Basic features
    features['ticket_price'] = game['ticket_price']
    features['remaining_prizes'] = game['remaining_top_prizes']
    features['total_prizes'] = game['total_top_prizes']

    # Prize concentration
    if game['total_top_prizes'] > 0:
        features['prize_concentration'] = game['remaining_top_prizes'] / game['total_top_prizes']
    else:
        features['prize_concentration'] = 0

    # Expected Value
    if game['total_top_prizes'] > 0 and game['ticket_price'] > 0:
        features['ev'] = (game['remaining_top_prizes'] * game['top_prize_amount']) / \
                         (game['total_top_prizes'] * game['ticket_price'])
    else:
        features['ev'] = 0

    # Recency
    if game.get('last_scraped_at'):
        last_scraped = datetime.fromisoformat(game['last_scraped_at'].replace('Z', '+00:00'))
        features['recency'] = (datetime.now(last_scraped.tzinfo) - last_scraped).days
    else:
        features['recency'] = 999

    # Depletion rate (7-day)
    if len(snapshots) >= 7:
        recent_7d = sorted(snapshots, key=lambda x: x['snapshot_date'], reverse=True)[:7]
        prizes_start = recent_7d[-1]['remaining_top_prizes']
        prizes_end = recent_7d[0]['remaining_top_prizes']
        features['depletion_rate_7d'] = (prizes_start - prizes_end) / 7
    else:
        features['depletion_rate_7d'] = 0

    # Velocity (EV change)
    if len(snapshots) >= 7:
        recent_7d = sorted(snapshots, key=lambda x: x['snapshot_date'], reverse=True)[:7]
        ev_values = [s.get('expected_value', 0) for s in recent_7d if s.get('expected_value')]
        if len(ev_values) >= 2:
            features['velocity'] = ev_values[0] - ev_values[-1]
        else:
            features['velocity'] = 0
    else:
        features['velocity'] = 0

    return features

# =====================================================
# Prediction
# =====================================================

def generate_prediction(game, model_data):
    """Generate prediction for a single game."""
    # Fetch snapshots
    snapshots = fetch_snapshots(game['id'])

    # Engineer features
    features = engineer_features(game, snapshots)

    # Prepare feature vector
    feature_cols = model_data['feature_cols']
    X = np.array([[features[col] for col in feature_cols]])

    # Predict
    model = model_data['model']
    ai_score = float(model.predict(X)[0])
    ai_score = max(0, min(100, ai_score))  # Clamp to 0-100

    # Calculate confidence (based on data quality)
    data_quality = len(snapshots) / 30  # 30 days = full confidence
    confidence = min(data_quality * 100, 100)

    # Calculate win probability (derived from EV and score)
    win_probability = min(features['ev'] / 10, 1.0)

    # Generate recommendation
    if ai_score >= 80:
        recommendation = 'strong_buy'
    elif ai_score >= 60:
        recommendation = 'buy'
    elif ai_score >= 40:
        recommendation = 'neutral'
    elif ai_score >= 20:
        recommendation = 'avoid'
    else:
        recommendation = 'strong_avoid'

    # Generate reasoning
    reasoning = generate_reasoning(game, features, ai_score)

    return {
        'game_id': game['id'],
        'prediction_date': date.today().isoformat(),
        'ai_score': round(ai_score, 2),
        'win_probability': round(win_probability, 6),
        'expected_value': round(features['ev'], 4),
        'confidence_level': round(confidence, 2),
        'model_version': model_data['version'],
        'features_used': feature_cols,
        'recommendation': recommendation,
        'reasoning': reasoning
    }

def generate_reasoning(game, features, ai_score):
    """Generate human-readable reasoning for prediction."""
    reasons = []

    if features['ev'] > 1.0:
        reasons.append(f"Positive expected value ({features['ev']:.2f})")

    if features['prize_concentration'] > 0.7:
        reasons.append(f"High prize concentration ({features['prize_concentration']*100:.0f}%)")

    if features['depletion_rate_7d'] > 0.5:
        reasons.append("Active prize depletion (hot game)")

    if features['recency'] < 7:
        reasons.append("Recently updated data")

    if not reasons:
        reasons.append("Based on mathematical analysis")

    return " | ".join(reasons)

# =====================================================
# Database Write
# =====================================================

def save_predictions(predictions):
    """Save predictions to Supabase."""
    print(f"💾 Saving {len(predictions)} predictions to Supabase...")

    response = supabase.table('predictions').upsert(
        predictions,
        on_conflict='game_id,prediction_date,model_version'
    ).execute()

    print("✅ Predictions saved")
    return response

# =====================================================
# Lambda Handler
# =====================================================

def lambda_handler(event, context):
    """Main Lambda entry point."""
    print("=" * 70)
    print("🎰 SCRATCH ORACLE ML INFERENCE")
    print("=" * 70)

    try:
        # Load model
        model_data = load_model_from_s3()

        # Fetch games
        print("📡 Fetching games from Supabase...")
        games = fetch_games()
        print(f"✅ Found {len(games)} active games")

        # Generate predictions
        predictions = []
        for game in games:
            try:
                prediction = generate_prediction(game, model_data)
                predictions.append(prediction)
                print(f"✅ {game['game_name']}: Score {prediction['ai_score']:.0f}/100")
            except Exception as e:
                print(f"❌ Error predicting {game['game_name']}: {e}")

        # Save to database
        save_predictions(predictions)

        print("\n" + "=" * 70)
        print("✅ INFERENCE COMPLETE!")
        print("=" * 70)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Predictions generated successfully',
                'predictions': len(predictions),
                'timestamp': datetime.now().isoformat()
            })
        }

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

#### Step 2.5: Create Lambda Deployment Package

```bash
cd lambda-inference

# Create package directory
mkdir package
cd package

# Install dependencies (Linux-compatible, for Lambda)
pip install supabase numpy scikit-learn -t .

# Go back and copy function code
cd ..
cp lambda_function.py package/

# Create deployment zip
cd package
zip -r ../lambda_function.zip .
cd ..

# Verify package
unzip -l lambda_function.zip
```

#### Step 2.6: Create Lambda Function via AWS CLI

```bash
# Create IAM role for Lambda
aws iam create-role \
  --role-name scratch-oracle-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name scratch-oracle-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name scratch-oracle-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create Lambda function
aws lambda create-function \
  --function-name scratch-oracle-ml-inference \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/scratch-oracle-lambda-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{SUPABASE_URL=YOUR_SUPABASE_URL,SUPABASE_KEY=YOUR_SUPABASE_KEY}"

# Note: Replace YOUR_ACCOUNT_ID, YOUR_SUPABASE_URL, YOUR_SUPABASE_KEY
```

#### Step 2.7: Test Lambda Function

```bash
# Invoke function manually
aws lambda invoke \
  --function-name scratch-oracle-ml-inference \
  --payload '{}' \
  response.json

# Check output
cat response.json
```

---

### Phase 3: Scheduling with EventBridge

#### Step 3.1: Create EventBridge Rule

```bash
# Create rule (daily at 3 AM CST = 8 AM UTC)
aws events put-rule \
  --name scratch-oracle-daily-predictions \
  --schedule-expression "cron(0 8 * * ? *)" \
  --description "Run ML predictions daily at 3 AM CST"

# Add Lambda as target
aws events put-targets \
  --rule scratch-oracle-daily-predictions \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:function:scratch-oracle-ml-inference"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name scratch-oracle-ml-inference \
  --statement-id scratch-oracle-eventbridge \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT_ID:rule/scratch-oracle-daily-predictions
```

#### Step 3.2: Verify Scheduling

```bash
# List rules
aws events list-rules

# Check targets
aws events list-targets-by-rule --rule scratch-oracle-daily-predictions
```

---

### Phase 4: Updating the Model (No Redeployment)

```bash
# Train new model locally
cd ml-training
python train_model.py  # Generates models/lottery_model_v2.pkl

# Upload to S3 (overwrites existing)
aws s3 cp models/lottery_model_v2.pkl s3://scratch-oracle-ml-models/lottery_model_v1.pkl

# Lambda will automatically use new model on next invocation!
# No need to redeploy Lambda function
```

**Alternative: Use versioned models**

```bash
# Upload as new version
aws s3 cp models/lottery_model_v2.pkl s3://scratch-oracle-ml-models/lottery_model_v2.pkl

# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name scratch-oracle-ml-inference \
  --environment Variables="{SUPABASE_URL=YOUR_URL,SUPABASE_KEY=YOUR_KEY,MODEL_KEY=lottery_model_v2.pkl}"
```

---

## Monitoring & Debugging

### CloudWatch Logs

**View logs via AWS Console:**
1. Go to CloudWatch → Log Groups
2. Find `/aws/lambda/scratch-oracle-ml-inference`
3. View latest log stream

**View logs via CLI:**

```bash
# Get latest log stream
aws logs describe-log-streams \
  --log-group-name /aws/lambda/scratch-oracle-ml-inference \
  --order-by LastEventTime \
  --descending \
  --max-items 1

# Tail logs
aws logs tail /aws/lambda/scratch-oracle-ml-inference --follow
```

### Debugging Checklist

**If Lambda fails:**

1. **Check CloudWatch Logs** - Error messages will appear here
2. **Verify S3 model exists** - `aws s3 ls s3://scratch-oracle-ml-models/`
3. **Test Supabase connection** - Try accessing Supabase from local Python
4. **Check IAM permissions** - Lambda role needs S3 read access
5. **Verify environment variables** - `aws lambda get-function-configuration --function-name scratch-oracle-ml-inference`
6. **Test locally** - Run `lambda_function.py` locally to debug

**If predictions are poor:**

1. **Check data quality** - Ensure Supabase has sufficient historical snapshots
2. **Retrain model** - More data = better predictions
3. **Tune hyperparameters** - Adjust `RandomForestRegressor` parameters
4. **Add features** - Include moon phase, day of week, etc.
5. **Monitor model performance** - Track predictions vs. actual outcomes

### Monitoring Dashboard (Optional)

**Create CloudWatch Dashboard:**

```bash
aws cloudwatch put-dashboard \
  --dashboard-name scratch-oracle-ml \
  --dashboard-body file://dashboard.json
```

**File**: `dashboard.json`

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
          [".", "Errors", {"stat": "Sum", "label": "Errors"}],
          [".", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Performance",
        "yAxis": {"left": {"min": 0}}
      }
    }
  ]
}
```

---

## Cost Analysis

### AWS Lambda (Recommended Approach)

**Free Tier (Permanent):**
- 1M requests per month
- 400,000 GB-seconds of compute

**Your Usage:**
- Daily job = 30 requests/month
- Execution time: ~30 seconds @ 512MB = 15 GB-seconds per request
- Total: 30 × 15 = 450 GB-seconds/month

**Verdict**: **$0/month** (well within free tier for 2+ years)

**After Free Tier:**
- Requests: $0.20 per 1M requests → $0.000006/request
- Compute: $0.0000166667 per GB-second
- Monthly cost: 30 × $0.000006 + 450 × $0.0000166667 = **$0.0076/month** (~1 cent)

### S3 Storage

**Free Tier (12 months):**
- 5 GB storage
- 20,000 GET requests

**Your Usage:**
- Model size: ~50MB
- GET requests: 30/month (one per Lambda invocation)

**Verdict**: **$0/month** for first year

**After Free Tier:**
- Storage: $0.023 per GB = $0.023 × 0.05 = **$0.00115/month**
- GET requests: $0.0004 per 1,000 = **$0.000012/month**
- Total: **$0.0012/month** (~0.1 cent)

### EventBridge Scheduler

**Free Tier (Permanent):**
- 14M invocations/month

**Your Usage:**
- 30 invocations/month

**Verdict**: **$0/month** (permanent free tier)

### Total Cost (AWS Hybrid Approach)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| Lambda | $0 | $0.0076/month |
| S3 | $0 | $0.0012/month |
| EventBridge | $0 | $0 |
| CloudWatch Logs | $0* | $0-0.50/month** |
| **TOTAL** | **$0/month** | **~$0.01-0.51/month** |

*5GB free
**Only if logs exceed 5GB (unlikely)

**Conclusion**: Essentially free for 1-2 years, then ~$0.50/month max.

---

### Alternative Options Cost Comparison

| Platform | Free Tier | Your Cost | Notes |
|----------|-----------|-----------|-------|
| **AWS Lambda** | 1M req/month | $0-0.50/month | Recommended |
| **Google Cloud Functions** | 2M req/month | $0-0.50/month | Similar to AWS |
| **Vercel (Hobby)** | 2 cron/day | $0 | Limited to light models |
| **Railway** | $5 trial | $5-20/month | No free tier |
| **Supabase Edge Functions** | 500K req/month | $0-1/month | Need ONNX conversion |
| **GitHub Actions** | 2,000 min/month | $0 | Not production-ready |

---

## Future Scaling Considerations

### When to Upgrade Architecture

**Indicators you need to scale:**

1. **Multiple states (10+)**: Current setup handles 50 games/state × 10 states = 500 games (~2 min execution)
2. **Real-time predictions**: Current setup is batch-only (daily)
3. **Heavy models (>500MB)**: Switch to Lambda Container Images (10GB limit)
4. **High throughput**: Daily job becomes hourly or more frequent

### Scaling Path

**Phase 1: Current (MVP) - Daily batch predictions**
- AWS Lambda (512MB, 60s timeout)
- S3 model storage
- EventBridge daily cron
- Cost: $0-0.50/month

**Phase 2: Multi-state expansion (10 states, 500 games)**
- Upgrade Lambda memory to 1GB
- Increase timeout to 300s (5 min)
- Consider parallel execution (invoke Lambda per state)
- Cost: $1-2/month

**Phase 3: Hourly predictions + real-time API**
- Keep batch job for full predictions
- Add lightweight inference API (Supabase Edge Function with ONNX)
- Cache predictions in Redis (Upstash free tier)
- Cost: $2-5/month

**Phase 4: Enterprise scale (50 states, 5,000 games)**
- Switch to Lambda Container Images (10GB)
- Use AWS Batch for parallel processing
- Add SageMaker for model training/retraining
- Add API Gateway for public API access
- Cost: $50-200/month

**Phase 5: Exit-ready (100K+ users, real-time everything)**
- Migrate to dedicated inference cluster (AWS ECS/EKS)
- Add model serving layer (TensorFlow Serving)
- Implement A/B testing for models
- Add real-time feature store
- Cost: $500-2,000/month

---

## Appendix: Alternative Implementations

### A. Lightweight Model Only (Supabase Edge Functions)

**Use case**: If you only need simple models (linear regression, decision trees)

**Pros**: Native Supabase integration, no external services

**Implementation**:

1. Convert model to ONNX:
```python
# In training script
import skl2onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

initial_type = [('float_input', FloatTensorType([None, 8]))]  # 8 features
onnx_model = convert_sklearn(model, initial_types=initial_type)

with open("model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
```

2. Deploy to Supabase Edge Function:
```typescript
// supabase/functions/ml-inference/index.ts
import { serve } from "https://deno.land/std/http/server.ts"
import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"

serve(async (req) => {
  const session = await ort.InferenceSession.create("./model.onnx")
  // ... rest of inference logic
})
```

**Cons**: Limited to ONNX-compatible models, requires conversion

---

### B. GitHub Actions (Prototyping Only)

**Use case**: Testing before committing to AWS

**Implementation**:

**File**: `.github/workflows/ml-predictions.yml`

```yaml
name: Daily ML Predictions

on:
  schedule:
    - cron: '0 8 * * *'  # 3 AM CST
  workflow_dispatch:  # Manual trigger

jobs:
  predict:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run predictions
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          python ml-inference/predict.py
```

**Cons**: Not production-grade, 2,000 min/month limit, requires public repo

---

### C. Vercel + Lightweight Model

**Use case**: If your entire app is on Vercel and you want to keep everything in one place

**Implementation**:

1. Use scikit-learn (not TensorFlow/PyTorch)
2. Create API route:

**File**: `api/ml-inference.py`

```python
import os
import pickle
from datetime import date
from supabase import create_client

# Load model (cached in /tmp between invocations)
MODEL_PATH = '/tmp/model.pkl'

def load_model():
    if not os.path.exists(MODEL_PATH):
        # Download from S3 or include in deployment
        with open('models/model.pkl', 'rb') as f:
            model_data = pickle.load(f)
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(model_data, f)

    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def handler(req, res):
    # ... same inference logic as Lambda
    pass
```

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/ml-inference",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Cons**: Package size must be <50MB (challenging for ML models)

---

## Conclusion

### Final Recommendation: AWS Lambda + EventBridge

**Reasoning:**
1. **Cost**: Essentially free for 1-2 years ($0-0.50/month after)
2. **Flexibility**: Support any ML framework (TensorFlow, PyTorch, scikit-learn)
3. **Scalability**: Easy to upgrade as you grow
4. **Model updates**: Upload new model to S3, no redeployment needed
5. **Industry standard**: Battle-tested, extensive documentation
6. **Production-ready**: Built-in monitoring, logging, alerting

**Time to Implement:**
- Phase 1 (Training): 4-6 hours (includes learning ML)
- Phase 2 (AWS setup): 2-3 hours (first time), 30 min (subsequent)
- Phase 3 (Scheduling): 30 minutes
- **Total**: 1 full day for MVP

**Next Steps:**
1. Train your first model locally (use provided script)
2. Set up AWS account (if not already)
3. Deploy Lambda function (follow Phase 2 guide)
4. Schedule with EventBridge (Phase 3)
5. Monitor first few runs via CloudWatch
6. Iterate on model based on real performance

**Questions before starting?**
- Review the implementation guide (Phase 1-4)
- Test training script locally first
- Keep AWS CLI commands handy for debugging

---

**Document Status**: Research complete, implementation ready
**Author**: Claude Code
**Last Updated**: January 2025
**Version**: 1.0
