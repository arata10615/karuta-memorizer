import { ReactNode } from "react";
import { useLocation } from "wouter";
import SiteFooter from "./SiteFooter";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="page-layout">
      <header className="page-header">
        <a
          href="/"
          className="page-header-title"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          競技かるた 暗記練習
        </a>
        <a
          href="/game"
          className="page-header-play"
          onClick={(e) => {
            e.preventDefault();
            navigate("/game");
          }}
        >
          練習する
        </a>
      </header>
      <main className="page-main">
        <h1 className="page-title">{title}</h1>
        <div className="page-body">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
