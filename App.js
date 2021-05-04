// import React, {useEffect, useState} from 'react';
// import {
//   SafeAreaView,
//   StyleSheet,
//   ScrollView,
//   View,
//   Text,
//   StatusBar,
//   Dimensions,
//   TouchableOpacity,
// } from 'react-native';

// import {
//   RTCPeerConnection,
//   RTCIceCandidate,
//   RTCSessionDescription,
//   RTCView,
//   MediaStream,
//   MediaStreamTrack,
//   mediaDevices,
//   registerGlobals,
// } from 'react-native-webrtc';
// import io from 'socket.io-client';

// const dimensions = Dimensions.get('window');

// const App = () => {
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [peerConn, setPeerConn] = useState(null);
//   const [sdp, setSdp] = useState('');
//   const [socket, setSocket] = useState(null);
//   const [candidates, setCandidates] = useState([]);

//   useEffect(() => {
//     setSocket(
//       io('http://192.168.1.15:8080/webrtcPeer', {
//         path: '/io/webrtc',
//         query: {
//           room: 'test',
//         },
//       }),
//     );

//     const pc_config = {
//       iceServers: [
//         {
//           urls: 'stun:stun.l.google.com:19302',
//         },
//       ],
//     };
//     setPeerConn(new RTCPeerConnection(pc_config));
//   }, []);

//   useEffect(() => {
//     console.log('Use Effect Called');
//     const constraint = {video: true};
//     if (peerConn) {
//       peerConn.onicecandidate = e => {
//         if (e.candidate) {
//           console.log('onicecandidate Candidate ', e.candidate);
//           sendToServer('candidate', e.candidate);
//         }
//       };

//       peerConn.oniceconnectionstatechange = e => {
//         console.log('Ice connection changed', e);
//       };

//       peerConn.onaddstream = e => {
//         setRemoteStream(e.stream);
//       };

//       let isFront = true;
//       mediaDevices.enumerateDevices().then(sourceInfos => {
//         console.log(sourceInfos);
//         let videoSourceId;
//         for (let i = 0; i < sourceInfos.length; i++) {
//           const sourceInfo = sourceInfos[i];
//           if (
//             sourceInfo.kind == 'videoinput' &&
//             sourceInfo.facing == (isFront ? 'front' : 'environment')
//           ) {
//             videoSourceId = sourceInfo.deviceId;
//           }
//         }
//         mediaDevices
//           .getUserMedia({
//             audio: true,
//             video: {
//               mandatory: {
//                 minWidth: 500, // Provide your own width, height and frame rate here
//                 minHeight: 300,
//                 minFrameRate: 30,
//               },
//               facingMode: isFront ? 'user' : 'environment',
//               optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
//             },
//           })
//           .then(stream => {
//             setLocalStream(stream);
//             if (peerConn) peerConn.addStream(stream);
//           })
//           .catch(error => {
//             console.log('Error while getting camera ', error);
//           });
//       });
//     }
//   }, [peerConn]);

//   useEffect(() => {
//     if (socket) {
//       socket.on('connection-success', success => {
//         console.log(success);
//       });
//       socket.on('offerOrAnswer', sdp => {
//         setSdp(JSON.stringify(sdp));
//         peerConn.setRemoteDescription(new RTCSessionDescription(sdp));
//       });
//       socket.on('candidate', candidate => {
//         console.log('on candidate ', candidate);
//         peerConn.addIceCandidate(new RTCIceCandidate(candidate));
//       });
//     }
//     return () => {
//       if (socket) socket.close();
//     };
//   }, [socket]);

//   const createOffer = () => {
//     peerConn.createOffer({offerToReceiveVideo: 1}).then(
//       sdp => {
//         peerConn.setLocalDescription(sdp);
//         sendToServer('offerOrAnswer', sdp);
//       },
//       e => {
//         console.log('Error create offer', e);
//       },
//     );
//   };

//   const createAnswer = () => {
//     peerConn.createAnswer({offerToReceiveVideo: 1}).then(
//       sdp => {
//         peerConn.setLocalDescription(sdp);
//         sendToServer('offerOrAnswer', sdp);
//       },
//       e => {
//         console.log('Error create answer', e);
//       },
//     );
//   };

//   const sendToServer = (type, payload) => {
//     socket.emit(type, {
//       socketId: socket.id,
//       payload,
//     });
//   };

