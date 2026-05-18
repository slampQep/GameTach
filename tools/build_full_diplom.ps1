# Build Word from docs/diplom_full_content.txt (UTF-8)
# Lines: [H1] [H2] [H3] [P] [B] text
$ErrorActionPreference = "Stop"
$contentPath = "D:\OSPanel\domains\GameTach\docs\diplom_full_content.txt"
$outPath = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH_FULL.docx"

if (-not (Test-Path $contentPath)) { throw "Missing: $contentPath" }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$sel = $word.Selection
$sel.ParagraphFormat.Alignment = 0

$lines = Get-Content -LiteralPath $contentPath -Encoding UTF8
foreach ($raw in $lines) {
    $line = $raw.TrimEnd()
    if ($line.Length -eq 0) { continue }
    if ($line -eq "---PAGE---") { $sel.InsertBreak(7); continue }
    if ($line.StartsWith("#") -and -not $line.StartsWith("[#")) { continue }

    $tag = "P"
    $text = $line
    if ($line -match '^\[(H1|H2|H3|P|B)\]\s*(.*)$') {
        $tag = $matches[1]
        $text = $matches[2]
    }
    if ([string]::IsNullOrWhiteSpace($text)) { continue }

    switch ($tag) {
        "H1" { $sel.Style = -2; $sel.TypeText($text); $sel.TypeParagraph() }
        "H2" { $sel.Style = -3; $sel.TypeText($text); $sel.TypeParagraph() }
        "H3" { $sel.Style = -4; $sel.TypeText($text); $sel.TypeParagraph() }
        "B" {
            $sel.Style = -1
            $sel.Range.ListFormat.ApplyBulletDefault()
            $sel.TypeText($text)
            $sel.TypeParagraph()
            $sel.Range.ListFormat.RemoveNumbers()
        }
        default { $sel.Style = -1; $sel.TypeText($text); $sel.TypeParagraph() }
    }
}

if (Test-Path $outPath) { Remove-Item $outPath -Force }
$doc.SaveAs2($outPath)
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "OK: $outPath"
