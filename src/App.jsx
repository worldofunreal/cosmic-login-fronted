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

  const { loginWithRedirect, logout, isAuthenticated, getAccessTokenSilently } = useAuth0();

  const generateKeyPairNaCl = () => {
    const keyPair = nacl.sign.keyPair();
    const publicKeyBase64 = base64Encode(keyPair.publicKey);
    const privateKeyBase64 = base64Encode(keyPair.secretKey);
    console.log(`Generated Keys - PublicKey: ${publicKeyBase64}, PrivateKey: ${privateKeyBase64}`);
    return { publicKeyBase64, privateKeyBase64 };
  };
  

  const handleAuth0Login = async () => {
    await loginWithRedirect().then(() => {
      if (isAuthenticated) {
        // Once authenticated, generate keys and send them to Unity
        const { publicKey, privateKey } = generateKeyPairNaCl();
        
        sendLoginDataToUnity(publicKey, privateKey);
      }
    }).catch(error => console.error("Authentication error:", error));
  };

  const { publicKey, privateKey } = generateKeyPairNaCl();

  // Function to send login data to Unity
  const sendLoginDataToUnity = async () => {
  try {
    const { publicKeyBase64, privateKeyBase64 } = generateKeyPairNaCl();
    if (!publicKeyBase64 || !privateKeyBase64) {
      console.error("Key generation failed.");
      return;
    }

    const message = {
      type: "Ed25519Identity",
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    };

    console.log("Sending message to Unity:", message);
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket connection is not open.");
    }
  } catch (error) {
    console.error("Error sending login data:", error);
  }
};



  // Hashing function - Ideally the same method as in Unity
  const hashSubDirectly = async (sub) => {
    const encoder = new TextEncoder();
    const encodedSub = encoder.encode(sub);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedSub);
    return hashBuffer;
  }

  useEffect(() => {
    if (isAuthenticated) {
      sendLoginDataToUnity(); 
    }
  }, [isAuthenticated]);

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
          { logo: icpLogo, text: "Auth0", onClick: handleAuth0Login }
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
