import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Property } from "../src/models/property.js";
import { User } from "../src/models/user.js";

describe("Property schema", () => {
  it("accepts a well formed listing", () => {
    const property = new Property({
      property_id: "prop-1",
      name: "Seaside Villa",
      address: "1 Ocean Drive",
      description: "A bright villa by the sea.",
      type: "house",
      transactionType: "sale",
      price: 450000,
      position: { lat: 51.5, lng: -0.12 },
    });

    assert.equal(property.validateSync(), undefined);
  });

  it("rejects an unsupported transaction type", () => {
    const property = new Property({
      property_id: "prop-2",
      name: "Seaside Villa",
      address: "1 Ocean Drive",
      type: "house",
      transactionType: "barter",
    });

    const error = property.validateSync();
    assert.ok(error);
    assert.ok(error.errors.transactionType);
  });

  it("requires the core listing fields", () => {
    const error = new Property({}).validateSync();

    assert.ok(error);
    for (const field of ["property_id", "name", "address", "type", "transactionType"]) {
      assert.ok(error.errors[field], `expected ${field} to be required`);
    }
  });
});

describe("User schema", () => {
  it("rejects a malformed email address", () => {
    const user = new User({
      user_id: "user-1",
      fullName: "Ada Lovelace",
      email: "not-an-email",
    });

    const error = user.validateSync();
    assert.ok(error);
    assert.ok(error.errors.email);
  });

  it("accepts a valid profile", () => {
    const user = new User({
      user_id: "user-1",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
    });

    assert.equal(user.validateSync(), undefined);
  });
});
