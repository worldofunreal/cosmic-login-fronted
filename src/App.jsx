import React, { createContext, useContext, useState, useEffect } from 'react';
import './App.css';
import { AuthClient } from "@dfinity/auth-client";
import { MyStorage } from "./MyStorage";
import cosmicLogo from './resources/Cosmicrafts_Logo.svg';
import logo from './resources/NFID_logo.svg';
import icpLogo from './resources/icp_logo.svg';
import astroXLogo from './resources/me_logo.svg';
import wouIcon from './resources/wou_logo.svg';
import metaMaskLogo from './resources/metaMask_icon.svg';
import phantomLogo from './resources/Phantom_icon.svg';
import wouidLogo from './resources/wouid_icon.svg';
import * as jwtDecode from 'jwt-decode';
import googleLogo from './resources/google_logo.svg';
import { useAuth0 } from "@auth0/auth0-react";
import MetaMaskService from "./Services/MetaMaskService";
import PhantomService from './Services/PhantomService';
import nacl from 'tweetnacl';
import { encode as base64Encode, decode as base64Decode } from "base64-arraybuffer";
import { useAuth } from './Services/AuthContext';


function App() {
  const [webSocket, setWebSocket] = useState(null);
  const [storage] = useState(new MyStorage());
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);
  const { loginWithRedirect, isAuthenticated, user, logout } = useAuth0();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [googleSub, setGoogleSub] = useState(null);

  const storeGoogleSub = (sub) => {
    setGoogleSub(sub); // Use the setter function to update the state
  };
  
  const isGoogleAuth = () => {
    return googleSub !== null;
  };

  useEffect(() => {
    if (isGoogleAuth()) { // Check if Google sign-in is active
      generateKeysFromSub(googleSub) // Use the stored sub
        .then(({ publicKeyBase64, privateKeyBase64 }) => {
          sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
        })
        .catch(error => console.error("Error generating keys:", error));
    }
  }, [isGoogleAuth]); // Note the simplified dependency 
  

  useEffect(() => {
    // Function to load the Google Identity Services library script dynamically
    const loadGoogleIdentityServices = () => {
      const script = document.createElement('script');
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        // Retry after a delay
        setTimeout(loadGoogleIdentityServices, 1000);
      };
      document.body.appendChild(script);
    };

    // Function to initialize Google Sign-In
    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }  // Customization attributes
      );
      window.google.accounts.id.prompt(); // Display the One Tap sign-in prompt
    };
    
    // Load the Google Identity Services library
    loadGoogleIdentityServices();
  }, []);

  function handleCredentialResponse(response) {
    // Log the entire response for debugging purposes
    console.log('Credential Response:', response);
  
    const decodedIdToken = response.credential.split('.')[1];
    const payload = JSON.parse(atob(decodedIdToken));
  
    console.log('Decoded ID Token Payload:', payload);
  
    const sub = payload.sub; // Extract the 'sub'
    
    // Log the extracted 'sub'
    console.log('Extracted sub:', sub);
  
    // Store the 'sub' in a global method (see Step 2)
    storeGoogleSub(sub);
  }
  
  
  const loginWithMetaMask = async () => {
    try {
      console.log('Attempting to log in with MetaMask...');
      const uniqueMessage = "Sign this message to log in with your Ethereum wallet";
      const signature = await MetaMaskService.signMessage(uniqueMessage);
      const { publicKeyBase64, privateKeyBase64 } = await generateKeysFromSignature(signature);
      sendLoginDataToUnity(publicKeyBase64, privateKeyBase64);
      console.log('Login with MetaMask successful');
    } catch (error) {
      console.error("Error logging in with MetaMask:", error);
    }
  };

  const loginWithPhantom = async () => {
    try {
      const message = "Sign this message to log in with your Phantom Wallet";
      const signature = await PhantomService.signAndSend(message);
      const { publicKeyBase64, privateKeyBase64 } = await generateKeysFromSignature(signature);
      // Assuming sendLoginDataToUnity function exists and works as before
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
        .catch(error => console.error("Error generating keys:", error));
    }
  }, [isAuthenticated, user]);

  const generateKeysFromSub = async (sub) => {
    console.log("generateKeysFromSub called with sub:", sub);
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
      <div id="buttonDiv"></div>
      <div className="inner-div">
        {[
          { logo: logo, text: "NFID", onClick: () => handleAuthClick("NFID")},
          { logo: icpLogo, text: "Internet Identity", onClick: () => handleAuthClick("InternetIdentity")},
          { logo: astroXLogo, text: "Astro X", onClick: () => handleAuthClick("AstroX") },
          { logo: wouidLogo, text: "Web2", onClick: () => loginWithRedirect({ redirectUri: window.location.origin, connection: 'google-oauth2'})},
          { logo: metaMaskLogo, text: "MetaMask", onClick: loginWithMetaMask},
          { logo: phantomLogo, text: "Phantom", onClick: loginWithPhantom}
          
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
