package com.budgetflow.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String saldo = call.getString("saldo", "Rp -");
        String limitHarian = call.getString("limitHarian", "Rp -");

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("widget_prefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("saldo", saldo);
        editor.putString("limitHarian", limitHarian);
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
}
