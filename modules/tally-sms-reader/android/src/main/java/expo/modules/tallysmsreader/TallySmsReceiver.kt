package expo.modules.tallysmsreader

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

class TallySmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean("enabled", false) || !prefs.getBoolean("consent", false)) return
    val allowed = runCatching { JSONArray(prefs.getString("senders", "[]")).let { array ->
      (0 until array.length()).map { array.getString(it).trim().lowercase() }.toSet()
    } }.getOrDefault(emptySet())
    if (allowed.isEmpty()) return
    val parts = runCatching { Telephony.Sms.Intents.getMessagesFromIntent(intent)?.toList().orEmpty() }.getOrDefault(emptyList())
    if (parts.isEmpty()) return
    val queue = TallySmsQueue.read(context)
    val now = System.currentTimeMillis()
    var added = 0
    val sender = parts.first().originatingAddress.orEmpty().trim()
    val body = parts.joinToString("") { it.messageBody.orEmpty() }
    if (sender.lowercase() !in allowed || !eligible(body)) return
    if (queue.length() >= MAX_QUEUED) {
      prefs.edit().putInt("dropped", prefs.getInt("dropped", 0) + 1).apply()
      return
    }
    val receivedAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date(parts.first().timestampMillis))
    val item = JSONObject().put("id", UUID.randomUUID().toString())
      .put("sender", sender).put("body", body).put("receivedAt", receivedAt)
      .put("queuedAt", now)
    val encrypted = runCatching { TallySmsCrypto.encrypt(item.toString()) }.getOrNull()
    if (encrypted == null) prefs.edit().putInt("dropped", prefs.getInt("dropped", 0) + 1).apply()
    else { queue.put(encrypted); added++ }
    if (added > 0 && runCatching { TallySmsQueue.write(context, queue) }.isFailure) {
      prefs.edit().putInt("dropped", prefs.getInt("dropped", 0) + added).apply()
    }
  }

  private fun eligible(body: String): Boolean {
    if (body.isBlank() || body.length > 5000) return false
    if (Regex("\\b(otp|one[ -]?time|verification|verify|password|passcode|pin|authentication|security code)\\b", RegexOption.IGNORE_CASE).containsMatchIn(body)) return false
    val money = Regex("(?:\\b(?:NGN|Naira)\\s*|\\u20A6\\s*)[\\d,]+(?:\\.\\d{1,2})?", RegexOption.IGNORE_CASE)
    val direction = Regex("\\b(debit(?:ed)?|credit(?:ed)?)\\b", RegexOption.IGNORE_CASE)
    return money.containsMatchIn(body) && direction.containsMatchIn(body)
  }

  companion object {
    const val PREFS = "tally_sms_reader_v1"
    const val MAX_QUEUED = 200
  }
}
