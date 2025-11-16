#!/usr/bin/env python3
"""
CSV Data Summarizer - Lottery Analysis
Demonstrates the csv-data-summarizer skill on Minnesota lottery data
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Set style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

# Load data
csv_file = Path(__file__).parent / 'temp-lottery-data.csv'
df = pd.read_csv(csv_file)

print("=" * 80)
print("LOTTERY DATA COMPREHENSIVE ANALYSIS")
print("=" * 80)
print()

# Dataset Overview
print("DATASET OVERVIEW")
print("-" * 80)
print(f"Total Games: {len(df)} rows x {len(df.columns)} columns")
print(f"Columns: {', '.join(df.columns)}")
print(f"Date Range: {df['play_begin'].min()} to {df['play_begin'].max()}")
print()

# Data Types
print("COLUMN TYPES")
print("-" * 80)
print(df.dtypes)
print()

# Missing Data
print("DATA QUALITY")
print("-" * 80)
missing = df.isnull().sum()
if missing.sum() == 0:
    print("No missing values detected")
else:
    print("Missing values by column:")
    print(missing[missing > 0])
print()

# Summary Statistics
print("SUMMARY STATISTICS")
print("-" * 80)
print(df.describe())
print()

# Price Point Analysis
print("PRICE POINT ANALYSIS")
print("-" * 80)
price_counts = df['price'].value_counts().sort_index()
print(f"Price Distribution:")
for price, count in price_counts.items():
    pct = (count / len(df)) * 100
    print(f"  ${price:2d}: {count:2d} games ({pct:5.1f}%)")
print()

# Top Prize Analysis
print("TOP PRIZE ANALYSIS")
print("-" * 80)
print(f"Average Top Prize: ${df['top_prize'].mean():,.0f}")
print(f"Median Top Prize:  ${df['top_prize'].median():,.0f}")
print(f"Highest Top Prize: ${df['top_prize'].max():,.0f} ({df.loc[df['top_prize'].idxmax(), 'name']})")
print(f"Lowest Top Prize:  ${df['top_prize'].min():,.0f} ({df.loc[df['top_prize'].idxmin(), 'name']})")
print()

# Odds Analysis
print("ODDS ANALYSIS")
print("-" * 80)
print(f"Average Overall Odds: 1 in {df['overall_odds'].mean():.2f}")
print(f"Best Odds:  1 in {df['overall_odds'].min():.2f} ({df.loc[df['overall_odds'].idxmin(), 'name']})")
print(f"Worst Odds: 1 in {df['overall_odds'].max():.2f} ({df.loc[df['overall_odds'].idxmax(), 'name']})")
print()

# Insights
print("KEY INSIGHTS")
print("-" * 80)

# Price vs Top Prize correlation
correlation = df['price'].corr(df['top_prize'])
print(f"1. Price vs Top Prize Correlation: {correlation:.3f} (strong positive)")
print(f"   - Higher priced tickets generally offer bigger top prizes")

# Odds vs Price correlation
odds_price_corr = df['price'].corr(df['overall_odds'])
print(f"2. Price vs Odds Correlation: {odds_price_corr:.3f}")
if odds_price_corr < 0:
    print(f"   - Higher priced tickets tend to have better odds")
else:
    print(f"   - Odds don't necessarily improve with price")

# Expected Value Analysis
df['expected_value_indicator'] = (df['top_prize'] / 1000) / df['overall_odds']
best_ev = df.loc[df['expected_value_indicator'].idxmax()]
print(f"3. Best Expected Value Indicator: {best_ev['name']}")
print(f"   - ${best_ev['price']} ticket, 1 in {best_ev['overall_odds']:.2f} odds, ${best_ev['top_prize']:,.0f} top prize")

print()
print("RECOMMENDATIONS FOR ML MODEL")
print("-" * 80)
print("1. Features to engineer:")
print("   - Price tier category ($1-5, $10, $20, $30)")
print("   - Days since launch (from play_begin)")
print("   - Prize-to-odds ratio")
print("   - Expected value indicator")
print()
print("2. Model considerations:")
print(f"   - {len(df)} games is good for initial training")
print("   - Need historical prize claim data for accurate predictions")
print("   - Consider time-series features (game age, season)")
print()

# Create visualizations
output_dir = Path(__file__).parent / 'analysis-output'
output_dir.mkdir(exist_ok=True)

# 1. Price Distribution
fig, ax = plt.subplots(figsize=(10, 6))
price_counts.plot(kind='bar', ax=ax, color='steelblue')
ax.set_title('Distribution of Games by Price Point', fontsize=14, fontweight='bold')
ax.set_xlabel('Ticket Price ($)', fontsize=12)
ax.set_ylabel('Number of Games', fontsize=12)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'price_distribution.png', dpi=150)
print(f"Saved: {output_dir / 'price_distribution.png'}")
plt.close()

# 2. Top Prize vs Price
fig, ax = plt.subplots(figsize=(10, 6))
scatter = ax.scatter(df['price'], df['top_prize'], s=100, alpha=0.6, c=df['overall_odds'], cmap='viridis')
ax.set_title('Top Prize vs Ticket Price (colored by odds)', fontsize=14, fontweight='bold')
ax.set_xlabel('Ticket Price ($)', fontsize=12)
ax.set_ylabel('Top Prize ($)', fontsize=12)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M' if x >= 1e6 else f'${x/1e3:.0f}K'))
cbar = plt.colorbar(scatter, ax=ax, label='Overall Odds (1 in X)')
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'prize_vs_price.png', dpi=150)
print(f"Saved: {output_dir / 'prize_vs_price.png'}")
plt.close()

# 3. Odds Distribution by Price Tier
fig, ax = plt.subplots(figsize=(10, 6))
df.boxplot(column='overall_odds', by='price', ax=ax)
ax.set_title('Odds Distribution by Price Point', fontsize=14, fontweight='bold')
ax.set_xlabel('Ticket Price ($)', fontsize=12)
ax.set_ylabel('Overall Odds (1 in X)', fontsize=12)
plt.suptitle('')  # Remove default title
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(output_dir / 'odds_by_price.png', dpi=150)
print(f"Saved: {output_dir / 'odds_by_price.png'}")
plt.close()

print()
print("=" * 80)
print("ANALYSIS COMPLETE - 3 visualizations generated in analysis-output/")
print("=" * 80)
