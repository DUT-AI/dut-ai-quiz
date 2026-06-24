"use client";

import React, { useEffect, useState } from "react";
import { useRive, StateMachineInputType } from "@rive-app/react-canvas";

interface RivePlayerProps {
  playerLvl: number; // 0 to 3 representing the level
}

export default function RivePlayer({ playerLvl }: RivePlayerProps) {
  const { RiveComponent, rive } = useRive({
    src: "/assets/24837-46410-gamification.riv",
    stateMachines: "State Machine 1",
    autoplay: true,
    shouldDisableRiveListeners: true, // Disable internal Rive click listeners to prevent click-to-evolve
  });

  const [currentRiveLvl, setCurrentRiveLvl] = useState(0);
  const [inputsList, setInputsList] = useState<{ name: string; type: StateMachineInputType; value: any }[]>([]);

  useEffect(() => {
    if (rive) {
      try {
        const inputs = rive.stateMachineInputs("State Machine 1");
        if (inputs) {
          setInputsList(
            inputs.map((i) => ({
              name: i.name,
              type: i.type,
              value: i.value,
            }))
          );

          // Find the "switch" trigger input
          const switchTrigger = inputs.find(
            (i) => i.name === "switch" && i.type === StateMachineInputType.Trigger
          );

          if (switchTrigger) {
            if (playerLvl > currentRiveLvl) {
              // Evolve sequentially with a small delay for smooth animation
              const timer = setTimeout(() => {
                console.log(`Evolving character: firing 'switch' trigger (level ${currentRiveLvl} -> ${currentRiveLvl + 1})`);
                switchTrigger.fire();
                setCurrentRiveLvl((prev) => prev + 1);
              }, 200); // 200ms delay for transition
              return () => clearTimeout(timer);
            } else if (playerLvl < currentRiveLvl) {
              // Reset state tracker if level decreases (recreation handles the Rive reset)
              setCurrentRiveLvl(playerLvl);
            }
          } else {
            // Fallback: If no trigger is found, play animations directly
            const animMap: Record<number, string> = {
              0: "te lvl 0",
              1: "pop tete lvl 1",
              2: "pop tete lvl 2",
              3: "pop tete lvl 3",
            };
            const animName = animMap[playerLvl] || "te lvl 0";
            if (rive.animationNames.includes(animName)) {
              rive.play(animName);
            }
          }
        }
      } catch (err) {
        console.error("Error setting Rive state:", err);
      }
    }
  }, [rive, playerLvl, currentRiveLvl]);

  return (
    <div className="flex flex-col items-center">
      <div className="w-60 h-60 flex items-center justify-center overflow-hidden cursor-pointer">
        <RiveComponent className="w-full h-full" />
      </div>
    </div>
  );
}
