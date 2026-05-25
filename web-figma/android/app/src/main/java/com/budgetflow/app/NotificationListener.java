package com.budgetflow.app;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class NotificationListener extends NotificationListenerService {

    private static final String TAG = "BF_NotifListener";
    
    // Allowed packages
    private static final Set<String> ALLOWED_PACKAGES = new HashSet<>(Arrays.asList(
        "com.gojek.app",
        "com.gopay.app", // Standalone GoPay
        "com.gojek.merchant", // GoPay Merchant (GoBiz)
        "com.gopay.merchant", // GoPay Merchant Standalone
        "com.grab.merchant", // GrabMerchant
        "com.shopee.partner", // Shopee Partner
        "ovo.id", // OVO
        "com.shopee.id",
        "id.dana",
        "com.telkom.tcash", // LinkAja
        "com.btpn.jenius",
        "id.co.bankjago.android",
        "com.seamoney.android", // SeaBank
        "com.bca", // myBCA
        "com.bri.brimo",
        "id.co.mandiri.mobile", // Livin Classic
        "id.co.mandiri.livin", // Livin New
        "com.bni.mobilebanking",
        "com.google.android.gm", // Gmail
        "com.microsoft.office.outlook",
        "com.samsung.android.email.provider"
    ));

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "NotificationListener service created!");
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        Log.d(TAG, "NotificationListener connected to Android notification system!");
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String packageName = sbn.getPackageName();
            Log.d(TAG, "onNotificationPosted package: " + packageName);
            
            if (!ALLOWED_PACKAGES.contains(packageName)) {
                return;
            }

            Notification notification = sbn.getNotification();
            if (notification == null || notification.extras == null) {
                return;
            }

            CharSequence titleChar = notification.extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textChar = notification.extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigTextChar = notification.extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

            String title = titleChar != null ? titleChar.toString().trim() : "";
            String text = textChar != null ? textChar.toString().trim() : "";
            if (bigTextChar != null) {
                String bigText = bigTextChar.toString().trim();
                if (!bigText.isEmpty() && !bigText.equals(text) && !text.contains(bigText)) {
                    text += "\n" + bigText;
                }
            }

            if (text.isEmpty()) {
                return;
            }

            Log.d(TAG, "Notification received from " + packageName + ": " + title + " - " + text);

            // Save notification to SharedPreferences queue
            savePendingNotification(packageName, title, text, sbn.getPostTime());
        } catch (Exception e) {
            Log.e(TAG, "Error parsing notification", e);
        }
    }

    private void savePendingNotification(String packageName, String title, String text, long timestamp) {
        SharedPreferences prefs = getSharedPreferences("notification_prefs", Context.MODE_PRIVATE);
        String pendingStr = prefs.getString("pending_notifications", "[]");
        try {
            JSONArray array = new JSONArray(pendingStr);
            JSONObject obj = new JSONObject();
            obj.put("packageName", packageName);
            obj.put("title", title);
            obj.put("text", text);
            obj.put("timestamp", timestamp);
            array.put(obj);

            prefs.edit().putString("pending_notifications", array.toString()).apply();
            Log.d(TAG, "Notification saved to queue. Queue size: " + array.length());
        } catch (Exception e) {
            Log.e(TAG, "Failed to save notification to queue", e);
        }
    }
}
