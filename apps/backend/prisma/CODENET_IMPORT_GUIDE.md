# IBM CodeNet Import Guide

## Step 1: Download CodeNet Dataset

### Option A: Download via Git (Smaller subset - RECOMMENDED)
```bash
# Create a directory for CodeNet data
mkdir -p ~/Downloads/codenet
cd ~/Downloads/codenet

# Clone the repository (WARNING: This is large!)
# Better to download specific problems only
```

### Option B: Download from IBM Research (Full dataset)
1. Go to: https://developer.ibm.com/exchanges/data/all/project-codenet/
2. Click "Get this dataset"
3. Sign in with IBM ID (free)
4. Download the dataset (~10GB compressed)

### Option C: Download Sample Problems (FASTEST - Recommended for demo)
We'll download specific problem metadata and submissions:

```bash
# Create codenet directory
mkdir -p ~/Downloads/codenet
cd ~/Downloads/codenet

# Download problem list
curl -o problem_list.csv "https://raw.githubusercontent.com/IBM/Project_CodeNet/main/metadata/problem_list.csv"

# Download a sample problem's metadata
curl -o p00000.csv "https://raw.githubusercontent.com/IBM/Project_CodeNet/main/metadata/p00000.csv"
```

## Step 2: Understanding CodeNet Structure

### Problem Metadata (`problem_list.csv`):
- `id`: Problem ID (e.g., p00000)
- `name`: Problem name
- `dataset`: Source (AtCoder, AIZU, etc.)
- `time_limit`: Time limit in seconds
- `memory_limit`: Memory limit in bytes
- `rating`: Difficulty rating
- `tags`: Problem tags/categories

### Submission Metadata (per problem, e.g., `p00000.csv`):
- `submission_id`: Unique submission ID
- `problem_id`: Problem ID
- `user_id`: Anonymized user ID
- `date`: Submission timestamp
- `language`: Programming language
- `original_language`: Original language name
- `filename_ext`: File extension
- `status`: Verdict (Accepted, Wrong Answer, etc.)
- `cpu_time`: Execution time in ms
- `memory`: Memory used in bytes
- `code_size`: Size of code in bytes

### Code Files:
- Located in: `data/{problem_id}/{language}/{submission_id}.{ext}`
- Example: `data/p00000/C++/s123456789.cpp`

## Step 3: Download Sample for Your Demo

Run this script to download a manageable subset:

```bash
cd /Users/sofi/Documents/Capstone/capstone/educode-adaptive-platform/apps/backend/prisma/data

# Download problem list
curl -o codenet_problem_list.csv "https://raw.githubusercontent.com/IBM/Project_CodeNet/main/metadata/problem_list.csv"

# Download metadata for first 10 problems
for i in {0..9}; do
  problem_id=$(printf "p%05d" $i)
  echo "Downloading metadata for $problem_id..."
  curl -o "codenet_${problem_id}.csv" "https://raw.githubusercontent.com/IBM/Project_CodeNet/main/metadata/${problem_id}.csv"
done

echo "Download complete! Check the data folder."
```

## Step 4: Import CodeNet Data

I'll create an import script that:
1. Reads problem metadata from CSV
2. Creates problems in your database
3. Reads submission metadata
4. Downloads actual code for selected submissions
5. Imports submissions with real verdicts

The script will be: `prisma/import-codenet.ts`

## Next Steps:
1. Run the download script above
2. I'll create the import script
3. Run the import (will take 5-10 minutes for 10 problems)
4. You'll have real problems with real submissions!
