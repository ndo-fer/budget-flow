package com.budgetflow.app;

import android.appwidget.AppWidgetManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;

public class WidgetActionReceiver extends BroadcastReceiver {
    private static final String TAG = "BF_WidgetAction";

    public static final String ACTION_ADD_ACCUMULATION = "com.budgetflow.app.ACTION_ADD_ACCUMULATION";
    public static final String ACTION_RESET_ACCUMULATION = "com.budgetflow.app.ACTION_RESET_ACCUMULATION";
    public static final String ACTION_COMMIT_ACCUMULATION = "com.budgetflow.app.ACTION_COMMIT_ACCUMULATION";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (action == null) return;

        Log.d(TAG, "onReceive broadcast action: " + action);

        SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
        long accumulatedTotal = prefs.getLong("accumulated_total", 0);

        if (ACTION_ADD_ACCUMULATION.equals(action)) {
            double amount = intent.getDoubleExtra("amount", 0);
            if (amount > 0) {
                accumulatedTotal += (long) amount;
                prefs.edit().putLong("accumulated_total", accumulatedTotal).apply();
                Log.d(TAG, "Added amount: " + amount + ", accumulated total: " + accumulatedTotal);
            }
        } else if (ACTION_RESET_ACCUMULATION.equals(action)) {
            accumulatedTotal = 0;
            prefs.edit().putLong("accumulated_total", 0).apply();
            Log.d(TAG, "Reset accumulated total to 0");
        } else if (ACTION_COMMIT_ACCUMULATION.equals(action)) {
            if (accumulatedTotal > 0) {
                Log.d(TAG, "Commiting accumulated amount: " + accumulatedTotal);
                
                // 1. Save to offline sync queue in SharedPreferences
                savePendingTransaction(context, (double) accumulatedTotal);

                // 2. Read raw values and subtract the accumulated total
                long saldoRaw = prefs.getLong("saldo_raw", 0);
                long limitRaw = prefs.getLong("limit_harian_raw", 0);

                long newSaldo = Math.max(0, saldoRaw - accumulatedTotal);
                long newLimit = Math.max(0, limitRaw - accumulatedTotal);

                // Save new values and clear accumulator
                SharedPreferences.Editor editor = prefs.edit();
                editor.putLong("saldo_raw", newSaldo);
                editor.putLong("limit_harian_raw", newLimit);
                editor.putString("saldo", formatRupiah(newSaldo));
                editor.putString("limitHarian", formatRupiah(newLimit));
                editor.putLong("accumulated_total", 0);
                editor.apply();
                
                accumulatedTotal = 0;
            }
        }

        // Trigger Widget Provider to refresh RemoteViews
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuickActionsWidgetProvider.class));
        for (int id : ids) {
            QuickActionsWidgetProvider.updateAppWidget(context, manager, id);
        }
    }

    private void savePendingTransaction(Context context, double amount) {
        SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
        String pendingStr = prefs.getString("pending_transactions", "[]");
        try {
            JSONArray array = new JSONArray(pendingStr);
            JSONObject obj = new JSONObject();
            obj.put("amount", amount);
            obj.put("timestamp", System.currentTimeMillis());
            array.put(obj);
            prefs.edit().putString("pending_transactions", array.toString()).apply();
            Log.d(TAG, "Saved pending widget transaction of: " + amount + ". Total queue: " + array.length());
        } catch (Exception e) {
            Log.e(TAG, "Failed to save pending transaction", e);
        }
    }

    private String formatRupiah(long amount) {
        DecimalFormat symbols = new DecimalFormat("###,###");
        DecimalFormatSymbols dfs = new DecimalFormatSymbols();
        dfs.setGroupingSeparator('.');
        symbols.setDecimalFormatSymbols(dfs);
        return "Rp " + symbols.format(amount);
    }
}
