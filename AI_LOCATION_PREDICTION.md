# AI Location Prediction System
## Predicting "Lucky" Lottery Retailers

### Overview
This system will train an AI model to predict which retail locations are more likely to sell winning lottery tickets. By analyzing historical winning ticket data, geographic patterns, and temporal trends, we can guide users to "hot" stores.

---

## Data Architecture

### Database Schema Extensions

#### 1. `retailers` Table
Stores information about lottery retailers.

```sql
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  retailer_type TEXT, -- gas_station, grocery, convenience, liquor, etc.

  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  county TEXT,

  -- Metadata
  phone TEXT,
  hours_of_operation JSONB,
  is_active BOOLEAN DEFAULT true,

  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_retailers_location ON retailers (state, city);
CREATE INDEX idx_retailers_coords ON retailers (latitude, longitude);
CREATE INDEX idx_retailers_active ON retailers (is_active) WHERE is_active = true;
```

#### 2. `winning_tickets` Table
Tracks where and when winning tickets were sold.

```sql
CREATE TABLE winning_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Game info
  game_id UUID REFERENCES games(id),
  game_number INTEGER,
  prize_tier TEXT, -- top_prize, $100000, $50000, $10000, etc.
  prize_amount DECIMAL(12, 2),

  -- Location info
  retailer_id UUID REFERENCES retailers(id),
  sold_at TIMESTAMP, -- When ticket was purchased
  claimed_at TIMESTAMP, -- When prize was claimed

  -- Ticket info
  ticket_number TEXT,
  claim_status TEXT, -- claimed, unclaimed, expired

  -- Metadata
  scrape_source TEXT, -- mn_lottery, fl_lottery, etc.
  verification_status TEXT, -- verified, unverified, disputed

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_winning_tickets_retailer ON winning_tickets (retailer_id);
CREATE INDEX idx_winning_tickets_game ON winning_tickets (game_id);
CREATE INDEX idx_winning_tickets_date ON winning_tickets (sold_at);
CREATE INDEX idx_winning_tickets_prize ON winning_tickets (prize_amount);
```

#### 3. `retailer_predictions` Table
Stores AI predictions for each retailer.

```sql
CREATE TABLE retailer_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  retailer_id UUID REFERENCES retailers(id),

  -- Predictions
  hotness_score DECIMAL(5, 4), -- 0.0000 to 1.0000
  predicted_next_win_days INTEGER, -- Days until next predicted win
  confidence_level DECIMAL(5, 4), -- Model confidence

  -- Features used in prediction
  total_wins_lifetime INTEGER,
  total_wins_30d INTEGER,
  total_wins_90d INTEGER,
  avg_prize_amount DECIMAL(12, 2),
  days_since_last_win INTEGER,
  win_frequency DECIMAL(8, 4), -- Wins per month

  -- Trend analysis
  trend TEXT, -- heating_up, cooling_down, stable, new
  momentum_score DECIMAL(5, 4), -- -1.0 (cooling) to +1.0 (heating)

  -- Geographic factors
  nearby_hot_retailers INTEGER, -- Count of hot retailers within 5 miles
  regional_average_hotness DECIMAL(5, 4),

  -- Metadata
  model_version TEXT,
  predicted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Predictions expire after 24 hours

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_retailer_predictions_retailer ON retailer_predictions (retailer_id);
CREATE INDEX idx_retailer_predictions_hotness ON retailer_predictions (hotness_score DESC);
CREATE INDEX idx_retailer_predictions_active ON retailer_predictions (expires_at) WHERE expires_at > NOW();
```

---

## Data Collection

### Phase 1: Scraping Winner Data

#### Minnesota Lottery Winner Scraper
```typescript
// scripts/scrape-mn-winners.ts

export async function scrapeMinnesotaWinners() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to winners page
  await page.goto('https://www.mnlottery.com/games/scratchers/winners');

  // Extract winner data
  const winners = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.winner-row'));
    return rows.map(row => ({
      gameName: row.querySelector('.game-name')?.textContent?.trim(),
      prizeAmount: row.querySelector('.prize-amount')?.textContent?.trim(),
      retailerName: row.querySelector('.retailer-name')?.textContent?.trim(),
      city: row.querySelector('.city')?.textContent?.trim(),
      dateWon: row.querySelector('.date')?.textContent?.trim(),
    }));
  });

  // Geocode addresses and save to database
  for (const winner of winners) {
    await saveWinningTicket(winner);
  }

  await browser.close();
}
```

