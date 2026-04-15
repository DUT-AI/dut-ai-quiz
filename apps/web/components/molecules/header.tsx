"use client";
import SwitchTheme from "../atoms/switch-theme";
import { useQuestionStore } from "@/store/quiz-store";
import { backgroundColors, cn, tintForTitle } from "@/lib/utils";
import Image from "next/image";
import { MotionHeader } from "../animated/motion-header";

const Header = () => {
  const selectedExam = useQuestionStore((state) => state.selectedExam);
  const tint = selectedExam
    ? backgroundColors[selectedExam.title] ?? tintForTitle(selectedExam.title)
    : undefined;

  return (
    <MotionHeader
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        selectedExam ? "flex justify-between w-full items-center" : "",
        "relative z-10"
      )}
    >
      {selectedExam && (
        <div className="flex gap-x-4 items-center sm:px-6 sm:py-4">
          <div
            className="xs:p-1 p-2 rounded-lg"
            style={{ backgroundColor: tint }}
          >
            <Image
              src={selectedExam.icon}
              alt=""
              width={30}
              height={30}
              className="xs:size-5 xl:size-10"
            />
          </div>
          <p className="text-dark-blue dark:text-white font-bold xs:text-lg sm:text-xl xl:text-3xl">
            {selectedExam.title}
          </p>
        </div>
      )}
      <SwitchTheme />
    </MotionHeader>
  );
};

export default Header;
