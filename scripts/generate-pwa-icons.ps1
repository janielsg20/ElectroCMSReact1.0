param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\public\icons')
)

Add-Type -AssemblyName System.Drawing

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

foreach ($size in 192, 512) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(109, 40, 217))

  $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $scale = $size / 512
  $graphics.FillRectangle($white, [int](142 * $scale), [int](116 * $scale), [int](80 * $scale), [int](280 * $scale))
  $graphics.FillRectangle($white, [int](142 * $scale), [int](116 * $scale), [int](228 * $scale), [int](72 * $scale))
  $graphics.FillRectangle($white, [int](142 * $scale), [int](220 * $scale), [int](196 * $scale), [int](72 * $scale))
  $graphics.FillRectangle($white, [int](142 * $scale), [int](324 * $scale), [int](228 * $scale), [int](72 * $scale))

  $path = Join-Path $resolvedOutput "electrocms-$size.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $white.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Write-Output "Iconos PWA generados en $resolvedOutput"
