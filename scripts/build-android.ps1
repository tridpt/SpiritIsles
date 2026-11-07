param([string]$JavaHome = $env:JAVA_HOME, [string]$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk")
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $JavaHome) {
    $localJdk = Get-ChildItem -LiteralPath 'D:\Temp\temurin17' -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($localJdk) { $JavaHome = $localJdk.FullName }
}
if (-not (Test-Path -LiteralPath "$JavaHome\bin\java.exe")) { throw 'Set JAVA_HOME to a JDK 17 installation.' }
if (-not (Test-Path -LiteralPath "$SdkRoot\platforms\android-35\android.jar")) { throw 'Android SDK Platform 35 is required.' }
$env:JAVA_HOME = $JavaHome
$sdkPath = $SdkRoot.Replace('\','/')
Set-Content -LiteralPath "$projectRoot\android\local.properties" -Value "sdk.dir=$sdkPath" -Encoding ascii
Push-Location "$projectRoot\android"
try {
    & "$JavaHome\bin\java.exe" '-Dorg.gradle.appname=gradlew' '-classpath' 'gradle/wrapper/gradle-wrapper.jar' 'org.gradle.wrapper.GradleWrapperMain' '--no-daemon' 'lintDebug' 'assembleDebug'
    if ($LASTEXITCODE -ne 0) { throw "Android build failed ($LASTEXITCODE)." }
    New-Item -ItemType Directory -Path "$projectRoot\dist" -Force | Out-Null
    $gameVersion = (Get-Content -LiteralPath "$projectRoot\package.json" -Raw | ConvertFrom-Json).version
    $apkPath = Join-Path "$projectRoot\dist" "DaoLinhThu-$gameVersion.apk"
    Copy-Item -LiteralPath "$projectRoot\android\app\build\outputs\apk\debug\app-debug.apk" -Destination $apkPath
    Write-Output "APK: $apkPath"
} finally { Pop-Location }
