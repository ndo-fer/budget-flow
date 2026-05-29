package com.budgetflow.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

public class QuickActionsWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.quick_actions_widget);

        // Read values from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
        String saldo = prefs.getString("saldo", "Rp -");
        String limitHarian = prefs.getString("limitHarian", "Rp -");
        long accumulatedTotal = prefs.getLong("accumulated_total", 0);

        // Update RemoteViews Text
        views.setTextViewText(R.id.txt_saldo, saldo);
        views.setTextViewText(R.id.txt_limit_harian, limitHarian);
        
        // Format and set accumulated total display
        views.setTextViewText(R.id.txt_accumulated_total, "Rp " + formatNumber(accumulatedTotal));

        // Define pending intent flags helper for android 12+ (mutability requirement)
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // --- Custom Button Click (Open custom transaction composer deep-link) ---
        Intent addExpenseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("budgetflow://action/add-expense"));
        addExpenseIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent addExpensePendingIntent = PendingIntent.getActivity(
                context,
                1001,
                addExpenseIntent,
                pendingIntentFlags
        );
        views.setOnClickPendingIntent(R.id.btn_add_expense, addExpensePendingIntent);

        // --- Banknote Clicks (ACTION_ADD_ACCUMULATION) ---
        views.setOnClickPendingIntent(R.id.btn_quick_1k, getAccumulatePendingIntent(context, 1001, 1000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_2k, getAccumulatePendingIntent(context, 1002, 2000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_5k, getAccumulatePendingIntent(context, 1005, 5000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_10k, getAccumulatePendingIntent(context, 1010, 10000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_20k, getAccumulatePendingIntent(context, 1020, 20000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_50k, getAccumulatePendingIntent(context, 1050, 50000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_100k, getAccumulatePendingIntent(context, 1100, 100000.0, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_quick_200k, getAccumulatePendingIntent(context, 1200, 200000.0, pendingIntentFlags));

        // --- Control Clicks (Reset & OK) ---
        views.setOnClickPendingIntent(R.id.btn_reset, getControlPendingIntent(context, 2001, WidgetActionReceiver.ACTION_RESET_ACCUMULATION, pendingIntentFlags));
        views.setOnClickPendingIntent(R.id.btn_simpan, getControlPendingIntent(context, 2002, WidgetActionReceiver.ACTION_COMMIT_ACCUMULATION, pendingIntentFlags));

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent getAccumulatePendingIntent(Context context, int requestCode, double amount, int flags) {
        Intent intent = new Intent(context, WidgetActionReceiver.class);
        intent.setAction(WidgetActionReceiver.ACTION_ADD_ACCUMULATION);
        intent.putExtra("amount", amount);
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }

    private static PendingIntent getControlPendingIntent(Context context, int requestCode, String action, int flags) {
        Intent intent = new Intent(context, WidgetActionReceiver.class);
        intent.setAction(action);
        return PendingIntent.getBroadcast(context, requestCode, intent, flags);
    }

    private static String formatNumber(long number) {
        java.text.DecimalFormat symbols = new java.text.DecimalFormat("###,###");
        java.text.DecimalFormatSymbols dfs = new java.text.DecimalFormatSymbols();
        dfs.setGroupingSeparator('.');
        symbols.setDecimalFormatSymbols(dfs);
        return symbols.format(number);
    }
}
