import React, {useEffect, useState, useCallback, Component} from 'react';
import {View, Text, Button, StyleSheet, TextInput} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';

const PC_CONFIG = {iceServers: [{urls: ['stun:stun.l.google.com:19302']}]};

export default class App extends Component {
  constructor(props) {
    super(props);

    this.pc = new RTCPeerConnection(PC_CONFIG);
    this.socket = io('http://192.168.1.15:8080/webrtcPeer', {
      path: '/io/webrtc',
      query: {
        room: 'test',
      },
    });

    this.state = {
      localStream: null,
      remoteStream: null,
    };

    // -- For media config.
    this.isFront = true;
    this.videoSourceId = '';
    this.mediaConfig = {
      audio: true,
      video: {
        width: 640,
        height: 480,
        frameRate: 30,
        facingMode: this.isFront ? 'user' : 'environment',
        deviceId: this.videoSourceId,
      },
    };

    // register listener peerConnect event
    this.pc.onicecandidate = this.handleOnIceCandidate;
  }

  componentDidMount() {
    this.start();
  }

  handleOnIceCandidate = ({candidate}) => {
    console.log('OnIceCandidate event => ', candidate);
    this.socket.emit('candidate', {candidate});
  };

  start = async () => {
    try {
      const sourceInfos = await mediaDevices.enumerateDevices();
      this.videoSourceId = this.findMediaDevice(sourceInfos);
      const localStream = await mediaDevices.getUserMedia(this.mediaConfig);

      this.setState({localStream});
      this.pc.addStream(localStream);
    } catch (err) {
      alert(JSON.stringify(err));
    }
  };

  findMediaDevice = sourceInfos => {
    return sourceInfos.reduce(
      (prevent, current) =>
        current.kind === 'videoinput' &&
        current.facing === (this.isFront ? 'front' : 'environment')
          ? current.deviceId
          : prevent,
      '',
    );
  };

  render() {
    const {localStream, remoteStream} = this.state;
    return (
      <View style={styles.body}>
        {localStream ? (
          <RTCView
            style={styles.localStream}
            objectFit="cover"
            streamURL={localStream.toURL()}
          />
        ) : (
          <View style={styles.localStream} />
        )}
        {remoteStream ? (
          <RTCView
            style={styles.remoteStream}
            objectFit="cover"
            streamURL={remoteStream.toURL()}
          />
        ) : (
          <View style={styles.remoteStream} />
        )}
        <View>
          <View>
            <Button title="Start Call" />
          </View>

          <Button title="Start Call" />
          <Button title="Hangup" />
          <Button title="Switch camera" />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  localStream: {
    flex: 1,
    backgroundColor: 'pink',
  },
  remoteStream: {
    flex: 1,
    backgroundColor: '#000',
  },
  inputStyle: {
    backgroundColor: 'gray',
    height: 44,
    color: '#ffffff',
    marginVertical: 16,
  },
  footer: {},
});

// ตอนนี้ ที่มันรันได้คือ
// Device1  callto  Device2  ได้ แต่ตัว socket หลังบ้านมัน rendom เลยได้บ้างไม่ได้บ้าง

// ตอนนี้ผมเลย back to basic ใหม่
// เอาตั้งแต่ init มันเอา socket id / user id ไปเก็บไว้ที่หลังบ้านยังไง

// แล้ว Device1 โทรไปหา Device2 ด้วย id มันทำยังไงบาง จะได้อธิบายได้ถูกน่ะ
