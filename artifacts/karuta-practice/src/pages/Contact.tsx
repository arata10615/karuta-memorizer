import { useState } from "react";
import PageLayout from "@/components/PageLayout";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <PageLayout title="お問い合わせ">
        <div className="contact-thanks">
          <p className="contact-thanks-title">お問い合わせありがとうございます</p>
          <p>内容を確認のうえ、必要に応じてご連絡いたします。</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="お問い合わせ">
      <p className="page-intro">
        ご質問・ご要望・不具合のご報告など、お気軽にお問い合わせください。
      </p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-name">
            お名前<span className="form-optional">（任意）</span>
          </label>
          <input
            id="contact-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="お名前"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-email">
            メールアドレス<span className="form-optional">（任意）</span>
          </label>
          <input
            id="contact-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-message">
            お問い合わせ内容<span className="form-required">（必須）</span>
          </label>
          <textarea
            id="contact-message"
            className="form-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="お問い合わせ内容をご記入ください"
            rows={6}
            required
          />
        </div>
        <button
          type="submit"
          className="form-submit"
          disabled={!message.trim() || sending}
        >
          {sending ? "送信中..." : "送信する"}
        </button>
      </form>
    </PageLayout>
  );
}
