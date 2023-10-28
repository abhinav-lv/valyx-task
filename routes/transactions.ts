import { Router } from "express";
import {
  get_all_transactions,
  get_balance_on_date,
} from "../controllers/transactions";

const router = Router();

router.get("/", get_all_transactions);
router.get("/balance", get_balance_on_date);

export default router;
