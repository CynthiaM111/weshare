const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.cynthiam.weshare.dev';
  }

  if (IS_PREVIEW) {
    return 'com.cynthiam.weshare.preview';
  }

  return 'com.cynthiam.weshare';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'WeShare (Dev)';
  }

  if (IS_PREVIEW) {
    return 'WeShare (Preview)';
  }

  return 'WeShare';
};

export default ({ config
}) => ({
  ...config,
  name: getAppName(),
  slug: 'weshare',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    ...config.android,
    package: getUniqueIdentifier(),
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera',
        microphonePermission: 'Allow $(PRODUCT_NAME) to access your microphone',
        recordAudioAndroid: true,
      },
    ],

    '@react-native-community/datetimepicker',
  ],

  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },

  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '30ca9721-94ad-45af-9406-27cca5843570',
    },
  },

  owner: 'cynthia_m',
});
