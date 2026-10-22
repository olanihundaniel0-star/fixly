process.env.NODE_ENV = "test";
process.env.MONGODB_URI_TEST ??= "mongodb://127.0.0.1:27017/fixly-backend-test";
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST;
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.API_RATE_LIMIT_MAX = "1000";

const { default: app } = await import("../src/index.js");
const { default: User } = await import("../src/models/users.js");
const { default: Profile } = await import("../src/models/artisanProfile.js");

import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const PASSWORD = "StrongPass123";
const stamp = Date.now();

const register = (body) =>
  request(app).post("/api/v1/auth/register").send(body);

const login = (email, password = PASSWORD) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

const jsonOf = (payload) =>
  JSON.parse(Buffer.from(payload.split(".")[1], "base64url").toString("utf8"));

await mongoose.connect(process.env.MONGODB_URI);
await mongoose.connection.dropDatabase();

const hashed = await bcrypt.hash("Admin#Pass123", await bcrypt.genSalt(4));
const admin = await User.create({
  firstName: "Ada",
  lastName: "Admin",
  email: `admin-${stamp}@fixly.test`,
  password: hashed,
  role: "admin",
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Fixly API", () => {
  it("GET / responds with 200", async () => {
    const res = await request(app).get("/").expect(200);
    assert.match(res.text, /Welcome/);
  });

  it("registers a house_owner by default when role omitted", async () => {
    const res = await register({
      firstName: "Eve",
      lastName: "Home",
      email: `owner-${stamp}@fixly.test`,
      password: PASSWORD,
      confirmPassword: PASSWORD,
    }).expect(201);
    assert.equal(res.body.data.role, "house_owner");
  });

  it("rejects weak passwords", async () => {
    const res = await register({
      firstName: "Weak",
      lastName: "Pass",
      email: `weak-${stamp}@fixly.test`,
      password: "short",
    }).expect(400);
    assert.ok(res.body.errors.length > 0);
  });

  it("rejects mismatched confirmPassword", async () => {
    const res = await register({
      firstName: "Mis",
      lastName: "Match",
      email: `mismatch-${stamp}@fixly.test`,
      password: PASSWORD,
      confirmPassword: "Different123",
    }).expect(400);
    assert.ok(
      res.body.errors.some((e) => e.toLowerCase().includes("password")),
    );
  });

  it("authenticates the default user and issues a roleless token", async () => {
    const res = await login(`owner-${stamp}@fixly.test`).expect(200);
    assert.ok(res.body.data.token);
    const payload = jsonOf(res.body.data.token);
    assert.equal(payload.role, undefined);
    assert.ok(payload.id);
  });

  it("returns 401 with a generic message for wrong password", async () => {
    const res = await login(`owner-${stamp}@fixly.test`, "WrongPass123").expect(401);
    assert.equal(res.body.message, "Invalid email or password");
  });

  it("returns 401 for unknown accounts without leaking existence", async () => {
    const res = await login(`ghost-${stamp}@fixly.test`).expect(401);
    assert.equal(res.body.message, "Invalid email or password");
  });

  it("sends rate-limit headers on auth responses", async () => {
    const res = await login(`owner-${stamp}@fixly.test`).expect(200);
    assert.ok(
      res.headers["ratelimit-policy"] || res.headers["ratelimit"],
    );
  });

  describe("self-service user updates", () => {
    let ownerId;
    let otherId;
    let ownerToken;

    it("requires authentication", async () => {
      const user = await User.findOne({ email: `owner-${stamp}@fixly.test` });
      ownerId = user._id.toString();
      otherId = admin._id.toString();
      await request(app)
        .patch(`/api/v1/users/${ownerId}`)
        .send({ firstName: "Evan" })
        .expect(401);
    });

    it("lets a user update themselves", async () => {
      const res = await login(`owner-${stamp}@fixly.test`).expect(200);
      ownerToken = res.body.data.token;
      await request(app)
        .patch(`/api/v1/users/${ownerId}`)
        .set(bearer(ownerToken))
        .send({ firstName: "Evan" })
        .expect(200)
        .expect((r) => assert.equal(r.body.data.firstName, "Evan"));
    });

    it("rejects updates with disallowed fields only", async () => {
      await request(app)
        .patch(`/api/v1/users/${ownerId}`)
        .set(bearer(ownerToken))
        .send({ email: "taken@fixly.test" })
        .expect(400);
    });

    it("forbids updating another user", async () => {
      await request(app)
        .patch(`/api/v1/users/${otherId}`)
        .set(bearer(ownerToken))
        .send({ firstName: "Hacked" })
        .expect(403);
    });
  });

  describe("artisan profiles", () => {
    let artisanToken;
    let technicianToken;
    let profileId;

    it("registers artisans", async () => {
      const first = await register({
        firstName: "Ada",
        lastName: "Artisan",
        email: `artisan-${stamp}@fixly.test`,
        password: PASSWORD,
        role: "artisan",
      }).expect(201);
      const second = await register({
        firstName: "Bob",
        lastName: "Builder",
        email: `technician-${stamp}@fixly.test`,
        password: PASSWORD,
        role: "artisan",
      }).expect(201);
      artisanToken = (await login(`artisan-${stamp}@fixly.test`)).body.data.token;
      technicianToken = (await login(`technician-${stamp}@fixly.test`)).body.data.token;
      assert.ok(artisanToken && second.body.data.role && first.body.data.role);
    });

    it("rejects profile creation without authentication", async () => {
      const user = await User.findOne({ email: `artisan-${stamp}@fixly.test` });
      await request(app)
        .post("/api/v1/artisan/profile")
        .send({ user_id: user._id.toString(), professional_headline: "Home plumbing", profession: "Plumber", experience_years: 3, phone_number: "08012345678", starting_price: 5000, residential_address: "12 Allen Ave", office_address: "12 Allen Ave" })
        .expect(401);
    });

    it("rejects profile creation for non-artisan users", async () => {
      const user = await User.findOne({ email: `owner-${stamp}@fixly.test` });
      const res = await request(app)
        .post("/api/v1/artisan/profile")
        .set(bearer(artisanToken))
        .send({ user_id: user._id.toString(), professional_headline: "Home plumbing", profession: "Plumber", experience_years: 3, phone_number: "08012345678", starting_price: 5000, residential_address: "12 Allen Ave", office_address: "12 Allen Ave" })
        .expect(403);
      assert.match(res.body.message, /artisan/i);
    });

    it("lets an artisan create their profile and prevents duplicates", async () => {
      const user = await User.findOne({ email: `artisan-${stamp}@fixly.test` });
      const res = await request(app)
        .post("/api/v1/artisan/profile")
        .set(bearer(artisanToken))
        .send({ user_id: user._id.toString(), professional_headline: "Expert home plumbing", profession: "Plumber", experience_years: 5, phone_number: "08012345678", starting_price: 5000, residential_address: "12 Allen Ave", office_address: "12 Allen Ave" })
        .expect(201);
      profileId = res.body.data.id;
      assert.equal(res.body.data.profession, "Plumber");
      await request(app)
        .post("/api/v1/artisan/profile")
        .set(bearer(artisanToken))
        .send({ user_id: user._id.toString(), professional_headline: "Duplicate", profession: "Plumber", experience_years: 5, phone_number: "08012345678", starting_price: 5000, residential_address: "12 Allen Ave", office_address: "12 Allen Ave" })
        .expect(409);
    });

    it("lists profiles publicly", async () => {
      const res = await request(app).get("/api/v1/artisan/profiles").expect(200);
      assert.equal(res.body.data.length, 1);
      assert.equal(res.body.data[0].user_id.firstName, "Ada");
      assert.equal(res.body.data[0].phone_number, undefined);
    });

    it("treats dangerous search input as literal text", async () => {
      const res = await request(app)
        .get("/api/v1/artisan/profiles?search=(a+)+$")
        .expect(200);
      assert.equal(res.body.data.length, 0);
      const hit = await request(app)
        .get("/api/v1/artisan/profiles?search=expert%20home")
        .expect(200);
      assert.equal(hit.body.data.length, 1);
    });

    it("validates profession and clamps limit queries", async () => {
      await request(app)
        .get("/api/v1/artisan/profiles?profession=Doctor")
        .expect(400);
      await request(app)
        .get("/api/v1/artisan/profiles?limit=-5&page=0")
        .expect(200)
        .expect((r) => {
          assert.equal(r.body.meta.limit, 1);
          assert.equal(r.body.meta.page, 1);
        });
    });

    it("returns 400 for invalid profile ids", async () => {
      await request(app)
        .get("/api/v1/artisan/profile/not-an-objectid")
        .expect(400);
    });

    it("requires ownership for profile updates", async () => {
      await request(app)
        .patch(`/api/v1/artisan/profile/${profileId}`)
        .send({ professional_headline: "No auth" })
        .expect(401);
      await request(app)
        .patch(`/api/v1/artisan/profile/${profileId}`)
        .set(bearer(technicianToken))
        .send({ professional_headline: "Not mine" })
        .expect(403);
    });

    it("lets the owner update their profile", async () => {
      await request(app)
        .patch(`/api/v1/artisan/profile/${profileId}`)
        .set(bearer(artisanToken))
        .send({ professional_headline: "Legendary plumber", starting_price: 7000 })
        .expect(200)
        .expect((r) => assert.equal(r.body.data.starting_price, 7000));
    });

    it("rejects updates on soft-deleted profiles", async () => {
      await Profile.updateOne(
        { _id: profileId },
        { isDeleted: true, deletedAt: new Date() },
      );
      await request(app)
        .patch(`/api/v1/artisan/profile/${profileId}`)
        .set(bearer(artisanToken))
        .send({ professional_headline: "Ghost work" })
        .expect(404);
      await Profile.updateOne(
        { _id: profileId },
        { isDeleted: false, deletedAt: null },
      );
    });
  });

  describe("admin management", () => {
    let adminToken;
    let technicianToken;
    let technicianId;

    it("requires admin role", async () => {
      adminToken = (await login(`admin-${stamp}@fixly.test`, "Admin#Pass123")).body.data.token;
      technicianToken = (await login(`technician-${stamp}@fixly.test`)).body.data.token;
      await request(app).get("/api/v1/admin/users").expect(401);
      await request(app)
        .get("/api/v1/admin/users")
        .set(bearer(technicianToken))
        .expect(403);
      await request(app)
        .get("/api/v1/admin/users")
        .set(bearer(adminToken))
        .expect(200);
    });

    it("fetches a single user with their artisan profile", async () => {
      const technician = await User.findOne({ email: `technician-${stamp}@fixly.test` });
      technicianId = technician._id.toString();
      const res = await request(app)
        .get(`/api/v1/admin/user/${technicianId}`)
        .set(bearer(adminToken))
        .expect(200);
      assert.equal(res.body.data.email, `technician-${stamp}@fixly.test`);
    });

    it("updates a user as admin", async () => {
      await request(app)
        .patch(`/api/v1/admin/user/${technicianId}`)
        .set(bearer(adminToken))
        .send({ firstName: "Roberta" })
        .expect(200)
        .expect((r) => assert.equal(r.body.data.firstName, "Roberta"));
    });

    it("soft-deletes, hides, and restores a user", async () => {
      await request(app)
        .patch(`/api/v1/admin/user/${technicianId}/soft-delete`)
        .set(bearer(adminToken))
        .expect(200);
      await login(`technician-${stamp}@fixly.test`).expect(401);
      const hidden = await request(app)
        .get("/api/v1/admin/users")
        .set(bearer(adminToken))
        .expect(200);
      assert.ok(
        !hidden.body.data.some((u) => u.id === technicianId),
      );
      await request(app)
        .get(`/api/v1/admin/users?includeDeleted=true`)
        .set(bearer(adminToken))
        .expect(200)
        .expect((r) =>
          assert.ok(r.body.data.some((u) => u.id === technicianId)),
        );
      await request(app)
        .patch(`/api/v1/admin/user/${technicianId}/restore`)
        .set(bearer(adminToken))
        .expect(200);
      await login(`technician-${stamp}@fixly.test`).expect(200);
    });

    it("hard-deletes a user and their profile for good", async () => {
      await register({
        firstName: "Gone",
        lastName: "Forever",
        email: `doomed-${stamp}@fixly.test`,
        password: PASSWORD,
        role: "artisan",
      }).expect(201);
      const doomed = await User.findOne({ email: `doomed-${stamp}@fixly.test` });
      const doomedId = doomed._id.toString();
      await request(app)
        .delete(`/api/v1/admin/user/${doomedId}`)
        .set(bearer(adminToken))
        .expect(200);
      await request(app)
        .get(`/api/v1/admin/user/${doomedId}`)
        .set(bearer(adminToken))
        .expect(404);
    });
  });

  describe("uploads", () => {
    const cloudinaryKeys = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    it("requires authentication", async () => {
      await request(app)
        .post("/api/v1/uploads/image")
        .field("any", "field")
        .expect(401);
    });

    it("returns 503 while Cloudinary is not configured", async () => {
      const token = (await login(`owner-${stamp}@fixly.test`)).body.data.token;
      const saved = Object.fromEntries(
        cloudinaryKeys.map((key) => [key, process.env[key]]),
      );
      cloudinaryKeys.forEach((key) => delete process.env[key]);
      try {
        await request(app)
          .post("/api/v1/uploads/image")
          .set(bearer(token))
          .attach("image", Buffer.from("not a real image"), "test.jpg")
          .expect(503)
          .expect((r) =>
            assert.match(r.body.message, /not configured/i),
          );
      } finally {
        cloudinaryKeys.forEach((key) => {
          if (saved[key]) process.env[key] = saved[key];
        });
      }
    });
  });
});
