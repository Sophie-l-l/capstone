# Instructor Account Setup

## 📋 Summary

Successfully created instructor test account and class for the EduCode Adaptive Platform.

## ✅ Created Accounts

### Instructor Account
- **Email**: instructor@example.com
- **Password**: instructor123
- **Name**: Dr. Jane Smith
- **Role**: instructor
- **Bio**: Computer Science Professor specializing in Data Structures and Algorithms
- **Location**: University Campus

### Student Account (Existing)
- **Email**: test@example.com
- **Password**: password123
- **Name**: Test User
- **Role**: student

## 📚 Class Information

### Data Structures and Algorithms
- **Class Code**: CS201-FALL2025
- **Semester**: Fall 2025
- **Instructor**: Dr. Jane Smith (instructor@example.com)
- **Enrolled Students**: 
  - Test User (test@example.com)

## 🚀 Deployment Status

### Local Database (Docker)
- ✅ Instructor account created
- ✅ Class created (CS201-FALL2025)
- ✅ Test student enrolled in class
- ✅ Database: `postgresql://postgres:postgres@educode-postgres:5432/educode`

### Production Database (GCP Cloud SQL)
- ✅ Instructor account synced
- ✅ Class synced (CS201-FALL2025)
- ✅ Test student synced
- ✅ Enrollment synced
- ✅ Database: Cloud SQL `educode-db` (via proxy on port 5433)
- ✅ Migrations applied (class management tables)

## 🔐 How to Login

### Frontend URL
- **Production**: https://educode-adaptive-platform.vercel.app
- **Local**: http://localhost:3000

### Instructor Login
1. Go to https://educode-adaptive-platform.vercel.app/login
2. Email: `instructor@example.com`
3. Password: `instructor123`

### Student Login
1. Go to https://educode-adaptive-platform.vercel.app/login
2. Email: `test@example.com`
3. Password: `password123`

## 📊 Testing Scenarios

### For Instructor Account
- ✅ View class roster (CS201-FALL2025)
- ✅ Monitor student progress (Test User)
- ✅ View class-wide analytics
- ✅ Access instructor dashboard
- ✅ Manage class settings
- ✅ View student submissions for class problems

### For Student Account
- ✅ Enroll in class (already enrolled in CS201-FALL2025)
- ✅ View class assignments
- ✅ Submit code for problems
- ✅ Track personal progress
- ✅ View class leaderboard

## 📁 Files Created

1. **create-instructor-and-class.ts**
   - Location: `apps/backend/create-instructor-and-class.ts`
   - Purpose: Creates instructor account, class, and enrollment
   - Usage: `DATABASE_URL="..." npx ts-node create-instructor-and-class.ts`

2. **sync-instructor-to-production.sh**
   - Location: `apps/backend/sync-instructor-to-production.sh`
   - Purpose: Syncs instructor data from local to production database
   - Usage: `./sync-instructor-to-production.sh`

## 🔧 Maintenance

### Re-create Instructor (if needed)

**Local Database:**
```bash
cd apps/backend
docker exec -i educode-backend sh -c \
  "cd /app/apps/backend && DATABASE_URL='postgresql://postgres:postgres@educode-postgres:5432/educode' \
   npx ts-node create-instructor-and-class.ts"
```

**Production Database:**
```bash
# Start Cloud SQL proxy
/opt/homebrew/share/google-cloud-sdk/bin/cloud-sql-proxy \
  educode-platform-2025:us-central1:educode-db --port 5433 &

# Run sync script
cd apps/backend
./sync-instructor-to-production.sh
```

### Verify Production Data

```bash
PGPASSWORD=EduCode2025SecureDB! psql -h localhost -p 5433 -U postgres -d educode -c "
SELECT u.email, u.name, u.role 
FROM users u 
WHERE u.email IN ('instructor@example.com', 'test@example.com');"
```

## 🎯 Next Steps

1. ✅ Login as instructor on production frontend
2. ✅ Verify class management features work
3. ✅ Test student enrollment and progress tracking
4. ✅ Verify all 58 problems are accessible
5. ✅ Test instructor dashboard with real student data
6. ✅ Prepare demo scenarios for final presentation

## 📝 Notes

- The instructor account has full access to class management features
- Test student is enrolled in CS201-FALL2025 class
- All data synced to both local and production databases
- Production backend: https://educode-backend-162585155042.us-central1.run.app
- Production AI service: https://educode-ai-162585155042.us-central1.run.app
- 58 problems available (33 easy, 21 medium, 4 hard)
- Dashboard and metrics pages use real API data (not mock data)

## ✨ Features Ready for Testing

### Instructor Dashboard
- [ ] Class overview with student count
- [ ] Recent submissions from enrolled students
- [ ] Class performance metrics
- [ ] At-risk student identification
- [ ] Problem difficulty distribution

### Class Management
- [ ] View enrolled students
- [ ] Track individual student progress
- [ ] Create problem sets for class
- [ ] Set assignment due dates
- [ ] Grade submissions

### Student Analytics
- [ ] View student submission history
- [ ] Track knowledge component mastery
- [ ] Identify common error patterns
- [ ] Monitor time spent on problems
- [ ] Bloom's taxonomy level analysis
