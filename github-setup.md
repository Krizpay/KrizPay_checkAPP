# GitHub Setup Commands

After creating your GitHub repository, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Example:
```bash
git remote add origin https://github.com/yourusername/krizpay.git
git branch -M main
git push -u origin main
```

## Verify Upload
After pushing, your repository should contain:
- ✅ All source code files
- ✅ README.md with deployment instructions
- ✅ .env.example (template for environment variables)
- ✅ vercel.json (Vercel deployment configuration)
- ✅ PWA files (manifest.json, service worker, icons)
- ❌ .env file (excluded by .gitignore for security)

## Next Steps After GitHub Upload:

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - `DATABASE_URL` - Your Neon database URL
   - `ONMETA_API_KEY` - Your Onmeta API key
5. Deploy!

### 2. Set up Database
```bash
npm run db:push
```

### 3. Test the Deployment
- Visit your Vercel URL
- Test QR scanning functionality
- Test payment flow
- Verify mobile PWA installation

## Repository Structure
```
krizpay/
├── api/                    # Vercel serverless functions
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared types and schemas
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies and scripts
```