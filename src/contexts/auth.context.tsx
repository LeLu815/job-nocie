"use client";

import { User } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/supabase/client";

type AuthContextValue = {
  isInitialized: boolean;
  isLoggedIn: boolean;
  me: User | null;

  userData: { nickname: string | null; imageUrl: string | null } | null;
  logIn: (email: string, password: string) => void;
  logIn: (email: string, password: string) => Promise<{ status: number }>;
  logOut: () => void;
  signUp: (email: string, password: string) => Promise<{ status: number }>;
};

const initialValue: AuthContextValue = {
  isInitialized: false,
  isLoggedIn: false,
  me: null,
  userData: null,
  logIn: () => {},
  logIn: async () => ({ status: 0 }),
  logOut: () => {},
  signUp: async () => ({ status: 0 }),
};

const AuthContext = createContext<AuthContextValue>(initialValue);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] =
    useState<AuthContextValue["isInitialized"]>(false);
  const [me, setMe] = useState<AuthContextValue["me"]>(null);
  const [userData, setUserData] = useState<AuthContextValue["userData"]>(null);
  const isLoggedIn = !!me;
  const supabase = createClient();

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("nickname, imageUrl")
      .eq("id", userId)
      .single();
    if (data) {
      setUserData(data);
    }
    if (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // 로그인 함수
  const logIn: AuthContextValue["logIn"] = async (email, password) => {
    if (!email || !password) {
      alert("이메일, 비밀번호 모두 채워 주세요!");
      return { status: 401 }; // 상태 코드 추가;
    }
    const data = {
      email,
      password,
    };
    const response = await fetch("http://localhost:3000/api/auth/log-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const user = await response.json();
    setMe(user);
    fetchUserData(user.id);

    if (response.status === 401) {
      return { status: 401 };
    }
    return { status: 200 };

  };

  // 가입 함수
  const signUp: AuthContextValue["signUp"] = async (email, password) => {
    if (!email || !password) {
      alert("이메일, 비밀번호 모두 채워 주세요!");
      return { status: 401 }; // 상태 코드 추가
    }
    if (me) {
      alert("이미 로그인이 되어있어요");
      return { status: 400 }; // 상태 코드 추가
    }
    const data = {
      email,
      password,
    };
    const response = await fetch("http://localhost:3000/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify(data),
    });
    console.log("response", response);
    const user = await response.json();
    setMe(user);

    fetchUserData(user.id);


    if (response.status === 401) {
      return { status: 401 };
    }
    return { status: 200 };

  };

  // 로그아웃 함수
  const logOut: AuthContextValue["logOut"] = async () => {
    if (!me) return alert("로그인하고 눌러주세요!");
    await fetch("http://localhost:3000/api/auth/log-out", {
      method: "DELETE",
    });
    setMe(null);
    setUserData(null);
  };

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/me").then(async (response) => {
      if (response.status === 200) {
        const user = await response.json();
        setMe(user);
        fetchUserData(user.id);
      }
      setIsInitialized(true);
    });
  }, []);

  const value = {
    isInitialized,
    isLoggedIn,
    me,
    userData,
    logIn,
    logOut,
    signUp,
  };

  if (!isInitialized) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
