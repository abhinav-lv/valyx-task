import path from "path";
import { google } from "googleapis";
import { existsSync, mkdirSync, writeFileSync } from "fs";

import { spawn } from "child_process";

// Set up OAuth2 client
export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set up Gmail API
export const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client,
});

// Authenticate with OAuth2
const tokens = {
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
};
oAuth2Client.setCredentials(tokens);

// Type for transaction object
interface Transaction {
  date: Date;
  narration: string;
  ref_no: string;
  value_dt: Date;
  transaction_type: "withdrawal" | "deposit" | "NA";
  amount: number;
  balance: number;
}

export const fetchAttachments = async () => {
  try {
    console.log("fetch attachments running");
    // Store the statements in 'statement' directory, create if does not exist
    const statementsFolder = "statements";
    if (!existsSync(statementsFolder)) {
      mkdirSync(statementsFolder);
    }

    // Get messages (ids of emails) from gmail API
    const gmailAPIResponse = await gmail.users.messages.list({
      userId: "me",
      q: `subject:statement OR subject:bank`,
    });

    // Get the messages from the response
    const messages = gmailAPIResponse?.data?.messages;
    if (!messages) throw new Error("No messages were received.");

    // Loop through the ids and fetch the attachments, if any
    for (const message of messages) {
      if (!message || !message.id) continue;

      // fetch the message obj
      const messageObj = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      // If the obj doesn't have a payload or an internalDate
      if (!messageObj?.data?.payload?.parts || !messageObj?.data?.internalDate)
        continue;

      const receivedTime = new Date(parseInt(messageObj.data.internalDate));
      for (const part of messageObj.data.payload.parts) {
        if (part?.filename && part?.body?.attachmentId) {
          // Get attachment file from gmail API
          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: message.id,
            id: part.body.attachmentId,
          });

          const data = attachment?.data?.data;
          if (data && receivedTime) {
            // Write the file to 'statements' directory
            const file_name = receivedTime.toISOString() + "_" + part.filename;
            const file_data = Buffer.from(data, "base64");
            const file_path = path.join("statements", file_name);
            if (!existsSync(file_path)) writeFileSync(file_path, file_data);
          }
        }
      }
    }
    parsePDFs();
  } catch (err: any) {
    console.error(`fetchAttachments: ${err.message}`);
  }
};

export const parsePDFs = () => {
  const pythonScript = "lib/plumber.py";
  try {
    const pythonProcess = spawn("python", [pythonScript]);

    pythonProcess.stdout.on("data", (data) => {
      const files: any[] = JSON.parse(data);
      files?.forEach((file) => {
        // console.log(file);
        const transactions: Transaction[] = [];
        // Get the pages in the file
        const pages: string[] = file.pages;

        // Loop through the pages
        pages?.forEach((page: any) => {
          const transactionList = page.text
            ?.split("Statementof account")[1]
            ?.split("HDFCBANKLIMITED")[0]
            ?.split("\n");
          let curTransaction = 0;
          transactionList?.forEach((transaction: string) => {
            const words = transaction?.split(" ");
            // console.log(words);

            // Get transactions from the list of words
            try {
              const dateArr = words[0].split("/");
              if (dateArr.length === 3) {
                const date = new Date(
                  `${dateArr[1]}/${dateArr[0]}/${dateArr[2]}`
                );
                const narration = words.slice(1, -4).join(" ");
                const balance = parseFloat(
                  words.slice(-1)[0]?.split(",")?.join("")
                );
                const amount = parseFloat(
                  words.slice(-2, -1)[0]?.split(",")?.join("")
                );
                const ref_no = words.slice(-4, -3)[0];
                const value_dtArr = words.slice(-3, -2)[0].split("/");
                const value_dt = new Date(
                  `${value_dtArr[1]}/${value_dtArr[0]}/${value_dtArr[2]}`
                );
                const transaction_type = curTransaction
                  ? transactions[curTransaction - 1].balance > balance
                    ? "withdrawal"
                    : "deposit"
                  : "NA";
                transactions.push({
                  date,
                  balance,
                  narration,
                  amount,
                  ref_no,
                  value_dt,
                  transaction_type,
                });
                curTransaction++;
              }
            } catch (err: any) {
              console.error(`get transactions: ${err.message}`);
            }
          });
        });
        // console.log(transactions);
        // Write the transactions to transactions.obj
        writeFileSync(
          "transactions.json",
          JSON.stringify(transactions || [], null, 2)
        );
      });
    });

    // If the python script fails
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python error: ${data}`);
    });

    // When the python script finishes executing
    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Python script executed successfully.");
      } else {
        console.error(`Python script exited with code ${code}`);
      }
    });
  } catch (err: any) {
    console.error(`parsePDFs: ${err.message}`);
  }
};
