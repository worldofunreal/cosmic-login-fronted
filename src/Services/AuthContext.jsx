import React, { createContext, useContext, useReducer } from 'react';

// Define the shape of your context's state
const initialState = {
  isAuthenticated: false,
  user: null,
  keys: null,
};

// Actions
const SET_USER = 'SET_USER';

// Reducer to handle state updates
function authReducer(state, action) {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        isAuthenticated: !!action.payload,
        user: action.payload ? action.payload.user : null,
        keys: action.payload ? action.payload.keys : null,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Context provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}
