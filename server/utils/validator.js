const validTrips = [];
const failedRows = [];

for (const row of rows) {

    if (!row["FM No"]) {
        failedRows.push(row);
        continue;
    }

    validTrips.push(convertRow(row));
}

await Trip.insertMany(validTrips);