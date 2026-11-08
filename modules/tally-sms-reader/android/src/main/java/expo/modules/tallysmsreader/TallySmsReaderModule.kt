package expo.modules.tallysmsreader

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class TallySmsReaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TallySmsReader")

    AsyncFunction("configure") { enabled: Boolean, consentAccepted: Boolean, senders: List<String> ->
      val context = requireNotNull(appContext.reactContext)
      val normalized = senders.map { it.trim() }.filter { it.isNotEmpty() }.distinctBy { it.lowercase() }.take(30)
      val prefs = context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE)
      prefs.edit().putBoolean("enabled", enabled && consentAccepted && normalized.isNotEmpty())
        .putBoolean("consent", consentAccepted).putString("senders", JSONArray(normalized).toString()).apply()
      if (!consentAccepted || !enabled) TallySmsQueue.clear(context)
    }

    AsyncFunction("readPending") {
      val context = requireNotNull(appContext.reactContext)
      val prefs = context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE)
      if (!prefs.getBoolean("enabled", false) || !prefs.getBoolean("consent", false)) emptyList<Map<String, String>>() else {
        val queue = TallySmsQueue.read(context)
        val now = System.currentTimeMillis()
        val output = mutableListOf<Map<String, String>>()
        val retained = JSONArray()
        var expired = 0
        for (index in 0 until queue.length()) {
          val encrypted = queue.getString(index)
          val decrypted = runCatching { JSONObject(TallySmsCrypto.decrypt(encrypted)) }.getOrNull() ?: continue
          if (now - decrypted.optLong("queuedAt", now) > MAX_AGE_MS) { expired++; continue }
          retained.put(encrypted)
          output.add(mapOf("id" to decrypted.optString("id"), "sender" to decrypted.optString("sender"),
            "body" to decrypted.optString("body"), "receivedAt" to decrypted.optString("receivedAt")))
        }
        if (expired > 0) {
          TallySmsQueue.write(context, retained)
          prefs.edit().putInt("dropped", prefs.getInt("dropped", 0) + expired).apply()
        }
        output
      }
    }

    AsyncFunction("acknowledge") { ids: List<String> ->
      val context = requireNotNull(appContext.reactContext)
      val prefs = context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE)
      val ack = ids.toSet()
      val current = TallySmsQueue.read(context)
      val next = JSONArray()
      val now = System.currentTimeMillis()
      for (index in 0 until current.length()) {
        val encrypted = current.optString(index)
        val decoded = runCatching { JSONObject(TallySmsCrypto.decrypt(encrypted)) }.getOrNull() ?: continue
        if (decoded.optString("id") !in ack && now - decoded.optLong("queuedAt", now) <= MAX_AGE_MS) next.put(encrypted)
      }
      TallySmsQueue.write(context, next)
    }

    AsyncFunction("clearPending") {
      TallySmsQueue.clear(requireNotNull(appContext.reactContext))
    }

    AsyncFunction("pendingCount") {
      val context = requireNotNull(appContext.reactContext)
      val prefs = context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE)
      if (!prefs.getBoolean("enabled", false) || !prefs.getBoolean("consent", false)) 0
      else TallySmsQueue.read(context).length()
    }

    AsyncFunction("queueStatus") {
      val context = requireNotNull(appContext.reactContext)
      val prefs = context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE)
      mapOf("pending" to TallySmsQueue.read(context).length(), "notQueued" to prefs.getInt("dropped", 0))
    }
  }

  companion object { private const val MAX_AGE_MS = 7L * 24 * 60 * 60 * 1000 }
}
