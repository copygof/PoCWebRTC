import React, {useEffect, useState, useCallback} from 'react';
import {View, Text} from 'react-native';
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
import io from 'socket.io-client';

const PC_CONFIG = {iceServers: [{urls: ['stun:stun.l.google.com:19302']}]};

function useVideoCall() {
  const isFront = true;
  const [peerConnect, setPeerConnect] = useState(null);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Init Web socket
  useEffect(
    () =>
      setSocket(
        io('http://192.168.1.15:8080/webrtcPeer', {
          path: '/io/webrtc',
          query: {
            room: 'test',
          },
        }),
      ),
    [],
  );

  // Init WebRTC PeerConnect instant.
  useEffect(() => setPeerConnect(new RTCPeerConnection(PC_CONFIG)), []);

  useEffect(() => {
    if (peerConnect) {
      peerConnect.onicecandidate = e => {
        if (e.candidate) {
          console.log('onicecandidate Candidate ', e.candidate);
          sendToServer('candidate', e.candidate);
        }
      };

      peerConnect.oniceconnectionstatechange = e => {
        console.log('Ice connection changed', e);
      };

      peerConnect.onaddstream = e => {
        setRemoteStream(e.stream);
      };
    }
  }, [peerConnect, sendToServer]);

  useEffect(() => {
    if (socket) {
      socket.on('connection-success', success => {
        console.log('connection-success ', success);
        socket.emit('register-user', {
          userId: success.userId,
          userName: 'Copygof',
        });
      });
      socket.on('offerOrAnswer', sdp => {
        peerConnect.setRemoteDescription(new RTCSessionDescription(sdp));
      });
      socket.on('candidate', candidate => {
        peerConnect.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  }, [peerConnect, socket]);

  const sendToServer = useCallback(
    (type, payload) => {
      socket.emit(type, {
        socketId: socket.id,
        payload,
      });
    },
    [socket],
  );

  /**
   * Handle UI Event
   */
  const onStart = useCallback(async () => {
    if (peerConnect) {
      let videoSourceId;
      const sourceInfos = await mediaDevices.enumerateDevices();

      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];
        if (
          sourceInfo.kind === 'videoinput' &&
          sourceInfo.facing === (isFront ? 'front' : 'environment')
        ) {
          videoSourceId = sourceInfo.deviceId;
        }
      }

      const mdConfig = {
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
          facingMode: isFront ? 'user' : 'environment',
          deviceId: videoSourceId,
        },
      };
      const stream = await mediaDevices.getUserMedia(mdConfig);
      setLocalStream(stream);
      peerConnect.addStream(stream);
      peerConnect.createOffer({offerToReceiveVideo: 1}).then(
        sdp => {
          peerConnect.setLocalDescription(sdp);
          sendToServer('offerOrAnswer', sdp);
        },
        e => {
          console.log('Error create offer', e);
        },
      );
    }
  }, [isFront, peerConnect, sendToServer]);

  const onAnswer = useCallback(() => {
    if (peerConnect) {
      peerConnect.createAnswer({offerToReceiveVideo: 1}).then(
        sdp => {
          peerConnect.setLocalDescription(sdp);
          sendToServer('offerOrAnswer', sdp);
        },
        e => {
          console.log('Error create answer', e);
        },
      );
    }
  }, [peerConnect, sendToServer]);

  const onHangup = useCallback(() => {
    if (localStream) {
      localStream.release();
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.release();
      setRemoteStream(null);
    }
  }, [localStream, remoteStream]);

  const onSwitchCamera = useCallback(() => {
    localStream.getVideoTracks().forEach(track => {
      track._switchCamera();
    });
  }, [localStream]);

  const onMuteAudio = useCallback(() => {}, []);
  const onHideCamera = useCallback(() => {}, []);

  return {
    peerConnect,
    socket,
    localStream,
    remoteStream,
    // Handle UI Event
    onStart,
    onAnswer,
    onHangup,
    onSwitchCamera,
    onMuteAudio,
    onHideCamera,
  };
}

export default useVideoCall;
