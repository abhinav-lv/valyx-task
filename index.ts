/* PACKAGES */
import express, { Request, Response } from "express";

/* FUNCTIONS */
import { fetchAttachments, parsePDFs } from "./lib/utils";

/* ROUTES */
import email_routes from "./routes/emails";

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
app.get("/api", (_: Request, res: Response) => {
  res.status(200).json("Hello!");
});

app.use("/api/emails", email_routes);

app.get("*", (_: Request, res: Response) => {
  res.status(404).json({
    status_code: 404,
    message: "Requested Resource Not Found",
  });
});

/* PORT */
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
