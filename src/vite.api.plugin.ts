import { type Plugin } from "vite";
import express from "express";
import { glob } from "glob";
import path from "path";
import { pathToFileURL } from "url";

export default function apiPlugin(): Plugin {
    const app = express();

    const apiRoot = path.resolve("api");
    const apiFiles = glob.sync("**/*.js", { cwd: apiRoot });

    for (const apiFile of apiFiles) {
        const routePath = "/" + apiFile.replace(/\\/g, "/").replace(/\.js$/, "");
        const handlerPath = path.join(apiRoot, apiFile);
        const handlerUrl = pathToFileURL(handlerPath).href;
        const isWebhook = apiFile.endsWith('webhook.js');

        const routeHandler = async (req, res) => {
            try {
                const { default: handler } = await import(handlerUrl);
                await handler(req, res);
            } catch (error) {
                console.error(`Error handling request for ${routePath}:`, error);
                res.status(500).send("Internal Server Error");
            }
        };

        // Use express.raw() only for webhook.js
        if (isWebhook) {
            app.post(routePath, express.raw({ type: "application/json" }), routeHandler);
        } else {
            // For all other routes, use a JSON parser.
            app.all(routePath, express.json(), routeHandler);
        }
    }

    return {
        name: "vite-plugin-express-api",
        configureServer(server) {
            server.middlewares.use("/api", app);
        },
    };
} 