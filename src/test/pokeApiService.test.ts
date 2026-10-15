import request = require('supertest');
import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";
import type { AddressInfo } from "node:net";
import PokemonService from "../services/pokeApiService.js";
const { randomIntMock } = vi.hoisted(() => ({
    randomIntMock: vi.fn<(min: number, max: number) => number>(),
}));


vi.mock("node:crypto", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:crypto")>();
    randomIntMock.mockImplementation((min, max) => actual.randomInt(min, max));
    return { ...actual, randomInt: randomIntMock };
});

import { server } from "../server.js";
describe("PokemonService.callPoke", () => {
    it("returns the requested pokemon", async () => {
        const sut = new PokemonService();

        const result = await sut.callPoke(25);

        expect(result.pokemon.id).toBe(25);
        expect(result.pokemon.name).toBe("pikachu");
        expect(result.pokemon.types[0].type.name).toBe("electric");
    });
});

describe("GET /wild", () => {
    it("returns a pokemon with status 200", async () => {
        const response = await request(server).get("/wild");


        expect(response.status).toBe(200);
        expect(response.body.pokemon.id).toBeTypeOf("number");
    });
});

describe("POST /capture/:id", () => {
    it("returns 400 when the pokemon is not the last encounter", async () => {
        const wild = await request(server).get("/wild");

        const otherId = wild.body.pokemon.id + 1;
        //
        const response = await request(server).post("/capture/" + otherId);
        //
        //
        expect(response.status).toBe(400);
        expect(response.body).toBe("invalid id");
    });

    it("returns 201 and the captured pokemon when the capture succeeds", async () => {
        randomIntMock
            .mockReturnValueOnce(25)  // /wild → randomId
            .mockReturnValueOnce(80)  // /capture → luck
            .mockReturnValueOnce(10); // /capture → captureRate
        await request(server).get("/wild");

        const response = await request(server).post("/capture/25");

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            success: true,
            captured: {
                pokemonId: 25,
                name: "pikachu",
                nickname: "pikachu",
                uuid: expect.any(String),
                capturedAt: expect.any(String),
            },
        });
    })

    it('return 200 if pokemon escape', async () =>{
        randomIntMock
            .mockReturnValueOnce(25)  // /wild → randomId
            .mockReturnValueOnce(10)  // /capture → luck
            .mockReturnValueOnce(80); // /capture → captureRate
        await request(server).get("/wild");

        const response = await request(server).post("/capture/25");

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({"success": false, "message": "Oh non ! Le Pokémon s'est échappé !"})

    })
})

describe("Erreur 404", () => {
    it("returns 404 when route doesn't exist", async () => {
        const sut = await request(server).get("/sut");
        expect(sut.status).toBe(404);
        expect(sut.body).toMatchObject({error: 'Route not found'})
    })
})
