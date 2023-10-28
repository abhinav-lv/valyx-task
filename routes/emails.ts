import { Router } from "express";
import { get_emails } from "../controllers/emails";

const router = Router();

/* Get emails filtered by subject line */
router.get("/", get_emails);

export default router;
