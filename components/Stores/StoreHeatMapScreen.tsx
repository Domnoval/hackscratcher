import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl
} from 'react-native';
// import MapView, { Marker, Heatmap } from 'react-native-maps';
// import * as Location from 'expo-location';
import { StoreHeatMapService } from '../../services/stores/storeHeatMapService';
import { HotStore, StoreSearchFilters } from '../../types/stores';

export default function StoreHeatMapScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hotStores, setHotStores] = useState<HotStore[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [filters, setFilters] = useState<StoreSearchFilters>({ radius: 10 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Request location permission
      // Once expo-location is installed, uncomment:
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status === 'granted') {
      //   const location = await Location.getCurrentPositionAsync({});
      //   const coords = {
      //     latitude: location.coords.latitude,
      //     longitude: location.coords.longitude
      //   };
      //   setUserLocation(coords);
      //   await StoreHeatMapService.saveUserLocation(coords);
      // }

      // For now, use mock Minneapolis location
      const mockLocation = { latitude: 44.9778, longitude: -93.2650 };
      setUserLocation(mockLocation);

      // Get hot stores
      const stores = await StoreHeatMapService.getHotStores(mockLocation, filters);
      setHotStores(stores);
    } catch (error) {
      console.error('Failed to load store data:', error);
      Alert.alert('Error', 'Failed to load store heat map');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openNavigation = (store: HotStore) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    Linking.openURL(url);
  };

  const getHeatColor = (score: number): string => {
    if (score >= 80) return '#FF4500'; // Hot red
    if (score >= 60) return '#FFD700'; // Gold
    if (score >= 40) return '#FFA500'; // Orange
    return '#00FF7F'; // Green
  };

  const getHeatEmoji = (score: number): string => {
    if (score >= 80) return '🔥🔥🔥';
    if (score >= 60) return '🔥🔥';
    if (score >= 40) return '🔥';
    return '💎';
  };

  const renderMapView = () => {
    if (!userLocation) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>📍 Location required for map view</Text>
          <Text style={styles.placeholderSubtext}>
            Once expo-location is installed, you'll see a live heat map!
          </Text>
        </View>
      );
    }

    // Placeholder for map (once react-native-maps is installed)
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️ Heat Map View</Text>
        <Text style={styles.placeholderSubtext}>
          Install react-native-maps to see interactive heat map
        </Text>
        <View style={styles.mapLegend}>
          <Text style={styles.legendTitle}>Heat Legend:</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF4500' }]} />
            <Text style={styles.legendText}>80-100: 🔥 Extremely Hot</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>60-79: 🔥🔥 Very Hot</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
            <Text style={styles.legendText}>40-59: 🔥 Hot</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00FF7F' }]} />
            <Text style={styles.legendText}>0-39: 💎 Cool</Text>
          </View>
        </View>
      </View>
    );

    // Actual map implementation (uncomment when packages installed):
    // return (
    //   <MapView
    //     style={styles.map}
    //     initialRegion={{
    //       latitude: userLocation.latitude,
    //       longitude: userLocation.longitude,
    //       latitudeDelta: 0.0922,
    //       longitudeDelta: 0.0421,
    //     }}
    //   >
    //     {/* User location marker */}
    //     <Marker
    //       coordinate={userLocation}
    //       title="You are here"
    //       pinColor="#00FFFF"
    //     />
    //
    //     {/* Hot store markers */}
    //     {hotStores.map(store => (
    //       <Marker
    //         key={store.id}
    //         coordinate={{ latitude: store.latitude, longitude: store.longitude }}
    //         title={store.name}
    //         description={`Heat: ${store.heatScore.score} | ${store.heatScore.totalWins} wins`}
    //         pinColor={getHeatColor(store.heatScore.score)}
    //       />
    //     ))}
    //
    //     {/* Heat map overlay */}
    //     <Heatmap
    //       points={hotStores.map(s => ({
    //         latitude: s.latitude,
    //         longitude: s.longitude,
    //         weight: s.heatScore.score / 100
    //       }))}
    //       opacity={0.6}
    //       radius={50}
    //       gradient={{
    //         colors: ['#00FF7F', '#FFD700', '#FF4500'],
    //         startPoints: [0, 0.5, 1],
    //         colorMapSize: 256
    //       }}
    //     />
    //   </MapView>
    // );
  };

  const renderStoreCard = useCallback(({ item: store, index }: { item: HotStore; index: number }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => openNavigation(store)}
    >
      {/* Rank Badge */}
      {index < 3 && (
        <View style={[styles.rankBadge, index === 0 && styles.rank1Badge]}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
      )}

      {/* Store Header */}
      <View style={styles.storeHeader}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeAddress}>
            {store.address}, {store.city}
          </Text>
          {store.distance && (
            <Text style={styles.storeDistance}>📍 {store.distance.toFixed(1)} mi away</Text>
          )}
        </View>

        {/* Heat Score */}
        <View style={styles.heatScoreContainer}>
          <Text style={styles.heatEmoji}>{getHeatEmoji(store.heatScore.score)}</Text>
          <Text style={[styles.heatScore, { color: getHeatColor(store.heatScore.score) }]}>
            {store.heatScore.score}
          </Text>
        </View>
      </View>

      {/* Store Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{store.heatScore.totalWins}</Text>
          <Text style={styles.statLabel}>Total Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${(store.heatScore.totalPayout / 1000).toFixed(0)}k</Text>
          <Text style={styles.statLabel}>Total Payout</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{store.heatScore.recentWins}</Text>
          <Text style={styles.statLabel}>Recent (30d)</Text>
        </View>
        {store.rating > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⭐ {store.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        )}
      </View>

      {/* Hot Games */}
      {store.heatScore.hotGames.length > 0 && (
        <View style={styles.hotGamesContainer}>
          <Text style={styles.hotGamesLabel}>🔥 Hot Games:</Text>
          <Text style={styles.hotGamesText}>
            {store.heatScore.hotGames.join(', ')}
          </Text>
        </View>
      )}

      {/* Recent Win */}
      {store.recentWins.length > 0 && (
        <View style={styles.recentWinContainer}>
          <Text style={styles.recentWinLabel}>Latest Win:</Text>
          <Text style={styles.recentWinText}>
            ${store.recentWins[0].prizeAmount.toLocaleString()} on {store.recentWins[0].gameName}
          </Text>
          <Text style={styles.recentWinDate}>
            {new Date(store.recentWins[0].winDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Navigate Button */}
      <TouchableOpacity
        style={styles.navigateButton}
        onPress={() => openNavigation(store)}
      >
        <Text style={styles.navigateButtonText}>🧭 Navigate Here</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [openNavigation, getHeatEmoji, getHeatColor]);

  const renderListView = () => {
    return (
      <FlatList
        data={hotStores}
        renderItem={renderStoreCard}
        keyExtractor={(item) => item.id}
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFFF" />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No Stores Found</Text>
            <Text style={styles.emptyText}>
              Adjust your filters or increase search radius
            </Text>
          </View>
        }
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>Loading hot stores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Store Heat Map</Text>
        <Text style={styles.headerSubtitle}>Community Lucky Stores</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            🗺️ Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            📋 List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'map' ? renderMapView() : renderListView()}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Heat scores show recent wins, payouts, and community ratings. Higher = Luckier!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFD700',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#1A1A2E',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#00FFFF',
  },
  toggleText: {
    fontSize: 16,
    color: '#708090',
  },
  toggleTextActive: {
    color: '#0A0A0F',
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A2E',
    margin: 20,
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 24,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#708090',
    textAlign: 'center',
    marginBottom: 20,
  },
  mapLegend: {
    backgroundColor: '#0A0A0F',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  listContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#708090',
    textAlign: 'center',
  },
  storeCard: {
    backgroundColor: '#1A1A2E',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2E2E3F',
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  rank1Badge: {
    backgroundColor: '#FF4500',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#708090',
    marginBottom: 4,
  },
  storeDistance: {
    fontSize: 12,
    color: '#00FFFF',
  },
  heatScoreContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  heatEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  heatScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2E2E3F',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#708090',
  },
  hotGamesContainer: {
    backgroundColor: '#2E2E3F',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  hotGamesLabel: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 4,
  },
  hotGamesText: {
    fontSize: 12,
    color: '#E0E0E0',
  },
  recentWinContainer: {
    backgroundColor: '#1A2E1A',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  recentWinLabel: {
    fontSize: 12,
    color: '#00FF7F',
    marginBottom: 4,
  },
  recentWinText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 2,
  },
  recentWinDate: {
    fontSize: 10,
    color: '#708090',
  },
  navigateButton: {
    backgroundColor: '#00FFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0F',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: '#2E2E3F',
  },
  footerText: {
    fontSize: 12,
    color: '#708090',
    textAlign: 'center',
  },
});
