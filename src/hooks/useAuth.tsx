import { authService } from "@/HiD/appwrite/auth";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Models } from "appwrite";

interface AuthContext {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login(email: string, password: string): Promise<Models.User<Models.Preferences> | null>;
  signup(name: string, email: string, password: string): Promise<Models.User<Models.Preferences> | null>;
  logout(): Promise<void>;
  isAuthenticated():Promise<void>
}

const AuthContext = createContext<AuthContext>({} as any);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  const isAuthenticated = useCallback(async ()=>{
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  
  },[]) 

  // useEffect(() => {
  //   const getCurrentUser = async () => {
  //     try {
  //       const userData = await authService.getCurrentUser();
  //       setUser(userData);
  //     } catch (error) {
  //       setUser(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   getCurrentUser();
  // }, []);

  const signup = async (name: string, email: string, password: string) => {
    try {
      await authService.createEmailAndPassUser(email, password, name);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData
    } catch (error) {
      throw error
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData
    } catch (error) {
      throw error
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};