//   const remoteVideo = () => {
//     return remoteStream ? (
//       <RTCView
//         key={2}
//         mirror={true}
//         objectFit="contain"
//         style={styles.rtcRemoteView}
//         streamURL={remoteStream && remoteStream.toURL()}
//       />
//     ) : (
//       <View>
//         <Text style={styles.loadingText}>Waiting for Peer Connection...</Text>
//       </View>
//     );
//   };

//   return (
//     <>
//       <StatusBar barStyle="dark-content" />
//       <SafeAreaView style={styles.mainContainer}>
//         <View style={styles.allBtnContainer}>
//           <View style={styles.btnContainer}>
//             <TouchableOpacity onPress={createOffer}>
//               <Text style={styles.btnText}>Call</Text>
//             </TouchableOpacity>
//           </View>
//           <View style={styles.btnContainer}>
//             <TouchableOpacity onPress={createAnswer}>
//               <Text style={styles.btnText}>Answer</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={styles.videosContainer}>
//           <ScrollView style={styles.scrollView}>
//             <View style={styles.remoteVideoContainer}>{remoteVideo()}</View>
//           </ScrollView>
//           <View style={styles.localVideoContainer}>
//             <TouchableOpacity
//               onPress={() => localStream._tracks[1]._switchCamera()}>
//               <RTCView
//                 key={1}
//                 zOrder={0}
//                 objectFit="cover"
//                 style={styles.rtcLocalView}
//                 streamURL={localStream && localStream.toURL()}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </SafeAreaView>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   mainContainer: {
//     flex: 1,
//   },
//   allBtnContainer: {flexDirection: 'row'},
//   btnContainer: {
//     paddingVertical: 8,
//     margin: 4,
//     backgroundColor: 'green',
//     borderRadius: 5,
//     flex: 1,
//   },
//   btnText: {color: 'white', fontSize: 18, textAlign: 'center'},
//   videosContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   localVideoContainer: {
//     position: 'absolute',
//     backgroundColor: 'black',
//     height: 250,
//     width: 150,
//     bottom: 10,
//     right: 10,
//     elevation: 10,
//     zIndex: 1000,
//   },
//   rtcLocalView: {
//     width: 150,
//     height: 250,
//     backgroundColor: 'black',
//   },
//   scrollView: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: 'teal',
//   },
//   remoteVideoContainer: {
//     flex: 1,
//     width: '100%',
//     backgroundColor: 'black',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: 'white',
//     textAlign: 'center',
//     fontSize: 22,
//     padding: 16,
//   },
//   rtcRemoteView: {
//     width: dimensions.width - 30,
//     height: dimensions.height,
//     backgroundColor: 'black',
//   },
// });

// export default App;

import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, Button, StyleSheet, TextInput} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  offerUser,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from 'react-native-webrtc';

import io from 'socket.io-client';
import useVideoCall from './useVideoCall';

const PC_CONFIG = {iceServers: [{urls: ['stun:stun.l.google.com:19302']}]};
const pc = new RTCPeerConnection(PC_CONFIG);

const socket = io('http://192.168.1.15:8080/webrtcPeer', {
  path: '/io/webrtc',
  query: {
    room: 'test',
  },
});

function Videocall({userName}) {
  const {
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
  } = useVideoCall({userName});

  const [friendName, setFriendName] = useState('');

  return (
    <View style={styles.body}>
      {offerUserName && <Text>{offerUserName}</Text>}
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
      <View style={{flex: 1}}>
        <TextInput
          style={styles.inputStyle}
          value={friendName}
          onChangeText={setFriendName}
          placeholder="Enter friend name"
          placeholderTextColor="#ffffff"
        />
        <Button
          title="Start Call "
          disabled={!friendName}
          onPress={() => onStart(friendName)}
        />
        <Button title="Stop Call " onPress={onHangup} />
        <Button title="Answer " onPress={onAnswer} />
        <Button title="Switch camera " onPress={onSwitchCamera} />
      </View>
    </View>
  );
}

