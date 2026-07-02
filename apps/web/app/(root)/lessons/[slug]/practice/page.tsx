"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Coins, RotateCcw, Home, Shield, Swords, Zap, Timer, Flame, Trophy, Skull, Lock, BookOpen } from "lucide-react";
import { toast } from "sonner";

import BossHud from "@/components/organisms/boss-hud";
import ItemHotbar, { ItemType } from "@/components/organisms/item-hotbar";
import { useLessons, useQuestions } from "@/lib/queries";

const getBossName = (stageNum: number) => {
  if (stageNum === 1) return "SLIME CHÚA";
  if (stageNum === 2) return "MA BÀN THẠCH";
  return "MA NHÃN TỐI THƯỢNG";
};

// Mock Questions List (15 questions representing a 3-stage game)
const MOCK_QUESTIONS = [
  // STAGE 1: Easy (Questions 1 - 5)
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
  {
    id: "q4",
    content: "Thẻ HTML nào được sử dụng để tạo một liên kết (hyperlink)?",
    options: [
      { id: "a", text: "<link>", is_correct: false },
      { id: "b", text: "<a>", is_correct: true },
      { id: "c", text: "<href>", is_correct: false },
      { id: "d", text: "<a> liên kết", is_correct: false }
    ],
  },
  {
    id: "q5",
    content: "Trong CSS, thuộc tính nào dùng để thay đổi màu nền của một phần tử?",
    options: [
      { id: "a", text: "color", is_correct: false },
      { id: "b", text: "background-color", is_correct: true },
      { id: "c", text: "bgcolor", is_correct: false },
      { id: "d", text: "border-color", is_correct: false }
    ],
  },
  // STAGE 2: Medium (Questions 6 - 10)
  {
    id: "q6",
    content: "Trong React, Hook nào được dùng để lưu trữ một giá trị có thể thay đổi nhưng không kích hoạt việc re-render component?",
    options: [
      { id: "a", text: "useState", is_correct: false },
      { id: "b", text: "useMemo", is_correct: false },
      { id: "c", text: "useRef", is_correct: true },
      { id: "d", text: "useCallback", is_correct: false }
    ],
  },
  {
    id: "q7",
    content: "Trong Node.js, lệnh nào được sử dụng để export một module theo định dạng CommonJS?",
    options: [
      { id: "a", text: "export default", is_correct: false },
      { id: "b", text: "module.exports", is_correct: true },
      { id: "c", text: "export.modules", is_correct: false },
      { id: "d", text: "export", is_correct: false }
    ],
  },
  {
    id: "q8",
    content: "Trong CSS, đơn vị nào dưới đây tương đối theo kích thước font của phần tử cha (parent)?",
    options: [
      { id: "a", text: "px", is_correct: false },
      { id: "b", text: "rem", is_correct: false },
      { id: "c", text: "em", is_correct: true },
      { id: "d", text: "vh", is_correct: false }
    ],
  },
  {
    id: "q9",
    content: "Đâu là phương thức JavaScript dùng để chuyển đổi một chuỗi JSON thành một đối tượng JavaScript?",
    options: [
      { id: "a", text: "JSON.stringify()", is_correct: false },
      { id: "b", text: "JSON.parse()", is_correct: true },
      { id: "c", text: "JSON.toObject()", is_correct: false },
      { id: "d", text: "JSON.convert()", is_correct: false }
    ],
  },
  {
    id: "q10",
    content: "Trong React, thuộc tính nào là bắt buộc khi render một danh sách phần tử bằng phương thức map() để giúp tối ưu re-render?",
    options: [
      { id: "a", text: "id", is_correct: false },
      { id: "b", text: "key", is_correct: true },
      { id: "c", text: "index", is_correct: false },
      { id: "d", text: "ref", is_correct: false }
    ],
  },
  // STAGE 3: Hard (Questions 11 - 15)
  {
    id: "q11",
    content: "Giao thức truyền tải siêu văn bản bảo mật HTTPS hoạt động mặc định trên cổng mạng nào?",
    options: [
      { id: "a", text: "80", is_correct: false },
      { id: "b", text: "8080", is_correct: false },
      { id: "c", text: "443", is_correct: true },
      { id: "d", text: "8443", is_correct: false }
    ],
  },
  {
    id: "q12",
    content: "Mục đích chính của chỉ mục (Index) trong cơ sở dữ liệu quan hệ (RDBMS) là gì?",
    options: [
      { id: "a", text: "Tăng tính toàn vẹn của dữ liệu", is_correct: false },
      { id: "b", text: "Nén dung lượng lưu trữ bảng dữ liệu", is_correct: false },
      { id: "c", text: "Tối ưu hóa tốc độ truy vấn SELECT", is_correct: true },
      { id: "d", text: "Tự động mã hóa dữ liệu nhạy cảm", is_correct: false }
    ],
  },
  {
    id: "q13",
    content: "Đâu là cơ chế bảo mật dùng để ngăn chặn tấn công giả mạo yêu cầu chéo trang (Cross-Site Request Forgery)?",
    options: [
      { id: "a", text: "CORS (Cross-Origin Resource Sharing)", is_correct: false },
      { id: "b", text: "CSRF Token", is_correct: true },
      { id: "c", text: "XSS Filtering", is_correct: false },
      { id: "d", text: "JWT Authorization", is_correct: false }
    ],
  },
  {
    id: "q14",
    content: "Trong JavaScript, một Promise sau khi được thực thi thành công sẽ chuyển sang trạng thái nào?",
    options: [
      { id: "a", text: "pending", is_correct: false },
      { id: "b", text: "rejected", is_correct: false },
      { id: "c", text: "fulfilled", is_correct: true },
      { id: "d", text: "settled", is_correct: false }
    ],
  },
  {
    id: "q15",
    content: "Phương pháp mã hóa nào sử dụng một cặp khóa: khóa công khai (public key) và khóa bí mật (private key)?",
    options: [
      { id: "a", text: "Mã hóa đối xứng (Symmetric Encryption)", is_correct: false },
      { id: "b", text: "Mã hóa bất đối xứng (Asymmetric Encryption)", is_correct: true },
      { id: "c", text: "Mã hóa một chiều (Hashing Function)", is_correct: false },
      { id: "d", text: "Mã hóa Base64", is_correct: false }
    ],
  },
];

