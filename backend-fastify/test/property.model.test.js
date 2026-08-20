import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";

import { Property } from "../src/models/property.js";

const DB_CONNECT =
  process.env.DB_CONNECT || "mongodb://127.0.0.1:27017/rem-test-db";

describe("Property model", () => {
  before(async () => {
    await mongoose.connect(DB_CONNECT);
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("rejects a property with an unsupported transaction type", async () => {
    const property = new Property({
      property_id: "invalid-1",
      name: "Invalid Villa",
      address: "1 Nowhere Street",
      type: "residential",
      transactionType: "lease",
    });

    await assert.rejects(() => property.save(), mongoose.Error.ValidationError);
  });

  it("persists and reads back a valid property", async () => {
    const saved = await Property.create({
      property_id: "valid-1",
      name: "Seaside Villa",
      address: "12 Harbour Road",
      description: "A bright villa close to the harbour.",
      type: "residential",
      transactionType: "sale",
      position: { lat: 51.5, lng: -0.12 },
      price: 450000,
      currency: "GBP",
      features: ["pool", "garage"],
    });

    const found = await Property.findById(saved._id).lean();

    assert.equal(found.name, "Seaside Villa");
    assert.equal(found.transactionType, "sale");
    assert.deepEqual(found.features, ["pool", "garage"]);
    assert.ok(found.createdAt instanceof Date);
  });
});
