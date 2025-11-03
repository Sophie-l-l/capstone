# Test Credentials

## Test Student Account

- **Email**: `test@example.com`
- **Password**: `password123`
- **Role**: Student
- **User ID**: `a0c6d41f-71f1-495a-940b-10cfe9a402e5`

## Creating Additional Test Users

Run this command to create/reset the test user:

```bash
docker compose -f docker-compose.dev.yml exec backend npx ts-node create-test-user.ts
```

## Testing the Application

1. **Clear browser storage** (if needed):
   ```javascript
   // In browser console (F12)
   localStorage.clear()
   location.reload()
   ```

2. **Visit** http://localhost:3000/

3. **Click "Sign In"** and use the credentials above

4. **After login**, click "Go to Dashboard" to access your student dashboard

## Important URLs

- Home: http://localhost:3000/
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register
- Student Dashboard: http://localhost:3000/dashboard/student/{user-id}
- Backend API: http://localhost:3001
- Backend Health: http://localhost:3001/health
- AI Service: http://localhost:8000
- AI Service Health: http://localhost:8000/health

## Troubleshooting

### "Failed to fetch" on Dashboard
- Make sure backend is running: `docker compose -f docker-compose.dev.yml ps backend`
- Check backend health: `curl http://localhost:3001/health`
- Verify you're using the correct user ID (UUID, not "1")

### Auto-redirecting to Dashboard Instead of Home
- This is expected behavior if you're already logged in
- Clear localStorage to test login flow again

### Token Expired or Invalid
- Click logout in the top-right avatar menu
- Or clear localStorage and login again
