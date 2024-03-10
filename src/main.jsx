import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
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
