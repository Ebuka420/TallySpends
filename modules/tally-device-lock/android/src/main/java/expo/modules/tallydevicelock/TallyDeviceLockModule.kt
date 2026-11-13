package expo.modules.tallydevicelock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TallyDeviceLockModule : Module() {
  private val guard = Any()
  private var screenOff = false
  private var context: Context? = null
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == Intent.ACTION_SCREEN_OFF) {
        synchronized(guard) { screenOff = true }
        sendEvent("onScreenOff", emptyMap<String, Any>())
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("TallyDeviceLock")
    Events("onScreenOff")
    OnCreate {
      val app = appContext.reactContext?.applicationContext
      if (app != null) {
        try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            app.registerReceiver(receiver, IntentFilter(Intent.ACTION_SCREEN_OFF), Context.RECEIVER_NOT_EXPORTED)
          } else {
            @Suppress("DEPRECATION")
            app.registerReceiver(receiver, IntentFilter(Intent.ACTION_SCREEN_OFF))
          }
          synchronized(guard) { context = app }
        } catch (_: Exception) { /* The JS layer uses immediate locking if unsupported. */ }
      }
    }
    OnDestroy {
      synchronized(guard) {
        try { context?.unregisterReceiver(receiver) } catch (_: Exception) { }
        context = null
      }
    }
    Function("takeSnapshot") {
      synchronized(guard) {
        val result = mapOf("supported" to (context != null), "screenOff" to screenOff)
        screenOff = false
        result
      }
    }
  }
}
