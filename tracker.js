You'll need to create a tracking table with fields like:

original_id (int)
aaa_id (int)
price (numeric)
deletion_date (datetime)
reason (text)


***********************



// Button click procedure
PROCEDURE BTN_DeleteAndRecreate_Click()

// Arrays to store deleted records for tracking
arrDeletedIDs is array of int
arrDeletedAAA_IDs is array of int
arrDeletedPrices is array of numeric

// Step 1: Store information about records being deleted
HReadFirst(YourTable, id)
WHILE NOT HOut(YourTable)
    // Store the data of records to be deleted
    Add(arrDeletedIDs, YourTable.id)
    Add(arrDeletedAAA_IDs, YourTable.aaa_id)
    Add(arrDeletedPrices, YourTable.price)
    
    HReadNext(YourTable, id)
END

// Step 2: Delete the specific records by ID
FOR EACH nID OF arrDeletedIDs
    HReadSeekFirst(YourTable, id, nID)
    IF HFound(YourTable) THEN
        HDelete(YourTable)
    END
END

// Step 3: Recreate records (your recreation logic here)
// Example recreation logic - replace with your actual logic
FOR i = 1 TO arrDeletedIDs.Count
    // Your record recreation code here
    // YourTable.id = arrDeletedIDs[i]
    // YourTable.aaa_id = arrDeletedAAA_IDs[i]
    // YourTable.price = arrDeletedPrices[i]
    // HAdd(YourTable)
END

// Step 4: Check which records were not recreated
FOR i = 1 TO arrDeletedIDs.Count
    nOriginalID is int = arrDeletedIDs[i]
    nOriginalAAA_ID is int = arrDeletedAAA_IDs[i]
    nOriginalPrice is numeric = arrDeletedPrices[i]
    
    // Check if this record was recreated
    bFound is boolean = False
    HReadFirst(YourTable, id)
    WHILE NOT HOut(YourTable)
        IF YourTable.aaa_id = nOriginalAAA_ID AND YourTable.price = nOriginalPrice THEN
            bFound = True
            BREAK
        END
        HReadNext(YourTable, id)
    END
    
    // If not found, log it to tracking table
    IF NOT bFound THEN
        TrackingTable.original_id = nOriginalID
        TrackingTable.aaa_id = nOriginalAAA_ID
        TrackingTable.price = nOriginalPrice
        TrackingTable.deletion_date = DateSys() + TimeSys()
        TrackingTable.reason = "Record not recreated after deletion"
        
        IF NOT HAdd(TrackingTable) THEN
            Error("Error logging missing record: " + HErrorInfo())
        END
    END
END

Info("Operation completed. Check tracking table for any missing records.")

END










*********************





// Button click procedure
PROCEDURE BTN_DeleteAndRecreate_Click()

arrOriginalRecords is array of STRecordSnapshot
arrOriginalRecords = CollectRecordsToDelete()

DeleteRecords(arrOriginalRecords)
RecreateRecords(arrOriginalRecords)
TrackMissingRecords(arrOriginalRecords)

Info("Operation completed. Check tracking table for any missing records.")

END

// Structure to hold record snapshot
STRecordSnapshot is Structure
    id is int
    aaa_id is int
    price is numeric
END

// Single Responsibility: Collect records that will be deleted
PROCEDURE CollectRecordsToDelete() : array of STRecordSnapshot

arrRecords is array of STRecordSnapshot
stRecord is STRecordSnapshot

HReadFirst(YourTable, id)
WHILE NOT HOut(YourTable)
    stRecord.id = YourTable.id
    stRecord.aaa_id = YourTable.aaa_id
    stRecord.price = YourTable.price
    Add(arrRecords, stRecord)
    
    HReadNext(YourTable, id)
END

RESULT arrRecords

END

// Single Responsibility: Delete records
PROCEDURE DeleteRecords(arrRecords is array of STRecordSnapshot)

FOR EACH stRecord OF arrRecords
    HReadSeekFirst(YourTable, id, stRecord.id)
    IF HFound(YourTable) THEN
        HDelete(YourTable)
    END
END

END

// Single Responsibility: Recreate records (implement your logic here)
PROCEDURE RecreateRecords(arrRecords is array of STRecordSnapshot)

// Your recreation logic here
// Example:
// FOR EACH stRecord OF arrRecords
//     YourTable.id = stRecord.id
//     YourTable.aaa_id = stRecord.aaa_id
//     YourTable.price = stRecord.price
//     HAdd(YourTable)
// END

END

// Single Responsibility: Track records that weren't recreated
PROCEDURE TrackMissingRecords(arrOriginalRecords is array of STRecordSnapshot)

FOR EACH stOriginal OF arrOriginalRecords
    IF NOT RecordExists(stOriginal.aaa_id, stOriginal.price) THEN
        LogMissingRecord(stOriginal)
    END
END

END

// Single Responsibility: Check if record exists
PROCEDURE RecordExists(nAAA_ID is int, nPrice is numeric) : boolean

HReadSeekFirst(YourTable, aaa_id, nAAA_ID)
WHILE HFound(YourTable) AND YourTable.aaa_id = nAAA_ID
    IF YourTable.price = nPrice THEN
        RESULT True
    END
    HReadNext(YourTable, aaa_id)
END

RESULT False

END

// Single Responsibility: Log missing record to tracking table
PROCEDURE LogMissingRecord(stRecord is STRecordSnapshot)

TrackingTable.original_id = stRecord.id
TrackingTable.aaa_id = stRecord.aaa_id
TrackingTable.price = stRecord.price
TrackingTable.deletion_date = DateSys() + TimeSys()
TrackingTable.reason = "Record not recreated after deletion"

IF NOT HAdd(TrackingTable) THEN
    Error("Error logging missing record: " + HErrorInfo())
END

END
