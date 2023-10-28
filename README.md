# valyx-task

## To install dependencies

```bash
bun install
```

## To run

```bash
bun run index.ts
```

OR

```bash
bun dev
```

## Sample Statement File Used
- ### The sample statement file used is a HDFC statement, which can be found in the root directory of this repository.

## Libraries Used
- ### express: HTTP framework for Node.js
- ### googleapis: To access Gmail APIs
- ### pdfplumber: Python library to parse content from PDFs

## API
- ### Get all transactions

    ```
    /api/transactions
    ```

- ### Get transactions over specific date range
    ```
    /api/transactions?start_date=DD-MM-YYYY&end_date=DD-MM-YYYY
    ```
    
- ### Get balance as of given specific date
    ```
    /api/transactions/balance?date=DD-MM-YYYY
    ```

## Implementation
- The app will poll Gmail's API to get the attachments every 5 minutes.
- We first make a call to the ```list``` API, so that we can get a list of ids corresponding to mails that match the specific subject line given in the ```q``` parameter, which in this case is ```subject:statement OR subject:bank```
- Using these ids, we make calls to fetch the actual email content corresponding to each id and we obtain the ids for the attachments in each mail.
- Finally we make the requests to obtain the attachments from the ids we got in the previous step.
- We save the attachments in a directory named ```statements``` in the root directory.
- Immediately after the statement attachments are saved, we parse them to get the transactions.
- We save the transactions in a file named ```transactions.json``` in the root directory.
- The API uses this file to interact with transactions.


This project was created using `bun init` in bun v1.0.3. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.