# Judge0 Testing Guide 🧪

This guide provides multiple methods to test your Judge0 integration and ensure everything is working properly.

## Quick Tests

### 1. **Run the Test Suite** (Recommended)

```bash
cd apps/backend
node test-judge0.js
```

This will test:
- ✅ Judge0 API connectivity
- ✅ Code execution functionality  
- ✅ All 4 supported languages (Python, JavaScript, Java, C++)
- ✅ Backend API integration

### 2. **Manual API Test**

Test Judge0 directly with curl:

```bash
curl -X POST "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true" \
  -H "X-RapidAPI-Key: 3fea58ff11msh3a34ae1c02ec47dp156a2ejsnae3140cb9e32" \
  -H "X-RapidAPI-Host: judge0-ce.p.rapidapi.com" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello Judge0!\")",
    "language_id": 71
  }'
```

Expected output should include:
```json
{
  "stdout": "Hello Judge0!\n",
  "status": { "description": "Accepted" }
}
```

### 3. **Backend Route Test**

Start your backend and test the code execution route:

```bash
# In terminal 1 - Start backend
cd apps/backend
npm run dev

# In terminal 2 - Test the route
curl -X POST "http://localhost:3001/api/code-execution/1/run" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello from backend!\")",
    "language": "python",
    "input": ""
  }'
```

### 4. **Frontend Integration Test**

If your frontend is running, you can test through the UI:

1. Start both services:
   ```bash
   # Terminal 1 - Backend
   cd apps/backend && npm run dev
   
   # Terminal 2 - Frontend  
   cd apps/frontend && npm run dev
   ```

2. Navigate to a problem page (e.g., http://localhost:3000/problems/1)
3. Write some code in the editor
4. Click "Run Code" button
5. Check the console and test results

## Troubleshooting

### Issue: "Request failed with status code 429"
- **Cause**: Rate limiting from RapidAPI
- **Solution**: Wait a few minutes between requests, or upgrade your RapidAPI plan

### Issue: "Network Error" or timeout
- **Cause**: Internet connectivity or API service down
- **Solution**: Check your internet connection and try again

### Issue: "Invalid API Key"
- **Cause**: Wrong or expired API key
- **Solution**: Verify your API key in RapidAPI dashboard

### Issue: Backend not responding
- **Cause**: Backend server not running
- **Solution**: Make sure `npm run dev` is running in `apps/backend`

### Issue: Language not supported
- **Current supported languages**:
  - Python (ID: 71)
  - JavaScript (ID: 63)  
  - Java (ID: 62)
  - C++ (ID: 54)

## Expected Test Results

When everything works correctly, you should see:

```
🧪 Judge0 Connection Test Suite
================================

🔍 Testing Judge0 API connectivity...
✅ Judge0 API is accessible
📊 Found 75+ supported languages

🚀 Testing simple code execution...
✅ Code execution successful!
📄 Output: "Hello from Judge0!"
⏱️  Runtime: 0.01s
💾 Memory: 3736KB

🌐 Testing all supported languages...
  Testing python...
    ✅ python: PASS
  Testing javascript...
    ✅ javascript: PASS
  Testing java...
    ✅ java: PASS
  Testing cpp...
    ✅ cpp: PASS

🔗 Testing backend API integration...
✅ Backend API is accessible

🎉 All tests passed! Judge0 integration is working perfectly.
```

## Next Steps

Once Judge0 is working:

1. **Test with Real Problems**: Use actual coding problems from your database
2. **Test Input/Output**: Verify problems with test cases work correctly  
3. **Error Handling**: Test compilation errors, runtime errors, timeout scenarios
4. **Performance**: Monitor execution time and memory usage
5. **Rate Limits**: Understand your API usage limits

## Additional Debug Info

- **Judge0 API Docs**: https://ce.judge0.com/
- **RapidAPI Dashboard**: https://rapidapi.com/judge0-official/api/judge0-ce/
- **Language IDs**: Available via GET `/languages` endpoint
- **Status Codes**: Available via GET `/statuses` endpoint

Need help? The test suite above will give you detailed error messages for any issues! 🚀