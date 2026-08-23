# Quick Deployment Script for NeuroTwin Android App
$adb = "C:\Users\Farhan\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$apk = "$PSScriptRoot\mobile\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "Checking connected devices..." -ForegroundColor Cyan
& $adb devices

Write-Host "Installing APK to connected device..." -ForegroundColor Green
& $adb -s R9ZT204J3MD install -r $apk

Write-Host "Launching NeuroTwin App..." -ForegroundColor Green
& $adb -s R9ZT204J3MD shell am start -n com.neurotwin.app/.MainActivity

Write-Host "Done! App is running on device." -ForegroundColor Green
