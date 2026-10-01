# LR No Transformation Guide

## Overview
The Transport Management System now converts LR (Lorry Receipt) numbers from string format to an array of integers. This allows for better data consistency and enables range-based queries.

## Input Formats

The system supports multiple input formats for the `lrNo` field:

### 1. **Slash Format (Recommended for Ranges)**
Converts a range notation into an array of consecutive numbers.

**Format:** `"6521/22"`

**How it works:**
- Base number: `6521`
- Suffix: `22`
- The suffix represents the last 2 digits of the second number
- Result: `[6521, 6522]`

**Examples:**
- `"6521/22"` → `[6521, 6522]`
- `"6526/27"` → `[6526, 6527]`
- `"11298/308"` → `[11298, 11308]` (3-digit suffix)
- `"11298/08"` → `[11298, 11308]` (handles rollover automatically)

### 2. **Pipe Format (Multiple Numbers)**
Use pipe (|) to separate individual LR numbers.

**Format:** `"6521|6522|6523"`

**Examples:**
- `"6521|6522"` → `[6521, 6522]`
- `"100|200|300"` → `[100, 200, 300]`

### 3. **Array Format (API/Programmatic)**
When sending data via API, you can already send an array of numbers.

**Format:** `[6521, 6522]`

**Examples:**
- `[6521, 6522]` → `[6521, 6522]`
- `[100, 200, 300]` → `[100, 200, 300]`

### 4. **Single Number**
A single number is converted to an array with one element.

**Format:** `"6529"` or `6529`

**Examples:**
- `"6529"` → `[6529]`
- `6529` → `[6529]`

## Understanding Rollover Logic

The slash format includes intelligent rollover handling:

**Case 1: Normal Range**
```
"6521/22"
Base: 6521, Suffix: 22
Suffix length: 2 digits
Modulus: 100
First part of 6521 using modulus: 6500
Calculate: 6500 + 22 = 6522 (greater than 6521)
Result: [6521, 6522] ✓
```

**Case 2: Rollover**
```
"11298/08"
Base: 11298, Suffix: 08
Suffix length: 2 digits
Modulus: 100
First part of 11298 using modulus: 11200
Calculate: 11200 + 08 = 11208 (less than 11298)
Increment prefix: (112 + 1) × 100 + 08 = 11308
Result: [11298, 11308] ✓
```

## Implementation Details

### Creating Records
When adding a new record:
1. Enter the LR No in one of the supported formats
2. The backend automatically transforms it to an array of integers
3. The transformed array is stored in MongoDB

### Importing Records
When importing from Excel/CSV:
1. Include the LR No column in your import file
2. Use any of the supported formats in the cells
3. The system will automatically transform all values

### Querying Records
When searching for records:
- Search by any number in the array
- Example: searching for "6522" will find records where `lrNo` contains 6522

## Examples

### Adding a Single Record
**Input Form:**
- LR No: `6521/22`

**Stored in Database:**
```json
{
  "lrNo": [6521, 6522],
  "freightMemoNo": 12345,
  "transportName": "Mahadev Kharade"
}
```

### Importing Multiple Records
**CSV File:**
```
Date,Transport Name,FM No,LR No,Vehicle No,Party Name
2024-09-13,Mahadev Kharade,101,6521/22,MH12FC7196,Company A
2024-09-13,Komal Bharat,102,6526/27,MH13AX3963,Company B
2024-09-13,New Sankalp,103,11298/308,MH45AF4242,Company C
```

**Stored in Database:**
```json
[
  { "lrNo": [6521, 6522], "freightMemoNo": 101 },
  { "lrNo": [6526, 6527], "freightMemoNo": 102 },
  { "lrNo": [11298, 11308], "freightMemoNo": 103 }
]
```

## Edge Cases

| Input           | Output           | Notes                      |
| --------------- | ---------------- | -------------------------- |
| `"6521/22"`     | `[6521, 6522]`   | Normal case                |
| `"11298/08"`    | `[11298, 11308]` | Rollover with leading zero |
| `"100/200"`     | `[100, 300]`     | Large suffix (rollover)    |
| `"6529"`        | `[6529]`         | Single number              |
| `""`            | `[]`             | Empty string               |
| `null`          | `[]`             | Null value                 |
| `"invalid/abc"` | `[]`             | Invalid suffix             |

## Migration Notes

- All existing records with string-format LR numbers need to be migrated to the new format
- The system can handle mixed data types during the import process
- Old pipe-separated format `"6521\|6522"` is still supported for backward compatibility
- The transformation is applied automatically during create/update operations

## Support

For issues or questions regarding LR No format:
1. Verify the input format matches one of the supported formats
2. Check the transformation test results: `node server/utils/transformLrNo.test.js`
3. Review the error message returned by the API
