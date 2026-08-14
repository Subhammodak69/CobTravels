Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\modak\.gemini\antigravity-ide\brain\574b1b7a-38bc-455b-9709-e48a8f6ce385\.user_uploaded\media_1786715237037.jpg"
$srcImg = [System.Drawing.Image]::FromFile($sourcePath)

# Copy to src/assets/logo.png
Copy-Item $sourcePath -Destination "c:\Users\modak\OneDrive\Desktop\CobTravels\src\assets\logo.png" -Force

function Resize-Image([int]$width, [int]$height, [string]$destPath) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.Clear([System.Drawing.Color]::White)
    $graph.DrawImage($srcImg, 0, 0, $width, $height)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graph.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $destPath"
}

function Resize-Image-Round([int]$width, [int]$height, [string]$destPath) {
    $bmp = New-Object System.Drawing.Bitmap $width, $height
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.Clear([System.Drawing.Color]::Transparent)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $width, $height)
    $graph.SetClip($path)
    $graph.Clear([System.Drawing.Color]::White)
    $graph.DrawImage($srcImg, 0, 0, $width, $height)
    
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $path.Dispose()
    $graph.Dispose()
    $bmp.Dispose()
    Write-Host "Generated Round: $destPath"
}

$resDir = "c:\Users\modak\OneDrive\Desktop\CobTravels\android\app\src\main\res"

Resize-Image 48 48 "$resDir\mipmap-mdpi\ic_launcher.png"
Resize-Image-Round 48 48 "$resDir\mipmap-mdpi\ic_launcher_round.png"

Resize-Image 72 72 "$resDir\mipmap-hdpi\ic_launcher.png"
Resize-Image-Round 72 72 "$resDir\mipmap-hdpi\ic_launcher_round.png"

Resize-Image 96 96 "$resDir\mipmap-xhdpi\ic_launcher.png"
Resize-Image-Round 96 96 "$resDir\mipmap-xhdpi\ic_launcher_round.png"

Resize-Image 144 144 "$resDir\mipmap-xxhdpi\ic_launcher.png"
Resize-Image-Round 144 144 "$resDir\mipmap-xxhdpi\ic_launcher_round.png"

Resize-Image 192 192 "$resDir\mipmap-xxxhdpi\ic_launcher.png"
Resize-Image-Round 192 192 "$resDir\mipmap-xxxhdpi\ic_launcher_round.png"

# Play Store 512x512 icon
Resize-Image 512 512 "c:\Users\modak\OneDrive\Desktop\CobTravels\playstore_icon_512x512.png"
Resize-Image 512 512 "$resDir\mipmap-xxxhdpi\ic_playstore.png"

$srcImg.Dispose()
Write-Host "All Android & Play Store Icons Successfully Generated!"
