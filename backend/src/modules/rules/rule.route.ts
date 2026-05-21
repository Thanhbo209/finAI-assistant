import { Router } from "express";
import { middleware } from "../../common/middleware/auth.middleware.js";
import { ruleController } from "./rule.controller.js";

export const ruleRouter = Router();

ruleRouter.post("/", middleware, ruleController.create);
ruleRouter.get("/", middleware, ruleController.list);
ruleRouter.patch("/:id", middleware, ruleController.update);
ruleRouter.delete("/:id", middleware, ruleController.delete);
