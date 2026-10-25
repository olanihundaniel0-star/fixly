import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createTestDatabaseName,
  cleanupTestDatabase,
} from "./helpers/database.js";

describe("test database isolation", () => {
  it("generates a different database name for each run", () => {
    const first = createTestDatabaseName();
    assert.match(first, /^fixly-test-[0-9a-f-]{36}$/);
    assert.notEqual(first, createTestDatabaseName());
  });

  it("refuses to drop a different database and still closes the connection", async () => {
    let dropped = false;
    let closed = false;
    const connection = {
      name: "fixly-backend",
      dropDatabase: async () => { dropped = true; },
      close: async () => { closed = true; },
    };
    await assert.rejects(
      cleanupTestDatabase(connection, createTestDatabaseName()),
      /Refusing to drop/,
    );
    assert.equal(dropped, false);
    assert.equal(closed, true);
  });

  it("rejects a non-test name even when it matches the connection", async () => {
    await assert.rejects(
      cleanupTestDatabase({
        name: "fixly-backend",
        dropDatabase: async () => assert.fail("must not drop the database"),
        close: async () => {},
      }, "fixly-backend"),
      /Refusing to drop/,
    );
  });

  it("drops only the generated database and closes on cleanup failure", async () => {
    const name = createTestDatabaseName();
    let closed = false;
    await assert.rejects(cleanupTestDatabase({
      name,
      dropDatabase: async () => { throw new Error("cleanup failed"); },
      close: async () => { closed = true; },
    }, name), /cleanup failed/);
    assert.equal(closed, true);
  });
});
