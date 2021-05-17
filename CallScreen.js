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

const PC_CONFIG = {iceServers: [
  {
    urls: ['stun:stun.l.google.com:19302']
  }
  ]};

export default class CallScreen extends Component {
  constructor(props) {
    super(props);

    this.pc = new RTCPeerConnection(PC_CONFIG);
    this.socket = io('http://139.59.107.13:8080/webrtcPeer', {
      path: '/io/webrtc',
    });

    this.state = {
      localStream: null,
      remoteStream: null,
      isConnecting: false,
      skipSelectRemoteAccount: false,
      accountList: [],
      localAccount: {},
      remoteAccount: {},
      ListUserConnect: "",
      room: "",
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
    this.pc.onaddstream = this.handleOnRemoteAddStream;

    // listener on register account
    this.socket.on('connected', this.handleOnConnected);
    this.socket.on('register-success', this.handleOnRegister);
    this.socket.on('offer', this.handleOnOffer);
    this.socket.on('answer', this.handleOnAnswer);
    this.socket.on('candidate', this.handleReceiveOnCandidate);
    this.socket.on('hangup', this.handleOnHangup);

  }

  // =================== Handle web socket ====================== //
  handleOnConnected = (accountList,roomName,usersOnline) => {

    const { id,name,room } = this.props.route.params;



      let account = {
        id:id,
        name:name,
        room:room,
      }

    this.register(account)
    console.log(id,name,room)

    console.log("Connected!");
    console.log("RoomList"+roomName);
    console.log(
      '=================== ListUser ======================',
    );
    console.log(usersOnline);

    if(usersOnline.length !== 0){

      usersOnline.forEach((result)=>{
        if(result.room === room){
          this.setState({ListUserConnect:result});
          console.log(result);
          this.setState({remoteAccount:result})
          this.startCall();
        }
      });
    }



    this.setState({accountList});
  };

  handleOnRegister = accountList => {
    this.setState({isConnecting: true, accountList});
  };

  handleOnOffer = async offer => {
    console.log('offer => ', offer);
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    this.setState({remoteAccount: offer.from});
    Alert.alert(
      `${offer?.from?.name}`,
      'Video calling...',
      [
        {
          text: 'Cancel',
          onPress: this.hangup,
          style: 'cancel',
        },
        {text: 'Accept', onPress: this.answer},
      ],
      {
        cancelable: false,
      },
    );
  };

  handleOnAnswer = async offer => {
    console.log('OnAnswer => ', offer);
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    // Note. This bug from RTCView, Just setState for re-render component
    this.setState({...this.state});
  };

  handleReceiveOnCandidate = candidate => {
    console.log('ReceiveOnCandidate ', candidate);
    if (candidate) {
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  handleOnHangup = accountList => {
    this.clearSession();
    this.setState({accountList: accountList || []});
  };
  // =================== End of handle web socket ====================== //

  // =================== Handle PeerConnect event ====================== //
  handleOnIceCandidate = ({candidate}) => {
    const {localAccount, remoteAccount} = this.state;
    console.log('OnIceCandidate event => ', candidate);
    this.socket.emit('candidate', {
      candidate,
      from: localAccount,
      to: remoteAccount,
    });
  };

  handleOnRemoteAddStream = e => {
    console.log('OnRemoteAddStream event => ', e.stream);
    this.setState({remoteStream: e.stream});
  };
  // =================== End of handle PeerConnect event ====================== //

  componentDidMount() {
    this.initialLocalMedia();
  }

  componentWillUnmount() {
    const {localAccount} = this.state;
    this.socket.emit('disconnection', {
      id: localAccount.id,
    });
  }

  handlePressAccountItem = (id,name,room) => () => {
    const {isConnecting} = this.state;
    let account = {
        id:id,
        name:name,
        room:room,
    }

    if (!isConnecting) {
      this.setState({localAccount:account})
      return this.register(account);
    }

    this.setState({remoteAccount: {...account}}, this.startCall);
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

  getUserMedia = async () => {
    const sourceInfos = await mediaDevices.enumerateDevices();
    this.videoSourceId = this.findMediaDevice(sourceInfos);
    const localStream = await mediaDevices.getUserMedia(this.mediaConfig);
    return localStream;
  };

  initialLocalMedia = async () => {
    const localStream = await this.getUserMedia();
    this.setState({localStream});
    this.pc.addStream(localStream);
  };

  register = account => {
    this.setState({localAccount:account});
    this.forceUpdate();
    this.socket.emit('register', {
      id: account.id,
      name: account.name,
      room:account.room,
      socketId: this.socket.id,
    });
  };

  createOffer = async () => {
    const sdp = await this.pc.createOffer();
    this.pc.setLocalDescription(sdp);
    return sdp;
  };

  createAnswer = async () => {
    const sdp = await this.pc.createAnswer();
    this.pc.setLocalDescription(sdp);
    return sdp;
  };

  // =================== Call Action ====================== //
  startCall = async () => {
    const { id,name,room } = this.props.route.params;
    const {localAccount, remoteAccount} = this.state;
    console.log("Local:",localAccount)
    console.log("Remote:",remoteAccount)
    const sdp = await this.createOffer();
    this.socket.emit('offer', {
      sdp,
      to: remoteAccount.id,
      id: id,
      room: room,
      socketId: this.socket.id,
    });
  };

  answer = async () => {
    const { id,name,room } = this.props.route.params;
    const {localAccount, remoteAccount} = this.state;
    const sdp = await this.createAnswer();
    this.socket.emit('answer', {
      sdp,
      to: remoteAccount.id,
      id: id,
      room: room,
      socketId: this.socket.id,
    });
  };

  clearSession = () => {
    const {localStream, remoteStream} = this.state;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.stop();
      });

      localStream.release();
    }
    if (remoteStream) {
      remoteStream.release();
    }

    this.setState({
      localStream: null,
      remoteStream: null,
      isConnecting: false,
      skipSelectRemoteAccount: false,
      accountList: [],
      localAccount: {},
      remoteAccount: {},
    });
    this.initialLocalMedia();
  };

  hangup = () => {
    const {remoteAccount, localAccount} = this.state;
    this.socket.emit('hangup', {
      to: remoteAccount.id,
      id: localAccount.id,
      socketId: this.socket.id,
    });
  };

  switchCamera = () => {
    const {localStream} = this.state;
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  };

  renderVideo = () => {
    const {localStream, remoteStream} = this.state;
    return (
      <View style={styles.bodyVideo}>
        {remoteStream ? (
          <RTCView
            style={styles.remoteStream}
            objectFit="cover"
            streamURL={remoteStream.toURL()}
          />
        ) : (
          <View style={styles.remoteStream} />
        )}
        {localStream ? (
          <RTCView
            style={styles.localStream}
            objectFit="cover"
            streamURL={localStream.toURL()}
          />
        ) : (
          <View style={styles.localStream} />
        )}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.switchCamera}
            onPress={this.switchCamera}>
            <Text style={styles.textButton}>Switch camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endCall} onPress={this.hangup}>
            <Text style={styles.textButton}>Hangup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };





