import { Component, ViewChild } from '@angular/core';

declare var login
declare var videonInit: any;
declare var startCall: any;
declare var currentuser :any;
// currentuser.name = "";
declare var videoInit:any;
declare var socket ;
declare var selecteduser ;
declare var isInitiator ;
declare var isChatreq ;
declare var isVideo;
declare var localStream ;
var env = 'test';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('videoContainer',{static:true}) videoContainer;

  private video: HTMLVideoElement;
  constructor() {
    this.video = document.createElement('video');

    this.video.width = 640;

    this.video.height = 480;

    this.video.setAttribute('autoplay', '');

    
    currentuser.name = '251'
    console.log(login)
    videoInit('330'); 
    startCall();
  }

}
