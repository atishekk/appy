import { connect, type Connection } from "amqplib";
import express from "express";
import type { Express, Request, Response } from "express";

const port = 4000;

const app: Express = express();
app.use(express.json())

const connection: Connection = await connect("amqp://guest:guest@localhost:5672/demo");
const channel = await connection.createChannel();

function computeDelayKey(delay: number): string {
    let binaryStr = delay.toString(2);
    binaryStr = binaryStr.padStart(23, "0")
    return binaryStr.split("").join(".");
}

app.post("/message", (req: Request, res: Response) => {
    const delay = req.body["delay"];
    console.log(delay)
    const key = computeDelayKey(delay);
    channel.publish("dd-exchange-22", key, Buffer.from(new Date()))
    res.send(key + '\n')
})

app.listen(port, () => {
    console.log("server started");
});
