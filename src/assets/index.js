var socket = null;
var currentuser = {};
currentuser.name = "";
var selecteduser = {};
var isInitiator = false;
var isChatreq = false;
var isVideo = false;
var localStream = null;
var env = 'test';
// var isLocalStreamAdded = false;

var peerConnections = [];

var mediaOptions = {
    video: true,
    audio: true
};
var configuration = {
    iceServers: [
    ]
};
var options = {
    optional: [
        { DtlsSrtpKeyAgreement: true },
        { RtpDataChannels: true }
    ]
};
var constraints = { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } };

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

var errorHandler = function (err) {
    console.log(err);
};

function login() {
    // currentuser.name = $('#hdUserID').val();
    // selecteduser.name = $('#hdToUserID').val();
    // if (currentuser.name != null && currentuser.name != "")
        connect();
}

function sendchatrequest() {
    isChatreq = true;
    if (selecteduser.name != null && selecteduser.name != "" && currentuser.name != null && currentuser.name != "") {
        sendio(selecteduser.name, currentuser.name, '', "chatreq");
    }
}

function muteAudio() {
    if (localStream) {
        localStream.getAudioTracks()[0].enabled = false;
    }
}
function unmuteAudio() {
    if (localStream) {
        localStream.getAudioTracks()[0].enabled = true;
    }
}
function muteVideo() {
    if (localStream) {
        localStream.getVideoTracks()[0].enabled = false;
    }
}
function unmuteVideo() {
    if (localStream) {
        localStream.getVideoTracks()[0].enabled = true;
    }
}

function outboundVideocall() {

    isVideo = true;
    isInitiator = true;
    getUserMedia();
}
function getUserMedia() {

    var video = document.getElementById("localvideo");

    navigator.getUserMedia(mediaOptions, function (stream) {
       // $("#localVideo").get(0).srcObject = stream;
        //document.getElementById('localVideo').muted = true;
        //attachStreamtoLargeVideo($("#localvideo").src);
        //document.getElementById('largeVideo').muted = true;
        localStream = stream;

        if (isInitiator == true) {
            var params = { type: 'videocallreq' };
            sendio(selecteduser.name, currentuser.name, params, "videocallreq");
        }
        else {
            var params = { type: 'accepted' };
            sendio(selecteduser.name, currentuser.name, params, "accepted");
        }




    }, errorHandler);
}

function makeOffer() {

    var pc = getPeerConnection(0);
    attachmediastream(pc);
    setIceCandidate(pc);
    createOffer(pc);
}

function createOffer(pc) {
    pc.createOffer(function (offer) {
        console.log("create offer")
        pc.setLocalDescription(offer);
        var params = { obj: offer, type: 'offer' };
        sendio(selecteduser.name, currentuser.name, params, "offer");
    }, errorHandler, constraints);
}

function setIceCandidate(pc) {
    pc.onicecandidate = function (event) {
        if (event.candidate) {
            var params = {
                type: 'candidate', label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }

            sendio(selecteduser.name, currentuser.name, params, "candidate");
        }
        else {
            console.log('End of candidates.');
        }
    };
}

function setoffer(data) {
    var pc = getPeerConnection(0);

    if (isVideo == true) {
        attachmediastream(pc);
    }

    var rsdp = new (window.RTCSessionDescription)(data.obj);
    pc.setRemoteDescription(rsdp);
    setIceCandidate(pc, data.to, data.from, selecteduser.name + "_room_" + env);
    pc.createAnswer(function (answer) {
        pc.setLocalDescription(answer);

        var params = { obj: answer, from: data.to, to: data.from, type: 'answer' };
        sendio(selecteduser.name, currentuser.name, params, "answer");

    }, errorHandler, constraints);
}

function setAnswer(data) {
    var pc = getPeerConnection(0);
    var rsdp = new (window.RTCSessionDescription)(data.obj);
    pc.setRemoteDescription(rsdp);
}

function addIceCandidate(data) {
    console.log(data.label);
    var pc = getPeerConnection(0);
    var candidate = new (window.RTCIceCandidate)({
        sdpMLineIndex: data.label,
        candidate: data.candidate
    });
    pc.addIceCandidate(candidate);
}
function getPeerConnection(id) {
    if (peerConnections[id]) {
        return peerConnections[id];
    }
    console.log(configuration);
    var pc = new (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.RTCPeerConnection)(configuration, options);
    //var pc = new (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection)(servers);
    peerConnections[id] = pc;
    return pc;
}

