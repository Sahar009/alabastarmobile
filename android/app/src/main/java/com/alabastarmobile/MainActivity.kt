package com.alabastarmobile

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AlabastarMobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   * Explicitly set to false to match gradle.properties newArchEnabled=false
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    // Explicitly disable Fabric/New Architecture to match gradle.properties
    val useFabric = false
    return DefaultReactActivityDelegate(this, mainComponentName, useFabric)
  }
}
