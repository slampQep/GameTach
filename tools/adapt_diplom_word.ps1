$ErrorActionPreference = "Stop"
$src = "C:\Users\ovsee\Downloads\diplom.docx"
$dst = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH.docx"
$map = Join-Path $PSScriptRoot "diplom_replace_map.txt"

if (-not (Test-Path $src)) { throw "Source not found: $src" }
if (-not (Test-Path $map)) { throw "Map not found: $map" }

Copy-Item -LiteralPath $src -Destination $dst -Force

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($dst)

$lines = Get-Content -LiteralPath $map -Encoding UTF8
$n = 0
foreach ($line in $lines) {
    $line = $line.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#")) { continue }
    $tab = $line.IndexOf("`t")
    if ($tab -lt 1) { continue }
    $find = $line.Substring(0, $tab)
    $repl = $line.Substring($tab + 1)
    $null = $doc.Content.Find.Execute($find, $false, $false, $false, $false, $false, $true, 1, $false, $repl, 2)
    $n++
}

$doc.Save()
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Replacements: $n -> $dst"
