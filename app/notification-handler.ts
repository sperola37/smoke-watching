import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    // Check if we're on web platform
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

    // Get the token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID, // Make sure this is set in your environment
    }).catch((err) => {
      console.error('Error getting push token:', err);
      return null;
    });

    return token;
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

export function setupNotificationListener(callback: (notification: Notifications.Notification) => void) {
  try {
    // Handle notifications that are received while the app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification in foreground:', notification);
      callback(notification);
    });

    // Handle notifications that are tapped by the user
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      callback(response.notification);
    });

    // Return a cleanup function that removes both listeners
    return {
      remove: () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      }
    };
  } catch (error) {
    console.error('Error in setupNotificationListener:', error);
    return {
      remove: () => {} // Return a no-op cleanup function
    };
  }
}

// Helper function to handle notification data
export async function handleNotificationData(data: any) {
  try {
    if (!data) {
      throw new Error('No notification data received');
    }

    // Validate required fields
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