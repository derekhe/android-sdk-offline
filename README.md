Android SDK offline download links generator
--------------------------------------------
This tool help to you generate offline down links for Android SDK. This is helpful when you don't have internet access or speed is low.

You can use your favorite download tool to download them. Then put these downloaded files into sdk/temp folder and open Android SDK Manager. Click the items in Android SDK Manager, it will read from your downloaded cache.

# Online site
http://www.april1985.com/android-sdk-offline/


# Clone and run locally

```
git clone https://github.com/derekhe/android-sdk-offline.git
npm install
npm install -g http-server
//You may need to set proxy if your network is blocked
npm run generate
npm run serve
```

open your browser and navigate to localhost:8080
