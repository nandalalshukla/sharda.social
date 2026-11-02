import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "search.recent";
const MAX = 6;

/** The last few searches, newest first, remembered across launches. */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecent(parsed.filter((x): x is string => typeof x === "string").slice(0, MAX));
      })
      .catch(() => undefined);
  }, []);

  const persist = (next: string[]) => {
    setRecent(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const add = useCallback(
    (term: string) => {
      const t = term.trim();
      if (t.length < 2) return;
      persist([t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recent],
  );

  const clear = useCallback(() => persist([]), []);
  const remove = useCallback((term: string) => persist(recent.filter((r) => r !== term)), [recent]);

  return { recent, add, clear, remove };
}
