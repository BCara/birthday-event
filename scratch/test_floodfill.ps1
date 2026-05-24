# scratch/test_floodfill.ps1
# Test script for flood-fill background removal on a single cell.

Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\clbbe\.gemini\antigravity\brain\87c6ee15-46db-4179-a5b4-aaaab989be0b\media__1779450193457.jpg"
$destPath = "c:\Users\clbbe\Documents\Projects\BirthdayEvent\public\images\themes\dino_pink_test.png"

$img = [System.Drawing.Bitmap]::FromFile($srcPath)

# Pink Dino bounds
$xStart = 0
$width = 205
$yStart = 40
$height = 158

# Create cropped bitmap
$cropped = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $width, $height), $xStart, $yStart, $width, $height, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

# Helper to check if pixel is background
function Is-Background($color) {
    return ($color.R -ge 235 -and $color.G -ge 235 -and $color.B -ge 235 -and 
            [Math]::Abs($color.R - $color.G) -le 8 -and 
            [Math]::Abs($color.G - $color.B) -le 8 -and
            $color.A -gt 0)
}

# Flood fill queue
$queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]
$visited = New-Object 'Boolean[,]' $width, $height

# Push all border pixels to queue
for ($x = 0; $x -lt $width; $x++) {
    # Top border
    $p = $cropped.GetPixel($x, 0)
    if (Is-Background $p) {
        $queue.Enqueue((New-Object System.Drawing.Point $x, 0))
        $visited[$x, 0] = $true
    }
    # Bottom border
    $p = $cropped.GetPixel($x, ($height - 1))
    if (Is-Background $p) {
        $queue.Enqueue((New-Object System.Drawing.Point $x, ($height - 1)))
        $visited[$x, $height - 1] = $true
    }
}
for ($y = 0; $y -lt $height; $y++) {
    # Left border
    $p = $cropped.GetPixel(0, $y)
    if (Is-Background $p) {
        $queue.Enqueue((New-Object System.Drawing.Point 0, $y))
        $visited[0, $y] = $true
    }
    # Right border
    $p = $cropped.GetPixel(($width - 1), $y)
    if (Is-Background $p) {
        $queue.Enqueue((New-Object System.Drawing.Point ($width - 1), $y))
        $visited[$width - 1, $y] = $true
    }
}

$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

# Process queue
$count = 0
while ($queue.Count -gt 0) {
    $pt = $queue.Dequeue()
    $cropped.SetPixel($pt.X, $pt.Y, $transparent)
    $count++

    # Check 4 neighbors
    $neighbors = @(
        (New-Object System.Drawing.Point ($pt.X - 1), $pt.Y),
        (New-Object System.Drawing.Point ($pt.X + 1), $pt.Y),
        (New-Object System.Drawing.Point $pt.X, ($pt.Y - 1)),
        (New-Object System.Drawing.Point $pt.X, ($pt.Y + 1))
    )

    foreach ($n in $neighbors) {
        if ($n.X -ge 0 -and $n.X -lt $width -and $n.Y -ge 0 -and $n.Y -lt $height) {
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

$cropped.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
$img.Dispose()

Write-Output "Done! Cleared $count pixels to transparent."
