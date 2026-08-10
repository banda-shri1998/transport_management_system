# Transport Records Import Template Guide

## Overview
This document describes the format required to import transport records into the system.

## File Format
- **Type**: CSV (Comma-Separated Values)
- **Encoding**: UTF-8
- **Headers**: Required in first row
- **Sample File**: `transport-records-template.csv`

## Column Specifications

| # | Column Name | Type | Required | Format/Example | Notes |
|---|---|---|---|---|---|
| 1 | date | Date | ✓ | YYYY-MM-DD | e.g., 2026-01-15 |
| 2 | transportName | Text | ✓ | String | e.g., Mahadev Kharade |
| 3 | freightMemoNo | Number/Text | ✓ | 1001 | Unique identifier for freight |
| 4 | lrNo | Text | ✗ | LR001 or LR001\|LR002 | Multiple LRs separated by \| |
| 5 | vehicleNo | Text | ✓ | MH12FC7196 | Vehicle registration number |
| 6 | partyName | Text | ✓ | ABC Logistics | Consignee/Customer name |
| 7 | company | Text | ✗ | ABC Corp | Company name (optional) |
| 8 | location | Text | ✗ | Mumbai | Delivery location (optional) |
| 9 | quantity | Number | ✓ | 100 | Integer or decimal |
| 10 | rate | Number | ✓ | 500 | Per unit rate in rupees |
| 11 | totalAmount | Number | ✓ | 50000 | quantity × rate |
| 12 | advancePaid | Number | ✗ | 5000 | Advance payment (default: 0) |
| 13 | fuelType | Text | ✗ | Diesel or CNG | Default: Diesel |
| 14 | fuelRate | Number | ✗ | 98.4 | Cost per liter (auto-filled based on fuelType) |
| 15 | fuelQuantity | Number | ✗ | 50 | Liters consumed (default: 0) |
| 16 | fuelExpense | Number | ✗ | 4920 | fuelRate × fuelQuantity (auto-calculated) |
| 17 | previousClosingBalance | Number | ✗ | 0 | Historical balance before payment (default: 0) |
| 18 | paymentDate | Date | ✗ | YYYY-MM-DD | Payment date (optional) |
| 19 | payAmount | Number | ✗ | 0 | Amount paid in settlement (default: 0) |
| 20 | balance | Number | ✓ | 45080 | totalAmount - advancePaid - fuelExpense - payAmount |

## Detailed Field Descriptions

### Required Fields
1. **date**: Transaction date (YYYY-MM-DD format)
2. **transportName**: Name of the transporter/vehicle owner
3. **freightMemoNo**: Freight memo number (unique identifier)
4. **vehicleNo**: Vehicle registration number (e.g., MH12FC7196)
5. **partyName**: Consignee or customer name
6. **quantity**: Cargo quantity
7. **rate**: Rate per unit
8. **totalAmount**: Total freight amount (quantity × rate)
9. **balance**: Closing balance (totalAmount - advancePaid - fuelExpense - payAmount)

### Optional Fields
- **lrNo**: Lorry Receipt number (can contain multiple values separated by |)
- **company**: Company name
- **location**: Delivery location
- **advancePaid**: Advance payment made (default: 0)
- **fuelType**: Diesel or CNG (default: Diesel)
- **fuelRate**: Cost per liter (auto-filled if fuelType specified)
- **fuelQuantity**: Fuel used in liters (default: 0)
- **fuelExpense**: Fuel cost (auto-calculated)
- **previousClosingBalance**: Historical balance tracking
- **paymentDate**: When payment was received
- **payAmount**: Payment amount received

## Important Rules

1. **Column Order**: Columns must be in the exact order as shown above
2. **Column Names**: Must match exactly (case-sensitive)
3. **Date Format**: Always use YYYY-MM-DD (e.g., 2026-01-15)
4. **Numeric Fields**: Use numbers without currency symbols
5. **Multiple LR Numbers**: Separate with pipe symbol | (e.g., LR001|LR002)
6. **Empty Cells**: Leave empty for optional fields (don't use 0 unless it's a valid value)
7. **CSV Special Characters**: If value contains comma or quote, wrap in quotes: "Value, with comma"

## Calculation Rules

The system automatically calculates:
- **totalAmount** = quantity × rate
- **fuelExpense** = fuelQuantity × fuelRate
- **balance** = totalAmount - advancePaid - fuelExpense - payAmount

If you provide these calculated values, they will be used as-is.

## Fuel Type Mapping

| Fuel Type | Default Rate |
|---|---|
| Diesel | ₹98.4 per liter |
| CNG | ₹99 per liter |

## Example Record

```csv
date,transportName,freightMemoNo,lrNo,vehicleNo,partyName,company,location,quantity,rate,totalAmount,advancePaid,fuelType,fuelRate,fuelQuantity,fuelExpense,previousClosingBalance,paymentDate,payAmount,balance
2026-01-15,Mahadev Kharade,1001,LR001,MH12FC7196,ABC Logistics,ABC Corp,Mumbai,100,500,50000,5000,Diesel,98.4,50,4920,0,,0,45080
```

### Explanation:
- **Date**: 2026-01-15
- **Transporter**: Mahadev Kharade with vehicle MH12FC7196
- **Freight**: 100 units at ₹500/unit = ₹50,000 total
- **Advance Paid**: ₹5,000
- **Fuel**: 50 liters of Diesel at ₹98.4/liter = ₹4,920
- **Balance**: ₹50,000 - ₹5,000 - ₹4,920 = ₹40,080

## Common Errors & Solutions

| Error | Cause | Solution |
|---|---|---|
| "Missing required columns" | Column names don't match exactly | Check column headers match template |
| "Invalid date format" | Date not in YYYY-MM-DD | Use correct date format |
| "Balance calculation mismatch" | Manual balance ≠ calculated balance | System uses its calculation |
| "Import failed - empty file" | CSV has no data rows | Ensure headers + at least 1 data row |
| "Duplicate freight memo" | freightMemoNo already exists | Use unique freightMemoNo values |

## Import Steps

1. **Download Template**: Use the template download button
2. **Fill Data**: Add your records following the format
3. **Validate**: Check all required fields are filled
4. **Import**: Upload CSV file via "Import Records" button
5. **Verify**: Check the success message for record count

## Tips

✓ Use the template file as a starting point  
✓ Always test with a small batch first  
✓ Keep a backup of your data before importing  
✓ Verify calculations before importing  
✓ Use consistent formatting for transporter names  
✓ Export existing records to see the exact format  

## Support

If you encounter issues:
1. Download and review the template file
2. Export a few existing records to see the format
3. Compare your file with the exported format
4. Check for common errors listed above
