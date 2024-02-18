import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { MyStorage } from "./MyStorage";
import cosmicLogo from './resources/Cosmicrafts_Logo.svg';
import logo from './resources/NFID_logo.svg';
import icpLogo from './resources/icp_logo.svg';
import wouIcon from './resources/wou_logo.png';
import './App.css';

function App() {
  const [webSocket, setWebSocket] = useState(null);
  const [storage] = useState(new MyStorage());
  let identity = null;
  // State to track the selected authentication method
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);


  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/Data');
    ws.onopen = () => console.log('WebSocket connection established.');
    setWebSocket(ws);

    return () => ws.close(); // Clean up on component unmount
  }, []);


  // Handler for NFID button click
  const handleNFIDClick = async () => {
    setSelectedAuthMethod("NFID");
    await GetIdentity("NFID");
  };

  // Handler for Internet Identity button click
  const handleInternetIdentityClick = async () => {
    setSelectedAuthMethod("InternetIdentity");
    await GetIdentity("InternetIdentity");
  };

  // Handler for Plug button click - Correctly defined now
  const handlePlugClick = async () => {
    setSelectedAuthMethod("Plug");
    await GetIdentity("Plug");
  };

  const toggleElements = (isDisabled, isHidden) => {
    const click = document.getElementById("click");
    click.disabled = isDisabled;
    click.hidden = isHidden;
  };


  const sendMessage = (message) => {
      console.log("Sending message to Unity:", message);
      webSocket.send(message);
  }

  const autologin = async () => {
    toggleElements(true, true);
      await GetIdentity();
      toggleElements(false, false);
  };

const GetIdentity = async (authMethod) => {
  try {
    let identityProviderUrl;
    const APPLICATION_NAME = "COSMICRAFTS";
    const APPLICATION_LOGO_URL = "https://cosmicrafts.com/wp-content/uploads/2023/09/cosmisrafts-242x300.png";
    const authClient = await AuthClient.create({
      storage: storage,
      keyType: 'Ed25519',
    });

    // Handling NFID and Internet Identity
    if (authMethod === "NFID") {
      identityProviderUrl = "https://nfid.one/authenticate/?applicationName=" + APPLICATION_NAME + "&applicationLogo=" + APPLICATION_LOGO_URL + "#authorize";
    } else if (authMethod === "InternetIdentity") {
      identityProviderUrl = "https://identity.ic0.app"; // Internet Identity provider URL
    }

    if (identity == null) {
      await new Promise((resolve, reject) => {
        authClient.login({
          identityProvider: identityProviderUrl,
          windowOpenerFeatures: `left=${window.screen.width / 2 - 525 / 2}, top=${window.screen.height / 2 - 705 / 2}, toolbar=0, location=0, menubar=0, width=525, height=705`,
          
          onSuccess: () => {
            identity = authClient.getIdentity();
            console.log("Authenticated identity:", identity);
                // Construct and log the message before sending
                const message = JSON.stringify(identity);
                console.log("Formatted message for NFID/Internet Identity:", message);
                sendMessage(message);
            resolve();
          },
          onError: reject,
        });
      });
    }

    console.log("Authenticated identity:", identity);
    sendMessage(JSON.stringify(identity));

    if (window.parent != null && document.referrer !== '' && document.referrer != null) {
      window.parent.postMessage(JSON.stringify(identity), document.referrer);
      return; // Ensure we exit the function here after sending the message
    }

  } catch (e) {
    console.error("Authentication error:", e);
    toggleElements(true, true); // Show error state in UI
  }
};

  return (
    <div className='main-div'>
      <img src={cosmicLogo} className="cosmic-logo-img" alt="Cosmicrafts Logo"/>
      <label className="cosmic-label-connect">
        Connect with:
      </label>
      <div className="inner-div">
        <div className="btn-div" onClick={handleNFIDClick}>
          <label className="btn-label">
            <img src={logo} className="button-account-icon" alt="NFID"/>
            Login with NFID
          </label>
        </div>
        <div className="btn-div" onClick={handleInternetIdentityClick}>
          <label className="btn-label">
            <img src={icpLogo} className="button-account-icon" alt="Internet Identity"/>
            Login with Internet Identity
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
