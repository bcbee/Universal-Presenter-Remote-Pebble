var viewControl = new viewcontrol();
var serverCommunication = new servercommunication();

serverCommunication.setupUid();
serverCommunication.getResponse("Alive", null, false);

simply.on('singleClick', function(e) {
  console.log(util2.format('single clicked $button!', e));
  if (serverCommunication.enabled && util2.format('$button', e) == "select") {
    viewControl.begin();
  }
  if (viewControl.presenting && util2.format('$button', e) == "up") {
    serverCommunication.slideDown();
  }
  if (viewControl.presenting && util2.format('$button', e) == "down") {
    serverCommunication.slideUp();
  }
  if (viewControl.presenting && viewControl.timeout && util2.format('$button', e) == "select") {
    serverCommunication.playMedia();
  }
});

simply.on('longClick', function(e) {
  console.log(util2.format('long clicked $button!', e));
  if (viewControl.presenting && util2.format('$button', e) == "select") {
    viewControl.back();
  }
});

simply.on('accelTap', function(e) {
  console.log(util2.format('tapped accel axis $axis $direction!', e));
});

simply.setText({
   title: 'UPR: Remote',
   subtitle: '...',
   body: 'Enter token on presenting device. Connecting...',
}, true);


function servercommunication() {
    this.serverAddress = "http://universalpresenterremote.com/";
    this.uid = 0;
    this.temptoken = 0;
    this.token = 0;
    this.controlmode = 0;
    this.serveravailalbe = true;
    this.enabled = false;

    this.getResponse = function(page, requestToken, holdfor) {
      var tokenstring;
      var uidstring;
        if (requestToken) {
            tokenstring = "?token="+requestToken;
        } else {
            tokenstring = "";
        }
        if (holdfor) {
            uidstring = "&holdfor="+serverCommunication.uid;
        } else {
            uidstring = "";
        }
      ajax({ url: serverCommunication.serverAddress+page+".php"+tokenstring+uidstring }, function(data){
        console.log(serverCommunication.serverAddress+page+".php"+tokenstring+uidstring);
        serverCommunication.processResponse(page, data);
      });
    };

    this.processResponse = function(page, response) {
        var pages = ["Alive", "NewSession", "TempSession", "JoinSession"];
        var currentPage = pages.indexOf(page);
        switch (currentPage) {
            case 0:
                if (response == "Ready") {
                    serverCommunication.serveravailalbe = true;
                    serverCommunication.getResponse("NewSession", null, false);
                }
            break;
            case 1:
                serverCommunication.newTokenCallback(response);
            break;
            case 2:
                serverCommunication.tempSessionCallback(response);
            break;
        }
    };

    this.setupUid = function() {
        serverCommunication.uid = Math.floor(Math.random() * (99999999 - 999 + 1)) + 999;
    };

    this.newTokenCallback = function(response) {
        serverCommunication.temptoken = response;
        simply.subtitle(response);
        serverCommunication.getResponse("TempSession", serverCommunication.temptoken, true);
    };

    this.tempSessionCallback = function(response) {
        switch (parseInt(response)) {
            case 0:
                serverCommunication.getResponse("NewSession", null, false);
                simply.body('Enter token on presenting device. Connecting...');
                serverCommunication.enabled = false;
            break;
            case 1:
                setTimeout(function(){serverCommunication.getResponse("TempSession", serverCommunication.temptoken, true)}, 1000);
                simply.body('Enter token on presenting device. Waiting...');
                serverCommunication.enabled = false;
            break;
            case 2:
                simply.body('Press the select button to begin!');
                simply.vibe();
                serverCommunication.enabled = true;
            break;
        }
    };

    this.slideUp = function() {
        serverCommunication.getResponse("SlideUp", serverCommunication.token, true);
    };

    this.slideDown = function() {
        serverCommunication.getResponse("SlideDown", serverCommunication.token, true);
    };

    this.playMedia = function() {
        serverCommunication.getResponse("PlayMedia", serverCommunication.token, true);
    };
}

function viewcontrol() {
    this.presenting = false;
    this.timeout = false;

    this.begin = function() {
        setTimeout(function(){viewControl.timeout=true}, 1000);
        serverCommunication.token = serverCommunication.temptoken;
        simply.title("Control");
        simply.subtitle("");
        simply.body("Use the up and down buttons to present. Previous and next respectively");
        viewControl.presenting = true;
    };

    this.back = function() {
        serverCommunication.token = 0;
        serverCommunication.temptoken = 0;
        simply.title("UPR: Remote");
        simply.subtitle("...");
        simply.body("Enter token on presenting device. Connecting...");
        viewControl.presenting = true;
        serverCommunication.getResponse("NewSession", 0, false);
        viewControl.timeout = false;
    };
}
