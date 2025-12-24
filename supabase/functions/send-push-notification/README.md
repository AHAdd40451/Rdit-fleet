# Send Push Notification Edge Function

This Supabase Edge Function sends push notifications to users via Expo's Push Notification Service.

## Setup

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-push-notification
   ```

## Usage

### From your app code:

```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    userIds: [1, 2, 3], // Array of user IDs from your users table
    title: 'New Asset Created',
    body: 'A new asset has been added to your fleet',
    data: {
      type: 'asset_created',
      asset_id: '123'
    }
  }
})
```

### From a database trigger:

You can create a PostgreSQL function that calls this Edge Function, or use the simpler approach of creating a notification record and processing it with a scheduled function.

## Example: Sending notification when asset is created

In your app code (e.g., when creating an asset):

```typescript
// After successfully creating an asset
const { data: users } = await supabase
  .from('users')
  .select('id')
  .eq('role', 'user')

if (users && users.length > 0) {
  const userIds = users.map(u => u.id)
  
  await supabase.functions.invoke('send-push-notification', {
    body: {
      userIds,
      title: 'New Asset Created',
      body: `${assetName} has been added to your fleet`,
      data: {
        type: 'asset_created',
        asset_id: newAssetId
      }
    }
  })
}
```

## Response Format

Success:
```json
{
  "success": true,
  "expoResponse": [...],
  "tokensSent": 5,
  "messagesCount": 5
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing

You can test the function locally:

```bash
supabase functions serve send-push-notification
```

Then call it with curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userIds": [1],
    "title": "Test Notification",
    "body": "This is a test",
    "data": {"type": "test"}
  }'
```

