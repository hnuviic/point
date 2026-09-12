Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src = Get-ChildItem -Path $root -File -Filter '*.png' | Where-Object { $_.Length -gt 100000 } | Select-Object -First 1
if (-not $src) { throw 'Logo png not found' }
Write-Host "Source: $($src.Name) ($($src.Length) bytes)"

$logo = [System.Drawing.Bitmap]::FromFile($src.FullName)
$w = $logo.Width
$h = $logo.Height

# Read raw pixels for a fast alpha bounding-box scan of the emblem (left part of the logo)
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$data = $logo.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$logo.UnlockBits($data)

$scanMaxX = [int]($w * 0.36)
$minX = $w; $maxX = 0; $minY = $h; $maxY = 0
for ($y = 0; $y -lt $h; $y++) {
    $row = $y * $stride
    for ($x = 0; $x -lt $scanMaxX; $x++) {
        if ($bytes[$row + $x * 4 + 3] -gt 16) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Host "Emblem box: x=$minX y=$minY w=$cropW h=$cropH"

$crop = New-Object System.Drawing.Rectangle $minX, $minY, $cropW, $cropH

function New-Icon([int]$size, [System.Drawing.Color]$bg, [double]$pad) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($bg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $box = $size * (1 - 2 * $pad)
    $scale = [Math]::Min($box / $cropW, $box / $cropH)
    $dw = $cropW * $scale
    $dh = $cropH * $scale
    $dst = New-Object System.Drawing.RectangleF (($size - $dw) / 2), (($size - $dh) / 2), $dw, $dh
    $g.DrawImage($logo, $dst, $crop, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    return $bmp
}

$transparent = [System.Drawing.Color]::Transparent
$white = [System.Drawing.Color]::White

$outputs = @(
    @{ File = 'favicon-16.png';       Size = 16;  Bg = $transparent; Pad = 0.02 },
    @{ File = 'favicon-32.png';       Size = 32;  Bg = $transparent; Pad = 0.03 },
    @{ File = 'favicon-48.png';       Size = 48;  Bg = $transparent; Pad = 0.04 },
    @{ File = 'favicon-192.png';      Size = 192; Bg = $transparent; Pad = 0.06 },
    @{ File = 'favicon-512.png';      Size = 512; Bg = $transparent; Pad = 0.06 },
    @{ File = 'apple-touch-icon.png'; Size = 180; Bg = $white;       Pad = 0.10 }
)

foreach ($o in $outputs) {
    $bmp = New-Icon $o.Size $o.Bg $o.Pad
    $path = Join-Path $root $o.File
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Wrote $($o.File)"
}

# Build a multi-size favicon.ico with PNG-encoded entries (16/32/48)
$icoSizes = @(16, 32, 48)
$pngs = @()
foreach ($s in $icoSizes) {
    $bmp = New-Icon $s $transparent 0.03
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngs += , $ms.ToArray()
    $ms.Dispose()
}

$out = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $out
$bw.Write([uint16]0)
$bw.Write([uint16]1)
$bw.Write([uint16]$icoSizes.Count)
$offset = 6 + 16 * $icoSizes.Count
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $bw.Write([byte]$icoSizes[$i])
    $bw.Write([byte]$icoSizes[$i])
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$pngs[$i].Length)
    $bw.Write([uint32]$offset)
    $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $root 'favicon.ico'), $out.ToArray())
$bw.Dispose()
Write-Host 'Wrote favicon.ico'

$logo.Dispose()
