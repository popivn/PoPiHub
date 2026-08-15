import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faPaperPlane,
  faXmark,
  faTrashCan,
  faComments,
  faCircleCheck,
  faBolt,
  faChevronDown,
  faBrain,
  faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import {
  askGemini,
  askOpenRouter,
  parseAction,
  OPENROUTER_MODELS,
  type ChatMessage,
  type AIProvider,
} from '../utils/gemini';
import { toast } from '../utils/alert';
import type { Zone } from '../types';

/** Thông tin task đã tạo thành công để hiển thị trong chat */
export interface CreatedTaskInfo {
  title: string;
  zoneName: string;
  exp: number;
}

/** Message mở rộng: có thể kèm thông tin task đã tạo */
interface UiMessage extends ChatMessage {
  createdTask?: CreatedTaskInfo;
}

interface ChatPanelProps {
  zones: Zone[];
  /** Handler tạo task từ chat. Trả về thông tin task đã tạo (kèm EXP & zone). */
  onCreateTask: (input: {
    title: string;
    description: string;
    zoneName?: string;
  }) => Promise<CreatedTaskInfo>;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ zones, onCreateTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(
    () => (sessionStorage.getItem('popi_ai_provider') as AIProvider) || 'gemini'
  );
  const [openrouterModel, setOpenrouterModel] = useState<string>(
    () => sessionStorage.getItem('popi_openrouter_model') || 'nvidia/nemotron-3-super-120b-a12b:free'
  );
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: 'model',
      text: 'Xin chào! Tôi là trợ lý AI của Task Tracker. Hôm nay bạn cần thêm task gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Persist provider + model
  useEffect(() => {
    sessionStorage.setItem('popi_ai_provider', provider);
  }, [provider]);
  useEffect(() => {
    sessionStorage.setItem('popi_openrouter_model', openrouterModel);
  }, [openrouterModel]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    const userMsg: UiMessage = { role: 'user', text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);

    try {
      const zoneNames = zones.map((z) => z.name);
      // Giới hạn lịch sử gửi đi: tối đa 5 tin nhắn gần nhất (ít token, tiết kiệm quota)
      const recentHistory = nextHistory
        .slice(-6, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      const raw =
        provider === 'openrouter'
          ? await askOpenRouter(recentHistory, text, zoneNames, openrouterModel)
          : await askGemini(recentHistory, text, zoneNames);

      const parsed = parseAction(raw);

      // Nếu AI yêu cầu tạo task → gọi handler
      if (parsed.createTask) {
        try {
          const created = await onCreateTask(parsed.createTask);
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: parsed.text,
              createdTask: created,
            },
          ]);
          toast.fire({ icon: 'success', title: `Đã thêm task "${created.title}" (+${created.exp} EXP)` });
        } catch (err: any) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'model',
              text: `${parsed.text}\n\n⚠️ Lỗi khi lưu task: ${err?.message || 'unknown'}`,
            },
          ]);
          toast.fire({ icon: 'error', title: 'Lỗi lưu task' });
        }
      } else {
        setMessages((prev) => [...prev, { role: 'model', text: parsed.text }]);
      }
    } catch (err: any) {
      toast.fire({ icon: 'error', title: 'Lỗi gọi AI' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Đã xảy ra lỗi khi gọi AI: ${err?.message || 'unknown'}`,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'model',
        text: 'Đã xóa lịch sử. Hôm nay bạn cần thêm task gì?',
      },
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-95 transition-all"
        title={isOpen ? 'Đóng chat' : 'Mở chat với AI'}
        aria-label="Toggle AI chat"
      >
        <FontAwesomeIcon icon={isOpen ? faXmark : faComments} className="text-lg" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-1.5rem)] sm:w-[30rem] md:w-[36rem] h-[75vh] max-h-[700px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <FontAwesomeIcon icon={faRobot} className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">PoPi AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {provider === 'gemini' ? 'Gemini 3.5 Flash' : OPENROUTER_MODELS.find((m) => m.id === openrouterModel)?.label || openrouterModel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Provider selector */}
              <div className="flex items-center bg-slate-950/60 border border-slate-700 rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setProvider('gemini');
                    setShowModelDropdown(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    provider === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Gemini"
                >
                  <FontAwesomeIcon icon={faBrain} />
                  <span className="hidden sm:inline">Gemini</span>
                </button>
                <button
                  onClick={() => setProvider('openrouter')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    provider === 'openrouter'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="OpenRouter"
                >
                  <FontAwesomeIcon icon={faSitemap} />
                  <span className="hidden sm:inline">OpenRouter</span>
                </button>
              </div>

              {/* Model selector (OpenRouter) */}
              {provider === 'openrouter' && (
                <div className="relative">
                  <button
                    onClick={() => setShowModelDropdown((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                    title="Chọn model"
                  >
                    <span className="hidden sm:inline max-w-[90px] truncate">
                      {OPENROUTER_MODELS.find((m) => m.id === openrouterModel)?.label || openrouterModel}
                    </span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-[8px]" />
                  </button>
                  {showModelDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
                      {OPENROUTER_MODELS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setOpenrouterModel(m.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-700 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-slate-700/50 last:border-0 ${
                            openrouterModel === m.id ? 'bg-indigo-600/20' : ''
                          }`}
                        >
                          <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                            {openrouterModel === m.id && <span className="text-emerald-400">✓</span>}
                            {m.label}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{m.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleClear}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Xóa lịch sử chat"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-950/40"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.text && (
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/60'
                    }`}
                  >
                    {m.text}
                  </div>
                )}

                {/* Task created success card */}
                {m.createdTask && (
                  <div className="max-w-[90%] w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1.5">
                      <FontAwesomeIcon icon={faCircleCheck} />
                      <span>Đã thêm task thành công</span>
                    </div>
                    <div className="bg-slate-900/70 rounded-lg p-2 space-y-1">
                      <div className="text-sm font-bold text-slate-100 truncate">
                        {m.createdTask.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                          {m.createdTask.zoneName}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          <FontAwesomeIcon icon={faBolt} />
                          {m.createdTask.exp} EXP
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/60 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-3 bg-slate-900">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn... (Shift+Enter xuống dòng, Enter gửi)"
                rows={2}
                className="flex-1 resize-y bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 min-h-[3.5rem] max-h-40 w-full"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                title="Gửi"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