//Socket Operation

function sendio(channel, username, msg, eventype, callback) {

    var userMessage = { type: eventype, message: msg };

    var data = { from: username, to: channel, message: userMessage };

    //console.log('publish ' + channel + username + msg + eventype );
    if (socket != null) {
        socket.emit('message', data);
    }
}

function disconnect() {
    if (socket != null) {
        socket.disconnect();
        socket = null;
    }
}

function sendreq(event, obj) {
    if (socket != null) {
        socket.emit(event, obj);
    }
}

function connect() {
    socket.emit('login', currentuser.name);
}


function hangup() {
    sendio(selecteduser.name, currentuser.name, '', "endVideoCall");
    releasemedia();
}

window.onbeforeunload = WindowCloseHanlder;
function WindowCloseHanlder() {
    if (isChatreq = true) {
        hangup();
    }
}

//------------------------------------------------------------------------------------------------------------------------you can use below methods
// you need to init first with options  
//  {
//     url : "",
//     iceServers : [
//         {urls: "stun:23.21.150.121"},
// 		{urls: "stun:stun.l.google.com:19302"},
// 		{urls: "turn:url", credential: "password", username: "name"},
//      ],
//     uid: ""
// }

function videoInit(user) {
    currentuser.name=user;
    var optiondata = {
        url: "https://irhstun.centralindia.cloudapp.azure.com:8000/",
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { url: 'turn:52.172.196.39:8144?transport=tcp', username: 'user1', credential: 'password1' }
        ],
        uid: ""
    }
    socket = io(optiondata.url);
    configuration.iceServers = optiondata.iceServers;
    socket.on('connect', function (data) {
        console.log(data);
        console.log('connected');
        if (currentuser.name != "")
            socket.emit('login', currentuser.name);

    });

    socket.on('login', function (data) {
        console.log('connection successfully');
        connected = true;
        // Display the welcome message
        var message = "Welcome to Socket.IO Chat â€“ ";
    });

    socket.on('disconnect', function () {
        console.log('you have been disconnected');
    });

    socket.on('reconnect', function () {
        console.log('you have been reconnected');
        socket.emit('login', currentuser.name);
    });

    socket.on('reconnect_error', function () {
        console.log('attempt to reconnect has failed');
    });

    socket.on('online', function (data) {
        console.log(data);
        console.log('user online ' + data);
        if (data != null && data != "") {
            // if (data == currentuser.name) {
            //     $("#loginPage").attr("style", "display:none");
            //     $("#callPage").attr("style", "display:block");
            // }
            if (data == currentuser.name) {
                // if (isChatreq == true) {
                //     // setTimeout(function () {
                //     //     //selecteduser.username=obj.from;
                //     //     sendchatrequest();

                //     //     //redirectToChatscreen(contacts[selected].username);   
                //     // }, 10);
                // }
                // setTimeout(function () {
                //     $('#btnstart').click();
                // }, 10);

            }
        }
    });

    socket.on('offline', function (data) {
        console.log(data);
        console.log('user offline ' + data);
    });

    socket.on('message', function (data) {

        switch (data.message.type) {
            case 'presence':
                {

                }
                break;
            case 'chatreq':
                {
                    if (currentuser.name != data.from) {
                        chatreq('chatreq', data);

                    }

                }
                break;
            case 'chatreqaccepted':
                {
                    chatreqaccepted('chatreqaccepted', data);

                }
                break;
            case 'rejectchatreq':
                {
                    rejectchatreq('rejectchatreq', data.message);

                }
                break;

            case "videocallreq":
                {
                    isVideo = true;

                    if (isInitiator != true) {
                        getUserMedia();
                    }
                }
                break;
            case "accepted":
                {
                    if (isInitiator == true) {
                        console.log("accepted");
                        makeOffer();
                    }
                }
                break;
            case "offer":
                {
                    if (isInitiator != true) {
                        console.log("offer");
                        setoffer(data.message.message);
                    }
                }
                break;
            case "answer":
                {
                    if (isInitiator == true) {
                        console.log("answer");
                        setAnswer(data.message.message);
                    }
                }
                break;
            case "candidate":
                {
                    console.log("candidate"); console.log(data);

                    addIceCandidate(data.message.message);
                }
                break;
            case "endVideoCall":
                {
                    console.log("endVideoCall");
                    releasemedia();

                }
                break;
            case "NoUserAvaiable": {
                if (data.from == currentuser.name) {
                    hangup();
                }
            }
                break;

        }

        console.log(data);
    });
    login();
}
function startCall() {
    
    selecteduser.name = "271"
    //selecteduser.name = $('#callToUsernameInput').val();
    // if ($("#hdToUserID").val() != null && $("#hdToUserID").val() != "") {
    //     selecteduser.name = $("#hdToUserID").val();
    // }
    if (selecteduser.name != null && selecteduser.name != "") {
        sendchatrequest();
    }
    //outboundVideocall();
}


