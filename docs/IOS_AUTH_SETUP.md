# iOS Authentication Setup Guide

Complete setup guide for Google Sign-In and Apple Sign-In on iOS using `@capacitor-firebase/authentication` with Capacitor 7 (SPM).

## Prerequisites

- Apple Developer Account (paid)
- Firebase project with Authentication enabled
- Capacitor 7 project with SPM (not CocoaPods)

---

## Part 1: Firebase Auth Initialization (Critical)

The Firebase JS SDK's default auth persistence does **not** work in Capacitor's WKWebView. `signInWithCredential` will hang indefinitely (promise never resolves) unless you use `indexedDBLocalPersistence`.

In `src/lib/firebase.ts`:

```typescript
import { initializeApp, getApps } from "firebase/app";
import { Capacitor } from "@capacitor/core";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Use indexedDBLocalPersistence on native platforms
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
```

**Why**: `getAuth()` uses `browserLocalPersistence` by default, which relies on `window.localStorage`. In Capacitor's iOS WKWebView, this persistence layer causes `signInWithCredential` to never resolve. Using `indexedDBLocalPersistence` fixes this.

**Reference**: [firebase-js-sdk#5497](https://github.com/firebase/firebase-js-sdk/issues/5497)

---

## Part 2: Capacitor Config

In `capacitor.config.ts`:

```typescript
plugins: {
    FirebaseAuthentication: {
        skipNativeAuth: true,
        providers: ['google.com', 'apple.com'],
    },
},
```

### Why `skipNativeAuth: true`

- `skipNativeAuth: false`: The native plugin signs into Firebase via the native SDK. But the **web** Firebase SDK (running in the WebView) is a completely separate instance and doesn't receive the auth state. This means `auth.currentUser` stays null, routing doesn't work, and `onAuthStateChanged` never fires.
- `skipNativeAuth: true`: The native plugin only performs the OAuth flow (getting tokens from Google/Apple). Your JS code then calls `signInWithCredential` on the web Firebase SDK, which properly sets auth state, triggers `onAuthStateChanged`, and allows routing.

---

## Part 3: Google Sign-In Setup

### 3.1 Firebase Console

1. Go to [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com)
2. Enable **Google** as a sign-in provider
3. Save

### 3.2 Google Cloud Console - iOS OAuth Client

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find or create an **iOS** OAuth 2.0 Client ID
3. Set **Bundle ID** to your app's bundle ID (e.g. `com.nowaste.ai`)
4. Set **Team ID** to your Apple Developer Team ID
5. Save (changes can take 5 minutes to a few hours to propagate)

### 3.3 GoogleService-Info.plist

Download from Firebase Console → Project Settings → iOS app. Place in **two** locations:

```
ios/App/GoogleService-Info.plist
ios/App/App/GoogleService-Info.plist
```

### 3.4 Info.plist URL Scheme

In `ios/App/App/Info.plist`, add the `REVERSED_CLIENT_ID` from `GoogleService-Info.plist` as a URL scheme:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_CLIENT_ID_HERE</string>
        </array>
    </dict>
</array>
```

### 3.5 Critical: RGCFA_INCLUDE_GOOGLE Compile Flag

The `@capacitor-firebase/authentication` plugin wraps **all** Google Sign-In code behind `#if RGCFA_INCLUDE_GOOGLE` in `GoogleAuthProviderHandler.swift`. Without this flag, `signInWithGoogle()` silently does nothing — no dialog, no error.

#### The Problem

The plugin's `Package.swift` does **not** include the GoogleSignIn SDK or the compile flag by default for SPM builds.

#### The Fix: patch-package

We use `patch-package` to modify the plugin's `Package.swift`.

**Install**:
```bash
npm install patch-package --save-dev
```

**Add postinstall to `package.json`**:
```json
"scripts": {
    "postinstall": "patch-package"
}
```

**What to patch** in `node_modules/@capacitor-firebase/authentication/Package.swift`:

1. Add `GoogleSignIn-iOS` to dependencies:
```swift
.package(url: "https://github.com/google/GoogleSignIn-iOS.git", "8.0.0"..<"10.0.0")
```

2. Add `GoogleSignIn` to target dependencies:
```swift
.product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")
```

3. Add swiftSettings to the target:
```swift
swiftSettings: [
    .define("RGCFA_INCLUDE_GOOGLE")
]
```

**Create the patch**:
```bash
npx patch-package @capacitor-firebase/authentication
```

This creates `patches/@capacitor-firebase+authentication+VERSION.patch` which is auto-applied on `npm install`.

#### Do NOT Add GoogleSignIn Manually in Xcode

Adding GoogleSignIn-iOS via Xcode's "Add Package Dependencies" AND having it in the plugin's Package.swift causes:
```
unable to load transferred PIF: The workspace contains multiple references with the same GUID
```

If you hit this, remove it from Xcode: App project → Package Dependencies tab → select GoogleSignIn-iOS → minus button.

### 3.6 Auth Code (Google)

```typescript
const signInWithGoogle = async () => {
  if (isCapacitor) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const nativeResult = await FirebaseAuthentication.signInWithGoogle();

    const idToken = nativeResult.credential?.idToken;
    if (!idToken) throw new Error("No ID token received from Google Sign-In");

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    // Handle new user setup if needed
    if (result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
      await initializeNewUser(result.user.uid, result.user.email || "", result.user.displayName);
    }
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    // ...
  }
};
```

---

## Part 4: Apple Sign-In Setup

### 4.1 Firebase Console

1. Go to [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com)
2. Enable **Apple** as a sign-in provider
3. For **native iOS only**, you can leave the OAuth code flow fields empty
4. For **Android/web support**, you need:
   - **Services ID**: Create at [Apple Developer → Identifiers → Services IDs](https://developer.apple.com/account/resources/identifiers/list/serviceId)
   - **Key ID + Private Key**: Create at [Apple Developer → Keys](https://developer.apple.com/account/resources/authkeys/list) with "Sign in with Apple" enabled
   - **Team ID**: Your Apple Developer Team ID
5. Save

### 4.2 Xcode Capability

1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Search for **"Sign in with Apple"** and add it

This creates the entitlements file automatically.

### 4.3 Auth Code (Apple)

```typescript
const signInWithApple = async () => {
  if (isCapacitor) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const nativeResult = await FirebaseAuthentication.signInWithApple();

    const idToken = nativeResult.credential?.idToken;
    const rawNonce = nativeResult.credential?.nonce;
    if (!idToken) throw new Error("No ID token received from Apple Sign-In");

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({ idToken, rawNonce });
    const result = await signInWithCredential(auth, credential);

    // Handle new user setup if needed
    if (result.user.metadata.creationTime === result.user.metadata.lastSignInTime) {
      await initializeNewUser(result.user.uid, result.user.email || "", result.user.displayName);
    }
  } else {
    const result = await signInWithPopup(auth, appleProvider);
    // ...
  }
};
```

### 4.4 Hide Apple Button on Android

Apple Sign-In is not available on Android without extra setup. Conditionally hide it:

```typescript
const [isAndroid, setIsAndroid] = useState(false);

useEffect(() => {
  const cap = (window as any).Capacitor;
  setIsAndroid(cap?.getPlatform?.() === "android");
}, []);

// In JSX:
{!isAndroid && <Button onClick={handleAppleSignIn}>Continue with Apple</Button>}
```

---

## Part 5: Build & Deploy

### Standard workflow

```bash
npm run build
npx cap sync ios
# In Xcode: select iPhone → Cmd + R
```

### Clean build (when SPM issues occur)

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/App-*

# Re-resolve packages
cd ios/App
xcodebuild -resolvePackageDependencies -scheme App -project App.xcodeproj

# Build
xcodebuild -scheme App -project App.xcodeproj -destination 'generic/platform=iOS' -allowProvisioningUpdates build
```

### First-time device install

1. Connect iPhone via USB, trust the computer
2. In Xcode, select your iPhone from the device dropdown
3. Press **Cmd + R**
4. If you get `application-identifier mismatch`: delete the existing app from iPhone, reinstall
5. First install may require trusting the certificate: **Settings → General → VPN & Device Management → Trust**

---

## Part 6: Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `signInWithCredential` hangs forever | Wrong auth persistence in WebView | Use `initializeAuth` with `indexedDBLocalPersistence` |
| Google Sign-In dialog doesn't appear | `RGCFA_INCLUDE_GOOGLE` flag missing | Verify patch is applied, clean build |
| `RuntimeError` in Xcode console at launch | Plugin init logging | Usually harmless, check if sign-in works |
| Duplicate GUID error | GoogleSignIn added both manually and via patch | Remove manual package from Xcode |
| "Duplicate credentials" on Apple Sign-In | Calling `signInWithCredential` with `skipNativeAuth: false` | Use `skipNativeAuth: true` |
| Sign-in works but no routing | Auth state not in web SDK | Use `skipNativeAuth: true` so web SDK has auth state |
| OAuth settings not taking effect | Google Cloud propagation delay | Wait 5 min to a few hours |
| `application-identifier mismatch` | Different signing team from previous install | Delete app from iPhone, reinstall |
| Trust certificate prompt | First install from new dev account | Settings → General → VPN & Device Management → Trust |
| Apple Sign-In missing app icon | Development build has no App Store icon | Normal — icon appears after App Store upload |
| Missing `CapApp-SPM` package product | Capacitor version mismatch between packages | Ensure all `@capacitor/*` packages are same major version |
| Keychain password prompts (4-5 times) | SPM fetching packages from GitHub | Enter Mac password, click "Always Allow" |

---

## Part 7: Key Architecture Decisions

### Native SDK vs Web SDK

Capacitor runs a WKWebView. Firebase has two separate SDKs:
- **Native iOS SDK**: Used by `@capacitor-firebase/authentication` plugin
- **Web/JS SDK**: Used by your app code (`firebase/auth`)

These are **independent** — signing into one does NOT sign into the other. This is why `skipNativeAuth: true` is essential: it lets the native plugin handle only the OAuth flow while your JS code manages Firebase auth state through the web SDK.

### Auth Persistence

The web Firebase SDK defaults to `browserLocalPersistence` (localStorage). In WKWebView, this causes promises to hang. `indexedDBLocalPersistence` works reliably in both browser and WKWebView environments.

### Token Reusability

- **Google tokens**: Can be used multiple times with `signInWithCredential`
- **Apple nonce tokens**: Single-use only — calling `signInWithCredential` twice with the same token causes "duplicate credentials" error

---

## References

- [firebase-js-sdk#5497 - signInWithCredential does not resolve in iOS](https://github.com/firebase/firebase-js-sdk/issues/5497)
- [capacitor-firebase-authentication#104 - unable to signInWithCredential on iOS](https://github.com/robingenz/capacitor-firebase-authentication/issues/104)
- [Plugin docs: Google Sign-In setup](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-google.md)
- [Plugin docs: Third-party SDKs (SPM)](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/third-party-sdks.md)
- [Plugin docs: Apple Sign-In setup](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-apple.md)
