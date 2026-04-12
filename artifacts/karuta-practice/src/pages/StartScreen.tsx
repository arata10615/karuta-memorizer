import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ensureUser,
  getUserId,
  getDisplayName,
  isGoogleLinked,
  getGoogleClientId,
  loginWithGoogle,
  logout as doLogout,
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
  const [autoLogin, setAutoLogin] = useState(() => localStorage.getItem(AUTO_LOGIN_KEY) === "true");
  const [loggedIn, setLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const gsiInitialized = useRef(false);

  const syncLoginState = () => {
    const uid = getUserId();
    if (uid) {
      setLoggedIn(true);
      setDisplayName(getDisplayName());
      setGoogleLinked(isGoogleLinked());
    }
  };

  useEffect(() => {
    getGoogleClientId().then((id) => setGoogleClientId(id));

    const isAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === "true";

    if (isAutoLogin) {
      const existingUserId = getUserId();
      if (existingUserId) {
        syncLoginState();
        setLoading(false);
      } else {
        ensureUser().then(() => {
          syncLoginState();
          setLoading(false);
        });
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
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
      setAutoLogin(true);
    }
  }, []);

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

  const handleDeviceLogin = async () => {
    const userId = await ensureUser();
    if (userId) {
      syncLoginState();
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
      setAutoLogin(true);
    }
  };

  const handleAutoLoginToggle = () => {
    const next = !autoLogin;
    setAutoLogin(next);
    if (next && loggedIn) {
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
    } else if (!next) {
      localStorage.removeItem(AUTO_LOGIN_KEY);
    }
  };

  const handleLogout = () => {
    doLogout();
    localStorage.removeItem(AUTO_LOGIN_KEY);
    setLoggedIn(false);
    setDisplayName(null);
    setGoogleLinked(false);
    setAutoLogin(false);
    gsiInitialized.current = false;
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

          {!loggedIn ? (
            <>
              <button className="start-btn start-btn-login" onClick={handleDeviceLogin}>
                ログイン（デバイス）
              </button>
              <div className="google-login-area">
                {googleClientId ? (
                  <div ref={googleBtnRef} className="google-btn-container" />
                ) : (
                  <p className="google-not-configured">Google ログイン未設定</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="login-status-area">
                <p className="login-status">
                  {googleLinked ? "Google連携済み" : "デバイスログイン済み"}
                </p>
                {displayName && <p className="login-name">{displayName}</p>}
              </div>

              {!googleLinked && googleClientId && (
                <div className="google-login-area">
                  <div ref={googleBtnRef} className="google-btn-container" />
                </div>
              )}

              <button className="start-btn start-btn-logout" onClick={handleLogout}>
                ログアウト
              </button>
            </>
          )}
        </div>

        {loggedIn && (
          <label className="auto-login-label">
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={handleAutoLoginToggle}
            />
            <span>自動ログイン</span>
          </label>
        )}

        <nav className="start-footer-nav">
          {[
            { path: "/howto", label: "使い方" },
            { path: "/about-memorization", label: "暗記時間とは" },
            { path: "/faq", label: "よくある質問" },
            { path: "/privacy", label: "プライバシーポリシー" },
            { path: "/contact", label: "お問い合わせ" },
          ].map((link) => (
            <a
              key={link.path}
              href={link.path}
              className="start-footer-link"
              onClick={(e) => {
                e.preventDefault();
                navigate(link.path);
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
