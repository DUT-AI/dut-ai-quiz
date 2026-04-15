import type { QuizQuestion } from "@/lib/types";

type QuestionsProps = {
  data: QuizQuestion;
};

const CurrentQuestion = ({ data }: QuestionsProps) => {
  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-dark-blue dark:text-white xs:text-xl md:text-2xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold [&_p]:m-0">
        <span
          dangerouslySetInnerHTML={{ __html: data.content }}
          className="block"
        />
      </h2>
    </div>
  );
};

export default CurrentQuestion;
