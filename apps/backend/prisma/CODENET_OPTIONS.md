# CodeNet Import - Alternative Approach

The IBM CodeNet metadata is not directly available on GitHub anymore. Here are your options:

## Option 1: Official Download (Full Dataset - 13GB)

1. Visit: https://developer.ibm.com/exchanges/data/all/project-codenet/
2. Sign in with IBM ID (free)
3. Download `Project_CodeNet.tar.gz` (13 GB)
4. Extract metadata:
   ```bash
   tar -xzf Project_CodeNet.tar.gz Project_CodeNet/metadata/
   mv Project_CodeNet/metadata apps/backend/prisma/codenet/
   ```
5. Run import:
   ```bash
   npx ts-node apps/backend/prisma/import-codenet.ts
   ```

**Time**: 30 min download + 30 min import = 1 hour  
**Space**: 13 GB download, ~500 MB extracted metadata  
**Result**: 4,000+ real problems with test cases

## Option 2: Quick Demo Problems (Recommended for Now)

Create 50-100 high-quality problems manually based on popular platforms:

```bash
# Edit seed.ts to add more problems
code apps/backend/prisma/seed.ts

# Run seed
docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed
```

**Time**: 30-60 minutes  
**Result**: 50-100 curated problems for demo

## Option 3: Use LeetCode API (Automated)

There are unofficial LeetCode APIs that can provide problem data:

```bash
# Coming soon: leetcode-import.ts
# Will scrape ~100 problems from LeetCode
```

## Recommendation

**For your presentation (this week)**:
- Use **Option 2**: Manually add 20-30 more quality problems to seed.ts
- This gives you 30-40 total problems (enough for demo)
- Problems will have proper descriptions and test cases
- Time: 1 hour

**For production (after presentation)**:
- Use **Option 1**: Download full CodeNet dataset
- Import all 4,000+ problems
- Time: Can run overnight

## Quick Action

I can help you add 20 more problems to seed.ts right now (30 minutes):
- Mix of easy/medium/hard
- Various topics (arrays, strings, DP, trees, etc.)
- Proper test cases and descriptions

Would you like me to:
1. Add 20 problems to seed.ts now? (30 min)
2. Wait and help you download full CodeNet? (1+ hour)
3. Deploy frontend with current 8 problems? (15 min)
