import { randomUUID } from "node:crypto";

export const createTestDatabaseName = () => `fixly-test-${randomUUID()}`;

export const cleanupTestDatabase = async (connection, expectedName) => {
  try {
    if (
      !/^fixly-test-[0-9a-f-]{36}$/.test(expectedName) ||
      connection.name !== expectedName
    ) {
      throw new Error("Refusing to drop a database not owned by this test run");
    }
    await connection.dropDatabase();
  } finally {
    await connection.close();
  }
};
