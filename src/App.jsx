import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { MyStorage } from "./MyStorage";
import cosmicLogo from './resources/Cosmicrafts_Logo.svg';
import logo from './resources/NFID_logo.svg';
import icpLogo from './resources/icp_logo.svg';
import astroXLogo from './resources/me_logo.svg';
import wouIcon from './resources/wou_logo.svg';
import './App.css';
import { useAuth0 } from "@auth0/auth0-react";
import nacl from 'tweetnacl';
import { encode as base64Encode, decode as base64Decode } from "base64-arraybuffer";


function App() {
  const [webSocket, setWebSocket] = useState(null);
  const [storage] = useState(new MyStorage());
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);

  const { loginWithRedirect, isAuthenticated, user } = useAuth0();



  useEffect(() => {
    if (isAuthenticated && user) {
      // Assuming user.sub exists and is populated correctly by Auth0 after authentication
      generateKeysFromSub(user.sub).then(({ publicKeyBase64, privateKeyBase64 }) => {
        sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
      }).catch(error => console.error("Error generating keys:", error));
    }
  }, [isAuthenticated, user]);

  const generateKeysFromSub = async (sub) => {
    const encoder = new TextEncoder();
    const encodedSub = encoder.encode(sub);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedSub);
    const seed = new Uint8Array(hashBuffer.slice(0, 32));
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const publicKeyBase64 = base64Encode(keyPair.publicKey);
    const privateKeyBase64 = base64Encode(keyPair.secretKey);
    return { publicKeyBase64, privateKeyBase64 };
  };

  const sendLoginDataToUnity = (publicKeyBase64, privateKeyBase64) => {
    const message = {
      type: "Ed25519Identity",
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    };
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket connection is not open.");
    }
  };

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/Data');
    ws.onopen = () => console.log('WebSocket connection established.');
    setWebSocket(ws);
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (webSocket) {
      webSocket.onopen = () => console.log('WebSocket connection established.');
      return () => webSocket.close();
    }
  }, [webSocket]);

  const handleAuthClick = async (authMethod) => {
    setSelectedAuthMethod(authMethod);
    await GetIdentity(authMethod);
  };

  const sendMessage = (message) => {
    console.log("Sending message to Unity:", message);
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(message);
    } else {
      console.error("WebSocket connection is not open.");
    }
  };

  const GetIdentity = async (authMethod) => {
    try {
      const identityProviderUrls = {
        NFID: `https://nfid.one/authenticate/?applicationName=COSMICRAFTS&applicationLogo=https://cosmicrafts.com/wp-content/uploads/2023/09/cosmisrafts-242x300.png#authorize`,
        InternetIdentity: `https://identity.ic0.app`,
        AstroX: `https://63k2f-nyaaa-aaaah-aakla-cai.raw.ic0.app/#authorize`
      };

      if (!identity) {
        const authClient = await AuthClient.create({ storage, keyType: 'Ed25519' });
        await authClient.login({
          identityProvider: identityProviderUrls[authMethod],
          windowOpenerFeatures: `left=${window.screen.width / 2 - 525 / 2}, top=${window.screen.height / 2 - 705 / 2}, toolbar=0, location=0, menubar=0, width=525, height=705`,
          onSuccess: () => {
            identity = authClient.getIdentity();
            console.log("Authenticated identity:", identity);
            sendMessage(JSON.stringify(identity));
            window.close();
          },
          onError: (e) => {
            console.error("Authentication error:", e);
            toggleElements(true, true);
          }
        });
      }
    } catch (e) {
      console.error("Authentication error:", e);
      toggleElements(true, true);
    }
  };

  const toggleElements = (isDisabled, isHidden) => {
    const click = document.getElementById("click");
    click.disabled = isDisabled;
    click.hidden = isHidden;
  };

  return (
    <div className='main-div'>
      <img src={cosmicLogo} className="cosmic-logo-img" alt="Cosmicrafts Logo"/>
      <label className="cosmic-label-connect">Connect with:</label>
      <div className="inner-div">
        {[
          { logo: logo, text: "NFID", onClick: () => handleAuthClick("NFID") },
          { logo: icpLogo, text: "Internet Identity", onClick: () => handleAuthClick("InternetIdentity") },
          { logo: astroXLogo, text: "Astro X", onClick: () => handleAuthClick("AstroX") },
          { logo: icpLogo, text: "Auth0", onClick: loginWithRedirect }
        ].map((item, index) => (
          <div className="btn-div" key={index} onClick={item.onClick}>
            <label className="btn-label">
              <img src={item.logo} className="button-account-icon" alt={item.text}/>
              Login with {item.text}
            </label>
          </div>
        ))}
        <div className="bottom-div">
          <img src={wouIcon} alt="wou-icon" className="bottom-wou-icon" />
          <label className="bottom-label">&copy;&nbsp;2023 World of Unreal<br />All trademarks referenced herein are the properties of their respective owners.</label>
        </div>
      </div>
    </div>
  );
}

let identity = null;

export default App;
