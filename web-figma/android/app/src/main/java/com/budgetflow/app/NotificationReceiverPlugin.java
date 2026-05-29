package com.budgetflow.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "NotificationReceiver")
public class NotificationReceiverPlugin extends Plugin {

    @PluginMethod
    public void checkNotificationAccess(PluginCall call) {
        Context context = getContext();
        String enabledListeners = Settings.Secure.getString(
                context.getContentResolver(),
                "enabled_notification_listeners"
        );
        boolean isEnabled = false;
        if (enabledListeners != null) {
            ComponentName componentName = new ComponentName(context, NotificationListener.class);
            isEnabled = enabledListeners.contains(componentName.flattenToString());
        }
        
        JSObject ret = new JSObject();
        ret.put("enabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getPendingNotifications(PluginCall call) {
        synchronized (NotificationListener.class) {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE);
            String pendingStr = prefs.getString("pending_notifications", "[]");
            
            try {
                JSONArray array = new JSONArray(pendingStr);
                JSArray jsArray = new JSArray();
                for (int i = 0; i < array.length(); i++) {
                    JSONObject obj = array.getJSONObject(i);
                    JSObject jsObj = new JSObject();
                    jsObj.put("packageName", obj.getString("packageName"));
                    jsObj.put("title", obj.getString("title"));
                    jsObj.put("text", obj.getString("text"));
                    jsObj.put("timestamp", obj.getLong("timestamp"));
                    jsArray.put(jsObj);
                }
                
                // Clear queue
                prefs.edit().putString("pending_notifications", "[]").commit();
                
                JSObject ret = new JSObject();
                ret.put("notifications", jsArray);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to retrieve pending notifications", e);
            }
        }
    }
}
