import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ensureUser, getUserId } from "@/data/placementMemory";

const AUTO_LOGIN_KEY = "karuta_auto_login";

export default function StartScreen() {
  const [, navigate] = useLocation();
  const [autoLogin, setAutoLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(AUTO_LOGIN_KEY);
    if (saved === "true") {
      setAutoLogin(true);
      doLogin().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function doLogin() {
    const userId = await ensureUser();
    if (userId) setLoggedIn(true);
  }

  const handleLogin = async () => {
    await doLogin();
    if (autoLogin) {
      localStorage.setItem(AUTO_LOGIN_KEY, "true");
    }
  };

  const handleAutoLoginToggle = () => {
    const next = !autoLogin;
    setAutoLogin(next);
    if (!next) {
      localStorage.removeItem(AUTO_LOGIN_KEY);
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
          <button
            className={`start-btn start-btn-login ${loggedIn ? "start-btn-logged-in" : ""}`}
            onClick={handleLogin}
            disabled={loggedIn}
          >
            {loggedIn ? "ログイン済み" : "ログイン"}
          </button>
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
          <p className="login-status">配置データが記録されます</p>
        )}
      </div>
    </div>
  );
}
