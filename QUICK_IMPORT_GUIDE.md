# Quick Start: Import Demo Data

## ✅ No Downloads Required!

You already have everything you need in `apps/backend/prisma/data/sample-200.jsonl` (284KB).

---

## 🚀 Step-by-Step Instructions

### Step 1: Ensure Database is Ready

```bash
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform

# Make sure backend dependencies are installed
cd apps/backend
npm install

# Run database migrations and seed
npx prisma migrate dev
npx prisma db seed
```

**Expected output:** Problems and Knowledge Components seeded to database.

---

### Step 2: Import Demo Submissions

```bash
# From apps/backend directory
npx ts-node prisma/import-submissions-enhanced.ts prisma/data/sample-200.jsonl 100
```

**What this does:**
- Creates demo user: `demo@educode.com` / `Demo123!`
- Imports 100 realistic submissions
- Generates error messages for failed submissions
- Initializes BKT mastery states
- Takes 2-3 minutes

**Expected output:**
```
📂 Reading JSONL file: prisma/data/sample-200.jsonl
🎯 Max submissions: 100
✅ Created demo user: demo@educode.com
📝 Found 25 problems in database
🧠 Found 12 Knowledge Components
✅ Imported 10 submissions...
✅ Imported 20 submissions...
...
✅ Imported 100 submissions...

📊 Import Summary:
   ✅ Successfully imported: 100 submissions
   ❌ Errors: 0
   📝 Total lines processed: 100

📈 Submission Status Distribution:
   accepted: 42 (42.0%)
   wrong_answer: 28 (28.0%)
   runtime_error: 15 (15.0%)
   compilation_error: 10 (10.0%)
   time_limit_exceeded: 5 (5.0%)

🎯 BKT States created: 12

✅ Import complete! Database disconnected.

🚀 Next steps:
   1. Login as demo@educode.com / Demo123!
   2. View dashboard to see imported submission history
   3. Check Knowledge Component mastery levels
```

---

### Step 3: Verify Import

```bash
# Start your backend (if not running)
npm run dev

# In another terminal, check the data
npx prisma studio
```

In Prisma Studio:
1. Go to **User** table → find demo@educode.com
2. Go to **Submission** table → should see 100 submissions
3. Go to **BKTState** table → should see mastery values for different KCs

---

### Step 4: Login and Test

1. Start frontend: `cd apps/frontend && npm run dev`
2. Visit http://localhost:3000/login
3. Login: `demo@educode.com` / `Demo123!`
4. Check dashboard for:
   - Submission history
   - KC mastery chart
   - Error patterns
   - Problem recommendations

---

## 💾 Disk Space Requirements

**Total space needed: < 1 MB** ✅

- `sample-200.jsonl`: 284 KB
- Database with 100 submissions: ~500 KB
- No additional downloads required!

---

## ⚠️ Troubleshooting

### "User not found" error
```bash
# Manually create user first
cd apps/backend
npx ts-node create-test-user.ts
```

### "No problems found" error
```bash
# Seed database
cd apps/backend
npx prisma db seed
```

### Want to reset and start fresh?
```bash
cd apps/backend
npx prisma migrate reset  # Drops all data
npx prisma db seed        # Re-seeds problems/KCs
npx ts-node prisma/import-submissions-enhanced.ts prisma/data/sample-200.jsonl 100
```

---

## 🎯 What You Get

After import, your demo user will have:
- ✅ **100 submissions** across multiple problems
- ✅ **60-day history** (realistic timeline)
- ✅ **Varied outcomes**: Accepted, Wrong Answer, Runtime Errors, etc.
- ✅ **Error messages**: Real-looking compile/runtime errors
- ✅ **BKT mastery states**: For all Knowledge Components
- ✅ **Realistic patterns**: Some KCs mastered, some struggling

Perfect for demonstrating:
- Student dashboard analytics
- Error classification system
- BKT-based recommendations
- Progress tracking over time

---

## 🔄 Want More Data?

If you need more submissions later:

```bash
# Import all 200 submissions
npx ts-node prisma/import-submissions-enhanced.ts prisma/data/sample-200.jsonl

# Or import from the full dataset (if you download it)
npx ts-node prisma/import-submissions-enhanced.ts prisma/data/dump-original.jsonl 500
```

**Note:** The full `dump-original.jsonl` is 1.6GB, but you already have it! Just be careful importing too many (500-1000 is enough for demo).

---

## ✅ You're Ready!

You now have a realistic demo environment with **zero additional downloads** and **minimal disk space usage**.
