package expo.modules.tallysmsreader

import android.content.Context
import android.util.AtomicFile
import org.json.JSONArray
import java.io.File

internal object TallySmsQueue {
  private fun file(context: Context) = AtomicFile(File(context.noBackupFilesDir, "tally_sms_queue.enc"))

  fun read(context: Context): JSONArray {
    val file = file(context)
    if (!file.baseFile.exists()) return JSONArray()
    return try { JSONArray(file.openRead().bufferedReader(Charsets.UTF_8).use { it.readText() }) }
    catch (_: Exception) { JSONArray() }
  }

  fun write(context: Context, queue: JSONArray) {
    val file = file(context)
    var stream: java.io.FileOutputStream? = null
    try {
      stream = file.startWrite()
      stream.write(queue.toString().toByteArray(Charsets.UTF_8))
      file.finishWrite(stream)
    } catch (error: Exception) {
      if (stream != null) file.failWrite(stream)
      throw error
    }
  }

  fun clear(context: Context) {
    write(context, JSONArray())
    context.getSharedPreferences(TallySmsReceiver.PREFS, Context.MODE_PRIVATE).edit().putInt("dropped", 0).apply()
  }
}
