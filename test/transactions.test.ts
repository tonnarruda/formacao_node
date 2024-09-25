import { expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import exp from "constants";

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

it("should be able to create a new transaction", async () => {
  await request(app.server)
    .post("/transactions")
    .send({
      title: "test",
      amount: 100,
      type: "credit",
    })
    .expect(201);
});

it("should be able to list all transactions", async () => {
  const creatTransactionResponse = await request(app.server)
    .post("/transactions")
    .send({
      title: "New Transaction",
      amount: 5000,
      type: "credit",
    });

  const cookies = creatTransactionResponse.get("Set-Cookie");

  if (!cookies) {
    throw new Error("Cookies not set");
  }

  const listTransactionsResponse = await request(app.server)
    .get("/transactions")
    .set("Cookie", cookies)
    .expect(200);

  expect(listTransactionsResponse.body.transactions).toEqual([
    expect.objectContaining({
      title: "New Transaction",
      amount: 5000,
    }),
  ]);
});
