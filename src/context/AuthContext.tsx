import {
  createContext,
  useEffect,
  useState,
  useContext,
  type ReactNode,
} from "react";
import supabase from "../utils/supabase";
import type {
  AuthContextType,
  RegisterResult,
  SignInResult,
} from "../types/types";
import type { Session } from "@supabase/supabase-js";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  // const registerNewUser = async (
  //   email: string,
  //   password: string
  // ): Promise<RegisterResult> => {
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //   });

  //   if (error) {
  //     return { success: false, error };
  //   }

  //   return { success: true, user: data.user };
  // };
  const registerNewUser = async (
    email: string,
    password: string
  ): Promise<RegisterResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { success: false, error };
    return { success: true, user: data.user };
  };

  const signInUser = async (
    email: string,
    password: string
  ): Promise<SignInResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };
      if (!data.user || !data.session)
        return { success: false, error: "No user/session returned." };

      return { success: true, data };
    } catch (err) {
      console.error(err);
      return { success: false, error: "Unexpected error occurred." };
    }
  };
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("there was an error", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, registerNewUser, signOut, signInUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("UserAuth must be used within AuthContextProvider");
  return context;
};
