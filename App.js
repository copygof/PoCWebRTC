import React, {Component} from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import 'react-native-gesture-handler';
import ListUser from './ListUser';
import CallScreen from './CallScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const PC_CONFIG = {iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    }
  ]};

const Stack = createStackNavigator();

export default class App extends Component {
  render() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="ListUser">
          <Stack.Screen name="ListUser" component={ListUser} />
          <Stack.Screen name="CallScreen" component={CallScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}