export default function PracticeGamePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  // Load all lessons list
  const { data: lessons = [] } = useLessons();

  // Find matching lesson
  const resolvedLesson = useMemo(() => {
    return (
      lessons.find((l) => l.slug === slug) ||
      lessons.find((l) => l.id === slug)
    );
  }, [lessons, slug]);

  const lessonId = resolvedLesson?.id || "";

  // Fetch real questions for this lesson
  const { data: realQuestions = [], isLoading: isLoadingQuestions } = useQuestions({
    lesson_id: lessonId,
    pool_type: "PRACTICE",
  });

  // Combine & pad real questions up to 15
  const gameQuestions = useMemo(() => {
    if (realQuestions && realQuestions.length > 0) {
      const combined: any[] = [...realQuestions];
      while (combined.length < 15) {
        const nextMock = MOCK_QUESTIONS[combined.length % MOCK_QUESTIONS.length];
        combined.push({
          ...nextMock,
          id: `padded-${combined.length}-${nextMock.id}`,
        });
      }
      return combined.slice(0, 15);
    }
    return MOCK_QUESTIONS;
  }, [realQuestions]);

  // ─── CHARACTER GAME STATE ───
  const [stage, setStage] = useState(1); // Floor/Stage: 1, 2, 3
  const [hp, setHp] = useState(3); // Hearts/Health: 1 to 5 (Cap 5)
  const [gold, setGold] = useState(0); // Gold collected in match
  const [score, setScore] = useState(0); // Score collected
  const [currentIdx, setCurrentIdx] = useState(0); // 0 to 14 questions
  const [stageProgress, setStageProgress] = useState<("correct" | "incorrect" | "idle")[]>(
    Array.from({ length: 15 }).map(() => "idle")
  );

  // ─── BOSS BATTLE STATE ───
  const [bossHp, setBossHp] = useState(5);
  const [bossMaxHp, setBossMaxHp] = useState(5);
  const [bossStatus, setBossStatus] = useState<"idle" | "attack" | "damage" | "defeat">("idle");
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);

  // ─── ITEM HOTBAR STATE ───
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
  const [retryCounter, setRetryCounter] = useState(0);

  const currentQuestion = gameQuestions[currentIdx];

  // Initialize and run time limit timer
  useEffect(() => {
    if (gameResult !== "playing" || showBossWarning || isAnswered || isLoadingQuestions) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    // Set time limit based on boss battle
    const limit = isBossMode ? 10 : 15; // Boss battles only give 10 seconds!
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
  }, [currentIdx, timerFrozen, showBossWarning, isAnswered, gameResult, isLoadingQuestions]);

  // Reset bossStatus to idle when question changes
  useEffect(() => {
    if (bossStatus !== "defeat") {
      setBossStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  // Auto-dismiss Boss warning after 2 seconds
  useEffect(() => {
    if (showBossWarning) {
      const timer = setTimeout(() => {
        setShowBossWarning(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showBossWarning]);

  // Handle Timeout
  const handleTimeOut = () => {
    toast.error("Hết thời gian suy nghĩ mất rồi!");
    submitAnswer(null);
  };

  // Submit Answer Action
  const submitAnswer = (optionId: string | null) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    const isCorrect = optionId !== null && currentQuestion?.options.find((o: any) => o.id === optionId)?.is_correct === true;

    // Resolve answer check
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleIncorrectAnswer();
    }
  };

  // Correct Answer Handler
  const handleCorrectAnswer = () => {
    toast.success("Chính xác! Nhận thêm vàng thưởng.");

    // Reward calculation based on fast answers and Boss mode
    let goldReward = isBossMode ? 80 : 40;
    if (timeLeft > timerMax * 0.7) {
      goldReward += isBossMode ? 40 : 20; // Fast bonus
    }

    let scoreReward = isBossMode ? 200 : 100;
    if (doubleActive) {
      scoreReward *= 2;
      setDoubleActive(false);
      toast.success("Nhân Phẩm kích hoạt! Nhân đôi điểm số.");
    }

    setGold((prev) => prev + goldReward);
    setScore((prev) => prev + scoreReward);

    // Update progress dots
    setStageProgress((prev) => {
      const copy = [...prev];
      copy[currentIdx] = "correct";
      return copy;
    });

    // Attack animations
    setBossStatus("damage");
    setBossHp((prev) => {
      const nextHp = Math.max(0, prev - 1);
      if (nextHp === 0) {
        setTimeout(() => {
          setBossStatus("defeat");
        }, 350);
        setTimeout(() => {
          toast.success(`Đã tiêu diệt ${getBossName(stage)}! Hồi phục +2 Mạng.`);
          setHp((prevHp) => Math.min(5, prevHp + 2)); // Recover 2 lives, Cap at 5
        }, 800);
      }
      return nextHp;
    });
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
      setBossStatus("attack");
      setTimeout(() => setBossStatus("idle"), 1000);
      return;
    }

    // Deduct HP
    const livesDeducted = isBossMode ? 2 : 1; // Boss battle causes 2 HP loss!
    toast.error(isBossMode ? `Sai rồi! Boss tấn công làm mất 2 mạng.` : `Chọn sai rồi! Mất 1 mạng.`);

    setBossStatus("attack");
    setTimeout(() => setBossStatus("idle"), 1000);

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
    if (currentIdx === 4) {
      setStage(2);
      toast.info("ẢI TẦNG THỨ 2: MỨC ĐỘ TRUNG BÌNH");
      setShieldPurchasedInStage(false); // Reset shield purchase cap
      setBossMaxHp(5);
      setBossHp(5);
      setIsBossMode(true);
      setShowBossWarning(true);
    } else if (currentIdx === 9) {
      setStage(3);
      toast.info("ẢI TẦNG THỨ 3: MỨC ĐỘ KHÓ");
      setShieldPurchasedInStage(false);
      setBossMaxHp(5);
      setBossHp(5);
      setIsBossMode(true);
      setShowBossWarning(true);
    }

    if (currentIdx + 1 >= gameQuestions.length) {
      setGameResult("victory");
      return;
    }

    setCurrentIdx((prev) => prev + 1);
    setIsAnswered(false);
    setSelectedOptionId(null);
    setHiddenOptions([]);
    setTimerFrozen(false);
  };

  // ─── USE ITEMS LOGIC ───
  const handleUseItem = (type: ItemType) => {
    let cost = type === "50-50" ? 100 : type === "freeze" ? 150 : type === "double" ? 200 : 250;

    // Boss battle item prices double! (x2 price)
    if (isBossMode) {
      cost *= 2;
    }

    if (gold < cost) {
      toast.error("Không đủ vàng rồi!");
      return;
    }

    if (type === "shield" && shieldPurchasedInStage) {
      toast.error("Mỗi tầng chỉ được dùng tối đa 1 Khiên Hộ Mệnh!");
      return;
    }

    setGold((prev) => prev - cost);

    if (type === "50-50") {
      // Eliminate 2 wrong answers
      const incorrectOptions = currentQuestion.options.filter((o: any) => !o.is_correct).map((o: any) => o.id);
      // Pick 2 random incorrect options to hide
      const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
      setHiddenOptions([shuffled[0], shuffled[1]]);
      toast.info("Kính Hiển Vi kích hoạt! Loại bỏ 2 đáp án sai.");
    } else if (type === "freeze") {
      setTimerFrozen(true);
      toast.info("Đóng Băng kích hoạt! Thời gian suy nghĩ tạm thời ngừng đếm.");
    } else if (type === "double") {
      setDoubleActive(true);
      toast.info("Nhân Phẩm kích hoạt! Nhân đôi số điểm câu này.");
    } else if (type === "shield") {
      setShieldActive(true);
      setShieldPurchasedInStage(true);
      toast.info("Khiên Hộ Mệnh đã kích hoạt! Bảo vệ bạn trước đòn đánh kế tiếp.");
    }
  };

  // Retry Game
  const handleRetry = () => {
    setStage(1);
    setHp(3);
    setGold(0);
    setScore(0);
    setCurrentIdx(0);
    setStageProgress(Array.from({ length: 15 }).map(() => "idle"));
    setBossHp(5);
    setBossMaxHp(5);
    setBossStatus("idle");
    setIsBossMode(false);
    setShieldActive(false);
    setDoubleActive(false);
    setShieldPurchasedInStage(false);
    setIsAnswered(false);
    setSelectedOptionId(null);
    setHiddenOptions([]);
    setTimerFrozen(false);
    setGameResult("playing");
    setRetryCounter((prev) => prev + 1);
  };

  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen text-zinc-955 flex flex-col items-center justify-center font-sans relative select-none p-4 md:p-6"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
            linear-gradient(to bottom right, #f4eedb, #eae2c6)
          `,
          backgroundSize: "24px 24px, 100% 100%",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="size-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 font-mono animate-pulse">ĐANG KHỞI TẠO ĐẤU TRƯỜNG...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen text-zinc-955 flex flex-col font-sans relative overflow-hidden select-none p-4 md:p-6 transition-all duration-300 ${screenShake ? "animate-[shake_0.5s_infinite]" : ""
        }`}
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(139,92,26,0.05) 1.5px, transparent 1.5px),
          linear-gradient(to bottom right, #f4eedb, #eae2c6)
        `,
        backgroundSize: "24px 24px, 100% 100%",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Screen shake style */}
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

      {/* ─── HEADER HUD (RPG STATUS BAR - Cartoon Rounded Panel) ─── */}
      <header className="relative w-full max-w-9xl mx-auto flex justify-between items-center bg-white border-3 border-zinc-900 p-4 rounded-none mb-2 z-10 shadow-md shadow-stone-800/10">
        {/* Left Side: Stage progress dot */}
        <div className="flex flex-col items-start">
          <div className="text-xs md:text-sm text-zinc-500 mb-1.5 tracking-wider font-extrabold font-mono">TIẾN TRÌNH THỬ THÁCH</div>
          <div className="flex items-center gap-2">
            {stageProgress.map((status, i) => {
              const isActive = i === currentIdx;

              let icon = null;
              let btnClass = "bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed";

              if (isActive) {
                icon = <Swords className="w-4.5 h-4.5 text-zinc-900 animate-pulse" />;
                btnClass = "bg-amber-400 border-zinc-900 text-zinc-900 shadow-sm shadow-stone-800/10 scale-110";
              } else if (status === "correct") {
                icon = <Trophy className="w-4 h-4 text-emerald-800" />;
                btnClass = "bg-emerald-400 border-zinc-900 text-emerald-800 shadow-sm shadow-stone-800/10";
              } else if (status === "incorrect") {
                icon = <Skull className="w-4 h-4 text-red-800" />;
                btnClass = "bg-red-400 border-zinc-900 text-red-800 shadow-sm shadow-stone-800/10";
              } else {
                icon = <Lock className="w-3 h-3 text-zinc-400" />;
                btnClass = "bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled
                  className={`relative w-10 h-10 border-2 transition-all duration-300 flex items-center justify-center rounded-none font-bold ${btnClass}`}
                >
                  {/* Glowing active outline */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-none border-2 border-amber-500 animate-ping opacity-60 pointer-events-none" />
                  )}
                  {icon}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: current score */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-zinc-500 font-extrabold font-mono">ĐIỂM SỐ</span>
          <span className="text-cyan-600 font-extrabold tracking-wide font-mono text-xl">{score} PTS</span>
        </div>
      </header>

      {/* ─── MAIN CONTENT WINDOW (RPG HUD VIEWPORT) ─── */}
      <main className="flex-1 w-full max-w-9xl mx-auto flex flex-col items-center justify-start relative z-10 py-2">
        <AnimatePresence mode="wait">
          {gameResult === "playing" ? (
            <motion.div
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ─── LEFT COLUMN: BATTLE ARENA, HP STATS & ITEM HOTBAR ─── */}
              <div className="lg:col-span-5 flex flex-col gap-4 w-full">
                <BossHud
                  key={retryCounter}
                  status={bossStatus}
                  playerStatus={bossStatus === "attack" ? "damage" : bossStatus === "damage" ? "attack" : "idle"}
                  hp={bossHp}
                  maxHp={bossMaxHp}
                  name={getBossName(stage)}
                  level={stage === 1 ? 5 : stage === 2 ? 12 : 25}
                  monsterType={stage === 1 ? "slime" : stage === 2 ? "golem" : "eye"}
                  playerHp={hp}
                  playerMaxHp={5}
                  playerLvl={
                    stage === 3 ? 3 : stage === 2 ? 2 : (stageProgress.slice(0, 5).includes("correct") ? 1 : 0)
                  }
                />

                {/* ─── ITEM HOTBAR (Placed under the Arena in Left Column) ─── */}
                <ItemHotbar
                  gold={gold}
                  onUseItem={handleUseItem}
                  disabled={showBossWarning || isAnswered || gameResult !== "playing"}
                  maxShieldLimitReached={shieldPurchasedInStage}
                  isBossMode={isBossMode}
                />
              </div>

              {/* ─── RIGHT COLUMN: TIMER, QUESTIONS & ITEMS ─── */}
              <div className="lg:col-span-7 flex flex-col gap-4 w-full items-center">

                 {/* ⏳ DYNAMIC TIMER BAR (Cartoon Progress Bar) */}
                <div className="w-full bg-white border-3 border-zinc-900 p-1.5 rounded-none mb-4 shadow-md shadow-stone-800/10 relative text-zinc-955">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-700 px-1 pb-1.5 border-b border-zinc-100">
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-amber-500 animate-spin" />
                      <span>{timerFrozen ? "THỜI GIAN ĐÃ BỊ ĐÓNG BĂNG" : "THỜI GIAN CO RÚT SUY NGHĨ"}</span>
                    </span>
                    <span className={`${timeLeft < 5 ? "text-red-500 animate-pulse font-extrabold" : "text-zinc-700"
                      }`}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="h-3 w-full bg-zinc-200 border-2 border-zinc-900 rounded-none overflow-hidden relative mt-1">
                    <motion.div
                      className={`h-full ${timerFrozen
                        ? "bg-sky-400"
                        : timeLeft > timerMax * 0.5
                          ? "bg-emerald-400"
                          : timeLeft > timerMax * 0.25
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeLeft / timerMax) * 100}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* ─── QUESTION CARD & ANSWERS GRID (Cartoon White Box Style) ─── */}
                <div className="w-full bg-white border-3 border-zinc-900 p-6 rounded-none relative shadow-lg shadow-stone-800/10 text-zinc-955">

                  {/* Active Double Points Buff Indicator */}
                  {doubleActive && (
                    <div className="absolute -top-3.5 -left-3.5 bg-amber-400 text-zinc-900 border-2 border-zinc-900 font-extrabold text-[10px] px-2 py-1 flex items-center gap-1 shadow-sm shadow-stone-800/10 z-20 animate-bounce">
                      <Zap className="w-3.5 h-3.5 text-zinc-900 fill-zinc-900" />
                      <span>NHÂN PHẨM X2 ĐIỂM KÍCH HOẠT</span>
                    </div>
                  )}

                   {/* Question Info Header */}
                  <div className="flex justify-between items-center text-sm text-zinc-500 font-mono tracking-wider mb-4 border-b-2 border-zinc-150 pb-2.5 font-bold">
                    <span className="text-cyan-600 font-extrabold">
                      [ ẢI THỬ THÁCH CÂU HỎI {currentIdx + 1} / 15 ]
                    </span>
                    <span>TẦNG ẢI {stage} / 3</span>
                  </div>

                  {/* Question Body Text */}
                  {currentQuestion && (
                    <>
                      <h3 className="text-base md:text-lg font-extrabold leading-relaxed text-zinc-900 font-mono mb-6 min-h-[50px]">
                        {currentQuestion.content}
                      </h3>

                      {/* Answers Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option: any) => {
                          const isSelected = selectedOptionId === option.id;
                          const isCorrect = option.is_correct;
                          const isHidden = hiddenOptions.includes(option.id);

                          let btnStyles = "border-zinc-900 hover:bg-amber-100 text-zinc-900 bg-stone-50 shadow-sm shadow-stone-800/10 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";
                          if (isAnswered) {
                            if (isCorrect) {
                              btnStyles = "border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-500/20";
                            } else if (isSelected) {
                              btnStyles = "border-red-500 bg-red-100 text-red-800 shadow-sm shadow-red-500/20";
                            } else {
                              btnStyles = "border-zinc-200 text-zinc-300 bg-zinc-50 opacity-20 cursor-default shadow-none";
                            }
                          } else if (isHidden) {
                            btnStyles = "border-zinc-200 text-zinc-300 bg-zinc-50 opacity-5 cursor-not-allowed pointer-events-none shadow-none";
                          }

                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={isAnswered || isHidden}
                              onClick={() => submitAnswer(option.id)}
                              className={`w-full text-left p-3.5 border-2 transition-all duration-200 flex items-start gap-3 rounded-none relative group overflow-hidden ${btnStyles}`}
                            >
                              <span className="font-extrabold text-cyan-600 group-hover:text-zinc-900 transition-colors duration-200">
                                {option.id.toUpperCase()}.
                              </span>

                              <span className="text-sm font-bold leading-normal">
                                {option.text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

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
                        className="px-6 py-2.5 font-extrabold tracking-wider rounded-none bg-emerald-500 hover:bg-emerald-400 text-white font-mono text-sm border-2 border-zinc-900 shadow-sm shadow-stone-800/10 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
                      >
                        <span>TIẾP TỤC HÀNH TRÌNH</span>
                        <Swords className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ─── VICTORY / DEFEAT END-GAME LAYOUTS ─── */
            <motion.div
              className="w-full max-w-md bg-white border-3 border-zinc-900 p-8 rounded-none text-center shadow-lg shadow-stone-800/10 relative text-zinc-955"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {gameResult === "victory" ? (
                <>
                  <div className="w-16 h-16 bg-amber-100 border-2 border-zinc-900 rounded-none flex items-center justify-center mx-auto mb-4 animate-bounce text-amber-500 shadow-sm shadow-stone-800/10">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-widest text-zinc-900 mb-2 font-mono">
                    CHINH PHỤC THÀNH CÔNG!
                  </h2>
                  <p className="text-xs text-zinc-500 mb-6 font-mono font-bold">
                    Chúc mừng dũng sĩ! Bạn đã vượt qua tất cả thử thách leo tháp.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-150 border-2 border-zinc-900 rounded-none flex items-center justify-center mx-auto mb-4 animate-pulse text-red-500 shadow-sm shadow-stone-800/10">
                    <Skull className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-widest text-red-500 mb-2 font-mono">
                    ĐÃ BỊ HẠ GỤC!
                  </h2>
                  <p className="text-xs text-zinc-500 mb-6 font-mono font-bold">
                    Đã hết sinh mệnh bảo toàn. Bạn hãy rèn luyện thêm để tái đấu nhé!
                  </p>
                </>
              )}

              {/* End-Game Statistics Board */}
              <div className="bg-zinc-50 border-2 border-zinc-900 p-4 font-mono text-xs text-left mb-8 rounded-none space-y-3 shadow-sm shadow-stone-800/10">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200 font-extrabold">
                  <span className="text-zinc-500">TỔNG ĐIỂM ĐẠT ĐƯỢC:</span>
                  <span className="font-extrabold text-cyan-600">{score} PTS</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200 font-extrabold">
                  <span className="text-zinc-500">VÀNG MANG VỀ:</span>
                  <span className="font-extrabold text-amber-500">🪙 {gold} VÀNG</span>
                </div>
                <div className="flex justify-between items-center font-extrabold">
                  <span className="text-zinc-500">ẢI LỚN NHẤT VƯỢT QUA:</span>
                  <span className="font-extrabold text-zinc-900">ẢI {currentIdx + 1} / 15</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="py-2.5 px-4 font-extrabold rounded-none bg-amber-400 hover:bg-amber-300 text-zinc-900 font-mono text-xs border-2 border-zinc-900 shadow-sm shadow-stone-800/10 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>TÁI ĐẤU</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/lessons/${slug}`)}
                  className="py-2.5 px-4 font-extrabold rounded-none bg-indigo-500 hover:bg-indigo-400 text-white font-mono text-xs border-2 border-zinc-900 shadow-sm shadow-stone-800/10 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>VỀ BÀI HỌC</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
              className="px-8 py-6 bg-white border-3 border-zinc-900 shadow-lg shadow-red-500/20 rounded-none max-w-md relative z-10 text-zinc-955"
            >
              <Skull className="w-16 h-16 text-red-500 mx-auto mb-4 animate-[bounce_0.6s_infinite]" />
              <h1 className="text-2xl md:text-3xl font-black font-mono tracking-widest text-red-600 mb-2">
                CẢNH BÁO: ĐẤU BOSS!
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider border-t-2 border-zinc-150 pt-2.5 font-bold">
                GIÁ VẬT PHẨM X2 | ĐIỂM SỐ X2 | THỜI GIAN SUY NGHĨ 10 GIÂY
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
