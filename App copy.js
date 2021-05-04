import React, {useEffect, useState} from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
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
import socket from './videoCall/socket';

const PC_CONFIG = {iceServers: [{urls: ['stun:stun.l.google.com:19302']}]};

function useStreamOwnCamera() {
  const [stream, setStream] = useState(null);
  const start = async () => {
    console.log('start');
    if (!stream) {
      let s;
      try {
        s = await mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setStream(s);
      } catch (e) {
        console.error(e);
      }
    }
  };
  const stop = () => {
    console.log('stop');
    if (stream) {
      stream.release();
      setStream(null);
    }
  };

  return {
    stream,
    start,
    stop,
  };
}

function useOfferCandidate() {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
    const pc = new RTCPeerConnection(configuration);

    let isFront = true;
    mediaDevices.enumerateDevices().then(sourceInfos => {
      console.log(sourceInfos);
      let videoSourceId;
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == 'videoinput' &&
          sourceInfo.facing == (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: 640,
            height: 480,
            frameRate: 30,
            facingMode: isFront ? 'user' : 'environment',
            deviceId: videoSourceId,
          },
        })
        .then(stream => {
          // Got stream!
        })
        .catch(error => {
          // Log error
        });
    });

    pc.createOffer().then(desc => {
      pc.setLocalDescription(desc).then(() => {
        // Send pc.localDescription to peer
      });
    });

    pc.onicecandidate = function (event) {
      // send event.candidate to peer
    };
  }, []);
}

function FrontCamera({stream}) {
  if (!stream) {
    return null;
  }
  return <RTCView streamURL={stream.toURL()} style={styles.streamFront} />;
}

function CandidateCamera({stream}) {
  if (!stream) {
    return null;
  }
  return <RTCView streamURL={stream.toURL()} style={styles.candidateCamera} />;
}

const App = () => {
  const {stream, start, stop} = useStreamOwnCamera();
  const userId = '001';
  const userName = 'test-01';

  const [streams, setStream] = useState(null)

  useEffect(() => {
    //   const pc = new RTCPeerConnection(PC_CONFIG);

    //   pc.onicecandidate = (event) => socket.emit('call', {
    //     to: this.friendID,
    //     candidate: event.candidate
    //   });

    //   pc.ontrack = (event) => this.emit('peerStream', event.streams[0]);

    //   this.mediaDevice = new MediaDevice();
    //   this.friendID = friendID;

    const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
    const pc = new RTCPeerConnection(configuration);

    let isFront = true;
    mediaDevices.enumerateDevices().then(sourceInfos => {
      console.log('sourceInfos', sourceInfos);
      let videoSourceId;

      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind == 'videoinput' &&
          sourceInfo.facing == (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: 640,
            height: 480,
            frameRate: 30,
            facingMode: isFront ? 'user' : 'environment',
            deviceId: videoSourceId,
          },
        })
        .then(stream => {
          // Got stream!
          // console.log(' Got stream! => ', stream)
          setStream(stream)
        })
        .catch(error => {
          // Log error
          console.log(' Got stream error => ', error)
        });
    });

    pc.createOffer().then(desc => {
      pc.setLocalDescription(desc).then(() => {
        // Send pc.localDescription to peer
          console.log('localDescription', desc)
       
      });
    });

    pc.onicecandidate = function (event) {
      // send event.candidate to peer
      console.log('onicecandidate',       event.candidate)


    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.body}>
        <CandidateCamera stream={null} />
        <FrontCamera stream={streams} />
        <View style={styles.footer}>
          <Button title="Start" onPress={start} />
          <Button title="Stop" onPress={stop} />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    justifyContent: 'flex-end',

    ...StyleSheet.absoluteFill,
  },
  candidateCamera: {
    flex: 1,
    backgroundColor: '#000',
  },
  streamFront: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#000',
    width: 150,
    height: 150,
  },
  footer: {
    backgroundColor: Colors.lighter,
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
});

export default App;
