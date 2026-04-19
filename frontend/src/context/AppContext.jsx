// context/AppContext.jsx - MINIMAL FIX VERSION
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setGetToken, fetchUserData as apiFetchUser } from "../api";
import api from "../api";
import { exponentialDelay } from "../utils/helpers";

const AppContext = createContext(null);

const MAX_SYNC_RETRIES = 3;

export function AppProvider({ children }) {
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncRetriesRef = useRef(0);
  const loadUserRef = useRef(); // ✅ ADD: Store loadUser in ref

  // Provide token getter to axios
  useEffect(() => {
    if (getToken) setGetToken(getToken);
  }, [getToken]);

  // ✅ ONLY CHANGE: Remove useCallback, use regular function
  useEffect(() => {
    const loadUser = async () => {
      if (!authLoaded || !userLoaded) return;

      if (!isSignedIn || !clerkUser) {
        setUser(null);
        setLoading(false);
        syncRetriesRef.current = 0;
        return;
      }

      setLoading(true);

      try {
        const { data } = await apiFetchUser();
        setUser(data.user);
        syncRetriesRef.current = 0;
      } catch (err) {
        if (err.status === 404) {
          if (syncRetriesRef.current >= MAX_SYNC_RETRIES) {
            console.error("Max sync retries reached.");
            setUser(null);
            setLoading(false);
            return;
          }

          try {
            syncRetriesRef.current += 1;
            const delay = exponentialDelay(syncRetriesRef.current);
            await new Promise((resolve) => setTimeout(resolve, delay));
            const { data } = await api.post("/user/sync");
            setUser(data.user);
            syncRetriesRef.current = 0;
          } catch (syncErr) {
            console.error(`Sync failed (${syncRetriesRef.current}/${MAX_SYNC_RETRIES})`);
            if (syncRetriesRef.current >= MAX_SYNC_RETRIES) {
              setUser(null);
            }
          }
        } else {
          console.error("Failed to fetch user:", err);
          setUser(null);
          syncRetriesRef.current = 0;
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserRef.current = loadUser;
    loadUser();
  }, [isSignedIn, authLoaded, userLoaded, clerkUser]);

  const isEducator = user?.role === "educator" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loading,
        isEducator,
        isAdmin,
        isSignedIn,
        clerkUser,
        refreshUser: () => loadUserRef.current?.(), // ✅ Use ref
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};