param([string]$PreviousVersion = '1.27.0')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath "$projectRoot\package.json" -Raw | ConvertFrom-Json).version
$gradle = Get-Content -LiteralPath "$projectRoot\android\app\build.gradle.kts" -Raw
$versionCode = [int]([regex]::Match($gradle, 'versionCode\s*=\s*(\d+)').Groups[1].Value)
$apkPath = "$projectRoot\dist\DaoLinhThu-$version.apk"
$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = (Get-ChildItem -LiteralPath 'D:\Temp\temurin17' -Directory | Select-Object -First 1).FullName
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
function ByteHash([byte[]]$bytes) {
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($algorithm.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant() }
    finally { $algorithm.Dispose() }
}
$archive = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
$webRoot = (Resolve-Path -LiteralPath "$projectRoot\web").Path
$checked = @()
try {
    foreach ($sourceFile in Get-ChildItem -LiteralPath $webRoot -File -Recurse) {
        $relative = $sourceFile.FullName.Substring($webRoot.Length + 1).Replace('\', '/')
        $entry = $archive.GetEntry("assets/www/$relative")
        if (-not $entry) { throw "Missing packaged asset: $relative" }
        $stream = $entry.Open(); $memory = New-Object System.IO.MemoryStream
        try { $stream.CopyTo($memory); $packaged = $memory.ToArray() }
        finally { $stream.Dispose(); $memory.Dispose() }
        $hash = ByteHash ([System.IO.File]::ReadAllBytes($sourceFile.FullName))
        if ($hash -ne (ByteHash $packaged)) { throw "Packaged bytes differ: $relative" }
        $checked += @{ path = $relative; sha256 = $hash }
    }
    if (@($archive.Entries | Where-Object { $_.FullName.StartsWith('assets/www/') -and $_.Length -gt 0 }).Count -ne $checked.Count) { throw 'Unexpected packaged web assets.' }
} finally { $archive.Dispose() }
$signer = Join-Path $sdkRoot 'build-tools\35.0.0\apksigner.bat'
$signature = & $signer verify --verbose --print-certs $apkPath
if ($LASTEXITCODE -ne 0 -or -not ($signature -match 'Verified using v2 scheme.*true')) { throw 'APK signature verification failed.' }
$priorSignature = & $signer verify --print-certs "$projectRoot\dist\DaoLinhThu-$PreviousVersion.apk"
if ($LASTEXITCODE -ne 0) { throw 'Previous APK signature verification failed.' }
$certificate = ($signature | Select-String 'certificate SHA-256 digest:').ToString().Split(':')[-1].Trim()
$priorCertificate = ($priorSignature | Select-String 'certificate SHA-256 digest:').ToString().Split(':')[-1].Trim()
if ($certificate -ne $priorCertificate) { throw 'Signing certificate changed.' }
$badging = & (Join-Path $sdkRoot 'build-tools\35.0.0\aapt.exe') dump badging $apkPath
if ($LASTEXITCODE -ne 0 -or -not ($badging -match "versionCode='$versionCode' versionName='$version'")) { throw 'Wrong packaged version.' }
[xml]$lint = Get-Content -LiteralPath "$projectRoot\android\app\build\reports\lint-results-debug.xml"
$report = @{
    version = $version; versionCode = $versionCode; apk = [System.IO.Path]::GetFileName($apkPath)
    sha256 = (Get-FileHash -LiteralPath $apkPath -Algorithm SHA256).Hash.ToLowerInvariant()
    webAssetCount = $checked.Count; allWebAssetsMatchSource = $true; assets = $checked
    signatureV2 = $true; certificateSha256 = $certificate; signingKeyMatchesPrevious = $true; previousVersion = $PreviousVersion
    lintErrors = @($lint.issues.issue | Where-Object severity -eq 'Error').Count
    lintWarnings = @($lint.issues.issue | Where-Object severity -eq 'Warning').Count
}
if ($report.lintErrors -ne 0) { throw 'Android lint errors.' }
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath "$projectRoot\dist\BUNDLE-CHECK-$version.json" -Encoding utf8
Write-Output "$($checked.Count) assets verified, signing certificate unchanged, lint $($report.lintErrors) errors / $($report.lintWarnings) warnings."