function App() {
  const [isSubmit, setSubmit] = useState(false);
  const [userName, setUserName] = useState('');

  return (
    <View style={{flex: 1, paddingHorizontal: 16}}>
      {isSubmit ? (
        <Videocall userName={userName} />
      ) : (
        <>
          <TextInput
            style={styles.inputStyle}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter you name"
            placeholderTextColor="#ffffff"
          />
          <Button title="Enter" onPress={() => setSubmit(true)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.white,
    // justifyContent: 'flex-end',
    flex: 1,
    // ...StyleSheet.absoluteFill,
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
  localStream: {
    flex: 1,
    backgroundColor: 'pink',
    // position: 'absolute',
    // top: 0,
    // right: 0,
    // width: 150,
    // height: 150,
  },
  footer: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
});

export default App;

// --------------

// import React, {Component} from 'react';
// import {
//   Platform,
//   StyleSheet,
//   Text,
//   View,
//   Button,
//   Dimensions,
// } from 'react-native';
// import {
//   RTCPeerConnection,
//   RTCIceCandidate,
//   RTCSessionDescription,
//   RTCView,
//   MediaStream,
//   MediaStreamTrack,
//   mediaDevices,
// } from 'react-native-webrtc';
// import io from 'socket.io-client';

// const dimensions = Dimensions.get('window');

// export default class App extends Component {
//   constructor(props) {
//     super(props);
//     this.handleConnect = this.handleConnect.bind(this);
//     this.setupWebRTC = this.setupWebRTC.bind(this);
//     this.onConnectionStateChange = this.onConnectionStateChange.bind(this);
//     this.onAddStream = this.onAddStream.bind(this);
//     this.onIceCandidate = this.onIceCandidate.bind(this);
//     this.handleAnswer = this.handleAnswer.bind(this);
//     this.onReceiveOffer = this.onReceiveOffer.bind(this);
//     this.onReceiveAnswer = this.onReceiveAnswer.bind(this);
//     this.state = {
//       localStreamURL: null,
//       remoteStreamURL: null,
//       iceConnectionState: '',
//       iceCandidates: [],
//       isAnswerReceived: false,
//       isOfferReceived: false,
//       offer: {},
//       answer: {},
//       localVideo: {},
//       remoteVideo: {},
//       localVideoStream: {},
//       desc: '',
//     };
//   }

//   async setupWebRTC() {
//     const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
//     const pc = new RTCPeerConnection(configuration);
//     pc.onconnectionstatechange = this.onConnectionStateChange;
//     pc.onaddstream = this.onAddStream;
//     pc.onicecandidate = this.onIceCandidate;

//     console.log('localStream:', this.state.localVideoStream);
//     pc.addStream(this.state.localVideoStream);
//     this.pc = pc;
//   }

//   async handleConnect(e) {
//     await this.setupWebRTC();
//     const {pc} = this;

//     try {
//       // Create Offer
//       pc.createOffer({
//         offerToReceiveVideo: true,
//         offerToReceiveAudio: true,
//       }).then(desc => {
//         pc.setLocalDescription(desc).then(() => {
//           console.log('Sdp', desc);
//           this.setState({desc});
//         });
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   onConnectionStateChange(e) {
//     console.log('onConnectionStateChange', e);
//     this.setState({
//       iceConnectionState: e.target.iceConnectionState,
//     });
//   }

//   onAddStream(e) {
//     console.log('onAddStream', e.stream.toURL());
//     console.log('onAddStream toatal', e.stream);
//     this.setState({
//       remoteVideo: e.stream,
//       remoteStreamURL: e.stream.toURL(),
//     });
//     this.remoteStream = e.stream;
//   }

//   onIceCandidate(e) {
//     const {candidate} = e;
//     if (candidate) {
//       const {iceCandidates} = this.state;
//       if (Array.isArray(iceCandidates)) {
//         this.setState({
//           iceCandidates: [...iceCandidates, candidate],
//         });
//       } else {
//         this.setState({
//           iceCandidates: [candidate],
//         });
//       }
//     } else {
//       if (this.state.iceCandidates.length > 1) {
//         //send this to signaling server
//         let offerOrAnswer = {
//           type: this.state.isOfferReceived ? 'answer' : 'offer',
//           payload: {
//             description: this.pc.localDescription,
//             iceCandidates: this.state.iceCandidates,
//           },
//         };
//         console.log('offerOrAnswer', offerOrAnswer);
//         // send offer to signaling server
//         if (offerOrAnswer.type == 'offer') {
//           console.log('offerOrAnswer', offerOrAnswer.type);
//           this.socket.emit('offer', JSON.stringify(offerOrAnswer));
//           console.log('emit called');
//         } else {
//           this.socket.emit('answer', JSON.stringify(offerOrAnswer));
//         }
//       } else {
//         console.error('No candidates found');
//       }
//     }
//   }

//   onReceiveOffer(offer) {
//     this.setState(
//       {
//         offer: JSON.parse(offer),
//         isOfferReceived: true,
//       },
//       () => {
//         console.log('offer received', offer);
//       },
//     );
//   }

//   handleAnswer() {
//     const {payload} = this.state.offer;
//     this.setupWebRTC();

//     const {pc} = this;
//     var offerSdp = {
//       sdp: payload && payload.description ? payload.description.sdp : '',
//       type: 'offer',
//     };
//     console.log('setupWebRTC g barpunda?', offerSdp);

//     pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

//     if (payload && Array.isArray(payload.candidates)) {
//       payload.candidates.forEach(c =>
//         peer.addIceCandidate(new RTCIceCandidate(c)),
//       );
//     }
//     try {
//       // Create Offer
//       pc.createAnswer().then(answer => {
//         pc.setLocalDescription(answer).then(() => {
//           // Send pc.localDescription to peer
//           console.log('answer generated', answer);
//           this.setState({answer}, () => {
//             console.log('setstateanswer');
//           });
//         });
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   onReceiveAnswer(answer) {
//     const {payload} = JSON.parse(answer);
//     console.log(' onReceiveAnswer payload', payload);
//     var answerSdp = {sdp: payload.description.sdp, type: 'answer'};
//     //set answersdp to current peer RemoteDescription.
//     this.pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
//     payload.iceCandidates.forEach(c =>
//       this.pc.addIceCandidate(new RTCIceCandidate(c)),
//     );
//     this.setState(
//       {
//         answer: JSON.parse(answer),
//         isAnswerReceived: true,
//       },
//       () => {
//         console.log('answerReceived');
//       },
//     );
//   }

//   componentDidMount() {
//     const self = this;
//     var socket = io('http://192.168.1.15:3000');
//     this.socket = socket;

//     socket.on('offer', function (offer) {
//       console.log('Offeronsocket', offer);
//       self.onReceiveOffer(offer);
//     });

//     socket.on('answer', function (answer) {
//       console.log('answeronsocket called', answer);
//       self.onReceiveAnswer(answer);
//     });

//     let isFront = true;
//     mediaDevices.enumerateDevices().then(sourceInfos => {
//       console.log(sourceInfos);
//       let videoSourceId;
//       for (let i = 0; i < sourceInfos.length; i++) {
//         const sourceInfo = sourceInfos[i];
//         if (sourceInfo.facing == (isFront ? 'front' : 'back')) {
//           videoSourceId = sourceInfo.deviceId;
//           console.log(sourceInfo);
//         }
//       }
//       mediaDevices
//         .getUserMedia({
//           audio: true,
//           video: {
//             mandatory: {
//               minWidth: 500, // Provide your own width, height and frame rate here
//               minHeight: 300,
//               minFrameRate: 30,
//             },
//             facingMode: isFront ? 'user' : 'environment',
//             optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
//           },
//         })
//         .then(stream => {
//           // Got stream!
//           console.log('getUserMedia.stream', stream);
//           let {localVideo} = self.state;
//           localVideo.srcObject = new MediaStream();
//           localVideo.srcObject.addTrack(stream.getTracks()[0], stream);
//           localVideo.srcObject.addTrack(stream.getTracks()[1], stream);
//           console.log('localVideo.srcObject1', localVideo.srcObject);
//           this.setState({
//             localVideoStream: stream,
//             localStreamURL: stream.toURL(),
//           });
//         })
//         .catch(error => {
//           // Log error
//           console.log(error);
//         });
//     });
//   }

//   render() {
//     console.log('state.offer', this.state.offer);
//     console.log('state.answer', this.state.remoteStreamURL);
//     return (
//       <View style={styles.container}>
//         <RTCView streamURL={this.state.localStreamURL} style={styles.rtcView} />
//         <RTCView
//           streamURL={this.state.remoteStreamURL}
//           style={styles.rtcView}
//         />
//         <Button title="connect" onPress={this.handleConnect}></Button>
//         <Button title="answer" onPress={this.handleAnswer}></Button>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   welcome: {
//     fontSize: 20,
//     textAlign: 'center',
//     margin: 10,
//   },
//   instructions: {
//     textAlign: 'center',
//     color: '#333333',
//     marginBottom: 5,
//   },
//   rtcView: {
//     flex: 1,
//     width: dimensions.width / 2,
//     backgroundColor: '#f00',
//     position: 'relative',
//   },
// });

// import React, {useState} from 'react';
// import {View} from 'react-native';
// import WEBRtc from './WEBRtc';
// import {RTCRoom} from './RTCRoom';

// const App = () => {
//   const [roomID, setRoom] = useState('hello');

//   const getRoom = room => {
//     setRoom(room);
//   };

//   return (
//     <View>
//       {!roomID ? <RTCRoom getRoom={getRoom} /> : null}
//       {roomID ? <WEBRtc roomNumber={roomID} /> : null}
//     </View>
//   );
// };

// export default App;
