$ErrorActionPreference = "Stop"
$contentPath = "D:\OSPanel\domains\GameTach\docs\diplom_full_content.txt"
$outPath = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH_FULL.docx"
$shots = "D:\OSPanel\domains\GameTach\docs\screenshots"

function Add-Image($sel, $fileName) {
    $path = Join-Path $shots $fileName
    if (-not (Test-Path $path)) {
        $sel.TypeText("[missing: $fileName]")
        $sel.TypeParagraph()
        return
    }
    $pic = $sel.InlineShapes.AddPicture($path, $false, $true)
    if ($pic.Width -gt 440) {
        $r = $pic.Height / $pic.Width
        $pic.Width = 440
        $pic.Height = [int](440 * $r)
    }
    $sel.ParagraphFormat.Alignment = 1
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sel = $word.Selection
$sel.ParagraphFormat.Alignment = 0

$lines = Get-Content -LiteralPath $contentPath -Encoding UTF8
foreach ($raw in $lines) {
    $line = $raw.TrimEnd()
    if ($line.Length -eq 0) { continue }
    if ($line -eq "---PAGE---") { $sel.InsertBreak(7); continue }
    if ($line.StartsWith("#") -and -not $line.StartsWith("[#")) { continue }

    if ($line -match '^\[CAP\]\s*(.*)$') {
        $sel.Style = -1
        $sel.Font.Italic = $true
        $sel.ParagraphFormat.Alignment = 1
        $sel.TypeText($matches[1].Trim())
        $sel.TypeParagraph()
        $sel.Font.Italic = $false
        $sel.ParagraphFormat.Alignment = 0
        continue
    }

    if ($line -match '^\[IMG\]\s*(.+)$') {
        Add-Image $sel $matches[1].Trim()
        continue
    }

    if ($line -match '^\[CODE\]\s*(.+)$') {
        $rel = $matches[1].Trim()
        $codePath = if ($rel -match '^[A-Za-z]:\\') { $rel } else { Join-Path "D:\OSPanel\domains\GameTach\docs\listings" $rel }
        if (-not (Test-Path $codePath)) { $codePath = Join-Path "D:\OSPanel\domains\GameTach" $rel.Replace('/', '\') }
        if (Test-Path $codePath) {
            $sel.Style = -1
            $sel.Font.Name = "Consolas"
            $sel.Font.Size = 9
            foreach ($cl in (Get-Content -LiteralPath $codePath -Encoding UTF8)) {
                $sel.TypeText($cl)
                $sel.TypeParagraph()
            }
            $sel.Font.Name = "Times New Roman"
            $sel.Font.Size = 11
        } else {
            $sel.TypeText("[file not found: $rel]")
            $sel.TypeParagraph()
        }
        continue
    }

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

if (Test-Path $outPath) {
    try { Remove-Item $outPath -Force -ErrorAction Stop }
    catch {
        $outPath = $outPath -replace '\.docx$', '_new.docx'
        Write-Host "Output locked, saving as: $outPath"
    }
}
$doc.SaveAs2([ref]$outPath)
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Built: $outPath"
