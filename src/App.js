import React, { useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { MyStorage } from "./MyStorage";
import cosmicLogo from './resources/Cosmicrafts_Logo.svg';
// import logo from './resources/nfid-wallet-logo.svg';
import logo from './resources/NFID_logo.svg';
import googleLogo from './resources/google_logo.svg';
import wouIcon from './resources/wou_logo.png';
import './App.css';

function App() {
  let identity = null;
  let storage = new MyStorage();
  const webSocket = new WebSocket('ws://localhost:8080/Data');
  
    useEffect(() => {
      document.getElementById("click").addEventListener("click", handleButtonClick);
  
      // open web socket
  
      webSocket.addEventListener('open', () => {
        console.log('WebSocket connection established.');
      });

      //autologin();
    }, []);

  const toggleElements = (isDisabled, isHidden) => {
    const click = document.getElementById("click");
    click.disabled = isDisabled;
    click.hidden = isHidden;
  };

  const handleButtonClick = async (e) => {
      e.preventDefault();
      toggleElements(true, true);
      await GetIdentity();
      toggleElements(false, false);
      return false;
  };

  const sendMessage = (message) => {
      webSocket.send(message);
  }

  const autologin = async () => {
    toggleElements(true, true);
      await GetIdentity();
      toggleElements(false, false);
  };

  const GetIdentity = async () => {
    try {
        // NFID
        const APPLICATION_NAME = "COSMICRAFTS";
        const APPLICATION_LOGO_URL = "https://cosmicrafts.com/wp-content/uploads/2023/09/cosmisrafts-242x300.png"; //"https://i.postimg.cc/L4f471FF/logo.png"; /// Change for cosmicrafts logo
        const AUTH_PATH =
        "/authenticate/?applicationName=" + APPLICATION_NAME + "&applicationLogo=" + APPLICATION_LOGO_URL + "#authorize";
        const NFID_AUTH_URL = "https://nfid.one" + AUTH_PATH;

        if (identity == null) {
            const authClient = await AuthClient.create({
                storage: storage,
                keyType: 'Ed25519',
            });

            await new Promise((resolve, reject) => {
                authClient.login({
                identityProvider: NFID_AUTH_URL,
                windowOpenerFeatures:
                    `left=${window.screen.width / 2 - 525 / 2}, ` +
                    `top=${window.screen.height / 2 - 705 / 2},` +
                    `toolbar=0,location=0,menubar=0,width=525,height=705`,
                derivationOrigin: "https://login.cosmicrafts.com", //"https://7p3gx-jaaaa-aaaal-acbda-cai.ic0.app",
                onSuccess: resolve,
                onError: reject,
                });
            });

            identity = authClient.getIdentity();
        }

        console.log("referrer=" + document.referrer);

        if (window.parent != null && document.referrer !== '' && document.referrer != null) {
            window.parent.postMessage(JSON.stringify(identity), document.referrer);
            return;
        }

        sendMessage(JSON.stringify(identity));
        window.close();

    } catch (e) {
        console.error(e);

        toggleElements(true, true);
    }
  };


  return (
    <div className='main-div'>
      <img src={cosmicLogo} className="cosmic-logo-img" />
      <label className="cosmic-label-connect">
        Connect with:
      </label>
      <div className="inner-div">
        <div className="icon-nfid-div">
          <img src={logo} className="icon-nfid" />
          <label className="icon-nfid-label">Via<br/>NFID</label>
        </div>
        <div className="btn-div" id="click">
          <label className="btn-label">
            <img src={googleLogo} className="button-account-icon" />
            Google account
          </label>
        </div>
        <div className="bottom-div">
          <img src={wouIcon} alt="wou-icon" className="bottom-wou-icon" />
          <label className="bottom-label">&copy;&nbsp;2023 World of Unreal<br />All trademarks referenced herein are the properties of their respective owners.</label>
        </div>
      </div>
    </div>
  );
}

export default App;
