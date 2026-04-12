import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ensureUser,
  getUserId,
  getDisplayName,
  isGoogleLinked,
  getGoogleClientId,
  loginWithGoogle,
} from "@/data/placementMemory";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            el: HTMLElement,
            config: { theme?: string; size?: string; text?: string; shape?: string; width?: number }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const AUTO_LOGIN_KEY = "karuta_auto_login";

export default function StartScreen() {
  const [, navigate] = useLocation();
  const [autoLogin, setAutoLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gsiInitialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(AUTO_LOGIN_KEY);
    if (saved === "true") {
      setAutoLogin(true);
    }

    getGoogleClientId().then((id) => {
      setGoogleClientId(id);
    });

    if (saved === "true") {
      const existingUserId = getUserId();
      if (existingUserId) {
        setLoggedIn(true);
        setDisplayName(getDisplayName());
        setGoogleLinked(isGoogleLinked());
        setLoading(false);
      } else {
        doDeviceLogin().then(() => setLoading(false));
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    const user = await loginWithGoogle(response.credential);
    if (user) {
      setLoggedIn(true);
      setDisplayName(user.displayName);
      setGoogleLinked(true);
      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, "true");
      }
    }
  }, [autoLogin]);

  useEffect(() => {
    if (!googleClientId || gsiInitialized.current) return;
    if (loggedIn && googleLinked) return;

    const tryInit = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 280,
      });
      gsiInitialized.current = true;
      return true;
    };

    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [googleClientId, loggedIn, googleLinked, handleGoogleCallback]);

  async function doDeviceLogin() {
    const userId = await ensureUser();
    if (userId) {
      setLoggedIn(true);
      setDisplayName(getDisplayName());
      setGoogleLinked(isGoogleLinked());
    }
  }

  const handleDeviceLogin = async () => {
    await doDeviceLogin();
    if (autoLogin) {
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
    }
  };

  const handleAutoLoginToggle = () => {
    const next = !autoLogin;
    setAutoLogin(next);
    if (!next) {
      localStorage.removeItem(AUTO_LOGIN_KEY);
    } else if (loggedIn) {
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
    }
  };

  const handleStart = () => {
    navigate("/game");
  };

  if (loading) return null;

  return (
    <div className="start-screen">
      <div className="start-content">
        <h1 className="start-title">競技かるた</h1>
        <h2 className="start-subtitle">暗記練習</h2>

        <div className="start-buttons">
          <button className="start-btn start-btn-primary" onClick={handleStart}>
            スタート
          </button>

          {!loggedIn && (
            <button className="start-btn start-btn-login" onClick={handleDeviceLogin}>
              ログイン（デバイス）
            </button>
          )}

          {!loggedIn || !googleLinked ? (
            <div className="google-login-area">
              {googleClientId ? (
                <div ref={googleBtnRef} className="google-btn-container" />
              ) : (
                <p className="google-not-configured">Google ログイン未設定</p>
              )}
            </div>
          ) : null}
        </div>

        <label className="auto-login-label">
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={handleAutoLoginToggle}
          />
          <span>自動ログイン</span>
        </label>

        {loggedIn && (
          <div className="login-status-area">
            <p className="login-status">
              {googleLinked ? "Google連携済み" : "デバイスログイン済み"}
            </p>
            {displayName && (
              <p className="login-name">{displayName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
