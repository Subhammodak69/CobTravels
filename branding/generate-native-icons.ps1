Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'branding\gantabya-mark-exact.jpg'

function Resize-Png([string]$source, [string]$destination, [int]$size) {
  $src = [System.Drawing.Image]::FromFile($source)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $size, $size)
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  $bmp.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}

$android = Join-Path $root 'android\app\src\main\res'
@{
  'mipmap-mdpi' = 48; 'mipmap-hdpi' = 72; 'mipmap-xhdpi' = 96; 'mipmap-xxhdpi' = 144; 'mipmap-xxxhdpi' = 192
}.GetEnumerator() | ForEach-Object {
  Resize-Png $sourcePath (Join-Path $android "$($_.Key)\ic_launcher.png") $_.Value
  Resize-Png $sourcePath (Join-Path $android "$($_.Key)\ic_launcher_round.png") $_.Value
}
Resize-Png $sourcePath (Join-Path $android 'mipmap-xxxhdpi\ic_playstore.png') 512
Resize-Png $sourcePath (Join-Path $root 'playstore_icon_512x512.png') 512

$ios = Join-Path $root 'ios\CobTravels\Images.xcassets\AppIcon.appiconset'
$iosSizes = @{
  'AppIcon-20@2x.png' = 40; 'AppIcon-20@3x.png' = 60;
  'AppIcon-29@2x.png' = 58; 'AppIcon-29@3x.png' = 87;
  'AppIcon-40@2x.png' = 80; 'AppIcon-40@3x.png' = 120;
  'AppIcon-60@2x.png' = 120; 'AppIcon-60@3x.png' = 180;
  'AppIcon-1024.png' = 1024
}
$iosSizes.GetEnumerator() | ForEach-Object { Resize-Png $sourcePath (Join-Path $ios $_.Key) $_.Value }

@(
  'C:\Users\modak\OneDrive\Desktop\CobTravelsWeb\public\logo192.png',
  'C:\Users\modak\OneDrive\Desktop\CobTravelsAdmin\public\logo192.png'
) | ForEach-Object { Resize-Png $sourcePath $_ 192 }
@(
  'C:\Users\modak\OneDrive\Desktop\CobTravelsWeb\public\logo512.png',
  'C:\Users\modak\OneDrive\Desktop\CobTravelsAdmin\public\logo512.png'
) | ForEach-Object { Resize-Png $sourcePath $_ 512 }
