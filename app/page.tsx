"use client";

import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {/* 新しいネーミングに合わせて修正 */}
        <h1 style={styles.logo}>注音打</h1>
        <p style={styles.tagline}>BOPOMO TYPING</p>
        <p style={styles.subTagline}>台湾の注音符号（ボポモフォ）をマスターするタイピングゲーム</p>
      </header>

      <main style={styles.main}>
        {/* ゲーム説明 */}
        <section style={styles.section}>
          <h2 style={styles.title}>🎮 ゲームについて</h2>
          <p style={styles.text}>
            「注音打」は、台湾で使われている注音符号（Bopomofo）のタイピング練習ソフトです。<br />
            {/* 乙女の祈りのメロディに乗せて、楽しく注音符号のキー配列を習得しましょう。 */}
          </p>
          <div style={styles.warningBox}>
            <strong>⚠️ 注意:</strong> 本アプリは物理キーボード専用です。スマートフォンやタブレットのソフトウェアキーボードには対応していません。
          </div>
        </section>

        {/* 利用規約 */}
        <section style={styles.section}>
          <h2 style={styles.title}>📜 利用規約</h2>
          <div style={styles.scrollBox}>
            <p style={styles.smallText}>
              1. 本サービスは学習支援を目的としており、学習効果を保証するものではありません。<br />
              2. 本サービスの利用により生じた損害について、開発者は一切の責任を負いません。<br />
              3. 音声・効果音等の著作権は各素材提供元に帰属します。<br />
              4. 営利目的の二次利用や、プログラムの改ざん、不正なアクセスを禁止します。
            </p>
          </div>
        </section>

        {/* プライバシーポリシー */}
        <section style={styles.section}>
          <h2 style={styles.title}>🔒 プライバシーポリシー</h2>
          <div style={styles.scrollBox}>
            <p style={styles.smallText}>
              1. 当サイトでは、ゲーム設定やハイスコアの保存にブラウザのLocalStorageを使用します。<br />
              2. サービス改善のため、個人を特定しない形でのアクセス解析（Google Analytics等）を利用する場合があります。<br />
              3. 収集した情報は、法令に基づく場合を除き、第三者に提供することはありません。
            </p>
          </div>
        </section>

        <div style={styles.btnContainer}>
          <Link href="/game" style={styles.startBtn}>
            規約に同意してゲームを始める
          </Link>
        </div>
      </main>

      <footer style={styles.footer}>
        <p>&copy; BOPOMO TYPING</p>
        <p style={{ marginTop: "4px" }}>Sound Effect: ポケットサウンド</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { backgroundColor: "#f9fafb", minHeight: "100vh", padding: "40px 20px", fontFamily: "system-ui, sans-serif", color: "#111827" },
  header: { textAlign: "center", marginBottom: "40px" },
  logo: { fontSize: "64px", fontWeight: "900", marginBottom: "5px", letterSpacing: "-1px" },
  tagline: { fontSize: "20px", fontWeight: "bold", color: "#3b82f6", marginBottom: "8px", letterSpacing: "2px" },
  subTagline: { fontSize: "16px", color: "#6b7280" },
  main: { maxWidth: "700px", margin: "0 auto", backgroundColor: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" },
  section: { marginBottom: "32px" },
  title: { fontSize: "20px", fontWeight: "bold", marginBottom: "12px", borderLeft: "4px solid #111827", paddingLeft: "12px" },
  text: { fontSize: "16px", lineHeight: "1.6", color: "#374151" },
  warningBox: { marginTop: "16px", padding: "12px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "8px", color: "#92400e", fontSize: "14px" },
  scrollBox: { backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "12px", height: "100px", overflowY: "scroll", border: "1px solid #e5e7eb" },
  smallText: { fontSize: "13px", lineHeight: "1.6", color: "#6b7280" },
  btnContainer: { textAlign: "center", marginTop: "40px" },
  startBtn: { display: "inline-block", backgroundColor: "#111827", color: "#fff", padding: "18px 48px", borderRadius: "16px", fontSize: "20px", fontWeight: "bold", textDecoration: "none", transition: "all 0.2s ease" },
  footer: { textAlign: "center", marginTop: "40px", color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }
};