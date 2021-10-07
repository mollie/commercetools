import request from "supertest";
import app from "../src/app";

describe("Health check", () => {
  it("Should have /health endpoint to check", async () => {
    const res = await request(app).get("/health")
    expect(res.statusCode).toBe(200)
    expect(res.text).toBe("Ok")
  })

  // TODO renable this test when check is applied in app.ts
  it.skip("Should not have a /random-endpoint", async () => {
    const res = await request(app).get("/random-endpoint")
    expect(res.statusCode).toBe(404)
  })
})
