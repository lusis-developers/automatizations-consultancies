import express, { Application } from "express";

import payments from "./payments.routes";
import businesses from "./business.routes";
import clients from "./client.route";
import search from "./search.routes"

function routerApi(app: Application) {
  const router = express.Router();

  app.use("/api", router);

  router.use(payments);
  router.use(businesses);
  router.use(clients);
  router.use(search)
}

export default routerApi;
