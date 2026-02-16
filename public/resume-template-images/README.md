# Resume Template Images

This directory contains preview images for all resume templates.

## Image Naming Convention

All template preview images follow this naming pattern:
- **Config reference**: `{template-id}-preview.webp`
- **Actual file**: `{template-id}-template-design.webp`

## Current Mappings

| Template ID | Preview Path | Actual File |
|------------|--------------|-------------|
| atlantic-blue | `/resume-template-images/atlantic-blue-preview.webp` | `atlantic-blue-template-design.webp` |
| classic | `/resume-template-images/classic-preview.webp` | `classic-template-design.webp` |
| clean-slate | `/resume-template-images/clean-slate-preview.webp` | `clean-slate-form-template-design.webp` |
| corporate | `/resume-template-images/corporate-preview.webp` | `corporate-template-design.webp` |
| executive | `/resume-template-images/executive-preview.webp` | `executive-template-design.webp` |
| harvard | `/resume-template-images/harvard-preview.webp` | `harvard-template-design.webp` |
| mercury | `/resume-template-images/mercury-preview.webp` | `Mercury-template-design.webp` |
| true-blue | `/resume-template-images/true-blue-preview.webp` | `true-blue-template-design.webp` |

## Implementation

Preview images are implemented using symbolic links:
```bash
ln -sf atlantic-blue-template-design.webp atlantic-blue-preview.webp
```

This approach:
- ✅ Maintains backward compatibility with existing design files
- ✅ Allows configs to use consistent naming
- ✅ No file duplication (saves disk space)
- ✅ Easy to update (change the symlink target)

## Adding New Template Images

When adding a new template:

1. **Add the design file**:
   ```bash
   cp your-template-design.webp public/resume-template-images/
   ```

2. **Create the preview symlink**:
   ```bash
   cd public/resume-template-images
   ln -sf your-template-design.webp your-template-preview.webp
   ```

3. **Reference in config**:
   ```typescript
   preview: "/resume-template-images/your-template-preview.webp"
   ```

## Image Requirements

- **Format**: WebP (for optimal compression)
- **Dimensions**: Recommended 800x1132px (A4 aspect ratio)
- **File size**: < 500KB (for fast loading)
- **Content**: Full resume preview showing all sections

## Verification

To verify all preview links are working:
```bash
cd public/resume-template-images
for file in *-preview.webp; do
  if [ -L "$file" ]; then
    target=$(readlink "$file")
    if [ -f "$target" ]; then
      echo "✅ $file -> $target"
    else
      echo "❌ $file -> $target (missing)"
    fi
  fi
done
```

## Notes

- Preview images are served from `/resume-template-images/` path in Next.js
- Images in `public/` folder are automatically served at root level
- No need to import images in components, just reference the path
- Symbolic links work in both development and production builds

