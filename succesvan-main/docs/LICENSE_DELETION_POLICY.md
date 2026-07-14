# License Deletion Policy - Data Privacy Implementation

## Overview
This document outlines the automatic license deletion feature that ensures customer data privacy and fulfills the promise made to users: "Your data is safe with us. After your reservation is completed, your license documents will be automatically deleted from our database."

## Implementation Details

### Files Modified
- `/app/api/reservations/[id]/route.ts` - PATCH endpoint

### How It Works

When a reservation status is changed to `"completed"`:

1. **Trigger Check**: The system verifies that the status is changing TO "completed" (not already completed)
2. **User License Retrieval**: Fetches the user's license data from the database
3. **S3 Deletion**: 
   - Extracts S3 keys from the stored license URLs
   - Deletes both front and back license images from AWS S3 bucket
   - Handles errors gracefully without blocking the reservation update
4. **Database Cleanup**: 
   - Removes license references from the user document
   - Sets `licenceAttached.front` and `licenceAttached.back` to undefined

### Code Flow

```typescript
// When PATCH request updates reservation status to "completed"
if (body.status === "completed" && oldReservation?.status !== "completed") {
  // 1. Get user with license data
  const user = await User.findById(reservation.user);
  
  // 2. Extract S3 keys from URLs
  const frontKey = extractS3Key(user.licenceAttached.front);
  const backKey = extractS3Key(user.licenceAttached.back);
  
  // 3. Delete from S3
  await deleteImage(frontKey);
  await deleteImage(backKey);
  
  // 4. Update database
  await User.findByIdAndUpdate(
    reservation.user,
    { licenceAttached: { front: undefined, back: undefined } }
  );
}
```

### Error Handling

- **S3 Deletion Errors**: Logged but don't block the process
- **Database Update Errors**: Logged but don't block the process
- **URL Parsing Errors**: Gracefully handled with try-catch

All errors are logged to console for monitoring and debugging.

### Data Models

#### User Model
```typescript
licenceAttached: {
  front: { type: String },  // S3 URL
  back: { type: String }    // S3 URL
}
```

#### Reservation Model
```typescript
status: {
  type: String,
  enum: ["pending", "confirmed", "canceled", "delivered", "completed"],
  default: "pending"
}
```

### S3 Integration

Uses the existing S3 utility functions:
- `deleteImage(key)` - Deletes object from S3 bucket
- Bucket: `process.env.S3_BUCKET` (default: "svh-bucket-s3")
- Region: `process.env.S3_REGION` (default: "eu-west-2")

### Customer Communication

The trust message displayed in the customer dashboard:
```
🔒 Your data is safe with us. We use industry-standard encryption to protect 
your license information. After your reservation is completed, your license 
documents will be automatically deleted from our database. We only keep your 
data for the duration needed to process your booking.
```

## Testing

To test the feature:

1. Create a reservation with license uploads
2. Update reservation status to "completed" via PATCH endpoint
3. Verify:
   - License files are deleted from S3
   - User document no longer contains license URLs
   - No errors in console logs

### Test API Call
```bash
PATCH /api/reservations/{reservationId}
{
  "status": "completed"
}
```

## Monitoring

Check server logs for:
- `License deleted for user {userId} after reservation completion` - Success
- `Error deleting front/back license from S3` - S3 deletion issues
- `License deletion error` - General errors

## Future Enhancements

- Add email notification to user when licenses are deleted
- Add audit log entry for license deletion
- Add admin dashboard view of deletion history
- Implement scheduled cleanup for orphaned licenses
