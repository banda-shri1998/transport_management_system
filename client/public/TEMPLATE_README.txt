================================================================================
TRANSPORT RECORDS IMPORT TEMPLATE - README
================================================================================

QUICK START:
1. Download the template file: transport-records-template.csv
2. Open in Excel or any spreadsheet application
3. Replace sample data with your actual records
4. Save as CSV format
5. Upload via "Import Records" button

================================================================================
WHAT'S IN THIS FOLDER:
================================================================================

1. transport-records-template.csv
   - CSV file with all required columns and sample data
   - Use this as a starting point for your imports
   - Contains 5 sample records showing proper format

2. IMPORT_TEMPLATE_GUIDE.md
   - Detailed documentation about each column
   - Data types and format specifications
   - Common errors and troubleshooting
   - Examples and calculation rules

3. TEMPLATE_README.txt
   - This file

================================================================================
REQUIRED COLUMNS (in order):
================================================================================

1.  date                    (YYYY-MM-DD)
2.  transportName           (Text)
3.  freightMemoNo           (Number/Text)
4.  lrNo                    (Text - optional)
5.  vehicleNo               (Text)
6.  partyName               (Text)
7.  company                 (Text - optional)
8.  location                (Text - optional)
9.  quantity                (Number)
10. rate                    (Number)
11. totalAmount             (Number = quantity × rate)
12. advancePaid             (Number - optional)
13. fuelType                (Diesel or CNG)
14. fuelRate                (Number - auto-filled)
15. fuelQuantity            (Number - optional)
16. fuelExpense             (Number - auto-calculated)
17. previousClosingBalance  (Number - optional)
18. paymentDate             (YYYY-MM-DD - optional)
19. payAmount               (Number - optional)
20. balance                 (Number = totalAmount - advancePaid - fuelExpense - payAmount)

================================================================================
IMPORTANT RULES:
================================================================================

✓ Column order must match exactly as shown above
✓ Column names are case-sensitive
✓ All required columns must be present
✓ Use YYYY-MM-DD for dates (e.g., 2026-01-15)
✓ Use numbers for numeric fields (no ₹ or $ symbols)
✓ Leave optional columns empty if not needed
✓ If value contains comma, wrap in quotes: "Value, here"

================================================================================
FUEL TYPE DEFAULTS:
================================================================================

When you specify fuelType, the fuelRate is auto-filled:
- Diesel  → ₹98.4 per liter
- CNG     → ₹99 per liter

Leave fuelRate blank and specify fuelType, OR provide your own rate.

================================================================================
CALCULATION EXAMPLES:
================================================================================

Example 1: Basic freight
├─ quantity: 100 units
├─ rate: ₹500/unit
├─ totalAmount: 50,000 (calculated)
├─ advancePaid: ₹5,000
├─ fuelExpense: ₹4,920
└─ balance: ₹45,080 (50,000 - 5,000 - 4,920)

Example 2: With payment
├─ totalAmount: ₹50,000
├─ advancePaid: ₹5,000
├─ fuelExpense: ₹4,920
├─ payAmount: ₹10,000 (payment received)
└─ balance: ₹35,080 (50,000 - 5,000 - 4,920 - 10,000)

================================================================================
COMMON MISTAKES:
================================================================================

❌ Wrong date format: 15-01-2026 or 01/15/2026
✓ Correct format: 2026-01-15

❌ Using currency symbols: ₹50000 or $500
✓ Correct format: 50000 or 500

❌ Multiple LRs with comma: LR001,LR002
✓ Correct format: LR001|LR002 (use pipe | not comma)

❌ Column names don't match: "Transport" instead of "transportName"
✓ Use exact names from template

❌ Skipping required columns
✓ Include all required columns even if empty

================================================================================
IMPORT STEPS:
================================================================================

1. Click "Download Template" button on AllRecords page
2. Open transport-records-template.csv in Excel
3. Keep the header row (first row)
4. Delete sample rows
5. Add your data (minimum 1 record after header)
6. Save file as CSV
7. Go to AllRecords page
8. Click "Import Records" button
9. Select your CSV file
10. Success message shows number of records imported

================================================================================
VALIDATION:
================================================================================

The system will validate:
✓ All required columns are present
✓ Date format is correct (YYYY-MM-DD)
✓ Numeric fields contain valid numbers
✓ Required fields are not empty
✓ No duplicate freightMemoNo values

If validation fails, you'll see an error message. Check the specific column
and ensure it matches the format shown above.

================================================================================
SUPPORT & HELP:
================================================================================

If you encounter errors:

1. Download a fresh template from the app
2. Review the IMPORT_TEMPLATE_GUIDE.md for detailed specs
3. Export existing records to see working examples
4. Compare your file with exported format
5. Check common mistakes section above
6. Ensure CSV encoding is UTF-8 (standard for Excel exports)

================================================================================
TIPS & BEST PRACTICES:
================================================================================

1. Always test with 2-3 records first before bulk import
2. Keep backup of your original data
3. Use Export feature to see exact format of working records
4. For multiple LRs, use pipe separator: LR001|LR002|LR003
5. Consistent formatting helps (e.g., "Mahadev Kharade" not variations)
6. Pre-calculate balance to verify: Total - Advance - Fuel - Payment
7. Review imported records immediately to ensure accuracy

================================================================================
FILE FORMAT:
================================================================================

Type: CSV (Comma-Separated Values)
Encoding: UTF-8 (standard Excel/Google Sheets)
Line Breaks: Standard (CRLF or LF)
Delimiter: Comma (,)
Max Records per Import: No limit (tested with 1000+)
Max File Size: Limited by server (typically 100MB+)

================================================================================
VERSION:
================================================================================

Template Version: 1.0
Updated: 2026-01-16
Compatible with: Transport Management System v1.0+

================================================================================
QUESTIONS?
================================================================================

For detailed information about each field, see IMPORT_TEMPLATE_GUIDE.md

For more help:
1. Review the guide file included
2. Check the template CSV for format examples
3. Use the Export feature to see real data format
4. Try importing the sample template first

================================================================================
