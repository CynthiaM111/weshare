# React Native Firebase Setup Guide

## 1. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/storage
```

## 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firebase Storage in the project

## 3. Android Configuration

### Add google-services.json
1. In Firebase Console, go to Project Settings
2. Add Android app with your package name (e.g., `com.weshare.app`)
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

### Update android/build.gradle
Add to the bottom of the file:
```gradle
buildscript {
    dependencies {
        // ... other dependencies
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### Update android/app/build.gradle
Add at the top:
```gradle
apply plugin: 'com.google.gms.google-services'
```

## 4. iOS Configuration

### Add GoogleService-Info.plist
1. In Firebase Console, add iOS app with your bundle ID
2. Download `GoogleService-Info.plist`
3. Add it to your iOS project in Xcode

### Update iOS Podfile
Add to your Podfile:
```ruby
pod 'Firebase/Storage'
```

Then run:
```bash
cd ios && pod install
```

## 5. Environment Variables (Optional)

You can remove the Firebase environment variables from your `.env` file since React Native Firebase uses the native configuration files.

## 6. Usage

The photo upload functionality is now ready to use! The implementation uses:
- `@react-native-firebase/storage` for file uploads
- `expo-image-picker` for camera/gallery access
- Native Firebase configuration for better performance

## 7. Security Rules

Make sure your Firebase Storage rules allow authenticated users to upload to their own folder:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Testing

1. Build and run your app
2. Go to Profile screen
3. Tap on avatar to test photo upload
4. Check Firebase Console Storage to see uploaded files 