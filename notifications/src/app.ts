import express, { Application } from "express";
import handleRequest from "./requestHandlers/handleRequest";

const app: Application = express();

app.get("/health", (req, res) => {
  res.send("Ok");
});

app.use("/", handleRequest);

export default app;