  renderSelectAccount = () => {
    const {isConnecting, accountList, localAccount} = this.state;
    let room = "";
    let user_id = "";
    let user_name = "";
    /*
    if(this.state.ListUserConnect.length !== 0){

      this.state.ListUserConnect.forEach( (result) => {
        console.log(result.room);
        if(result.room === "101101"){
          room = result.room;
          user_id = result.id;
          user_name = result.name;
          this.setRemoteAccount(result);
        }
      })

      if(room){
        return (
          <View>
            <Text>RoomName: {room}</Text>
            <TouchableOpacity
              key={"101"}
              style={styles.accountItem}
              onPress={this.handlePressAccountItem("101","User","101101")}>
              <Text style={styles.accountItemText}>{user_name}</Text>
            </TouchableOpacity>
          </View>
        );
      }else{
        return (
          <View>
            <Text>xxxxx</Text>
          </View>
        );
      }


    }else{
      return(
        <View style={styles.body}>
          <TouchableOpacity
            key={"101"}
            style={styles.accountItem}
            onPress={this.handlePressAccountItem("101","User","101101")}>
            <Text style={styles.accountItemText}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            key={"001"}
            style={styles.accountItem}
            onPress={this.handlePressAccountItem("101","Doctor","101101")}>
            <Text style={styles.accountItemText}>Doctor</Text>
          </TouchableOpacity>
        </View>
      );
    }


    /*
    return (
      <View style={styles.body}>
        <View>
          {!isConnecting ? (
            <Text style={styles.textHeader}>Login</Text>
          ) : (
            <Text style={styles.textHeader}>Select account for video call</Text>
          )}
        </View>

        {accountList
          .filter(account =>
            isConnecting ? account.id !== localAccount.id : true,
          )
          .map(account => (
            <TouchableOpacity
              key={account.id}
              style={styles.accountItem}
              onPress={this.handlePressAccountItem(account)}>
              <Text style={styles.accountItemText}>{account.name}</Text>
            </TouchableOpacity>
          ))}

        {isConnecting && (
          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => this.setState({skipSelectRemoteAccount: true})}>
            <Text style={styles.accountItemText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    );

    */
  };


  setRemoteAccount = (result)=>{
    this.setState({remoteAccount:result})
  }

  render() {
    const {remoteAccount, skipSelectRemoteAccount} = this.state;

    if (remoteAccount.id || skipSelectRemoteAccount) {
      return this.renderVideo();
    }else {
      return(
        <View>
          <Text>Waiting..!</Text>
        </View>
        )
    }

    //return this.renderSelectAccount();

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
