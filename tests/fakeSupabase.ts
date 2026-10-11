import type { SbClient, SbFilterBuilder, SbQueryBuilder, SbResponse } from "../src/store/supabaseStore";

interface Row {
  [key: string]: unknown;
}

/**
 * Faux client Supabase en mémoire : implémente exactement la surface utilisée
 * par `createSupabaseStore`, afin de tester la logique sans réseau.
 */
export function createFakeSupabase(options: { seedAuth?: { email: string; password: string; id?: string } } = {}) {
  const tables = new Map<string, Row[]>();
  const sequences = new Map<string, number>();
  const sessions = new Set<string>();
  const calls: string[] = [];

  const rows = (table: string) => {
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table) as Row[];
  };

  const nextId = (table: string) => {
    const value = (sequences.get(table) ?? 0) + 1;
    sequences.set(table, value);
    return value;
  };

  const matches = (row: Row, filters: [string, unknown][], ranges: [string, unknown][]) =>
    filters.every(([column, value]) => JSON.stringify(row[column] ?? null) === JSON.stringify(value ?? null)) &&
    ranges.every(([column, value]) => String(row[column] ?? "") >= String(value ?? ""));

  const finish = (run: () => { data: unknown; error?: { message: string } }): Promise<SbResponse<never>> => {
    try {
      const { data, error } = run();
      return Promise.resolve({ data, error: error ?? null } as SbResponse<never>);
    } catch (error) {
      return Promise.resolve({
        data: null,
        error: { message: error instanceof Error ? error.message : String(error) },
      } as SbResponse<never>);
    }
  };

  const build = (table: string, mode: string, payload: unknown): SbFilterBuilder<never> => {
    const filters: [string, unknown][] = [];
    const ranges: [string, unknown][] = [];
    let orderColumn: string | null = null;
    let ascending = false;
    let head = false;
    let countMode: string | null = null;

    const builder: SbFilterBuilder<never> = {
      eq: (column, value) => {
        filters.push([column, value]);
        return builder;
      },
      gte: (column, value) => {
        ranges.push([column, value]);
        return builder;
      },
      order: (column, opts) => {
        orderColumn = column;
        ascending = Boolean(opts?.ascending);
        return builder;
      },
      select: (_columns, opts) => {
        head = Boolean(opts?.head);
        countMode = opts?.count ?? null;
        return builder as unknown as SbFilterBuilder<{ rows: unknown[]; count: number }>;
      },
      then: (onFulfilled, onRejected) => {
        calls.push(`${mode}:${table}`);
        const result = finish(() => {
          const list = rows(table);
          if (mode === "insert") {
            const inserted = (Array.isArray(payload) ? payload : [payload]) as Row[];
            inserted.forEach((row) => list.push({ id: nextId(table), ...row }));
            return { data: inserted };
          }
          if (mode === "upsert") {
            const record = payload as Row;
            const conflict = (options_?.onConflict ?? "id").split(",");
            const existing = list.find((row) => conflict.every((key) => row[key] === record[key]));
            if (existing) Object.assign(existing, record);
            else list.push({ id: nextId(table), ...record });
            return { data: record };
          }
          if (mode === "update") {
            const updated = list.filter((row) => matches(row, filters, ranges)).map((row) => Object.assign(row, payload as Row));
            return { data: updated };
          }
          if (mode === "delete") {
            const remaining = list.filter((row) => !matches(row, filters, ranges));
            const deleted = list.length - remaining.length;
            tables.set(table, remaining);
            return { data: remaining, ...(countMode ? { count: deleted } : {}) };
          }
          let selected = list.filter((row) => matches(row, filters, ranges));
          if (orderColumn) {
            selected = [...selected].sort((a, b) => {
              const left = Number(a[orderColumn as string]);
              const right = Number(b[orderColumn as string]);
              const diff = Number.isNaN(left) || Number.isNaN(right) ? 0 : left - right;
              return ascending ? diff : -diff;
            });
          }
          if (head) return { data: null, ...(countMode ? { count: selected.length } : {}) };
          return { data: selected };
        });
        return result.then(onFulfilled as never, onRejected as never) as Promise<never>;
      },
    };
    return builder;
  };

  let options_: { onConflict?: string } | undefined;

  const client = {
    from(table: string): SbQueryBuilder<unknown> {
      return {
        select: () => build(table, "select", null) as unknown as ReturnType<SbQueryBuilder<unknown>["select"]>,
        insert: (values) => {
          options_ = undefined;
          return build(table, "insert", values);
        },
        upsert: (values, opts) => {
          options_ = opts;
          return build(table, "upsert", values);
        },
        update: (values) => {
          options_ = undefined;
          return build(table, "update", values);
        },
        delete: () => {
          options_ = undefined;
          return build(table, "delete", null);
        },
      };
    },
    auth: {
      async getSession() {
        const session = [...sessions][0];
        return { data: { session: session ? { user: { id: session, email: session } } : null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (options?.seedAuth && email === options.seedAuth.email && password === options.seedAuth.password) {
          const id = options.seedAuth.id ?? "user-1";
          sessions.add(id);
          return { data: { session: { user: { id, email } } }, error: null };
        }
        return { data: { session: null }, error: { message: "Invalid login credentials" } };
      },
      async signOut() {
        sessions.clear();
        return { data: null, error: null };
      },
    },
  } as unknown as SbClient;

  return { client, calls, sessions };
}
