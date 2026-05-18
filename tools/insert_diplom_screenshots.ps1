$ErrorActionPreference = "Stop"
$docx = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH_FULL.docx"
$out = "D:\OSPanel\domains\GameTach\docs\DIPLOM_GAMETECH_FULL.docx"
$shots = "D:\OSPanel\domains\GameTach\docs\screenshots"
$captionsFile = "D:\OSPanel\domains\GameTach\tools\screenshot_captions.txt"

$capLines = Get-Content -LiteralPath $captionsFile -Encoding UTF8
$title = $capLines[0]
$intro = $capLines[1]

$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    if (Test-Path $docx) {
        $doc = $word.Documents.Open($docx, $false, $false)
    } else {
        $doc = $word.Documents.Add()
    }

    $sel = $word.Selection
    $sel.EndKey(6)
    $sel.InsertBreak(7)

    $sel.Style = -2
    $sel.TypeText($title)
    $sel.TypeParagraph()
    $sel.Style = -1
    $sel.TypeText($intro)
    $sel.TypeParagraph()
    $sel.TypeParagraph()

    $files = Get-ChildItem -Path $shots -Filter "*.png" | Sort-Object Name
    $idx = 0
    foreach ($f in $files) {
        $idx++
        $cap = $capLines | Where-Object { $_ -match "^$idx`t" } | ForEach-Object { ($_ -split "`t", 2)[1] }
        if (-not $cap) { continue }

        $sel.TypeText($cap)
        $sel.TypeParagraph()
        $pic = $sel.InlineShapes.AddPicture($f.FullName, $false, $true)
        if ($pic.Width -gt 440) {
            $r = $pic.Height / $pic.Width
            $pic.Width = 440
            $pic.Height = [int](440 * $r)
        }
        $sel.TypeParagraph()
        if ($idx -lt $files.Count) {
            $sel.InsertBreak(7)
        }
    }

    if (Test-Path $out) { Remove-Item $out -Force }
    $doc.SaveAs2([ref]$out)
    Write-Host "OK: $idx screenshots"
}
finally {
    if ($doc) { $doc.Close($false) }
    if ($word) { $word.Quit() }
    if ($word) { [void][System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) }
}
