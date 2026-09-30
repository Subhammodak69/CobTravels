package com.cobtravels

import android.app.Activity
import android.content.Intent
import android.net.Uri
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
    promise.resolve(toShareMap(context.currentActivity?.intent))
  }

  override fun onNewIntent(intent: Intent) {
    val sharedFile = toShareMap(intent) ?: return
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("shareIntentReceived", sharedFile)
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) = Unit

  private fun toShareMap(intent: Intent?): WritableMap? {
    if (intent?.action != Intent.ACTION_SEND && intent?.action != Intent.ACTION_SEND_MULTIPLE) return null

    @Suppress("DEPRECATION")
    val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
      ?: intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.firstOrNull()
      ?: return null

    val result = Arguments.createMap()
    result.putString("uri", uri.toString())
    result.putString("type", intent.type ?: context.contentResolver.getType(uri) ?: "application/octet-stream")
    result.putString("name", getDisplayName(uri))
    return result
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
