@echo off
for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set branch=%%i

if /i "%branch%"=="master" (
    echo.
    echo ERROR: Pushing directly to the "master" branch is not allowed.
    echo Please create a feature branch and push your work there.
    exit /b 1
)

if /i "%branch%"=="dev" (
    echo.
    echo ERROR: Pushing directly to the "dev" branch is not allowed.
    echo Please push to a feature branch instead.
    exit /b 1
)

exit /b 0
