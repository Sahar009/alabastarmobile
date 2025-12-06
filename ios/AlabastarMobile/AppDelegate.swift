import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase only if GoogleService-Info.plist exists and is valid
    // Note: FirebaseApp.configure() throws NSException which Swift can't catch,
    // but we check file existence first to minimize crash risk
    if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
       FileManager.default.fileExists(atPath: path),
       let plist = NSDictionary(contentsOfFile: path),
       let projectId = plist["PROJECT_ID"] as? String,
       !projectId.isEmpty {
      // File exists and has valid PROJECT_ID - configure Firebase
      // If this throws NSException, the app will crash, but this should only happen
      // if the file is malformed or Firebase SDK has issues
      FirebaseApp.configure()
      print("[AppDelegate] ✅ Firebase configured successfully")
    } else {
      print("[AppDelegate] ⚠️ GoogleService-Info.plist not found or invalid - Firebase disabled")
      print("[AppDelegate] Push notifications and other Firebase features will not work")
    }
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "AlabastarMobile",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
