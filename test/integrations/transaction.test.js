require("dotenv").config();
const request = require("supertest");

describe("Transaction Integration Test", () => {
    let token;
    let transactionId = "cly60w9dk0002afm09flc7aid";
    let orderId = "f11e98c2-8173-43cb-8f9d-4f8373686f3d";
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
                .get(`/api/v1/transactions/${transactionId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("getTransaction", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get(`/api/v1/transactions/status/${orderId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("getTransaction", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .get(`/api/v1/transactions/status/${orderId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });

    describe("cancelTransaction", () => {
        it("success", async () => {
            const response = await request(baseUrl)
                .post(`/api/v1/transactions/cancel/${orderId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(response.statusCode).toBe(200);
        });
    });
});
