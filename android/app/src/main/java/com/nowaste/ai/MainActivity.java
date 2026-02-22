package com.nowaste.ai;

import android.os.Bundle;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetUpdatePlugin.class);
        super.onCreate(savedInstanceState);

        // Let the WebView handle safe area insets via CSS env()
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
