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

function useVideoCall({userName}) {
  const isFront = true;
  const [peerConnect, setPeerConnect] = useState(null);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [friendName, setFriendName] = useState('');
  const [offerUserName, setOfferUserName] = useState(null);

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

  const initVideo = useCallback(async () => {
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
  }, [isFront, peerConnect]);

  useEffect(() => {
    if (peerConnect) {
      initVideo();

      peerConnect.onicecandidate = e => {
        if (e.candidate) {
          console.log('onicecandidate Candidate ', e.candidate);

          // 2. Add self to candidate
          sendToServer('candidate', e.candidate, friendName);
        }
      };

      peerConnect.oniceconnectionstatechange = e => {
        console.log('Ice connection changed', e);
      };

      peerConnect.onaddstream = e => {
        console.log('onaddstream');
        setRemoteStream(e.stream);
      };
    }
  }, [
    peerConnect,
    sendToServer,
    friendName,
    setRemoteStream,
    isFront,
    initVideo,
  ]);

  useEffect(() => {
    if (socket) {
      socket.on('connection-success', success => {
        console.log('connection-success ', success);
        socket.emit('register-user', {
          userId: success.userId,
          userName: userName,
        });
      });
      socket.on('offerOrAnswer', sdp => {
        peerConnect.setRemoteDescription(new RTCSessionDescription(sdp));
      });
      socket.on('offer', sdp => {
        // #2 when receive offer -> set self to remote
        console.log('offer', sdp);
        setOfferUserName((sdp.offerUser && sdp.offerUser.userName) || '');
        peerConnect.setRemoteDescription(new RTCSessionDescription(sdp.sdp));
      });
      socket.on('answer', sdp => {
        // #2 when receive offer -> set self to remote
        console.log('answer');
        peerConnect.setRemoteDescription(new RTCSessionDescription(sdp));
      });
      socket.on('candidate', candidate => {
        console.log('candidate => ', candidate);
        peerConnect.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }
  }, [peerConnect, socket, userName]);

  const sendToServer = useCallback(
    (type, payload, fn) => {
      socket.emit(type, {
        socketId: socket.id,
        payload,
        friendName: fn,
      });
    },
    [socket],
  );

  /**
   * Handle UI Event
   */
  const onStart = useCallback(
    async remoteName => {
      if (peerConnect) {
        setFriendName(remoteName);
        peerConnect.createOffer().then(
          sdp => {
            // 1. Create offer
            peerConnect.setLocalDescription(sdp);
            sendToServer('offer', sdp, remoteName);
          },
          e => {
            console.log('Error create offer', e);
          },
        );
      }
    },
    [peerConnect, sendToServer],
  );

  const onAnswer = useCallback(() => {
    if (peerConnect) {
      // initVideo();
      peerConnect.createAnswer().then(
        sdp => {
          peerConnect.setLocalDescription(sdp);
          sendToServer('answer', sdp, offerUserName);
          // sendToServer('offerOrAnswer', sdp);
        },
        e => {
          console.log('Error create answer', e);
        },
      );
    }
  }, [offerUserName, peerConnect, sendToServer]);

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
    offerUserName,
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
