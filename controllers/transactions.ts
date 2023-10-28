import { Request, Response } from "express";
import path from "path";
import { readFileSync } from "fs";
import { Transaction } from "../lib/utils";

export const get_all_transactions = async (req: Request, res: Response) => {
  try {
    const transactions: Transaction[] = JSON.parse(
      readFileSync(path.resolve("transactions.json"), "utf-8")
    );
    // date format: DD-MM-YYYY
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    if (startDate && endDate) {
      const startParts = startDate.split("-");
      const endParts = endDate.split("-");
      if (startParts.length === 3 && endParts.length === 3) {
        const start = new Date(
          `${startParts[1]}/${startParts[0]}/${startParts[2]}`
        );
        const end = new Date(`${endParts[1]}/${endParts[0]}/${endParts[2]}`);
        if (
          start instanceof Date &&
          end instanceof Date &&
          !isNaN(start.getTime()) &&
          !isNaN(end.getTime())
        ) {
          const newTransactions = transactions.filter(
            (transaction) =>
              new Date(transaction.date) <= end &&
              new Date(transaction.date) >= start
          );
          res.status(200).json({
            count: newTransactions.length,
            transactions: newTransactions,
          });
        } else {
          res.status(400).json("Invalid date parameters");
        }
      } else {
        res.status(400).json("Invalid date parameters");
      }
    } else {
      res.status(200).json({
        count: transactions.length,
        transactions: transactions.map((transaction) => ({
          ...transaction,
          date: new Date(transaction.date).toDateString(),
        })),
      });
    }
  } catch (err: any) {
    console.error(`Get transactions: ${err.message}`);
    res.status(500).json("An error occurred when fetching transactions");
  }
};

export const get_balance_on_date = async (req: Request, res: Response) => {
  try {
    let valid = false;
    const dateString = req.query.date as string | undefined;
    if (dateString) {
      const dateParts = dateString.split("-");
      if (dateParts.length === 3) {
        const date = new Date(
          `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`
        );
        if (date instanceof Date && !isNaN(date.getTime())) {
          const transactions: Transaction[] = JSON.parse(
            readFileSync(path.resolve("transactions.json"), "utf-8")
          );
          console.log(date.toDateString());
          const transactions_on_day = transactions.filter((transaction) => {
            return (
              new Date(transaction.date).toDateString() <= date.toDateString()
            );
          });
          valid = true;
          if (transactions_on_day.length) {
            res
              .status(200)
              .json({ balance: transactions_on_day.slice(-1)[0].balance });
          } else {
            res.status(200).json("No transactions available");
          }
        }
      }
    }
    if (!valid) {
      res.status(400).json("Invalid date parameter");
    }
  } catch (err: any) {
    console.error(`fetch balance: ${err.message}`);
    res.status(500).json("An error occurred when fetching balance");
  }
};
