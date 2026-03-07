import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setGetToken, fetchUserData as apiFetchUser } from "../api";
import api from "../api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Provide token getter to axios
  useEffect(() => {
    if (getToken) setGetToken(getToken);
  }, [getToken]);

  // Fetch or create backend user when signed in
  const loadUser = useCallback(async () => {
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Try to fetch existing user
      const { data } = await apiFetchUser();
      setUser(data.user);
    } catch (err) {
      // If user not found (404), sync/create them
      if (err.status === 404) {
        try {
          const { data } = await api.post("/user/sync", {
            clerkUser: {
              id: clerkUser.id,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              emailAddresses: clerkUser.emailAddresses,
              imageUrl: clerkUser.imageUrl,
              publicMetadata: clerkUser.publicMetadata,
            },
          });
          setUser(data.user);
        } catch (syncErr) {
          console.error("Failed to sync user:", syncErr);
          setUser(null);
        }
      } else {
        console.error("Failed to fetch user:", err);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, authLoaded, userLoaded, clerkUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
        refreshUser: loadUser,
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
