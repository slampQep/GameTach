$ErrorActionPreference = "Stop"
$docx = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH.docx"
$md = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH.md"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docx)
$sel = $word.Selection
$sel.EndKey(6) # wdStory
$sel.InsertBreak(7)
$sel.Style = -2
$sel.TypeText((Get-Content (Join-Path $PSScriptRoot "append_title.txt") -Encoding UTF8 -Raw).Trim())
$sel.TypeParagraph()

$lines = Get-Content -LiteralPath $md -Encoding UTF8
foreach ($line in $lines) {
    if ($line -match '^---\s*$') { continue }
    if ($line -match '^#+\s+(.+)$') {
        $sel.Style = -3
        $sel.TypeText($matches[1].Trim())
        $sel.TypeParagraph()
        continue
    }
    if ($line -match '^\|\s') { continue }
    if ($line -match '^\s*[-*]\s+(.+)$') {
        $sel.Style = -1
        $sel.Range.ListFormat.ApplyBulletDefault()
        $sel.TypeText($matches[1].Trim())
        $sel.TypeParagraph()
        $sel.Range.ListFormat.RemoveNumbers()
        continue
    }
    if ($line.Trim().Length -eq 0) { continue }
    $sel.Style = -1
    $sel.TypeText($line.Trim())
    $sel.TypeParagraph()
}

$doc.Save()
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Appended MD to $docx"
