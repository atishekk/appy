import { connect, type Connection } from "amqplib";
import * as express from "express";
import type { Express, Request, Response } from "express";

const port = 4000;

const app: Express = express();
app.use(express.json())

const connection: Connection = await connect("amqp:localhost");
const channel = await connection.createChannel();

function computeDelayKey(delay: number): string {
    const binaryStr = delay.toString(2);
}

app.post("/message", (req: Request, res: Response) => {
    const delay = req.body["delay"];

})
