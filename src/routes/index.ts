import express, { Application } from "express";

import payments from "./payments.routes";
import businesses from "./business.routes";
import clients from "./client.route";
import search from "./search.routes";
import meetings from "./meeting.route";
import storybrandAccount from "./storybrand-account.route";
import checklist from "./checklist.routes";

function routerApi(app: Application) {
  const router = express.Router();

  app.use("/api", router);

  router.use(payments);
  router.use(businesses);
  router.use(clients);
  router.use(search);
  router.use(meetings);
  router.use("/storybrand-account", storybrandAccount);
  router.use(checklist);
}

export default routerApi;
