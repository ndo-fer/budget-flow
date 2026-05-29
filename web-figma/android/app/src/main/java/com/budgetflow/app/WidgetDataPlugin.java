package com.budgetflow.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String saldo = call.getString("saldo", "Rp -");
        String limitHarian = call.getString("limitHarian", "Rp -");
        double saldoRaw = call.getDouble("saldoRaw", 0.0);
        double limitHarianRaw = call.getDouble("limitHarianRaw", 0.0);
        long saldoRawLong = (long) saldoRaw;
        long limitHarianRawLong = (long) limitHarianRaw;

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("saldo", saldo);
        editor.putString("limitHarian", limitHarian);
        editor.putLong("saldo_raw", saldoRawLong);
        editor.putLong("limit_harian_raw", limitHarianRawLong);
        editor.apply();

        // Broadcast to trigger Widget Provider update
        Intent intent = new Intent(context, QuickActionsWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuickActionsWidgetProvider.class));
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        context.sendBroadcast(intent);

        call.resolve();
    }

    @PluginMethod
    public void getPendingWidgetTransactions(PluginCall call) {
        synchronized (WidgetActionReceiver.class) {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
            String pendingStr = prefs.getString("pending_transactions", "[]");
            
            try {
                JSONArray array = new JSONArray(pendingStr);
                JSArray jsArray = new JSArray();
                for (int i = 0; i < array.length(); i++) {
                    try {
                        JSONObject obj = array.getJSONObject(i);
                        JSObject jsObj = new JSObject();
                        
                        double amt = 0.0;
                        if (obj.has("amount")) {
                            amt = obj.optDouble("amount", 0.0);
                            if (amt == 0.0) {
                                amt = obj.optInt("amount", 0);
                            }
                        }
                        
                        jsObj.put("amount", amt);
                        jsObj.put("timestamp", obj.optLong("timestamp", System.currentTimeMillis()));
                        jsArray.put(jsObj);
                    } catch (Exception innerEx) {
                        // Skip malformed item
                    }
                }
                
                JSObject ret = new JSObject();
                ret.put("transactions", jsArray);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to retrieve pending widget transactions", e);
            }
        }
    }

    @PluginMethod
    public void clearPendingWidgetTransactions(PluginCall call) {
        synchronized (WidgetActionReceiver.class) {
            JSArray resolved = call.getArray("resolvedTimestamps");
            if (resolved == null || resolved.length() == 0) {
                call.resolve();
                return;
            }

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
            String pendingStr = prefs.getString("pending_transactions", "[]");

            try {
                JSONArray array = new JSONArray(pendingStr);
                JSONArray updatedArray = new JSONArray();

                HashSet<Long> resolvedSet = new HashSet<>();
                for (int i = 0; i < resolved.length(); i++) {
                    resolvedSet.add(resolved.getLong(i));
                }

                for (int i = 0; i < array.length(); i++) {
                    JSONObject obj = array.getJSONObject(i);
                    long timestamp = obj.getLong("timestamp");
                    if (!resolvedSet.contains(timestamp)) {
                        updatedArray.put(obj);
                    }
                }

                prefs.edit().putString("pending_transactions", updatedArray.toString()).commit();
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to clear resolved pending transactions", e);
            }
        }
    }
}
