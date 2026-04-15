import { cn } from "@/lib/utils";
import Image from "next/image";

type AnswerProps = {
  optionId: string;
  optionText: string;
  selectedOptionId: string;
  /** Chỉ dùng khi đã chấm cục bộ (quiz tĩnh); với API không có */
  isCorrect?: boolean | null;
  showGraded: boolean;
  handleSelectOption: (optionId: string) => void;
  index: number;
  answerLabels: string[];
};

const Answer = ({
  optionId,
  optionText,
  selectedOptionId,
  isCorrect,
  showGraded,
  handleSelectOption,
  index,
  answerLabels,
}: AnswerProps) => {
  const selected = selectedOptionId === optionId;

  return (
    <li>
      <button
        type="button"
        onClick={() => handleSelectOption(optionId)}
        className={cn(
          selected && "ring-purple ring-1",
          showGraded && isCorrect === true && selected && "ring-green",
          showGraded && isCorrect === false && selected && "ring-red",
          "w-full flex items-center gap-x-4 group bg-[#fff] dark:bg-slate py-4 px-5 rounded-xl shadow-lg hover:ring-1 hover:ring-purple transition-all font-semibold text-sm text-dark-blue dark:text-white text-center"
        )}
      >
        <span
          className={cn(
            selected
              ? "bg-purple text-white"
              : "bg-white dark:text-dark-blue group-hover:text-purple group-hover:bg-[#F6E7FF] transition-all",
            "text-lg rounded-lg py-2 px-4  ",
            showGraded && isCorrect === false && selected && "bg-red",
            showGraded && isCorrect === true && selected && "bg-green"
          )}
        >
          {answerLabels[index]}
        </span>
        <span className="xl:text-lg text-left flex-1">{optionText}</span>
        {showGraded && isCorrect === true && selected && (
          <span className="text-green-500 ml-auto">
            <Image
              src="/assets/images/icon-correct.svg"
              alt="check"
              width={30}
              height={30}
            />
          </span>
        )}
        {showGraded && isCorrect === false && selected && (
          <span className="text-red-500 ml-auto">
            <Image
              src="/assets/images/icon-error.svg"
              alt="cross"
              width={30}
              height={30}
            />
          </span>
        )}
      </button>
    </li>
  );
};

export default Answer;
