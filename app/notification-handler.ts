import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ===== 푸시 알림 설정 =====
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ===== EC2로 푸시 토큰 전송 =====
async function sendTokenToEC2(token: string) {
  try {
    const response = await fetch('http://43.200.193.228:5000/register-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.error('❌ EC2 토큰 전송 실패:', response.status);
    } else {
      console.log('✅ EC2에 토큰 전송 성공');
    }
  } catch (error) {
    console.error('❌ EC2 토큰 전송 중 에러:', error);
  }
}
  
// ===== 디바이스 푸시 알림 등록 =====
export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web platform');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.expoProjectId,
    }).catch((err) => {
      console.error('Error getting push token:', err);
      return null;
    });

    if (token?.data) {
      console.log('✅ 푸시 토큰:', token.data);
      await sendTokenToEC2(token.data);
    }

    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// ===== 알림 수신 리스너 =====
export function setupNotificationListener(callback: (notification: Notifications.Notification) => void) {
  try {
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification in foreground:', notification);
      callback(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      callback(response.notification);
    });

    return {
      remove: () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      }
    };
  } catch (error) {
    console.error('Error in setupNotificationListener:', error);
    return {
      remove: () => {}
    };
  }
}

// ===== 알림 데이터 핸들링 =====
export async function handleNotificationData(data: any) {
  try {
    if (!data) throw new Error('No notification data received');

    const requiredFields = ['id', 'latitude', 'longitude', 'status'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return {
      id: data.id,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      address: data.address || 'Unknown Location',
      status: data.status,
      photo: data.photo,
      updatedAt: new Date().toISOString(),
      statusHistory: {
        yellow: data.status === 'yellow' ? 1 : 0,
        red: data.status === 'red' ? 1 : 0,
      }
    };
  } catch (error) {
    console.error('Error handling notification data:', error);
    throw error;
  }
}
