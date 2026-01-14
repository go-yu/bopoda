"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PROBLEMS, type Problem } from "./problems.generated";
import {
  applyChar,
  computeMetrics,
  makeInitialState,
  startGame,
  tick,
} from "./engine";

/* ===============================
 * 音声再生ユーティリティ
 * =============================== */
const playSE = (path: string, volume: number) => {
  if (volume <= 0) return;
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(e => console.warn("SE playback blocked:", e));
};

export default function TypingGame() {
  const [scene, setScene] = useState<'title' | 'settings' | 'level' | 'playing' | 'result'>('title');
  const [isPaused, setIsPaused] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 設定状態 ---
  const [showPinyin, setShowPinyin] = useState(false);
  const [rate, setRate] = useState(0.9);
  const [volVoice, setVolVoice] = useState(0.8);
  const [volSE, setVolSE] = useState(0.8);
  const [volBGM, setVolBGM] = useState(0.0);

  // --- ロード画面の実装 ---
  useEffect(() => {
    const audioAssets = ["/music/otomenoinori_right.mp3", "/music/sakobt.mp3", "/music/lowbon.mp3"];
    let loadedCount = 0;
    const checkLoad = () => {
      loadedCount++;
      if (loadedCount === audioAssets.length) setIsLoaded(true);
    };
    audioAssets.forEach(src => {
      const audio = new Audio();
      audio.src = src;
      audio.addEventListener('canplaythrough', checkLoad, { once: true });
      audio.load();
    });
    const timer = setTimeout(() => setIsLoaded(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // 1. LocalStorage 読み込み
  useEffect(() => {
    const getSaved = (key: string) => localStorage.getItem(`zh-typing-${key}`);
    const sP = getSaved("showPinyin");
    const sR = getSaved("rate");
    const sVV = getSaved("volVoice");
    const sSE = getSaved("volSE");
    const sBGM = getSaved("volBGM");

    if (sP !== null) setShowPinyin(sP === "true");
    if (sR !== null) setRate(parseFloat(sR));
    if (sVV !== null) setVolVoice(parseFloat(sVV));
    if (sSE !== null) setVolSE(parseFloat(sSE));
    if (sBGM !== null) setVolBGM(parseFloat(sBGM));
  }, []);

  // 2. LocalStorage 保存
  useEffect(() => {
    const setSaved = (key: string, val: any) => localStorage.setItem(`zh-typing-${key}`, String(val));
    setSaved("showPinyin", showPinyin);
    setSaved("rate", rate);
    setSaved("volVoice", volVoice);
    setSaved("volSE", volSE);
    setSaved("volBGM", volBGM);
  }, [showPinyin, rate, volVoice, volSE, volBGM]);

  // --- BGM制御 ---
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (scene === 'playing' && !isPaused && volBGM > 0) {
      if (!bgmRef.current) {
        bgmRef.current = new Audio("/music/otomenoinori_right.mp3");
        bgmRef.current.loop = true;
      }
      bgmRef.current.volume = volBGM;
      bgmRef.current.play().catch(() => {});
    } else if (bgmRef.current) {
      bgmRef.current.pause();
      if (scene !== 'playing') bgmRef.current.currentTime = 0;
    }
  }, [scene, isPaused, volBGM]);

  // --- ゲームロジック ---
  const [selectedLevelName, setSelectedLevelName] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<number>(60);
  const problems = useMemo(() => PROBLEMS, []);
  const filteredProblems = useMemo(() => selectedLevelName ? problems.filter(p => p.level === selectedLevelName) : problems, [selectedLevelName, problems]);
  const [state, setState] = useState(() => makeInitialState(problems[0] || { id: "0", bopomofo: "", gloss: "" }, 60));
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const lastSpokenKeyRef = useRef<string>("");

  const LEVELS = [
    { id: "pre", label: "TOCFL準備級", time: 60, cost: "お手軽" },
    { id: "intro", label: "TOCFL入門級", time: 60, cost: "お勧め" },
    { id: "basic", label: "TOCFL基礎級", time: 90, cost: "標準" },
    { id: "adv", label: "TOCFL進階級", time: 90, cost: "応用" },
    { id: "high", label: "TOCFL高階級", time: 120, cost: "高級" },
    { id: "fluent", label: "TOCFL流利級", time: 120, cost: "ネイティブ" },
  ];

  const KEY_TO_ZHUYIN: Record<string, string> = {
    "1": "ㄅ", q: "ㄆ", a: "ㄇ", z: "ㄈ", "2": "ㄉ", w: "ㄊ", s: "ㄋ", x: "ㄌ",
    e: "ㄍ", d: "ㄎ", c: "ㄏ", r: "ㄐ", f: "ㄑ", v: "ㄒ", "5": "ㄓ", t: "ㄔ",
    g: "ㄕ", b: "ㄖ", y: "ㄗ", h: "ㄘ", n: "ㄙ", u: "ㄧ", j: "ㄨ", m: "ㄩ",
    "8": "ㄚ", i: "ㄛ", k: "ㄜ", ",": "ㄝ", "9": "ㄞ", o: "ㄟ", l: "ㄠ", ".": "ㄡ",
    "0": "ㄢ", p: "ㄣ", ";": "ㄤ", "/": "ㄥ", "-": "ㄦ", "6": "ˊ", "3": "ˇ", "4": "ˋ", "7": "˙",
  };

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = voices.find(v => v.lang === "zh-TW") || voices.find(v => v.lang.startsWith("zh")) || null;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  useEffect(() => {
    if (scene !== 'playing' || isPaused) return;
    const id = window.setInterval(() => {
      setState(s => {
        const newState = tick(s, Date.now());
        if (newState.done) setScene('result');
        return newState;
      });
    }, 50);
    return () => window.clearInterval(id);
  }, [scene, isPaused]);

  useEffect(() => {
    if (scene !== 'playing' || isPaused || !state.current?.gloss) return;
    const key = `${state.current.bopomofo}||${state.current.gloss}`;
    if (key === lastSpokenKeyRef.current) return;
    lastSpokenKeyRef.current = key;
    if (volVoice > 0) {
      window.speechSynthesis.cancel();
      const uttr = new SpeechSynthesisUtterance(state.current.gloss);
      uttr.lang = "zh-TW";
      if (voiceRef.current) uttr.voice = voiceRef.current;
      uttr.volume = volVoice;
      uttr.rate = rate;
      window.speechSynthesis.speak(uttr);
    }
  }, [state.current, scene, isPaused, volVoice, rate]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (scene !== 'playing') return;
      if (isPaused) {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsPaused(false);
          window.focus();
          setState(prev => startGame(prev, Date.now()));
        }
        return;
      }
      const zhuyin = KEY_TO_ZHUYIN[e.key.toLowerCase()];
      if (zhuyin) {
        e.preventDefault();
        setState(prev => {
          const isCorrect = zhuyin === prev.current.bopomofo[prev.index];
          playSE(isCorrect ? "/music/sakobt.mp3" : "/music/lowbon.mp3", volSE);
          return applyChar(prev, zhuyin, () => filteredProblems[Math.floor(Math.random() * filteredProblems.length)]);
        });
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [scene, isPaused, filteredProblems, volSE]);

  const startLevel = (levelLabel: string, time: number) => {
    setSelectedLevelName(levelLabel);
    setSelectedTime(time);
    const levelList = problems.filter(p => p.level === levelLabel);
    const firstProblem = levelList.length > 0 ? levelList[Math.floor(Math.random() * levelList.length)] : problems[0];
    setState(makeInitialState(firstProblem, time));
    setIsPaused(true);
    setScene('playing');
  };

  const retryLevel = () => {
    startLevel(selectedLevelName, selectedTime);
  };

  if (!isLoaded) return <div style={styles.wrapper}><div style={styles.centered}><div style={styles.pauseText}>読み込み中...</div></div></div>;

  const { cpm, accuracy } = computeMetrics(state);

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        {scene === 'title' && (
          <div style={styles.centered}>
            {/* サブタイトルをプロジェクト名のように配置 */}
            <div style={styles.titleLabel}>BOPO TYPING</div>
            <h1 style={styles.logo}>ボポ打</h1>
            <div style={styles.menuList}>
              <button style={styles.mainBtn} onClick={() => setScene('level')}>スタート</button>
              <button style={styles.subBtn} onClick={() => setScene('settings')}>設定</button>
              <Link href="/" style={styles.textBtn}>説明・規約ページへ戻る</Link>
            </div>
          </div>
        )}

        {scene === 'settings' && (
          <div style={styles.centered}>
            <h2 style={styles.heading}>設定</h2>
            <div style={styles.settingsGrid}>
              <div style={styles.settingRow}>
                <label htmlFor="pinyin-toggle">ピンイン表示</label>
                <input id="pinyin-toggle" type="checkbox" checked={showPinyin} onChange={e => setShowPinyin(e.target.checked)} />
              </div>
              <div style={styles.settingRow}><label>読み上げ音量 ({Math.round(volVoice * 100)}%)</label><input type="range" min="0" max="1" step="0.1" value={volVoice} onChange={e => setVolVoice(parseFloat(e.target.value))} /></div>
              <div style={styles.settingRow}><label>打鍵音 (SE) ({Math.round(volSE * 100)}%)</label><input type="range" min="0" max="1" step="0.1" value={volSE} onChange={e => setVolSE(parseFloat(e.target.value))} /></div>
              <div style={styles.settingRow}><label>BGM音量 ({Math.round(volBGM * 100)}%)</label><input type="range" min="0" max="1" step="0.1" value={volBGM} onChange={e => setVolBGM(parseFloat(e.target.value))} /></div>
              <div style={styles.settingRow}><label>読み上げ速度 ({rate.toFixed(1)}x)</label><input type="range" min="0.5" max="2.0" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))} /></div>
            </div>
            <button style={styles.backBtn} onClick={() => setScene('title')}>保存して閉じる</button>
            <div style={styles.creditContainer}>
              <a href="https://pocket-se.info/" target="_blank" rel="noopener noreferrer" style={styles.creditLink} aria-label="ポケットサウンドの効果音素材サイトへ">
                ポケットサウンド/効果音素材
              </a>
            </div>
          </div>
        )}

        {scene === 'level' && (
          <div style={styles.centered}>
            <h2 style={styles.heading}>レベル選択</h2>
            <div style={styles.levelGrid}>
              {LEVELS.map(l => (
                <button key={l.id} style={styles.levelCard} onClick={() => startLevel(l.label, l.time)}>
                  <div style={styles.levelCost}>{l.cost}</div>
                  <div style={styles.levelName}>{l.label}</div>
                  <div style={styles.levelTime}>{l.time}秒</div>
                </button>
              ))}
            </div>
            <button style={styles.textBtn} onClick={() => setScene('title')}>戻る</button>
          </div>
        )}

        {scene === 'playing' && (
          <div style={styles.gameWrapper}>
            <div style={styles.gameHeader}>
              <button style={styles.exitBtn} onClick={() => setScene('level')}>← やめる</button>
              <div style={styles.gameStats}><span>{selectedLevelName}</span><span>{(state.timeLeftMs / 1000).toFixed(1)}s</span><span>CPM: {cpm.toFixed(0)}</span><span>正解率: {(accuracy * 100).toFixed(1)}%</span></div>
            </div>
            <div style={styles.playZone}>
              {isPaused ? (
                <div style={styles.pauseOverlay}><div style={styles.pauseText}>スペースキーを押して開始</div><div style={styles.pauseSubText}>レベル: {selectedLevelName}</div></div>
              ) : (
                <>
                  <div style={styles.bopomofoDisplay} aria-live="polite"><span style={{ color: "#d1d5db" }}>{state.typedSoFar}</span><span style={{ color: "#111827" }}>{state.current.bopomofo.slice(state.index)}</span></div>
                  <div style={styles.glossDisplay}>{state.current.gloss}</div>
                  {state.current.ja && <div style={styles.jaDisplay}>{state.current.ja}</div>}
                  {showPinyin && (state.current as any).pinyin && <div style={styles.pinyinDisplay}>{(state.current as any).pinyin}</div>}
                </>
              )}
            </div>
          </div>
        )}

        {scene === 'result' && (
          <div style={styles.centered}>
            <h2 style={styles.heading}>結果発表</h2>
            <div style={styles.resultBox} role="region" aria-label="ゲーム結果"><div style={styles.resultItem}><span>レベル</span> <strong>{selectedLevelName}</strong></div><div style={styles.resultItem}><span>CPM</span> <strong>{cpm.toFixed(0)}</strong></div><div style={styles.resultItem}><span>正確率</span> <strong>{(accuracy * 100).toFixed(1)}%</strong></div></div>
            <div style={styles.menuList}>
              <button style={styles.mainBtn} onClick={retryLevel}>同じレベルで再挑戦</button>
              <button style={styles.subBtn} onClick={() => setScene('level')}>レベルを選び直す</button>
              <button style={styles.textBtn} onClick={() => setScene('title')}>
                タイトル・設定画面へ戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { backgroundColor: "#f3f4f6", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "system-ui, sans-serif" },
  mainContainer: { width: "800px", height: "540px", backgroundColor: "#ffffff", borderRadius: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", padding: "40px", overflow: "hidden", position: "relative" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" },
  titleLabel: { fontSize: "12px", color: "#9ca3af", fontWeight: "bold", letterSpacing: "4px" },
  logo: { fontSize: "60px", color: "#111827", margin: "10px 0 40px 0", fontWeight: "900" },
  menuList: { display: "flex", flexDirection: "column", gap: "16px", width: "300px", alignItems: "center" },
  mainBtn: { width: "100%", padding: "18px", backgroundColor: "#111827", color: "#ffffff", border: "none", borderRadius: "16px", fontSize: "20px", fontWeight: "bold", cursor: "pointer" },
  subBtn: { width: "100%", padding: "14px", backgroundColor: "#f9fafb", color: "#4b5563", border: "1px solid #e5e7eb", borderRadius: "16px", fontSize: "16px", cursor: "pointer" },
  heading: { fontSize: "24px", color: "#111827", marginBottom: "32px", fontWeight: "bold" },
  settingsGrid: { width: "100%", maxWidth: "450px", marginBottom: "20px" },
  settingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" },
  backBtn: { padding: "12px 48px", backgroundColor: "#111827", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", marginBottom: "16px" },
  creditContainer: { marginTop: "auto", paddingTop: "10px" },
  creditLink: { fontSize: "12px", color: "#9ca3af", textDecoration: "none" },
  levelGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" },
  levelCard: { padding: "20px", backgroundColor: "#ffffff", border: "2px solid #f3f4f6", borderRadius: "20px", textAlign: "left", cursor: "pointer" },
  levelCost: { fontSize: "12px", color: "#3b82f6", fontWeight: "bold", marginBottom: "2px" },
  levelName: { fontSize: "19px", fontWeight: "bold", color: "#111827" },
  levelTime: { fontSize: "13px", color: "#9ca3af", marginTop: "4px" },
  textBtn: { marginTop: "16px", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", textDecoration: "underline" },
  gameWrapper: { height: "100%", display: "flex", flexDirection: "column" },
  gameHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  exitBtn: { background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px" },
  gameStats: { display: "flex", gap: "20px", color: "#6b7280", fontSize: "13px", fontWeight: "bold" },
  playZone: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" },
  pauseOverlay: { textAlign: "center" },
  pauseText: { fontSize: "32px", fontWeight: "bold", color: "#111827", marginBottom: "8px" },
  pauseSubText: { fontSize: "18px", color: "#6b7280" },
  bopomofoDisplay: { fontSize: "84px", fontWeight: "800", letterSpacing: "8px" },
  glossDisplay: { fontSize: "32px", color: "#4b5563", marginTop: "12px" },
  jaDisplay: { fontSize: "20px", color: "#9ca3af", marginTop: "8px", fontWeight: "400" },
  pinyinDisplay: { fontSize: "18px", color: "#3b82f6", marginTop: "10px", fontWeight: "500", letterSpacing: "1px" },
  resultBox: { width: "100%", maxWidth: "550px", backgroundColor: "#f9fafb", borderRadius: "24px", padding: "32px", marginBottom: "40px" },
  resultItem: { display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "18px" }
};