#### Data Enrichment
```typescript
// services/geocoding/geocodingService.ts

export async function geocodeRetailer(address: string, city: string, state: string) {
  // Use Google Maps Geocoding API
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)},${city},${state}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: data.results[0].formatted_address,
    };
  }

  return null;
}
```

---

## Machine Learning Pipeline

### Training Data Features

#### Retailer-Level Features
1. **Historical Performance**
   - Total wins (all time, 30d, 90d, 365d)
   - Average prize amount
   - Win frequency (wins per month)
   - Days since last win
   - Largest prize won

2. **Temporal Patterns**
   - Day of week distribution
   - Time of day patterns
   - Seasonal trends
   - Recent momentum (wins trending up/down)

3. **Geographic Features**
   - Distance to nearest hot retailer
   - Count of retailers within 5 miles
   - County-level win rate
   - Urban vs rural classification
   - Population density

4. **Retailer Characteristics**
   - Type (gas station, grocery, etc.)
   - Operating hours
   - Years in business
   - Sales volume estimate

#### Game-Level Features
1. **Game Popularity**
   - Total tickets sold at location
   - Games offered
   - Price point mix

2. **Prize Availability**
   - Remaining prizes in area
   - Top prize proximity

### Model Architecture

#### Option 1: Gradient Boosting (Recommended for MVP)
```python
# scripts/train-location-model.py

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

def train_location_prediction_model():
    # Load data
    retailers = load_retailer_features()
    winning_history = load_winning_ticket_history()

    # Feature engineering
    X = create_feature_matrix(retailers, winning_history)

    # Target: Probability of win in next 30 days
    y = calculate_target_probability(winning_history)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='reg:squarederror'
    )

    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print(f"Model Performance:")
    print(f"  RMSE: {rmse:.4f}")
    print(f"  R²: {r2:.4f}")

    # Feature importance
    importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("\nTop 10 Features:")
    print(importance.head(10))

    # Save model
    import joblib
    joblib.dump(model, 'models/location_predictor_v1.pkl')

    return model
```

#### Option 2: Neural Network (For Scale)
```python
# scripts/train-nn-location-model.py

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def create_neural_network_model(input_dim):
    model = keras.Sequential([
        layers.Dense(128, activation='relu', input_shape=(input_dim,)),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(32, activation='relu'),
        layers.Dense(1, activation='sigmoid')  # Probability output
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy', 'AUC']
    )

    return model
```

---

## Prediction Generation

### Batch Prediction Script
```python
# scripts/generate-location-predictions.py

import joblib
import pandas as pd
from supabase import create_client

def generate_location_predictions():
    # Load model
    model = joblib.load('models/location_predictor_v1.pkl')

    # Get all active retailers
    supabase = create_client(
        os.environ['EXPO_PUBLIC_SUPABASE_URL'],
        os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
    )

    retailers = supabase.table('retailers').select('*').eq('is_active', True).execute()

    predictions = []

    for retailer in retailers.data:
        # Generate features
        features = extract_retailer_features(retailer['id'])

        # Predict
        hotness_score = model.predict([features])[0]

        # Calculate additional metrics
        predicted_days = calculate_predicted_next_win(features, hotness_score)
        trend = detect_trend(retailer['id'])
        momentum = calculate_momentum(retailer['id'])

        # Save prediction
        prediction = {
            'retailer_id': retailer['id'],
            'hotness_score': float(hotness_score),
            'predicted_next_win_days': predicted_days,
            'confidence_level': calculate_confidence(features),
            'trend': trend,
            'momentum_score': momentum,
            'model_version': 'v1.0',
            'expires_at': (datetime.now() + timedelta(hours=24)).isoformat()
        }

        predictions.append(prediction)

    # Batch insert to Supabase
    supabase.table('retailer_predictions').insert(predictions).execute()

    print(f"Generated {len(predictions)} location predictions")
```

---

## User-Facing Features

### 1. Hot Retailer Map
Shows users nearby "hot" retailers on a map.

```typescript
// components/maps/HotRetailerMap.tsx

export function HotRetailerMap({ userLocation }: Props) {
  const [hotRetailers, setHotRetailers] = useState([]);

  useEffect(() => {
    async function loadHotRetailers() {
      const { data } = await supabase
        .from('retailer_predictions')
        .select(`
          *,
          retailers (*)
        `)
        .gte('hotness_score', 0.7) // Only show "hot" stores
        .gt('expires_at', new Date().toISOString())
        .order('hotness_score', { ascending: false })
        .limit(50);

      setHotRetailers(data);
    }

    loadHotRetailers();
  }, [userLocation]);

  return (
    <MapView>
      {hotRetailers.map(prediction => (
        <Marker
          key={prediction.retailer_id}
          coordinate={{
            latitude: prediction.retailers.latitude,
            longitude: prediction.retailers.longitude
          }}
          pinColor={getHotnessColor(prediction.hotness_score)}
        >
          <Callout>
            <RetailerCallout prediction={prediction} />
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}
```

