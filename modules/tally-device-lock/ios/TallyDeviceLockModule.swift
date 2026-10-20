import ExpoModulesCore
import UIKit
import LocalAuthentication

public class TallyDeviceLockModule: Module {
  private let guardLock = NSLock()
  private var screenOff = false
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("TallyDeviceLock")
    Events("onScreenOff")
    OnCreate {
      // Public iOS lock signal for passcode-protected devices. No private APIs.
      self.observer = NotificationCenter.default.addObserver(
        forName: UIApplication.protectedDataWillBecomeUnavailableNotification,
        object: nil, queue: nil
      ) { [weak self] _ in
        guard let self else { return }
        self.guardLock.lock()
        self.screenOff = true
        self.guardLock.unlock()
        self.sendEvent("onScreenOff")
      }
    }
    OnDestroy {
      if let observer = self.observer { NotificationCenter.default.removeObserver(observer) }
      self.observer = nil
    }
    Function("takeSnapshot") { () -> [String: Bool] in
      var error: NSError?
      let passcodeEnabled = LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
      self.guardLock.lock()
      let occurred = self.screenOff
      self.screenOff = false
      self.guardLock.unlock()
      // Without an OS passcode the lock notification is not reliable: fail closed.
      return ["supported": passcodeEnabled && self.observer != nil, "screenOff": occurred]
    }
  }
}
