import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdInterstitialProps {
  slot: string;
  onClose: () => void;
}

export default function AdInterstitial({ slot, onClose }: AdInterstitialProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle not loaded
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const pubId = (window as any).__ADSENSE_PUB_ID;

  return (
    <div className="ad-interstitial-overlay" onClick={onClose}>
      <div className="ad-interstitial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ad-interstitial-header">
          <span className="ad-interstitial-label">広告</span>
          <button className="ad-interstitial-close" onClick={onClose}>閉じる</button>
        </div>
        <div className="ad-interstitial-content">
          {pubId ? (
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: "300px", height: "250px" }}
              data-ad-client={pubId}
              data-ad-slot={slot}
              data-ad-format="rectangle"
              ref={adRef}
            />
          ) : (
            <div className="ad-placeholder">
              <p>広告スペース</p>
              <p className="ad-placeholder-sub">AdSense設定後に表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