// chat request received here you need ti handle  reject or accept 
function chatreq(event, obj) {
    console.log(obj);
    console.log("chatreq");
    // $('#chatrequest').show();
    // $("#btn-accept").click(function () {
    //     isChatreq = true;
    //     $('#chatrequest').hide();

    // });
    // $("#btn-reject").unbind("click").click(function () {
    //     $('#chatrequest').hide();
    //     sendio(obj.from, currentuser.name, '', "rejectchatreq");
    // });
    sendio(obj.from, currentuser.name, '', "chatreqaccepted");
    selecteduser.name = obj.from;
    setTimeout(function () {
        selecteduser.name = obj.from;

    }, 10);

}


// if chat request accepted event came here you need to handle for ready for video view
function chatreqaccepted(event, obj) {
    console.log("chatreqaccepted");
    setTimeout(function () {
        //selecteduser.username=obj.from;
        outboundVideocall();
        //redirectToChatscreen(contacts[selected].username);   
    }, 10);
}

// if chat request rejected this method will fire you can mange for rejected event
function rejectchatreq(event, obj) {
    console.log("rejectchatreq");
    selecteduser = {};
    isChatreq = false;
    //hideInProgressMessage();
    alert('Chat request rejected!.');

}

function attachmediastream(pc) {
    // if (isLocalStreamAdded != true) {
    //     isLocalStreamAdded = true;
    pc.addStream(localStream);
    pc.ontrack = function (e) {
        //--------------------------------------------------------------------------
        //----------you need to add remote stream to your remote video tag ----------
        var vid = document.getElementById('remoteVideo');
        vid.autoplay = true;
        vid.srcObject = e.streams[0];
        console.log(vid.src);
        document.getElementById('remoteVideo').muted = false;
        //---------------------------------------------------------------------------
        e.streams[0].destroyed = function () {
            console.log('stream ended', this.id);
        }

    };
    // }
}

function releasemedia() {
    for (var i = 0; i < peerConnections.length; i++) {
        if (peerConnections[i]) {
            peerConnections[i].close();
            peerConnections[i] = null;
        }
    }
    if (localStream) {
        localStream.getTracks().forEach(function (track) {
            if (track != null) {
                track.stop();
                track.enabled = false
            }
        });
    }
    if (localStream) {
        localStream.getVideoTracks().forEach(function (track) {
            if (track != null) {
                track.stop();
                track.enabled = false
            }
        });
    }
    if (localStream) {
        localStream.getAudioTracks().forEach(function (track) {
            if (track != null) {
                track.stop();
                track.enabled = false
            }
        });
    }
    navigator.getUserMedia(mediaOptions, function (stream) {

        localStream = stream;
        localStream.getTracks().forEach(function (track) {
            track.stop();
            track.enabled = false;
        });
    }, errorHandler);
    selecteduser = {};
    isChatreq = false;
    isVideo = false;
    //isIncoming = false;
    isInitiator = false;
    // isLocalStreamAdded=false;
    //--------------------------------------------------------------------
    // after hangup you need to handel below view remote and local video tags
    // if ($("#localVideo").get(0))
    //     $("#localVideo").get(0).src = "";

    // if ($("#remoteVideo").get(0))
    //     $("#remoteVideo").get(0).src = "";
    //-------------------------------------------------------------------------------
}



