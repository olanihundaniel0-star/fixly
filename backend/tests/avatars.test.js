import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createTestDatabaseName, cleanupTestDatabase } from "./helpers/database.js";

dotenv.config({ quiet: true });
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "fixly-avatar-test-secret";
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "1000";
process.env.CLOUDINARY_CLOUD_NAME = "avatar-test-cloud";
process.env.CLOUDINARY_API_KEY = "avatar-test-key";
process.env.CLOUDINARY_API_SECRET = "avatar-test-secret";

const { default: User } = await import("../src/models/users.js");
const { default: cloudinary } = await import("../src/config/cloudinary.js");
const { cleanupAvatarImages, discardAvatarUpload } = await import("../src/services/avatarImages.js");

const databaseName = createTestDatabaseName();
after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await cleanupTestDatabase(mongoose.connection, databaseName);
  }
});
await mongoose.connect(process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017", {
  dbName: databaseName,
  serverSelectionTimeoutMS: 5000,
});
await User.init();
const password = await bcrypt.hash("StrongPass123", 4);

const createUser = (fields = {}) => User.create({
  firstName: "Avatar",
  lastName: "Tester",
  email: `${randomUUID()}@fixly.test`,
  password,
  role: "house_owner",
  ...fields,
});

const avatar = (id) => ({
  url: `https://res.cloudinary.com/avatar-test-cloud/image/upload/${id}.webp`,
  publicId: id,
});

describe("avatar image storage", () => {
  it("defaults to no avatar and hides provider and cleanup metadata", async () => {
    const user = await createUser();
    assert.equal(user.avatar, null);
    await User.updateOne({ _id: user._id }, {
      avatar: avatar("private-avatar-id"),
      avatarCleanup: ["private-cleanup-id"],
    });
    const publicUser = await User.findById(user._id).select("-password").lean();
    assert.deepEqual(publicUser.avatar, { url: avatar("private-avatar-id").url });
    assert.equal(publicUser.avatarCleanup, undefined);
    const internalUser = await User.findById(user._id).select("+avatar.publicId +avatarCleanup");
    assert.equal(internalUser.avatar.publicId, "private-avatar-id");
    assert.deepEqual(internalUser.avatarCleanup.toObject(), ["private-cleanup-id"]);
  });

  it("deletes obsolete images, invalidates cached copies, and preserves the current avatar", async (t) => {
    const user = await createUser({
      avatar: avatar("current"),
      avatarCleanup: ["obsolete", "current"],
    });
    const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
    assert.equal(await cleanupAvatarImages(user._id), true);
    assert.equal(destroy.mock.callCount(), 1);
    assert.equal(destroy.mock.calls[0].arguments[0], "obsolete");
    assert.equal(destroy.mock.calls[0].arguments[1].invalidate, true);
    const saved = await User.findById(user._id).select("+avatar.publicId +avatarCleanup");
    assert.equal(saved.avatar.publicId, "current");
    assert.deepEqual(saved.avatarCleanup.toObject(), ["current"]);
  });

  it("retains failed cleanup for a later retry", async (t) => {
    const user = await createUser({ avatarCleanup: ["retry-me"] });
    t.mock.method(console, "error", () => {});
    const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => {
      throw new Error("provider unavailable");
    });
    assert.equal(await cleanupAvatarImages(user._id), false);
    assert.deepEqual((await User.findById(user._id).select("+avatarCleanup")).avatarCleanup.toObject(), ["retry-me"]);
    destroy.mock.mockImplementation(async () => ({ result: "not found" }));
    assert.equal(await cleanupAvatarImages(user._id), true);
    assert.deepEqual((await User.findById(user._id).select("+avatarCleanup")).avatarCleanup.toObject(), []);
  });

  it("removes a newly uploaded image that could not be attached to the account", async (t) => {
    const user = await createUser({ avatar: avatar("keep-me") });
    const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
    assert.equal(await discardAvatarUpload(user._id, "failed-upload"), true);
    assert.equal(destroy.mock.calls[0].arguments[0], "failed-upload");
    assert.equal((await User.findById(user._id).select("+avatar.publicId")).avatar.publicId, "keep-me");
  });

  it("removes unattached uploads even if their user was deleted", async (t) => {
    const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
    assert.equal(await discardAvatarUpload(new mongoose.Types.ObjectId(), "orphan-upload"), true);
    assert.equal(destroy.mock.calls[0].arguments[0], "orphan-upload");
  });

  it("keeps cleanup metadata when Cloudinary is unconfigured", async (t) => {
    const user = await createUser({ avatarCleanup: ["later"] });
    const secret = process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_API_SECRET;
    t.after(() => { process.env.CLOUDINARY_API_SECRET = secret; });
    t.mock.method(console, "error", () => {});
    const destroy = t.mock.method(cloudinary.uploader, "destroy", async () => assert.fail("must not call Cloudinary"));
    assert.equal(await cleanupAvatarImages(user._id), false);
    assert.equal(destroy.mock.callCount(), 0);
    assert.deepEqual((await User.findById(user._id).select("+avatarCleanup")).avatarCleanup.toObject(), ["later"]);
  });
});
