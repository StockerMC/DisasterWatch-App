# DisasterWatch

Mobile app for DisasterWatch, an Arduino-based early-warning device for earthquakes, wildfires, and droughts. Built for the [IEEE SSCS Arduino Contest 2024](https://www.arduino.cc/education/the-ieee-sscs-arduino-contest-2024-innovating-for-a-greener-future/), where it took first place in the High School Team category.

## How it works

The [sensor node](https://github.com/ilikecandy/DisasterWatchArduino) monitors for earthquake, wildfire, and drought conditions and reports readings to the [DisasterWatch API](https://github.com/StockerMC/DisasterWatch-API), which relays them to this app through Firebase Cloud Messaging. The app raises watch, danger, and clear alerts as high-priority notifications, showing the sensor data and your distance from the sensor.

## Tech

Expo / React Native (TypeScript), Firebase Cloud Messaging, Notifee, react-native-geolocation-service.

## Running it

```bash
npm install
npx expo run:android
```

Requires a Firebase project (`google-services.json`).
