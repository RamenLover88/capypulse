import { useState, useEffect, useRef, useCallback } from "react";
import { T, FONTS_URL, PHASE, MODELS, DEFAULT_INDUSTRY, MAX_CHAT_HISTORY } from "./constants.js";
import { callClaude, extractText, stripCites, parseJSON, parseDraftResponse } from "./lib/api.js";
import { prompts } from "./lib/prompts.js";
import { storageGet, storageSet, STORAGE_KEYS } from "./lib/storage.js";
import SetupView from "./components/SetupView.jsx";
import TopicCard from "./components/TopicCard.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import DraftOutput from "./components/DraftOutput.jsx";
import TopicLog from "./components/TopicLog.jsx";
import Spinner from "./components/Spinner.jsx";
import DraftSkeleton from "./components/DraftSkeleton.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

// ═══════════════════════════════════════════════════════════════════
// CapyPulse — AI Thought Leadership Content Pipeline
// Discover → Discuss → Publish
// ═══════════════════════════════════════════════════════════════════

export default function CapyPulse() {
  const [config, setConfig] = useState(null);
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [restoredTopic, setRestoredTopic] = useState(null);
  const [inputExpanded, setInputExpanded] = useState(false);
  const [topicLog, setTopicLog] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  // ── Init: restore all persisted state ──
  useEffect(() => {
    (async () => {
      const saved = await storageGet(STORAGE_KEYS.config);
      if (saved) { setConfig(saved); setPhase(PHASE.DISCOVER); }
      const log = await storageGet(STORAGE_KEYS.log);
      if (log) setTopicLog(log);
      const session = await storageGet(STORAGE_KEYS.session);
      if (session && saved) {
        if (session.topics?.length) setTopics(session.topics);
        if (session.selectedTopic !== null && session.selectedTopic !== undefined) setSelectedTopic(session.selectedTopic);
        if (session.chatHistory?.length) setChatHistory(session.chatHistory);
        if (session.draft) setDraft(session.draft);
        if (session.phase !== undefined) setPhase(session.phase);
        // Show restore banner
        if (session.phase > PHASE.DISCOVER && session.topics?.length && session.selectedTopic !== null) {
          const topic = session.topics[session.selectedTopic];
          if (topic) {
            setRestoredTopic(topic.headline);
            setTimeout(() => setRestoredTopic(null), 4000);
          }
        }
      }
    })();
  }, []);

  // ── Auto-save session state ──
  useEffect(() => {
    if (phase === PHASE.SETUP) return;
    storageSet(STORAGE_KEYS.session, { phase, topics, selectedTopic, chatHistory, draft });
  }, [phase, topics, selectedTopic, chatHistory, draft]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const cancelRequest = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  // ── Discover ──
  const discoverTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingMsg("Scanning today's landscape…");
    try {
      let searchTopics;
      if (config.customTopics?.length > 0) {
        searchTopics = config.customTopics;
      } else {
        // Generate search terms from industry instead of hardcoded SEED_TOPICS
        const industry = config.industry || DEFAULT_INDUSTRY;
        searchTopics = [
          `${industry} latest news`,
          `${industry} trends breakthroughs`,
          `${industry} controversy debate`,
        ];
      }
      const shuffled = [...searchTopics].sort(() => Math.random() - 0.5).slice(0, 3);
      const query = shuffled.map(t => `${t} 2026`).join("; ");

      const data = await callClaude({
        messages: [{ role: "user", content: `Search for articles published in the last 2 days about: ${query}\n\nToday is ${today}. Industry focus: ${config.industry}.\n\nFind the most trending, high-engagement topics and extract up to 4 for a thought leader post.` }],
        system: prompts.discover(config.industry),
        useSearch: true,
        model: MODELS.sonnet,
        maxTokens: 4000,
      });
      let text = extractText(data);
      console.log("Discover raw response:", text.substring(0, 500));

      // If no text (model may still be doing tool calls), retry without search
      if (!text || text.trim().length < 10) {
        setLoadingMsg("Processing results…");
        const retryData = await callClaude({
          messages: [
            { role: "user", content: `Search for articles published in the last 2 days about: ${query}\n\nToday is ${today}. Industry focus: ${config.industry}.\n\nFind the most trending, high-engagement topics and extract up to 4 for a thought leader post.` },
            { role: "assistant", content: JSON.stringify(data.content) },
            { role: "user", content: "Now extract the topics as JSON based on the search results above. Return ONLY the JSON array, no other text." },
          ],
          system: prompts.discover(config.industry),
          model: MODELS.sonnet,
          maxTokens: 4000,
        });
        text = extractText(retryData);
        console.log("Discover retry response:", text.substring(0, 500));
      }

      const parsed = parseJSON(text);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No topics returned");
      const cleaned = parsed.map(t => ({
        ...t,
        headline: stripCites(t.headline),
        summary: stripCites(t.summary),
        angle: stripCites(t.angle),
      }));

      // ── Verify sources ──
      setLoadingMsg("Verifying sources…");
      const allSources = cleaned.flatMap(t => (t.sources || []).map(s => s.url)).filter(Boolean);
      if (allSources.length > 0) {
        try {
          const verifyData = await callClaude({
            messages: [{ role: "user", content: `Verify these URLs by searching for them. For each URL, determine if it is a real, accessible article.\n\nURLs to verify:\n${allSources.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n\nReturn ONLY a JSON array of objects: [{"url":"…","valid":true/false,"reason":"brief reason"}]\nNo markdown fences.` }],
            system: "You are a fact-checker. Search the web to verify each URL. Mark as valid only if you can confirm the article exists and is accessible. Mark as invalid if the URL appears fabricated, returns 404, or you cannot find it.",
            useSearch: true,
            model: MODELS.haiku,
            maxTokens: 1500,
          });
          const verifyText = extractText(verifyData);
          const verifyResults = parseJSON(verifyText);
          if (Array.isArray(verifyResults)) {
            const invalidUrls = new Set(verifyResults.filter(r => !r.valid).map(r => r.url));
            // Tag each source with verification status
            for (const topic of cleaned) {
              if (topic.sources) {
                topic.sources = topic.sources.map(s => ({
                  ...s,
                  verified: !invalidUrls.has(s.url),
                }));
              }
            }
          }
        } catch (e) {
          console.warn("Source verification failed, continuing without:", e.message);
        }
      }

      setTopics(cleaned);
      setSelectedTopic(null);
    } catch (e) {
      console.error("Discover error:", e);
      setError(`Failed to fetch topics: ${e.message}`);
    }
    setLoading(false);
  }, [config, today]);

  // ── Start Chat ──
  const startChat = async () => {
    if (selectedTopic === null) return;
    const topic = topics[selectedTopic];

    const logEntry = {
      date: new Date().toISOString(),
      industry: config.industry,
      topics: topics.map((t, i) => ({ ...t, selected: i === selectedTopic })),
    };
    const newLog = [...topicLog, logEntry];
    setTopicLog(newLog);
    await storageSet(STORAGE_KEYS.log, newLog);

    const initMsg = {
      role: "assistant",
      content: `Great pick: "${topic.headline}"\n\nHere's what I'm thinking for the angle: ${topic.angle}\n\nSuggested style: ${topic.style}\n\nWhat's your take? Want to go with this angle, or do you have a different perspective? I can also pull up more data if you want to go deeper.\n\nOnce we've shaped the angle, I'll propose an outline — then you can hit "Generate Draft" to create your X thread and LinkedIn post.`,
    };
    setChatHistory([initMsg]);
    setPhase(PHASE.CHAT);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Send Message ──
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInput("");
    setLoading(true);
    setLoadingMsg("Thinking…");

    abortRef.current = new AbortController();
    try {
      const topic = topics[selectedTopic];
      const sourcesDetail = (topic.sources || [])
        .map(s => `- "${s.title}" (${s.url})${s.snippet ? `\n  Key finding: ${s.snippet}` : ""}${s.published_date ? ` [${s.published_date}]` : ""}`)
        .join("\n");
      const contextMsg = {
        role: "user",
        content: `Context: We're crafting a post about "${topic.headline}".\nSummary: ${topic.summary}\nAngle: ${topic.angle}\nStyle: ${topic.style}\n\nSource articles:\n${sourcesDetail}\n\nDiscuss based on these real sources. Reference the URLs above when citing facts.`,
      };
      const contextReply = { role: "assistant", content: "Got it. I'm ready to help craft this post. Let's discuss." };

      const historyMessages = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const trimmedHistory = historyMessages.length > MAX_CHAT_HISTORY
        ? historyMessages.slice(-MAX_CHAT_HISTORY)
        : historyMessages;
      const apiMessages = [contextMsg, contextReply, ...trimmedHistory];

      const searchKeywords = /\b(data|source|evidence|stats|link|proof|研究|数据|来源|证据|原文|文章)\b/i;
      const needsSearch = searchKeywords.test(userMsg.content);

      // After 2 user exchanges, ask AI to propose an outline
      let systemPrompt = prompts.chat(config.industry, config);
      if (newHistory.filter(m => m.role === "user").length >= 2) {
        systemPrompt += `\n\nIMPORTANT: At the end of your response, propose a post outline based on the discussion so far:\n\n📋 Suggested outline:\n1. Hook: ...\n2. Core insight: ...\n3. Supporting evidence: ...\n4. Conclusion/CTA: ...\n\nAsk if the user wants to adjust anything or generate the draft.`;
      }

      const chatData = await callClaude({
        messages: apiMessages,
        system: systemPrompt,
        useSearch: needsSearch,
        maxTokens: 2000,
        signal: abortRef.current.signal,
      });
      const reply = extractText(chatData);
      if (!reply) throw new Error("Empty response");
      setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e.name === "AbortError") {
        // User cancelled — silently ignore
      } else {
        console.error("Chat error:", e);
        setChatHistory((prev) => [...prev, { role: "assistant", content: `Something went wrong: ${e.message}. Please try again.` }]);
      }
    }
    abortRef.current = null;
    setLoading(false);
  };

  // ── Generate Draft ──
  const generateDraft = async () => {
    setLoading(true);
    setDraft(null);
    setPhase(PHASE.DRAFT); // Jump to draft page immediately (shows skeleton)
    abortRef.current = new AbortController();
    try {
      const topic = topics[selectedTopic];
      const conversationSummary = chatHistory
        .map((m) => `${m.role === "user" ? "Me" : "AI"}: ${m.content}`)
        .join("\n\n");

      const draftSourcesDetail = (topic.sources || [])
        .map(s => `- "${s.title}" (${s.url})${s.snippet ? ` — ${s.snippet}` : ""}`)
        .join("\n");
      const data = await callClaude({
        messages: [{
          role: "user",
          content: `Topic: "${topic.headline}"\nSummary: ${topic.summary}\nAngle: ${topic.angle}\nStyle: ${topic.style}\n\nSource articles:\n${draftSourcesDetail}\n\nOur conversation:\n${conversationSummary}\n\nNow generate the final posts and Obsidian note. Use the real source URLs above in the Obsidian note.`,
        }],
        system: prompts.draft(config.industry, config),
        useSearch: false,
        model: MODELS.opus,
        signal: abortRef.current.signal,
      });
      const text = extractText(data);
      const parsed = parseDraftResponse(text);
      setDraft(parsed);
      // Save to draft history
      const draftEntry = { ...parsed, topic: topic.headline, date: new Date().toISOString() };
      const existingDrafts = await storageGet(STORAGE_KEYS.drafts) || [];
      const updatedDrafts = [draftEntry, ...existingDrafts].slice(0, 50);
      await storageSet(STORAGE_KEYS.drafts, updatedDrafts);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Draft error:", e);
        setError(`Failed to generate draft: ${e.message}`);
      }
    }
    abortRef.current = null;
    setLoading(false);
  };

  // ── Edit Message & Resend ──
  const handleEditSave = async (index) => {
    if (!editText.trim() || loading) return;
    cancelRequest();
    const newHistory = chatHistory.slice(0, index);
    const editedMsg = { role: "user", content: editText.trim() };
    newHistory.push(editedMsg);
    setChatHistory(newHistory);
    setEditingIdx(null);
    setEditText("");
    setInput("");
    setLoading(true);
    setLoadingMsg("Thinking…");
    abortRef.current = new AbortController();
    try {
      const topic = topics[selectedTopic];
      const sourcesDetail = (topic.sources || [])
        .map(s => `- "${s.title}" (${s.url})${s.snippet ? `\n  Key finding: ${s.snippet}` : ""}${s.published_date ? ` [${s.published_date}]` : ""}`)
        .join("\n");
      const contextMsg = {
        role: "user",
        content: `Context: We're crafting a post about "${topic.headline}".\nSummary: ${topic.summary}\nAngle: ${topic.angle}\nStyle: ${topic.style}\n\nSource articles:\n${sourcesDetail}\n\nDiscuss based on these real sources. Reference the URLs above when citing facts.`,
      };
      const contextReply = { role: "assistant", content: "Got it. I'm ready to help craft this post. Let's discuss." };
      const historyMessages = newHistory.map((m) => ({ role: m.role, content: m.content }));
      const trimmedHistory = historyMessages.length > MAX_CHAT_HISTORY
        ? historyMessages.slice(-MAX_CHAT_HISTORY)
        : historyMessages;
      const apiMessages = [contextMsg, contextReply, ...trimmedHistory];
      const chatData = await callClaude({
        messages: apiMessages,
        system: prompts.chat(config.industry, config),
        useSearch: false,
        maxTokens: 2000,
        signal: abortRef.current.signal,
      });
      const reply = extractText(chatData);
      if (!reply) throw new Error("Empty response");
      setChatHistory((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Edit resend error:", e);
        setChatHistory((prev) => [...prev, { role: "assistant", content: `Something went wrong: ${e.message}. Please try again.` }]);
      }
    }
    abortRef.current = null;
    setLoading(false);
  };

  // ── Resume from Log ──
  const resumeFromLog = (logTopics, topicIndex) => {
    setTopics(logTopics);
    setSelectedTopic(topicIndex);
    const topic = logTopics[topicIndex];
    const parts = [`Resuming: "${topic.headline}"`];
    if (topic.angle) parts.push(`Angle: ${topic.angle}`);
    if (topic.style) parts.push(`Style: ${topic.style}`);
    parts.push("Let's pick up where we left off. What would you like to discuss?");
    const initMsg = {
      role: "assistant",
      content: parts.join("\n\n"),
    };
    setChatHistory([initMsg]);
    setDraft(null);
    setError(null);
    setPhase(PHASE.CHAT);
    setShowLog(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Reset ──
  const reset = async () => {
    setPhase(PHASE.DISCOVER);
    setTopics([]);
    setSelectedTopic(null);
    setChatHistory([]);
    setDraft(null);
    setError(null);
    await storageSet(STORAGE_KEYS.session, null);
  };

  const resetAll = async () => {
    await storageSet(STORAGE_KEYS.config, null);
    await storageSet(STORAGE_KEYS.session, null);
    setConfig(null);
    setPhase(PHASE.SETUP);
    reset();
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.sans }}>
      <link href={FONTS_URL} rel="stylesheet" />

      {/* ── Header ── */}
      {phase !== PHASE.SETUP && (
        <header className="cp-header" style={{
          padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: T.bg, position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: T.serif, color: T.text, letterSpacing: "-0.02em" }}>
              CapyPulse
            </h1>
            <p onClick={() => setShowSettings(true)} title="Click to change settings" style={{
              margin: 0, fontSize: 12, color: T.textMuted, fontFamily: T.sans,
              cursor: "pointer", borderBottom: `1px dashed ${T.border}`,
            }}>
              {config?.industry}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setShowLog(true)} style={{
              background: "none", border: `1px solid ${T.border}`, borderRadius: 6,
              padding: "5px 10px", fontSize: 12, fontWeight: 500, color: T.textSecondary,
              cursor: "pointer", fontFamily: T.sans,
            }}>
              Log
            </button>
            {phase !== PHASE.DISCOVER && (
              <button onClick={() => {
                if (chatHistory.length > 0 && !window.confirm("Current discussion will be lost. Start over?")) return;
                reset();
              }} style={{
                background: "none", border: `1px solid ${T.border}`, borderRadius: 6,
                padding: "5px 10px", fontSize: 12, color: T.textSecondary, cursor: "pointer",
                fontFamily: T.sans,
              }}>
                ← New
              </button>
            )}
          </div>
        </header>
      )}

      {/* ── Phase Bar ── */}
      {phase >= PHASE.DISCOVER && (
        <div style={{ display: "flex", gap: 4, padding: "0 20px", margin: "12px 0 20px", alignItems: "center" }}>
          {["Discover", "Discuss", "Publish"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize: 12, fontWeight: i <= phase ? 600 : 400,
                color: i <= phase ? T.text : T.textMuted, fontFamily: T.sans,
                transition: "all 0.3s",
              }}>
                {label}
              </span>
              {i < 2 && (
                <span style={{ color: T.border, fontSize: 12, margin: "0 4px" }}>/</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Restore Banner ── */}
      {restoredTopic && (
        <div style={{
          background: T.primaryLight, padding: "8px 20px", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: T.primary, fontFamily: T.sans }}>
            Continuing: <strong>{restoredTopic}</strong>
          </p>
          <button onClick={() => setRestoredTopic(null)} style={{
            background: "none", border: "none", fontSize: 14, color: T.primary, cursor: "pointer",
          }}>✕</button>
        </div>
      )}

      {/* ── Content ── */}
      <main className="cp-main" style={{ padding: "0 20px 100px", maxWidth: 680, margin: "0 auto" }}>

        {/* SETUP */}
        {phase === PHASE.SETUP && <SetupView onComplete={(c) => { setConfig(c); setPhase(PHASE.DISCOVER); }} />}

        {/* DISCOVER */}
        {phase === PHASE.DISCOVER && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 12, color: T.textMuted, fontFamily: T.sans, margin: "0 0 4px" }}>{today}</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, fontFamily: T.serif, color: T.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {topics.length > 0 ? "Today's Topics" : "What's happening today?"}
              </h2>
              {topics.length === 0 && (
                <p style={{ fontSize: 15, color: T.textSecondary, margin: "8px 0 0", lineHeight: 1.5 }}>
                  Scanning {config?.industry} for fresh insights
                </p>
              )}
            </div>

            {topics.length === 0 && !loading && (
              <div>
                <button onClick={discoverTopics} style={{
                  background: T.text, border: "none", borderRadius: 8, padding: "14px 28px",
                  color: T.bg, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.sans,
                  transition: "all 0.2s", letterSpacing: "0.01em",
                }}>
                  Scan topics
                </button>
              </div>
            )}

            {loading && <Spinner message={loadingMsg} />}

            {topics.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginBottom: 24 }}>
                  {topics.map((t, i) => (
                    <TopicCard key={i} topic={t} index={i} onSelect={setSelectedTopic} selected={selectedTopic} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={startChat} disabled={selectedTopic === null} style={{
                    background: selectedTopic !== null ? T.text : T.borderLight,
                    border: "none", borderRadius: 8, padding: "12px 24px",
                    color: selectedTopic !== null ? T.bg : T.textMuted,
                    fontSize: 14, fontWeight: 600, cursor: selectedTopic !== null ? "pointer" : "default",
                    fontFamily: T.sans, transition: "all 0.2s",
                  }}>
                    Discuss this topic
                  </button>
                  <button onClick={discoverTopics} disabled={loading} style={{
                    background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: "12px 16px", color: T.textSecondary, fontSize: 13,
                    cursor: "pointer", fontFamily: T.sans,
                  }}>
                    Refresh
                  </button>
                </div>
              </>
            )}

            {error && <p style={{ textAlign: "center", color: T.accent, fontSize: 13, marginTop: 16, fontFamily: T.sans }}>{error}</p>}
          </div>
        )}

        {/* CHAT */}
        {phase === PHASE.CHAT && (
          <div>
            <div className="cp-chat-scroll" style={{
              maxHeight: "52vh", overflowY: "auto", marginBottom: 16, padding: "4px 0",
              scrollbarWidth: "thin", scrollbarColor: `${T.border} transparent`,
            }}>
              {chatHistory.map((msg, i) => (
                <ChatMessage
                  key={i} msg={msg} index={i} loading={loading}
                  isEditing={editingIdx === i} editText={editText}
                  onEditStart={(idx, text) => { setEditingIdx(idx); setEditText(text); }}
                  onEditChange={setEditText}
                  onEditSave={handleEditSave}
                  onEditCancel={() => { setEditingIdx(null); setEditText(""); }}
                />
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 5, padding: "8px 16px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%", background: T.primary, opacity: 0.4,
                      animation: `capypulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", position: "relative" }}>
              <div className="cp-input-area" style={{
                flex: 1, background: T.card, border: `1.5px solid ${T.border}`,
                borderRadius: 16, padding: "4px 4px 4px 16px", display: "flex", alignItems: "flex-end",
                boxShadow: T.shadow, position: "relative",
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize
                    const el = e.target;
                    el.style.height = "auto";
                    const maxH = inputExpanded ? window.innerHeight * 0.5 : 120;
                    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Share your take, ask for data, or say 'draft it'…"
                  rows={1}
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: T.text, fontSize: 14, fontFamily: T.sans,
                    resize: "none", padding: "10px 0", lineHeight: 1.5,
                    maxHeight: inputExpanded ? "50vh" : 120, overflowY: "auto",
                    transition: "max-height 0.2s ease",
                  }}
                />
                {/* Expand/Shrink button — show when content is tall */}
                {input.length > 100 && (
                  <button
                    onClick={() => setInputExpanded(!inputExpanded)}
                    style={{
                      position: "absolute", bottom: 6, right: 48,
                      background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 4,
                      padding: "1px 6px", fontSize: 10, color: T.textMuted,
                      cursor: "pointer", fontFamily: T.sans,
                    }}
                  >
                    {inputExpanded ? "Shrink" : "Expand"}
                  </button>
                )}
                {loading ? (
                  <button onClick={cancelRequest} style={{
                    background: T.accent, border: "none", borderRadius: 10, width: 38, height: 38,
                    color: "#fff", fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                  }}>
                    ■
                  </button>
                ) : (
                  <button onClick={sendMessage} disabled={!input.trim()} style={{
                    background: input.trim() ? T.primary : T.borderLight,
                    border: "none", borderRadius: 10, width: 38, height: 38,
                    color: input.trim() ? "#fff" : T.textMuted,
                    fontSize: 16, cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                  }}>
                    ↑
                  </button>
                )}
              </div>
            </div>

            {!loading && chatHistory.length >= 1 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  "Challenge this angle",
                  "Find supporting data",
                  "What are people saying on X/Reddit?",
                  "Give me a counterargument",
                  "Find more perspectives on this",
                  "What would a skeptic say?",
                  "Make it more personal",
                  "Propose an outline",
                ].slice(0, chatHistory.length < 4 ? 6 : 4).map((chip) => (
                  <button key={chip} onClick={() => { setInput(chip); }} style={{
                    background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: 20,
                    padding: "5px 12px", fontSize: 11, color: T.textSecondary,
                    cursor: "pointer", fontFamily: T.sans, transition: "all 0.2s",
                  }}>
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 12 }}>
              {(() => {
                const lastAi = [...chatHistory].reverse().find(m => m.role === "assistant");
                const hasOutline = lastAi && /outline|📋/i.test(lastAi.content);
                const canDraft = chatHistory.length >= 3;
                return (
                  <>
                    <button onClick={generateDraft} disabled={loading || !canDraft} style={{
                      background: hasOutline ? T.accent : canDraft ? T.text : T.borderLight,
                      border: "none", borderRadius: 8, padding: "10px 20px",
                      color: canDraft ? T.bg : T.textMuted,
                      fontSize: 13, fontWeight: 600, cursor: canDraft ? "pointer" : "default",
                      fontFamily: T.sans, transition: "all 0.2s",
                      transform: hasOutline ? "scale(1.03)" : "scale(1)",
                    }}>
                      Generate Draft ✦
                    </button>
                    {!canDraft && (
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0, fontFamily: T.sans }}>
                        Discuss your angle first — draft unlocks after a few exchanges
                      </p>
                    )}
                    {hasOutline && (
                      <p style={{ fontSize: 11, color: T.accent, margin: 0, fontFamily: T.sans, fontWeight: 600 }}>
                        Outline ready — click above to generate your posts
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* DRAFT — skeleton while loading */}
        {phase === PHASE.DRAFT && !draft && loading && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 6px", fontFamily: T.serif, letterSpacing: "-0.02em" }}>
                Generating draft...
              </h2>
              <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
                Crafting your X thread, LinkedIn post, and Obsidian note.
              </p>
            </div>
            <DraftSkeleton />
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button onClick={() => { cancelRequest(); setPhase(PHASE.CHAT); }} style={{
                background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
                padding: "10px 18px", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: T.sans,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* DRAFT — content ready */}
        {phase === PHASE.DRAFT && draft && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", fontFamily: T.serif }}>
                Ready to publish
              </h2>
              <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
                Copy each version. Paste the Obsidian note into your vault.
              </p>
            </div>
            <div style={{
              background: T.accentLight, border: `1px solid ${T.accent}33`, borderRadius: 10,
              padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>⚠</span>
              <p style={{ margin: 0, fontSize: 12, color: T.accent, fontFamily: T.sans, lineHeight: 1.4 }}>
                Please verify all facts, sources, and links before publishing.
              </p>
            </div>
            {/* Sources list for verification */}
            {(() => {
              const topic = topics[selectedTopic];
              const sources = topic?.sources || [];
              if (sources.length === 0) return null;
              return (
                <div style={{
                  background: T.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                  border: `1px solid ${T.borderLight}`,
                }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: T.textSecondary, fontFamily: T.sans }}>
                    Sources — click to verify
                  </h4>
                  {sources.map((s, i) => (
                    <div key={i} style={{ marginBottom: 8, padding: "6px 0", borderBottom: i < sources.length - 1 ? `1px solid ${T.borderLight}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {s.verified !== undefined && (
                          <span style={{
                            fontSize: 10, fontFamily: T.mono, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                            background: s.verified ? "#e8f0ea" : "#fdf0e4",
                            color: s.verified ? T.primary : T.accent,
                          }}>
                            {s.verified ? "verified" : "unverified"}
                          </span>
                        )}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{
                          fontSize: 13, color: T.primary, fontFamily: T.sans, textDecoration: "underline",
                          wordBreak: "break-all",
                        }}>
                          {s.title || s.url}
                        </a>
                        {s.published_date && (
                          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.mono, flexShrink: 0 }}>
                            {s.published_date}
                          </span>
                        )}
                      </div>
                      {s.snippet && (
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: T.textSecondary, fontFamily: T.sans, lineHeight: 1.4 }}>
                          {s.snippet}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
            <DraftOutput draft={draft} onDraftChange={setDraft} />
            <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => setPhase(PHASE.CHAT)} style={{
                background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
                padding: "10px 18px", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: T.sans,
              }}>
                Back to chat
              </button>
              <button onClick={reset} style={{
                background: T.text, border: "none", borderRadius: 8, padding: "10px 18px",
                color: T.bg, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.sans,
              }}>
                New post
              </button>
            </div>
          </div>
        )}

        {loading && phase > PHASE.DISCOVER && phase !== PHASE.CHAT && <Spinner message={loadingMsg} />}
        {error && phase !== PHASE.DISCOVER && (
          <p style={{ textAlign: "center", color: T.accent, fontSize: 13, marginTop: 16 }}>{error}</p>
        )}
      </main>

      {showLog && <TopicLog log={topicLog} onClose={() => setShowLog(false)} onResume={resumeFromLog} />}

      {showSettings && (
        <SettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSave={async (newConfig) => {
            setConfig(newConfig);
            await storageSet(STORAGE_KEYS.config, newConfig);
          }}
        />
      )}

      {phase >= PHASE.DISCOVER && (
        <div style={{ position: "fixed", bottom: 16, right: 20 }}>
          <button onClick={resetAll} style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
            padding: "5px 10px", fontSize: 11, color: T.textMuted, cursor: "pointer",
            fontFamily: T.sans,
          }}>
            Reset
          </button>
        </div>
      )}

      <style>{`
        @keyframes capyspin { to { transform: rotate(360deg); } }
        @keyframes capypulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        textarea::placeholder { color: ${T.textMuted}; }
        input::placeholder { color: ${T.textMuted}; }
        input:focus, textarea:focus { border-color: ${T.primary} !important; }
        /* Focus indicators */
        button:focus-visible, a:focus-visible, textarea:focus-visible, input:focus-visible {
          outline: 2px solid ${T.primary};
          outline-offset: 2px;
        }
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        /* Mobile responsive */
        @media (max-width: 640px) {
          .cp-main { padding: 0 16px 80px !important; }
          .cp-header { padding: 10px 16px !important; }
          .cp-chat-scroll { max-height: 60vh !important; }
          .cp-input-area textarea { font-size: 16px !important; }
          .cp-modal {
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 12px 12px 0 0 !important;
            margin-top: auto !important;
            padding: 20px !important;
          }
          .cp-draft-textarea { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
