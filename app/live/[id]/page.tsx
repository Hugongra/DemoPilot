"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Play, Loader2, Send, PhoneOff, MessageSquare, Volume2, VolumeX,
} from "lucide-react";

interface TranscriptEntry {
  role: "agent" | "viewer";
  text: string;
  timestamp: number;
}

export default function LiveDemoViewer() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<"connecting" | "active" | "ended">("connecting");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [frameData, setFrameData] = useState("");
  const [fps, setFps] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const playingAudioRef = useRef(false);
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const mutedRef = useRef(muted);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const scrollToBottom = useCallback(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [transcript, scrollToBottom]);

  const playNextAudio = useCallback(() => {
    if (playingAudioRef.current || mutedRef.current || audioQueueRef.current.length === 0) return;
    playingAudioRef.current = true;

    const base64 = audioQueueRef.current.shift()!;
    try {
      const byteChars = atob(base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audio.volume = 1;
      audio.onended = () => {
        playingAudioRef.current = false;
        URL.revokeObjectURL(url);
        playNextAudio();
      };
      audio.onerror = () => {
        playingAudioRef.current = false;
        URL.revokeObjectURL(url);
        playNextAudio();
      };
      audio.play().catch(() => {
        playingAudioRef.current = false;
        URL.revokeObjectURL(url);
        playNextAudio();
      });
    } catch {
      playingAudioRef.current = false;
      playNextAudio();
    }
  }, []);

  function unlockAudio() {
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    setAudioUnlocked(true);

    if (audioQueueRef.current.length > 0) {
      playNextAudio();
    }
  }

  useEffect(() => {
    if (id === "new") return;

    fetch(`/api/live/${id}/start`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) { setStatus("ended"); return; }

        const es = new EventSource(`/api/live/${id}/stream`);
        eventSourceRef.current = es;

        es.addEventListener("connected", () => setStatus("active"));

        es.addEventListener("frame", (e) => {
          setFrameData(`data:image/jpeg;base64,${e.data}`);
          frameCountRef.current++;
        });

        es.addEventListener("agent_text", (e) => {
          setTranscript((prev) => [...prev, { role: "agent", text: e.data, timestamp: Date.now() }]);
        });

        es.addEventListener("viewer_text", (e) => {
          setTranscript((prev) => [...prev, { role: "viewer", text: e.data, timestamp: Date.now() }]);
        });

        es.addEventListener("audio", (e) => {
          audioQueueRef.current.push(e.data);
          playNextAudio();
        });

        es.addEventListener("ended", () => { setStatus("ended"); es.close(); });
        es.onerror = () => { if (es.readyState === EventSource.CLOSED) setStatus("ended"); };
      })
      .catch(() => setStatus("ended"));

    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      eventSourceRef.current?.close();
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
  }, [id, playNextAudio]);

  async function handleSendMessage() {
    if (!message.trim() || sending) return;
    const text = message.trim();
    setMessage("");
    setSending(true);
    try {
      await fetch(`/api/live/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
    } catch { /* SSE delivers response */ }
    finally { setSending(false); }
  }

  async function handleEnd() {
    try { await fetch(`/api/live/${id}/end`, { method: "POST" }); } catch { /* */ }
    eventSourceRef.current?.close();
    setStatus("ended");
  }

  if (status === "connecting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-warm" />
        <p className="text-sm text-stone-400">Launching AI agent...</p>
        <p className="mt-1 text-xs text-stone-600">This may take 10-15 seconds</p>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-950">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-800">
          <PhoneOff className="h-7 w-7 text-stone-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">Demo ended</h2>
        <p className="mb-6 text-sm text-stone-400">
          {transcript.length > 0 ? `${transcript.length} messages exchanged` : "Thanks for watching!"}
        </p>
        <div className="flex gap-3">
          <a href="/dashboard" className="rounded-xl bg-warm px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
            Get Started
          </a>
          <a href="/" className="rounded-xl border border-stone-700 px-6 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-800">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-stone-950">
      {/* Audio unlock banner */}
      {!audioUnlocked && !muted && (
        <div className="flex items-center justify-center gap-3 bg-warm/90 px-4 py-2 text-sm text-white">
          <Volume2 className="h-4 w-4" />
          <span>Click to enable agent voice</span>
          <button onClick={unlockAudio}
            className="rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">
            Enable Audio
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Browser view */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <a href="/" className="flex h-6 w-6 items-center justify-center rounded bg-white">
                  <Play className="h-3 w-3 fill-stone-900 text-stone-900" />
                </a>
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
                <span className="text-xs text-stone-500">{fps} fps</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setMuted(!muted)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button onClick={() => setShowChatMobile(!showChatMobile)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white lg:hidden">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button onClick={handleEnd}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700">
                <PhoneOff className="h-3.5 w-3.5" /> End
              </button>
            </div>
          </div>

          {/* Stream — full width, cover the area */}
          <div className="relative flex-1 bg-stone-950 overflow-hidden">
            {frameData ? (
              <img src={frameData} alt="Live browser"
                className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-700" />
              </div>
            )}

            {/* Latest agent message as overlay caption */}
            {transcript.length > 0 && transcript[transcript.length - 1].role === "agent" && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="mx-auto max-w-2xl rounded-xl bg-black/70 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                  {transcript[transcript.length - 1].text}
                </div>
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-white">
                <Play className="h-2.5 w-2.5 fill-stone-900 text-stone-900" />
              </div>
              <span className="text-[10px] font-medium text-stone-300">DemoPilot</span>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        <div className={`flex w-80 flex-col border-l border-stone-800 bg-stone-900 ${showChatMobile ? "fixed inset-y-0 right-0 z-50" : "hidden lg:flex"}`}>
          <div className="border-b border-stone-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <MessageSquare className="h-4 w-4 text-stone-400" /> Chat
              </h3>
              <button onClick={() => setShowChatMobile(false)} className="text-stone-500 hover:text-white lg:hidden text-xs">Close</button>
            </div>
            <p className="mt-0.5 text-[11px] text-stone-500">Ask questions or request navigation</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {transcript.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-stone-600">Waiting for agent...</p>
              </div>
            )}
            {transcript.map((entry, i) => (
              <div key={i} className={`flex ${entry.role === "viewer" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  entry.role === "viewer"
                    ? "bg-warm text-white rounded-br-sm"
                    : "bg-stone-800 text-stone-200 rounded-bl-sm"
                }`}>
                  {entry.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-stone-800 px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                </div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          <div className="border-t border-stone-800 p-3">
            <div className="flex gap-2">
              <input value={message} onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask something..."
                className="h-10 flex-1 rounded-lg border border-stone-700 bg-stone-800 px-3 text-sm text-white placeholder:text-stone-500 focus:border-warm focus:outline-none" />
              <button onClick={handleSendMessage} disabled={!message.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-warm text-white transition-all hover:opacity-80 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
