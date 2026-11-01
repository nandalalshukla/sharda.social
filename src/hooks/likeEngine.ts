import { toggleLike } from "@/api/social";

/**
 * The like endpoint is a *toggle*, not "set to X". If a student taps the
 * heart three times in a second and we naively fire three requests, they can
 * land out of order, or cancel each other, and leave the heart showing one
 * thing and the server holding another.
 *
 * So taps are coalesced per target: the UI updates instantly (optimistic),
 * at most one request is in flight, and when it returns we send another only
 * if what the student last wanted differs from what the server now holds.
 */
interface Entry {
  desired: boolean;
  confirmed: boolean;
  running: boolean;
}

const entries = new Map<string, Entry>();

export interface LikeHandlers {
  /** Called immediately, and again with the server's real count when known. */
  apply: (liked: boolean, count?: number) => void;
  /** Called if the request fails, with the last state the server confirmed. */
  rollback: (liked: boolean) => void;
  onError: (error: unknown) => void;
}

export async function setLiked(
  targetType: "post" | "comment",
  targetId: string,
  currentlyLiked: boolean,
  desired: boolean,
  handlers: LikeHandlers,
) {
  const key = `${targetType}:${targetId}`;
  handlers.apply(desired);

  const existing = entries.get(key);
  if (existing?.running) {
    existing.desired = desired;
    return;
  }

  const entry: Entry = { desired, confirmed: currentlyLiked, running: true };
  entries.set(key, entry);

  try {
    while (entry.desired !== entry.confirmed) {
      const result = await toggleLike(targetId, targetType);
      entry.confirmed = result.liked;
      handlers.apply(entry.desired, result.count);
    }
  } catch (error) {
    handlers.rollback(entry.confirmed);
    handlers.onError(error);
  } finally {
    entries.delete(key);
  }
}
