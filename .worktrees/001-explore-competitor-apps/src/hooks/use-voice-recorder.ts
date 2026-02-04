"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: Error | null;
}

export interface UseVoiceRecorderReturn extends VoiceRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ audioBase64: string; mimeType: string } | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resolveStopRef = useRef<((value: { audioBase64: string; mimeType: string } | null) => void) | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setDuration(0);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Determine supported MIME type
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/wav",
      ];

      let selectedMimeType = "";
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported audio format found");
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = selectedMimeType.split(";")[0]; // Remove codecs part
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix
          const audioBase64 = base64.split(",")[1];

          if (resolveStopRef.current) {
            resolveStopRef.current({ audioBase64, mimeType });
            resolveStopRef.current = null;
          }
        };
        reader.readAsDataURL(audioBlob);

        setIsRecording(false);
        setIsPaused(false);
        cleanup();
      };

      mediaRecorder.onerror = () => {
        setError(new Error("Recording error occurred"));
        setIsRecording(false);
        setIsPaused(false);
        cleanup();

        if (resolveStopRef.current) {
          resolveStopRef.current(null);
          resolveStopRef.current = null;
        }
      };

      // Start recording with time slices for more accurate data
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message.includes("Permission denied") || err.message.includes("NotAllowedError")
            ? "Microphone access denied. Please allow microphone access to use voice input."
            : err.message
          : "Failed to start recording";

      setError(new Error(errorMessage));
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(async (): Promise<{ audioBase64: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
        resolve(null);
        return;
      }

      resolveStopRef.current = resolve;

      // Stop the duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      mediaRecorderRef.current.stop();
    });
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      // Pause the duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume the duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      // Clear the resolve function so we don't return data
      resolveStopRef.current = null;
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    cleanup();
  }, [cleanup]);

  return {
    isRecording,
    isPaused,
    duration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  };
}
