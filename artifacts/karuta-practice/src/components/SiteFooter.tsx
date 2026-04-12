import { useLocation } from "wouter";

const NAV_LINKS = [
  { path: "/", label: "トップ" },
  { path: "/game", label: "練習する" },
  { path: "/howto", label: "使い方" },
  { path: "/about-memorization", label: "暗記時間とは" },
  { path: "/faq", label: "よくある質問" },
  { path: "/privacy", label: "プライバシーポリシー" },
  { path: "/contact", label: "お問い合わせ" },
];

export default function SiteFooter() {
  const [location, navigate] = useLocation();

  return (
    <footer className="site-footer">
      <nav className="footer-nav">
        {NAV_LINKS.map((link) => (
          <a
            key={link.path}
            href={link.path}
            className={`footer-link${location === link.path ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(link.path);
              window.scrollTo(0, 0);
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <p className="footer-copy">&copy; 2025 競技かるた暗記練習</p>
    </footer>
  );
}
