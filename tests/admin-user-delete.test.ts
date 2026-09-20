import test from "node:test";
import assert from "node:assert/strict";
import {
  actionErrorMessage,
  detachUserReferences,
  isSkippableDetachError,
  USER_DELETE_NULL_CLEARS,
  USER_DELETE_ROW_CLEARS,
  userDeleteErrorMessage,
} from "../src/lib/admin-user-delete";

test("actionErrorMessage leser { message } som ikke er Error", () => {
  assert.equal(
    actionErrorMessage({ code: "USER_DELETE_FAILED", message: "fk blocked" }, "fallback"),
    "fk blocked",
  );
  assert.equal(actionErrorMessage(new Error("boom"), "fallback"), "boom");
  assert.equal(actionErrorMessage("nope", "fallback"), "fallback");
});

test("userDeleteErrorMessage forklarer handbook-signatur-FK", () => {
  const message = userDeleteErrorMessage({
    message:
      'update or delete on table "User" violates foreign key constraint "HandbookSignature_userId_fkey" on table "HandbookSignature"',
  });
  assert.match(message, /health and safety policy signatures/);
});

test("userDeleteErrorMessage faller tilbake på ukjent FK", () => {
  const message = userDeleteErrorMessage({
    message: 'violates foreign key constraint "SomethingElse_fkey"',
  });
  assert.match(message, /still linked to other records/);
});

test("isSkippableDetachError godtar NOT NULL og manglende tabell", () => {
  assert.equal(isSkippableDetachError({ code: "23502", message: "null value in column" }), true);
  assert.equal(isSkippableDetachError({ code: "42P01", message: "does not exist" }), true);
  assert.equal(isSkippableDetachError({ code: "23503", message: "fk" }), false);
});

test("detachUserReferences sletter signaturer og nuller eierskap", async () => {
  const calls: Array<{ op: string; table: string; column: string }> = [];
  const db = {
    from(table: string) {
      return {
        delete() {
          return {
            eq(column: string) {
              calls.push({ op: "delete", table, column });
              return Promise.resolve({ error: null });
            },
          };
        },
        update() {
          return {
            eq(column: string) {
              calls.push({ op: "update", table, column });
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };

  await detachUserReferences(db as never, "user-1");

  assert.deepEqual(
    calls.filter((c) => c.op === "delete").map((c) => `${c.table}.${c.column}`),
    USER_DELETE_ROW_CLEARS.map((c) => `${c.table}.${c.column}`),
  );
  assert.ok(calls.some((c) => c.table === "HandbookSignature" && c.op === "delete"));
  assert.ok(calls.some((c) => c.table === "Risk" && c.column === "ownerId" && c.op === "update"));
  assert.equal(
    calls.filter((c) => c.op === "update").length,
    USER_DELETE_NULL_CLEARS.length,
  );
});

test("detachUserReferences hopper over NOT NULL før migrasjon", async () => {
  const db = {
    from(table: string) {
      return {
        delete() {
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
        update() {
          return {
            eq() {
              if (table === "Risk") {
                return Promise.resolve({ error: { code: "23502", message: "null value in column" } });
              }
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };

  await detachUserReferences(db as never, "user-1");
});
