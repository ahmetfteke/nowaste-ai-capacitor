package com.nowaste.ai;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class ExpiringItemsWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_UPDATE = "com.nowaste.ai.WIDGET_UPDATE";

    // App color palette
    private static final int COLOR_RED = Color.parseColor("#C85A17");
    private static final int COLOR_AMBER = Color.parseColor("#D4A440");
    private static final int COLOR_GREEN = Color.parseColor("#2D8A78");
    private static final int COLOR_RED_TEXT = Color.parseColor("#C85A17");
    private static final int COLOR_AMBER_TEXT = Color.parseColor("#B8860B");
    private static final int COLOR_GREEN_TEXT = Color.parseColor("#2D8A78");

    // Row view IDs
    private static final int[] ROW_IDS = {
        R.id.item_row_1, R.id.item_row_2, R.id.item_row_3, R.id.item_row_4, R.id.item_row_5
    };
    private static final int[] DOT_IDS = {
        R.id.item_dot_1, R.id.item_dot_2, R.id.item_dot_3, R.id.item_dot_4, R.id.item_dot_5
    };
    private static final int[] NAME_IDS = {
        R.id.item_name_1, R.id.item_name_2, R.id.item_name_3, R.id.item_name_4, R.id.item_name_5
    };
    private static final int[] DAYS_IDS = {
        R.id.item_days_1, R.id.item_days_2, R.id.item_days_3, R.id.item_days_4, R.id.item_days_5
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_WIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName widgetComponent = new ComponentName(context, ExpiringItemsWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent);
            onUpdate(context, appWidgetManager, appWidgetIds);
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_expiring_items);

        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String expiringItemsJson = prefs.getString("expiringItems", "[]");

        try {
            JSONArray items = new JSONArray(expiringItemsJson);
            int itemCount = items.length();

            // Set count badge
            views.setTextViewText(R.id.widget_count, String.valueOf(itemCount));

            // Hide all rows first
            for (int rowId : ROW_IDS) {
                views.setViewVisibility(rowId, View.GONE);
            }

            if (itemCount > 0) {
                views.setViewVisibility(R.id.widget_empty, View.GONE);

                for (int i = 0; i < Math.min(itemCount, 5); i++) {
                    JSONObject item = items.getJSONObject(i);
                    String name = item.getString("name");
                    int days = calculateDaysUntilExpiry(item.optString("expirationDate", ""));
                    if (days < 0) continue;

                    // Show the row
                    views.setViewVisibility(ROW_IDS[i], View.VISIBLE);

                    // Set name
                    views.setTextViewText(NAME_IDS[i], name);

                    // Set days badge text
                    String daysText;
                    if (days == 0) {
                        daysText = "Today";
                    } else if (days == 1) {
                        daysText = "1 day";
                    } else {
                        daysText = days + "d";
                    }
                    views.setTextViewText(DAYS_IDS[i], daysText);

                    // Set urgency colors
                    int dotColor;
                    int badgeBg;
                    int badgeTextColor;

                    if (days <= 1) {
                        dotColor = COLOR_RED;
                        badgeBg = R.drawable.widget_badge_red;
                        badgeTextColor = COLOR_RED_TEXT;
                    } else if (days <= 3) {
                        dotColor = COLOR_AMBER;
                        badgeBg = R.drawable.widget_badge_amber;
                        badgeTextColor = COLOR_AMBER_TEXT;
                    } else {
                        dotColor = COLOR_GREEN;
                        badgeBg = R.drawable.widget_badge_bg;
                        badgeTextColor = COLOR_GREEN_TEXT;
                    }

                    views.setTextColor(DOT_IDS[i], dotColor);
                    views.setTextColor(DAYS_IDS[i], badgeTextColor);
                    views.setInt(DAYS_IDS[i], "setBackgroundResource", badgeBg);
                }
            } else {
                views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            }
        } catch (Exception e) {
            views.setTextViewText(R.id.widget_count, "0");
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            for (int rowId : ROW_IDS) {
                views.setViewVisibility(rowId, View.GONE);
            }
        }

        // Tap widget body → open inventory
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        // Tap + button → open app (same intent, separate click target)
        Intent addIntent = new Intent(context, MainActivity.class);
        addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        addIntent.putExtra("navigate", "/capture");
        PendingIntent addPendingIntent = PendingIntent.getActivity(
                context, 1, addIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_add_button, addPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private int calculateDaysUntilExpiry(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return -1;
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            Date expiry = sdf.parse(dateStr);
            if (expiry == null) return -1;

            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);

            Calendar expiryDay = Calendar.getInstance();
            expiryDay.setTime(expiry);
            expiryDay.set(Calendar.HOUR_OF_DAY, 0);
            expiryDay.set(Calendar.MINUTE, 0);
            expiryDay.set(Calendar.SECOND, 0);
            expiryDay.set(Calendar.MILLISECOND, 0);

            long diffMs = expiryDay.getTimeInMillis() - today.getTimeInMillis();
            return (int) TimeUnit.MILLISECONDS.toDays(diffMs);
        } catch (Exception e) {
            return -1;
        }
    }
}
