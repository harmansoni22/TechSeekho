import { Router } from "express";
import { oauthLogin } from "../controllers/oauth.controller.js";

const router = Router();

// Called by frontend NextAuth during social login.
router.post("/login", (req, res, next) => oauthLogin(req, res).catch(next));

export default router;
