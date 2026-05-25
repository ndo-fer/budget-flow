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

        // Update RemoteViews Text
        views.setTextViewText(R.id.txt_saldo, saldo);
        views.setTextViewText(R.id.txt_limit_harian, limitHarian);

        // Define pending intent flags helper for android 12+ (mutability requirement)
        int pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Intent for Button 1: Add Expense
        Intent addExpenseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("budgetflow://action/add-expense"));
        addExpenseIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent addExpensePendingIntent = PendingIntent.getActivity(
                context,
                0,
                addExpenseIntent,
                pendingIntentFlags
        );
        views.setOnClickPendingIntent(R.id.btn_add_expense, addExpensePendingIntent);

        // Intent for Button 2: Ledger
        Intent ledgerIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("budgetflow://action/ledger"));
        ledgerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent ledgerPendingIntent = PendingIntent.getActivity(
                context,
                1,
                ledgerIntent,
                pendingIntentFlags
        );
        views.setOnClickPendingIntent(R.id.btn_ledger, ledgerPendingIntent);

        // Intent for Button 3: Wallets
        Intent walletsIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("budgetflow://action/wallets"));
        walletsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent walletsPendingIntent = PendingIntent.getActivity(
                context,
                2,
                walletsIntent,
                pendingIntentFlags
        );
        views.setOnClickPendingIntent(R.id.btn_wallets, walletsPendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
