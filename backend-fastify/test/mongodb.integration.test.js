import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import mongoose from "mongoose";

import { Property } from "../src/models/property.js";

const DB_CONNECT =
  process.env.DB_CONNECT || "mongodb://127.0.0.1:27017/rem-db-test";

describe("Property persistence", () => {
  before(async () => {
    await mongoose.connect(DB_CONNECT, { serverSelectionTimeoutMS: 10000 });
    await Property.deleteMany({ property_id: /^it-/ });
  });

  after(async () => {
    await Property.deleteMany({ property_id: /^it-/ });
    await mongoose.disconnect();
  });

  it("round-trips a listing through MongoDB", async () => {
    await Property.create({
      property_id: "it-1",
      name: "Riverside Loft",
      address: "22 Mill Lane",
      description: "Converted warehouse loft.",
      type: "apartment",
      transactionType: "rent",
      paymentFrequency: "monthly",
      price: 1800,
      features: ["balcony"],
    });

    const stored = await Property.findOne({ property_id: "it-1" });

    assert.equal(stored.name, "Riverside Loft");
    assert.equal(stored.transactionType, "rent");
    assert.deepEqual([...stored.features], ["balcony"]);
    assert.ok(stored.createdAt instanceof Date);
  });

  it("filters listings by transaction type", async () => {
    await Property.create({
      property_id: "it-2",
      name: "Hilltop House",
      address: "5 Summit Road",
      type: "house",
      transactionType: "sale",
      price: 320000,
    });

    const forSale = await Property.find({
      property_id: /^it-/,
      transactionType: "sale",
    });

    assert.equal(forSale.length, 1);
    assert.equal(forSale[0].property_id, "it-2");
  });

  it("rejects writes that violate the schema", async () => {
    await assert.rejects(
      Property.create({ property_id: "it-3", name: "x" }),
      { name: "ValidationError" }
    );
  });
});
