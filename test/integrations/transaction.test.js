require("dotenv").config();
const request = require("supertest");

describe("Transaction Integration Test", () => {
    let token;
    const baseUrl = "https://backend-skyfly-c1.vercel.app";
    beforeAll(async () => {
        const response = await request(baseUrl)
            .post("/api/v1/auth/login")
            .send({
                email: "viery@test.com",
                password: "password",
            });
        token = response.body._token;
    });

    describe("getAllTransactionByUserLoggedIn", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get("/api/v1/transactions/")
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("getTransactionById", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get("/api/v1/transactions/cly60ql3r000211zafo44vsqv")
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("getTransaction", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get(
                    "/api/v1/transactions/status/87718d0d-0750-4611-94d6-fa6b327b2124"
                )
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("getTransaction", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get(
                    "/api/v1/transactions/status/2ecaed1c-bfb9-4937-a151-7e16634c7385"
                )
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("cancelTransaction", () => {
        let orderId = "5d5fdb1c-9e6a-43d8-bb37-704dd215d282";
        it("success", async () => {
            const response = await request(baseUrl)
                .post(`/api/v1/transactions/cancel/${orderId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });
});
