package com.nowaste.ai;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetUpdate")
public class WidgetUpdatePlugin extends Plugin {
    @PluginMethod
    public void notifyUpdate(PluginCall call) {
        Intent intent = new Intent(ExpiringItemsWidgetProvider.ACTION_WIDGET_UPDATE);
        intent.setPackage(getContext().getPackageName());
        getContext().sendBroadcast(intent);
        call.resolve();
    }
}
