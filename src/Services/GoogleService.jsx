import { useEffect } from 'react';
import { useAuth } from './AuthContext'; // Adjust the import path according to your project structure
import jwtDecode from 'jwt-decode';

export function GoogleSignInSetup() {
  const { dispatch } = useAuth();

  useEffect(() => {
    const handleCredentialResponse = (response) => {
      const decodedToken = jwtDecode(response.credential);
      const userSub = decodedToken.sub; // Or any other user identifying information

      // Mock function to generate keys from userSub
      const generateKeysFromSub = async (sub) => {
        // Simulate generating keys
        return { publicKeyBase64: 'publicKey', privateKeyBase64: 'privateKey' };
      };

      generateKeysFromSub(userSub).then((keys) => {
        // Dispatch action to update context state
        dispatch({
          type: 'SET_USER',
          payload: { user: { sub: userSub }, keys: keys },
        });
      }).catch(console.error);
    };

    // Load the Google Identity Services library
    const loadGoogleIdentityServices = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('signInDiv'),
          { theme: 'outline', size: 'large' }, // Customization attributes
        );
        window.google.accounts.id.prompt(); // Display One Tap
      };
      script.onerror = () => console.error('Google Identity Services script failed to load');
      document.body.appendChild(script);
    };

    loadGoogleIdentityServices();
  }, [dispatch]);

  return <div id="signInDiv"></div>; // Placeholder for Google sign-in button
}
