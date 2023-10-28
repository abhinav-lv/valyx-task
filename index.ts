/* PACKAGES */
import express, { Request, Response } from "express";

/* FUNCTIONS */
import { fetchAttachments } from "./lib/utils";

/* ROUTES */
import transaction_routes from "./routes/transactions";

/* CONFIG */
const PORT = process.env.PORT || 4000;
const app = express();

/* Get attachments from emails every 5 minutes and write to server */
try {
  fetchAttachments();
  setInterval(fetchAttachments, 5 * 60 * 1000);
} catch (err: any) {
  console.error(err.message);
}

/* MIDDLEWARE */
app.use(express.json());

/* APP */
// Root route
app.get("/", (_: Request, res: Response) => {
  res.status(200).json({
    get_all_transactions: "/api/transactions",
    get_transactions_within_date_range:
      "/api/transactions?start_date=DD-MM-YYYY&end_date=DD-MM-YYYY",
    get_balance: "/api/transactions/balance?date=DD-MM-YYYY",
  });
});

// API route
app.get("/api", (_: Request, res: Response) => {
  res.status(200).json("Hello!");
});

// Transactions route
app.use("/api/transactions", transaction_routes);

// Fallback
app.get("*", (_: Request, res: Response) => {
  res.status(404).json({
    status_code: 404,
    message: "Requested Resource Not Found",
  });
});

/* PORT */
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
