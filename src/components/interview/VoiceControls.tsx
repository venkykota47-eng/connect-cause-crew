import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceWaveform } from "./VoiceWaveform";
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  audioLevel: number;
  confidence: number;
  transcript: string;
  interimTranscript: string;
  isLoading: boolean;
  voiceSupported: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  onPause: () => void;
  onResume: () => void;
  onSend: () => void;
  hasTranscript: boolean;
}

export const VoiceControls = ({
  isListening,
  isSpeaking,
  isPaused,
  audioLevel,
  confidence,
  transcript,
  interimTranscript,
  isLoading,
  voiceSupported,
  onToggleListening,
  onStopSpeaking,
  onPause,
  onResume,
  onSend,
  hasTranscript,
}: VoiceControlsProps) => {
  if (!voiceSupported) {
    return (
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Voice features are not supported in this browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Voice Control Area */}
      <div className="flex flex-col items-center gap-4 p-4 bg-muted/30 rounded-xl border">
        {/* Waveform Visualization */}
        <div className="flex items-center justify-center h-12">
          {isListening && !isPaused ? (
            <VoiceWaveform 
              isActive={isListening} 
              audioLevel={audioLevel}
              variant="bars"
              className="h-8"
            />
          ) : isSpeaking ? (
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <Volume2 className="h-6 w-6" />
              <span className="text-sm font-medium">AI Speaking...</span>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              {isPaused ? "Paused - Click Resume to continue" : "Click to start speaking"}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Stop AI Speaking Button */}
          {isSpeaking && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStopSpeaking}
              className="gap-2"
            >
              <VolumeX className="h-4 w-4" />
              Stop AI
            </Button>
          )}

          {/* Main Mic Button */}
          <Button
            variant={isListening && !isPaused ? "destructive" : "default"}
            size="lg"
            onClick={onToggleListening}
            disabled={isLoading || isSpeaking}
            className={cn(
              "gap-2 min-w-[160px] h-12 text-base transition-all",
              isListening && !isPaused && "shadow-lg shadow-destructive/30"
            )}
          >
            {isListening && !isPaused ? (
              <>
                <MicOff className="h-5 w-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Speaking
              </>
            )}
          </Button>

          {/* Pause/Resume Button */}
          {isListening && (
            <Button
              variant="outline"
              size="sm"
              onClick={isPaused ? onResume : onPause}
              className="gap-2"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              )}
            </Button>
          )}

          {/* Manual Send Button */}
          {hasTranscript && !isListening && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSend}
              disabled={isLoading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 text-sm">
          {isListening && !isPaused && (
            <Badge variant="destructive" className="gap-1.5 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Recording
            </Badge>
          )}
          
          {isPaused && (
            <Badge variant="secondary" className="gap-1.5">
              <Pause className="h-3 w-3" />
              Paused
            </Badge>
          )}
          
          {confidence > 0 && isListening && (
            <Badge variant="outline" className="text-xs">
              Confidence: {Math.round(confidence * 100)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Live Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="p-3 bg-card border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Transcript
            </span>
            {transcript && (
              <span className="text-xs text-muted-foreground">
                {transcript.split(/\s+/).filter(w => w.length > 0).length} words
              </span>
            )}
          </div>
          <p className="text-sm">
            {transcript && <span className="text-foreground">{transcript}</span>}
            {interimTranscript && (
              <span className="text-muted-foreground italic ml-1">
                {interimTranscript}...
              </span>
            )}
          </p>
        </div>
      )}

      {/* Tips */}
      <p className="text-xs text-center text-muted-foreground">
        💡 Speak clearly at a natural pace. Recording stops automatically after a brief pause, or click Stop to finish.
      </p>
    </div>
  );
};
