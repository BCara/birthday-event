# scratch/split_images.ps1
# PowerShell script to split the themes image sheet into columns and individual cells.

Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\clbbe\.gemini\antigravity\brain\87c6ee15-46db-4179-a5b4-aaaab989be0b\media__1779450193457.jpg"
$destDir = "c:\Users\clbbe\Documents\Projects\BirthdayEvent\public\images\themes"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

$img = [System.Drawing.Bitmap]::FromFile($srcPath)

$colWidths = @(205, 205, 204, 205, 205)
$colOffsets = @(0, 205, 410, 614, 819)

$rowHeight = 158
$rowOffsets = @(50, 208, 366, 524)

$themes = @("dino", "unicorn", "princess", "cars", "classic")
$colors = @(
    @("pink", "green", "blue", "orange"),      # Dino colors
    @("pink", "purple", "teal", "yellow"),     # Unicorn colors
    @("pink", "teal", "yellow", "purple"),     # Princess colors
    @("red", "blue", "yellow", "grey"),        # Cars colors
    @("red", "blue", "green", "purple")        # Classic colors
)

# 1. Save columns including header
for ($i = 0; $i -lt 5; $i++) {
    $themeName = $themes[$i]
    $x = $colOffsets[$i]
    $w = $colWidths[$i]
    $h = $img.Height
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $cropped = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.DrawImage($img, $rect, $x, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $outPath = Join-Path $destDir "column_$themeName.png"
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Saved column for $themeName to $outPath"
}

# 2. Save columns excluding header
for ($i = 0; $i -lt 5; $i++) {
    $themeName = $themes[$i]
    $x = $colOffsets[$i]
    $w = $colWidths[$i]
    $h = $img.Height - 50
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $cropped = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($cropped)
    $g.DrawImage($img, $rect, $x, 50, $w, $h, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    $outPath = Join-Path $destDir "all_$themeName.png"
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "Saved strip (no header) for $themeName to $outPath"
}

# 3. Save individual cells
for ($col = 0; $col -lt 5; $col++) {
    $themeName = $themes[$col]
    $x = $colOffsets[$col]
    $w = $colWidths[$col]
    
    for ($row = 0; $row -lt 4; $row++) {
        $colorName = $colors[$col][$row]
        $y = $rowOffsets[$row]
        $h = $rowHeight
        
        $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
        $cropped = New-Object System.Drawing.Bitmap $w, $h
        $g = [System.Drawing.Graphics]::FromImage($cropped)
        $g.DrawImage($img, $rect, $x, $y, $w, $h, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        
        $outPath = Join-Path $destDir "${themeName}_${colorName}.png"
        $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        Write-Output "Saved cell: ${themeName}_${colorName} to $outPath"
    }
}

$img.Dispose()
Write-Output "Finished splitting themes!"
