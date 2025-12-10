import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

const PRIMARY_COLOR = '#06402B';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to Redit Fleet!</Text>
      <Text style={styles.subtext}>Expo Router is now set up with app directory.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: PRIMARY_COLOR,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});

