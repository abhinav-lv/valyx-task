import pdfplumber
import os
import json

# Define the path to the "statements" folder
folder_path = "./statements"  # Adjust the path as needed

# List PDF files in the folder
pdf_files = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith(".pdf")]

# Initialize a list to store PDF data
pdf_data = []

# Iterate through the PDF files and extract text content and tables
for pdf_file in pdf_files:
    with pdfplumber.open(pdf_file) as pdf:
        pdf_info = {"filename": pdf_file, "pages": []}
        for page in pdf.pages:
            page_info = {"page_number": page.page_number, "text": page.extract_text()}
            pdf_info["pages"].append(page_info)
        
        pdf_data.append(pdf_info)

# Convert the collected data to JSON
json_data = json.dumps(pdf_data, ensure_ascii=False)

# Print the JSON data
print(json_data)
