"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Square, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { transcribeAudio, parseVoiceInput, type ExtractedItem } from "@/lib/ai";

interface VoiceCaptureProps {
  onComplete: (items: ExtractedItem[], durationSeconds: number) => void;
  onCancel: () => void;
  unitSystem: "metric" | "imperial";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceCapture({
  onComplete,
  onCancel,
  unitSystem,
}: VoiceCaptureProps) {
  const {
    isRecording,
    duration,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const [transcribedText, setTranscribedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "idle" | "transcribing" | "parsing"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  // Auto-start recording when component mounts
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startRecording();
    }
  }, [startRecording]);

  // Handle recorder errors
  useEffect(() => {
    if (recorderError) {
      setError(recorderError.message);
    }
  }, [recorderError]);

  const handleFinish = async () => {
    setError(null);
    setIsProcessing(true);
    setProcessingStep("transcribing");

    try {
      // Stop recording and get audio
      const audioData = await stopRecording();

      if (!audioData) {
        throw new Error("No audio recorded");
      }

      // Step 1: Transcribe audio
      const text = await transcribeAudio(audioData.audioBase64, audioData.mimeType);

      if (!text || text.trim().length === 0) {
        throw new Error("No speech detected. Please try again.");
      }

      setTranscribedText(text);
      setProcessingStep("parsing");

      // Step 2: Parse transcription to food items
      const items = await parseVoiceInput(text, unitSystem);

      // Pass items and recording duration
      onComplete(items, duration);
    } catch (err) {
      console.error("Voice capture error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsProcessing(false);
      setProcessingStep("idle");
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  // Processing state UI
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          {/* Loader */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
          </div>

          {/* Status */}
          <h2 className="text-lg font-medium text-foreground mb-2">
            {processingStep === "transcribing"
              ? "Transcribing your voice..."
              : "Finding your items..."}
          </h2>

          {/* Show transcribed text when parsing */}
          {processingStep === "parsing" && transcribedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 max-w-sm"
            >
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground italic">
                  "{transcribedText}"
                </p>
              </Card>
            </motion.div>
          )}

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Recording state UI
  return (
    <div className="flex flex-col min-h-[60vh] px-5">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-1">
                Voice Input
              </h1>
              <p className="text-sm text-muted-foreground">
                Tell us what you purchased
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Recording indicator */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md mx-auto w-full text-center">
          {/* Animated mic icon */}
          <motion.div
            className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            {/* Pulsing rings */}
            {isRecording && (
              <>
                <motion.div
                  className="absolute rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ width: 96, height: 96, top: 0, left: 0 }}
                />
                <motion.div
                  className="absolute rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.5,
                  }}
                  style={{ width: 96, height: 96, top: 0, left: 0 }}
                />
              </>
            )}

            {/* Main mic button */}
            <div
              className={`
                w-24 h-24 rounded-full flex items-center justify-center
                ${isRecording ? "bg-primary" : "bg-muted"}
                transition-colors duration-200
              `}
            >
              {isRecording ? (
                <Mic className="w-10 h-10 text-primary-foreground" />
              ) : (
                <MicOff className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          </motion.div>

          {/* Duration */}
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-lg font-medium text-foreground">
                    {formatDuration(duration)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recording... Speak clearly
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Microphone ready
              </motion.p>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <Card className="mt-8 p-4 bg-muted/50 text-left">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Tips for best results:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                • Say item names clearly: "2 gallons of milk, 1 dozen eggs"
              </li>
              <li>• Mention quantities: "3 apples, half pound of cheese"</li>
              <li>
                • Include expiration dates if you know them: "milk expires in 5
                days"
              </li>
            </ul>
          </Card>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-destructive/10 text-destructive rounded-xl px-4 py-3"
            >
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pb-6 pt-4">
        <div className="max-w-md mx-auto space-y-3">
          {isRecording ? (
            <Button
              onClick={handleFinish}
              className="w-full h-12 text-base"
              disabled={duration < 1}
            >
              <Square className="w-4 h-4 mr-2" />
              Finish Recording
            </Button>
          ) : (
            <Button
              onClick={() => startRecording()}
              className="w-full h-12 text-base"
            >
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
