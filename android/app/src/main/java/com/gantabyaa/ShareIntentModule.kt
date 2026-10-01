package com.gantabyaa

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class ShareIntentModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), ActivityEventListener {

  init {
    context.addActivityEventListener(this)
  }

  override fun getName(): String = "ShareIntent"

  @ReactMethod
  fun getInitialShare(promise: Promise) {
    val intent = context.currentActivity?.intent
    val sharedFile = toShareMap(intent)
    if (sharedFile != null) clearShareIntent(intent)
    promise.resolve(sharedFile)
  }

  override fun onNewIntent(intent: Intent) {
    val sharedFile = toShareMap(intent) ?: return
    clearShareIntent(intent)
    context.currentActivity?.setIntent(intent)
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("shareIntentReceived", sharedFile)
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) = Unit

  private fun clearShareIntent(intent: Intent?) {
    intent?.removeExtra(Intent.EXTRA_STREAM)
    intent?.removeExtra(Intent.EXTRA_TEXT)
    intent?.type = null
    intent?.action = Intent.ACTION_MAIN
  }

  private fun toShareMap(intent: Intent?): WritableMap? {
    if (intent?.action != Intent.ACTION_SEND && intent?.action != Intent.ACTION_SEND_MULTIPLE) return null

    val uri = getSharedUri(intent) ?: return null

    val result = Arguments.createMap()
    result.putString("uri", uri.toString())
    result.putString("type", intent.type ?: context.contentResolver.getType(uri) ?: "application/octet-stream")
    result.putString("name", getDisplayName(uri))
    return result
  }

  @Suppress("DEPRECATION")
  private fun getSharedUri(intent: Intent): Uri? {
    val streamUri = when (intent.action) {
      Intent.ACTION_SEND -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
      } else {
        intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
      }
      Intent.ACTION_SEND_MULTIPLE -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)?.firstOrNull()
      } else {
        intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.firstOrNull()
      }
      else -> null
    }
    return streamUri ?: intent.clipData?.takeIf { it.itemCount > 0 }?.getItemAt(0)?.uri
  }

  private fun getDisplayName(uri: Uri): String {
    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
      if (cursor.moveToFirst()) {
        val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        if (index >= 0) cursor.getString(index)?.takeIf { it.isNotBlank() }?.let { return it }
      }
    }
    return uri.lastPathSegment?.substringAfterLast('/')?.takeIf { it.isNotBlank() } ?: "shared_file"
  }
}
