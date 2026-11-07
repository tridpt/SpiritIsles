package vn.spiritisles.game;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedDispatcher;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** All game code and artwork are bundled. The virtual HTTPS origin never uses a server. */
public final class MainActivity extends Activity {
    private static final String HOST = "spirit.isles";
    private static final int EXPORT = 41, IMPORT = 42;
    private static final int MAX_SAVE_BYTES = 2 * 1024 * 1024;
    private WebView web;
    private String pendingExport;
    private ValueCallback<Uri[]> fileCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(247,247,241));
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((v,insets)->{
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                return insets;
            });
        } else root.setFitsSystemWindows(true);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(247,247,241));
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new Bridge(),"AndroidApp");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) || !"GET".equals(request.getMethod())) return blocked();
                String path = uri.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                if (path.contains("..") || path.contains("\\") || path.contains("//")) return blocked();
                String mime = path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":path.endsWith(".ttf")?"font/ttf":path.endsWith(".woff2")?"font/woff2":path.endsWith(".webmanifest")?"application/manifest+json":"text/html";
                try {
                    InputStream stream = getAssets().open("www"+path);
                    WebResourceResponse response = new WebResourceResponse(mime,"UTF-8",stream);
                    Map<String,String> headers = new HashMap<>();
                    headers.put("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; frame-src 'none'");
                    headers.put("X-Content-Type-Options","nosniff");
                    response.setResponseHeaders(headers);
                    return response;
                } catch (Exception e) { return blocked(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost());
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                try {
                    Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("application/json");
                    startActivityForResult(intent,IMPORT);
                    return true;
                } catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;return false;}
            }
        });
        if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleBack);
        web.loadUrl("https://"+HOST+"/index.html");
    }
    private WebResourceResponse blocked(){
        WebResourceResponse response=new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream("Unavailable".getBytes(StandardCharsets.UTF_8)));
        response.setStatusCodeAndReasonPhrase(404,"Not Found");return response;
    }
    private boolean validEnvelope(String raw){
        if(raw==null||raw.getBytes(StandardCharsets.UTF_8).length>MAX_SAVE_BYTES)return false;
        try {JSONObject json=new JSONObject(raw);return "SpiritIsles".equals(json.optString("app"))&&json.optInt("version")==1&&json.optJSONObject("state")!=null;}catch(Exception e){return false;}
    }
    private final class Bridge {
        @JavascriptInterface public boolean storeSave(String raw){return validEnvelope(raw)&&getSharedPreferences("island",MODE_PRIVATE).edit().putString("save",raw).commit();}
        @JavascriptInterface public String readSave(){return getSharedPreferences("island",MODE_PRIVATE).getString("save","");}
        @JavascriptInterface public void saveBackup(String raw){
            if(!validEnvelope(raw))return;
            runOnUiThread(()->{
                if(pendingExport!=null)return;pendingExport=raw;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE,"dao-linh-thu-"+new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(new Date())+".json");
                try{startActivityForResult(intent,EXPORT);}catch(Exception e){pendingExport=null;Toast.makeText(MainActivity.this,"Không mở được nơi lưu tệp.",Toast.LENGTH_SHORT).show();}
            });
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==IMPORT){if(fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);fileCallback=null;}return;}
        if(request==EXPORT){String raw=pendingExport;pendingExport=null;if(result!=RESULT_OK||data==null||raw==null)return;try(OutputStream stream=getContentResolver().openOutputStream(data.getData())){if(stream==null)throw new Exception();stream.write(raw.getBytes(StandardCharsets.UTF_8));Toast.makeText(this,"Đã giữ lại hòn đảo trong bản lưu.",Toast.LENGTH_SHORT).show();}catch(Exception e){Toast.makeText(this,"Không thể xuất bản lưu.",Toast.LENGTH_SHORT).show();}}
    }
    @Override public void onBackPressed(){handleBack();}
    private void handleBack(){web.evaluateJavascript("window.spiritBack ? window.spiritBack() : false",handled->{if(!"true".equals(handled))finish();});}
    @Override protected void onPause(){if(web!=null){web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))",null);web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null){web.onResume();web.evaluateJavascript("window.dispatchEvent(new Event('spirit-resume'))",null);}}
    @Override protected void onDestroy(){if(web!=null){web.removeJavascriptInterface("AndroidApp");web.destroy();}super.onDestroy();}
}
