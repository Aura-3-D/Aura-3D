import { ThumbsUp } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useAura } from "@/lib/store";
import { toggleUpvote } from "@/lib/vote";

function halt(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function UpvoteControl({
  cardId,
  mine,
  upvotes = 0,
  voted = false,
  onChange,
}: {
  cardId: string;
  mine?: boolean;
  upvotes?: number;
  voted?: boolean;
  onChange?: (next: { upvotes: number; voted: boolean }) => void;
}) {
  const locale = useAura((s) => s.locale);
  const [count, setCount] = useState(upvotes);
  const [on, setOn] = useState(voted);
  const [busy, setBusy] = useState(false);

  if (mine || !cardId.startsWith("custom-p-")) return null;

  async function send(event: MouseEvent) {
    halt(event);
    if (busy) return;
    setBusy(true);
    try {
      const res = await toggleUpvote({ data: { cardId } });
      if (!res.ok) return;
      setCount(res.upvotes);
      setOn(res.voted);
      onChange?.({ upvotes: res.upvotes, voted: res.voted });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="glass"
      size="sm"
      className="rounded-full px-2.5"
      aria-label={t(locale, "upvote")}
      aria-pressed={on}
      disabled={busy}
      onPointerDown={halt}
      onClick={(event) => void send(event)}
    >
      <ThumbsUp className={on ? "fill-fg" : ""} />
      <span className="tabular-nums text-xs">{count}</span>
    </Button>
  );
}
