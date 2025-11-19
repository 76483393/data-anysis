import { DataRow } from "../types";
import * as XLSX from 'xlsx';

export const parseFile = async (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const data = event.target?.result;
      
      if (isExcel) {
        try {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as DataRow[];
          if (!jsonData || jsonData.length === 0) {
             reject(new Error("Excel sheet appears to be empty"));
             return;
          }
          resolve(jsonData);
        } catch (e) {
          console.error(e);
          reject(new Error("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file."));
        }
        return;
      }

      // Text based parsing for CSV/JSON
      const text = data as string;
      
      if (file.type === "application/json" || file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            resolve(json);
          } else {
            reject(new Error("JSON must be an array of objects"));
          }
        } catch (e) {
          reject(new Error("Invalid JSON file"));
        }
      } else {
        // Simple CSV Parser logic
        try {
          const lines = text.split('\n').filter(l => l.trim() !== '');
          if (lines.length < 2) {
            resolve([]);
            return;
          }
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const result: DataRow[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            // Handle simple CSV splitting (does not handle commas inside quotes strictly)
            const currentLine = lines[i].split(',');
            if (currentLine.length >= headers.length) {
              const obj: DataRow = {};
              headers.forEach((header, index) => {
                let val: string | number = currentLine[index]?.trim().replace(/^"|"$/g, '') ?? "";
                // Try to parse number
                if (!isNaN(Number(val)) && val !== '') {
                  val = Number(val);
                }
                obj[header] = val;
              });
              result.push(obj);
            }
          }
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse CSV"));
        }
      }
    };
    
    reader.onerror = () => reject(new Error("Error reading file"));
    
    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};