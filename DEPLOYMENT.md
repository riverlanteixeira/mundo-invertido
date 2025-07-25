# 🚀 Deployment Guide - Stranger Things AR Game

## GitHub Pages Setup

### 1. Repository Configuration

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings > Pages
   - Source: "GitHub Actions"
   - The workflow will run automatically on push

### 2. GitHub Actions Workflow

The deployment is automated via `.github/workflows/deploy.yml`:

- ✅ **Build Stage**: Tests, builds, and optimizes assets
- ✅ **Deploy Stage**: Deploys to GitHub Pages with HTTPS
- ✅ **Cache Busting**: Service Worker updated with timestamps
- ✅ **PWA Icons**: Auto-generated SVG icons
- ✅ **Production Testing**: Validates build before deployment

### 3. Access URLs

- **Production**: `https://[username].github.io/[repository-name]/`
- **Development**: `http://localhost:8000` (run `npm run dev`)

## Production Testing Checklist

### ✅ Automated Tests (via GitHub Actions)

- [x] Unit tests pass
- [x] Integration tests pass
- [x] Performance tests pass
- [x] Production build validation
- [x] PWA configuration check
- [x] Service Worker validation

### 🧪 Manual Testing Required

#### HTTPS and Security
- [ ] Site loads over HTTPS
- [ ] No mixed content warnings
- [ ] Service Worker registers successfully
- [ ] PWA manifest loads correctly

#### PWA Functionality
- [ ] "Add to Home Screen" prompt appears
- [ ] App installs as PWA
- [ ] Offline functionality works
- [ ] Cache updates properly

#### Device-Specific (Samsung S20 FE)
- [ ] Camera permission request works
- [ ] Geolocation permission request works
- [ ] Vibration permission request works
- [ ] AR.js loads and functions
- [ ] WebXR compatibility

#### Game Functionality
- [ ] Loading screen shows progress
- [ ] Audio plays correctly
- [ ] Navigation arrow appears and rotates
- [ ] Geolocation accuracy < 20m
- [ ] AR models load and display
- [ ] Image tracking works
- [ ] Combat system functions
- [ ] Upside Down filter applies
- [ ] Mission progression works
- [ ] Inventory system works

## Troubleshooting

### Common Issues

#### 1. Service Worker Not Updating
```javascript
// Clear cache in browser console
caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
});
```

#### 2. HTTPS Required Errors
- Ensure accessing via `https://` URL
- GitHub Pages automatically provides HTTPS
- Local testing requires HTTPS for camera/location

#### 3. AR Not Working
- Check browser compatibility (Chrome mobile recommended)
- Verify HTTPS is enabled
- Ensure camera permissions granted
- Test lighting conditions

#### 4. Geolocation Issues
- Enable high-accuracy GPS
- Test in open area (not indoors)
- Allow location permissions
- Wait for GPS calibration

### Performance Monitoring

#### Key Metrics to Monitor
- **Load Time**: < 10s for initial assets
- **FPS**: 30+ during AR scenes
- **Memory Usage**: < 512MB on Samsung S20 FE
- **GPS Accuracy**: < 5m precision
- **Cache Hit Rate**: > 90% for repeat visits

#### Performance Testing Commands
```bash
# Build and test production
npm run deploy

# Run performance tests
cd tests && npm run test:performance

# Check bundle size
du -sh dist/
```

## Deployment Commands

### Local Development
```bash
# Install dependencies
npm install
cd tests && npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Production Deployment
```bash
# Build for production
npm run build

# Test production build
npm run test:production

# Deploy (build + test)
npm run deploy
```

### Manual GitHub Pages Deploy
```bash
# Build and push
npm run build
git add dist/
git commit -m "Production build"
git push origin main
```

## Security Considerations

### HTTPS Requirements
- **Camera API**: Requires HTTPS in production
- **Geolocation API**: Requires HTTPS for high accuracy
- **Service Worker**: Only works over HTTPS
- **PWA Installation**: Requires HTTPS

### Privacy
- Location data never sent to servers
- All processing happens client-side
- No user data collection
- Cache stored locally only

### Permissions
- Camera: Required for AR functionality
- Location: Required for mission navigation
- Vibration: Optional for feedback
- Storage: Required for offline functionality

## Monitoring and Analytics

### Error Tracking
```javascript
// Add to app.js for production monitoring
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Send to monitoring service if needed
});
```

### Performance Monitoring
```javascript
// Monitor Service Worker updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker updated');
});
```

## Post-Deployment Verification

### 1. Automated Checks
- [ ] GitHub Actions workflow completed successfully
- [ ] No build errors in Actions log
- [ ] Production tests passed
- [ ] Site accessible at GitHub Pages URL

### 2. Manual Verification
- [ ] PWA installs correctly
- [ ] Offline mode works
- [ ] All assets load properly
- [ ] AR functionality works on target device
- [ ] Geolocation accuracy acceptable
- [ ] Audio plays without issues
- [ ] Game progression works end-to-end

### 3. Device Testing
- [ ] Samsung S20 FE (primary target)
- [ ] Other Android devices (compatibility)
- [ ] Different browsers (Chrome, Edge, Firefox)
- [ ] Various network conditions (3G, 4G, WiFi)

## Rollback Procedure

If issues are found in production:

1. **Immediate**: Revert to previous commit
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Fix and redeploy**:
   ```bash
   # Fix issues
   npm run build
   npm run test:production
   git commit -m "Fix production issues"
   git push origin main
   ```

## Success Criteria

Deployment is considered successful when:

- ✅ All automated tests pass
- ✅ PWA installs and works offline
- ✅ AR functionality works on Samsung S20 FE
- ✅ Geolocation accuracy < 20m
- ✅ All 8 missions can be completed
- ✅ Performance meets target metrics
- ✅ No critical errors in browser console

---

**Ready for deployment!** 🎉

The Stranger Things AR Game is now configured for automatic deployment to GitHub Pages with full PWA support, HTTPS, and optimized performance for Samsung S20 FE devices.