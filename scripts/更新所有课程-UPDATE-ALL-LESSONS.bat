@echo off
REM ════════════════════════════════════════════════════════════════
REM  SciSpark · 一键把最新「门面」刷到全部课程
REM  Double-click this file to update the facade of every lesson.
REM ════════════════════════════════════════════════════════════════
cd /d "%~dp0\.."
echo.
echo  Step 1 / 2  —  PREVIEW (dry run, nothing is written yet)
echo  ------------------------------------------------------------
node scripts\build-lessons.mjs check
echo.
set /p GO="  Apply these changes to all lessons? (y/N): "
if /i not "%GO%"=="y" (
  echo.
  echo  Cancelled. No files changed.
  pause
  exit /b 0
)
echo.
echo  Step 2 / 2  —  APPLYING ...
echo  ------------------------------------------------------------
node scripts\build-lessons.mjs sync
echo.
echo  Done. Review the changes in your editor / git before pushing.
pause
