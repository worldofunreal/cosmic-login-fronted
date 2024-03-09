import React from 'react';
import { createRoot } from 'react-dom/client'; // Ensure you're importing createRoot for React 18
import { BrowserRouter } from 'react-router-dom'; // Make sure to import BrowserRouter
import { Auth0Provider } from '@auth0/auth0-react'; // Import the Auth0Provider component
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Auth0Provider
      domain="worldofunreal.us.auth0.com"
      clientId="MbSEvChfyejH8nkY9q8i8rTemyJWtnv3"
      authorizationParams={{ redirect_uri: window.location.origin }}
      onRedirectCallback={appState => {
        window.history.replaceState({}, document.title, appState?.returnTo || window.location.pathname);
      }}
      onError={(error) => console.error('Auth0 Error:', error)}
    >
      <App />
    </Auth0Provider>
  </BrowserRouter>
);
