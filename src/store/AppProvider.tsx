import React, { useReducer, useEffect } from 'react';
import { AppContext, appReducer, getInitialState, persistState } from './appStore';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  // Persist state changes to localStorage
  useEffect(() => {
    persistState(state);
  }, [state.posts, state.groups, state.messages, state.notifications, state.likedPosts]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
