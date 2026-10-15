import express from "express";

// 405 : la route existe, mais pas avec cette méthode
export function methodeNotAllowed(req: express.Request, res: express.Response, next: express.NextFunction) {
    next({ code: 405, message: "Méthode " + req.method + " non autorisée sur " + req.path });
}

// 404 : aucune route n'a répondu
export function notFound(req: express.Request, res: express.Response, next: express.NextFunction) {
    next({ code: 404, message: "Route " + req.method + " " + req.path + " introuvable" });
}

// Middleware d'erreur commun : 4 paramètres, TOUJOURS le dernier app.use
export function errorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    let code = 500;
    let message = "Erreur interne du serveur";

    if (err.type === "entity.parse.failed") {
        code = 400;
        message = "JSON invalide";
    } else if (typeof err.code === "number") {
        code = err.code;
        message = err.message;
    }

    res.status(code).json({ error: { code: code, message: message } });
}
