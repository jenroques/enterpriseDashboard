@ECHO OFF
SETLOCAL

SET MVNW_BASEDIR=%~dp0
SET WRAPPER_DIR=%MVNW_BASEDIR%\.mvn\wrapper
SET WRAPPER_JAR=%WRAPPER_DIR%\maven-wrapper.jar
SET WRAPPER_PROPS=%WRAPPER_DIR%\maven-wrapper.properties

IF NOT EXIST "%WRAPPER_PROPS%" (
  ECHO Missing %WRAPPER_PROPS%
  EXIT /B 1
)

IF NOT EXIST "%WRAPPER_JAR%" (
  FOR /F "tokens=1,* delims==" %%A IN (%WRAPPER_PROPS%) DO (
    IF "%%A"=="wrapperUrl" SET WRAPPER_URL=%%B
  )

  IF "%WRAPPER_URL%"=="" (
    ECHO wrapperUrl is missing in %WRAPPER_PROPS%
    EXIT /B 1
  )

  powershell -NoProfile -ExecutionPolicy Bypass -Command "New-Item -ItemType Directory -Force -Path '%WRAPPER_DIR%' | Out-Null; Invoke-WebRequest -UseBasicParsing -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
  IF ERRORLEVEL 1 EXIT /B 1
)

java -classpath "%WRAPPER_JAR%" -Dmaven.multiModuleProjectDirectory="%MVNW_BASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
EXIT /B %ERRORLEVEL%
