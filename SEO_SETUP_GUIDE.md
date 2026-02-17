# SEO Setup Guide for Interview Trix

## Files Created

### 1. robots.ts (`src/app/robots.ts`)

- Dynamically generates robots.txt
- Allows all search engines to crawl public pages
- Blocks private pages (dashboard, API routes, auth pages)
- References sitemap.xml

### 2. sitemap.ts (`src/app/sitemap.ts`)

- Dynamically generates sitemap.xml
- Includes all public pages with priorities and change frequencies
- Update this file when you add new public pages

### 3. StructuredData.tsx (`src/components/StructuredData.tsx`)

- JSON-LD structured data for rich search results
- Includes Organization and WebApplication schemas
- Helper functions for Breadcrumbs and FAQ schemas

### 4. Enhanced Root Layout

- Comprehensive metadata with OpenGraph and Twitter cards
- SEO-optimized title and description
- Keywords for better search visibility
- Structured data integration

## How to Access Generated Files

After deploying or running locally, these files will be available at:

- **robots.txt**: `https://yourdomain.com/robots.txt`
- **sitemap.xml**: `https://yourdomain.com/sitemap.xml`

## Google Search Console Setup

### Step 1: Verify Your Website

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Enter your domain (e.g., `https://interviewtrix.com`)
4. Choose verification method:
   - **HTML tag** (recommended): Copy the verification code
   - Update `layout.tsx` line with your verification code:
     ```typescript
     verification: {
       google: "your-actual-verification-code-here",
     }
     ```
5. Click "Verify"

### Step 2: Submit Sitemap

1. In Google Search Console, go to "Sitemaps" (left sidebar)
2. Enter: `sitemap.xml`
3. Click "Submit"

### Step 3: Submit robots.txt (Optional)

- Google will automatically discover it at `/robots.txt`
- You can test it using the "robots.txt Tester" in Search Console

### Step 4: Request Indexing

1. Go to "URL Inspection" in Search Console
2. Enter your homepage URL
3. Click "Request Indexing"
4. Repeat for important pages (pricing, ATS checker, etc.)

## Environment Variables

Make sure to set in your `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

For production, set this in your hosting platform (Vercel, Netlify, etc.)

## Additional SEO Improvements

### 1. Add Page-Specific Metadata

For each page, you can add specific metadata. Example for pricing page:

```typescript
// src/app/pricing/page.tsx
export const metadata = {
  title: "Pricing Plans",
  description:
    "Choose the perfect plan for your resume building needs. Free and premium options available.",
  openGraph: {
    title: "Pricing Plans | Interview Trix",
    description: "Choose the perfect plan for your resume building needs.",
  },
};
```

### 2. Add Alt Text to Images

Ensure all images have descriptive alt text:

```tsx
<img src="/logo.png" alt="Interview Trix - AI Resume Builder Logo" />
```

### 3. Use Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use semantic tags (`<article>`, `<section>`, `<nav>`, etc.)

### 4. Improve Page Speed

- Optimize images (use Next.js Image component)
- Minimize JavaScript bundles
- Enable caching
- Use CDN for static assets

### 5. Add Canonical URLs

For pages with similar content, add canonical tags to avoid duplicate content issues.

### 6. Create Quality Content

- Add a blog section with helpful articles
- Create landing pages for specific keywords
- Add FAQs with structured data

## Monitoring and Analytics

### Google Analytics (Recommended)

1. Create a Google Analytics 4 property
2. Add the tracking code to your app
3. Monitor traffic, user behavior, and conversions

### Google Search Console Metrics

Monitor these regularly:

- **Impressions**: How often your site appears in search
- **Clicks**: How many people click through
- **CTR**: Click-through rate
- **Position**: Average ranking position
- **Coverage**: Pages indexed vs. errors

## Testing Your SEO

### 1. Test robots.txt

Visit: `https://yourdomain.com/robots.txt`
Should display the robots rules

### 2. Test sitemap.xml

Visit: `https://yourdomain.com/sitemap.xml`
Should display XML with all your pages

### 3. Test Structured Data

Use [Google's Rich Results Test](https://search.google.com/test/rich-results)

- Enter your homepage URL
- Verify Organization and WebApplication schemas appear

### 4. Test Mobile-Friendliness

Use [Google's Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

### 5. Test Page Speed

Use [PageSpeed Insights](https://pagespeed.web.dev/)

- Aim for 90+ score on both mobile and desktop

## Common Issues and Solutions

### Issue: Sitemap not found

**Solution**: Ensure `sitemap.ts` is in the `src/app` directory and rebuild your app

### Issue: Pages not being indexed

**Solution**:

- Check robots.txt isn't blocking the pages
- Submit URLs manually in Search Console
- Ensure pages are linked from other pages (internal linking)
- Check for noindex meta tags

### Issue: Low rankings

**Solution**:

- Improve content quality and relevance
- Build backlinks from reputable sites
- Improve page speed
- Ensure mobile-friendliness
- Use relevant keywords naturally

## Next Steps

1. ✅ Deploy your changes to production
2. ✅ Verify your site in Google Search Console
3. ✅ Submit your sitemap
4. ✅ Request indexing for key pages
5. ⏳ Wait 2-7 days for Google to crawl and index
6. ⏳ Monitor Search Console for issues
7. ⏳ Continuously improve content and SEO

## Additional Resources

- [Google Search Central](https://developers.google.com/search)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Schema.org Documentation](https://schema.org/)
- [Web.dev SEO Guide](https://web.dev/learn/seo/)

## Support

If you encounter any issues with SEO setup, check:

1. Next.js documentation for metadata and SEO
2. Google Search Console help center
3. Ensure all environment variables are set correctly
