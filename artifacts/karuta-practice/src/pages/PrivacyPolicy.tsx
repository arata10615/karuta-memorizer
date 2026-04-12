import PageLayout from "@/components/PageLayout";

export default function PrivacyPolicy() {
  return (
    <PageLayout title="プライバシーポリシー">
      <p className="page-intro">
        「競技かるた暗記練習」（以下「当サイト」）は、ユーザーの皆さまの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。
      </p>

      <section className="page-section">
        <h2>取得する情報について</h2>
        <p>
          当サイトでは、サービスの提供・改善のために、以下の情報を取得することがあります。
        </p>
        <ul className="page-list">
          <li>デバイスを識別するためのランダムなID（ブラウザのローカルストレージに保存されます）</li>
          <li>Googleアカウントと連携した場合の表示名・GoogleアカウントID</li>
          <li>かるた札の配置に関する操作データ（自動配置の学習に使用します）</li>
          <li>お問い合わせフォームで入力された名前・メールアドレス・お問い合わせ内容</li>
        </ul>
      </section>

      <section className="page-section">
        <h2>アクセス解析ツールについて</h2>
        <p>
          当サイトでは、サイトの利用状況を把握するために、Googleアナリティクスなどのアクセス解析ツールを利用する場合があります。
          アクセス解析ツールはCookieを使用してデータを収集しますが、このデータは匿名で収集されており、個人を特定するものではありません。
          データの収集はブラウザの設定でCookieを無効にすることで拒否できます。
        </p>
      </section>

      <section className="page-section">
        <h2>広告配信サービスについて</h2>
        <p>
          当サイトでは、第三者配信の広告サービス（Google AdSenseなど）を利用する場合があります。
          広告配信事業者は、ユーザーの興味に応じた広告を表示するために、
          Cookieを使用することがあります。
          Cookieの使用を望まない場合は、ブラウザの設定で無効にすることができます。
          詳しくはGoogleの広告に関するポリシーをご確認ください。
        </p>
      </section>

      <section className="page-section">
        <h2>Cookieの利用について</h2>
        <p>
          当サイトでは、サービスの提供やユーザー体験の向上のためにCookieやローカルストレージを使用しています。
          これにはログイン状態の保持、配置データの記録、アクセス解析、広告配信などが含まれます。
          ブラウザの設定でCookieの受け入れを拒否することも可能ですが、一部の機能が利用できなくなる場合があります。
        </p>
      </section>

      <section className="page-section">
        <h2>お問い合わせ情報の取り扱い</h2>
        <p>
          お問い合わせフォームから送信された情報は、お問い合わせへの回答や対応のためにのみ使用します。
          お預かりした情報を第三者に提供することはありません（法令に基づく場合を除きます）。
        </p>
      </section>

      <section className="page-section">
        <h2>情報の管理について</h2>
        <p>
          当サイトでは、取得した情報の漏えい・滅失・毀損の防止のため、適切なセキュリティ対策を講じます。
          お預かりした個人情報は、利用目的の範囲内で適切に管理いたします。
        </p>
      </section>

      <section className="page-section">
        <h2>プライバシーポリシーの変更について</h2>
        <p>
          当サイトは、必要に応じてプライバシーポリシーの内容を変更することがあります。
          変更後のプライバシーポリシーは、当ページに掲載した時点で効力を生じるものとします。
        </p>
      </section>

      <section className="page-section">
        <h2>お問い合わせ</h2>
        <p>
          プライバシーポリシーに関するご質問は、お問い合わせページよりご連絡ください。
        </p>
      </section>

      <p className="page-date">制定日：2025年4月12日</p>
    </PageLayout>
  );
}
