"use client";

import React from "react";
import { GameTabHero } from "./game-tab-hero";
import { GameTabRules } from "./game-tab-rules";
import { GameTabBackground } from "./game-tab-background";
import GameLeaderboard from "@/features/game/components/game-leaderboard";
import GamePersonalBest from "@/features/game/components/game-personal-best";
import { useActiveGameSession } from "@/features/game/queries";
import { useLessonBySlug } from "../queries";

interface GameTabProps {
  lessonId: string;
  slug: string;
}

export function GameTab({ lessonId, slug }: GameTabProps) {
  const { data: activeSession, isLoading: isLoadingSession } = useActiveGameSession(slug);
  const { data: lesson } = useLessonBySlug(slug);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-0 py-6 font-sans relative">
      
      {/* Outer border gradient wrapper */}
      <div className="w-full p-[1.5px] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 dark:from-indigo-500/40 dark:via-fuchsia-500/20 dark:to-cyan-500/40 rounded-3xl md:rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* Glow ambient background spotlight base */}
        <div className="absolute inset-0 bg-white/95 dark:bg-[#0B1226]/90 transition-colors duration-300 pointer-events-none" />
        
        {/* Dynamic game tab background (grids, ambient spotlights, floaters) */}
        <GameTabBackground />

        {/* Inner Content Card (Glassmorphism design) */}
        <div className="relative z-10 w-full rounded-[calc(1.5rem-1.5px)] md:rounded-[calc(2.5rem-1.5px)] p-4 sm:p-6 md:p-10 flex flex-col gap-8 backdrop-blur-xl">
          
          {/* Header Hero Section */}
          <GameTabHero 
            slug={slug} 
            activeSession={activeSession} 
            isLoadingSession={isLoadingSession} 
            hasGameQuestions={lesson?.has_game_questions !== false}
          />

          {/* Content Stack */}
          <div className="flex flex-col gap-8">
            {/* Rules Section */}
            <GameTabRules />

            {/* Personal Best Section (Full Width) */}
            <div className="w-full">
              <GamePersonalBest lessonSlug={slug} variant="modern" />
            </div>

            {/* Leaderboard Section (Full Width) */}
            <div className="w-full">
              <GameLeaderboard lessonSlug={slug} variant="modern" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
