import { AppRegistry, PermissionsAndroid } from 'react-native';

import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import {Button, Text, View} from 'react-native';
import notifee, { AndroidImportance, AndroidStyle, AndroidVisibility, Event, Notification } from '@notifee/react-native';
import usePushNotification from '@/hooks/usePushNotification';

import * as Clipboard from 'expo-clipboard';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    console.log('granted', granted);
    if (granted === 'granted') {
      console.log('You can use Geolocation');
      return true;
    } else {
      console.log('You cannot use Geolocation');
      return false;
    }
  } catch (err) {
    return false;
  }
};

function radians(degrees: number) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Used to find the distance between two coordintes, to determine the user's proximity to the alert
function haversine_(lat1: number, lon1: number, lat2: number, lon2: number) {
    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)
    
    const dlat = lat2 - lat1
    const dlon = lon2 - lon1
    
    const a = Math.sin(dlat / 2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2)**2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    const r = 6371.0
    
    const distance = r * c
    return distance;
}

const haversine = (lat2: number, lon2: number) => (
  haversine_(43.8879099, -79.2932435, lat2, lon2)
)


function CustomComponent() {
  return (
    <View>
      <Text>A custom component</Text>
    </View>
  );
}

export default function App() {
  const [location, setLocation] = useState<GeoPosition | null>(null);

  useEffect(() => {
    AppRegistry.registerComponent('custom-component', () => CustomComponent);

    notifee.createChannel({
      id: 'messages',
      name: 'Firing alarms & timers',
      lights: false,
      vibration: true,
      'bypassDnd': true,
      importance: AndroidImportance.HIGH,
      'visibility': AndroidVisibility.PUBLIC,
      'sound': 'sound'
    });

    notifee.onBackgroundEvent(async (event: Event) => {
      
    })
    
  });
  async function onMessageReceived(message: Notification) {
    console.log('Message', message)
    if (!message || !message.data || !message.data.type) {
      return;
    }
    if (message.data.type === 'partial_notification') {
      const getLocation = async () => {
        const result = await requestLocationPermission();
        console.log('res is:', result);
        if (result) {
          Geolocation.getCurrentPosition(
            position => {
              console.log(position);
              console.log(haversine(position?.coords.latitude, position?.coords.latitude))
              setLocation(position);
            },
            error => {
              // See error code charts below.
              console.log(error.code, error.message);
              setLocation(null);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
          );
        }
        console.log(location);
      };
    
      await getLocation();
      console.log('location', location);
      if (location) console.log(haversine(location?.coords.latitude, location?.coords.latitude))
      // @ts-expect-error
      const notifeeData = JSON.parse(message.data.notifee || "");
      console.log(notifeeData)
      const data = notifeeData.body.data;
      // Assume data is in this format:
      // {
      //     "token": "123456",
      //     "data": {
      //         "type": "watch" | "danger" | "clear"
      //         "name": "earthquake" | "fire" | "drought"
      //         "temperature": 30,
      //         "humidity": 40,
      //         "water": 300,
      //         "light": 1000,
      //         "acceleration": 500
      //     }
      // }

      let title = '';
      let description = '';
      if (data.type === 'watch') {
        title = `${(data.name === 'fire' ? 'WILDFIRE RISK' : data.name).toUpperCase()} WATCH: `
        if (data.name === 'earthquake') {
          title += 'Stay Prepared for Potential Tremors'
          description = 'Be alert and ready to take cover. Keep emergency supplies within reach and stay tuned for further updates';
        } else if (data.name === 'fire') {
          title += 'High Wildfire Risk in Your Area'
          description = 'Avoid outdoor fires and be ready to evacuate. Keep fire safety measures in place.';
        } else if (data.name === 'drought') {
          title += 'Extreme Dry Conditions Detected'
          description = 'Conserve water and avoid outdoor burning. Be prepared for water restrictions and stay updated on local advisories.';
        }
      } else if (data.type === 'danger') {
        title = `${(data.name).toUpperCase()} DANGER: `
        if (data.name === 'earthquake') {
          title += 'Stay Prepared for Potential Tremors'
        } else if (data.name === 'fire') {
          title += 'Evacuate Nearby Forest Area Immediately!'
          description = 'A wildfire has been detected close to your location. Evacuate your home immediately and contact emergency services. Stay updated on evacuation routes and follow official guidance.';
        }
      } else {
        title = `CLEAR: `
        
        if (data.clear_type === 'watch') {
          title = `${(data.name === 'fire' ? 'Wildfire' : data.name).toUpperCase()} Watch No Longer In Effect`;
          description = ''
        } else if (data.clear_type === 'danger') {
          title = `${toTitleCase(data.name === 'fire' ? 'Wilfire' : data.name)} Danger No Longer Present`;
          description = ''
        } else {
          title = 'No Disasters Detected At This Time';
        }
      }

      await notifee.displayNotification({
        title:
          `<p style="color: #f3a55c;"><b>${title}</span></p></b></p> &#9888;`,
        body: description,
        android: {
          'channelId': 'messages',
          'importance': AndroidImportance.HIGH,
          'visibility': AndroidVisibility.PUBLIC,
          style: { type: AndroidStyle.BIGPICTURE, picture: 'https://my-cdn.com/user/123/upload/456.png' }
        },
      });
    }
  };

  useEffect(() => {
    messaging().setBackgroundMessageHandler(async function temp (message: Notification) {
      console.log('A new message arrived! (BACKGROUND)')
      await onMessageReceived(message);
    })
    messaging().onMessage(async function temp (message: Notification) {
      console.log('A new message arrived! (FOREGROUND)')
      await onMessageReceived(message);
    })
  }, []);

  const {
    requestUserPermission,
    getFCMToken,
    onNotificationOpenedAppFromBackground,
    onNotificationOpenedAppFromQuit,
  } = usePushNotification();

  const [token, setToken] = useState('');
  useEffect(() => {
    const listenToNotifications = async () => {
      try {
        setToken(await getFCMToken());
        requestUserPermission();
        onNotificationOpenedAppFromQuit();
        onNotificationOpenedAppFromBackground();
      } catch (error) {
        console.log(error);
      }
    };

    listenToNotifications();
  }, []);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(token);
  };

    const BASE_URL = 'https://notifications-api-ten.vercel.app'
    const handleSendNotification = async () => {
      console.log('setting notification')
      await fetch(`${BASE_URL}/notifications`, {
        method: 'POST',
        body: JSON.stringify({
          token,
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
    };

  return (
    <View style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Text>{`\n\n\n\n`}</Text>
      <Button title="tap this to copy token" onPress={copyToClipboard} />
      <Button title="tap this to reset token" onPress={() => messaging().deleteToken()} />
      <Button title="tap this for notification (5s delay)" onPress={handleSendNotification} />
      <Text>{location ? haversine(location?.coords.latitude, location?.coords.latitude) : 'a'}</Text>
    </View>
  );
}
