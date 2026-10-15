import express, {type Express} from "express";
import { createServer } from 'node:http';
import { randomInt } from 'node:crypto';
import {v4 as uuidv4} from 'uuid';
import PokemonService from "./services/pokeApiService.js";
import pino from "pino";

const logger = pino(pino.destination("./app.log"));
const capturedHistory: number[] = [];
let lastEncounter = 0;
const pokemonService = new PokemonService();
export const app: Express = express();

app.use((req, res, next) => {
    res.on("finish"
        , () => {
            logger.info({method: req.method, url: req.url, status: res.statusCode}, "requête");
        });
    next();
})

app.get("/hello", (req, res) => {
    res.send("Welcome to pokedex");
})

app.get("/wild", async (req, res) => {
    const randomId = randomInt(1,1025);
    lastEncounter = randomId;
    const randomPoke = await pokemonService.callPoke(randomId);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(randomPoke));
    return;
})


app.post('/capture/:id', async (req, res) => {
    const id = req.params.id;
    const luck = randomInt(1, 100);
    const captureRate = randomInt(1, 100);
    res.setHeader('Content-Type', 'application/json');

    if (!(Number.isInteger(Number(id)) || Number(id) > 1025) || (Number(id) !== lastEncounter)) {
        res.status(400).json("invalid id");
    } else {
        res.statusCode = 200;
        if (luck >= captureRate) {
            if (!capturedHistory.includes(Number(id))) {
                capturedHistory.unshift(Number(id));
            }
            res.statusCode = 201;
            const curPoke = await pokemonService.callPoke(lastEncounter);
            const resultat = {
                "success": true,
                "captured": {
                    "uuid": uuidv4(),
                    "pokemonId": lastEncounter,
                    "name": curPoke.pokemon.name,
                    "nickname": curPoke.pokemon.name,
                    "capturedAt": new Date().toISOString()
                }
            }
            res.end(JSON.stringify(resultat));
            return;
        } else {
            const resultat = {"success": false, "message": "Oh non ! Le Pokémon s'est échappé !"}
            res.statusCode = 200;
            res.end(JSON.stringify(resultat));
            return;
        }
    }
})


app.get("/pokedex", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const resultat: any[] = [];

    for (const id of capturedHistory) {
        resultat.push(await pokemonService.callPoke(Number(id)));
    }

    res.statusCode = 200;
    res.end(JSON.stringify(resultat));
    return;
});

app.all("/wild", (req, res) => {
    res.status(405).json({error: 'Unauthorized Method'});
})

app.all("/capture/:id", (req, res) => {
    res.status(405).json({error: 'Unauthorized Method'});
})

app.use(((req, res) => {
    res.status(404).json({error: 'Route not found'});
}))


