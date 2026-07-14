import { useState, useRef, useCallback } from "react";
import { showToast } from "@/lib/toast";

interface VoiceRecordingOptions {
  onTranscriptionComplete?: (data: any) => void;
  onError?: (error: Error) => void;
  autoSubmit?: boolean;
}

export function useVoiceRecording({
  onTranscriptionComplete,
  onError,
  autoSubmit = false,
}: VoiceRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      console.log("🎤 [Voice] Starting recording...");

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("❌ [Voice] Audio recording not supported");
        throw new Error("Audio recording not supported in this browser");
      }

      console.log("🎤 [Voice] Requesting microphone access...");
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ [Voice] Microphone access granted");

      // Create MediaRecorder
      console.log("🎤 [Voice] Creating MediaRecorder...");
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(
            `📊 [Voice] Audio chunk received: ${event.data.size} bytes`,
          );
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 [Voice] Recording stopped");

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        console.log("🎤 [Voice] Microphone released");

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        console.log(`📦 [Voice] Audio blob created: ${audioBlob.size} bytes`);

        // Process audio
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      showToast.success("Recording started...");
    } catch (error) {
      console.log("Error starting recording:", error);
      showToast.error("Failed to start recording");
      if (onError) {
        onError(error as Error);
      }
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      showToast.success("Processing your request...");
    }
  }, [isRecording]);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        console.log("🔄 [Voice] Processing audio...");

        // Create FormData to send audio
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("autoSubmit", String(autoSubmit));
        console.log("📤 [Voice] Sending audio to API...");

        const startTime = Date.now();

        // Send to API
        const response = await fetch("/api/parse-voice", {
          method: "POST",
          body: formData,
        });

        const processingTime = Date.now() - startTime;
        console.log(`⏱️ [Voice] API response received in ${processingTime}ms`);

        if (!response.ok) {
          console.log(
            "❌ [Voice] API error:",
            response.status,
            response.statusText,
          );
          throw new Error("Failed to process audio");
        }

        const result = await response.json();
        console.log("📥 [Voice] API Response:", result);

        if (result.success) {
          console.log("✅ [Voice] Processing successful!");
          console.log(`📝 [Voice] Transcript: "${result.transcript}"`);
          console.log("📊 [Voice] Extracted data:", result.data);

          if (result.missingFields && result.missingFields.length > 0) {
            console.warn("⚠️ [Voice] Missing fields:", result.missingFields);
          }

          showToast.success(
            result.autoSubmit
              ? "Reservation created successfully!"
              : "Form filled from voice input!",
          );

          if (onTranscriptionComplete) {
            console.log("🔔 [Voice] Calling onTranscriptionComplete callback");
            onTranscriptionComplete(result);
          }
        } else {
          console.log("❌ [Voice] Processing failed:", result.error);
          throw new Error(result.error || "Processing failed");
        }
      } catch (error) {
        console.log("❌ [Voice] Error processing audio:", error);
        showToast.error("Failed to process voice input");
        if (onError) {
          onError(error as Error);
        }
      } finally {
        console.log("✅ [Voice] Processing complete");
        setIsProcessing(false);
      }
    },
    [autoSubmit, onTranscriptionComplete, onError],
  );

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
