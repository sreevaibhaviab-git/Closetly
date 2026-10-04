"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Brain,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  addStylistMessage,
  clearStylistMessages,
  getStylePreferences,
  getStylistMessages,
  mergeStylePreferences,
  type StyleMemoryPatch,
  type StylePreferences,
  type StylistMessage,
} from "@/lib/supabase/stylist";
import {
  getWardrobeItems,
  type WardrobeItem,
} from "@/lib/supabase/wardrobe";
import styles from "./page.module.css";

type StylistResponse = {
  success: boolean;
  reply?: string;
  memory_patch?: StyleMemoryPatch;
  message?: string;
};

const STARTER_PROMPTS = [
  "Build me a polished dinner outfit.",
  "I prefer quiet luxury and neutral colours.",
  "Stop recommending shorts for five days.",
  "What should I wear for a casual coffee date?",
];

export default function StylistChatPage() {
  const [messages, setMessages] = useState<StylistMessage[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [preferences, setPreferences] =
    useState<StylePreferences | null>(null);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadChat() {
      try {
        setIsLoading(true);
        setStatusMessage("");

        const [
          storedMessages,
          wardrobeItems,
          storedPreferences,
        ] = await Promise.all([
          getStylistMessages(),
          getWardrobeItems(),
          getStylePreferences(),
        ]);

        setMessages(storedMessages);

        setWardrobe(
          wardrobeItems.filter(
            (item) => !item.is_in_laundry
          )
        );

        setPreferences(storedPreferences);
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Could not open your Closetly stylist."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  const activeMemoryCount = useMemo(() => {
    if (!preferences) {
      return 0;
    }

    return (
      preferences.avoid_items.length +
      preferences.avoid_colors.length +
      preferences.preferred_items.length +
      preferences.preferred_colors.length +
      preferences.preferred_styles.length +
      preferences.temporary_avoidances.length +
      preferences.notes.length
    );
  }, [preferences]);

  async function handleSend(event?: FormEvent) {
    event?.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setInput("");
    setStatusMessage("");
    setIsSending(true);

    try {
      const storedUserMessage =
        await addStylistMessage(
          "user",
          trimmedMessage
        );

      setMessages((current) => [
        ...current,
        storedUserMessage,
      ]);

      const response = await fetch("/api/stylist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          currentDate: new Date()
            .toISOString()
            .slice(0, 10),

          wardrobe: wardrobe.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            color: item.color,
            is_favorite: item.is_favorite,
          })),

          preferences,

          history: messages
            .slice(-12)
            .map((item) => ({
              role: item.role,
              content: item.content,
            })),
        }),
      });

      const data =
        (await response.json()) as StylistResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.reply
      ) {
        throw new Error(
          data.message ||
            "The AI stylist could not reply."
        );
      }

      if (data.memory_patch) {
        const updatedPreferences =
          await mergeStylePreferences(
            data.memory_patch
          );

        setPreferences(updatedPreferences);
      }

      const storedAssistantMessage =
        await addStylistMessage(
          "assistant",
          data.reply
        );

      setMessages((current) => [
        ...current,
        storedAssistantMessage,
      ]);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not send your message."
      );

      setInput(trimmedMessage);
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void handleSend();
    }
  }

  async function handleClearChat() {
    if (messages.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Clear this conversation? Your saved style preferences will remain."
    );

    if (!confirmed) {
      return;
    }

    try {
      await clearStylistMessages();
      setMessages([]);
      setStatusMessage("Chat history cleared.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not clear the conversation."
      );
    }
  }

  function useStarterPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <>
      <PageHeader
        eyebrow="Personal styling"
        title="Closet chat"
        subtitle="Ask for styling help or tell Closetly what you love, dislike or want paused."
      />

      <div className={styles.layout}>
        <section className={styles.chatPanel}>
          <header className={styles.chatHeader}>
            <div className={styles.stylistIdentity}>
              <div
                className={styles.stylistIcon}
                aria-hidden="true"
              >
                <Sparkles size={19} />
              </div>

              <div>
                <p className={styles.stylistName}>
                  Closetly AI Stylist
                </p>

                <p className={styles.stylistStatus}>
                  <span
                    className={styles.onlineDot}
                    aria-hidden="true"
                  />
                  Ready · {wardrobe.length} available pieces
                </p>
              </div>
            </div>

            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 size={15} />
              <span>Clear chat</span>
            </button>
          </header>

          <div className={styles.messages}>
            {isLoading ? (
              <div className={styles.loadingState}>
                <LoaderCircle
                  size={28}
                  className={styles.spinner}
                />
                <p>Opening your personal stylist...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className={styles.emptyChat}>
                <div
                  className={styles.emptyChatIcon}
                  aria-hidden="true"
                >
                  <MessageCircle size={27} />
                </div>

                <h2>Start with anything</h2>

                <p>
                  Ask for an outfit, explain a concern or
                  teach Closetly what should and should not
                  appear in future recommendations.
                </p>

                <div className={styles.promptGrid}>
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className={styles.promptButton}
                      onClick={() =>
                        useStarterPrompt(prompt)
                      }
                    >
                      <Sparkles size={14} />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((item) => {
                const isUser = item.role === "user";

                return (
                  <div
                    key={item.id}
                    className={`${styles.messageRow} ${
                      isUser
                        ? styles.userMessageRow
                        : styles.assistantMessageRow
                    }`}
                  >
                    <div
                      className={`${styles.avatar} ${
                        isUser
                          ? styles.userAvatar
                          : styles.assistantAvatar
                      }`}
                      aria-hidden="true"
                    >
                      {isUser ? (
                        <UserRound size={17} />
                      ) : (
                        <Sparkles size={17} />
                      )}
                    </div>

                    <div
                      className={`${styles.messageBubble} ${
                        isUser
                          ? styles.userBubble
                          : styles.assistantBubble
                      }`}
                    >
                      <p>{item.content}</p>
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div
                className={`${styles.messageRow} ${styles.assistantMessageRow}`}
              >
                <div
                  className={`${styles.avatar} ${styles.assistantAvatar}`}
                  aria-hidden="true"
                >
                  <Sparkles size={17} />
                </div>

                <div
                  className={`${styles.messageBubble} ${styles.assistantBubble}`}
                >
                  <div
                    className={styles.typingIndicator}
                    aria-label="Closetly is typing"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className={styles.composer}
            onSubmit={handleSend}
          >
            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleComposerKeyDown}
              placeholder="Ask your stylist or share a preference..."
              className={styles.composerInput}
              rows={1}
              disabled={isLoading}
            />

            <button
              type="submit"
              className={styles.sendButton}
              disabled={
                !input.trim() ||
                isSending ||
                isLoading
              }
              aria-label="Send message"
            >
              {isSending ? (
                <LoaderCircle
                  size={19}
                  className={styles.spinner}
                />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>

          <p className={styles.composerHint}>
            Press Enter to send · Shift + Enter for a
            new line
          </p>

          {statusMessage && (
            <p
              role="status"
              className={styles.statusMessage}
            >
              {statusMessage}
            </p>
          )}
        </section>

        <aside className={styles.memoryPanel}>
          <div className={styles.memoryHeader}>
            <div>
              <p className={styles.eyebrow}>
                Style memory
              </p>

              <h2>What Closetly remembers</h2>
            </div>

            <span className={styles.memoryCount}>
              {activeMemoryCount}
            </span>
          </div>

          {!preferences ||
          activeMemoryCount === 0 ? (
            <div className={styles.emptyMemory}>
              <div
                className={styles.emptyMemoryIcon}
                aria-hidden="true"
              >
                <Brain size={23} />
              </div>

              <p>
                Preferences you share in the chat will
                appear here and shape future styling.
              </p>
            </div>
          ) : (
            <div className={styles.memoryGroups}>
              <MemoryGroup
                title="Avoid"
                items={[
                  ...preferences.avoid_items,
                  ...preferences.avoid_colors,
                ]}
              />

              <MemoryGroup
                title="Prefer"
                items={[
                  ...preferences.preferred_items,
                  ...preferences.preferred_colors,
                  ...preferences.preferred_styles,
                ]}
              />

              <MemoryGroup
                title="Notes"
                items={preferences.notes}
              />

              {preferences.temporary_avoidances
                .length > 0 && (
                <div className={styles.memoryGroup}>
                  <p className={styles.memoryLabel}>
                    Temporary pauses
                  </p>

                  <div className={styles.memoryTags}>
                    {preferences.temporary_avoidances.map(
                      (item) => (
                        <span
                          key={`${item.term}-${item.until}`}
                          className={styles.memoryTag}
                        >
                          {item.term}
                          <small>
                            until{" "}
                            {formatMemoryDate(
                              item.until
                            )}
                          </small>
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.memoryNotice}>
            <Sparkles size={15} />

            <p>
              Style memory remains saved even when you
              clear the conversation.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function MemoryGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.memoryGroup}>
      <p className={styles.memoryLabel}>
        {title}
      </p>

      <div className={styles.memoryTags}>
        {items.map((item) => (
          <span
            key={`${title}-${item}`}
            className={styles.memoryTag}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatMemoryDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}