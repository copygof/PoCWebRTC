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

class PeerConnection {
  constructor() {
    this.pc = null;
    this.socket = null;
  }

  initPeerConnect = async () => {
    this.pc = new RTCPeerConnection(PC_CONFIG);
    // Listener all peer connect event
    this.listenerPeerConnect();
    // Listener emit from server
    this.listenerSocket();
  };

  connectWebSocket = async (room = 'test') => {
    this.socket = await io('http://192.168.1.15:8080/webrtcPeer', {
      path: '/io/webrtc',
      query: {room},
    });
  };

  listenerPeerConnect = () => {
    this.pc.onicecandidate = e => {
      if (e.candidate) {
        console.log('onicecandidate Candidate ', e.candidate);
        this.sendToServer('candidate', e.candidate);
      }
    };
  };

  listenerSocket = () => {};

  sendToServer = (type, payload) => {
    this.socket.emit(type, {
      socketId: this.socket.id,
      payload,
    });
  };

  getPC = () => this.pc;
  getSocket = () => this.socket;
}

export default new PeerConnection();
