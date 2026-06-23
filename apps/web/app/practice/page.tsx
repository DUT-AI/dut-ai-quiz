"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Coins, RotateCcw, Home, Shield, Swords, Zap, Timer, Flame, Trophy, Skull } from "lucide-react";
import { toast } from "sonner";

import BossHud from "@/components/organisms/boss-hud";
import ItemHotbar, { ItemType } from "@/components/organisms/item-hotbar";

// Mock Questions List (10 questions representing a 3-stage game)
const MOCK_QUESTIONS = [
  // STAGE 1: Easy (Questions 1 - 3)
  {
    id: "q1",
    content: "Đâu là từ khóa dùng để khai báo một hằng số không thể thay đổi giá trị trong JavaScript?",
    options: [
      { id: "a", text: "var", is_correct: false },
      { id: "b", text: "let", is_correct: false },
      { id: "c", text: "const", is_correct: true },
      { id: "d", text: "constant", is_correct: false }
    ],
  },
  {
    id: "q2",
    content: "Trong CSS, thuộc tính nào được sử dụng để căn giữa các phần tử flex theo trục dọc (cross axis)?",
    options: [
      { id: "a", text: "justify-content", is_correct: false },
      { id: "b", text: "align-items", is_correct: true },
      { id: "c", text: "align-content", is_correct: false },
      { id: "d", text: "text-align", is_correct: false }
    ],
  },
  {
    id: "q3",
    content: "Thành phần nào trong HTML5 được dùng để vẽ đồ họa động trực tiếp qua mã JavaScript?",
    options: [
      { id: "a", text: "<svg>", is_correct: false },
      { id: "b", text: "<graphics>", is_correct: false },
      { id: "c", text: "<canvas>", is_correct: true },
      { id: "d", text: "<paint>", is_correct: false }
    ],
  },
  // STAGE 2: Medium (Questions 4 - 6) - Quest 5 is MID-BOSS
  {
    id: "q4",
    content: "Trong React, Hook nào được dùng để lưu trữ một giá trị có thể thay đổi nhưng không kích hoạt việc re-render component?",
    options: [
      { id: "a", text: "useState", is_correct: false },
      { id: "b", text: "useMemo", is_correct: false },
      { id: "c", text: "useRef", is_correct: true },
      { id: "d", text: "useCallback", is_correct: false }
    ],
  },
  // MID-BOSS Battle: Cyber Golem (Question 5)
  {
    id: "q5",
    content: "🛡️ [MID-BOSS BATTLE] Độ phức tạp thuật toán tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp là gì?",
    options: [
      { id: "a", text: "O(1)", is_correct: false },
      { id: "b", text: "O(n)", is_correct: false },
      { id: "c", text: "O(log n)", is_correct: true },
      { id: "d", text: "O(n log n)", is_correct: false }
    ],
    isBoss: true,
    bossName: "CYBER GOLEM",
    bossLvl: 12,
  },
  {
    id: "q6",
    content: "Trong Node.js, lệnh nào được sử dụng để export một module theo định dạng CommonJS?",
    options: [
      { id: "a", text: "export default", is_correct: false },
      { id: "b", text: "module.exports", is_correct: true },
      { id: "c", text: "export.modules", is_correct: false },
      { id: "d", text: "export", is_correct: false }
    ],
  },
  // STAGE 3: Hard (Questions 7 - 10) - Quest 10 is FINAL BOSS
  {
    id: "q7",
    content: "Giao thức truyền tải siêu văn bản bảo mật HTTPS hoạt động mặc định trên cổng mạng nào?",
    options: [
      { id: "a", text: "80", is_correct: false },
      { id: "b", text: "8080", is_correct: false },
      { id: "c", text: "443", is_correct: true },
      { id: "d", text: "8443", is_correct: false }
    ],
  },
  {
    id: "q8",
    content: "Mục đích chính của chỉ mục (Index) trong cơ sở dữ liệu quan hệ (RDBMS) là gì?",
    options: [
      { id: "a", text: "Tăng tính toàn vẹn của dữ liệu", is_correct: false },
      { id: "b", text: "Nén dung lượng lưu trữ bảng dữ liệu", is_correct: false },
      { id: "c", text: "Tối ưu hóa tốc độ truy vấn SELECT", is_correct: true },
      { id: "d", text: "Tự động mã hóa dữ liệu nhạy cảm", is_correct: false }
    ],
  },
  {
    id: "q9",
    content: "Đâu là cơ chế bảo mật dùng để ngăn chặn tấn công giả mạo yêu cầu chéo trang (Cross-Site Request Forgery)?",
    options: [
      { id: "a", text: "CORS (Cross-Origin Resource Sharing)", is_correct: false },
      { id: "b", text: "CSRF Token", is_correct: true },
      { id: "c", text: "XSS Filtering", is_correct: false },
      { id: "d", text: "JWT Authorization", is_correct: false }
    ],
  },
  // FINAL BOSS Battle: Void Eye (Question 10)
  {
    id: "q10",
    content: "👁️ [FINAL BOSS BATTLE] Phương pháp mã hóa nào sử dụng một cặp khóa: khóa công khai (public key) và khóa bí mật (private key)?",
    options: [
      { id: "a", text: "Mã hóa đối xứng (Symmetric Encryption)", is_correct: false },
      { id: "b", text: "Mã hóa bất đối xứng (Asymmetric Encryption)", is_correct: true },
      { id: "c", text: "Mã hóa một chiều (Hashing Function)", is_correct: false },
      { id: "d", text: "Mã hóa Base64", is_correct: false }
    ],
    isBoss: true,
    bossName: "OVERLORD VOID EYE",
    bossLvl: 25,
  },
];

