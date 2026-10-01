"use client";

import { useRef, useState } from "react";
import { Check, CornerDownLeft, MessageSquare, Send, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useEditor } from "@/store/editor";
import { cn, formatTime } from "@/lib/utils";
import type { CommentDto } from "@/lib/types";

function Composer({
  placeholder,
  onPost,
  onCancel,
  autoFocus,
}: {
  placeholder: string;
  onPost: (body: string) => void | Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const busy = useRef(false);

  const submit = async () => {
    const body = value.trim();
    if (!body || busy.current) return;
    busy.current = true;
    await onPost(body);
    busy.current = false;
    setValue("");
  };

  return (
    <div className="rounded-lg border border-line bg-card p-2 focus-within:border-brand-400">
      <textarea
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-ink-800 outline-none placeholder:text-ink-400"
      />
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-ink-400">{onCancel ? "Esc to cancel" : "Ctrl+Enter to send"}</span>
        <span className="flex gap-1.5">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2 py-1 text-[12px] font-semibold text-ink-500 hover:bg-line-soft"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            disabled={!value.trim()}
            onClick={() => void submit()}
            className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-[12px] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            <Send className="size-3.5" /> Post
          </button>
        </span>
      </div>
    </div>
  );
}

function CommentCard({ comment, isReply = false }: { comment: CommentDto; isReply?: boolean }) {
  const selfUserId = useEditor((s) => s.selfUserId);
  const activeId = useEditor((s) => s.activeCommentId);
  const resolveComment = useEditor((s) => s.resolveComment);
  const deleteComment = useEditor((s) => s.deleteComment);
  const createComment = useEditor((s) => s.createComment);
  const setActiveComment = useEditor((s) => s.setActiveComment);
  const [replying, setReplying] = useState(false);
  const active = activeId === comment.id;
  const mine = selfUserId === comment.author.id;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        active ? "border-brand-300 ring-2 ring-brand-100" : "border-line",
        comment.resolved && "opacity-60",
      )}
      onClick={() => setActiveComment(comment.id)}
    >
      <div className="flex items-center gap-2">
        <Avatar name={comment.author.displayName} src={comment.author.avatarUrl} color={comment.author.color} size="sm" />
        <span className="flex-1 truncate text-[13px] font-bold text-ink-900">{comment.author.displayName}</span>
        <span className="text-[11px] text-ink-400">{formatTime(comment.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-ink-700">{comment.body}</p>

      {!isReply ? (
        <div className="mt-2.5 flex items-center gap-3 text-[12px] font-semibold">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setReplying((v) => !v);
            }}
            className="inline-flex items-center gap-1 text-ink-500 hover:text-brand-600"
          >
            <CornerDownLeft className="size-3.5" /> Reply
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void resolveComment(comment.id, !comment.resolved);
            }}
            className={cn(
              "inline-flex items-center gap-1",
              comment.resolved ? "text-live hover:text-ink-500" : "text-ink-500 hover:text-live",
            )}
          >
            <Check className="size-3.5" /> {comment.resolved ? "Resolved" : "Resolve"}
          </button>
          {mine ? (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={(e) => {
                e.stopPropagation();
                void deleteComment(comment.id);
              }}
              className="ml-auto inline-flex items-center gap-1 text-ink-400 hover:text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {replying ? (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <Composer
            autoFocus
            placeholder="Write a reply…"
            onCancel={() => setReplying(false)}
            onPost={async (body) => {
              await createComment({ body, x: comment.x, y: comment.y, parentId: comment.id });
              setReplying(false);
            }}
          />
        </div>
      ) : null}

      {!isReply && comment.replies.length > 0 ? (
        <div className="mt-3 space-y-2 border-l-2 border-line-soft pl-3">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} isReply />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentsPanel() {
  const comments = useEditor((s) => s.comments);
  const pendingComment = useEditor((s) => s.pendingComment);
  const createComment = useEditor((s) => s.createComment);
  const setPendingComment = useEditor((s) => s.setPendingComment);

  const roots = comments.filter((c) => !c.parentId);
  const unresolved = roots.filter((c) => !c.resolved);
  const resolved = roots.filter((c) => c.resolved);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {roots.length === 0 && !pendingComment ? (
          <div className="px-4 py-10 text-center text-[13px] leading-relaxed text-ink-400">
            <MessageSquare className="mx-auto mb-2 size-5" />
            No comments yet.
            <br />
            Pick the comment tool and click the canvas to leave feedback.
          </div>
        ) : null}

        {unresolved.length > 0 ? <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-400">Open</p> : null}
        {unresolved.map((c) => (
          <CommentCard key={c.id} comment={c} />
        ))}

        {resolved.length > 0 ? (
          <>
            <p className="px-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">Resolved</p>
            {resolved.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
          </>
        ) : null}
      </div>

      {pendingComment ? (
        <div className="border-t border-line bg-surface p-3">
          <p className="mb-2 text-[12px] font-semibold text-ink-500">
            New comment at ({Math.round(pendingComment.x)}, {Math.round(pendingComment.y)})
          </p>
          <Composer
            autoFocus
            placeholder="Leave a comment on the canvas…"
            onCancel={() => setPendingComment(null)}
            onPost={async (body) => {
              await createComment({ body, x: pendingComment.x, y: pendingComment.y });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
