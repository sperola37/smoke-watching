// MapScreen.tsx
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, Modal, TouchableOpacity, Alert, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WatchPoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'green' | 'red';
  updatedAt: string;
  photo?: string;
  history?: { photo: string; timestamp: string }[];
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<WatchPoint | null>(null);
  const [watchPoints, setWatchPoints] = useState<WatchPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission not granted');
        return;
      }

      const initialLoc = await Location.geocodeAsync('한성대학교');
      const coord = initialLoc[0];
      setLocation({
        coords: {
          latitude: coord.latitude,
          longitude: coord.longitude,
          accuracy: 5,
          altitude: 0,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });

      setWatchPoints([
        {
          id: 'example',
          latitude: coord.latitude,
          longitude: coord.longitude,
          address: '한성대학교',
          status: 'green',
          updatedAt: new Date().toISOString(),
          photo: 'https://raw.githubusercontent.com/sperola37/test-repo-1743934500179/refs/heads/main/photo1.png',
          history: [],
        },
      ]);
    })();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;
      if (!data?.address || !data?.status) return;

      const coords = await Location.geocodeAsync(data.address);
      if (!coords.length) return;
      const { latitude, longitude } = coords[0];

      setWatchPoints((prev) => {
        const existing = prev.find((p) => p.address === data.address);
        const newTimestamp = new Date().toISOString();

        if (existing) {
          const updated: WatchPoint = {
            ...existing,
            status: data.status === 'smoking' ? 'red' : 'green',
            updatedAt: newTimestamp,
            photo: data.photo,
            history: data.status === 'smoking' ? [...(existing.history || []), { photo: data.photo, timestamp: newTimestamp }] : existing.history,
          };
          storeHistory(updated.address, updated.history || []);
          return prev.map((p) => (p.address === data.address ? updated : p));
        } else {
          const newPoint: WatchPoint = {
            id: Date.now().toString(),
            latitude,
            longitude,
            address: data.address,
            status: data.status === 'smoking' ? 'red' : 'green',
            updatedAt: newTimestamp,
            photo: data.photo,
            history: data.status === 'smoking' ? [{ photo: data.photo, timestamp: newTimestamp }] : [],
          };
          storeHistory(newPoint.address, newPoint.history || []);
          return [...prev, newPoint];
        }
      });
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
  const data = response.notification.request?.content?.data;

  if (!data) {
    console.error('❌ 알림 클릭: data 없음!', response.notification.request.content);
    return;
  }

  console.log('✅ 알림 클릭됨, 수신된 data:', data);

  try {
    const coords = await Location.geocodeAsync(data.address);
    if (!coords.length) return;

    const { latitude, longitude } = coords[0];
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    const matched = watchPoints.find((p) => p.address === data.address);
    if (matched) {
      openPoint(matched);
    }
  } catch (err) {
    console.warn('탭한 알림 처리 실패:', err);
  }
});


    return () => {
      subscription.remove();
      responseListener.remove();
    };
  }, [watchPoints]);

  const storeHistory = async (address: string, history: { photo: string; timestamp: string }[]) => {
    await AsyncStorage.setItem(`history:${address}`, JSON.stringify(history));
  };

  const getHistory = async (address: string) => {
    const data = await AsyncStorage.getItem(`history:${address}`);
    return data ? JSON.parse(data) : [];
  };

  const openPoint = async (point: WatchPoint) => {
    const history = await getHistory(point.address);
    setSelectedPoint({ ...point, history });
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        {watchPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            pinColor={point.status === 'green' ? '#00cc00' : '#ff0000'}
            onPress={() => openPoint(point)}
          />
        ))}
      </MapView>

      <Modal visible={!!selectedPoint} transparent animationType="slide" onRequestClose={() => setSelectedPoint(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPoint?.address}</Text>
            <Text>
  상태: <Text style={{ color: selectedPoint?.status === 'green' ? 'green' : 'red' }}>
    {selectedPoint?.status === 'green' ? '흡연 감지 안됨' : '흡연 감지됨'}
  </Text>
</Text>
            <Text>갱신 시각: {new Date(selectedPoint?.updatedAt || '').toLocaleString()}</Text>
            {selectedPoint?.photo && (
              <TouchableOpacity onPress={() => setShowHistoryModal(true)}>
                <Image source={{ uri: selectedPoint.photo }} style={styles.modalImage} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPoint(null)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHistoryModal} transparent animationType="slide" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>과거 감지 사진</Text>
            <ScrollView horizontal>
              {selectedPoint?.history?.map((item, index) => (
                <View key={index} style={{ marginRight: 10 }}>
                  <Image source={{ uri: item.photo }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                  <Text style={{ fontSize: 12 }}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowHistoryModal(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 50,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});