export default function PracticeGamePage() {
  const router = useRouter();

  // ─── CHARACTER GAME STATE ───
  const [stage, setStage] = useState(1); // Floor/Stage: 1, 2, 3
  const [hp, setHp] = useState(3); // Hearts/Health: 1 to 5 (Cap 5)
  const [gold, setGold] = useState(0); // Gold collected in match
  const [score, setScore] = useState(0); // Score collected
  const [currentIdx, setCurrentIdx] = useState(0); // 0 to 9 questions
  const [stageProgress, setStageProgress] = useState<("correct" | "incorrect" | "idle")[]>(
    Array.from({ length: 10 }).map(() => "idle")
  );

  // ─── BOSS BATTLE STATE ───
  const [bossHp, setBossHp] = useState(100);
  const [bossMaxHp, setBossMaxHp] = useState(100);
  const [bossStatus, setBossStatus] = useState<"idle" | "attack" | "damage" | "defeat">("idle");
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);

  // ─── ITEM HOTBAR STATE ───
  const [ownedItems, setOwnedItems] = useState<Record<ItemType, number>>({
    "50-50": 0,
    freeze: 0,
    double: 0,
    shield: 0,
  });
  const [shieldActive, setShieldActive] = useState(false); // Protects HP on wrong answer
  const [doubleActive, setDoubleActive] = useState(false); // Double score on current question
  const [shieldPurchasedInStage, setShieldPurchasedInStage] = useState(false); // Cap 1 per stage

  // ─── QUESTION CARD STATE ───
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]); // 50/50 hidden options
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // ─── TIMER STATE ───
  const [timeLeft, setTimeLeft] = useState(15); // 15s per normal question
  const [timerMax, setTimerMax] = useState(15);
  const [timerFrozen, setTimerFrozen] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── SCREEN SHAKE VISUAL EFFECT ───
  const [screenShake, setScreenShake] = useState(false);

  // ─── GAME OVER / VICTORY OVERLAYS ───
  const [gameResult, setGameResult] = useState<"playing" | "victory" | "defeat">("playing");

  const currentQuestion = MOCK_QUESTIONS[currentIdx];

  // Initialize and run time limit timer
  useEffect(() => {
    if (gameResult !== "playing" || showBossWarning || isAnswered) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    // Set time limit based on boss battle
    const limit = currentQuestion.isBoss ? 10 : 15; // Boss battles only give 10 seconds!
    setTimerMax(limit);
    if (!isAnswered) {
      setTimeLeft(limit);
    }

    timerIntervalRef.current = setInterval(() => {
      if (timerFrozen) return;

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, timerFrozen, showBossWarning, isAnswered, gameResult]);

  // Trigger Boss Warning alert at Questions 5 and 10
  useEffect(() => {
    if (currentQuestion.isBoss && !isBossMode) {
      setShowBossWarning(true);
      setBossHp(100);
      setBossMaxHp(currentQuestion.bossName === "OVERLORD VOID EYE" ? 150 : 100);
      setBossStatus("idle");
      
      const timer = setTimeout(() => {
        setShowBossWarning(false);
        setIsBossMode(true);
      }, 2000); // 2s screen warning alert
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // Handle Timeout
  const handleTimeOut = () => {
    toast.error("Hết thời gian suy nghĩ!");
    submitAnswer(null);
  };

  // Submit Answer Action
  const submitAnswer = (optionId: string | null) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    const isCorrect = optionId !== null && currentQuestion.options.find(o => o.id === optionId)?.is_correct === true;

    // Resolve answer check
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  // Correct Answer Handler
  const handleCorrectAnswer = () => {
    toast.success("Chính xác! Thêm vàng thưởng.");
    
    // Reward calculation based on fast answers and Boss mode
    let goldReward = currentQuestion.isBoss ? 80 : 40;
    if (timeLeft > timerMax * 0.7) {
      goldReward += currentQuestion.isBoss ? 40 : 20; // Fast bonus
    }
    
    let scoreReward = currentQuestion.isBoss ? 200 : 100;
    if (doubleActive) {
      scoreReward *= 2;
      setDoubleActive(false);
      toast.success("Bùa Nhân Phẩm kích hoạt! Nhân đôi điểm số.");
    }

    setGold((prev) => prev + goldReward);
    setScore((prev) => prev + scoreReward);

    // Update progress dots
    setStageProgress((prev) => {
      const copy = [...prev];
      copy[currentIdx] = "correct";
      return copy;
    });

    // Boss damage or normal battle transition
    if (isBossMode) {
      setBossStatus("damage");
      const damageAmt = currentQuestion.bossName === "OVERLORD VOID EYE" ? 75 : 100; // 2 correct hits for final boss, 1 for mid boss
      setBossHp((prev) => {
        const nextHp = Math.max(0, prev - damageAmt);
        if (nextHp === 0) {
          setBossStatus("defeat");
          setTimeout(() => {
            setIsBossMode(false);
            toast.success(`Đã tiêu diệt Boss ${currentQuestion.bossName}! Thưởng qua ải +2 Mạng.`);
            setHp((prevHp) => Math.min(5, prevHp + 2)); // Recover 2 lives, Cap at 5
          }, 800);
        }
        return nextHp;
      });
    }
  };

  // Incorrect Answer Handler
  const handleIncorrectAnswer = () => {
    // Screen shake trigger
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    // Update progress dots
    setStageProgress((prev) => {
      const copy = [...prev];
      copy[currentIdx] = "incorrect";
      return copy;
    });

    if (shieldActive) {
      setShieldActive(false);
      toast.info("Khiên hộ mệnh vỡ tan! Bảo toàn sinh mệnh.");
      return;
    }

    // Deduct HP
    const livesDeducted = currentQuestion.isBoss ? 2 : 1; // Boss battle causes 2 HP loss!
    toast.error(currentQuestion.isBoss ? `Sai rồi! Boss tấn công làm mất 2 mạng.` : `Chọn sai rồi! Mất 1 mạng.`);
    
    if (isBossMode) {
      setBossStatus("attack");
      setTimeout(() => setBossStatus("idle"), 1000);
    }

    setHp((prev) => {
      const nextHp = Math.max(0, prev - livesDeducted);
      if (nextHp === 0) {
        setTimeout(() => setGameResult("defeat"), 800);
      }
      return nextHp;
    });
  };

  // Move to Next Question
  const nextQuestion = () => {
    // Update Stage/Floor progress
    if (currentIdx === 2) {
      setStage(2);
      toast.info("CẬP NHẬT TẦNG 2: MỨC ĐỘ KHÓ TRUNG BÌNH");
      setShieldPurchasedInStage(false); // Reset shield purchase cap
    } else if (currentIdx === 5) {
      setStage(3);
      toast.info("CẬP NHẬT TẦNG 3: MỨC ĐỘ KHÓ CAO");
      setShieldPurchasedInStage(false);
    }

    if (currentIdx + 1 >= MOCK_QUESTIONS.length) {
      setGameResult("victory");
      return;
    }

    setCurrentIdx((prev) => prev + 1);
    setIsAnswered(false);
    setSelectedOptionId(null);
    setHiddenOptions([]);
    setTimerFrozen(false);
  };

  // ─── PURCHASE ITEMS LOGIC ───
  const handlePurchaseItem = (type: ItemType) => {
    let cost = type === "50-50" ? 100 : type === "freeze" ? 150 : type === "double" ? 200 : 250;
    
    // Boss battle item prices double! (x2 price)
    if (isBossMode) {
      cost *= 2;
    }

    if (gold < cost) {
      toast.error("Không đủ vàng!");
      return;
    }

    if (type === "shield" && shieldPurchasedInStage) {
      toast.error("Mỗi tầng ải chỉ được mua tối đa 1 khiên!");
      return;
    }

    setGold((prev) => prev - cost);
    setOwnedItems((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));

    if (type === "shield") {
      setShieldPurchasedInStage(true);
    }

    toast.success(`Đã mua vật phẩm hỗ trợ thành công!`);
  };

  // ─── USE ITEMS LOGIC ───
  const handleUseItem = (type: ItemType) => {
    if (ownedItems[type] <= 0) return;

    setOwnedItems((prev) => ({
      ...prev,
      [type]: prev[type] - 1,
    }));

    if (type === "50-50") {
      // Eliminate 2 wrong answers
      const incorrectOptions = currentQuestion.options.filter(o => !o.is_correct).map(o => o.id);
      // Pick 2 random incorrect options to hide
      const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
      setHiddenOptions([shuffled[0], shuffled[1]]);
      toast.info("Kính hiển vi (50/50) kích hoạt! Loại bỏ 2 phương án sai.");
    } else if (type === "freeze") {
      setTimerFrozen(true);
      toast.info("Đóng Băng kích hoạt! Thời gian suy nghĩ tạm dừng.");
    } else if (type === "double") {
      setDoubleActive(true);
      toast.info("Bùa Nhân Phẩm kích hoạt! Điểm thưởng x2.");
    } else if (type === "shield") {
      setShieldActive(true);
      toast.info("Khiên hộ mệnh bảo vệ! Sẵn sàng chống đỡ sát thương kế tiếp.");
    }
  };

  // Retry Game
  const handleRetry = () => {
    setStage(1);
    setHp(3);
    setGold(0);
    setScore(0);
    setCurrentIdx(0);
    setStageProgress(Array.from({ length: 10 }).map(() => "idle"));
    setBossHp(100);
    setBossStatus("idle");
    setIsBossMode(false);
    setOwnedItems({
      "50-50": 0,
      freeze: 0,
      double: 0,
      shield: 0,
    });
    setShieldActive(false);
    setDoubleActive(false);
    setShieldPurchasedInStage(false);
    setIsAnswered(false);
    setSelectedOptionId(null);
    setHiddenOptions([]);
    setTimerFrozen(false);
    setGameResult("playing");
  };

  return (
    <div 
      className={`min-h-screen bg-[#07070a] text-zinc-100 flex flex-col font-mono relative overflow-hidden select-none p-4 md:p-6 transition-all duration-300 ${
        screenShake ? "animate-[shake_0.5s_infinite]" : ""
      }`}
    >
      {/* Visual background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,24,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,24,0.7)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Rung man hinh animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -2px) rotate(-0.5deg); }
          20% { transform: translate(2px, -1px) rotate(0.5deg); }
          30% { transform: translate(-3px, 1px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(0.5deg); }
          50% { transform: translate(-1px, 2px) rotate(-0.5deg); }
          60% { transform: translate(2px, 1px) rotate(0deg); }
          70% { transform: translate(-2px, -1px) rotate(0.5deg); }
          80% { transform: translate(1px, 2px) rotate(-0.5deg); }
          90% { transform: translate(-2px, -2px) rotate(0.5deg); }
        }
      `}</style>

      {/* ─── HEADER HUD (RPG STATUS BAR) ─── */}
      <header className="relative w-full max-w-5xl mx-auto flex justify-between items-center bg-zinc-950/80 border border-zinc-800 p-4 rounded-none mb-4 z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        {/* Left Side: Avatar & Hearts */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 border-2 border-emerald-500 rounded-none bg-zinc-900 flex items-center justify-center font-extrabold text-sm text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              CẤP 5
            </div>
            {shieldActive && (
              <div className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-black border border-emerald-300 p-0.5 rounded-none shadow-[0_0_8px_#10b981]">
                <Shield className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 leading-tight">Danh hiệu: <span className="text-emerald-400 font-bold">Dũng Sĩ</span></span>
            {/* Heart Indicators */}
            <div className="flex gap-1.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const isHeartEmpty = i >= hp;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 1 }}
                    animate={{ scale: isHeartEmpty ? [1, 1.3, 0.9, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all duration-300 ${
                        isHeartEmpty 
                          ? "text-zinc-800 fill-zinc-950 scale-95 border-zinc-800" 
                          : "text-red-500 fill-red-500 filter drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                      }`} 
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Stage progress dot */}
        <div className="hidden md:flex flex-col items-center">
          <div className="text-[10px] text-zinc-500 mb-1 tracking-widest font-mono">TIẾN TRÌNH THỬ THÁCH</div>
          <div className="flex items-center gap-2">
            {stageProgress.map((status, i) => {
              const isActive = i === currentIdx;
              const isBossNode = MOCK_QUESTIONS[i].isBoss;

              return (
                <div 
                  key={i} 
                  className={`relative flex items-center justify-center ${
                    isBossNode ? "w-6 h-6" : "w-4.5 h-4.5"
                  }`}
                >
                  {/* Glowing active outline */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-none border border-cyan-400 animate-ping opacity-60" />
                  )}

                  <div
                    className={`w-3.5 h-3.5 border transition-all duration-300 flex items-center justify-center rounded-none text-[8px] font-bold ${
                      isActive
                        ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_#22d3ee]"
                        : status === "correct"
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : status === "incorrect"
                        ? "bg-red-600 border-red-500 text-white"
                        : isBossNode
                        ? "bg-zinc-900 border-red-500/50 text-red-500 animate-pulse"
                        : "bg-zinc-900 border-zinc-800 text-zinc-700"
                    }`}
                  >
                    {isBossNode ? "👹" : i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Gold counter and current score */}
        <div className="flex gap-4">
          {/* Gold Widget */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-zinc-500">TỔNG VÀNG</span>
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <Coins className="w-4 h-4 text-yellow-500 animate-pulse" />
              <span>🪙 {gold}</span>
            </div>
          </div>
          
          {/* Score Widget */}
          <div className="flex flex-col items-end border-l border-zinc-800 pl-4">
            <span className="text-[9px] text-zinc-500">ĐIỂM SỐ</span>
            <span className="text-cyan-400 font-bold tracking-wide">{score} PTS</span>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT WINDOW (RPG HUD VIEWPORT) ─── */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center relative z-10 py-2">
        <AnimatePresence mode="wait">
          {gameResult === "playing" ? (
            <motion.div 
              className="w-full flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ─── BOSS DISPLAY CONTROLLER ─── */}
              {isBossMode && (
                <BossHud 
                  status={bossStatus}
                  hp={bossHp}
                  maxHp={bossMaxHp}
                  name={currentQuestion.bossName || "BOSS"}
                  level={currentQuestion.bossLvl || 10}
                />
              )}

              {/* 🛡️ DYNAMIC TIMER BAR (Neon Shrinking Bar) */}
              <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-0.5 rounded-none mb-3 shadow-[0_0_8px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-2 py-0.5 border-b border-zinc-800/40">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{timerFrozen ? "THỜI GIAN ĐÃ ĐÓNG BĂNG" : "THỜI GIAN CO RÚT CHIẾN ĐẤU"}</span>
                  </span>
                  <span className={`${
                    timeLeft < 5 ? "text-red-500 animate-pulse font-bold" : "text-zinc-400"
                  }`}>
                    {timeLeft}s
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-950 rounded-none overflow-hidden relative">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${
                      timerFrozen
                        ? "from-sky-500 to-cyan-400 shadow-[0_0_8px_#06b6d4]"
                        : timeLeft > timerMax * 0.5
                        ? "from-emerald-500 to-green-400 shadow-[0_0_8px_#10b981]"
                        : timeLeft > timerMax * 0.25
                        ? "from-yellow-500 to-amber-400 shadow-[0_0_8px_#f59e0b]"
                        : "from-red-600 to-rose-500 shadow-[0_0_8px_#ef4444]"
                    }`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(timeLeft / timerMax) * 100}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
              </div>

              {/* ─── QUESTION CARD & ANSWERS GRID ─── */}
              <div className="w-full max-w-2xl bg-zinc-950 border-2 border-zinc-800 p-6 rounded-none relative shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                
                {/* Active Double Points Buff Indicator */}
                {doubleActive && (
                  <div className="absolute -top-3 -left-3 bg-yellow-500 text-black border-2 border-yellow-300 font-extrabold text-[10px] px-2 py-1 flex items-center gap-1 shadow-[0_0_12px_#eab308] z-20 animate-pulse">
                    <Flame className="w-3.5 h-3.5" />
                    <span>BUFF X2 ĐIỂM ĐANG HOẠT ĐỘNG</span>
                  </div>
                )}

                {/* Question Info Header */}
                <div className="flex justify-between items-center text-xs text-zinc-500 font-mono tracking-wider mb-4 border-b border-zinc-800 pb-2.5">
                  <span className="text-cyan-400 font-bold">
                    [ ẢI CHINH PHỤC CÂU HỎI {currentIdx + 1} / 10 ]
                  </span>
                  <span>TẦNG {stage} / 3</span>
                </div>

                {/* Question Body Text */}
                <h3 className="text-sm md:text-base font-bold leading-relaxed text-zinc-100 font-mono mb-6 min-h-[50px]">
                  {currentQuestion.content}
                </h3>

                {/* Answers Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;
                    const isCorrect = option.is_correct;
                    const isHidden = hiddenOptions.includes(option.id);

                    let btnStyles = "border-zinc-800 hover:border-zinc-500 text-zinc-300 bg-zinc-900/40";
                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyles = "border-emerald-500/80 bg-emerald-950/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]";
                      } else if (isSelected) {
                        btnStyles = "border-red-500/80 bg-red-950/20 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]";
                      } else {
                        btnStyles = "border-zinc-950 text-zinc-600 bg-zinc-900/10 opacity-30 cursor-default";
                      }
                    } else if (isHidden) {
                      btnStyles = "border-zinc-950 text-zinc-800 bg-zinc-950/10 opacity-10 cursor-not-allowed pointer-events-none";
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isAnswered || isHidden}
                        onClick={() => submitAnswer(option.id)}
                        className={`w-full text-left p-3.5 border transition-all duration-300 flex items-start gap-3 rounded-none relative group overflow-hidden ${btnStyles}`}
                      >
                        {/* Hover Sword slash visual highlight */}
                        {!isAnswered && !isHidden && (
                          <span className="absolute inset-y-0 left-0 w-1 bg-cyan-500 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300" />
                        )}

                        <span className="font-bold text-cyan-400 group-hover:text-white transition-colors duration-200">
                          {option.id.toUpperCase()}.
                        </span>
                        
                        <span className="text-xs leading-normal">
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Continue/Next Action Button */}
                {isAnswered && (
                  <motion.div
                    className="mt-6 flex justify-end"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="px-6 py-2.5 font-bold tracking-wider rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span>TIẾP TỤC HÀNH TRÌNH</span>
                      <Swords className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ─── VICTORY / DEFEAT END-GAME LAYOUTS ─── */
            <motion.div
              className="w-full max-w-md bg-zinc-950 border-2 border-zinc-800 p-8 rounded-none text-center shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {gameResult === "victory" ? (
                <>
                  <div className="w-16 h-16 bg-yellow-950/60 border border-yellow-500/40 rounded-none flex items-center justify-center mx-auto mb-4 animate-bounce text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-widest text-yellow-400 mb-2 font-mono">
                    CHINH PHỤC VICTORY!
                  </h2>
                  <p className="text-xs text-zinc-400 mb-6 font-mono">
                    Chúc mừng dũng sĩ! Bạn đã vượt qua 3 tầng tháp quái vật xuất sắc.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-950/60 border border-red-500/40 rounded-none flex items-center justify-center mx-auto mb-4 animate-pulse text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <Skull className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-widest text-red-500 mb-2 font-mono">
                    BẠN ĐÃ THẤT BẠI!
                  </h2>
                  <p className="text-xs text-zinc-400 mb-6 font-mono">
                    Đã hết sinh mệnh bảo toàn. Boss hoặc các thử thách đã hạ gục bạn.
                  </p>
                </>
              )}

              {/* End-Game Statistics Board */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 font-mono text-xs text-left mb-8 rounded-none space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-500">TỔNG ĐIỂM ĐẠT ĐƯỢC:</span>
                  <span className="font-bold text-cyan-400">{score} PTS</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-500">VÀNG ĐEM VỀ PHÒNG CHỜ:</span>
                  <span className="font-bold text-yellow-400">🪙 {gold} VÀNG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">ẢI XA NHẤT ĐẠT ĐƯỢC:</span>
                  <span className="font-bold text-white">ẢI {currentIdx + 1} / 10</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="py-2.5 px-4 font-bold rounded-none bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>TÁI ĐẤU</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="py-2.5 px-4 font-bold rounded-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>VỀ SẢNH</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── FOOTER HUD (ITEM HOTBAR) ─── */}
      <footer className="relative w-full max-w-5xl mx-auto mt-4 z-10">
        <ItemHotbar
          gold={gold}
          ownedItems={ownedItems}
          onPurchase={handlePurchaseItem}
          onUseItem={handleUseItem}
          disabled={showBossWarning || isAnswered || gameResult !== "playing"}
          maxShieldLimitReached={ownedItems["shield"] >= 1}
        />
      </footer>

      {/* ─── SCREEN WARNING POPUP ALERTS ─── */}
      <AnimatePresence>
        {showBossWarning && (
          <motion.div
            className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center text-center z-50 pointer-events-none select-none border-4 border-red-600/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 1, 0.9, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-red-600/5 animate-[pulse_0.4s_infinite]" />
            <motion.div
              initial={{ scale: 0.8, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="px-8 py-6 bg-black border-2 border-red-500 shadow-[0_0_50px_#ef4444] rounded-none max-w-md relative z-10"
            >
              <Skull className="w-16 h-16 text-red-500 mx-auto mb-4 animate-[bounce_0.6s_infinite] filter drop-shadow-[0_0_15px_#ef4444]" />
              <h1 className="text-2xl md:text-3xl font-black font-mono tracking-widest text-red-500 mb-2 animate-pulse">
                CẢNH BÁO: ĐẤU BOSS!
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider border-t border-zinc-900 pt-2.5">
                VÀNG MUA VẬT PHẨM X2 | ĐIỂM SỐ X2 | THỜI GIAN ẢI 10 GIÂY
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
