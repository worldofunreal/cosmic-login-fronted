import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
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
