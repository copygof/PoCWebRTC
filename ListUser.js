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

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from 'react-native-webrtc';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';


export default class ListUser extends Component {



  Login=(id,name,room)=>{
    this.props.navigation.navigate('CallScreen', {
      id: id,
      name:name,
      room:room,
    });
  }


  render() {
    return (
      <View style={styles.body}>
        <TouchableOpacity
          key={"101"}
          style={styles.accountItem}
          onPress={ ()=> this.Login("101","User","101101")}>
          <Text style={styles.accountItemText}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          key={"001"}
          style={styles.accountItem}
          onPress={ ()=> this.Login("001","Doctor","101101")}>
          <Text style={styles.accountItemText}>Doctor</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  bodyVideo: {
    backgroundColor: Colors.white,
    flex: 1,
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  textHeader: {
    backgroundColor: '#3f50b5',
    height: 64,
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  accountItem: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ff7961',
    borderRadius: 50,
    marginTop: 16,
    marginHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountItemText: {
    fontSize: 18,
    color: '#ff7961',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  localStream: {
    // position: 'absolute',
    // bottom: 60,
    // right: 16,
    // width: 130,
    // height: 150,
    flex: 1,
    backgroundColor: '#000',
  },
  remoteStream: {
    flex: 1,
    backgroundColor: '#000',
    // ...StyleSheet.absoluteFill,
  },
  inputStyle: {
    backgroundColor: 'gray',
    height: 44,
    color: '#ffffff',
    marginVertical: 16,
  },
  footer: {
    backgroundColor: '#fff',
  },
  endCall: {
    flex: 1,
    backgroundColor: '#d32f2f',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchCamera: {
    flex: 1,
    backgroundColor: '#55c63f',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textButton: {
    fontSize: 18,
    color: '#ffffff',
  },
});
