const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withTallySmsReader(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest["uses-permission"] ||= [];
    const permission = "android.permission.RECEIVE_SMS";
    if (!manifest["uses-permission"].some((entry) => entry.$["android:name"] === permission)) {
      manifest["uses-permission"].push({ $: { "android:name": permission } });
    }
    const app = manifest.application?.[0];
    if (!app) throw new Error("TallySpends SMS receiver needs an Android application manifest.");
    app.receiver ||= [];
    const receiverName = "expo.modules.tallysmsreader.TallySmsReceiver";
    if (!app.receiver.some((entry) => entry.$["android:name"] === receiverName)) {
      app.receiver.push({
        $: {
          "android:name": receiverName,
          "android:enabled": "true",
          "android:exported": "true",
          "android:permission": "android.permission.BROADCAST_SMS",
        },
        "intent-filter": [{ $: { "android:priority": "500" }, action: [{ $: { "android:name": "android.provider.Telephony.SMS_RECEIVED" } }] }],
      });
    }
    return mod;
  });
};
