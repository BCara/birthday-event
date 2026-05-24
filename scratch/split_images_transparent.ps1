# scratch/split_images_transparent.ps1
# Script to auto-detect illustration bounding boxes, crop them, remove background checkerboards via flood fill, and save them.

Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\clbbe\.gemini\antigravity\brain\87c6ee15-46db-4179-a5b4-aaaab989be0b\media__1779450193457.jpg"
$destDir = "c:\Users\clbbe\Documents\Projects\BirthdayEvent\public\images\themes"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$img = [System.Drawing.Bitmap]::FromFile($srcPath)

# Define column boundaries (evenly spaced)
$colWidths = @(205, 205, 204, 205, 205)
$colOffsets = @(0, 205, 410, 614, 819)

# Estimated scan regions to find illustrations (avoiding header labels)
$scanYStart = @(38, 200, 360, 520)
$scanYEnd   = @(200, 360, 520, 680)

$themes = @("dino", "unicorn", "princess", "cars", "classic")
$colors = @(
    @("pink", "green", "blue", "orange"),      # Dino colors
    @("pink", "purple", "teal", "yellow"),     # Unicorn colors
    @("pink", "teal", "yellow", "purple"),     # Princess colors
    @("red", "blue", "yellow", "grey"),        # Cars colors
    @("red", "blue", "green", "purple")        # Classic colors
)

# Helper to check if pixel is background (checkerboard)
function Is-Background($color) {
    return ($color.R -ge 235 -and $color.G -ge 235 -and $color.B -ge 235 -and 
            [Math]::Abs($color.R - $color.G) -le 8 -and 
            [Math]::Abs($color.G - $color.B) -le 8 -and
            $color.A -gt 0)
}

# 1. Clear old theme files first to ensure a clean slate
Get-ChildItem $destDir -Filter "*.png" | Remove-Item -Force

# 2. Process all 20 cells
for ($col = 0; $col -lt 5; $col++) {
    $themeName = $themes[$col]
    $xMinBound = $colOffsets[$col]
    $xMaxBound = $xMinBound + $colWidths[$col] - 1
    
    for ($row = 0; $row -lt 4; $row++) {
        $colorName = $colors[$col][$row]
        $yMinBound = $scanYStart[$row]
        $yMaxBound = $scanYEnd[$row]
        
        # Scan region for drawing bounding box
        $xmin = $xMaxBound
        $xmax = $xMinBound
        $ymin = $yMaxBound
        $ymax = $yMinBound
        
        $foundDrawing = $false
        for ($y = $yMinBound; $y -le $yMaxBound; $y++) {
            for ($x = $xMinBound; $x -le $xMaxBound; $x++) {
                $p = $img.GetPixel($x, $y)
                if (-not (Is-Background $p)) {
                    $foundDrawing = $true
                    if ($x -lt $xmin) { $xmin = $x }
                    if ($x -gt $xmax) { $xmax = $x }
                    if ($y -lt $ymin) { $ymin = $y }
                    if ($y -gt $ymax) { $ymax = $y }
                }
            }
        }
        
        # Add padding (default 8 pixels)
        $padding = 8
        if ($foundDrawing) {
            $cropX = [Math]::Max($xMinBound, ($xmin - $padding))
            $cropY = [Math]::Max($yMinBound, ($ymin - $padding))
            $cropW = [Math]::Min(($xMaxBound - $cropX + 1), ($xmax - $cropX + $padding + 1))
            $cropH = [Math]::Min(($yMaxBound - $cropY + 1), ($ymax - $cropY + $padding + 1))
        } else {
            # Fallback if no non-neutral pixels found
            $cropX = $xMinBound
            $cropY = $yMinBound
            $cropW = $colWidths[$col]
            $cropH = $yMaxBound - $yMinBound + 1
        }
        
        # Create cropped transparent bitmap
        $cropped = New-Object System.Drawing.Bitmap($cropW, $cropH)
        $g = [System.Drawing.Graphics]::FromImage($cropped)
        $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH), $cropX, $cropY, $cropW, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        
        # Flood fill to set background checkerboard to transparent
        $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]
        $visited = New-Object 'Boolean[,]' $cropW, $cropH
        
        # Enqueue top and bottom borders
        for ($x = 0; $x -lt $cropW; $x++) {
            $p = $cropped.GetPixel($x, 0)
            if (Is-Background $p) {
                $queue.Enqueue((New-Object System.Drawing.Point $x, 0))
                $visited[$x, 0] = $true
            }
            $bottomY = $cropH - 1
            $p = $cropped.GetPixel($x, $bottomY)
            if (Is-Background $p) {
                $queue.Enqueue((New-Object System.Drawing.Point $x, $bottomY))
                $visited[$x, $bottomY] = $true
            }
        }
        # Enqueue left and right borders
        for ($y = 0; $y -lt $cropH; $y++) {
            $p = $cropped.GetPixel(0, $y)
            if (Is-Background $p) {
                $queue.Enqueue((New-Object System.Drawing.Point 0, $y))
                $visited[0, $y] = $true
            }
            $rightX = $cropW - 1
            $p = $cropped.GetPixel($rightX, $y)
            if (Is-Background $p) {
                $queue.Enqueue((New-Object System.Drawing.Point $rightX, $y))
                $visited[$rightX, $y] = $true
            }
        }
        
        $transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
        
        # Run BFS
        while ($queue.Count -gt 0) {
            $pt = $queue.Dequeue()
            $cropped.SetPixel($pt.X, $pt.Y, $transparent)
            
            $neighbors = @(
                (New-Object System.Drawing.Point ($pt.X - 1), $pt.Y),
                (New-Object System.Drawing.Point ($pt.X + 1), $pt.Y),
                (New-Object System.Drawing.Point $pt.X, ($pt.Y - 1)),
                (New-Object System.Drawing.Point $pt.X, ($pt.Y + 1))
            )
            
            foreach ($n in $neighbors) {
                if ($n.X -ge 0 -and $n.X -lt $cropW -and $n.Y -ge 0 -and $n.Y -lt $cropH) {
                    if (-not $visited[$n.X, $n.Y]) {
                        $visited[$n.X, $n.Y] = $true
                        $color = $cropped.GetPixel($n.X, $n.Y)
                        if (Is-Background $color) {
                            $queue.Enqueue($n)
                        }
                    }
                }
            }
        }
        
        # Save as PNG to support alpha channel transparency
        $outPath = Join-Path $destDir "${themeName}_${colorName}.png"
        $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        
        Write-Output "Processed: ${themeName}_${colorName} -> Box:($cropX, $cropY, $cropW, $cropH)"
    }
}

$img.Dispose()
Write-Output "All 20 themes processed with transparent backgrounds!"
