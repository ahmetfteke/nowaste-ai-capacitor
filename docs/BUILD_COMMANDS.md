# Build & Deploy Commands

## iOS

### Development (run on connected iPhone via Xcode)

```bash
npm run ios
```

This runs: `npm run build && npx cap sync ios && npx cap open ios`

Then in Xcode:
1. Select your iPhone from the device dropdown
2. Press **Cmd + R**

### Build only (no Xcode)

```bash
npm run build && npx cap sync ios
cd ios/App && xcodebuild -scheme App -project App.xcodeproj -destination 'generic/platform=iOS' -allowProvisioningUpdates build
```

### Clean build (when SPM/cache issues occur)

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*
cd ios/App
xcodebuild -resolvePackageDependencies -scheme App -project App.xcodeproj
xcodebuild -scheme App -project App.xcodeproj -destination 'generic/platform=iOS' -allowProvisioningUpdates build
```

## Android

### Default Android device

```bash
npm run android
```

### Samsung device (specific target)

```bash
npm run samsung
```

## Web

### Development server

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## After npm install on a new machine

The `postinstall` script automatically runs `patch-package` to apply the `RGCFA_INCLUDE_GOOGLE` patch for iOS Google Sign-In. No extra steps needed.

```bash
npm install
# patch-package runs automatically
npm run ios   # or npm run android
```
