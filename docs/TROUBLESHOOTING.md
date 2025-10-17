# 🔧 Troubleshooting Guide

## Package Installation Issues

### EPERM Error (File Lock)

**Problem**: `EPERM: operation not permitted, lstat 'node_modules/react-freeze'`

**Cause**: Windows file system has locked the `react-freeze` module, preventing npm from modifying it.

**Solutions** (try in order):

#### Solution 1: Restart Development Environment
```bash
# 1. Close ALL terminal windows
# 2. Close VS Code or your editor
# 3. Restart your computer
# 4. Open fresh terminal and try again:
cd D:\Scratch_n_Sniff\scratch-oracle-app
npm install expo-camera expo-barcode-scanner expo-notifications --legacy-peer-deps
```

#### Solution 2: Delete node_modules and Reinstall
```bash
# Warning: This will take 5-10 minutes to reinstall everything
cd D:\Scratch_n_Sniff\scratch-oracle-app
rmdir /s /q node_modules
rmdir /s /q package-lock.json
npm install --legacy-peer-deps
npm install expo-camera expo-barcode-scanner expo-notifications --legacy-peer-deps
```

#### Solution 3: Use Yarn Instead
```bash
# If npm keeps failing, try yarn
npm install -g yarn
cd D:\Scratch_n_Sniff\scratch-oracle-app
yarn add expo-camera expo-barcode-scanner expo-notifications
```

#### Solution 4: Manual Package Addition
If all else fails, manually add to `package.json`:
```json
{
  "dependencies": {
    "expo-camera": "~15.0.16",
    "expo-barcode-scanner": "~13.0.1",
    "expo-notifications": "~0.28.19",
    "react-native-maps": "1.14.0",
    "expo-location": "~17.0.1"
  }
}
```
Then run: `npm install --legacy-peer-deps`

---

## Development Server Issues

### Metro Bundler Won't Start

**Problem**: `npx expo start` fails or hangs

**Solutions**:
```bash
# Clear cache
npx expo start --clear

# Or use tunnel mode
npx expo start --tunnel

# Or reset Metro cache
npx react-native start --reset-cache
```

### Port Already in Use

**Problem**: Port 8081 or 19000 already in use

**Solutions**:
```bash
# Windows: Kill process on port
netstat -ano | findstr :8081
taskkill /PID <PID_NUMBER> /F

# Or use different port
npx expo start --port 19001
```

---

## Build Issues

### EAS Build Fails

**Problem**: `eas build` fails with dependency errors

**Solutions**:
```bash
# Update EAS CLI
npm install -g eas-cli@latest

# Clear build cache
eas build --platform android --clear-cache

# Check eas.json is valid
eas build:configure
```

### Android Build Errors

**Problem**: Gradle build fails

**Solutions**:
1. Check `app.json` has correct `android.package`
2. Verify all native modules are installed
3. Check Android SDK is up to date
4. Try: `eas build --platform android --profile production --clear-cache`

---

## Runtime Issues

### Camera Not Working

**Problem**: Camera shows black screen or permission denied

**Solutions**:
1. **Check permissions** in `app.json`:
   ```json
   "plugins": [
     ["expo-camera", {
       "cameraPermission": "Allow Scratch Oracle to scan lottery tickets"
     }]
   ]
   ```

2. **Rebuild app** after adding camera plugin
3. **Check device permissions** in Settings > Apps > Scratch Oracle > Permissions

### Notifications Not Arriving

**Problem**: Push notifications not received

**Solutions**:
1. **Check notification permissions** granted
2. **Verify Expo push token** is generated:
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync();
   console.log('Push token:', token);
   ```
3. **Test with Expo push tool**: https://expo.dev/notifications

### Maps Not Loading

**Problem**: Map shows gray screen

**Solutions**:
1. **Add Google Maps API key** in `app.json`:
   ```json
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "YOUR_API_KEY_HERE"
       }
     }
   }
   ```
2. **Enable Maps SDK** in Google Cloud Console
3. **Rebuild app** after adding API key

---

## Data & State Issues

### AsyncStorage Not Persisting

**Problem**: Data disappears on app restart

**Solutions**:
```typescript
// Check AsyncStorage is working
import AsyncStorage from '@react-native-async-storage/async-storage';