### 2. Retailer Hotness Badge
```typescript
function getHotnessLevel(score: number): string {
  if (score >= 0.9) return '🔥🔥🔥 BLAZING HOT';
  if (score >= 0.75) return '🔥🔥 Very Hot';
  if (score >= 0.6) return '🔥 Hot';
  if (score >= 0.4) return '🌡️ Warm';
  return '❄️ Cool';
}
```

### 3. Personalized Recommendations
```typescript
// services/recommendations/locationRecommendationEngine.ts

export async function getLocationBasedRecommendations(
  userLat: number,
  userLng: number,
  radius: number = 10
) {
  // Find hot retailers near user
  const hotRetailers = await findNearbyHotRetailers(userLat, userLng, radius);

  // Get available games at those retailers
  const recommendations = [];

  for (const retailer of hotRetailers) {
    const games = await getGamesAtRetailer(retailer.id);

    recommendations.push({
      retailer: retailer,
      games: games,
      hotness: retailer.predictions.hotness_score,
      distance: calculateDistance(userLat, userLng, retailer.latitude, retailer.longitude),
      reasoning: [
        `🔥 ${getHotnessLevel(retailer.predictions.hotness_score)}`,
        `${retailer.predictions.total_wins_30d} wins in last 30 days`,
        `${retailer.predictions.trend === 'heating_up' ? '📈 Trending up' : ''}`,
        `Only ${calculateDistance(userLat, userLng, retailer.latitude, retailer.longitude).toFixed(1)} miles away`
      ]
    });
  }

  return recommendations.sort((a, b) => b.hotness - a.hotness);
}
```

---

## Training Schedule

### Phase 1: Historical Data Collection (Months 1-2)
- Scrape 2+ months of winning ticket data
- Build retailer database
- Geocode all locations
- **Goal:** 10,000+ winning tickets tracked

### Phase 2: Model Training (Month 3)
- Feature engineering
- Model experimentation
- Hyperparameter tuning
- **Goal:** 70%+ prediction accuracy

### Phase 3: Live Predictions (Month 4)
- Deploy prediction pipeline
- Generate daily predictions
- Integrate with app UI
- **Goal:** User engagement with location features

### Phase 4: Continuous Learning (Ongoing)
- Daily model retraining
- A/B testing of features
- User feedback integration
- **Goal:** 80%+ prediction accuracy

---

## Automation with GitHub Actions

```yaml
# .github/workflows/train-location-model.yml

name: Train Location Prediction Model

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  train-model:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Train model
        env:
          EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
          EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
        run: |
          python scripts/train-location-model.py

      - name: Generate predictions
        run: |
          python scripts/generate-location-predictions.py

      - name: Upload model artifact
        uses: actions/upload-artifact@v4
        with:
          name: location-model-${{ github.run_number }}
          path: models/location_predictor_v*.pkl
```

---

## Success Metrics

### Model Performance
- **Accuracy:** 75%+ in predicting if retailer will have a win in next 30 days
- **Precision:** 70%+ (avoid too many false positives)
- **Recall:** 65%+ (catch most of the hot retailers)

### User Engagement
- **Map Usage:** 40%+ of users check hot retailer map
- **Location-Based Purchases:** 25%+ of purchases at recommended locations
- **Return Visits:** Users check predictions 2+ times per week

### Business Impact
- **User Retention:** +15% increase from location features
- **Session Duration:** +20% time in app
- **Social Sharing:** Users share hot locations

---

## Next Steps

1. **Immediate (This Week)**
   - Create winner scraping script for MN
   - Set up retailers and winning_tickets tables
   - Start collecting 2 months of data

2. **Short-Term (This Month)**
   - Build geocoding pipeline
   - Create feature extraction scripts
   - Design UI mockups for map

3. **Medium-Term (Next 2-3 Months)**
   - Train first model iteration
   - Generate initial predictions
   - Beta test with select users

4. **Long-Term (6+ Months)**
   - Expand to all states
   - Real-time prediction updates
   - Social features ("John won $10K at this store!")
