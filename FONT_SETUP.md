# Font Setup Instructions

The Montserrat and Open Sans fonts have been configured to load locally instead of from Google Fonts CDN. To complete the setup, you need to download the font files.

## Required Font Files

Create a `public/fonts/` directory and download these files:

### Montserrat (weights: 500, 600, 700)
- `montserrat-v26-latin-500.woff2`
- `montserrat-v26-latin-500.woff`
- `montserrat-v26-latin-600.woff2`
- `montserrat-v26-latin-600.woff`
- `montserrat-v26-latin-700.woff2`
- `montserrat-v26-latin-700.woff`

### Open Sans (weights: 400, 500)
- `open-sans-v40-latin-regular.woff2`
- `open-sans-v40-latin-regular.woff`
- `open-sans-v40-latin-500.woff2`
- `open-sans-v40-latin-500.woff`

## Download Commands

Run these commands from the project root to download the fonts:

```bash
# Create fonts directory
mkdir -p public/fonts

# Download Montserrat fonts
curl -o public/fonts/montserrat-v26-latin-500.woff2 "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcoqK5.woff2"
curl -o public/fonts/montserrat-v26-latin-500.woff "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Uw-Y3tcqqK5.woff"

curl -o public/fonts/montserrat-v26-latin-600.woff2 "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM6Uw-Y3tcoqK5.woff2"
curl -o public/fonts/montserrat-v26-latin-600.woff "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM6Uw-Y3tcqK5.woff"

curl -o public/fonts/montserrat-v26-latin-700.woff2 "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCs16Ew-Y3tcoqK5.woff2"
curl -o public/fonts/montserrat-v26-latin-700.woff "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCs16Ew-Y3tcqK5.woff"

# Download Open Sans fonts
curl -o public/fonts/open-sans-v40-latin-regular.woff2 "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVc.woff2"
curl -o public/fonts/open-sans-v40-latin-regular.woff "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVI.woff"

curl -o public/fonts/open-sans-v40-latin-500.woff2 "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVc.woff2"
curl -o public/fonts/open-sans-v40-latin-500.woff "https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVI.woff"
```

## Verification

After downloading, verify that all font files exist:
```bash
ls -la public/fonts/
```

You should see 10 font files total (5 for Montserrat, 5 for Open Sans).

## Changes Made

1. **Removed Google Fonts CDN link** from `public/index.html`
2. **Added local fonts CSS** file at `public/css/fonts.css`
3. **Updated HTML** to reference local fonts instead of external CDN

The fonts will now load from your local server instead of Google's CDN, improving performance and reducing external dependencies.