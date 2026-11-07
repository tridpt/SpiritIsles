$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath "$projectRoot\package.json" -Raw | ConvertFrom-Json).version
$zipPath = "$projectRoot\dist\source-$version.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$expected = @()
foreach ($folder in @('web', 'tests', 'scripts', 'android/app/src', 'android/gradle/wrapper')) {
    $expected += Get-ChildItem -LiteralPath (Join-Path $projectRoot $folder) -File -Recurse
}
foreach ($file in @('README.md', 'package.json', 'package-lock.json', 'playwright.config.mjs', '.gitignore', 'android/settings.gradle.kts', 'android/build.gradle.kts', 'android/gradle.properties', 'android/app/build.gradle.kts')) {
    $expected += Get-Item -LiteralPath (Join-Path $projectRoot $file)
}
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$algorithm = [System.Security.Cryptography.SHA256]::Create()
try {
    if ($archive.Entries.Count -ne $expected.Count) { throw 'Source archive file count differs.' }
    foreach ($file in $expected) {
        $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
        $entry = $archive.GetEntry($relative)
        if (-not $entry) { throw "Missing source entry: $relative" }
        $stream = $entry.Open()
        try { $entryHash = [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '') }
        finally { $stream.Dispose() }
        if ($entryHash -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw "Source entry differs: $relative" }
    }
} finally { $algorithm.Dispose(); $archive.Dispose() }
$report = @{
    version = $version; allSourceFilesMatch = $true; filesVerified = $expected.Count
    bytes = (Get-Item -LiteralPath $zipPath).Length
    sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
}
$report | ConvertTo-Json | Set-Content -LiteralPath "$projectRoot\dist\SOURCE-CHECK-$version.json" -Encoding utf8
Write-Output "$($expected.Count) source files verified byte for byte."
