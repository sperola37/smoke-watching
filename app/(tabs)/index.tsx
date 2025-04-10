import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, Modal, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

interface WatchPoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: 'green' | 'yellow' | 'red';
  updatedAt: string;
  photo?: string;
  statusHistory: {
    yellow: number;
    red: number;
  };
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<WatchPoint | null>(null);
  const [watchPoints, setWatchPoints] = useState<WatchPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync(); //위치 정보 권한 요청
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({ //위치 정보 가져오기
          accuracy: Location.Accuracy.High,
        }).catch(() => null);

        if (!currentLocation) {
          setError('Unable to get current location');
          return;
        }

        setLocation(currentLocation);

        // 예시 데이터 생성
        const examplePoint: WatchPoint = {
          id: '1',
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: 'Current Location',
          status: 'green',
          updatedAt: new Date().toISOString(),
          photo: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=300',
          statusHistory: {
            yellow: 0,
            red: 0,
          }
        };
        setWatchPoints([examplePoint]);
      } catch (err) {
        setError('Failed to initialize map data');
        console.error('Map initialization error:', err);
      }
    })();
  }, []);

  // 감시 지점 상태 업데이트 함수
  const updatePointStatus = async (pointId: string, newStatus: 'green' | 'yellow' | 'red') => {
    try {
      setWatchPoints(currentPoints => 
        currentPoints.map(point => {
          if (point.id === pointId) {
            const newHistory = { ...point.statusHistory };
            if (newStatus === 'yellow') newHistory.yellow += 1;
            if (newStatus === 'red') newHistory.red += 1;
            
            return {
              ...point,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: newHistory,
            };
          }
          return point;
        })
      );
    } catch (err) {
      Alert.alert('Update Error', 'Failed to update point status');
      console.error('Status update error:', err);
    }
  };
  //에러 시 재시도 버튼 생성
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLocation(null);
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }
  // 현재 위치를 기준으로 지도를 초기화
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}>
        {watchPoints.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            pinColor={point.status}
            onPress={() => setSelectedPoint(point)}
          />
        ))}
      </MapView>
      
      <Modal
        visible={!!selectedPoint}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPoint(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>감시 지점 #{selectedPoint?.id}</Text>
            <Text style={styles.modalText}>주소: {selectedPoint?.address}</Text>
            <Text style={styles.modalText}>
              상태: <Text style={{ color: selectedPoint?.status }}>{selectedPoint?.status}</Text>
            </Text>
            <Text style={styles.modalText}>
              갱신 시간: {new Date(selectedPoint?.updatedAt || '').toLocaleString()}
            </Text>
            {selectedPoint?.statusHistory && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>최근 감지 횟수:</Text>
                <Text style={styles.historyText}>일시적 감지: {selectedPoint.statusHistory.yellow}</Text>
                <Text style={styles.historyText}>지속적 감지: {selectedPoint.statusHistory.red}</Text>
              </View>
            )}
            {selectedPoint?.photo && (
              <Image
                source={{ uri: selectedPoint.photo }}
                style={styles.modalImage}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPoint(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  historyContainer: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});