-keepattributes *Annotation*

# JavaScript can call only these explicitly annotated members. Keep their names.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.franceisl.nurpismo.BillingBridge { *; }
-keep class com.franceisl.nurpismo.AuthBridge { *; }

# BillingClient ships consumer rules; this explicit rule protects callback models
# from over-aggressive future R8 changes in this small wrapper application.
-keep class com.android.billingclient.api.** { *; }
-dontwarn org.conscrypt.**
