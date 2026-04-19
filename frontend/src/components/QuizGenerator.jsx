import { useState } from "react";
import toast from "react-hot-toast";
import { generateAIQuiz, checkChapterContent } from "../api";
import { useSafeState } from "../utils/hooks";
import { QUIZ } from "../utils/constants";
import { Button } from "./ui";
import {
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Captions,
} from "lucide-react";

export default function QuizGenerator({
  courseId,
  chapterId,
  chapterTitle,
  onSuccess,
  onClose,
}) {
  const [step, setStep] = useState("config"); // 'config' | 'checking' | 'unavailable' | 'generating'
  const [generating, setGenerating] = useSafeState(false);
  const [checking, setChecking] = useSafeState(false);
  const [contentStatus, setContentStatus] = useSafeState(null);
  
  const [config, setConfig] = useState({
    numberOfQuestions: QUIZ.MIN_QUESTIONS,
    difficulty: "medium",
    timeLimit: QUIZ.DEFAULT_TIME_LIMIT,
    passingScore: QUIZ.DEFAULT_PASSING_SCORE,
  });

  const handleGenerate = async () => {
    // Step 1: Check content availability
    setChecking(true);
    setStep("checking");

    try {
      const { data } = await checkChapterContent({ courseId, chapterId });

      if (!data.canGenerate) {
        setContentStatus(data);
        setStep("unavailable");
        setChecking(false);
        return;
      }

      setContentStatus(data);
    } catch (err) {
      toast.error("Failed to check content: " + err.message);
      setStep("config");
      setChecking(false);
      return;
    }

    setChecking(false);

    // Step 2: Generate quiz
    setGenerating(true);
    setStep("generating");

    try {
      const { data } = await generateAIQuiz({
        courseId,
        chapterId,
        quizTitle: `${chapterTitle} - Quiz`,
        ...config,
      });

      if (data.warning) {
        toast(data.warning, { icon: "⚠️", duration: 5000 });
      }

      toast.success(data.message);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.originalError?.response?.data?.lectureStatuses) {
        setContentStatus(err.originalError.response.data);
        setStep("unavailable");
      } else {
        toast.error(err.message);
        setStep("config");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg animate-in zoom-in-95 fade-in duration-200">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--primary-light)] p-2.5">
                <Sparkles className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Generate AI Quiz
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">For: {chapterTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-gray-100 hover:text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content — unavailable state */}
          {step === "unavailable" && contentStatus && (
            <div className="space-y-5 p-6">
              {/* Alert */}
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 flex-shrink-0 h-5 w-5 text-[var(--accent)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--accent)]">
                      Cannot Generate Quiz
                    </h3>
                    <p className="mt-1 text-xs text-orange-800">
                      {contentStatus.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lecture Status */}
              {contentStatus.lectureStatuses && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                    Lecture Status
                  </h4>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {contentStatus.lectureStatuses.map((ls) => (
                      <div
                        key={ls.lectureId}
                        className="flex items-center gap-2 rounded-lg bg-[var(--bg)] px-3 py-2 text-xs"
                      >
                        {ls.source === "transcript" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[var(--success)]" />
                        ) : ls.source === "description" ? (
                          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-[var(--primary)]" />
                        ) : (
                          <X className="h-3.5 w-3.5 flex-shrink-0 text-[var(--danger)]" />
                        )}
                        <span className="flex-1 truncate text-[var(--text-primary)]">
                          {ls.lectureTitle}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            ls.source === "transcript"
                              ? "text-[var(--success)]"
                              : ls.source === "description"
                                ? "text-[var(--primary)]"
                                : "text-[var(--danger)]"
                          }`}
                        >
                          {ls.source}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solutions */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                  How to fix this
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3">
                    <Captions className="mt-0.5 flex-shrink-0 h-4 w-4 text-[var(--primary)]" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        1. Enable YouTube Captions
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Go to YouTube Studio → Subtitles → enable auto-generated captions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3">
                    <FileText className="mt-0.5 flex-shrink-0 h-4 w-4 text-[var(--primary)]" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        2. Add Lecture Descriptions
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Add text descriptions to your lectures so AI can use them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content — config / checking / generating states */}
          {(step === "config" || step === "checking" || step === "generating") && (
            <div className="space-y-5 p-6">
              
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
                  Number of Questions
                </label>
                <select
                  value={config.numberOfQuestions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      numberOfQuestions: parseInt(e.target.value),
                    })
                  }
                  disabled={step !== "config"}
                  className="input"
                >
                  {[QUIZ.MIN_QUESTIONS, 10, 15, QUIZ.MAX_QUESTIONS].map((n) => (
                    <option key={n} value={n}>
                      {n} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["easy", "medium", "hard"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={step !== "config"}
                      onClick={() => setConfig({ ...config, difficulty: level })}
                      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                        config.difficulty === level
                          ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.timeLimit}
                    disabled={step !== "config"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        timeLimit: parseInt(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.passingScore}
                    disabled={step !== "config"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        passingScore: parseInt(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {step === "checking" && (
                <div className="rounded-xl bg-[var(--primary-light)] p-4">
                  <p className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                    <span className="animate-spin">⏳</span>
                    Checking content availability...
                  </p>
                </div>
              )}

              {step === "generating" && (
                <div className="rounded-xl bg-[var(--primary-light)] p-4">
                  <p className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                    <span className="animate-spin">⏳</span>
                    Generating quiz questions with AI... This may take 10-30 seconds.
                  </p>
                </div>
              )}

              {step === "config" && (
                <div className="rounded-xl bg-[var(--primary-light)] p-4">
                  <p className="text-xs font-medium text-[var(--primary)]">
                    💡 <strong>Tip:</strong> AI will analyze your chapter content (YouTube transcripts or lecture descriptions) 
                    and create relevant questions automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 border-t border-[var(--border)] bg-[var(--bg)] px-6 py-5">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={generating || checking}
              className="flex-1"
            >
              {step === "unavailable" ? "Close" : "Cancel"}
            </Button>

            {step === "unavailable" ? (
              <Button
                variant="primary"
                onClick={() => {
                  setStep("config");
                  setContentStatus(null);
                }}
                className="flex-1"
              >
                Try Again
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleGenerate}
                loading={generating || checking}
                disabled={generating || checking}
                className="flex-1"
              >
                {checking || generating ? (
                  checking ? "Checking..." : "Generating..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}