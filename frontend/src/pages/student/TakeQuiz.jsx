import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchQuizForStudent, submitQuizAnswers } from "../../api";
import { useTimer, useMounted } from "../../utils/hooks";
import { formatTime } from "../../utils/helpers";
import Loading from "../../components/Loading";
import { Clock } from "lucide-react";

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isMountedRef = useMounted();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [endTime, setEndTime] = useState(null);
  const [startedAt] = useState(new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitRef = useRef(null);

  // Fetch quiz
  useEffect(() => {
    fetchQuizForStudent(quizId)
      .then((r) => {
        if (!isMountedRef.current) return;
        const quizData = r.data.quiz;
        setQuiz(quizData);
        if (quizData.timeLimit) {
          setEndTime(Date.now() + quizData.timeLimit * 60 * 1000);
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        toast.error(err.message);
        navigate(-1);
      })
      .finally(() => isMountedRef.current && setLoading(false));
  }, [quizId, navigate, isMountedRef]);

  // Timer with auto-submit
  const timeLeft = useTimer(endTime, () => handleSubmitRef.current?.(true));

  // Submit handler
  const handleSubmit = useCallback(
    async (isAuto = false) => {
      if (submitting || !quiz || !isMountedRef.current) return;

      const answerArray = quiz.questions.map((q) => ({
        questionId: q.questionId,
        selectedAnswer: answers[q.questionId] || "",
      }));

      const unanswered = answerArray.filter((a) => !a.selectedAnswer).length;

      if (!isAuto && unanswered > 0) {
        if (!window.confirm(`${unanswered} unanswered. Submit anyway?`)) return;
      }

      setSubmitting(true);

      try {
        const timeSpent = quiz.timeLimit
          ? quiz.timeLimit * 60 - (timeLeft || 0)
          : Math.floor((new Date() - new Date(startedAt)) / 1000);

        await submitQuizAnswers(quizId, {
          answers: answerArray,
          timeSpent,
          startedAt,
        });

        if (isMountedRef.current) {
          toast.success("Quiz submitted!");
          navigate(`/quiz/${quizId}/results`);
        }
      } catch (err) {
        if (isMountedRef.current) {
          toast.error(err.message);
          setSubmitting(false);
        }
      }
    },
    [quiz, answers, quizId, timeLeft, startedAt, navigate, submitting, isMountedRef]
  );

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  if (loading) return <Loading />;
  if (!quiz) return null;

  const progress = (Object.keys(answers).length / quiz.questions.length) * 100;

  return (
    <div className="section min-h-screen pb-20">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="card !p-0 mb-8 overflow-hidden shadow-sm">
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-5">
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
              {quiz.quizTitle}
            </h1>
            {quiz.quizDescription && (
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                {quiz.quizDescription}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between bg-[var(--bg)] px-6 py-4 text-sm border-b border-[var(--border)]">
            <div>
              <span className="font-bold text-[var(--text-secondary)]">Progress:</span>
              <span className="ml-2 font-extrabold text-[var(--text-primary)]">
                {Object.keys(answers).length} / {quiz.questions.length}
              </span>
            </div>

            {timeLeft !== null && (
              <div className="flex items-center gap-2 font-mono font-bold text-[var(--primary)]">
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div className="bg-[var(--surface)] px-6 py-5">
            <div className="h-2.5 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions.map((q, i) => (
            <div key={q.questionId} className="card p-6">
              <p className="text-base font-bold text-[var(--text-primary)] mb-5">
                <span className="text-[var(--text-secondary)] opacity-50 mr-2">{i + 1}.</span>
                {q.questionText}
              </p>

              <div className="space-y-3">
                {q.options.map((opt) => {
                  const isSelected = answers[q.questionId] === opt.optionId;

                  return (
                    <label
                      key={opt.optionId}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary-light)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.questionId}
                        value={opt.optionId}
                        checked={isSelected}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.questionId]: e.target.value,
                          }))
                        }
                        className="h-4 w-4 text-[var(--primary)]"
                      />
                      <span
                        className={`text-sm ${
                          isSelected ? "font-bold text-[var(--primary)]" : "font-medium"
                        }`}
                      >
                        <span className="font-bold opacity-50 mr-2">{opt.optionId}.</span>
                        {opt.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="btn-primary w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}