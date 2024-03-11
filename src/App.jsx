import React, { useState, useEffect } from 'react';
import './App.css';
import './AfterSession.css';
import { AuthClient } from "@dfinity/auth-client";
import { MyStorage } from "./MyStorage";
import nacl from 'tweetnacl';
import { encode as base64Encode} from "base64-arraybuffer";
import { useAuth0 } from "@auth0/auth0-react";
import MetaMaskService from "./Services/MetaMaskService";
import PhantomService from './Services/PhantomService';
import AfterSession from './AfterSession';

import cosmicLogo from './resources/Cosmicrafts_Logo.svg';
import logo from './resources/NFID_logo.svg';
import icpLogo from './resources/icp_logo.svg';
import wouIcon from './resources/wou_logo.svg';
import metaMaskLogo from './resources/metaMask_icon.svg';
import phantomLogo from './resources/Phantom_icon.svg';
import wouidLogo from './resources/wouid_icon.svg';

function App() {
  const [webSocket, setWebSocket] = useState(null);
  const [storage] = useState(new MyStorage());
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);
  const { loginWithRedirect, isAuthenticated, user, logout } = useAuth0();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleSub, setGoogleSub] = useState(null);
  const [showAfterSession, setShowAfterSession] = useState(false);


  const handleAfterLogin = (response) => {
    setShowAfterSession(true);
  };
  const handleCountdownComplete = () => {
    console.log("Countdown completed. Closing window...");
    // window.close();
  };
  
  const storeGoogleSub = (sub) => {
    setGoogleSub(sub);
  };
  
  const isGoogleAuth = () => {
    return googleSub !== null;
  };

  useEffect(() => {
    if (isGoogleAuth()) {
      generateKeysFromSub(googleSub)
        .then(({ publicKeyBase64, privateKeyBase64 }) => {
          sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
        })
        .catch(error => console.error("Error generating logging with Google:", error));
    }
  }, [isGoogleAuth]);
  
  useEffect(() => {
    const loadGoogleIdentityServices = () => {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        setTimeout(loadGoogleIdentityServices, 1000);
      };
      document.body.appendChild(script);
    };
    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "filled_black", size: "large" }
      );
      window.google.accounts.id.prompt();
    };
    loadGoogleIdentityServices();
  }, []);

  function handleCredentialResponse(response) {
    const decodedIdToken = response.credential.split('.')[1];
    const payload = JSON.parse(atob(decodedIdToken));
    console.log('Decoded ID Token Payload:', payload);
    const sub = payload.sub;
    storeGoogleSub(sub);
  }
  
  const loginWithMetaMask = async () => {
    try {
      console.log('Attempting to log in with MetaMask...');
      const uniqueMessage = "Sign this message to log in with your Ethereum wallet";
      const signature = await MetaMaskService.signMessage(uniqueMessage);
      const { publicKeyBase64, privateKeyBase64 } = await generateKeysFromSignature(signature);
      sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
    } catch (error) {
      console.error("Error logging in with MetaMask:", error);
    }
  };

  const loginWithPhantom = async () => {
    try {
      const message = "Sign this message to log in with your Phantom Wallet";
      const signature = await PhantomService.signAndSend(message);
      const { publicKeyBase64, privateKeyBase64 } = await generateKeysFromSignature(signature);
      sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
      console.log('Login with Phantom successful');
    } catch (error) {
      console.error("Error logging in with Phantom:", error);
    }
  };

  const generateKeysFromSignature = async (signature) => {
    const encoder = new TextEncoder();
    const encodedSignature = encoder.encode(signature);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedSignature);
    const seed = new Uint8Array(hashBuffer.slice(0, 32));
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const publicKeyBase64 = base64Encode(keyPair.publicKey);
    const privateKeyBase64 = base64Encode(keyPair.secretKey);
    return { publicKeyBase64, privateKeyBase64 };
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      generateKeysFromSub(user.sub)
        .then(({ publicKeyBase64, privateKeyBase64 }) => {
          sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
    
          logout(); 
        })
        .catch(error => console.error("Error loggin with Auth0:", error));
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
      handleAfterLogin();
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
        InternetIdentity: `https://identity.ic0.app`
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
            handleAfterLogin();
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
      
      {showAfterSession && <AfterSession onCountdownComplete={handleCountdownComplete} />}
      <div className="inner-div"><div id="buttonDiv"></div>
      {[
          { logo: logo, text: "NFID", onClick: () => handleAuthClick("NFID")},
          { logo: icpLogo, text: "Internet Identity", onClick: () => handleAuthClick("InternetIdentity")},
          { logo: metaMaskLogo, text: "MetaMask", onClick: loginWithMetaMask},
          { logo: phantomLogo, text: "Phantom", onClick: loginWithPhantom },
          { logo: wouidLogo, text: "Other Options", onClick: () => loginWithRedirect({ redirectUri: window.location.origin })} 
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