const test = async () => {
  await AsyncStorage.setItem('test', 'value');
  const result = await AsyncStorage.getItem('test');
  console.log('AsyncStorage test:', result); // Should log 'value'
};
```

### State Not Updating

**Problem**: UI doesn't reflect state changes

**Solutions**:
1. **Check useState hook** is used correctly
2. **Verify state updates are immutable**:
   ```typescript
   // Bad
   stats.totalWins = 5;

   // Good
   setStats({ ...stats, totalWins: 5 });
   ```

---

## Performance Issues

### App Runs Slowly

**Solutions**:
1. **Enable Hermes** in `app.json`:
   ```json
   "android": {
     "jsEngine": "hermes"
   }
   ```
2. **Optimize images** (use smaller sizes, WebP format)
3. **Use React.memo** for expensive components
4. **Add virtualization** for long lists (FlatList)

### Memory Leaks

**Problem**: App crashes after extended use

**Solutions**:
1. **Clean up useEffect**:
   ```typescript
   useEffect(() => {
     const subscription = data.subscribe();
     return () => subscription.unsubscribe(); // Cleanup
   }, []);
   ```
2. **Clear intervals/timers** on unmount
3. **Use Flipper** to profile memory usage

---

## Testing Issues

### Expo Go Limitations

**Problem**: Some features don't work in Expo Go

**Limitation**: Expo Go doesn't support:
- Custom native modules
- Background tasks
- Some notification features

**Solution**: Build development client:
```bash
eas build --profile development --platform android
```

---

## Common Error Messages

### "Invariant Violation: requireNativeComponent"

**Cause**: Native module not linked

**Fix**:
```bash
# Rebuild app
eas build --platform android --clear-cache
```

### "Unable to resolve module"

**Cause**: Missing dependency

**Fix**:
```bash
npm install <missing-package>
# Or
yarn add <missing-package>
```

### "Network request failed"

**Cause**: API endpoint unreachable

**Fix**:
1. Check internet connection
2. Verify API endpoint is correct
3. Check CORS if calling from web
4. Use tunnel mode: `npx expo start --tunnel`

---

## Getting Help

### Resources

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Stack Overflow**: Tag with `expo` and `react-native`
- **Expo Forums**: https://forums.expo.dev
- **Discord**: Expo Community Discord

### Debugging Tools

1. **React Native Debugger**:
   ```bash
   npm install -g react-native-debugger
   ```

2. **Flipper**:
   - Download: https://fbflipper.com
   - Plugins: Network, Databases, Images

3. **Sentry** (Crash Reporting):
   ```bash
   npm install @sentry/react-native
   ```

4. **Reactotron** (State Inspector):
   ```bash
   npm install --save-dev reactotron-react-native
   ```

---

## Quick Fixes Checklist

When something breaks, try these in order:

- [ ] Restart Metro bundler
- [ ] Clear cache: `npx expo start --clear`
- [ ] Restart development server
- [ ] Rebuild app
- [ ] Delete `node_modules` and reinstall
- [ ] Update all packages: `npx expo install --fix`
- [ ] Check Expo SDK compatibility
- [ ] Read error message carefully (often has the fix!)
- [ ] Google the exact error message
- [ ] Ask on Stack Overflow

---

## Prevention Tips

1. **Keep dependencies updated**:
   ```bash
   npx expo install --check
   npx expo install --fix
   ```

2. **Use fixed versions** in package.json (not `^` or `~`)

3. **Test on real devices** regularly

4. **Use TypeScript** to catch errors early

5. **Write tests** for critical features

6. **Monitor crash reports** (Sentry, Firebase Crashlytics)

7. **Keep backups** of working builds

---

**Remember**: Most issues have been solved before. Google is your friend! 🔍
