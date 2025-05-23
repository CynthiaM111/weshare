// // app/index.js
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/(home)" />;
}

// app/(home)/index.js
// import { Text, View } from 'react-native';

// export default function Home() {
//     return (
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//             <Text>Home screen!</Text>
//         </View>
//     );
// }
