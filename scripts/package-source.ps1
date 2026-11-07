$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath "$projectRoot\package.json" -Raw | ConvertFrom-Json).version
$destination = "$projectRoot\dist\source-$version.zip"
if (Test-Path -LiteralPath $destination) { throw "Source archive already exists: $destination" }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($destination, [System.IO.Compression.ZipArchiveMode]::Create)
$files = @()
foreach ($folder in @('web', 'tests', 'scripts', 'android/app/src', 'android/gradle/wrapper')) {
    $files += Get-ChildItem -LiteralPath (Join-Path $projectRoot $folder) -File -Recurse
}
foreach ($file in @('README.md', 'package.json', 'package-lock.json', 'playwright.config.mjs', '.gitignore', 'android/settings.gradle.kts', 'android/build.gradle.kts', 'android/gradle.properties', 'android/app/build.gradle.kts')) {
    $files += Get-Item -LiteralPath (Join-Path $projectRoot $file)
}
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal)
    }
} finally { $archive.Dispose() }
Write-Output "$($files.Count) source files: $destination"
