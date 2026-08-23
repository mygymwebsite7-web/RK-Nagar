# TVK Complaint Box – Image Setup Script
# =========================================
# Run this script to copy your 4 images into the correct location.
# Place your 4 images in the same folder as this script, then run:
#   powershell -ExecutionPolicy Bypass -File setup-images.ps1

$imgDir = Join-Path $PSScriptRoot "public\assets\images"
New-Item -ItemType Directory -Path $imgDir -Force | Out-Null

Write-Host ""
Write-Host "TVK Complaint Box – Image Setup" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Red
Write-Host ""
Write-Host "Please make sure you have placed your 4 images in the script folder:" -ForegroundColor Cyan
Write-Host "  Image 1 (TVK Logo/Flag image)   → name it: img1.png" -ForegroundColor White
Write-Host "  Image 2 (Elderly leader, left)  → name it: img2.jpg" -ForegroundColor White
Write-Host "  Image 3 (Man with TVK scarf, right) → name it: img3.jpg" -ForegroundColor White
Write-Host "  Image 4 (Center visual)         → name it: img4.png" -ForegroundColor White
Write-Host ""

$files = @(
  @{ name="img1.png"; desc="TVK Logo/Flag" },
  @{ name="img2.jpg"; desc="Leader (left corner)" },
  @{ name="img3.jpg"; desc="Worker (right corner)" },
  @{ name="img4.png"; desc="Center visual" }
)

foreach ($f in $files) {
  $src = Join-Path $PSScriptRoot $f.name
  $dst = Join-Path $imgDir $f.name
  if (Test-Path $src) {
    Copy-Item $src $dst -Force
    Write-Host "  ✅ Copied $($f.name) → $($f.desc)" -ForegroundColor Green
  } else {
    Write-Host "  ❌ Missing: $($f.name) ($($f.desc))" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Done! Open public/index.html in your browser to view the website." -ForegroundColor Yellow
Write-Host ""
