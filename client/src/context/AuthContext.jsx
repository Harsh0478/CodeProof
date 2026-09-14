import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';
import { api, apiMessage, setClerkTokenGetter } from '../services/api';

const C = createContext(null);

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    setClerkTokenGetter(getToken);
    return () => setClerkTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!isLoaded || !userLoaded) return;
      if (!isSignedIn) {
        setUser(null);
        setSyncing(false);
        return;
      }
      setSyncing(true);
      try {
        const response = await api.get('/auth/me');
        if (!cancelled) setUser(response.data.user);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }
    sync();
    return () => { cancelled = true; };
  }, [isLoaded, userLoaded, isSignedIn, clerkUser?.id]);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <C.Provider value={{
      user,
      clerkUser,
      loading: !isLoaded || !userLoaded || syncing,
      isSignedIn: Boolean(isSignedIn),
      logout,
      apiMessage,
    }}>
      {children}
    </C.Provider>
  );
}

export const useAuth = () => useContext(C);
